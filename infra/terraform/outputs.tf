# S3
output "bucket_name" {
  value = aws_s3_bucket.helpdesk.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.helpdesk.arn
}

output "iam_access_key_id" {
  value = aws_iam_access_key.helpdesk_s3.id
}

output "iam_secret_access_key" {
  value     = aws_iam_access_key.helpdesk_s3.secret
  sensitive = true
}

# ECR
output "ecr_api_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_web_url" {
  value = aws_ecr_repository.web.repository_url
}

# ACM — DNS validation records to add in Cloudflare
output "acm_prod_validation" {
  description = "Add this CNAME in Cloudflare to validate the prod certificate"
  value = {
    for dvo in aws_acm_certificate.prod.domain_validation_options : dvo.domain_name => {
      record_name  = dvo.resource_record_name
      record_type  = dvo.resource_record_type
      record_value = dvo.resource_record_value
    }
  }
}

output "acm_qa_validation" {
  description = "Add this CNAME in Cloudflare to validate the QA certificate"
  value = {
    for dvo in aws_acm_certificate.qa.domain_validation_options : dvo.domain_name => {
      record_name  = dvo.resource_record_name
      record_type  = dvo.resource_record_type
      record_value = dvo.resource_record_value
    }
  }
}

output "acm_prod_arn" {
  value = aws_acm_certificate.prod.arn
}

output "acm_qa_arn" {
  value = aws_acm_certificate.qa.arn
}
