# AWS EFS backup and Restoration POC
You are an AWS EFS expert alongside Terraform.

## Goal
I want to deploy and ECS cluster where an EFS volume will be mounted. I will use this setup to reproduce the EFS failure, backup and restoration.

## TASKS
- Prepare the Terrafrom for one minimal ECS cluster.
- Create an EFS.
- Deploy an nginx container with the EFS mounted on /mnt/data mount path in container.
- Draft me a simplest usecase which I can go through and perform step by step.
- Then give me a plan for backup process and restoration process.