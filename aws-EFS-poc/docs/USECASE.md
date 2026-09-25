# EFS Backup & Restore POC — Step-by-Step Guide

## Overview

The simplest end-to-end use case is:
1. Deploy the ECS (Fargate) cluster + EFS via Terraform
2. Confirm the nginx task is running with EFS mounted at `/mnt/data`
3. Write a test file into `/mnt/data` (the data we want to protect)
4. Understand the backup model — AWS Backup takes point-in-time recovery points of the EFS
5. Take an **on-demand backup** that captures the test file
6. Simulate a failure by deleting the file from EFS
7. Restore from the recovery point
8. Verify the file came back — POC complete

This POC uses **Fargate** (no EC2 to manage). The nginx container mounts the EFS
directly through the task definition. We shell into the running container with
**ECS Exec** to write and read files — no SSH, no bastion.

---

## Phase 1 — Deploy with Terraform

```bash
cd aws-EFS-poc
terraform init
terraform apply
```

**Note the outputs** — you'll need:
- `efs_id`
- `efs_arn`
- `ecs_cluster_name`
- `ecs_service_name`
- `backup_vault_name`
- `backup_role_arn`
- `list_tasks_command`

> Provisioning is quick (~2–3 min). The EFS mount targets and the Fargate task come
> up together; the service waits on the mount targets before starting the task.

**Prerequisites on your local machine:**
- AWS CLI configured with credentials for the target account
- The [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)
  (required for ECS Exec in Phase 3)

---

## Phase 2 — Confirm the Task Is Running with EFS Mounted

### 2.1 — Find the running task

```bash
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --query 'taskArns[0]' --output text)

echo "Task: $TASK_ARN"
```

Wait until the task is `RUNNING`:
```bash
aws ecs describe-tasks \
  --cluster $CLUSTER \
  --tasks $TASK_ARN \
  --query 'tasks[0].lastStatus' --output text
```

> If `taskArns` is empty, the task is still starting (image pull + mount). Wait a
> minute and re-run 2.1.

> **First task may fail once with an EFS DNS error — this is expected and self-heals.**
> On a cold start the mount target's DNS name (`fs-xxxx.efs.<region>.amazonaws.com`) can
> take a moment to propagate, so the very first task sometimes stops with
> `ResourceInitializationError: ... Failed to resolve "fs-xxxx.efs..."`. ECS immediately
> launches a replacement, which mounts cleanly. Just wait for a `RUNNING` task — no fix
> needed.

### 2.2 — Shell into the container and confirm the mount

```bash
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ARN \
  --container nginx \
  --interactive \
  --command "/bin/sh"
```

Inside the container:
```sh
# EFS should appear as an NFS4 mount on /mnt/data
mount | grep /mnt/data
df -h /mnt/data
```

You should see an NFS mount backed by the EFS. Keep this shell open for Phase 3.

> **ECS Exec not connecting?** The task must be running with `enable_execute_command`
> (it is, via Terraform). If you enabled it after the task started, force a new
> deployment: `aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment`.

---

## Phase 3 — Write Test Data to EFS

Inside the container shell (from Phase 2.2):

```sh
echo "efs poc - do not lose me - $(date -u)" > /mnt/data/hello.txt
cat /mnt/data/hello.txt
ls -l /mnt/data
```

Note the contents of `hello.txt` — you'll confirm this exact file reappears after the
restore. This file lives on the EFS root (`/`), which is what AWS Backup snapshots.

Exit the shell:
```sh
exit
```

---

## Phase 4 — Understand the Backup Model

### EFS is protected by AWS Backup, not by EFS itself

EFS has no built-in "snapshot" button. Durable, restorable copies come from **AWS
Backup**, which takes **recovery points** of the whole file system into a **backup
vault**. Terraform already created:

- A **backup vault** (`backup_vault_name`) — where recovery points are stored
- An **IAM role** (`backup_role_arn`) — the permissions AWS Backup assumes to read the
  EFS and to write it back during a restore
- A **daily backup plan** — the production/managed path (runs at 03:00 UTC)

### ⚠️ A recovery point only contains data that existed when it was taken

Same rule as any snapshot system: a backup captures the file system **at the moment the
job runs**. The scheduled daily plan may not have fired yet, and even if it has, it
pre-dates the `hello.txt` you just wrote. To capture `hello.txt` you take an **on-demand
backup now** (Phase 5) — you don't wait for the 03:00 schedule.

---

## Phase 5 — Take an On-Demand Backup (contains the file)

```bash
EFS_ARN=$(terraform output -raw efs_arn)
VAULT=$(terraform output -raw backup_vault_name)
BACKUP_ROLE=$(terraform output -raw backup_role_arn)

JOB_ID=$(aws backup start-backup-job \
  --backup-vault-name $VAULT \
  --resource-arn $EFS_ARN \
  --iam-role-arn $BACKUP_ROLE \
  --query 'BackupJobId' --output text)

echo "Backup job: $JOB_ID"
```

Wait for the job to reach `COMPLETED` (an EFS backup of a nearly-empty file system
typically takes a few minutes):
```bash
aws backup describe-backup-job \
  --backup-job-id $JOB_ID \
  --query '{State:State,Pct:PercentDone}' --output table
```

### 5.1 — Grab the recovery point ARN (your restore point)

```bash
RECOVERY_POINT_ARN=$(aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name $VAULT \
  --query 'sort_by(RecoveryPoints[?Status==`COMPLETED`], &CompletionDate)[-1].RecoveryPointArn' \
  --output text)

echo "Restore point: $RECOVERY_POINT_ARN"
```

---

## Phase 6 — Simulate a Failure (delete the data)

Shell back into the container and delete the file:

