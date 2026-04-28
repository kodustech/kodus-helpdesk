#!/bin/bash

# Deployed FLAT to ~/kodus-helpdesk/ on the EC2 host (alongside fetch-env-*.sh
# and docker-compose.{qa,prod}.yml). In the repo it lives under scripts/ for
# organization, but the relative paths inside (./fetch-env-*.sh and
# docker-compose.{env}.yml) refer to the EC2 layout. Keep both copies in sync
# when changing this file.
#
# Usage: ./start.sh <environment> <image_tag>
# Example: ./start.sh qa abc123
#          ./start.sh prod 1.0.0

ENVIRONMENT=$1
IMAGE_TAG=$2

if [[ "$ENVIRONMENT" != "qa" && "$ENVIRONMENT" != "prod" ]]; then
    echo "Error: environment must be 'qa' or 'prod'"
    exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
    echo "Error: image tag is required"
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

# Container names per service (env + tag avoids collisions across deploys)
export CONTAINER_NAME_API="kodus-helpdesk-api-${ENVIRONMENT}-${IMAGE_TAG}"
export CONTAINER_NAME_WEB="kodus-helpdesk-web-${ENVIRONMENT}-${IMAGE_TAG}"

# ECR base URLs per service per environment
export ECR_URL_API="611816806956.dkr.ecr.${AWS_REGION}.amazonaws.com/kodus-helpdesk-api-${ENVIRONMENT}"
export ECR_URL_WEB="611816806956.dkr.ecr.${AWS_REGION}.amazonaws.com/kodus-helpdesk-web-${ENVIRONMENT}"

# Docker authentication with ECR
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_URL_API}"

# Fetch environment variables from AWS Parameter Store
./fetch-env-${ENVIRONMENT}.sh "$ENVIRONMENT"

export NODE_ENV=production

# Image refs (used by docker-compose.${ENVIRONMENT}.yml)
export IMAGE_NAME_API="${ECR_URL_API}:${IMAGE_TAG}"
export IMAGE_NAME_WEB="${ECR_URL_WEB}:${IMAGE_TAG}"

# Use Docker Compose to start the containers
docker compose -f docker-compose.${ENVIRONMENT}.yml up -d --force-recreate

docker system prune -f -a
