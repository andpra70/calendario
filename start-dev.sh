#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  ./ensure-docker-network.sh
  docker compose --env-file .docker-network.env up --build
else
  npm install
  npm run dev -- --host 0.0.0.0 --port 6065
fi
