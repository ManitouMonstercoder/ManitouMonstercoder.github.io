# Salvebot Frontend

Open-source SaaS chatbot platform frontend built with Next.js and designed for GitHub Pages deployment.

## Features

- 🚀 **Next.js 15** with App Router and React 19
- 🎨 **Tailwind CSS 4** with shadcn/ui components
- 📱 **Responsive Design** - Mobile and desktop optimized
- 🔒 **Authentication** - Sign up, sign in, and user management
- 💳 **Stripe Integration** - Subscription-based billing
- 🤖 **Chatbot Management** - Create and manage AI chatbots
- 📊 **Analytics Dashboard** - Monitor chatbot performance
- 🌐 **Domain Verification** - Secure domain validation
- 📁 **File Management** - Upload and organize business documents

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/salvebot.git
   cd salvebot/salvebot-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_API_URL=https://api.salvebot.workers.dev
   NEXT_PUBLIC_SITE_URL=https://yourusername.github.io/salvebot
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## GitHub Pages Deployment

This frontend is configured for GitHub Pages deployment with static export.

### Automatic Deployment

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings
3. **Set source to GitHub Actions**
4. **Push to main branch** - GitHub Actions will automatically build and deploy

### Manual Deployment

```bash
# Build and export static files
npm run build

# Deploy to GitHub Pages (requires gh-pages package)
npm run deploy
```

## Environment Configuration

### Required Environment Variables

- `NEXT_PUBLIC_API_URL` - Cloudflare Workers API endpoint
- `NEXT_PUBLIC_SITE_URL` - Your GitHub Pages URL

### Development vs Production

The app automatically detects the environment:
- **Development**: API calls to localhost or development Workers
- **Production**: API calls to production Cloudflare Workers endpoint

## Project Structure

```
salvebot-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── signin/           # Authentication pages
│   ├── signup/
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json
```

## Key Features

### Authentication System
- User registration and login
- JWT-based session management
- Protected routes and middleware

### Dashboard Interface
- Chatbot management and creation
- File upload and document management
- Domain verification and settings
- Subscription and billing management
- Analytics and usage tracking

### Chatbot Integration
- Custom embed code generation
- Domain-restricted chatbot activation
- Real-time chat interface
- RAG-powered responses

## Customization

### Styling
- Built with Tailwind CSS 4
- Uses shadcn/ui component library
- Easy theme customization via CSS variables
- Responsive design patterns

### Components
- Modular component architecture
- TypeScript for type safety
- Reusable UI components
- Form validation with Zod

## API Integration

The frontend communicates with the Cloudflare Workers backend:

- **Authentication**: `/api/auth/*`
- **Chatbots**: `/api/chatbots/*`
- **Files**: `/api/files/*`
- **Domains**: `/api/domains/*`
- **Billing**: `/api/billing/*`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- [Documentation](https://github.com/yourusername/salvebot/wiki)
- [Issues](https://github.com/yourusername/salvebot/issues)
- [Discussions](https://github.com/yourusername/salvebot/discussions)