import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach M8 Player",
  description: "Your personal performance dashboard",
};

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0e1a] bg-grid-pattern">
      {children}
    </div>
  );
}
