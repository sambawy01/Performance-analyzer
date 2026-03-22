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
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
