# 🚀 Salvebot Quick Start

**Everything is ready for deployment!** Follow these steps to launch your Salvebot instance.

## ✅ What's Been Prepared

- ✅ **Complete Frontend** - Next.js app with GitHub Pages configuration
- ✅ **Complete Backend** - Cloudflare Workers with RAG functionality
- ✅ **Authentication System** - JWT-based user management
- ✅ **Stripe Integration** - Subscription billing ready
- ✅ **Chat Widget** - Embeddable chatbot widget
- ✅ **Deployment Scripts** - Automated setup scripts
- ✅ **Documentation** - Comprehensive guides and testing

## 🎯 Action Plan - Follow These Steps

### Step 1: Cloudflare Authentication
```bash
cd salvebot-backend
wrangler login
```
This opens your browser to authenticate with Cloudflare.

### Step 2: Run Complete Setup
```bash
./scripts/setup-all.sh
```
This script will:
- Create all KV namespaces
- Create R2 bucket
- Create D1 database
- Help you set secrets
- Deploy the backend

### Step 3: Get Your API Keys
You'll need these during setup:

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy key (starts with `sk-proj-` or `sk-`)

**Stripe Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy "Secret key" (starts with `sk_test_`)
3. For webhooks: Create endpoint later

**JWT Secret:**
- Generate a secure random string (32+ characters)
- Example: `your-super-secure-jwt-secret-key-here-32chars`

### Step 4: Deploy Frontend
1. **Fork this repository** to your GitHub account
2. **Update environment variables**:
   ```bash
   cd salvebot-frontend
   # Edit .env.local with your actual URLs
   ```
3. **Enable GitHub Pages**:
   - Repository Settings → Pages
   - Source: "GitHub Actions"
4. **Push to main branch** - Automatic deployment!

### Step 5: Configure Stripe
1. **Create Products** in Stripe Dashboard:
   - Starter: $9/month
   - Pro: $29/month
2. **Create Webhook**:
   - URL: `https://[your-workers-url]/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_*`
3. **Update webhook secret**: `wrangler secret put STRIPE_WEBHOOK_SECRET`

### Step 6: Test Everything
Follow the [TEST_GUIDE.md](./TEST_GUIDE.md) to verify:
- ✅ User registration/login
- ✅ Chatbot creation
- ✅ Chat widget functionality
- ✅ Stripe billing

## 📋 Required Accounts

Make sure you have these accounts set up:

- [x] **GitHub** - For hosting frontend
- [ ] **Cloudflare** - For backend deployment ([Sign up free](https://dash.cloudflare.com/sign-up))
- [ ] **OpenAI** - For AI functionality ([Get API key](https://platform.openai.com/api-keys))
- [ ] **Stripe** - For billing ([Create account](https://dashboard.stripe.com/register))

## 🛠️ What Happens During Setup

### Backend Setup (`./scripts/setup-all.sh`):
1. Creates KV namespaces for data storage
2. Creates R2 bucket for file uploads
3. Creates D1 database for relational data
4. Prompts for API keys and secrets
5. Deploys backend to Cloudflare Workers
6. Provides your API URL

### Frontend Setup (GitHub Actions):
1. Builds Next.js application
2. Exports static files
3. Deploys to GitHub Pages
4. Available at `https://yourusername.github.io/salvebot`

## 🔧 Customization Options

After deployment, you can customize:

### Branding
- Update colors in `salvebot-frontend/app/globals.css`
- Replace logo and icons
- Modify landing page content

### Features
- Add more chatbot customization options
- Implement file upload interface
- Add analytics dashboard
- Create team collaboration features

### Pricing
- Modify plans in `salvebot-backend/src/lib/stripe.ts`
- Update pricing page
- Add more subscription tiers

## 🎯 Success Metrics

You'll know it's working when:

- ✅ Users can sign up and create accounts
- ✅ Chatbots can be created and configured
- ✅ Chat widget appears on test websites
- ✅ Chat responds intelligently (with uploaded docs)
- ✅ Stripe billing processes correctly
- ✅ Domain verification protects access

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**:
   ```bash
   cd salvebot-backend
   wrangler tail
   ```

2. **Common solutions**:
   - Verify all secrets are set: `wrangler secret list`
   - Check API endpoint URLs match
   - Ensure Cloudflare resources were created
   - Test with Stripe test mode first

3. **Documentation**:
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed setup
   - [TEST_GUIDE.md](./TEST_GUIDE.md) - Testing procedures
   - [README.md](./README.md) - Project overview

## 🚀 Ready to Launch?

Your Salvebot platform is ready to deploy! The entire setup takes about 15-20 minutes with all the automated scripts.

**Start with Step 1 above** and you'll have a fully functional SaaS chatbot platform running on free-tier services (Cloudflare, GitHub Pages) with pay-per-use OpenAI integration.

**Good luck!** 🎉