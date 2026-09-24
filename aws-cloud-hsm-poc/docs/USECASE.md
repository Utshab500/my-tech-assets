# CloudHSM Backup & Restore POC — Step-by-Step Guide

## Overview

The simplest end-to-end use case is:
1. Deploy the cluster via Terraform
2. Initialize the cluster (one-time manual step — mandatory)
3. Create a Crypto Officer (CO) user and a key
4. Encrypt a test string with that key
5. Trigger a backup
6. Simulate a failure by deleting the HSM
7. Restore by creating a new cluster from the backup
8. Verify the key and decrypt the string

---

## Phase 1 — Deploy with Terraform

```bash
cd aws-cloud-hsm-poc
terraform init
terraform apply
```

**Note the outputs** — you'll need:
- `cluster_id`
- `hsm_eni_ip`
- `ec2_client_instance_id`
- `ssm_connect_command`

> CloudHSM takes ~10 minutes to provision an HSM. The cluster state will move:
> `CREATE_IN_PROGRESS` → `UNINITIALIZED` → ready after you complete Phase 2.

---

## Phase 2 — Initialize the Cluster (One-Time, Manual)

This is required before any HSM can be used. AWS requires you to sign a certificate
to prove you own the cluster. Do this from your **local machine** (not the EC2).

### 2.1 — Download the cluster CSR

```bash
CLUSTER_ID=$(terraform output -raw cluster_id)

aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].Certificates.ClusterCsr' \
  --output text > cluster.csr
```

### 2.2 — Create a self-signed CA (for POC only)

```bash
# Generate CA private key
openssl genrsa -out ca.key 2048

# Self-sign the CA certificate (valid 10 years for POC)
openssl req -new -x509 -days 3652 -key ca.key -out ca.crt \
  -subj "/CN=CloudHSM-POC-CA"

# Sign the cluster CSR with your CA
openssl x509 -req -days 3652 \
  -in cluster.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out cluster.crt
```

### 2.3 — Upload the signed certificate to AWS

```bash
aws cloudhsmv2 initialize-cluster \
  --cluster-id $CLUSTER_ID \
  --signed-cert file://cluster.crt \
  --trust-anchor file://ca.crt
```

Wait for state `INITIALIZED`:
```bash
aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].State'
```

---

## Phase 3 — Connect to the EC2 Client and Configure HSM

### 3.1 — Open an SSM session

```bash
# From your local machine
$(terraform output -raw ssm_connect_command)
```

### 3.2 — Configure the CloudHSM client with the HSM IP

```bash
HSM_IP="<paste hsm_eni_ip from terraform output>"

sudo /opt/cloudhsm/bin/configure-cli -a $HSM_IP
```

### 3.3 — Copy the CA certificate to the EC2

> **Note:** Do NOT use `--parameters commands=[...]` — the square brackets trigger
> zsh glob expansion and fail with "no matches found". Use a JSON string instead.

```bash
INSTANCE_ID=$(terraform output -raw ec2_client_instance_id)

# base64-encode the cert (single line, no wrapping)
CERT_B64=$(base64 -i ca.crt)          # macOS
# CERT_B64=$(base64 -w0 ca.crt)       # Linux

aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "Upload CA cert" \
  --parameters "{\"commands\":[\"echo $CERT_B64 | base64 -d > /tmp/ca.crt\"]}" \
  --query 'Command.CommandId' --output text

# Verify it landed on the EC2 (replace <command-id> with output above)
aws ssm get-command-invocation \
  --command-id <command-id> \
  --instance-id "$INSTANCE_ID" \
  --query '{Status:Status,Error:StandardErrorContent}' --output json
```

### 3.4 — Verify connectivity

```bash
/opt/cloudhsm/bin/cloudhsm-cli cluster info
```

---

## Phase 4 — Create Crypto Officer and a Test Key

### 4.1 — Log in as admin and set the CO password

First-time login uses the built-in admin (PRECO role):
```bash
/opt/cloudhsm/bin/cloudhsm-cli interactive

# Inside the CLI:
login --username admin --role preco
```

When prompted, set the admin password. After setting it, the role changes to CO (Crypto Officer).

### 4.2 — Create a symmetric AES-256 key

```bash
# Still inside cloudhsm-cli interactive
key generate-symmetric aes \
  --key-size-in-bits 256 \
  --label "poc-aes-key" \
  --token true \
  --session false
```

Note the **key handle** printed (e.g., `7`). Save it — you'll reference it for encrypt/decrypt.

### 4.3 — Encrypt a test string

```bash
# From the EC2 shell (not inside cloudhsm-cli)
echo -n "Hello CloudHSM POC" | base64 > /tmp/plaintext.b64

/opt/cloudhsm/bin/cloudhsm-cli key wrap aes-gcm \
  --wrapping-key-filter attr.label=poc-aes-key \
  --key-to-wrap /tmp/plaintext.b64 \
  --output /tmp/ciphertext.bin
```

> For a simpler test, you can use the PKCS#11 sample tools or OpenSSL with the
> PKCS#11 engine. The above wrapping command is the native CloudHSM CLI approach.

---

## Phase 5 — Backup Process

### How backups work in CloudHSM

