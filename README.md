# ⚖️ Project Access

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC2626?style=for-the-badge&logo=qdrant)](https://qdrant.tech/)
[![Groq](https://img.shields.io/badge/Groq-LPU_Inference-F05A28?style=for-the-badge)](https://groq.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-project--access--three.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://project-access-three.vercel.app/)

**Project Access** is an enterprise-grade AI legal intelligence platform and conversational assistant engineered specifically for the **Indian Legal System**. Grounded in primary statutory authorities across both **Criminal Law** and **Civil Law**, Project Access indexes and cross-references **37 legal statute collections** via a high-performance **Hybrid Retrieval-Augmented Generation (RAG)** pipeline.

🌐 **Live Application:** [https://project-access-three.vercel.app/](https://project-access-three.vercel.app/)

The platform is strictly aligned with India's criminal law overhaul of 2024, enforcing statutory references exclusively under the **Bharatiya Nyaya Sanhita, 2023 (BNS)**, **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)**, and **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** while programmatically eliminating repealed Indian Penal Code (IPC), CrPC, and Evidence Act references.

> ⚠️ **Disclaimer:** Project Access is an educational and legal-research platform. AI-generated responses do **not** constitute legal advice, formal counsel, or an advocate-client relationship. Always consult an advocate licensed in your jurisdiction for formal legal proceedings.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Statute Corpus (37 Collections)](#-statute-corpus-37-collections)
  - [Criminal Law Collections (14 Acts)](#criminal-law-collections-14-acts)
  - [Civil Law Collections (23 Acts)](#civil-law-collections-23-acts)
- [How It Works (RAG Lifecycle)](#-how-it-works-rag-lifecycle)
- [Repository Structure](#-repository-structure)
- [API Reference](#-api-reference)
  - [FastAPI Backend (`/api/query`)](#1-fastapi-backend-post-apiquery)
  - [Next.js Route Handlers](#2-nextjs-route-handlers)
- [Prerequisites](#-prerequisites)
- [Quick Start (Local Development)](#-quick-start-local-development)
  - [1. Clone and Configure Environment](#1-clone-and-configure-environment)
  - [2. Start Python FastAPI Backend](#2-start-python-fastapi-backend)
  - [3. Start Next.js Frontend](#3-start-nextjs-frontend)
  - [4. Data Ingestion & Indexing (Optional / Rebuilding)](#4-data-ingestion--indexing-optional--rebuilding)
- [Testing & Validation](#-testing--validation)
- [Production Deployment](#-production-deployment)
- [Security & Best Practices](#-security--best-practices)

---

## ⚡ Key Features

- 🏛️ **Dual Criminal & Civil Legal Coverage**: Analyzes substantive offenses, procedural safeguards, evidentiary standards, civil suits, commercial disputes, family law, property transactions, consumer protection, and insolvency.
- 🚫 **Strict Post-2024 Legal Mandate Compliance**: Built-in prompt enforcement and regex sanitation (`sanitize_no_ipc`) guarantee zero mentions or hallucinations of repealed codes (IPC, CrPC, IEA), remapping substantive offenses strictly to BNS, procedure to BNSS, and evidence to BSA.
- ⚖️ **Clear Civil vs. Criminal Remedial Differentiation**: Automatically distinguishes between criminal remedies (FIR, police investigation, arrest, bail, trial, imprisonment) and civil remedies (injunctions, damages, specific performance, restitution).
- 🔍 **Hybrid Retrieval Engine**: Combines dense vector similarity (`BAAI/bge-small-en-v1.5` via FastEmbed) with Qdrant sparse payload keyword matching, intelligent statute routing, and contextual adjacent section expansion.
- 🔄 **Thread-Safe Multi-Key Groq Failover**: Automatically cycles across a pool of Groq API keys (`GROQ_API_KEY`, `GROQ_API_KEYS`, `GROQ_API_KEY1..N`) with instant failover on rate limits or quota exhaustion.
- 🎙️ **Voice Interaction & Speech Support**: Tailored conversational modes (`is_voice`), text-to-speech rendering, and an interactive speaking overlay (`AISpeakingOverlay`).
- 🌐 **Multilingual Answers**: Native support for responses in English, Hindi (Devanagari), Hinglish (Roman script), Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, French, Spanish, and German while keeping formal statutory citations intact.
- 🎨 **Modern, Immersive UI**: Powered by Next.js 16 App Router, React 19, and Tailwind CSS v4, featuring Dynamic Island navigation, an interactive India map visualizer, citation cards with similarity scores, and a floating dock.
- 🔐 **End-to-End User Authentication**: User registration with email verification via Nodemailer SMTP, bcrypt password hashing, and 60-day JWT session cookies.
- 💾 **Persistent Chat & History**: Multi-turn conversation history stored in MongoDB Atlas with pinning, rename, deletion, and context carryover into subsequent queries.
- 🛡️ **Graceful Offline Degradation**: Structured client-side legal fallback if the backend service is temporarily unreachable.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────────────┐
                                  │   Client Browser / Mobile UI   │
                                  │ (Next.js 16 + React 19 + Tw v4)│
                                  └───────────────┬────────────────┘
                                                  │
                                                  │ HTTPS / REST
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Next.js App Router (Port :3000)                                                                 │
│ ┌──────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│ │   /api/auth/*        │  │   /api/chats/*        │  │ Dynamic Island  │  │ Voice & Audio    │  │
│ │  (JWT + Nodemailer)  │  │   (CRUD & Pinning)    │  │ Navigation Dock │  │ Engine           │  │
│ └──────────┬───────────┘  └───────────┬───────────┘  └─────────────────┘  └──────────────────┘  │
│            │                          │                                                         │
│            ▼                          ▼                                                         │
│     ┌──────────────┐           ┌──────────────┐                                                 │
│     │   MongoDB    │           │  /api/chat   │ (Proxy & Streaming Controller)                  │
│     │    Atlas     │           └──────┬───────┘                                                 │
└─────┴──────────────┴──────────────────┼─────────────────────────────────────────────────────────┘
                                        │
                                        │ POST /api/query
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Python FastAPI Backend (Port :8000)                                                             │
│                                                                                                 │
│  1. Request Ingestion (Query, History, Voice Flag, Target Language)                             │
│  2. LLM Statute Classification (Routes query to relevant collection among 37 statutes)          │
│  3. Hybrid Retrieval:                                                                           │
│     ├── Dense Semantic Search (FastEmbed: BAAI/bge-small-en-v1.5)                               │
│     └── Sparse Payload Keyword Search                                                           │
│  4. Re-Ranking & Contextual Expansion (Pulls adjacent statutory sections for rich context)      │
│  5. Groq Multi-Key Execution Pool (Thread-safe failover across API key array)                   │
│  6. Repeal Sanitizer (Eliminates residual IPC/CrPC/IEA tokens via `sanitize_no_ipc`)            │
│  7. Multilingual Generation & Formatting                                                        │
└──────────────┬──────────────────────────────────────────────────────────┬───────────────────────┘
               │                                                          │
               ▼                                                          ▼
     ┌──────────────────┐                                       ┌──────────────────┐
     │  Qdrant Cloud /  │                                       │     Groq LLM     │
     │  Local Storage   │                                       │ (LPU Inference)  │
     │  (37 Collections)│                                       │ e.g. gpt-oss-120b│
     └──────────────────┘                                       └──────────────────┘
```

---

## 📚 Statute Corpus (37 Collections)

Project Access indexes comprehensive, chapter-and-section-structured statutory text across both criminal and civil domains.

### Criminal Law Collections (14 Acts)

| Collection ID | Act Full Name | Key Coverage / Scope |
| :--- | :--- | :--- |
| `bns` | **Bharatiya Nyaya Sanhita, 2023** | Substantive criminal offenses (replacing Indian Penal Code) |
| `bnss` | **Bharatiya Nagarik Suraksha Sanhita, 2023** | Criminal procedure, arrest, bail, investigation, trials (replacing CrPC) |
| `bsa` | **Bharatiya Sakshya Adhiniyam, 2023** | Rules of evidence, electronic records, admissibility (replacing IEA) |
| `pocso` | **Protection of Children from Sexual Offences Act, 2012** | Child protection, aggravated sexual assault, reporting duties |
| `ndps` | **Narcotic Drugs and Psychotropic Substances Act, 1985** | Drug offenses, contraband possession, commercial quantities, search/seizure |
| `uapa` | **Unlawful Activities (Prevention) Act, 1967** | Counter-terrorism, unlawful associations, national security |
| `arms` | **Arms Act, 1959** | Firearms, ammunition licensing, prohibited arms, unlawful possession |
| `domestic_violence` | **Protection of Women from Domestic Violence Act, 2005** | Protection orders, residence orders, domestic incident reports |
| `dpa` | **Dowry Prohibition Act, 1961** | Prohibition and penalties for giving/taking dowry |
| `pca` | **Prevention of Corruption Act, 1988** | Bribery, criminal misconduct by public servants, disproportionate assets |
| `pmla` | **Prevention of Money-Laundering Act, 2002** | Attachment of proceeds of crime, money laundering offenses |
| `sc_st` | **SC/ST (Prevention of Atrocities) Act, 1989** | Caste-based crimes, special court procedures, immediate relief |
| `dca` | **Drugs and Cosmetics Act, 1940** | Adulterated, spurious, and misbranded medicines and cosmetics |
| `irwa` | **Indecent Representation of Women (Prohibition) Act, 1986** | Depiction of women in publications, advertisements, and media |

### Civil Law Collections (23 Acts)

| Collection ID | Act Full Name | Key Coverage / Scope |
| :--- | :--- | :--- |
| `cpc` | **Code of Civil Procedure, 1908** | Civil suits, jurisdiction, temporary injunctions, execution of decrees |
| `ica` | **Indian Contract Act, 1872** | Agreement formation, breach of contract, damages, indemnity, guarantee |
| `ca2013` | **Companies Act, 2013** | Corporate governance, director duties, shareholder rights, winding up |
| `tpa` | **Transfer of Property Act, 1882** | Sales, mortgages, leases, exchanges, and gifts of immovable property |
| `cpa` | **Consumer Protection Act, 2019** | Consumer rights, product liability, unfair trade practices, consumer commissions |
| `ibc` | **Insolvency and Bankruptcy Code, 2016** | Corporate insolvency resolution process (CIRP), liquidation, moratoriums |
| `sarfaesi` | **SARFAESI Act, 2002** | Enforcement of security interest, recovery of NPAs without court intervention |
| `drt` | **Recovery of Debts and Bankruptcy Act, 1993 (DRT)** | Debt recovery tribunals, banking claims above statutory threshold |
| `hma` | **Hindu Marriage Act, 1955** | Marriage conditions, restitution of conjugal rights, judicial separation, divorce |
| `hsa` | **Hindu Succession Act, 1956** | Intestate and testamentary succession, coparcenary rights |
| `hama` | **Hindu Adoptions and Maintenance Act, 1956** | Adoption requirements, maintenance of wives, children, and parents |
| `sma` | **Special Marriage Act, 1954** | Civil marriages, inter-faith registration, grounds for dissolution |
| `aca` | **Arbitration and Conciliation Act, 1996** | Domestic & international arbitration, arbitral awards, Section 9 interim relief |
| `soga` | **Sale of Goods Act, 1930** | Contract of sale, conditions and warranties, transfer of title, unpaid seller |
| `cow` | **Code on Wages, 2019** | Minimum wages, payment schedules, gender discrimination prohibitions |
| `sra` | **Specific Relief Act, 1963** | Specific performance of contracts, mandatory & perpetual injunctions |
| `ipa` | **Indian Partnership Act, 1932** | Partnership formation, partner duties, liability to third parties, dissolution |
| `ita` | **Income-Tax Act, 1961** | Assessment procedures, penalties, appellate remedies |
| `cgst` | **Central Goods and Services Tax Act, 2017** | Levy of GST, input tax credit, search and seizure, tax tribunal appeals |
| `ca1962` | **Customs Act, 1962** | Import/export regulations, customs duties, confiscation of goods |
| `mva` | **Motor Vehicles Act, 1988** | Licensing, vehicle registration, road offenses, MACT accident compensation |
| `pbpt` | **Prohibition of Benami Property Transactions Act, 1988** | Benami property definition, confiscation, appellate tribunal procedures |
| `lsaa` | **Legal Services Authorities Act, 1987** | Free legal aid, Lok Adalats, Permanent Lok Adalats for public utilities |

---

## 🔄 How It Works (RAG Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Advocate
    participant UI as Next.js 16 UI
    participant Route as Next.js /api/chat
    participant API as FastAPI /api/query
    participant Router as LLM Statute Classifier
    participant Qdrant as Qdrant Vector DB
    participant Expander as Section Expander
    participant Pool as Groq Failover Pool
    participant Sanitizer as Repeal Sanitizer

    User->>UI: Types or speaks legal query
    UI->>Route: POST { query, messages, is_voice, response_language }
    Route->>API: Forwards request to FastAPI backend
    API->>Router: Classify query domain & relevant statute collections
    Router-->>API: Target collection(s) (e.g., 'bns', 'ica')
    API->>Qdrant: Hybrid Search (FastEmbed vectors + keyword filter)
    Qdrant-->>API: Candidate section chunks & relevance scores
    API->>Expander: Fetch adjacent sections for broader statutory context
    Expander-->>API: Enriched statutory context
    API->>Pool: Invoke LLM with RAG Prompt & Multi-Turn History
    Note over Pool: Cycles key if rate limit (429) is encountered
    Pool-->>API: Raw structured LLM completion
    API->>Sanitizer: Sanitize output (removes IPC/CrPC/IEA vestiges)
    Sanitizer-->>API: Validated statutory answer
    API-->>Route: JSON { question, answer, classified_collection, retrieved_docs }
    Route-->>UI: Proxies payload to client
    UI->>User: Renders stream, citations, domain tags & audio response
```

1. **User Submission**: The user submits a plain-language query through text input or voice speech.
2. **Next.js Proxy & History Assembly**: `/api/chat` validates session state and forwards past conversation turns, voice parameters, and language preference to FastAPI.
3. **Statute Classification**: An LLM classifier analyzes the intent to select the precise statute collection(s) among the 37 available.
4. **Hybrid Search**: `CriminalLawRetriever` computes embeddings using `BAAI/bge-small-en-v1.5` and executes dense search along with sparse keyword matching.
5. **Context Expansion**: Retreived sections are expanded by pulling neighboring statutory sections to give the LLM full statutory context.
6. **Multi-Key Failover Inference**: The RAG prompt enforces:
   - Mandatory **Direct Legal Summary** upfront.
   - Strict citation of **Act & Section Number**.
   - Clear classification into **Civil** vs. **Criminal** domains.
   - Structured **Statutes to Refer** table with statutory relevance.
   - Actionable procedural avenues for the user or victim.
7. **Post-Processing & IPC Sanitization**: Any legacy IPC/CrPC/IEA references are stripped or translated to current 2024 codes.
8. **Word-by-Word Streaming**: The Next.js client renders word-by-word streaming, displays expandable source cards with act titles, section numbers, snippets, and similarity scores, and triggers voice playback if voice mode is enabled.

---

## 📁 Repository Structure

```
Project-Access/
├── frontend/                          # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                   # Server-side Route Handlers
│   │   │   │   ├── auth/              # login, register, logout, me, verify
│   │   │   │   ├── chat/              # RAG proxy & response formatter
│   │   │   │   └── chats/             # Chat session persistence & CRUD
│   │   │   ├── login/                 # Authentication pages
│   │   │   ├── register/
│   │   │   ├── page.tsx               # Main conversational interface
│   │   │   ├── layout.tsx             # Root layout & providers
│   │   │   └── globals.css            # Tailwind CSS v4 styling
│   │   ├── components/                # React UI Components
│   │   │   ├── AISpeakingOverlay.tsx  # Voice interaction speaking visualizer
│   │   │   ├── AuthScreen.tsx         # Login & registration modal / screen
│   │   │   ├── ButtonSystemSheet.tsx  # Quick prompt actions
│   │   │   ├── ChatHeader.tsx         # Language selection, voice, session controls
│   │   │   ├── ChatInput.tsx          # Multi-line input & voice recording
│   │   │   ├── DynamicIslandNav.tsx   # Floating responsive navigation bar
│   │   │   ├── HeroHomepage.tsx       # Welcoming hero & suggested queries
│   │   │   ├── IndiaMapBackground.tsx # Interactive background visualization
│   │   │   ├── LegalDisclaimerModal.tsx # Mandatory compliance disclaimer
│   │   │   ├── MessageItem.tsx        # Message bubble, markdown, citation cards
│   │   │   ├── RightSidebarDock.tsx   # Action dock & contextual actions
│   │   │   └── Sidebar.tsx            # Chat history, search & pinning
│   │   ├── lib/                       # Utility & Engine Modules
│   │   │   ├── auth.ts                # JWT creation, verification & cookies
│   │   │   ├── db.ts                  # Mongoose cached connection pool
│   │   │   ├── intelligence.ts        # Client streaming engine & local fallback
│   │   │   ├── mail.ts                # Nodemailer email verification transport
│   │   │   ├── storage.ts             # Browser storage helpers
│   │   │   └── voiceHelper.ts         # Speech synthesis & audio helpers
│   │   ├── models/                    # MongoDB Mongoose Schemas
│   │   │   ├── User.ts                # User credentials, verification tokens
│   │   │   └── Chat.ts                # Conversations, messages, source citations
│   │   └── types/                     # TypeScript Interfaces (SourceDoc, Chat, Message)
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/                           # Python FastAPI & RAG Engine
│   ├── api.py                         # FastAPI server entry point (:8000)
│   ├── rag_chain.py                   # Complete RAG pipeline & multi-key pool
│   ├── qdrant_search.py               # Vector similarity & keyword retriever
│   ├── qdrant_indexer.py              # Ingestion engine for Qdrant vector DB
│   ├── flatten_laws.py                # Raw statutory JSON -> flattened chunks
│   ├── convert_prealigned.py          # Data normalization utilities
│   ├── fix_spacings.py                # Statute typography & formatting cleaner
│   ├── test_retrieval.py              # Standalone retriever test script
│   └── apiTest.py                     # Rapid API query verification script
│
├── data/                              # Canonical Statute Data
│   ├── criminal/                      # 14 Criminal Acts (BNS, BNSS, BSA, POCSO, etc.)
│   └── civil/                         # 23 Civil Acts (CPC, ICA, CA2013, TPA, etc.)
│
├── qdrant_storage/                    # Local vector storage directory (if not using Cloud)
├── .env.example                       # Full configuration environment template
├── requirements.txt                   # Python backend dependencies
└── README.md                          # Project documentation
```

---

## 🔌 API Reference

### 1. FastAPI Backend (`POST /api/query`)

**Endpoint**: `http://127.0.0.1:8000/api/query`

#### Request Payload (`QueryRequest`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `question` | `string` | **Yes** | The user's legal question in plain language |
| `is_voice` | `boolean` | No | Optimizes response brevity and formatting for audio synthesis |
| `messages` | `list[QueryMessage]` | No | Array of previous conversation turns (`role`, `content`) |
| `response_language`| `string` | No | Target language (`English`, `Hindi`, `Hinglish`, `Tamil`, etc.) |

```json
{
  "question": "What are the legal remedies for breach of contract and cheating under Indian law?",
  "is_voice": false,
  "messages": [
    { "role": "user", "content": "I paid for goods that were never delivered." }
  ],
  "response_language": "English"
}
```

#### Response Payload (`QueryResponse`)

```json
{
  "question": "What are the legal remedies for breach of contract and cheating under Indian law?",
  "answer": "### Direct Legal Summary\nA non-delivery of paid goods can trigger both a **civil claim** for breach of contract and damages under the Indian Contract Act, 1872, as well as a **criminal prosecution** for cheating under Section 318 of the Bharatiya Nyaya Sanhita, 2023 (BNS) if fraudulent or dishonest intention existed from the inception.\n\n### Statutes to Refer\n| Domain | Act & Section | Title | Relevance to the facts |\n| :--- | :--- | :--- | :--- |\n| Civil | Indian Contract Act, 1872, Sec 73 | Compensation for loss or damage | Recovery of monetary loss and damages |\n| Criminal | Bharatiya Nyaya Sanhita, 2023, Sec 318 | Cheating | Dishonest inducement to deliver property |\n...",
  "classified_collection": "bns",
  "retrieved_docs": [
    {
      "act_title": "Bharatiya Nyaya Sanhita, 2023",
      "section_number": "318",
      "section_title": "Cheating",
      "snippet": "Whoever, by deceiving any person, fraudulently or dishonestly induces...",
      "score": 0.942,
      "chapter": "Chapter XVII"
    }
  ]
}
```

---

### 2. Next.js Route Handlers

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Proxies user queries to FastAPI backend, formats citations, provides local fallback |
| `GET` | `/api/chats` | Lists all chat sessions for the authenticated user |
| `POST` | `/api/chats` | Creates a new chat session |
| `GET` | `/api/chats/[id]` | Retrieves full message history and citations for a chat |
| `PATCH` | `/api/chats/[id]` | Renames or toggles pinned status of a chat |
| `DELETE`| `/api/chats/[id]` | Deletes a chat session |
| `POST` | `/api/auth/register`| Creates account and dispatches email verification token |
| `POST` | `/api/auth/login` | Validates credentials and sets HTTP-only 60-day JWT cookie |
| `GET` | `/api/auth/verify`| Confirms email verification token |
| `GET` | `/api/auth/me` | Returns current authenticated user profile |
| `POST` | `/api/auth/logout`| Clears authentication session cookie |

---

## 🛠️ Prerequisites

Before getting started, ensure you have installed:

- **Node.js**: `20.x` or later and `npm`
- **Python**: `3.11+`
- **Vector Database**: A free **Qdrant Cloud** cluster (or use local disk storage)
- **LLM Provider**: A **Groq Cloud API Key** (multiple keys supported for rotation)
- **Database**: A **MongoDB Atlas** cluster URI
- **SMTP Server**: Gmail App Password or any SMTP service for email verification

---

## 🚀 Quick Start (Local Development)

### 1. Clone and Configure Environment

```bash
git clone https://github.com/IconicN1nja/Project-Access.git
cd Project-Access
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# ── Qdrant Vector DB ────────────────────────────────────────────────────────
QDRANT_URL=https://your-cluster-id.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key

# ── Groq LLM Inference ──────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_primary_key
# Optional: Add extra keys for failover & rate-limit balancing
GROQ_API_KEY1=gsk_secondary_key
GROQ_API_KEY2=gsk_tertiary_key
GROQ_MODEL=openai/gpt-oss-120b

# ── MongoDB & Authentication ────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/project_access?retryWrites=true&w=majority
JWT_SECRET=super-secret-random-jwt-key-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Nodemailer Email Verification ───────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-digit-gmail-app-password
SMTP_FROM="Project Access <your-email@gmail.com>"

# ── RAG Backend URL ─────────────────────────────────────────────────────────
RAG_API_URL=http://127.0.0.1:8000/api/query
```

---

### 2. Start Python FastAPI Backend

Open a terminal at the project root:

```bash
# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Run FastAPI development server with auto-reload
uvicorn scripts.api:app --host 0.0.0.0 --port 8000 --reload
```

> **Note:** On first startup, `fastembed` will download the `BAAI/bge-small-en-v1.5` model weights (approx. 130MB).

---

### 3. Start Next.js Frontend

In a second terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser. Register an account, verify via email or development credentials, and begin querying the legal assistant.

---

### 4. Data Ingestion & Indexing (Optional / Rebuilding)

If you modify statutory documents or wish to rebuild the vector index from raw data:

1. **Flatten structured law JSONs**:
   ```bash
   python scripts/flatten_laws.py
   ```
2. **Index vectors into Qdrant**:
   ```bash
   python scripts/qdrant_indexer.py
   ```

---

## 🧪 Testing & Validation

The repository includes standalone validation scripts to verify components independently:

```bash
# Test vector similarity search directly against Qdrant
python scripts/test_retrieval.py

# Test multi-key Groq failover and automatic rate-limit recovery
python scripts/rag_chain.py --test-failover

# Run an end-to-end question test on the command line
python scripts/rag_chain.py "What is the penalty for cyber extortion under BNS?"

# Test FastAPI endpoint response directly
python scripts/apiTest.py

# Run frontend linting & formatting checks
cd frontend
npm run lint
npm run format:check
```

---

## 🌐 Production Deployment

External services (MongoDB Atlas, Qdrant Cloud, and Groq) are cloud-hosted, simplifying app deployment:

### Recommended: Vercel (Frontend) + Render / Railway (Backend)

#### 1. Deploy Backend (Render / Railway / AWS ECS)
- **Root Directory**: Repository root
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn scripts.api:app --host 0.0.0.0 --port 8000`
- **Environment Variables**: Add `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY` (and `GROQ_API_KEY1..N`), `GROQ_MODEL`.
- 💡 **Resource recommendation**: Allocate at least **1 GB RAM** for FastEmbed embedding models and LangChain runtimes.
- Update `allow_origins` in `scripts/api.py` to match your Vercel production domain.

#### 2. Deploy Frontend (Vercel)
- **Root Directory**: `frontend`
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Environment Variables**: Add all `.env` variables, setting:
  - `NEXT_PUBLIC_APP_URL=https://project-access-three.vercel.app`
  - `RAG_API_URL=https://your-backend.onrender.com/api/query`

---

## 🔒 Security & Best Practices

- **Never commit `.env` files**: All `.env` and `.env.local` files are ignored by git.
- **Rotate Secrets**: Rotate all keys (MongoDB credentials, Groq API keys, Qdrant API key, SMTP app password) if exposed.
- **Strict CORS**: In `scripts/api.py`, replace wildcard origins with your specific frontend domain in production.
- **Connection Caching**: MongoDB connection caching in `frontend/src/lib/db.ts` prevents connection exhaustion during serverless cold starts.
- **JWT Protection**: Session cookies are signed with strong secrets, stored with `HttpOnly`, `SameSite=Strict`, and `Secure` attributes in production.

---

## 👥 Developers & Contributors

- **[Adarsh (IconicN1nja)](https://github.com/IconicN1nja)** — Data Engineering (Legal Scraping, Data Cleaning & Flattening of 37 Statutory Corpora) & Full-Stack Frontend (Next.js 16, React 19, UI/UX, Voice Interface, Auth & Session Store).
- **[Amrendra (Amrendra24155604)](https://github.com/Amrendra24155604)** — Backend Architecture (Python FastAPI service) & Core RAG Pipeline (Qdrant Hybrid Vector Search, Dynamic Statute Routing, Contextual Section Expansion & Multi-Key Groq Failover).

### Statutory Corpus & Tech Acknowledgments
- **Statutory Source**: Official Gazettes of India, Legislative Department, Ministry of Law and Justice, Government of India.
- **Core Technologies**: Next.js 16, React 19, FastAPI, LangChain, Qdrant, Groq, FastEmbed, MongoDB Atlas, Tailwind CSS v4.

---

<p align="center">
  <b>Project Access</b> — Demystifying Indian Law with Grounded AI Intelligence.
</p>
