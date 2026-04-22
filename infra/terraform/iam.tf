resource "aws_iam_user" "helpdesk_s3" {
  name = var.iam_user_name
}

resource "aws_iam_user_policy" "helpdesk_s3" {
  name = "${var.iam_user_name}-policy"
  user = aws_iam_user.helpdesk_s3.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3Operations"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.helpdesk.arn,
          "${aws_s3_bucket.helpdesk.arn}/*",
        ]
      }
    ]
  })
}

resource "aws_iam_access_key" "helpdesk_s3" {
  user = aws_iam_user.helpdesk_s3.name
}
