"use client";

import { useCallback, useRef, useState } from "react";
import { uploadResumes } from "@/lib/api";
import CandidateCard from "@/components/CandidateCard";
import type { Candidate } from "@/types";

interface Props {
  candidates: Candidate[];
  onUpload: (candidates: Candidate[]) => void;
  onMarkReady: (filename: string) => void;
}

export default function UploadPanel({ candidates, onUpload, onMarkReady }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
      if (pdfs.length === 0) {
        setError("Please upload PDF files only.");
        return;
      }
      setError(null);
      setIsUploading(true);

      try {
        const response = await uploadResumes(pdfs);

        // Add candidates in "processing" state immediately
        const newCandidates: Candidate[] = response.files.map((f) => ({
          id: crypto.randomUUID(),
          filename: f.filename,
          status: "processing" as const,
          uploadedAt: new Date().toISOString(),
        }));
        onUpload(newCandidates);

        // Simulate transition to "ready" after ingestion completes
        // (real app would poll a status endpoint or use a websocket)
        newCandidates.forEach((c) => {
          setTimeout(() => onMarkReady(c.filename), 4000 + Math.random() * 3000);
        });

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onMarkReady]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "1.25rem",
        gap: "1rem",
      }}
    >
      {/* Section header */}
      <div>
        <h2
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.25rem",
          }}
        >
          Candidate Pool
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Upload résumés to index them for AI querying.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone${isDragging ? " drag-active" : ""}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          borderRadius: "12px",
          padding: "1.75rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.6rem",
          userSelect: "none",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--accent-glow)",
            border: "1px solid rgba(124,58,237,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {isUploading ? "⏳" : "📄"}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
            {isUploading ? "Uploading…" : "Drop PDF résumés here"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            or click to browse files
          </p>
        </div>
        <span
          style={{
            fontSize: "0.7rem",
            padding: "3px 10px",
            borderRadius: 99,
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          PDF only • Multiple files supported
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "0.6rem 0.9rem",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            fontSize: "0.8rem",
            color: "#fca5a5",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Candidate list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {candidates.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              paddingBottom: "2rem",
            }}
          >
            <span style={{ fontSize: 32 }}>🗂️</span>
            <p>No candidates yet</p>
            <p style={{ fontSize: "0.72rem" }}>Upload a résumé to get started</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))
        )}
      </div>

      {/* Footer stats */}
      {candidates.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          <span>{candidates.length} total</span>
          <span style={{ color: "var(--success)" }}>
            {candidates.filter((c) => c.status === "ready").length} ready
          </span>
          <span style={{ color: "var(--warning)" }}>
            {candidates.filter((c) => c.status === "processing").length} processing
          </span>
        </div>
      )}
    </div>
  );
}
