# Project Access — Frontend

Next.js 16 (App Router) + React 19 + TypeScript frontend for **Project Access**, a legal-intelligence AI assistant for Indian Criminal Law.

See the **[root README](../README.md)** for architecture, full setup instructions, environment variables, and deployment guides.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The frontend reads environment variables from the repository-root `.env` (shared with the Python backend). See `../.env.example` for the full variable reference.

## Commands

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the dev server (port 3000) |
| `npm run build`        | Production build                 |
| `npm start`            | Start the production server      |
| `npm run lint`         | ESLint                           |
| `npm run format`       | Prettier (write)                 |
| `npm run format:check` | Prettier (check only)            |

## What's Inside

- **Chat interface** — `src/app/page.tsx` with streaming responses, thinking status, and statutory source cards
- **Authentication** — email registration + verification, JWT sessions in HTTP-only cookies (`src/app/api/auth/`, `src/lib/auth.ts`)
- **Chat history** — MongoDB-backed conversations with pinning (`src/app/api/chats/`, `src/models/Chat.ts`)
- **RAG client** — `src/lib/intelligence.ts` proxies queries to the FastAPI backend (`RAG_API_URL`) and falls back to local legal-advisory templates
- **UI kit** — Tailwind CSS v4 with design tokens (`src/styles/`)
