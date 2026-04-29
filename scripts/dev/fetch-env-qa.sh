#!/usr/bin/env bash

ENVIRONMENT=$1

# Lista de todas as chaves que você precisa
KEYS=(
    # API
    "/qa/kodus-helpdesk/API_PORT"
    "/qa/kodus-helpdesk/API_NODE_ENV"

    # PostgreSQL (shared with orchestrator — helpdesk uses schema 'helpdesk')
    "/qa/kodus-orchestrator/API_PG_DB_HOST"
    "/qa/kodus-orchestrator/API_PG_DB_PORT"
    "/qa/kodus-orchestrator/API_PG_DB_USERNAME"
    "/qa/kodus-orchestrator/API_PG_DB_PASSWORD"
    "/qa/kodus-orchestrator/API_PG_DB_DATABASE"
    "/qa/kodus-helpdesk/API_DATABASE_DISABLE_SSL"

    # JWT
    "/qa/kodus-helpdesk/JWT_SECRET"
    "/qa/kodus-helpdesk/KODUS_JWT_SECRET"
    "/qa/kodus-helpdesk/ACCESS_TOKEN_MAX_AGE"

    # MailerSend
    "/qa/kodus-helpdesk/HELPDESK_FRONTEND_URL"
    "/qa/kodus-helpdesk/MAIL_FROM_EMAIL"
    "/qa/kodus-helpdesk/MAIL_FROM_NAME"
    "/qa/kodus-helpdesk/API_CUSTOMERIO_APP_API_TOKEN"
    "/qa/kodus-helpdesk/API_CUSTOMERIO_BASE_URL"

    # Web
    "/qa/kodus-helpdesk/WEB_PORT"
    "/qa/kodus-helpdesk/WEB_NODE_ENV"
    "/qa/kodus-helpdesk/WEB_HOSTNAME_API"
    "/qa/kodus-helpdesk/AUTH_SECRET"
    "/qa/kodus-helpdesk/NEXTAUTH_URL"
    "/qa/kodus-helpdesk/NEXTAUTH_URL_INTERNAL"
    "/qa/kodus-helpdesk/NEXT_PUBLIC_API_URL"
    "/qa/kodus-helpdesk/ALLOWED_PARENT_ORIGINS"

    # GitHub Integration
    "/qa/kodus-helpdesk/GITHUB_TOKEN"
    "/qa/kodus-helpdesk/GITHUB_ORG"
    "/qa/kodus-helpdesk/GITHUB_PROJECT_NUMBER"
    "/qa/kodus-helpdesk/GITHUB_REPOSITORY"

    # Discord
    "/qa/kodus-helpdesk/DISCORD_WEBHOOK_URL"

    # S3 / Storage
    "/qa/kodus-helpdesk/AWS_REGION"
    "/qa/kodus-helpdesk/AWS_ACCESS_KEY_ID"
    "/qa/kodus-helpdesk/AWS_SECRET_ACCESS_KEY"
    "/qa/kodus-helpdesk/AWS_BUCKET_NAME"

    # Docker
    "/qa/kodus-helpdesk/RUN_MIGRATIONS"
    "/qa/kodus-helpdesk/RUN_SEEDS"
    "/qa/kodus-helpdesk/DB_PORT"
)

ENV_FILE=".env.$ENVIRONMENT"

# Limpe o arquivo .env existente ou crie um novo
> $ENV_FILE

# Escape de aspas simples para preservar caracteres especiais (ex: senha do DB)
escape_squotes() {
    printf "%s" "$1" | sed "s/'/'\"'\"'/g"
}

# Loop para buscar cada parâmetro
for KEY in "${KEYS[@]}"; do
  # Tenta obter o parâmetro. A falha é detectada pelo código de saída.
  # Erros do AWS CLI são agora visíveis para o usuário.
  if VALUE=$(aws ssm get-parameter --name "$KEY" --with-decryption --query "Parameter.Value" --output text); then
    if [ "$KEY" = "/qa/kodus-orchestrator/API_PG_DB_PASSWORD" ]; then
      SAFE=$(escape_squotes "$VALUE")
      echo "${KEY##*/}='${SAFE}'" >> "$ENV_FILE"
    else
      echo "${KEY##*/}=$VALUE" >> "$ENV_FILE"
    fi
  else
    # O comando falhou. O erro do AWS CLI já foi impresso no stderr.
    echo "WARNING: Falha ao buscar o parâmetro $KEY. Verifique o erro acima." >&2
  fi
done
