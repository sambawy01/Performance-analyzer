import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opsnerve Performance Analyzer",
  description: "AI-powered football performance analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0a0e1a] bg-grid-pattern min-h-screen">
        {children}
      </body>
    </html>
  );
}
