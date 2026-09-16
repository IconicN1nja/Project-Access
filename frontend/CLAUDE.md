# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

**Project Access** is a legal intelligence AI assistant focused on Indian Criminal Law (BNS, BNSS, BSA, and Special Acts). The frontend is a Next.js 16 application that provides a chat interface for legal queries, backed by a RAG (Retrieval-Augmented Generation) system that connects to a Python FastAPI backend for vector search and LLM inference.

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Check formatting without changes
npm run format:check
```

## Architecture

### Core Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Email**: Nodemailer for verification emails

### Backend Integration
The app communicates with a Python FastAPI backend for RAG functionality:
- **Backend URL**: Configured via `RAG_API_URL` or `NEXT_PUBLIC_RAG_API_URL` (defaults to `http://127.0.0.1:8000/api/query`)
- **Flow**: Frontend sends queries → Backend processes via Qdrant vector search + LLM → Frontend streams response
- **Fallback**: If backend is unreachable, `IntelligenceEngine` provides local fallback responses

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── chat/            # RAG query endpoint
│   │   ├── chats/           # Chat CRUD operations
│   │   └── auth/            # Authentication endpoints
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── page.tsx             # Main chat interface
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── AuthScreen.tsx       # Combined login/register UI
│   ├── Sidebar.tsx          # Chat history sidebar
│   ├── ChatHeader.tsx       # Chat header with controls
│   ├── ChatInput.tsx        # Message input component
│   ├── MessageItem.tsx      # Individual message display
│   └── HeroHomepage.tsx     # Landing hero section
├── lib/                     # Utility libraries
│   ├── db.ts               # MongoDB connection (cached)
│   ├── auth.ts             # JWT helpers
│   ├── intelligence.ts     # RAG streaming client + fallback
│   ├── mail.ts             # Email sending utilities
│   └── storage.ts          # Browser localStorage abstractions
├── models/                  # Mongoose schemas
│   ├── User.ts             # User model (email, password, verification)
│   └── Chat.ts             # Chat model (messages, sources, timestamps)
└── types/
    └── index.ts            # TypeScript type definitions
```

### Key Architecture Patterns

**Database Connection**: MongoDB uses a cached connection pattern in `lib/db.ts` to prevent connection exhaustion during Next.js hot reloads. Always import and call `dbConnect()` before database operations in API routes.

**Authentication Flow**:
1. User registers → email verification token sent
2. User verifies email via `/api/auth/verify?token=...`
3. Login generates JWT (60-day expiry) stored in HTTP-only cookie
4. Protected API routes use `getUserIdFromRequest()` to verify authentication

**Chat System**:
- Chats belong to authenticated users (referenced by `userId` or `user_id`)
- Messages include optional `thinking` status and `sources` array for legal citations
- Chat history stored in MongoDB, synced to sidebar on load
- Each message has structured `SourceDoc` references with act titles, section numbers, and relevance scores

**RAG Intelligence Flow**:
1. User submits query via `ChatInput`
2. `IntelligenceEngine.streamResponse()` sends to `/api/chat`
3. API route forwards to FastAPI backend (`RAG_API_URL`)
4. Response includes `answer`, `classified_collection`, and `retrieved_docs` (legal citations)
5. Frontend streams response word-by-word for responsive UX
6. If backend fails, local fallback generates structured legal advisory template

## Environment Variables

Required variables (see `.env` in parent directory):

```bash
# Vector Database (Qdrant)
QDRANT_URL=https://...
QDRANT_API_KEY=...

# LLM API
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-20b

# Database & Auth
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM="Project Access <...>"

# Backend Integration (optional, defaults to localhost:8000)
RAG_API_URL=http://127.0.0.1:8000/api/query
```

**Note**: The `.env` file is in the parent directory (`../`), not in `frontend/`. This is shared between frontend and backend services.

## Important Conventions

### Path Aliases
Use `@/*` for imports from `src/`: `import { Message } from '@/types'`

### API Routes
- All API routes return `NextResponse.json()`
- Authentication routes handle JWT token creation/validation
- Chat routes require authentication via `getUserIdFromRequest()`
- Backend communication includes 90s timeout for LLM inference

### Component Patterns
- Components use Framer Motion for animations
- Lucide React for consistent iconography
- Dark mode is default (set in root layout)
- React Markdown with `remark-gfm` for rendering assistant responses

### Model Definitions
Mongoose models use the pattern: `mongoose.models.ModelName || mongoose.model('ModelName', Schema)` to prevent recompilation during hot reloads.

## Testing & Debugging

No test framework is currently configured. When adding tests, use the standard Next.js testing setup (Jest + React Testing Library).

**Common Debug Points**:
- Backend connectivity: Check `RAG_API_URL` and ensure FastAPI is running on port 8000
- MongoDB connection: Verify `MONGODB_URI` and check console for connection errors
- Email verification: Check SMTP credentials if verification emails fail
- JWT issues: Verify `JWT_SECRET` matches between sessions

## Domain-Specific Context

**Legal Domain**: This application handles Indian Criminal Law queries specifically:
- **BNS** (Bharatiya Nyaya Sanhita) — substantive criminal law
- **BNSS** (Bharatiya Nagarik Suraksha Sanhita) — procedural law
- **BSA** (Bharatiya Sakshya Adhiniyam) — evidence law
- **Special Acts**: POCSO, NDPS, Arms Act, UAPA, etc.

Responses should maintain formal legal advisory tone and include statutory references (act title, section numbers, snippets, relevance scores).
