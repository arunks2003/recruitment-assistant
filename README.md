# Intelligent Recruitment Copilot

> An AI-powered HR dashboard — upload candidate résumés and query your talent pool in natural language.

**Stack:** Next.js 14 (App Router) · FastAPI · LangChain · OpenAI (gpt-4o-mini) · Supabase (pgvector) · HuggingFace Embeddings

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| OpenAI Account | [platform.openai.com](https://platform.openai.com) |
| Supabase account | free tier works |

---

## 1 — Supabase Setup

See **[Step-by-step Supabase guide](#supabase-configuration)** at the bottom of this file.

---

## 2 — Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# Edit .env with your SUPABASE_URL and SUPABASE_SERVICE_KEY

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Test: http://localhost:8000/health → `{"status":"ok"}`

---

## 3 — OpenAI (gpt-4o-mini)

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create an API key
3. Add it to `backend/.env` as `OPENAI_API_KEY=your-api-key`
> Note: We use `gpt-4o-mini` as it is highly cost-effective and very fast.

---

## 4 — Frontend

```bash
cd frontend

# Copy env file
copy .env.local.example .env.local    # Windows
# cp .env.local.example .env.local   # macOS/Linux

# Install and run
npm install
npm run dev
```

Open: http://localhost:3000

---

## Project Structure

```
recruitment-copilot/
├── backend/
│   ├── app/
│   │   ├── core/config.py          # Settings (pydantic-settings)
│   │   ├── services/
│   │   │   ├── embeddings.py       # HuggingFace all-MiniLM-L6-v2
│   │   │   ├── supabase_client.py  # Supabase client singleton
│   │   │   ├── vector_store.py     # LangChain SupabaseVectorStore
│   │   │   ├── ingestion.py        # PDF → chunk → embed → upsert
│   │   │   ├── llm.py              # OpenAI singleton
│   │   │   └── rag_chain.py        # LCEL RAG chain + prompt
│   │   ├── api/routes/
│   │   │   ├── upload.py           # POST /api/upload
│   │   │   └── chat.py             # POST /api/chat
│   │   └── main.py
│   └── sql/schema.sql              # Run once in Supabase SQL Editor
├── frontend/
│   ├── app/                        # Next.js App Router
│   ├── components/                 # UploadPanel, ChatPanel, etc.
│   ├── lib/api.ts                  # Typed fetch wrappers
│   └── types/index.ts              # Shared TS interfaces
└── README.md
```

---

## API Reference

### `POST /api/upload`
Upload PDF résumés for async ingestion.

**Request:** `multipart/form-data` with `files[]` (PDF only)

**Response `202`:**
```json
{
  "status": "processing",
  "message": "2 file(s) queued for ingestion.",
  "files": [{ "filename": "alice.pdf", "status": "processing" }]
}
```

### `POST /api/chat`
Query the candidate pool.

**Request:**
```json
{ "query": "Who has React and AWS experience?", "history": [] }
```

**Response:**
```json
{
  "answer": "Based on the résumés, Alice Johnson (alice.pdf) has 4 years of React...",
  "citations": [
    { "filename": "alice.pdf", "candidate_id": "uuid-here" }
  ]
}
```

---

## Supabase Configuration

### Step 1 — Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose a name, database password, and region → **Create project**
4. Wait ~2 minutes for the project to provision

### Step 2 — Get your API Keys
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL` in `backend/.env`
   - **service_role key** (under "Project API keys") → `SUPABASE_SERVICE_KEY` in `backend/.env`

> ⚠ Use the `service_role` key (not `anon`). It bypasses RLS so the backend can read/write freely.

### Step 3 — Run the SQL Schema
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open `backend/sql/schema.sql` from this repo
4. Paste the entire contents into the editor
5. Click **Run** (or press `Ctrl+Enter`)

You should see: `Success. No rows returned`

### Step 4 — Verify the Schema
1. Click **Table Editor** in the left sidebar
2. You should see two tables: **`candidates`** and **`documents`**
3. Click on `documents` → the schema should show an `embedding` column of type `vector`

### Step 5 — Verify the RPC Function
1. Go to **Database → Functions** in the left sidebar
2. You should see `match_documents` listed
3. If missing, re-run the SQL from Step 3

### Step 6 — Set Environment Variables
Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Troubleshooting

| Error | Fix |
|---|---|
| `extension "vector" does not exist` | Make sure you ran the full `schema.sql` — the first line enables pgvector |
| `function match_documents does not exist` | Re-run `schema.sql` in SQL Editor |
| `invalid api key` | You used the `anon` key instead of `service_role` |
| `column embedding does not exist` | The `documents` table wasn't created — re-run the SQL |
| Embeddings dimension mismatch | Only change the model in `.env` if you also update `vector(384)` in `schema.sql` |

---

## How It Works

```
PDF Upload → PyPDFLoader → RecursiveCharacterTextSplitter
         → HuggingFace Embeddings (384-dim)
         → Supabase documents table (pgvector)

User Query → HuggingFace embed query
           → match_documents RPC (cosine similarity)
           → Top-5 chunks retrieved
           → LangChain prompt + OpenAI gpt-4o-mini
           → Answer + Citations ✓
```
