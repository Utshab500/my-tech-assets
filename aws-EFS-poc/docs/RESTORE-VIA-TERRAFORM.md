# Why EFS Restore Isn't Native to Terraform

You can deploy the EFS, the backup vault, the plan, and even the backup *selection* in
Terraform — all of that is steady-state infrastructure. But when you try to express the
**restore** in HCL, you hit a wall. This doc explains why, and what to do instead.

---

## The core reason: a restore is an *event*, not a *resource*

Terraform is declarative. You describe the desired end state, and Terraform makes the
world match it. That model fits things that *exist* — a file system, a role, a vault.

A restore is not a thing that exists. It's a one-time **action**: "take recovery point X
and write its bytes back somewhere." It has no steady state for Terraform to converge on
or drift-detect against. Once it's done, there's nothing for Terraform to keep in sync.

That's why the AWS provider has **no `aws_backup_restore_job` resource**. You can create
backups declaratively (a plan runs them on a schedule), but restores are deliberately
left as an imperative operation you invoke through the API, CLI, or console.

---

## The EFS-specific reason: `aws_efs_file_system` has no "restore from" argument

For some services, AWS *did* fold the restore into resource creation, so Terraform can do
it declaratively:

| Resource | Restore-from-backup argument |
|----------|------------------------------|
| `aws_db_instance` (RDS) | `restore_to_point_in_time`, `snapshot_identifier` |
| `aws_ebs_volume` | `snapshot_id` |
| `aws_cloudhsm_v2_cluster` | `source_backup_identifier` |

For those, "create from a backup" *is* a valid desired state, so `terraform apply`
restores.

**`aws_efs_file_system` has no equivalent argument.** Its full set of inputs is
`creation_token`, `encrypted`, `kms_key_id`, `performance_mode`, `throughput_mode`,
`provisioned_throughput_in_mibps`, `availability_zone_name`, `lifecycle_policy`, and
`protection` — none of which seed data from a recovery point. So even the "restore to a
brand-new file system" path ([Option B](./USECASE.md#option-b--restore-to-a-brand-new-file-system-full-dr-scenario))
cannot be done in pure HCL. A Terraform-created EFS always comes up **empty**; AWS Backup
must then push data into it out-of-band.

> This is the key difference from the CloudHSM POC, where adding an HSM resource
> auto-seeds from the latest backup — for HSM the restore *is* a side effect of creating
> a resource, so `terraform apply` restores. EFS has no such mechanism.

---

## What you can actually do

### 1. Wrap the CLI in a `null_resource` (DR-runbook automation)

Keeps the trigger in Terraform, but the restore itself is a `local-exec` shell-out to
`aws backup start-restore-job` — the same call from
[USECASE Option A](./USECASE.md#option-a--restore-into-the-same-file-system-fastest):

```hcl
variable "restore_recovery_point_arn" {
  type    = string
  default = ""          # empty = do nothing
}

resource "null_resource" "efs_restore" {
  count    = var.restore_recovery_point_arn == "" ? 0 : 1
  triggers = { rp = var.restore_recovery_point_arn }

  provisioner "local-exec" {
    command = <<-EOT
      aws backup start-restore-job \
        --region ${var.aws_region} \
        --recovery-point-arn "${var.restore_recovery_point_arn}" \
        --iam-role-arn "${aws_iam_role.backup.arn}" \
        --resource-type EFS \
        --metadata '{"file-system-id":"${aws_efs_file_system.main.id}","newFileSystem":"false","Encrypted":"false","PerformanceMode":"generalPurpose","CreationToken":"efs-poc-restore","ItemsToRestore":"[\"/\"]"}'
    EOT
  }
}
```

Invoke with `terraform apply -var="restore_recovery_point_arn=arn:aws:backup:...:recovery-point:..."`.

**Trade-off:** it's fire-and-forget. Terraform does not track the restored files, will not
clean up the `aws-backup-restore_<timestamp>/` directory, and re-running requires changing
the trigger. This is automation glue, not real state management.

### 2. `aws_restore_testing_plan` — the one genuinely declarative option

AWS Backup **restore testing** *is* exposed as Terraform resources
(`aws_restore_testing_plan` + `aws_restore_testing_selection`). It periodically restores
your recovery points to a throwaway file system to prove they're recoverable. But note:
it's for **validation**, not production restore-in-place — it creates disposable file
systems and tears them down. Use it for recoverability assurance, not to get your data
back.

### 3. Split the responsibility (recommended for real DR)

Let Terraform do what it's good at — recreate the VPC, ECS, EFS, mount targets, and vault
— then run the restore as an operational step (CLI or console) and point the workload at
whichever EFS holds the restored data. Restore stays imperative on purpose.

---

## Bottom line

Terraform provisions the backup *infrastructure*; it does not perform *restores*. There's
no `aws_backup_restore_job` resource and no `restore-from-backup` argument on
`aws_efs_file_system`, so a restore is always either an out-of-band API/CLI/console action
or a `local-exec` wrapper around that same call. Treat restore as a runbook step, not as
Terraform-managed state.
