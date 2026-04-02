#!/bin/bash
set -e

echo "=== Kodus Helpdesk Dev Entrypoint ==="

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running migrations..."
    yarn migration:run:internal || echo "Migration failed or no pending migrations"
fi

if [ "$RUN_SEEDS" = "true" ]; then
    echo "Running seeds..."
    yarn seed:internal || echo "Seed failed or already seeded"
fi

echo "Starting application..."
exec "$@"
