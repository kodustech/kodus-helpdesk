variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for helpdesk file uploads"
  type        = string
  default     = "kodus-helpdesk"
}

variable "iam_user_name" {
  description = "IAM user name for helpdesk S3 access"
  type        = string
  default     = "kodus-helpdesk-s3"
}

variable "domain" {
  description = "Production domain"
  type        = string
  default     = "helpdesk.kodus.io"
}

variable "qa_domain" {
  description = "QA domain"
  type        = string
  default     = "qa.helpdesk.kodus.io"
}
