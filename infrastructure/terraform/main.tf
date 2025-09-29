terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Create S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${var.environment}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_encryption" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Create DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "${var.project_name}-terraform-state-lock-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# Configure Terraform backend
terraform {
  backend "s3" {
    bucket         = "jewelry-seo-automation-terraform-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "jewelry-seo-automation-terraform-state-lock"
    encrypt        = true
  }
}

# Development Environment
module "dev_environment" {
  source = "./modules/environment"

  environment = "dev"
  project_name = var.project_name
  aws_region = var.aws_region

  instance_type = "t3.micro"
  database_size = "db.t3.micro"
  auto_scaling = false

  tags = {
    Environment = "Development"
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

# Staging Environment
module "staging_environment" {
  source = "./modules/environment"

  environment = "staging"
  project_name = var.project_name
  aws_region = var.aws_region

  instance_type = "t3.small"
  database_size = "db.t3.small"
  auto_scaling = true
  min_instances = 1
  max_instances = 3

  tags = {
    Environment = "Staging"
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

# Production Environment
module "production_environment" {
  source = "./modules/environment"

  environment = "production"
  project_name = var.project_name
  aws_region = var.aws_region

  instance_type = "t3.medium"
  database_size = "db.t3.large"
  auto_scaling = true
  min_instances = 2
  max_instances = 10
  multi_az = true

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = var.project_name
  }
}

# Outputs
output "dev_environment" {
  description = "Development environment outputs"
  value       = module.dev_environment.outputs
}

output "staging_environment" {
  description = "Staging environment outputs"
  value       = module.staging_environment.outputs
}

output "production_environment" {
  description = "Production environment outputs"
  value       = module.production_environment.outputs
}