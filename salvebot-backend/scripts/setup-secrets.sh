#!/bin/bash

# Salvebot Secrets Setup Script
# This script helps you set up all required Cloudflare Workers secrets

set -e

echo "🔑 Setting up Salvebot secrets..."
echo ""
echo "This script will help you set up all required secrets for the Salvebot backend."
echo "You'll be prompted to enter each secret value."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    
    echo "Setting up: $secret_name"
    echo "Description: $description"
    echo "Example format: $example"
    echo ""
    
    read -s -p "Enter $secret_name: " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "❌ Empty value provided. Skipping $secret_name"
        return
    fi
    
    echo "$secret_value" | wrangler secret put "$secret_name"
    echo "✅ $secret_name set successfully"
    echo ""
}

# Set OpenAI API Key
set_secret "OPENAI_API_KEY" \
    "Your OpenAI API key for RAG functionality" \
    "sk-proj-..."

# Set Stripe Secret Key
set_secret "STRIPE_SECRET_KEY" \
    "Your Stripe secret key for payment processing" \
    "sk_live_... or sk_test_..."

# Set Stripe Webhook Secret
set_secret "STRIPE_WEBHOOK_SECRET" \
    "Your Stripe webhook signing secret" \
    "whsec_..."

# Set JWT Secret
set_secret "JWT_SECRET" \
    "A secure random string for JWT token signing (generate a strong 32+ character string)" \
    "a-very-secure-random-string-for-jwt-signing"

echo "🎉 All secrets have been set up!"
echo ""
echo "To verify your secrets are set correctly, run:"
echo "  wrangler secret list"
echo ""
echo "You can now proceed with deployment:"
echo "  npm run deploy"