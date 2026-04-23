resource "aws_s3_bucket" "helpdesk" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "helpdesk" {
  bucket = aws_s3_bucket.helpdesk.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "helpdesk" {
  bucket = aws_s3_bucket.helpdesk.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "helpdesk" {
  bucket = aws_s3_bucket.helpdesk.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "helpdesk" {
  bucket = aws_s3_bucket.helpdesk.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "helpdesk" {
  bucket = aws_s3_bucket.helpdesk.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }
}
