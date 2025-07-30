# 🚀 Salvebot Deployment Guide

This guide will walk you through deploying Salvebot step by step.

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
- [ ] **OpenAI Account** - [Get API key](https://platform.openai.com/api-keys)
- [ ] **Stripe Account** - [Create account](https://dashboard.stripe.com/register)
- [ ] **GitHub Account** - [Sign up](https://github.com)
- [ ] **Node.js 18+** installed
- [ ] **Git** installed

## 🛠️ Step 1: Backend Deployment

### 1.1 Cloudflare Authentication
```bash
cd salvebot-backend
wrangler login
```
This will open your browser to authenticate with Cloudflare.

### 1.2 Create Cloudflare Resources
```bash
# Create KV Namespaces
wrangler kv:namespace create "USERS"
wrangler kv:namespace create "USERS" --preview
wrangler kv:namespace create "CHATBOTS"
wrangler kv:namespace create "CHATBOTS" --preview
wrangler kv:namespace create "DOCUMENTS"
wrangler kv:namespace create "DOCUMENTS" --preview
wrangler kv:namespace create "DOMAINS"
wrangler kv:namespace create "DOMAINS" --preview

# Create R2 Bucket
wrangler r2 bucket create salvebot-files

# Create D1 Database
wrangler d1 create salvebot-db
```

### 1.3 Update wrangler.toml
Copy the namespace IDs from the previous commands and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "USERS"
id = "your-actual-namespace-id-here"
preview_id = "your-actual-preview-id-here"

# Repeat for CHATBOTS, DOCUMENTS, DOMAINS

[[d1_databases]]
binding = "DB"
database_name = "salvebot-db"
database_id = "your-actual-database-id-here"
```

### 1.4 Set Secrets
```bash
# OpenAI API Key
wrangler secret put OPENAI_API_KEY
# Enter: sk-proj-your-openai-key

# Stripe Secret Key
wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_test_your-stripe-secret-key (or sk_live_ for production)

# Stripe Webhook Secret (get this after creating webhook)
wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_your-webhook-secret

# JWT Secret (generate a random 32+ character string)
wrangler secret put JWT_SECRET
# Enter: your-super-secure-random-jwt-secret-key-here
```

### 1.5 Deploy Backend
```bash
wrangler deploy
```

✅ Your backend will be available at: `https://salvebot-api.your-subdomain.workers.dev`

## 🌐 Step 2: Frontend Deployment

### 2.1 Fork Repository
1. Go to your Salvebot repository on GitHub
2. Click "Fork" to create your own copy

### 2.2 Update Environment Variables
Edit `salvebot-frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://salvebot-api.your-subdomain.workers.dev
NEXT_PUBLIC_SITE_URL=https://yourusername.github.io/salvebot
```

### 2.3 Enable GitHub Pages
1. Go to repository Settings → Pages
2. Source: "GitHub Actions"
3. Commit and push your changes to main branch

### 2.4 Deploy
Push to main branch triggers automatic deployment via GitHub Actions.

✅ Your frontend will be available at: `https://yourusername.github.io/salvebot`

## 💳 Step 3: Configure Stripe

### 3.1 Create Products
In Stripe Dashboard → Products:

**Starter Plan:**
- Name: "Starter"
- Price: $9.00 USD / month
- Copy the Price ID (e.g., `price_1234...`)

**Pro Plan:**
- Name: "Pro"
- Price: $29.00 USD / month
- Copy the Price ID

### 3.2 Update Price IDs
Edit `salvebot-backend/src/lib/stripe.ts`:
```typescript
static readonly PLANS = {
  starter: {
    priceId: 'price_your_actual_starter_price_id',
    // ...
  },
  pro: {
    priceId: 'price_your_actual_pro_price_id',
    // ...
  }
}
```

### 3.3 Create Webhook
1. Stripe Dashboard → Webhooks → Add endpoint
2. Endpoint URL: `https://salvebot-api.your-subdomain.workers.dev/api/webhooks/stripe`
3. Events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update the secret: `wrangler secret put STRIPE_WEBHOOK_SECRET`

### 3.4 Redeploy Backend
```bash
wrangler deploy
```

## 🧪 Step 4: Testing

### 4.1 Test Authentication
1. Visit your frontend URL
2. Click "Sign Up"
3. Create an account
4. Verify you can sign in

### 4.2 Test Chatbot Creation
1. Go to Dashboard
2. Click "New Chatbot"
3. Enter name and domain
4. Verify chatbot is created

### 4.3 Test Chat Widget
1. Get the embed code from your chatbot
2. Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>Test Page</h1>
  <!-- Paste your embed code here -->
</body>
</html>
```
3. Open in browser and test chat

### 4.4 Test Billing
1. Try to create a subscription
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify subscription status updates

## 🎯 Step 5: Production Setup

### 5.1 Domain Setup (Optional)
If you want custom domains:

**Frontend:**
1. Buy domain (e.g., `salvebot.com`)
2. Configure GitHub Pages custom domain
3. Update CNAME records

**Backend:**
1. Add custom domain in Cloudflare Workers
2. Update API URLs in frontend

### 5.2 Security Checklist
- [ ] Use production Stripe keys
- [ ] Set strong JWT secret
- [ ] Configure CORS origins properly
- [ ] Set up monitoring/alerts
- [ ] Test all webhooks

### 5.3 Monitoring
1. Cloudflare Analytics for Workers
2. Stripe Dashboard for payments
3. OpenAI Usage dashboard
4. GitHub Pages analytics

## 🆘 Troubleshooting

### Common Issues

**Wrangler Authentication Failed:**
```bash
wrangler logout
wrangler login
```

**KV Namespace Not Found:**
- Check namespace IDs in `wrangler.toml`
- Ensure namespaces were created successfully

**Stripe Webhook Errors:**
- Verify webhook URL is correct
- Check webhook signing secret
- Test with Stripe CLI: `stripe listen --forward-to localhost:8787/api/webhooks/stripe`

**CORS Errors:**
- Check `CORS_ORIGIN` in `wrangler.toml`
- Ensure frontend and backend URLs match

**OpenAI API Errors:**
- Verify API key is set correctly
- Check OpenAI account has credits
- Monitor usage limits

## 🎉 Success!

If everything is working:
- ✅ Users can sign up and create chatbots
- ✅ Chat widget responds intelligently
- ✅ Billing and subscriptions work
- ✅ Domain verification protects access

Your Salvebot instance is now live and ready for customers!

## 📞 Support

- [GitHub Issues](https://github.com/yourusername/salvebot/issues)
- [Documentation](./README.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Stripe API Docs](https://stripe.com/docs/api)