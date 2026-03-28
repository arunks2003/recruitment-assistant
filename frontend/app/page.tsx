"use client";

import { useState, useEffect } from "react";
import UploadPanel from "@/components/UploadPanel";
import ChatPanel from "@/components/ChatPanel";
import type { Candidate } from "@/types";
import { fetchCandidates } from "@/lib/api";

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    fetchCandidates()
      .then(setCandidates)
      .catch((err) => console.error("Failed to load candidates:", err));
  }, []);

  const addCandidates = (newOnes: Candidate[]) => {
    setCandidates((prev) => {
      const existingNames = new Set(prev.map((c) => c.filename));
      const unique = newOnes.filter((c) => !existingNames.has(c.filename));
      return [...prev, ...unique];
    });
  };

  const markReady = (filename: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.filename === filename ? { ...c, status: "ready" as const } : c
      )
    );
  };


  return (
    <main
      style={{
        display: "flex",
        height: "100vh",
        gap: "1px",
        background: "var(--border)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          background: "rgba(7,8,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          gap: "0.75rem",
          zIndex: 100,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
          }}
        >
          ✦
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "-0.01em",
          }}
          className="gradient-text"
        >
          Recruitment Copilot
        </span>
        <span
          style={{
            marginLeft: "0.5rem",
            fontSize: "0.7rem",
            padding: "2px 8px",
            borderRadius: 99,
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          AI • RAG • openai
        </span>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--success)",
              display: "inline-block",
              boxShadow: "0 0 8px var(--success)",
            }}
          />
          {candidates.filter((c) => c.status === "ready").length} candidates
          indexed
        </div>
      </div>

      {/* Split panels, offset by header */}
      <div
        style={{
          display: "flex",
          width: "100%",
          paddingTop: "56px",
          height: "100vh",
        }}
      >
        {/* Left — Upload + Candidate list */}
        <div
          style={{
            width: "380px",
            minWidth: "340px",
            flexShrink: 0,
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <UploadPanel
            candidates={candidates}
            onUpload={addCandidates}
            onMarkReady={markReady}
          />
        </div>

        {/* Right — Chat interface */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ChatPanel candidates={candidates} />
        </div>
      </div>
    </main>
  );
}
