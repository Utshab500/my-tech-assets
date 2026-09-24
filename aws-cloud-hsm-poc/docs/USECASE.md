# CloudHSM Backup & Restore POC — Step-by-Step Guide

## Overview

The simplest end-to-end use case is:
1. Deploy the cluster via Terraform
2. Initialize the cluster (one-time manual step — mandatory)
3. Create a Crypto User and a key
4. Verify the key exists (`key list`)
5. Understand the backup model — backups are automatic-only and must post-date the key
6. Simulate a failure by deleting the HSMs (this also triggers the backup that captures the key)
7. Restore by adding an HSM back (or creating a new cluster from the backup)
8. Verify the key survived the restore

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

Run from your local machine:

```bash
INSTANCE_ID=$(terraform output -raw ec2_client_instance_id)

# base64-encode the cert (single line, no wrapping)
CERT_B64=$(base64 -i ca.crt)          # macOS
# CERT_B64=$(base64 -w0 ca.crt)       # Linux

aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "Upload CA cert" \
  --parameters "{\"commands\":[\"echo $CERT_B64 | base64 -d > /tmp/ca.crt && sudo cp /tmp/ca.crt /opt/cloudhsm/etc/customerCA.crt\"]}" \
  --query 'Command.CommandId' --output text

# Verify (replace <command-id> with output above)
aws ssm get-command-invocation \
  --command-id <command-id> \
  --instance-id "$INSTANCE_ID" \
  --query '{Status:Status,Error:StandardErrorContent}' --output json
```

> The CloudHSM CLI reads the trust anchor from `/opt/cloudhsm/etc/customerCA.crt`.
> Without this file, all `cloudhsm-cli` commands fail with a config error.

### 3.4 — Verify connectivity

```bash
/opt/cloudhsm/bin/cloudhsm-cli cluster hsm-info
```

---

## Phase 4 — Create Crypto Officer and a Test Key

### 4.1 — Activate the cluster and log in as admin

```bash
/opt/cloudhsm/bin/cloudhsm-cli interactive
```

**First-time only** — activate the cluster to set the initial admin password:
```
cluster activate
```

You will be prompted to set a password. After activation, log in:
```
login --username admin --role admin
```

> `cluster activate` must run before any login attempt. Skipping it causes
> "Incorrect authentication credentials" even with the right password.

### 4.2 — Create a Crypto User

Admin can manage users but cannot perform cryptographic operations. Create a Crypto User (CU) for key operations:

```
user create --username poc_user --role crypto-user
```

Then switch to that user:

```
logout
login --username poc_user --role crypto-user
```

### 4.3 — Create a symmetric AES-256 key

```
key generate-symmetric aes \
  --key-length-bytes 32 \
  --label "poc-aes-key"
```

Note the **key handle** and label printed. You'll confirm this same key reappears after the restore.

### 4.4 — Verify the key exists

```
key list
```

Note the key handle printed next to `poc-aes-key` — after restore you will run `key list` again and confirm the same key is still present. That is the proof of a successful backup and restore.

---

## Phase 5 — Understand the Backup Model

### Backups are automatic-only

There is **no manual backup trigger** — not in the AWS CLI (`create-backup` was removed)
and not in the AWS Console (the Backups tab has no "Create backup" button). AWS creates
backups automatically:

- **Every 24 hours** on a schedule
- **When an HSM is added** to the cluster
- **When an HSM is deleted** from the cluster
- **When the cluster is deleted** (a final snapshot)

Each backup contains all HSM keys, users, and cluster configuration — as they existed
**at the moment the snapshot was taken**.

### ⚠️ Critical distinction — a backup only contains keys that existed when it was taken

This is the single most important thing to understand for this POC:

```
Timeline of THIS cluster:

  14:40  HSM-1 added   → backup-pq4iqnhzrdq   ✗ no key yet
  14:54  HSM-2 added   → backup-dn4bwowtkd6   ✗ no key yet
  ~15:0x  poc-aes-key created                  ← key exists only AFTER this point
```

Both existing backups were triggered by the HSM-add events, which happened **before**
you generated `poc-aes-key`. **Neither of them contains your key.** Restoring from
either would give you a cluster with no `poc-aes-key`.