AWS CloudHSM takes **automatic daily backups** of the cluster. Each backup contains:
- All HSM keys (encrypted using the cluster's own internal key)
- Cluster configuration and users

You can also trigger a **manual backup** at any time.

### 5.1 — Trigger a manual backup

```bash
CLUSTER_ID=$(terraform output -raw cluster_id)

aws cloudhsmv2 create-backup \
  --cluster-id $CLUSTER_ID \
  --region us-east-1

# Wait for backup to complete (~5 min)
aws cloudhsmv2 describe-backups \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Backups[*].{ID:BackupId,State:BackupState,Created:CreateTimestamp}' \
  --output table
```

### 5.2 — Note the Backup ID

```bash
BACKUP_ID=$(aws cloudhsmv2 describe-backups \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Backups[?BackupState==`READY`] | [0].BackupId' \
  --output text)

echo "Backup ID: $BACKUP_ID"
```

---

## Phase 6 — Simulate a Failure

Delete the HSM instance (cluster persists, HSM is gone):
```bash
HSM_ID=$(terraform output -raw hsm_id)

aws cloudhsmv2 delete-hsm \
  --cluster-id $CLUSTER_ID \
  --hsm-id $HSM_ID
```

Verify cluster state moves to `DEGRADED` then `UNINITIALIZED`:
```bash
aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].State'
```

---

## Phase 7 — Restore from Backup

### Option A — Add a new HSM to the existing cluster (fastest)

The existing cluster already has the backup key material. Simply add a new HSM:
```bash
aws cloudhsmv2 create-hsm \
  --cluster-id $CLUSTER_ID \
  --availability-zone us-east-1a
```

The new HSM will be automatically initialized from the cluster's last backup state.
→ [Why does it always use the last backup? Read the internals.](./hsm-cluster-sync-internals.md)

Wait for state `ACTIVE`, then verify your key is still present:
```bash
/opt/cloudhsm/bin/cloudhsm-cli key list
```

### Option B — Restore to a brand-new cluster (full DR scenario)

In Terraform, update `main.tf` to create a restore cluster using `source_backup_identifier`:

```hcl
resource "aws_cloudhsm_v2_cluster" "restored" {
  hsm_type                 = "hsm2m.medium"
  mode                     = "NON_FIPS"
  subnet_ids               = [aws_subnet.private.id]
  source_backup_identifier = "<BACKUP_ID>"   # from Phase 5.2

  tags = { Name = "${var.project_name}-restored-cluster" }
}

resource "aws_cloudhsm_v2_hsm" "restored_primary" {
  cluster_id = aws_cloudhsm_v2_cluster.restored.cluster_id
  subnet_id  = aws_subnet.private.id
}
```

Run:
```bash
terraform apply -target=aws_cloudhsm_v2_cluster.restored \
               -target=aws_cloudhsm_v2_hsm.restored_primary
```

> A cluster restored from backup does **not** require re-initialization — it's
> already trusted because it was signed with your CA. You only need to reconfigure
> the CloudHSM client with the new HSM's IP address.

### 7.1 — Update client config with new HSM IP

```bash
NEW_HSM_IP=$(aws cloudhsmv2 describe-clusters \
  --filters clusterIds=<new-cluster-id> \
  --query 'Clusters[0].Hsms[0].EniIp' \
  --output text)

sudo /opt/cloudhsm/bin/configure-cli -a $NEW_HSM_IP
```

### 7.2 — Verify key is restored

```bash
/opt/cloudhsm/bin/cloudhsm-cli interactive
login --username admin --role co
key list
```

You should see `poc-aes-key` with the same handle. The data is restored.

---

## Phase 8 — Decrypt to Confirm Round-Trip

```bash
/opt/cloudhsm/bin/cloudhsm-cli key unwrap aes-gcm \
  --wrapping-key-filter attr.label=poc-aes-key \
  --wrapped-key /tmp/ciphertext.bin \
  --output /tmp/recovered.b64

base64 -d /tmp/recovered.b64
# Expected output: Hello CloudHSM POC
```

---

## Cleanup

```bash
# Delete HSM first (must be done before deleting cluster)
aws cloudhsmv2 delete-hsm --cluster-id $CLUSTER_ID --hsm-id $HSM_ID

# Then destroy all Terraform resources
terraform destroy
```

> Backups persist for 90 days by default even after cluster deletion. Delete them
> manually if needed to avoid ongoing storage costs:
> `aws cloudhsmv2 delete-backup --backup-id $BACKUP_ID`

---

## Cost Estimate (POC)

| Resource         | Cost (approx.)       |
|------------------|----------------------|
| HSM instance     | ~$1.60/hr per HSM    |
| EC2 t3.micro     | ~$0.01/hr            |
| Backup storage   | ~$0.15/GB-month      |

**Estimated for a 1-day POC: ~$40**. Delete resources promptly after testing.

---

## Quick Reference — CloudHSM CLI Cheat Sheet

```bash
# All commands run on EC2 client
cloudhsm-cli interactive                        # enter interactive shell
login --username admin --role co                 # authenticate

key generate-symmetric aes --key-size-in-bits 256 --label "my-key" --token true
key list                                         # list all keys
key delete --filter attr.label=my-key            # delete a key

cluster info                                     # show cluster + HSM status
quit                                             # exit interactive shell
```
