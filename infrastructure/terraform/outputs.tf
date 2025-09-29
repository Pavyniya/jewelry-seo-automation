# Environment URLs
output "dev_url" {
  description = "Development environment URL"
  value       = module.dev_environment.app_url
}

output "staging_url" {
  description = "Staging environment URL"
  value       = module.staging_environment.app_url
}

output "production_url" {
  description = "Production environment URL"
  value       = module.production_environment.app_url
}

# Database endpoints
output "dev_database_endpoint" {
  description = "Development database endpoint"
  value       = module.dev_environment.database_endpoint
  sensitive   = true
}

output "staging_database_endpoint" {
  description = "Staging database endpoint"
  value       = module.staging_environment.database_endpoint
  sensitive   = true
}

output "production_database_endpoint" {
  description = "Production database endpoint"
  value       = module.production_environment.database_endpoint
  sensitive   = true
}

# Monitoring endpoints
output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.production_environment.cloudwatch_dashboard_url
}

# Security outputs
output "ssl_certificate_arn" {
  description = "SSL certificate ARN"
  value       = module.production_environment.ssl_certificate_arn
}

# Cost optimization
output "estimated_monthly_cost" {
  description = "Estimated monthly cost for all environments"
  value = {
    dev        = "$20/month"
    staging    = "$50/month"
    production = "$200/month"
    total      = "$270/month"
  }
}