To get the key into a backup, you need a **new** automatic backup taken *after* key
creation. Since there is no manual trigger, the practical way to force one is to
**delete an HSM** — which is exactly what Phase 6 does. That deletion snapshots the
current cluster state (including your key) before removing the HSM.

### 5.1 — Confirm the existing backups pre-date your key

```bash
CLUSTER_ID=$(terraform output -raw cluster_id)

aws cloudhsmv2 describe-backups \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Backups[*].{ID:BackupId,State:BackupState,Created:CreateTimestamp}' \
  --output table
```

Compare the newest `Created` timestamp against when you created the key. If all backups
pre-date the key, proceed to Phase 6 to produce a fresh one.

---

## Steps we perform next (this POC run)

1. **Phase 6** — delete both HSMs one at a time. Each deletion triggers an automatic
   backup; the snapshots capture `poc-aes-key`. With no HSMs left, the cluster keeps its
   `ACTIVE` state (for `hsm2m.medium`) but has an empty HSM list.
2. **Phase 6.2** — confirm a new backup appeared with a timestamp *after* key creation.
   That is our valid restore point.
3. **Phase 7 (Option A)** — add one HSM back to the same cluster. Because no live HSM
   remains to clone from, the new HSM is seeded from the **latest backup** — restoring
   `poc-aes-key`. ([why it uses the last backup](./hsm-cluster-sync-internals.md))
4. **Phase 8** — `key list` shows `poc-aes-key` is back. POC complete.

---

## Phase 6 — Simulate a Failure (and capture a backup that contains the key)

### 6.1 — Delete both HSMs

List the HSM IDs currently in the cluster:
```bash
aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].Hsms[*].HsmId' --output text
```

Delete them one at a time. **Each deletion triggers an automatic backup snapshot first**,
so the key is captured before the HSM goes away:
```bash
aws cloudhsmv2 delete-hsm --cluster-id $CLUSTER_ID --hsm-id <hsm-id-1>
aws cloudhsmv2 delete-hsm --cluster-id $CLUSTER_ID --hsm-id <hsm-id-2>
```

Confirm no HSMs remain in the cluster:
```bash
aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].{State:State,HSMs:Hsms[*].HsmId}' --output json
```

> **Note on cluster state:** For `hsm2m.medium`, the cluster stays `ACTIVE` even with
> zero HSMs (once activated, it does not revert). This differs from the older
> `hsm1.medium`, which moved to `UNINITIALIZED`. What matters for the restore is that
> the HSM list is now **empty** — no live HSM remains to clone from, so the next HSM
> you add will be seeded from the latest backup.

### 6.2 — Confirm a fresh backup exists (contains the key)

```bash
aws cloudhsmv2 describe-backups \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Backups[*].{ID:BackupId,State:BackupState,Created:CreateTimestamp}' \
  --output table
```

You should now see a **new** backup with a timestamp *after* you created the key. That is
your valid restore point. Note its ID:
```bash
BACKUP_ID=$(aws cloudhsmv2 describe-backups \
  --filters clusterIds=$CLUSTER_ID \
  --query 'sort_by(Backups[?BackupState==`READY`], &CreateTimestamp)[-1].BackupId' \
  --output text)

echo "Restore point: $BACKUP_ID"
```

---

## Phase 7 — Restore from Backup

### Option A — Add an HSM back to the existing cluster (fastest)

The cluster is already `ACTIVE` with an empty HSM list (for `hsm2m.medium` it stayed
`ACTIVE` after both HSMs were deleted), and it still holds the backup key material. Add an HSM:
```bash
aws cloudhsmv2 create-hsm \
  --cluster-id $CLUSTER_ID \
  --availability-zone us-east-1a
```

Because **no live HSM remains to clone from**, the new HSM is seeded from the cluster's
**latest backup** — the one you captured in Phase 6 that contains `poc-aes-key`.
→ [Why it uses the last backup — read the internals.](./hsm-cluster-sync-internals.md)

The cluster state is already `ACTIVE`, so that is not the signal to watch. Instead, wait
for the **new HSM** to reach `ACTIVE` (~5 min):
```bash
aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$CLUSTER_ID \
  --query 'Clusters[0].Hsms[*].{Id:HsmId,State:State,Ip:EniIp}' --output table
```

