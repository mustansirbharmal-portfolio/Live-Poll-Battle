#!/bin/bash
# Build script for Render deployment

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend with locally installed vite
echo "🏗️ Building frontend..."
npx vite build

# Build backend with esbuild (using production.ts)
echo "🏗️ Building backend..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist --outfile=dist/server.js

# Replace package.json for production
echo "📝 Setting up production package.json..."
cp render-package.json dist/package.json

echo "✅ Build completed successfully!"
