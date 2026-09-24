output "cluster_id" {
  description = "CloudHSM cluster ID"
  value       = aws_cloudhsm_v2_cluster.main.cluster_id
}

output "cluster_state" {
  description = "Current state of the CloudHSM cluster"
  value       = aws_cloudhsm_v2_cluster.main.cluster_state
}

output "cluster_security_group_id" {
  description = "Security group auto-created by the CloudHSM cluster"
  value       = aws_cloudhsm_v2_cluster.main.security_group_id
}

output "hsm_id" {
  description = "HSM instance ID"
  value       = aws_cloudhsm_v2_hsm.primary.hsm_id
}

output "hsm_eni_ip" {
  description = "Private IP of the HSM ENI — use this in /opt/cloudhsm/etc/cloudhsm_client.cfg"
  value       = aws_cloudhsm_v2_hsm.primary.ip_address
}

output "ec2_client_instance_id" {
  description = "EC2 client instance ID — connect via SSM Session Manager"
  value       = aws_instance.hsm_client.id
}

output "ssm_connect_command" {
  description = "Command to open an SSM shell on the EC2 client"
  value       = "aws ssm start-session --target ${aws_instance.hsm_client.id} --region ${var.aws_region}"
}