```bash
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE \
  --query 'taskArns[0]' --output text)

aws ecs execute-command \
  --cluster $CLUSTER --task $TASK_ARN --container nginx \
  --interactive --command "/bin/sh"
```

Inside the container:
```sh
rm -f /mnt/data/hello.txt
ls -l /mnt/data          # hello.txt is gone
exit
```

The data is now lost from the live file system. The recovery point in the vault still
has it.

---

## Phase 7 — Restore from Backup

### Option A — Restore into the **same** file system (fastest)

AWS Backup restores the recovered items into a **new directory** named
`aws-backup-restore_<timestamp>` at the root of the target EFS — it never overwrites
live data in place. So `hello.txt` comes back under that directory, and you copy it to
its original location.

**Console (simplest):**
1. AWS Backup → **Backup vaults** → your vault → click the recovery point.
2. **Actions → Restore.**
3. **Restore location:** *Restore to an existing file system* → select your EFS
   (`efs_id`).
4. Set **Restore role** to the POC backup role, leave items as the full file system,
   click **Restore backup**.

**CLI equivalent:**
```bash
EFS_ID=$(terraform output -raw efs_id)

aws backup start-restore-job \
  --recovery-point-arn "$RECOVERY_POINT_ARN" \
  --iam-role-arn "$BACKUP_ROLE" \
  --resource-type EFS \
  --metadata "{
    \"file-system-id\": \"$EFS_ID\",
    \"newFileSystem\": \"false\",
    \"Encrypted\": \"false\",
    \"PerformanceMode\": \"generalPurpose\",
    \"CreationToken\": \"efs-poc-restore\",
    \"ItemsToRestore\": \"[\\\"/\\\"]\"
  }" \
  --query 'RestoreJobId' --output text
```

Wait for the restore job to finish:
```bash
aws backup list-restore-jobs \
  --query 'sort_by(RestoreJobs, &CreationDate)[-1].{State:Status,Pct:PercentDone}' \
  --output table
```

> **Why is this a CLI/console step and not `terraform apply`?** A restore is a one-time
> *action*, not steady-state infrastructure — the AWS provider has no
> `aws_backup_restore_job` resource, and `aws_efs_file_system` has no "restore from
> backup" argument. See [Why EFS Restore Isn't Native to Terraform](./RESTORE-VIA-TERRAFORM.md)
> for the full reasoning and the `null_resource` / restore-testing-plan alternatives.

### Option B — Restore to a **brand-new** file system (full DR scenario)

Leaves the original EFS untouched and creates an independent new EFS from the recovery
point. Use this when the original file system is gone or corrupt. In the console pick
*Create a new file system*; in the CLI set `"newFileSystem": "true"` and drop
`file-system-id`. Afterward, point the ECS task's `efs_volume_configuration.file_system_id`
at the new EFS ID and `terraform apply` to remount.

---

## Phase 8 — Confirm Round-Trip

Shell into the container and find the restored file:

```bash
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE \
  --query 'taskArns[0]' --output text)

aws ecs execute-command \
  --cluster $CLUSTER --task $TASK_ARN --container nginx \
  --interactive --command "/bin/sh"
```

Inside the container:
```sh
# The restore landed in a timestamped directory at the EFS root
ls -l /mnt/data
find /mnt/data -name hello.txt

# Copy it back to the original path
cp /mnt/data/aws-backup-restore_*/hello.txt /mnt/data/hello.txt
cat /mnt/data/hello.txt
```

You should see the exact contents you wrote in Phase 3. The file survived the delete and
was recovered from the backup — the POC is complete.

---

## Cleanup

```bash
terraform destroy
```

> `terraform destroy` removes the ECS service, EFS, VPC, and the backup vault. A vault
> **cannot be deleted while it still holds recovery points**, so delete them first:
> ```bash
> VAULT=$(terraform output -raw backup_vault_name)
> for RP in $(aws backup list-recovery-points-by-backup-vault \
>       --backup-vault-name $VAULT \
>       --query 'RecoveryPoints[].RecoveryPointArn' --output text); do
>   aws backup delete-recovery-point --backup-vault-name $VAULT --recovery-point-arn $RP
> done
> ```
> Then re-run `terraform destroy`. Any EFS created by an **Option B** restore is not
> managed by Terraform — delete it manually.

---

## Cost Estimate (POC)

| Resource                 | Cost (approx.)              |
|--------------------------|-----------------------------|
| Fargate task (0.25 vCPU) | ~$0.012/hr                  |
| EFS storage              | ~$0.30/GB-month (near $0 here) |
| AWS Backup storage       | ~$0.05/GB-month             |
| VPC / IGW                | free (no NAT gateway)       |

**Estimated for a 1-day POC: well under $1.** Delete resources promptly after testing.

---

## Quick Reference — Cheat Sheet

```bash
# Terraform outputs
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)
EFS_ARN=$(terraform output -raw efs_arn)
EFS_ID=$(terraform output -raw efs_id)
VAULT=$(terraform output -raw backup_vault_name)
BACKUP_ROLE=$(terraform output -raw backup_role_arn)

# Find + shell into the task
TASK_ARN=$(aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --query 'taskArns[0]' --output text)
aws ecs execute-command --cluster $CLUSTER --task $TASK_ARN --container nginx --interactive --command "/bin/sh"

# On-demand backup
aws backup start-backup-job --backup-vault-name $VAULT --resource-arn $EFS_ARN --iam-role-arn $BACKUP_ROLE

# List recovery points
aws backup list-recovery-points-by-backup-vault --backup-vault-name $VAULT \
  --query 'RecoveryPoints[].{ARN:RecoveryPointArn,Status:Status,Created:CompletionDate}' --output table
```
