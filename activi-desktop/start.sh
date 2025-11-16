#!/bin/bash
set -e

echo "=== Activi.ai Desktop Agent Setup ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Start app
echo "🚀 Starting Activi.ai Desktop Agent..."
npm start
