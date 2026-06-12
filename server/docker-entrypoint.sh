#!/bin/sh
set -e

echo "==================================="
echo "Starting Backend Initialization..."
echo "==================================="

echo "[1/4] Generating Prisma Client..."
npx prisma generate

echo "[2/4] Deploying database schema..."
# 'db push' synchronizes the schema directly with the database
npx prisma db push --accept-data-loss

echo "[3/4] Seeding the database..."
node dist/prisma/seed.js

echo "[4/4] Starting the backend server..."
echo "==================================="
exec node dist/src/index.js
