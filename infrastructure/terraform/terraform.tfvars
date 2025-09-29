# Default values for development
project_name = "jewelry-seo-automation"
aws_region = "us-east-1"
environment = "dev"
domain_name = "ohhglam.com"

# These should be provided via environment variables or AWS Secrets Manager in production
# database_password = ""
# railway_token = ""
# github_oauth_token = ""

monitoring_alert_email = "alerts@ohhglam.com"
backup_retention_days = 30
enable_monitoring = true
enable_backup = true