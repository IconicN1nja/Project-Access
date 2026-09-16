# ⚖️ Project Access

**Project Access** is a legal-intelligence AI assistant specializing in **Indian Criminal Law**. It provides a conversational interface for legal queries, grounded in primary legal sources — the three new criminal codes (**BNS**, **BNSS**, **BSA**) and key **Special Acts** (POCSO, NDPS, Arms Act, UAPA, PMLA, SC/ST, DV, and more) — through a **Retrieval-Augmented Generation (RAG)** pipeline.

The system pairs a **Next.js 16** frontend (chat UI, auth, per-user chat history) with a **Python FastAPI** backend that runs vector search over a **Qdrant** corpus and generates structured answers via a **Groq** LLM, complete with statutory citations and relevance scores.

> ⚠️ **Disclaimer:** Project Access is an educational/research tool. Responses are AI-generated and do **not** constitute legal advice. Always consult a qualified advocate licensed in your jurisdiction.

---

## Features

- 💬 **Conversational legal queries** — ask plain-language questions about criminal law
- 📚 **Grounded citations** — answers reference the act, section number, snippet, and relevance score of retrieved sources
- 🗂️ **14 statute collections** in the corpus
- 🔎 **LLM-based collection routing** — each query is classified to the relevant act(s) before retrieval
- 🔄 **Hybrid retrieval** — vector similarity (FastEmbed) + keyword search + reranking
- 🧠 **Multi-key failover** — rotates across multiple Groq API keys with automatic rate-limit failover
- 👤 **Full authentication** — email registration, verification emails, JWT sessions in HTTP-only cookies
- 💾 **Persistent chat history** — per-user conversations in MongoDB, with source citations and pinning
- ⬇️ **Graceful degradation** — structured local fallback answers if the backend is unreachable

---

## Architecture

```
┌──────────────────────┐       ┌─────────────────────────────┐
│  Next.js 16 Frontend │──────▶│   Python FastAPI Backend    │
│        (:3000)       │REST   │        (:8000) /api/query   │
└──────────┬───────────┘       └───────────────┬─────────────┘
           │                                   │
           │ JWT · sessions                    │ hybrid vector search
      ┌────▼────┐                          ┌───▼────┐
      │ MongoDB │                          │ Qdrant  │──▶ Groq LLM
      │ Atlas   │                          │vector DB│
      └─────────┘                          └─────────┘
```

| Component | Tech | Location |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 | `frontend/` |
| Backend | FastAPI, LangChain, LangChain-Groq | `scripts/` |
| Vector DB | Qdrant (cloud or local `qdrant_storage/`) · FastEmbed `BAAI/bge-small-en-v1.5` | `scripts/qdrant_*.py` |
| Legal corpus | Curated statute text, one folder per act | `data/criminal/` |
| User store | MongoDB Atlas (Mongoose) | `frontend/src/models/` |

### Backend entry point

```bash
uvicorn scripts.api:app --host 0.0.0.0 --port 8000
```

One endpoint is exposed:

```http
POST /api/query
Body: {"question": "your legal question"}

Response:
{
  "question": "...",
  "answer": "...",                        // LLM-generated, with citations
  "classified_collection": "bns",
  "retrieved_docs": [
    { "act_title": "Bharatiya Nyaya Sanhita", "section_number": "103",
      "snippet": "...", "score": 0.97 }
  ]
}
```

---

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.11+
- Accounts / keys for **Qdrant Cloud**, **Groq**, **MongoDB Atlas**, and a Gmail app password (SMTP)

---

## Quick Start (Local Development)

### 1. Configure environment

```bash
git clone <your-repo-url>
cd Project-Access
cp .env.example .env      # fill in your keys
```

An overview of the required variables (full reference in [`.env.example`](.env.example)):

| Variable | Purpose |
|---|---|
| `QDRANT_URL` / `QDRANT_API_KEY` | Qdrant Cloud endpoint + key |
| `GROQ_API_KEY` (+ `GROQ_API_KEY1..N`) | LLM keys; extras enable failover |
| `GROQ_MODEL` | e.g. `openai/gpt-oss-120b` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Token-signing secret |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` `SMTP_FROM` | Verification emails |
| `RAG_API_URL` | Backend URL (defaults to `http://127.0.0.1:8000/api/query`) |

### 2. Start the backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

