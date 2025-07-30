#!/bin/bash

# Salvebot Status Checker
# This script checks if everything is properly configured and deployed

echo "🔍 Salvebot Deployment Status Check"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "📋 Prerequisites:"
command -v wrangler >/dev/null 2>&1
print_status $? "Wrangler CLI installed"

command -v npm >/dev/null 2>&1
print_status $? "npm installed"

cd salvebot-backend 2>/dev/null
if [ $? -eq 0 ]; then
    print_status 0 "Backend directory exists"
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_status 0 "Backend dependencies installed"
    else
        print_status 1 "Backend dependencies not installed (run: npm install)"
    fi
else
    print_status 1 "Backend directory not found"
fi

cd ..

cd salvebot-frontend 2>/dev/null
if [ $? -eq 0 ]; then
    print_status 0 "Frontend directory exists"
    
    # Check if dependencies are installed
    if [ -d "node_modules" ]; then
        print_status 0 "Frontend dependencies installed"
    else
        print_status 1 "Frontend dependencies not installed (run: npm install)"
    fi
    
    # Check environment file
    if [ -f ".env.local" ]; then
        print_status 0 "Frontend environment file exists"
    else
        print_status 1 "Frontend .env.local file missing"
    fi
else
    print_status 1 "Frontend directory not found"
fi

cd ..

echo ""
echo "🔐 Authentication:"

# Check Cloudflare authentication
wrangler whoami >/dev/null 2>&1
print_status $? "Cloudflare authenticated (run: wrangler login if failed)"

echo ""
echo "🗄️  Backend Configuration:"

cd salvebot-backend 2>/dev/null
if [ $? -eq 0 ]; then
    # Check secrets
    secrets_output=$(wrangler secret list 2>/dev/null)
    if [ $? -eq 0 ]; then
        if echo "$secrets_output" | grep -q "OPENAI_API_KEY"; then
            print_status 0 "OpenAI API key configured"
        else
            print_status 1 "OpenAI API key missing"
        fi
        
        if echo "$secrets_output" | grep -q "STRIPE_SECRET_KEY"; then
            print_status 0 "Stripe secret key configured"
        else
            print_status 1 "Stripe secret key missing"
        fi
        
        if echo "$secrets_output" | grep -q "JWT_SECRET"; then
            print_status 0 "JWT secret configured"
        else
            print_status 1 "JWT secret missing"
        fi
        
        if echo "$secrets_output" | grep -q "STRIPE_WEBHOOK_SECRET"; then
            print_status 0 "Stripe webhook secret configured"
        else
            print_status 1 "Stripe webhook secret missing"
        fi
    else
        print_warning "Could not check secrets (authentication required)"
    fi
    
    # Try to get deployment status
    deploy_status=$(wrangler deployments list 2>/dev/null | head -n 2)
    if [ $? -eq 0 ] && [ -n "$deploy_status" ]; then
        print_status 0 "Backend deployed to Cloudflare Workers"
        print_info "Latest deployment:"
        echo "$deploy_status"
    else
        print_status 1 "Backend not deployed (run: wrangler deploy)"
    fi
fi

cd ..

echo ""
echo "🌐 Frontend Status:"

cd salvebot-frontend 2>/dev/null
if [ $? -eq 0 ]; then
    # Check if build directory exists
    if [ -d "out" ]; then
        print_status 0 "Frontend build exists"
    else
        print_status 1 "Frontend not built (run: npm run build)"
    fi
    
    # Check environment variables
    if [ -f ".env.local" ]; then
        if grep -q "NEXT_PUBLIC_API_URL.*workers.dev" .env.local; then
            print_status 0 "API URL configured in environment"
        else
            print_warning "API URL needs to be updated with your Workers URL"
        fi
        
        if grep -q "NEXT_PUBLIC_SITE_URL.*github.io" .env.local; then
            print_status 0 "Site URL configured in environment"
        else
            print_warning "Site URL needs to be updated with your GitHub Pages URL"
        fi
    fi
fi

cd ..

echo ""
echo "📊 Summary:"

# Count issues
cd salvebot-backend 2>/dev/null
missing_secrets=0
if [ $? -eq 0 ]; then
    secrets_output=$(wrangler secret list 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$secrets_output" | grep -q "OPENAI_API_KEY" || ((missing_secrets++))
        echo "$secrets_output" | grep -q "STRIPE_SECRET_KEY" || ((missing_secrets++))
        echo "$secrets_output" | grep -q "JWT_SECRET" || ((missing_secrets++))
        echo "$secrets_output" | grep -q "STRIPE_WEBHOOK_SECRET" || ((missing_secrets++))
    fi
fi
cd ..

if [ $missing_secrets -eq 0 ]; then
    echo -e "${GREEN}🎉 Everything looks good! Your Salvebot is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your deployment with the TEST_GUIDE.md"
    echo "2. Configure Stripe products and webhooks"
    echo "3. Create your first chatbot!"
else
    echo -e "${YELLOW}⚠️  $missing_secrets secrets still need to be configured.${NC}"
    echo ""
    echo "Run this to set up missing secrets:"
    echo "  cd salvebot-backend && ./scripts/setup-secrets.sh"
fi

echo ""
echo "📚 Need help?"
echo "- QUICK_START.md - Fast deployment guide"
echo "- DEPLOYMENT_GUIDE.md - Detailed setup instructions"
echo "- TEST_GUIDE.md - Testing procedures"