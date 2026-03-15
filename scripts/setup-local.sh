#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Colima compatibility: set DOCKER_HOST if Colima socket exists
if [ -S "$HOME/.colima/default/docker.sock" ]; then
  export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
fi

# Check prerequisites
if ! command -v docker &>/dev/null; then
  echo "❌ Docker is required. Install it from https://docker.com"
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "❌ Docker daemon is not running. Start Docker Desktop or Colima first."
  exit 1
fi

# Install supabase CLI as a local dev dependency
echo "📦 Ensuring supabase CLI is installed..."
npm install -D supabase

# Initialize supabase if not already done
if [ ! -f supabase/config.toml ]; then
  echo "🔧 Initializing Supabase..."
  npx --yes supabase init
fi

# Start supabase (postgres, auth, etc.)
# Detect Colima and exclude vector container (needs Docker socket mount that Colima can't do)
EXCLUDE_FLAG=""
if [ -n "${DOCKER_HOST:-}" ] && [[ "$DOCKER_HOST" == *colima* ]]; then
  EXCLUDE_FLAG="--exclude vector"
fi

echo "🚀 Starting Supabase containers (this may take a few minutes the first time)..."
npx --yes supabase start $EXCLUDE_FLAG

# Extract credentials from supabase status
echo "🔑 Extracting credentials..."
STATUS_JSON=$(npx --yes supabase status --output json)
API_URL=$(echo "$STATUS_JSON" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).API_URL))
")
SERVICE_KEY=$(echo "$STATUS_JSON" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).SERVICE_ROLE_KEY))
")

# Generate .env if it doesn't exist or update Supabase values
if [ -f .env ]; then
  # Update existing .env (macOS sed needs empty string for -i)
  sed -i '' "s|^SUPABASE_URL=.*|SUPABASE_URL=${API_URL}|" .env
  sed -i '' "s|^SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=${SERVICE_KEY}|" .env
  echo "✅ Updated .env with local Supabase credentials"
else
  cat > .env <<EOF
SUPABASE_URL=${API_URL}
SUPABASE_SERVICE_KEY=${SERVICE_KEY}
AUTH_PASSWORD_HASH=\$2a\$10\$/7f1O8PPI0xG/WZNG4vOxuBHm300gJQrEPlbLxSf6A1uf3O2oRTZW
JWT_SECRET=dev-secret-change-in-production
EOF
  echo "✅ Created .env with local Supabase credentials"
fi

# Apply migration
echo "📋 Applying database migration..."
npx --yes supabase db push

# Install npm deps if needed
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo ""
echo "✅ Ready! Run: npm run dev"
echo "   Login password: gustave"
