# Salvebot 🤖

**Open-source SaaS chatbot platform** that lets business owners create intelligent chatbots for their websites using RAG (Retrieval-Augmented Generation) technology.

[![Deploy Frontend](https://github.com/yourusername/salvebot/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/salvebot/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### For Business Owners
- ✅ **Easy Signup & Authentication** - Quick registration with email/password
- ✅ **Document Upload** - Upload PDFs, TXT, MD files or fill business info forms  
- ✅ **Domain Management** - Add and verify business domains
- ✅ **Stripe Billing** - Subscription-based pricing with free trial
- ✅ **Custom Embed Code** - Simple `<script>` tag integration
- ✅ **Secure Deployment** - Chatbot only works on verified domains with active subscriptions

### For Customers
- 🤖 **Intelligent Responses** - RAG-powered answers based on business knowledge
- 💬 **Natural Conversations** - OpenAI GPT-4 powered chat interface
- 📱 **Responsive Widget** - Works on desktop and mobile
- ⚡ **Fast & Reliable** - Global edge deployment via Cloudflare

### For Developers
- 🏗️ **Modern Stack** - Next.js 15, Cloudflare Workers, TypeScript
- 🌐 **Serverless** - No servers to maintain, scales automatically
- 🔓 **Open Source** - MIT license, fork and customize freely
- 📚 **Well Documented** - Comprehensive setup and API documentation

## 🚀 Quick Start

### 1. Fork & Clone
```bash
git clone https://github.com/yourusername/salvebot.git
cd salvebot
```

### 2. Frontend Setup (GitHub Pages)
```bash
cd salvebot-frontend
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
```

### 3. Backend Setup (Cloudflare Workers)
```bash
cd salvebot-backend
npm install
./scripts/setup-secrets.sh  # Set up required secrets
./scripts/deploy.sh         # Deploy to Cloudflare Workers
```

### 4. Configure GitHub Pages
1. Go to your repository settings
2. Enable GitHub Pages with GitHub Actions
3. Push to main branch - automatic deployment!

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Pages  │    │ Cloudflare       │    │   OpenAI API    │
│   (Frontend)    │◄──►│   Workers        │◄──►│   (RAG/Chat)    │
│                 │    │   (Backend)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Cloudflare      │
                    │  Storage         │
                    │  • KV (Data)     │
                    │  • R2 (Files)    │
                    │  • D1 (SQL)      │
                    └──────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS, TypeScript
- **Backend**: Cloudflare Workers, Hono, TypeScript
- **Storage**: Cloudflare KV, R2, D1
- **AI**: OpenAI GPT-4 + Embeddings API
- **Payments**: Stripe Checkout + Webhooks
- **Deployment**: GitHub Actions, GitHub Pages, Wrangler CLI

## 📋 Prerequisites

### Required Accounts
- [GitHub account](https://github.com) (free)
- [Cloudflare account](https://cloudflare.com) (free tier available)
- [OpenAI account](https://openai.com) (pay-per-use)
- [Stripe account](https://stripe.com) (for billing)

### Required Tools
- Node.js 18+
- npm or yarn
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- Git

## 🔧 Detailed Setup

### Frontend Configuration

1. **Environment Variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=https://api.salvebot.workers.dev
   NEXT_PUBLIC_SITE_URL=https://yourusername.github.io/salvebot
   ```

2. **GitHub Pages Setup**:
   - Repository Settings → Pages
   - Source: "GitHub Actions"
   - Push to main branch triggers automatic deployment

### Backend Configuration

1. **Cloudflare Resources**:
   ```bash
   # KV Namespaces
   wrangler kv:namespace create "USERS"
   wrangler kv:namespace create "CHATBOTS"
   wrangler kv:namespace create "DOCUMENTS"
   wrangler kv:namespace create "DOMAINS"
   
   # R2 Bucket
   wrangler r2 bucket create salvebot-files
   
   # D1 Database
   wrangler d1 create salvebot-db
   ```

2. **Required Secrets**:
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   wrangler secret put JWT_SECRET
   ```

3. **Update `wrangler.toml`** with your resource IDs

## 💳 Stripe Setup

1. **Create Products & Prices** in Stripe Dashboard:
   - Starter: $9/month (1 chatbot, 100 conversations, 10 documents)
   - Pro: $29/month (5 chatbots, 1000 conversations, unlimited documents)

2. **Configure Webhooks**:
   - Endpoint: `https://api.salvebot.workers.dev/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_*`

3. **Update Price IDs** in `src/lib/stripe.ts`

## 🤖 RAG Implementation

### Document Processing Pipeline
1. **Upload** → Files stored in Cloudflare R2
2. **Parse** → PDF/text content extraction
3. **Chunk** → Text split into 1000-character chunks
4. **Embed** → OpenAI embeddings generated
5. **Store** → Chunks stored in KV with embeddings

### Query Processing (HyDE Method)
1. **Classify** → Determine message type (question/statement/other)
2. **Generate** → Create hypothetical answer for questions
3. **Embed** → Generate embedding for hypothetical answer
4. **Search** → Find similar chunks via cosine similarity
5. **Respond** → Generate final answer with retrieved context

## 🔒 Security Features

- **Domain Verification**: DNS or file-based domain ownership verification
- **Subscription Enforcement**: Chatbots only work with active subscriptions
- **JWT Authentication**: Secure API access with signed tokens
- **Rate Limiting**: TODO - Prevent abuse and control usage
- **CORS Protection**: Restricted API access from authorized domains

## 📊 Usage Limits

| Plan    | Price  | Chatbots | Conversations/mo | Documents |
|---------|--------|----------|------------------|-----------|
| Starter | $9/mo  | 1        | 100              | 10        |
| Pro     | $29/mo | 5        | 1,000            | Unlimited |

## 🚀 Deployment

### Automated (Recommended)
Push to main branch → GitHub Actions deploys automatically

### Manual
```bash
# Frontend
cd salvebot-frontend
npm run build
npm run deploy

# Backend  
cd salvebot-backend
wrangler deploy
```

## 🔧 Development

### Local Development
```bash
# Frontend (localhost:3000)
cd salvebot-frontend
npm run dev

# Backend (localhost:8787)
cd salvebot-backend  
npm run dev
```

### Testing
```bash
# Frontend
cd salvebot-frontend
npm test

# Backend
cd salvebot-backend
npm test
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user

### Chatbots
- `GET /api/chatbots` - List chatbots
- `POST /api/chatbots` - Create chatbot
- `GET /api/chatbots/:id` - Get chatbot
- `PUT /api/chatbots/:id` - Update chatbot
- `DELETE /api/chatbots/:id` - Delete chatbot

### Chat (Public)
- `POST /api/chat/:chatbotId` - Send message
- `GET /api/chat/widget.js` - Widget JavaScript

See [API Documentation](./docs/api.md) for complete reference.

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication & registration
- [x] Basic chatbot creation & management
- [x] RAG document processing
- [x] OpenAI chat integration
- [x] Stripe billing integration
- [x] Domain verification system
- [x] Chatbot embed widget

### Phase 2: Enhanced Features 🚧
- [ ] File upload interface
- [ ] Analytics dashboard
- [ ] Advanced chatbot customization
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Advanced domain verification

### Phase 3: Scale & Optimize 📋
- [ ] Performance monitoring
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] White-label solutions
- [ ] Enterprise features

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/salvebot/issues)
- 💬 [Discussions](https://github.com/yourusername/salvebot/discussions)
- 📧 [Contact](mailto:support@salvebot.com)

## 🌟 Acknowledgments

Built with amazing open-source tools:
- [Next.js](https://nextjs.org/) - React framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [OpenAI](https://openai.com/) - AI models
- [Stripe](https://stripe.com/) - Payment processing
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

**Made with ❤️ by the open-source community**

*Salvebot is completely open-source and free to use. Fork it, customize it, and deploy your own version!*