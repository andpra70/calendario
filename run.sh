#!/usr/bin/env bash

set -euo pipefail

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_NAME="${IMAGE_NAME:-andpra70/calendario}"
TAG="${TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-calendario}"
HOST_PORT="${HOST_PORT:-6065}"
CONTAINER_PORT="${CONTAINER_PORT:-80}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  printf 'Stopping and removing existing container %s\n' "$CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" >/dev/null
  docker rm "$CONTAINER_NAME" >/dev/null
fi

docker pull "$FULL_IMAGE"
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$FULL_IMAGE"

printf 'Started %s as %s on port %s\n' "$FULL_IMAGE" "$CONTAINER_NAME" "$HOST_PORT"
