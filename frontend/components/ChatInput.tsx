"use client";

import { useRef, useState } from "react";

interface Props {
  onSend: (query: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow textarea up to 140px
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        borderTop: "1px solid var(--border)",
        background: "rgba(7,8,15,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="glass"
        style={{
          flex: 1,
          borderRadius: 12,
          padding: "0.65rem 1rem",
          display: "flex",
          alignItems: "flex-end",
          gap: "0.5rem",
          border: "1px solid var(--border)",
          transition: "border-color 0.2s",
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(124,58,237,0.5)";
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--border)";
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about candidates… (e.g. 'Who has 3+ years of React?')"
          disabled={disabled}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            fontFamily: "inherit",
            overflow: "hidden",
          }}
        />
      </div>

      <button
        className="btn-primary"
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Send (Enter)"
      >
        {disabled ? (
          <span style={{ fontSize: 14 }}>⏳</span>
        ) : (
          "↑"
        )}
      </button>
    </div>
  );
}
