#!/bin/bash
# Build script for Render deployment

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend with locally installed vite
echo "🏗️ Building frontend..."
npx vite build

# Build backend with esbuild
echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