uvicorn scripts.api:app --host 0.0.0.0 --port 8000 --reload
```

First run downloads the FastEmbed model weights and connects to Qdrant. If a Qdrant Cloud URL is set, the retriever uses it; otherwise it uses local `qdrant_storage/`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register (a verification email is sent), verify, and start chatting.

### 4. Index the corpus (optional / to rebuild)

```bash
python scripts/qdrant_indexer.py
```

Embeds the text in `data/criminal/` and upserts vectors into Qdrant.

---

## Project Structure

```
Project-Access/
├── frontend/                     # Next.js 16 app
│   └── src/
│       ├── app/
│       │   ├── api/              # auth · chat · chats (Next.js route handlers)
│       │   │   ├── auth/         # login, register, logout, me, verify
│       │   │   ├── chat/         # proxies to RAG backend
│       │   │   └── chats/        # chat CRUD
│       │   ├── login/ register/  # pages
│       │   ├── page.tsx          # main chat interface
│       │   ├── layout.tsx  globals.css
│       ├── components/           # AuthScreen, Sidebar, ChatHeader,
│       │                         # ChatInput, MessageItem, HeroHomepage, ui/
│       ├── lib/                  # db · auth · intelligence · mail · storage
│       ├── models/               # Mongoose schemas (User, Chat)
│       └── types/                # TS types
├── scripts/                      # Python backend
│   ├── api.py                    # FastAPI entry point
│   ├── rag_chain.py              # RAG orchestration (routing, hybrid search, rerank, generation)
│   ├── qdrant_indexer.py         # corpus → vector index
│   ├── qdrant_search.py          # retriever + FastEmbed
│   └── flatten_laws.py           # raw text → structured JSON
├── data/criminal/                # statute corpus (bns, bnss, bsa, pocso, ndps, arms, …)
├── qdrant_storage/               # local vector store (git-ignored)
├── requirements.txt
└── .env.example
```

---

## How It Works (RAG Flow)

1. User submits a query in the chat UI.
2. `src/lib/intelligence.ts` posts it to `/api/chat` (Next.js route), which forwards to the FastAPI `RAG_API_URL`.
3. The backend's `ClassifyQuery` step (LLM) selects the relevant statute collection(s).
4. `CriminalLawRetriever` performs hybrid search (dense vectors + keyword) over the chosen Qdrant collection.
5. Candidates are reranked; adjacent sections from the same Act are pulled for richer context.
6. `CriminalLawRAG.answer_question` invokes **Groq** with the RAG prompt in `scripts/rag_chain.py`, which instructs the model to cite specific sections and flag the boundary between retrieved evidence and general legal knowledge.
7. The frontend streams the answer word-by-word and renders source cards (act, section, snippet, score).
8. If the backend is unreachable, `generateLocalResponse()` returns a structured legal-advisory template.

---

## Deployment

All external dependencies (MongoDB Atlas, Qdrant Cloud, Groq) are already hosted — only the two apps need deploying.

### Option A — Vercel (frontend) + Render/Railway (backend) — *recommended*

**Backend (Render or Railway):**

1. Push the repo to GitHub, create a **Web Service** from the repo root.
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn scripts.api:app --host 0.0.0.0 --port 8000`
4. Env vars: `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`.
   ⚠️ `fastembed` downloads model weights on boot and LangChain is heavy — pick a plan with ≥ 1 GB RAM.

**Frontend (Vercel):**

```bash
cd frontend
npm i -g vercel
vercel
```

Set env vars in **Vercel → Settings → Environment Variables**: the Qdrant/Groq/Mongo/JWT/SMTP set above, plus `NEXT_PUBLIC_APP_URL` and `RAG_API_URL=https://your-backend.onrender.com/api/query`.

Before shipping:
- Add Vercel/Render egress IP ranges to **MongoDB Atlas → Network Access** (or `0.0.0.0/0` for prototyping).
- Restrict `allow_origins` in `scripts/api.py` from `["*"]` to your frontend domain.

### Option B — Single VPS (PM2 + Nginx or Docker)

```bash
# backend
pip install -r requirements.txt
uvicorn scripts.api:app --host 0.0.0.0 --port 8000 &

# frontend
cd frontend && npm ci && npm run build && npm start &

# nginx proxies :3000 and /api/query → :8000
```

Set `RAG_API_URL=http://127.0.0.1:8000/api/query` so the frontend uses loopback.

---

## 🔒 Security Notes

> **Never commit `.env` files.** Both `.gitignore` files exclude `.env*`. If this repo ever goes public, **rotate every secret** currently in your working `.env` files (MongoDB password, all Groq keys, Qdrant key, Gmail app password) immediately.

- Replace the default `JWT_SECRET` with a long random value.
- Use a dedicated MongoDB Atlas app user rather than one shared with other tooling.
- Restrict CORS in production.

---

## Roadmap

- [ ] Automated tests (Jest + RTL frontend, pytest backend)
- [ ] Rate limiting & abuse protection on `/api/query`
- [ ] Streaming (SSE) responses from the backend
- [ ] Expanded corpus (more Special Acts / state acts)
- [ ] Admin dashboard & user roles

---

## License

Add your license here.

---

**Built with** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · FastAPI · LangChain · Qdrant · Groq · MongoDB Atlas