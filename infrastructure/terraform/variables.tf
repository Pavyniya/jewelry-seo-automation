variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "jewelry-seo-automation"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "ohhglam.com"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for the domain"
  type        = string
  default     = ""
}

variable "database_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "railway_token" {
  description = "Railway API token for deployment"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_oauth_token" {
  description = "GitHub OAuth token for repository access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "monitoring_alert_email" {
  description = "Email address for monitoring alerts"
  type        = string
  default     = "devops@ohhglam.com"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}