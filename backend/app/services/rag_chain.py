"""
LangChain LCEL RAG chain for recruitment queries.

The chain:
  1. Retrieves the top-k most relevant document chunks from Supabase via similarity search
  2. Formats them as labelled context blocks (source + page)
  3. Injects into the recruitment prompt template
  4. Streams through Ollama llama3
  5. Parses output as a string
"""
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from app.core.config import settings
from app.services.llm import get_llm
from app.services.vector_store import get_vector_store

# ── Prompt ────────────────────────────────────────────────────────────────────
RECRUITMENT_PROMPT = PromptTemplate.from_template(
    """You are an expert AI recruitment assistant helping HR professionals evaluate candidates.

IMPORTANT RULES:
- Answer ONLY using the resume excerpts provided below.
- Always explicitly cite which candidate(s) you reference, using their filename as the name.
- If comparing candidates, provide a structured comparison.
- If the context does not contain enough information, say exactly:
  "I don't have enough information in the uploaded resumes to answer that."

Resume Context:
{context}

Recruiter Question: {question}

Detailed Answer:"""
)


def _format_docs(docs: list[Document]) -> str:
    """Format retrieved docs into labelled context blocks."""
    blocks = []
    for doc in docs:
        filename = doc.metadata.get("filename", "Unknown Candidate")
        page = doc.metadata.get("page", "?")
        blocks.append(
            f"[Source: {filename} | Page {page}]\n{doc.page_content.strip()}"
        )
    return "\n\n---\n\n".join(blocks)


def get_rag_chain() -> tuple:
    """
    Build and return:
        (chain, retriever)

    The retriever is returned separately so the caller can extract source metadata
    for building the citations list independently of the LLM output.
    """
    vector_store = get_vector_store()
    retriever: BaseRetriever = vector_store.as_retriever(
        search_kwargs={"k": settings.retrieval_k}
    )
    llm = get_llm()

    chain = (
        {
            "context": retriever | _format_docs,
            "question": RunnablePassthrough(),
        }
        | RECRUITMENT_PROMPT
        | llm
        | StrOutputParser()
    )

    return chain, retriever
