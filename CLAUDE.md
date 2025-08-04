# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (salvebot-frontend)
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build Next.js static export for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run export` - Build and export static files to `out/` directory
- `npm run deploy` - Export and deploy to GitHub Pages via gh-pages

### Backend (salvebot-backend)
- `npm run dev` - Start Cloudflare Workers development server on localhost:8787
- `wrangler deploy` - Deploy to Cloudflare Workers
- `npm test` - Run backend tests

### Build & Deployment
- **GitHub Actions**: Push to `main` branch triggers automatic deployment to GitHub Pages
- **Manual deployment**: Run `npm run build` in frontend, verify successful compilation before deployment
- **Critical**: Always test build locally with `npm run build` before committing - build failures will break the live site

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14.2.5 with React 18, TypeScript, Tailwind CSS
- **Deployment**: GitHub Pages with static export (`output: 'export'` in next.config.js)
- **Backend**: Cloudflare Workers (separate repository/deployment)
- **AI**: OpenAI GPT-4 + Embeddings for RAG implementation
- **Storage**: Cloudflare KV, R2, and D1 for data/files/database

### Key Configuration
- **Static Export**: Next.js configured for static export to GitHub Pages (`next.config.js`)
- **Icons**: Native SVG components in `components/icons/index.tsx` (not lucide-react)
- **API**: Centralized API client in `lib/api.ts` with JWT authentication
- **Styling**: Tailwind CSS with custom design system (primary/brand colors, card shadows)

### Project Structure
```
salvebot-frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with pricing tiers
│   ├── signin/page.tsx    # Authentication pages
│   ├── signup/page.tsx
│   └── dashboard/         # Protected dashboard area
├── components/
│   ├── auth/              # Authentication guards and utilities
│   ├── chatbots/          # Chatbot management components
│   ├── documents/         # Document upload/management
│   ├── icons/             # Native SVG icon system
│   └── ui/                # Reusable UI components
├── lib/
│   └── api.ts            # Centralized API client with auth
└── globals.css           # Tailwind CSS + custom styles
```

### Authentication Flow
- JWT tokens stored in localStorage via `authUtils` in `lib/api.ts`
- `AuthGuard` component protects dashboard routes
- API client automatically includes Bearer tokens in requests
- User data includes subscription status, trial dates, security metrics

### Icon System
- **Critical**: Use native SVG components from `components/icons/index.tsx`
- **Never** import from lucide-react (removed dependency due to build issues)
- All icons follow consistent TypeScript interface with `className` and optional `size` props
- Available icons: BotIcon, XIcon, FileTextIcon, etc. (18 total components)

### Button/Link Pattern
- **Important**: Button component does not support `asChild` prop
- For clickable buttons that navigate, wrap Button with Link:
  ```tsx
  <Link href="/signup">
    <Button className="...">Get Started</Button>
  </Link>
  ```
- Avoid `<Button asChild><Link>...</Link></Button>` pattern (causes build errors)

### API Integration
- Backend API at `https://salvebot-api.fideleamazing.workers.dev`
- Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`
- Handles auth, chatbots, documents with comprehensive error handling
- FormData uploads for documents, JSON for other endpoints

### RAG Implementation
Document processing pipeline:
1. Upload → R2 storage
2. Parse → Content extraction
3. Chunk → 1000-character segments
4. Embed → OpenAI embeddings
5. Store → KV with vector search

Query processing uses HyDE (Hypothetical Document Embeddings):
1. Classify message type
2. Generate hypothetical answer
3. Embed hypothetical answer
4. Search similar chunks
5. Generate contextual response

### Common Issues
- **Build failures**: Usually icon imports or Button asChild props
- **Static export**: No server-side features, all API calls client-side
- **GitHub Pages**: Automatic deployment on main branch push
- **TypeScript**: React 18 compatibility (downgraded from 19 for stability)

### Domain Configuration
- **Production**: salvebot.com (configured in GitHub Pages and next.config.js)
- **API**: Separate Cloudflare Workers deployment
- **CORS**: API configured for frontend domain access