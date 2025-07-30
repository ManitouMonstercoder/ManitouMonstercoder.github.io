#!/bin/bash

# Salvebot Backend Deployment Script
# This script sets up and deploys the Cloudflare Workers backend

set -e

echo "🚀 Starting Salvebot backend deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Authenticate with Cloudflare (if not already authenticated)
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please authenticate with Cloudflare:"
    wrangler login
fi

echo "📦 Installing dependencies..."
npm install

# Create KV namespaces if they don't exist
echo "🗄️  Setting up KV namespaces..."

create_kv_namespace() {
    local name=$1
    echo "Creating KV namespace: $name"
    
    # Create production namespace
    wrangler kv:namespace create "$name" || echo "Namespace $name might already exist"
    
    # Create preview namespace
    wrangler kv:namespace create "$name" --preview || echo "Preview namespace $name might already exist"
}

create_kv_namespace "USERS"
create_kv_namespace "CHATBOTS" 
create_kv_namespace "DOCUMENTS"
create_kv_namespace "DOMAINS"

# Create R2 bucket
echo "🪣 Setting up R2 bucket..."
wrangler r2 bucket create salvebot-files || echo "Bucket might already exist"

# Create D1 database
echo "🗃️  Setting up D1 database..."
wrangler d1 create salvebot-db || echo "Database might already exist"

# Set up secrets
echo "🔑 Setting up secrets..."
echo "Please set the following secrets manually:"
echo "  wrangler secret put OPENAI_API_KEY"
echo "  wrangler secret put STRIPE_SECRET_KEY"  
echo "  wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "  wrangler secret put JWT_SECRET"
echo ""
echo "You can also set them all at once by running:"
echo "  ./scripts/setup-secrets.sh"
echo ""

read -p "Have you set up all required secrets? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set up secrets first, then run this script again."
    exit 1
fi

# Deploy to Cloudflare Workers
echo "🌐 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your Salvebot backend is now live!"
echo "📡 API URL: https://api.salvebot.workers.dev"
echo ""
echo "Next steps:"
echo "1. Update your frontend environment variables with the API URL"
echo "2. Configure your Stripe webhook endpoint"
echo "3. Test the API endpoints"
echo ""
echo "Need help? Check the README.md file for detailed setup instructions."