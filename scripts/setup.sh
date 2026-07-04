#!/bin/bash
# DealDoor - Setup Script

set -e

echo "🚀 Setting up DealDoor..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "# Add your environment variables here" > .env
fi

# Setup database
echo "🗄️ Setting up database..."
pnpm db:push

# Seed database
echo "🌱 Seeding database..."
pnpm db:seed

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p public/uploads/covers
mkdir -p public/uploads/logos
mkdir -p public/uploads/deals
mkdir -p public/uploads/menu

# Create logs directory
mkdir -p logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm dev' to start development server"
echo "  2. Open http://localhost:4321"
echo ""
echo "Test account:"
echo "  Email: test@dealdoor.co"
echo "  Password: password123"
