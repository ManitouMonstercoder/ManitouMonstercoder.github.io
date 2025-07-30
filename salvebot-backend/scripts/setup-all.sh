#!/bin/bash

# Salvebot Complete Setup Script
# This script sets up everything needed for Salvebot deployment

set -e

echo "🚀 Salvebot Complete Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step "📋 Checking prerequisites..."

if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare."
    echo "Please run: wrangler login"
    echo "Then run this script again."
    exit 1
fi

print_success "Prerequisites check passed"

# Step 1: Create KV Namespaces
print_step "🗄️  Creating KV Namespaces..."

create_kv_namespace() {
    local name=$1
    echo "Creating KV namespace: $name"
    
    # Create production namespace
    local prod_output=$(wrangler kv:namespace create "$name" 2>/dev/null || echo "already exists")
    if [[ $prod_output != *"already exists"* ]]; then
        echo "Production namespace created: $prod_output"
    fi
    
    # Create preview namespace
    local preview_output=$(wrangler kv:namespace create "$name" --preview 2>/dev/null || echo "already exists")
    if [[ $preview_output != *"already exists"* ]]; then
        echo "Preview namespace created: $preview_output"
    fi
}

create_kv_namespace "USERS"
create_kv_namespace "CHATBOTS"
create_kv_namespace "DOCUMENTS"
create_kv_namespace "DOMAINS"

print_success "KV Namespaces created"

# Step 2: Create R2 Bucket
print_step "🪣 Creating R2 Bucket..."
wrangler r2 bucket create salvebot-files || print_warning "Bucket might already exist"
print_success "R2 Bucket ready"

# Step 3: Create D1 Database
print_step "🗃️  Creating D1 Database..."
wrangler d1 create salvebot-db || print_warning "Database might already exist"
print_success "D1 Database ready"

# Step 4: Manual configuration warning
print_step "⚠️  Manual Configuration Required"
echo ""
print_warning "You need to manually update wrangler.toml with the IDs from above!"
echo ""
echo "Also, you need to set the following secrets:"
echo "  wrangler secret put OPENAI_API_KEY"
echo "  wrangler secret put STRIPE_SECRET_KEY"
echo "  wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "  wrangler secret put JWT_SECRET"
echo ""
echo "Would you like to set secrets now? (y/n)"
read -p "> " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "🔑 Setting up secrets..."
    
    echo "Enter your OpenAI API Key (starts with sk-proj- or sk-):"
    read -s openai_key
    if [ ! -z "$openai_key" ]; then
        echo "$openai_key" | wrangler secret put OPENAI_API_KEY
        print_success "OpenAI API key set"
    fi
    
    echo "Enter your Stripe Secret Key (starts with sk_test_ or sk_live_):"
    read -s stripe_key
    if [ ! -z "$stripe_key" ]; then
        echo "$stripe_key" | wrangler secret put STRIPE_SECRET_KEY
        print_success "Stripe secret key set"
    fi
    
    echo "Enter your Stripe Webhook Secret (starts with whsec_):"
    read -s webhook_secret
    if [ ! -z "$webhook_secret" ]; then
        echo "$webhook_secret" | wrangler secret put STRIPE_WEBHOOK_SECRET
        print_success "Stripe webhook secret set"
    fi
    
    echo "Enter a secure JWT secret (32+ characters):"
    read -s jwt_secret
    if [ ! -z "$jwt_secret" ]; then
        echo "$jwt_secret" | wrangler secret put JWT_SECRET
        print_success "JWT secret set"
    fi
fi

# Step 5: Check if ready to deploy
print_step "🚀 Deployment Check"
echo ""

secrets_count=$(wrangler secret list 2>/dev/null | grep -c ":" || echo "0")
if [ "$secrets_count" -ge 4 ]; then
    print_success "All secrets are set!"
    echo ""
    echo "Ready to deploy? (y/n)"
    read -p "> " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "🌐 Deploying to Cloudflare Workers..."
        wrangler deploy
        print_success "Backend deployed successfully!"
        
        echo ""
        echo "🎉 Setup Complete!"
        echo "=================="
        echo ""
        echo "Your Salvebot backend is now live!"
        echo "📡 API URL: Check the output above for your Workers URL"
        echo ""
        echo "Next steps:"
        echo "1. Update your frontend environment variables"
        echo "2. Set up Stripe products and webhooks"
        echo "3. Deploy your frontend to GitHub Pages"
        echo "4. Test everything!"
        echo ""
        echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
    fi
else
    print_warning "Not all secrets are set. Please set them manually:"
    echo "  wrangler secret put OPENAI_API_KEY"
    echo "  wrangler secret put STRIPE_SECRET_KEY"
    echo "  wrangler secret put STRIPE_WEBHOOK_SECRET"
    echo "  wrangler secret put JWT_SECRET"
    echo ""
    echo "Then run: wrangler deploy"
fi

print_success "Setup script completed!"