#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

REGISTRY="${REGISTRY:-docker.io}"
IMAGE_NAME="${IMAGE_NAME:-andpra70/calendario}"
TAG="${TAG:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

docker build -t "$FULL_IMAGE" .
docker push "$FULL_IMAGE"

printf 'Published %s\n' "$FULL_IMAGE"
