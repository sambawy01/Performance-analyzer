"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";

export function Header({ user }: { user: User }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl px-6 py-3">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/60">
          {user.name}{" "}
          <span className="text-xs uppercase tracking-wider text-[#00d4ff]/60 ml-1">
            {user.role}
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="border-white/10 bg-transparent text-white/60 hover:text-white hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/[0.08] hover:shadow-[0_0_10px_rgba(0,212,255,0.15)] transition-all duration-200"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
