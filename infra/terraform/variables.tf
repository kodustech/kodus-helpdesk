variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
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
