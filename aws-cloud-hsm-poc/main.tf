# ─── Data Sources ───────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─── VPC ────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project_name}-igw" }
}

# Public subnet — EC2 client lives here (internet access for SSM + package downloads)
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public-subnet" }
}

# Private subnet — HSM lives here (no direct internet access needed)
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "${var.project_name}-private-subnet" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ─── Security Groups ─────────────────────────────────────────────────────────

# EC2 client SG — allows outbound to HSM ports + general internet egress
resource "aws_security_group" "ec2_client" {
  name        = "${var.project_name}-ec2-client-sg"
  description = "HSM client EC2 - outbound to CloudHSM cluster"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "General internet egress (SSM, package downloads)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ec2-client-sg" }
}

# Allow EC2 client SG to reach the HSM cluster SG on the CloudHSM client ports
resource "aws_security_group_rule" "hsm_inbound_from_client" {
  type                     = "ingress"
  description              = "CloudHSM client traffic from EC2"
  from_port                = 2223
  to_port                  = 2225
  protocol                 = "tcp"
  security_group_id        = aws_cloudhsm_v2_cluster.main.security_group_id
  source_security_group_id = aws_security_group.ec2_client.id
}

# ─── CloudHSM Cluster ────────────────────────────────────────────────────────

resource "aws_cloudhsm_v2_cluster" "main" {
  hsm_type   = "hsm2m.medium"
  mode       = "NON_FIPS"
  subnet_ids = [aws_subnet.private.id]

  tags = { Name = "${var.project_name}-cluster" }
}

# Single HSM instance — minimum required for a functional cluster
resource "aws_cloudhsm_v2_hsm" "primary" {
  cluster_id = aws_cloudhsm_v2_cluster.main.cluster_id
  subnet_id  = aws_subnet.private.id
}

# ─── EC2 Client Instance ─────────────────────────────────────────────────────

resource "aws_iam_role" "ec2_hsm_client" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_hsm_client.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudhsm_full" {
  role       = aws_iam_role.ec2_hsm_client.name
  policy_arn = "arn:aws:iam::aws:policy/AWSCloudHSMFullAccess"
}

resource "aws_iam_instance_profile" "ec2_hsm_client" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_hsm_client.name
}

resource "aws_instance" "hsm_client" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_client.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_hsm_client.name

  # Install CloudHSM client software at launch
  user_data = <<-EOF
    #!/bin/bash
    set -e
    yum update -y

    # CloudHSM CLI (primary tool for key management)
    wget -q https://s3.amazonaws.com/cloudhsmv2-software/CloudHsmClient/EL7/cloudhsm-cli-latest.el7.x86_64.rpm \
      -O /tmp/cloudhsm-cli.rpm
    yum localinstall -y /tmp/cloudhsm-cli.rpm

    # CloudHSM PKCS#11 library (for application integration)
    wget -q https://s3.amazonaws.com/cloudhsmv2-software/CloudHsmClient/EL7/cloudhsm-pkcs11-latest.el7.x86_64.rpm \
      -O /tmp/cloudhsm-pkcs11.rpm
    yum localinstall -y /tmp/cloudhsm-pkcs11.rpm
  EOF

  metadata_options {
    http_tokens = "required"
  }

  tags = { Name = "${var.project_name}-hsm-client" }
}
