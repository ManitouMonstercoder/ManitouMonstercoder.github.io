# Salvebot Backend

Cloudflare Workers backend with RAG functionality for the Salvebot SaaS chatbot platform.

## Features

- 🚀 **Cloudflare Workers** - Serverless backend with global edge deployment
- 🤖 **RAG System** - Retrieval-Augmented Generation with OpenAI embeddings
- 🔒 **JWT Authentication** - Secure user authentication and authorization
- 💳 **Stripe Integration** - Subscription billing and payment processing
- 📁 **File Processing** - PDF and text document processing with embeddings
- 🌐 **Domain Verification** - Secure domain validation for chatbot deployment
- 📊 **Analytics** - Chat message logging and usage tracking
- 🎯 **Real-time Chat** - WebSocket-like chat functionality via Durable Objects

## Architecture

### Services Used

- **Cloudflare Workers** - Serverless compute
- **Cloudflare KV** - Key-value storage for users, chatbots, documents
- **Cloudflare R2** - Object storage for uploaded files
- **Cloudflare D1** - SQL database for relational data
- **Cloudflare Durable Objects** - Stateful chat sessions
- **OpenAI API** - Embeddings and chat completions
- **Stripe API** - Payment processing and subscription management

### Data Flow

1. **User Authentication**: JWT tokens stored in KV
2. **Document Upload**: Files stored in R2, processed with RAG, chunks stored in KV
3. **Chat Requests**: Domain verification → RAG query → OpenAI response
4. **Billing**: Stripe webhooks update subscription status in KV

## Quick Start

### Prerequisites

- [Cloudflare account](https://cloudflare.com)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
- OpenAI API key
- Stripe account (for billing)

### Setup

1. **Clone and install dependencies**
   ```bash
   cd salvebot-backend
   npm install
   ```

2. **Configure Cloudflare resources**
   ```bash
   # Create KV namespaces
   wrangler kv:namespace create "USERS"
   wrangler kv:namespace create "CHATBOTS"
   wrangler kv:namespace create "DOCUMENTS"
   wrangler kv:namespace create "DOMAINS"
   
   # Create R2 bucket
   wrangler r2 bucket create salvebot-files
   
   # Create D1 database
   wrangler d1 create salvebot-db
   ```

3. **Update wrangler.toml** with your resource IDs

4. **Set environment secrets**
   ```bash
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET
   wrangler secret put OPENAI_API_KEY
   wrangler secret put JWT_SECRET
   ```

5. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Chatbots
- `GET /api/chatbots` - List user's chatbots
- `POST /api/chatbots` - Create new chatbot
- `GET /api/chatbots/:id` - Get chatbot details
- `PUT /api/chatbots/:id` - Update chatbot
- `DELETE /api/chatbots/:id` - Delete chatbot

### Chat
- `POST /api/chat/:chatbotId` - Send chat message (public endpoint)
- `GET /api/chat/widget.js` - Chatbot widget JavaScript

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Files & Domains (TODO)
- `POST /api/files/upload` - Upload documents
- `POST /api/domains/verify` - Verify domain ownership
- `POST /api/billing/create-checkout` - Create Stripe checkout
- `POST /api/billing/create-portal` - Create billing portal

## Development

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### View Logs
```bash
npm run tail
```

## Configuration

### Environment Variables

Set in `wrangler.toml`:
- `ENVIRONMENT` - 'development' or 'production'
- `CORS_ORIGIN` - Allowed frontend origin
- `JWT_SECRET` - JWT signing secret
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key

### Secrets

Set via `wrangler secret put`:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `OPENAI_API_KEY` - OpenAI API key

## RAG Implementation

### Document Processing Pipeline

1. **Upload**: Files uploaded to R2 bucket
2. **Parse**: PDF/text content extraction
3. **Chunk**: Text split into 1000-character chunks with overlap
4. **Embed**: OpenAI embeddings generated for each chunk
5. **Store**: Chunks and embeddings stored in KV

### Query Processing

1. **Classify**: Determine if message is question/statement/other
2. **HyDE**: Generate hypothetical answer for questions
3. **Embed**: Create embedding for query/hypothetical answer
4. **Search**: Find top-K similar chunks via cosine similarity
5. **Generate**: Create response using retrieved context

### Chat Widget

The widget JavaScript provides:
- Floating chat button
- Chat interface with message history
- Real-time messaging via fetch API
- Domain validation
- Session management

## Security

### Domain Verification
- Chatbots only work on verified domains
- Verification via DNS records or file upload
- Domain matching enforced on every request

### Subscription Enforcement
- Active subscription required for chatbot usage
- Trial period supported (14 days)
- Stripe webhooks update subscription status

### Rate Limiting
- TODO: Implement rate limiting per domain/user
- TODO: Add request authentication for sensitive endpoints

## Monitoring

### Logging
- All requests logged via Hono logger middleware
- Error tracking with structured logging
- Chat analytics stored for dashboard

### Metrics
- TODO: Add Cloudflare Analytics
- TODO: Track usage metrics for billing
- TODO: Monitor API performance

## Deployment

### Production Deployment
```bash
npm run deploy
```

### Environment-specific Deployments
```bash
# Development
wrangler deploy --env development

# Production  
wrangler deploy --env production
```

### Database Migrations
```bash
# Run D1 migrations (when implemented)
wrangler d1 migrations apply salvebot-db
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Deploy to development environment
6. Submit a pull request

## License

MIT License - see LICENSE file for details.