"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Sign in the user after registration
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Registration succeeded but sign-in failed — redirect to login
        router.push("/login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 focus-visible:border-[#00d4ff]/50 focus-visible:ring-[#00d4ff]/20 focus-visible:shadow-[0_0_15px_rgba(0,212,255,0.15)]";

  return (
    <Card className="w-full max-w-md glow-blue relative z-10">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#a855f7]/20 border border-white/10">
          <UserPlus className="h-6 w-6 text-[#00d4ff]" />
        </div>
        <CardTitle className="text-2xl text-gradient tracking-tight">
          Join Coach M8
        </CardTitle>
        <p className="text-xs text-white/60 uppercase tracking-widest">
          Enter your invite code to get started
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="invite-code"
              className="text-xs uppercase tracking-widest text-white/60"
            >
              Invite Code
            </Label>
            <Input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. MAKER-2026"
              className={`${inputClass} font-mono tracking-wider text-center text-lg`}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs uppercase tracking-widest text-white/60"
            >
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ahmed Hassan"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs uppercase tracking-widest text-white/60"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="coach@academy.com"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-white/60"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                  className={`${inputClass} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-xs uppercase tracking-widest text-white/60"
              >
                Confirm
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat password"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 px-3 py-2">
              <p className="text-sm text-[#ff3355] text-glow-red">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <p className="text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
