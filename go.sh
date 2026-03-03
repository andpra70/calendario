#!/usr/bin/env bash

set -euo pipefail

git add .
git commit -a -m "update"
git push

docker compose up --build
