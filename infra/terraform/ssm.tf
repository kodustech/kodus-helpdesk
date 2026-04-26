# SSM Parameters for QA and Production
# These are created with placeholder values — fill them in the AWS Console or via CLI

locals {
  environments = {
    qa   = "qa"
    prod = "prod"
  }

  # All parameters that need to exist per environment
  parameters = {
    # API
    "API_PORT"     = { default_value = "3003", description = "API port" }
    "API_NODE_ENV" = { default_value = "production", description = "Node environment" }

    # PostgreSQL
    "API_PG_DB_HOST"         = { default_value = "FILL_ME", description = "PostgreSQL host" }
    "API_PG_DB_PORT"         = { default_value = "5432", description = "PostgreSQL port" }
    "API_PG_DB_USERNAME"     = { default_value = "FILL_ME", description = "PostgreSQL username" }
    "API_PG_DB_PASSWORD"     = { default_value = "FILL_ME", description = "PostgreSQL password", type = "SecureString" }
    "API_PG_DB_DATABASE"     = { default_value = "kodus_db", description = "PostgreSQL database" }
    "API_DATABASE_DISABLE_SSL" = { default_value = "false", description = "Disable SSL for database" }

    # JWT
    "JWT_SECRET"           = { default_value = "FILL_ME", description = "Helpdesk JWT secret", type = "SecureString" }
    "KODUS_JWT_SECRET"     = { default_value = "FILL_ME", description = "Kodus AI shared JWT secret", type = "SecureString" }
    "ACCESS_TOKEN_MAX_AGE" = { default_value = "15", description = "Access token max age in minutes" }

    # Email
    "MAILSEND_API_TOKEN"          = { default_value = "FILL_ME", description = "MailerSend API token", type = "SecureString" }
    "API_CUSTOMERIO_APP_API_TOKEN" = { default_value = "FILL_ME", description = "Customer.io API token", type = "SecureString" }
    "API_CUSTOMERIO_BASE_URL"     = { default_value = "https://api.customer.io", description = "Customer.io base URL" }
    "HELPDESK_FRONTEND_URL"       = { default_value = "FILL_ME", description = "Frontend URL" }
    "MAIL_FROM_EMAIL"             = { default_value = "noreply@kodus.io", description = "Email from address" }
    "MAIL_FROM_NAME"              = { default_value = "Kodus Helpdesk", description = "Email from name" }

    # Web
    "WEB_PORT"                = { default_value = "3000", description = "Web port" }
    "WEB_NODE_ENV"            = { default_value = "production", description = "Web Node environment" }
    "WEB_HOSTNAME_API"        = { default_value = "FILL_ME", description = "API hostname for web server-side" }
    "AUTH_SECRET"             = { default_value = "FILL_ME", description = "NextAuth secret", type = "SecureString" }
    "NEXTAUTH_URL"            = { default_value = "FILL_ME", description = "NextAuth URL" }
    "NEXTAUTH_URL_INTERNAL"   = { default_value = "FILL_ME", description = "NextAuth internal URL" }
    "NEXT_PUBLIC_API_URL"     = { default_value = "FILL_ME", description = "Public API URL for browser" }
    "ALLOWED_PARENT_ORIGINS"  = { default_value = "FILL_ME", description = "CSP frame-ancestors" }

    # GitHub Integration
    "GITHUB_TOKEN"          = { default_value = "FILL_ME", description = "GitHub PAT", type = "SecureString" }
    "GITHUB_ORG"            = { default_value = "kodustech", description = "GitHub organization" }
    "GITHUB_PROJECT_NUMBER" = { default_value = "4", description = "GitHub project number" }
    "GITHUB_REPOSITORY"     = { default_value = "kodus-ai", description = "GitHub repository" }

    # Discord
    "DISCORD_WEBHOOK_URL" = { default_value = "FILL_ME", description = "Discord webhook URL", type = "SecureString" }

    # S3 / Storage
    "AWS_REGION"            = { default_value = "us-east-1", description = "AWS region for S3" }
    "AWS_ACCESS_KEY_ID"     = { default_value = "FILL_ME", description = "AWS access key for S3", type = "SecureString" }
    "AWS_SECRET_ACCESS_KEY" = { default_value = "FILL_ME", description = "AWS secret key for S3", type = "SecureString" }
    "AWS_BUCKET_NAME"       = { default_value = "kodus-helpdesk", description = "S3 bucket name" }

    # Docker
    "RUN_MIGRATIONS" = { default_value = "true", description = "Run migrations on startup" }
    "RUN_SEEDS"      = { default_value = "true", description = "Run seeds on startup" }
    "DB_PORT"        = { default_value = "5432", description = "Database port" }
  }
}

resource "aws_ssm_parameter" "params" {
  for_each = {
    for pair in flatten([
      for env_key, env_name in local.environments : [
        for param_key, param_config in local.parameters : {
          key         = "${env_name}/${param_key}"
          name        = "/${env_name}/kodus-helpdesk/${param_key}"
          value       = param_config.default_value
          type        = lookup(param_config, "type", "String")
          description = param_config.description
        }
      ]
    ]) : pair.key => pair
  }

  name        = each.value.name
  type        = each.value.type
  value       = each.value.value
  description = each.value.description

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Project     = "kodus-helpdesk"
    Environment = split("/", each.value.name)[1]
  }
}
