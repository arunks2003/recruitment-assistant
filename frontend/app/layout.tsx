import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recruitment Copilot — AI-Powered HR Dashboard",
  description:
    "Upload candidate resumes and query your talent pool using natural language. Powered by Llama 3 and Supabase pgvector.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ height: "100vh", overflow: "hidden" }}>
        {/* Ambient background orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
