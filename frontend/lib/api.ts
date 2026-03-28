// ────────────────────────────────────────────────────────────
// Typed fetch wrappers for the FastAPI backend
// ────────────────────────────────────────────────────────────

import type { Candidate, ChatResponse, UploadResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Fetch previously uploaded and indexed candidates from the backend.
 */
export async function fetchCandidates(): Promise<Candidate[]> {
    const res = await fetch(`${API_BASE}/api/candidates`);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Failed to fetch candidates");
    }

    return res.json() as Promise<Candidate[]>;
}

/**
 * Upload one or more PDF resumes.
 * Backend returns 202 Accepted immediately; ingestion happens in background.
 */
export async function uploadResumes(files: File[]): Promise<UploadResponse> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));

    const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Upload failed");
    }

    return res.json() as Promise<UploadResponse>;
}

/**
 * Send a recruiter query and get back an AI answer + citations.
 */
export async function sendChatMessage(query: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history: [] }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Chat request failed");
    }

    return res.json() as Promise<ChatResponse>;
}
