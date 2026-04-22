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
