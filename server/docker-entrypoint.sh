#!/bin/sh
set -e

echo "==================================="
echo "Starting Backend Initialization..."
echo "==================================="

# Fallback DIRECT_URL to DATABASE_URL if missing
if [ -z "$DIRECT_URL" ]; then
  echo "⚠️ DIRECT_URL not set. Falling back to DATABASE_URL for migrations."
  export DIRECT_URL="$DATABASE_URL"
fi

echo "[1/3] Deploying database schema..."
# Retry loop for db push to handle slower database startup
max_retries=5
count=0
until DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss
do
  count=$((count + 1))
  if [ $count -gt $max_retries ]; then
    echo "❌ Database schema deployment failed after $max_retries attempts. Exiting."
    exit 1
  fi
  echo "⏳ Database is not ready or schema push failed (attempt $count/$max_retries). Retrying in 5 seconds..."
  sleep 5
done

echo "[2/3] Seeding the database..."
DATABASE_URL="$DIRECT_URL" node dist/prisma/seed.js

echo "[3/3] Starting the backend server..."
echo "==================================="
exec node dist/src/index.js
