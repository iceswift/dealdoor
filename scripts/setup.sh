#!/bin/bash
# DealDoor - Setup Script

set -e

echo "🚀 Setting up DealDoor..."
echo ""

# Check Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun 1.1+"
    echo "   Install: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Copy env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "# Add your environment variables here" > .env
fi

# Setup database
echo "🗄️ Setting up database..."
bun run db:push

# Seed database
echo "🌱 Seeding database..."
bun run db:seed

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
echo "  1. Run 'bun dev' to start development server"
echo "  2. Open http://localhost:4321"
echo ""
echo "Test account:"
echo "  Email: test@dealdoor.co"
echo "  Password: password123"
