#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

git add .
git commit -a -m "update"
git push

docker compose --env-file .docker-network.env up --build -d
