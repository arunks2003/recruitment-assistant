"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import type { Candidate, Message } from "@/types";

interface Props {
  candidates: Candidate[];
}

function TypingIndicator() {
  return (
    <div
      className="message-enter"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      <div
        style={{
          padding: "0.65rem 0.9rem",
          borderRadius: "16px 16px 16px 4px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent-light)",
              display: "block",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
        Copilot is thinking…
      </span>
    </div>
  );
}

const SUGGESTED_QUERIES = [
  "Which candidates have React experience?",
  "Who has Python and machine learning skills?",
  "Compare candidates with AWS cloud experience.",
  "Find candidates with 5+ years in backend development.",
];

export default function ChatPanel({ candidates }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readyCount = candidates.filter((c) => c.status === "ready").length;

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (query: string) => {
    // Add user message immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(query);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠ Error: ${
          err instanceof Error ? err.message : "Something went wrong."
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-primary)",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          padding: "0.9rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))",
            border: "1px solid rgba(124,58,237,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🤖
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>AI Recruitment Assistant</p>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {readyCount > 0
              ? `Querying across ${readyCount} indexed candidate${readyCount > 1 ? "s" : ""}`
              : "Upload résumés on the left to begin"}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 99,
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.2)",
            fontSize: "0.68rem",
            color: "var(--accent-light)",
            fontFamily: "monospace",
          }}
        >
          openai · pgvector
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
        }}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.5rem",
              paddingBottom: "3rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: "0.75rem" }}>✦</div>
              <h3
                className="gradient-text"
                style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}
              >
                Ask about your candidates
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 360 }}>
                Use natural language to search, compare, and evaluate candidates
                across all uploaded résumés.
              </p>
            </div>

            {/* Suggested queries */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "center",
                maxWidth: 560,
              }}
            >
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: 99,
                    border: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(124,58,237,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--accent-light)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(124,58,237,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--bg-card)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
