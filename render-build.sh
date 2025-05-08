#!/bin/bash
# Build script for Render deployment

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Debugging info
echo "📄 Current directory: $(pwd)"
echo "📂 Current directory contents:"
ls -la

# Make sure dist directory exists
mkdir -p dist

# Build frontend with locally installed vite
echo "🏗️ Building frontend..."
npx vite build

# Build backend with esbuild (using production.ts)
echo "🏗️ Building backend..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist --outfile=dist/server.js

# Replace package.json for production
echo "📝 Setting up production package.json..."
cp render-package.json dist/package.json

# Verify the dist directory
echo "📂 Checking dist directory contents:"
ls -la dist

# Create a simple success file to verify the build worked
echo "Render build completed on $(date)" > dist/build-success.txt

echo "✅ Build completed successfully!"
