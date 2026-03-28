// ────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the Recruitment Copilot UI
// ────────────────────────────────────────────────────────────

export interface Candidate {
    id: string;
    filename: string;
    status: "processing" | "ready" | "error";
    uploadedAt: string;
}

export interface Citation {
    filename: string;
    candidate_id: string | null;
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations?: Citation[];
    timestamp: Date;
}

export interface UploadResponse {
    status: string;
    message: string;
    files: Array<{ filename: string; status: string }>;
}

export interface ChatResponse {
    answer: string;
    citations: Citation[];
}
