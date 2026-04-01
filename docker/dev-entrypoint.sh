#!/bin/bash
set -e

echo "=== Kodus Helpdesk Dev Entrypoint ==="

# Ensure helpdesk schema exists
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Creating helpdesk schema if not exists..."
    PGPASSWORD=$API_PG_DB_PASSWORD psql -h $API_PG_DB_HOST -U $API_PG_DB_USERNAME -d $API_PG_DB_DATABASE -c "CREATE SCHEMA IF NOT EXISTS helpdesk;" 2>/dev/null || true

    echo "Running migrations..."
    yarn migration:run:internal
fi

if [ "$RUN_SEEDS" = "true" ]; then
    echo "Running seeds..."
    yarn seed:internal
fi

echo "Starting application..."
exec "$@"
