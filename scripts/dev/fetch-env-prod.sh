#!/usr/bin/env bash

ENVIRONMENT=$1

# Lista de todas as chaves que você precisa
KEYS=(
    # API
    "/prod/kodus-helpdesk/API_PORT"
    "/prod/kodus-helpdesk/API_NODE_ENV"

    # PostgreSQL
    "/prod/kodus-helpdesk/API_PG_DB_HOST"
    "/prod/kodus-helpdesk/API_PG_DB_PORT"
    "/prod/kodus-helpdesk/API_PG_DB_USERNAME"
    "/prod/kodus-helpdesk/API_PG_DB_PASSWORD"
    "/prod/kodus-helpdesk/API_PG_DB_DATABASE"
    "/prod/kodus-helpdesk/API_DATABASE_DISABLE_SSL"

    # JWT
    "/prod/kodus-helpdesk/JWT_SECRET"
    "/prod/kodus-helpdesk/KODUS_JWT_SECRET"
    "/prod/kodus-helpdesk/ACCESS_TOKEN_MAX_AGE"

    # MailerSend
    "/prod/kodus-helpdesk/MAILSEND_API_TOKEN"
    "/prod/kodus-helpdesk/HELPDESK_FRONTEND_URL"
    "/prod/kodus-helpdesk/MAIL_FROM_EMAIL"
    "/prod/kodus-helpdesk/MAIL_FROM_NAME"

    # Web
    "/prod/kodus-helpdesk/WEB_PORT"
    "/prod/kodus-helpdesk/WEB_NODE_ENV"
    "/prod/kodus-helpdesk/WEB_HOSTNAME_API"
    "/prod/kodus-helpdesk/AUTH_SECRET"
    "/prod/kodus-helpdesk/NEXTAUTH_URL"
    "/prod/kodus-helpdesk/NEXTAUTH_URL_INTERNAL"
    "/prod/kodus-helpdesk/NEXT_PUBLIC_API_URL"
    "/prod/kodus-helpdesk/ALLOWED_PARENT_ORIGINS"

    # GitHub Integration
    "/prod/kodus-helpdesk/GITHUB_TOKEN"
    "/prod/kodus-helpdesk/GITHUB_ORG"
    "/prod/kodus-helpdesk/GITHUB_PROJECT_NUMBER"
    "/prod/kodus-helpdesk/GITHUB_REPOSITORY"

    # Discord
    "/prod/kodus-helpdesk/DISCORD_WEBHOOK_URL"

    # S3 / Storage
    "/prod/kodus-helpdesk/AWS_REGION"
    "/prod/kodus-helpdesk/AWS_ACCESS_KEY_ID"
    "/prod/kodus-helpdesk/AWS_SECRET_ACCESS_KEY"
    "/prod/kodus-helpdesk/AWS_BUCKET_NAME"

    # Docker
    "/prod/kodus-helpdesk/RUN_MIGRATIONS"
    "/prod/kodus-helpdesk/RUN_SEEDS"
    "/prod/kodus-helpdesk/DB_PORT"
)

ENV_FILE=".env.$ENVIRONMENT"

# Limpe o arquivo .env existente ou crie um novo
> $ENV_FILE

# Loop para buscar cada parâmetro
for KEY in "${KEYS[@]}"; do
  # Tenta obter o parâmetro. A falha é detectada pelo código de saída.
  # Erros do AWS CLI são agora visíveis para o usuário.
  if VALUE=$(aws ssm get-parameter --name "$KEY" --with-decryption --query "Parameter.Value" --output text); then
    # O comando foi bem-sucedido, escreve a variável (mesmo que o valor esteja vazio)
    echo "${KEY##*/}=$VALUE" >> "$ENV_FILE"
  else
    # O comando falhou. O erro do AWS CLI já foi impresso no stderr.
    echo "WARNING: Falha ao buscar o parâmetro $KEY. Verifique o erro acima." >&2
  fi
done
