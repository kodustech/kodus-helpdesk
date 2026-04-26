# Certificate for production: helpdesk.kodus.io
resource "aws_acm_certificate" "prod" {
  domain_name       = var.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "helpdesk-prod"
    Environment = "production"
  }
}

# Certificate for QA: qa.helpdesk.kodus.io
resource "aws_acm_certificate" "qa" {
  domain_name       = var.qa_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "helpdesk-qa"
    Environment = "qa"
  }
}
