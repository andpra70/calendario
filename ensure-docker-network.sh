#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/.docker-network.env"

routes="$(ip route | awk '{print $1}')"
docker_subnets="$(
  docker network ls -q | while read -r network_id; do
    docker network inspect "$network_id" \
      --format '{{range .IPAM.Config}}{{if .Subnet}}{{.Subnet}}{{"\n"}}{{end}}{{end}}'
  done
)"

subnet_is_unavailable() {
  local subnet="$1"
  local second_octet third_octet

  second_octet="$(printf '%s' "$subnet" | cut -d. -f2)"
  third_octet="$(printf '%s' "$subnet" | cut -d. -f3)"

  if printf '%s\n' "$routes" | grep -Fxq "$subnet"; then
    return 0
  fi

  if printf '%s\n' "$routes" | grep -Fxq "172.${second_octet}.0.0/16"; then
    return 0
  fi

  if printf '%s\n' "$docker_subnets" | grep -Fxq "$subnet"; then
    return 0
  fi

  if printf '%s\n' "$docker_subnets" | grep -Fxq "172.${second_octet}.0.0/16"; then
    return 0
  fi

  if printf '%s\n' "$docker_subnets" | grep -Fxq "172.${second_octet}.${third_octet}.0/24"; then
    return 0
  fi

  return 1
}

selected_subnet=""

for second_octet in 30 31; do
  for third_octet in $(seq 0 255); do
    candidate_subnet="172.${second_octet}.${third_octet}.0/24"
    if subnet_is_unavailable "$candidate_subnet"; then
      continue
    fi
    selected_subnet="$candidate_subnet"
    break
  done
  if [[ -n "$selected_subnet" ]]; then
    break
  fi
done

if [[ -z "$selected_subnet" ]]; then
  echo "Unable to find a free Docker subnet for compose network" >&2
  exit 1
fi

printf 'CALENDARIO_SUBNET=%s\n' "$selected_subnet" >"$ENV_FILE"
