"use client";

import type { Candidate } from "@/types";

interface Props {
  candidate: Candidate;
}

const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    dot: true,
  },
  ready: {
    label: "Ready",
    color: "var(--success)",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    dot: false,
  },
  error: {
    label: "Error",
    color: "var(--error)",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    dot: false,
  },
};

export default function CandidateCard({ candidate }: Props) {
  const cfg = STATUS_CONFIG[candidate.status];
  const uploadTime = new Date(candidate.uploadedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Strip extension for display name
  const displayName = candidate.filename.replace(/\.pdf$/i, "");

  return (
    <div
      className="glass glass-hover"
      style={{
        borderRadius: 10,
        padding: "0.65rem 0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        cursor: "default",
      }}
    >
      {/* PDF icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        📋
      </div>

      {/* Name + time */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={displayName}
        >
          {displayName}
        </p>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>
          Uploaded at {uploadTime}
        </p>
      </div>

      {/* Status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          borderRadius: 99,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          flexShrink: 0,
        }}
      >
        {cfg.dot && (
          <span
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: cfg.color,
              display: "block",
            }}
          />
        )}
        {!cfg.dot && (
          <span style={{ fontSize: 10 }}>
            {candidate.status === "ready" ? "✓" : "✕"}
          </span>
        )}
        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
