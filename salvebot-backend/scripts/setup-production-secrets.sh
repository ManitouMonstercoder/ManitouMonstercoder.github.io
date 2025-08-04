#!/bin/bash

# Salvebot Production Secrets Setup Script
# Run this script to configure all required API keys for production deployment

echo "🔑 Setting up Salvebot Production API Keys"
echo "========================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo "🔍 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Cloudflare authentication verified"
echo ""

# 1. JWT Secret (for authentication tokens)
echo "1️⃣ Setting up JWT_SECRET..."
echo "This is used for signing authentication tokens (can be any strong random string)"
read -p "Enter JWT_SECRET (press Enter to generate a random one): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "Generated random JWT_SECRET: $JWT_SECRET"
fi

echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
echo "✅ JWT_SECRET configured"
echo ""

# 2. OpenAI API Key (for RAG functionality)
echo "2️⃣ Setting up OPENAI_API_KEY..."
echo "Get your API key from: https://platform.openai.com/api-keys"
echo "Required for RAG document processing and chat responses"
read -p "Enter your OpenAI API key (sk-...): " OPENAI_API_KEY

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OpenAI API key is required for RAG functionality"
    exit 1
fi

echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY
echo "✅ OPENAI_API_KEY configured"
echo ""

# 3. Stripe Secret Key (for payments)
echo "3️⃣ Setting up STRIPE_SECRET_KEY..."
echo "Get your secret key from: https://dashboard.stripe.com/apikeys"
echo "Use live key (sk_live_...) for production or test key (sk_test_...) for testing"
read -p "Enter your Stripe secret key: " STRIPE_SECRET_KEY

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Stripe secret key is required for payment processing"
    exit 1
fi

echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY
echo "✅ STRIPE_SECRET_KEY configured"
echo ""

# 4. Stripe Webhook Secret (for webhook verification)
echo "4️⃣ Setting up STRIPE_WEBHOOK_SECRET..."
echo "This will be generated after creating the webhook endpoint"
echo "Create webhook at: https://dashboard.stripe.com/webhooks"
echo "Webhook URL: https://salvebot-api.fideleamazing.workers.dev/api/webhooks/stripe"
echo "Events: customer.subscription.*, invoice.payment_*"
read -p "Enter Stripe webhook secret (whsec_...): " STRIPE_WEBHOOK_SECRET

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "⚠️  Stripe webhook secret not provided. You can add it later with:"
    echo "echo 'your_webhook_secret' | wrangler secret put STRIPE_WEBHOOK_SECRET"
else
    echo "$STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET
    echo "✅ STRIPE_WEBHOOK_SECRET configured"
fi
echo ""

# Verify secrets are set
echo "🔍 Verifying configured secrets..."
wrangler secret list

echo ""
echo "🎉 Production secrets setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy the backend: wrangler deploy"
echo "2. Create Stripe webhook endpoint if not done already"
echo "3. Test the API endpoints"
echo ""
echo "🔗 Useful links:"
echo "- OpenAI API Keys: https://platform.openai.com/api-keys"
echo "- Stripe Dashboard: https://dashboard.stripe.com/apikeys"
echo "- Stripe Webhooks: https://dashboard.stripe.com/webhooks"