> **Add a second HSM before running key operations.** The key restores onto the first HSM,
> but the availability check (see [Phase 4.2 note](#phase-4--create-crypto-officer-and-a-test-key))
> requires the key to exist on at least 2 HSMs — otherwise even `key list` fails with
> *"key must be available on at least 2 HSMs"*. Add a second HSM and the key replicates to it:
> ```bash
> aws cloudhsmv2 create-hsm --cluster-id $CLUSTER_ID --availability-zone us-east-1a
> ```

#### Option A via Terraform — the real DR flow (no import needed)

If the HSMs are managed by Terraform (as in this POC), you do **not** use the CLI or
`terraform import` to recover. When an HSM is lost out-of-band, `terraform apply` is your
restore button:

1. The HSMs are gone in AWS but Terraform's `main.tf` still declares them, so on the next
   run Terraform **refreshes state, detects them missing, and plans to recreate them**.
2. `terraform apply` creates fresh HSMs on the cluster. Because the cluster is empty, each
   new HSM is **seeded from the latest backup** — restoring `poc-aes-key`.

```bash
# After an out-of-band HSM loss (e.g. hardware failure or manual deletion)
terraform plan     # shows "N to add" for the missing HSMs — no import required
terraform apply    # recreates them; key is restored from the latest backup
```

> **⚠️ CloudHSM deletion is asynchronous — wait before trusting `plan`.** Right after a
> `delete-hsm`, the HSM lingers in a deleting state and still shows up in
> `describe-clusters`. If you run `terraform plan` in that window it refreshes the HSM as
> *present* and reports **"No changes"**. Wait until `Clusters[0].Hsms` is empty (or the
> HSM disappears) before running `plan`/`apply`, or the drift won't be detected yet.

> **When *is* `terraform import` needed?** Only when a replacement HSM was created
> **outside Terraform** (e.g. via `aws cloudhsmv2 create-hsm`) and you want Terraform to
> adopt that specific existing HSM. Import is for adopting orphaned resources — not for
> disaster recovery. In a clean Terraform workflow, `apply` alone recovers.

### Option B — Restore to a brand-new cluster (full DR scenario)

Option B creates an **independent new cluster** and leaves the old one untouched — you end
up with two clusters. The backup is a standalone resource, so this works **even if you
delete the old cluster first**. If you don't need the old cluster, delete it before
restoring to avoid paying for two:

```bash
# Optional — remove the stale cluster first (backups survive deletion)
aws cloudhsmv2 delete-hsm --cluster-id $CLUSTER_ID --hsm-id <hsm-id>   # if any HSMs remain
aws cloudhsmv2 delete-cluster --cluster-id $CLUSTER_ID

# Confirm the backup is still READY after deletion
aws cloudhsmv2 describe-backups \
  --query 'Backups[?BackupState==`READY`].{ID:BackupId,Created:CreateTimestamp}' \
  --output table
```

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

Point `RESTORE_CLUSTER_ID` at the cluster you restored into:
- **Option A** — the same cluster: `RESTORE_CLUSTER_ID=$CLUSTER_ID`
- **Option B** — the new cluster's ID (from `terraform output` or `describe-clusters`)

```bash
RESTORE_CLUSTER_ID=$CLUSTER_ID   # Option A; for Option B use the new cluster id

NEW_HSM_IP=$(aws cloudhsmv2 describe-clusters \
  --filters clusterIds=$RESTORE_CLUSTER_ID \
  --query 'Clusters[0].Hsms[0].EniIp' \
  --output text)

# Run inside the SSM session on the EC2
sudo /opt/cloudhsm/bin/configure-cli -a $NEW_HSM_IP
```

### 7.2 — Verify key is restored

```bash
/opt/cloudhsm/bin/cloudhsm-cli interactive
login --username poc_user --role crypto-user
key list
```

You should see `poc-aes-key` with the same label. The key was restored from the backup.

---

## Phase 8 — Confirm Round-Trip

Inside the CloudHSM CLI (logged in as `poc_user`):

```
login --username poc_user --role crypto-user
key list
```

You should see `poc-aes-key` with the same label. The key survived the backup and restore — the POC is complete.

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
login --username admin --role admin              # authenticate

key generate-symmetric aes --key-length-bytes 32 --label "my-key"
key list                                         # list all keys
key delete --filter attr.label=my-key            # delete a key

cluster hsm-info                                 # show cluster + HSM status
quit                                             # exit interactive shell
```
