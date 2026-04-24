#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?usage: verify-live-site.sh <https-url>}"
BASE_URL="${BASE_URL%/}"

check_url() {
  local url="$1"
  local label="$2"
  echo "[verify] $label -> $url"
  curl -fsSIL --max-time 20 "$url" >/dev/null
}

check_url "$BASE_URL/" "homepage"
check_url "$BASE_URL/robots.txt" "robots"
check_url "$BASE_URL/sitemap.xml" "sitemap"

health_payload="$(curl -fsS --max-time 20 "$BASE_URL/healthz")"
if [[ "$health_payload" != *'"ok":true'* ]]; then
  echo "[verify] unexpected /healthz payload: $health_payload" >&2
  exit 1
fi

echo "[verify] live site checks passed"
