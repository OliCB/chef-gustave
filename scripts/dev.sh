#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Colima compatibility
if [ -S "$HOME/.colima/default/docker.sock" ]; then
  export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
fi

# Start Supabase if not running
if ! npx --yes supabase status &>/dev/null 2>&1; then
  echo "🚀 Starting Supabase..."
  EXCLUDE_FLAG=""
  if [ -n "${DOCKER_HOST:-}" ] && [[ "$DOCKER_HOST" == *colima* ]]; then
    EXCLUDE_FLAG="--exclude vector"
  fi
  npx --yes supabase start $EXCLUDE_FLAG
fi

echo "✅ Supabase running"
