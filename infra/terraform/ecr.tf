resource "aws_ecr_repository" "api" {
  name                 = "kodus-helpdesk-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "web" {
  name                 = "kodus-helpdesk-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep only the last 20 images, remove untagged after 7 days
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only last 20 tagged images"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = [""]
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = { type = "expire" }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Remove untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only last 20 tagged images"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = [""]
          countType   = "imageCountMoreThan"
          countNumber = 20
        }
        action = { type = "expire" }
      }
    ]
  })
}
