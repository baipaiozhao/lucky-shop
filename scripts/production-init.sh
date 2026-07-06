#!/bin/bash
# Production initialization script for Railway
# This script runs database migrations and seeds on first deploy

echo "Starting production initialization..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database (optional - only on first deploy)
echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Production initialization complete!"
