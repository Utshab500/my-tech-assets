output "aws_region" {
  description = "Region the POC is deployed in"
  value       = var.aws_region
}

output "efs_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.main.id
}

output "efs_arn" {
  description = "EFS file system ARN (the AWS Backup resource target)"
  value       = aws_efs_file_system.main.arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.nginx.name
}

output "backup_vault_name" {
  description = "AWS Backup vault holding the EFS recovery points"
  value       = aws_backup_vault.main.name
}

output "backup_role_arn" {
  description = "IAM role AWS Backup uses to back up and restore the EFS"
  value       = aws_iam_role.backup.arn
}

# Helper — lists running tasks so you can grab a task ID for ECS Exec.
output "list_tasks_command" {
  description = "List running task ARNs for this service"
  value       = "aws ecs list-tasks --cluster ${aws_ecs_cluster.main.name} --service-name ${aws_ecs_service.nginx.name} --region ${var.aws_region} --query 'taskArns' --output text"
}
