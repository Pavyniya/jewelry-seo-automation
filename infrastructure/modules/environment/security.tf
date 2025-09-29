# Security configurations for the environment module

variable "enable_security_monitoring" {
  description = "Enable security monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF protection"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Enable AWS Shield protection"
  type        = bool
  default     = true
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  count  = var.enable_waf ? 1 : 0
  name  = "${var.project_name}-${var.environment}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  # Rule to block common SQL injection patterns
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-waf-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Rule to block common XSS patterns
  rule {
    name     = "AWSManagedRulesXSSRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-waf-xss"
      sampled_requests_enabled   = true
    }
  }
}

# AWS Shield Protection
resource "aws_shield_protection" "alb" {
  count  = var.enable_shield ? 1 : 0
  name   = "${var.project_name}-${var.environment}-alb"
  resource_arn = aws_lb.app.arn
}

# Security Group with stricter rules for production
resource "aws_security_group" "app_strict" {
  count       = var.environment == "production" ? 1 : 0
  name        = "${var.project_name}-${var.environment}-app-strict-sg"
  description = "Strict security group for production application instances"
  vpc_id      = aws_vpc.main.id

  # Only allow traffic from load balancer
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb[count.index].id]
  }

  # Allow SSH from specific IPs only
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only internal SSH
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-app-strict-sg"
  })
}

# Load Balancer Security Group
resource "aws_security_group" "lb" {
  count       = var.environment == "production" ? 1 : 0
  name        = "${var.project_name}-${var.environment}-lb-sg"
  description = "Security group for load balancer"
  vpc_id      = aws_vpc.main.id

  # HTTP and HTTPS from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-lb-sg"
  })
}

# SSL/TLS Certificate using AWS Certificate Manager
resource "aws_acm_certificate" "main" {
  domain_name       = "${var.environment == "production" ? "" : var.environment + "."}var.domain_name"
  validation_method = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-cert"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  count = var.enable_security_monitoring ? 1 : 0

  name                          = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.logs[count.index].id
  include_global_service_events = false
  is_multi_region_trail         = false

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logs[count.index].arn}/"]
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-trail"
  })
}

# Security Group Rules for monitoring
resource "aws_security_group_rule" "monitoring_ingress" {
  count = var.enable_security_monitoring ? 1 : 0

  type              = "ingress"
  from_port         = 9090
  to_port           = 9090
  protocol          = "tcp"
  security_group_id = aws_security_group.monitoring[count.index].id
  source_security_group_id = aws_security_group.app.id
}

# Security monitoring group
resource "aws_security_group" "monitoring" {
  count = var.enable_security_monitoring ? 1 : 0

  name        = "${var.project_name}-${var.environment}-monitoring-sg"
  description = "Security group for monitoring services"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-monitoring-sg"
  })
}