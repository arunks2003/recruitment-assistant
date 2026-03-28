"use client";

import type { Citation, Message } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  message: Message;
}

function CitationBadge({ citation }: { citation: Citation }) {
  const displayName = citation.filename.replace(/\.pdf$/i, "");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 9px",
        borderRadius: 99,
        background: "rgba(124,58,237,0.15)",
        border: "1px solid rgba(124,58,237,0.35)",
        fontSize: "0.68rem",
        fontWeight: 500,
        color: "var(--accent-light)",
        cursor: "default",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.7 }}>📋</span>
      {displayName}
    </span>
  );
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="message-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "0.35rem",
      }}
    >
      {/* Role label */}
      <span
        style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          paddingLeft: isUser ? 0 : "0.25rem",
          paddingRight: isUser ? "0.25rem" : 0,
        }}
      >
        {isUser ? "You" : "Copilot"} · {time}
      </span>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "85%",
          padding: "0.75rem 1rem",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
            : "var(--bg-card)",
          border: isUser ? "none" : "1px solid var(--border)",
          boxShadow: isUser
            ? "0 4px 20px rgba(109,40,217,0.35)"
            : "none",
          color: "var(--text-primary)",
          fontSize: "0.875rem",
          lineHeight: 1.65,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
        ) : (
          <div className="markdown-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Citations */}
      {!isUser && message.citations && message.citations.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.35rem",
            paddingLeft: "0.25rem",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              alignSelf: "center",
            }}
          >
            Sources:
          </span>
          {message.citations.map((c) => (
            <CitationBadge key={c.filename} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
