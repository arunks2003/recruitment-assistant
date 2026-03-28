# Recruitment Copilot Backend Flow

This document outlines the step-by-step processes that occur when a user uploads a resume and when a user queries the system via the chat interface.

---

## 1. Resume Upload Flow (Ingestion)

When a user drops a resume into the UI, the frontend sends a `multipart/form-data` request containing the PDF file(s).

### API Endpoint: `POST /api/upload`
**(Located in: `backend/app/api/routes/upload.py`)**

1. **Receive and Validate:** The endpoint accepts the files and checks that they are PDFs.
2. **Save to Temp Storage:** Each PDF is saved to a temporary local `uploads/` directory with a unique UUID prefix to prevent filename collisions.
3. **Queue Background Task:** To keep the UI fast and responsive, the actual processing is offloaded to a FastAPI `BackgroundTasks` queue.
4. **Immediate Response:** The server immediately returns a `202 Accepted` response with a status of `"processing"`, so the client is never blocked waiting for the AI embedding process to finish.

### Ingestion Function: `ingest_pdf()`
**(Located in: `backend/app/services/ingestion.py`)**

The background task executes this pipeline for each file:

1. **Database Registration:** Inserts a new row into the Supabase `candidates` table with the filename and upload date, returning a unique `candidate_id` (UUID).
2. **PDF Parsing:** Uses LangChain's `PyPDFLoader` to read and parse all text from the PDF pages.
3. **Text Splitting:** Uses `RecursiveCharacterTextSplitter` to break the full document text into smaller, overlapping chunks (default: 1000 characters, 200 character overlap). This ensures context is maintained across chunk boundaries without exceeding token limits.
4. **Metadata Enrichment:** Each chunk is wrapped into a LangChain `Document` object and enriched with metadata: `candidate_id`, `filename`, `upload_date`, `page` number, and `chunk_index`.
5. **Embedding Generation:** The text chunks are passed to the `HuggingFace` embedding model (`all-MiniLM-L6-v2`), converting the text into dense mathematical vectors (384 dimensions).
6. **Vector Database Upsert:** The vector embeddings, text content, and metadata are directly inserted into the Supabase `documents` table (which uses the `pgvector` extension) in batches.
7. **Cleanup:** The temporary PDF file is deleted from the server's disk.

---

## 2. Chat Flow (Retrieval & Synthesis)

When a user asks a question in the chat interface, the query is processed using a Retrieval-Augmented Generation (RAG) architecture.

### API Endpoint: `POST /api/chat`
**(Located in: `backend/app/api/routes/chat.py`)**

1. **Receive Query:** The endpoint accepts a JSON body containing the user's natural language `query`.
2. **Init RAG Chain:** Retrieves the LangChain LCEL (LangChain Expression Language) pipeline and the vector store retriever by calling `get_rag_chain()`.

### Retrieval and Synthesis Process
**(Located in: `backend/app/services/rag_chain.py` and `chat.py`)**

1. **Similarity Search (Retrieval):**
   - The user's query is converted into an embedding using the same HuggingFace model.
   - The vector store `retriever` executes a similarity search against the Supabase `documents` table.
   - Under the hood, this calls a Supabase Postgres RPC function (`match_documents`) to calculate cosine similarity and return the top `k` (default: 5) most relevant document chunks.
2. **Citation Extraction:**
   - The `chat.py` route intercepts these retrieved chunks *before* they go to the LLM.
   - It extracts the `filename` and `candidate_id` metadata from each chunk.
   - It builds a deduplicated list of `citations` to show the user exactly which resumes were referenced.
3. **Context Formatting:**
   - The LangChain RAG pipeline formats the retrieved chunks into clearly labeled context blocks.
   - Example format: `[Source: resume.pdf | Page 2] \n <chunk text>`
4. **LLM Synthesis:**
   - The formatted context blocks and the user's original question are injected into the `RECRUITMENT_PROMPT`.
   - The prompt instructs the AI (OpenAI `gpt-4o-mini`) to answer *only* using the provided excerpts and to cite its sources.
   - The LLM processes the prompt and streams back the synthesized text answer.
5. **Final Response:**
   - The server returns a JSON response containing the synthesized AI `answer` and the array of deduplicated `citations`.
