#!/usr/bin/env bash

ENVIRONMENT=$1

# Lista de todas as chaves que você precisa
KEYS=(
    # API
    "/qa/kodus-helpdesk/API_PORT"
    "/qa/kodus-helpdesk/API_NODE_ENV"

    # PostgreSQL
    "/qa/kodus-helpdesk/API_PG_DB_HOST"
    "/qa/kodus-helpdesk/API_PG_DB_PORT"
    "/qa/kodus-helpdesk/API_PG_DB_USERNAME"
    "/qa/kodus-helpdesk/API_PG_DB_PASSWORD"
    "/qa/kodus-helpdesk/API_PG_DB_DATABASE"
    "/qa/kodus-helpdesk/API_DATABASE_DISABLE_SSL"

    # JWT
    "/qa/kodus-helpdesk/JWT_SECRET"
    "/qa/kodus-helpdesk/KODUS_JWT_SECRET"
    "/qa/kodus-helpdesk/ACCESS_TOKEN_MAX_AGE"

    # MailerSend
    "/qa/kodus-helpdesk/MAILSEND_API_TOKEN"
    "/qa/kodus-helpdesk/HELPDESK_FRONTEND_URL"
    "/qa/kodus-helpdesk/MAIL_FROM_EMAIL"
    "/qa/kodus-helpdesk/MAIL_FROM_NAME"

    # Web
    "/qa/kodus-helpdesk/WEB_PORT"
    "/qa/kodus-helpdesk/WEB_NODE_ENV"
    "/qa/kodus-helpdesk/WEB_HOSTNAME_API"
    "/qa/kodus-helpdesk/AUTH_SECRET"
    "/qa/kodus-helpdesk/NEXTAUTH_URL"
    "/qa/kodus-helpdesk/NEXTAUTH_URL_INTERNAL"
    "/qa/kodus-helpdesk/NEXT_PUBLIC_API_URL"
    "/qa/kodus-helpdesk/NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS"
    "/qa/kodus-helpdesk/ALLOWED_PARENT_ORIGINS"

    # GitHub Integration
    "/qa/kodus-helpdesk/GITHUB_TOKEN"
    "/qa/kodus-helpdesk/GITHUB_ORG"
    "/qa/kodus-helpdesk/GITHUB_PROJECT_NUMBER"
    "/qa/kodus-helpdesk/GITHUB_REPOSITORY"

    # Docker
    "/qa/kodus-helpdesk/RUN_MIGRATIONS"
    "/qa/kodus-helpdesk/RUN_SEEDS"
    "/qa/kodus-helpdesk/DB_PORT"
)

ENV_FILE=".env.$ENVIRONMENT"

# Limpe o arquivo .env existente ou crie um novo
> $ENV_FILE

# Loop para buscar cada parâmetro
for KEY in "${KEYS[@]}"; do
  # Tenta obter o parâmetro, redirecionando mensagens de erro para /dev/null
  VALUE=$(aws ssm get-parameter --name "$KEY" --with-decryption --query "Parameter.Value" --output text 2>/dev/null)

  if [ -z "$VALUE" ] || [[ "$VALUE" == "ParameterNotFound" ]]; then
    # Se o comando não retornar valor, registra um aviso (pode ser logado ou mostrado no stderr)
    echo "WARNING: Parâmetro $KEY não encontrado." >&2
  else
    # Remove o caminho e escreve no arquivo .env
    echo "${KEY##*/}=$VALUE" >> "$ENV_FILE"
  fi
done
