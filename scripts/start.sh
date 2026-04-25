#!/usr/bin/env bash
set -euo pipefail

# Usage: ./start.sh <environment> <image_tag>
# Example: ./start.sh qa abc123
#          ./start.sh prod 1.0.0

ENVIRONMENT="${1:?Usage: $0 <qa|prod> <image_tag>}"
IMAGE_TAG="${2:?Usage: $0 <qa|prod> <image_tag>}"

if [[ "$ENVIRONMENT" != "qa" && "$ENVIRONMENT" != "prod" ]]; then
    echo "Error: environment must be 'qa' or 'prod'"
    exit 1
fi

COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

echo "=== Kodus Helpdesk Deploy ==="
echo "Environment: $ENVIRONMENT"
echo "Image tag:   $IMAGE_TAG"
echo "Compose:     $COMPOSE_FILE"
echo ""

# Validate required files
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: $COMPOSE_FILE not found"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

# Login to ECR
echo "Logging in to ECR..."
ECR_REGISTRY=$(aws ecr get-login-password --region "${AWS_REGION:-us-east-2}" | \
    docker login --username AWS --password-stdin \
    "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION:-us-east-2}.amazonaws.com" 2>&1 | \
    grep -oP '[\d]+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com' || true)

if [ -z "$ECR_REGISTRY" ]; then
    ECR_REGISTRY="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION:-us-east-2}.amazonaws.com"
    aws ecr get-login-password --region "${AWS_REGION:-us-east-2}" | \
        docker login --username AWS --password-stdin "$ECR_REGISTRY"
fi

export ECR_REGISTRY
export IMAGE_TAG

echo "ECR Registry: $ECR_REGISTRY"
echo "Pulling images..."

# Pull new images
docker compose -f "$COMPOSE_FILE" pull

# Stop old containers and start new ones
echo "Restarting services..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker compose -f "$COMPOSE_FILE" up -d

# Wait for API health
echo "Waiting for API to be healthy..."
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" ps helpdesk-api --format json 2>/dev/null | grep -q '"healthy"'; then
        echo "API is healthy!"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "Warning: API health check timed out after 30 attempts"
        echo "Checking logs..."
        docker compose -f "$COMPOSE_FILE" logs helpdesk-api --tail 20
        exit 1
    fi
    sleep 5
done

# Cleanup old images
echo "Cleaning up old images..."
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo "=== Deploy complete ==="
docker compose -f "$COMPOSE_FILE" ps
