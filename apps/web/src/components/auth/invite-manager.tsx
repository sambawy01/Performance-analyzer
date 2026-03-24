"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Copy,
  Check,
  Plus,
  Key,
  Clock,
  Users,
} from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  role: string;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
  created_at: string;
}

export function InviteManager({
  initialInvites,
}: {
  initialInvites: InviteCode[];
}) {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteCode[]>(initialInvites);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState("coach");
  const [maxUses, setMaxUses] = useState("1");
  const [expiryDays, setExpiryDays] = useState("30");

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, maxUses, expiryDays }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setGeneratedCode(data.invite.code);
      setInvites((prev) => [data.invite, ...prev]);
      router.refresh();
    } catch {
      setError("Failed to generate invite code");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatus(invite: InviteCode): {
    label: string;
    color: string;
  } {
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { label: "Expired", color: "text-[#ff3355] bg-[#ff3355]/10 border-[#ff3355]/20" };
    }
    if (invite.use_count >= invite.max_uses) {
      return { label: "Used", color: "text-white/40 bg-white/5 border-white/10" };
    }
    return { label: "Active", color: "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20" };
  }

  return (
    <div className="space-y-6">
      {/* Generate new code */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-[#00d4ff]" />
            Generate Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Role
              </Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Max Uses
              </Label>
              <Select value={maxUses} onValueChange={(v) => v && setMaxUses(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Expires
              </Label>
              <Select value={expiryDays} onValueChange={(v) => v && setExpiryDays(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 px-3 py-2">
              <p className="text-sm text-[#ff3355]">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>

          {/* Generated code display */}
          {generatedCode && (
            <div className="rounded-xl bg-[#00ff88]/5 border border-[#00ff88]/20 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#00ff88] uppercase tracking-widest mb-1">
                  New invite code generated
                </p>
                <p className="font-mono text-2xl font-bold text-white tracking-wider">
                  {generatedCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyCode(generatedCode)}
                className="shrink-0 border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing codes list */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-[#a855f7]" />
            Existing Codes ({invites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-center text-white/40 py-8">
              No invite codes yet. Generate your first one above.
            </p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => {
                const status = getStatus(invite);
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-semibold text-white tracking-wider">
                        {invite.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase"
                      >
                        {invite.role}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {invite.use_count}/{invite.max_uses >= 9999 ? "inf" : invite.max_uses}
                      </span>
                      {invite.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        onClick={() => copyCode(invite.code)}
                        className="text-white/30 hover:text-white/70 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
