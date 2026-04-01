#!/bin/bash
set -e

echo "=== Kodus Helpdesk Prod Entrypoint ==="

# Auto-tune Node.js memory (85% of container limit)
if [ -f /sys/fs/cgroup/memory.max ]; then
    MEMORY_LIMIT=$(cat /sys/fs/cgroup/memory.max)
    if [ "$MEMORY_LIMIT" != "max" ]; then
        MEMORY_MB=$((MEMORY_LIMIT / 1024 / 1024))
        NODE_MEMORY=$((MEMORY_MB * 85 / 100))
        export NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY}"
        echo "Node.js memory set to ${NODE_MEMORY}MB (85% of ${MEMORY_MB}MB)"
    fi
fi

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
