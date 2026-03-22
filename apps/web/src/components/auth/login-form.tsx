"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm glow-blue relative z-10">
      <CardHeader>
        <CardTitle className="text-2xl text-gradient tracking-tight">
          Opsnerve
        </CardTitle>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Performance Analyzer
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-white/40">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:border-[#00d4ff]/50 focus-visible:ring-[#00d4ff]/20 focus-visible:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-white/40">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus-visible:border-[#00d4ff]/50 focus-visible:ring-[#00d4ff]/20 focus-visible:shadow-[0_0_15px_rgba(0,212,255,0.15)]"
            />
          </div>
          {error && (
            <p className="text-sm text-[#ff3355] text-glow-red">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
