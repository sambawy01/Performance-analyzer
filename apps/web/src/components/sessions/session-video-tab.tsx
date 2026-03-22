"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VideoTagType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  Video,
  ExternalLink,
  Clock,
  Target,
  Zap,
  Shield,
  Footprints,
  Goal,
  CircleDot,
  Star,
} from "lucide-react";

interface VideoData {
  id: string;
  source_type: string;
  source_url: string | null;
  processing_status: string;
  duration_seconds: number | null;
}

interface VideoTag {
  id: string;
  timestamp_start: number;
  timestamp_end: number;
  tag_type: string;
  label: string | null;
  players: { name: string; jersey_number: number } | null;
}

const TAG_CONFIG: Record<string, { icon: typeof Goal; color: string; bg: string }> = {
  goal: { icon: Goal, color: "text-[#00ff88]", bg: "bg-[#00ff88]/10 border-[#00ff88]/20" },
  sprint: { icon: Zap, color: "text-[#00d4ff]", bg: "bg-[#00d4ff]/10 border-[#00d4ff]/20" },
  press: { icon: Target, color: "text-[#ff6b35]", bg: "bg-[#ff6b35]/10 border-[#ff6b35]/20" },
  tackle: { icon: Shield, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10 border-[#a855f7]/20" },
  pass: { icon: CircleDot, color: "text-[#00d4ff]", bg: "bg-[#00d4ff]/10 border-[#00d4ff]/20" },
  dribble: { icon: Footprints, color: "text-[#eab308]", bg: "bg-[#eab308]/10 border-[#eab308]/20" },
  custom: { icon: Star, color: "text-white", bg: "bg-white/5 border-white/10" },
};

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatMatchMinute(seconds: number): string {
  return `${Math.floor(seconds / 60)}'`;
}

export function SessionVideoTab({
  videos,
  tags,
  sessionId,
}: {
  videos: VideoData[];
  tags: VideoTag[];
  sessionId: string;
}) {
  const [showTagForm, setShowTagForm] = useState(false);

  const veoLinks = videos.filter((v) => v.source_type === "veo_link");
  const sortedTags = [...tags].sort((a, b) => a.timestamp_start - b.timestamp_start);

  return (
    <div className="space-y-4">
      {/* Video Cards */}
      {veoLinks.length > 0 ? (
        veoLinks.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-[#0a0e1a] to-[#1a1f35] rounded-t-xl flex items-center justify-center relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)",
                  }} />
                </div>
                {/* Center content */}
                <div className="text-center z-10">
                  <div className="rounded-full bg-[#00d4ff]/10 p-5 mb-4 mx-auto w-fit shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                    <Video className="h-10 w-10 text-[#00d4ff]" />
                  </div>
                  <p className="text-lg font-semibold text-white mb-2">Match Recording Available</p>
                  <p className="text-sm text-white/60 mb-4 max-w-md mx-auto">
                    Full match recorded with Veo Cam 3. Open in Veo to watch, clip, and share highlights.
                  </p>
                  {v.source_url && (
                    <a
                      href={v.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-medium hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] transition-all duration-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Veo
                    </a>
                  )}
                  {v.duration_seconds && (
                    <p className="text-xs text-white/40 mt-3 flex items-center gap-1 justify-center">
                      <Clock className="h-3 w-3" />
                      {Math.floor(v.duration_seconds / 60)} minutes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-10 w-10 mx-auto mb-3 text-white/20" />
            <p className="text-base text-white/60">No videos linked to this session.</p>
            <p className="text-sm text-white/40 mt-1">Paste a Veo share link or upload an MP4 to add video.</p>
          </CardContent>
        </Card>
      )}

      {/* Tagged Moments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Tagged Moments</CardTitle>
            {sortedTags.length > 0 && (
              <p className="text-sm text-white/60 mt-0.5">{sortedTags.length} moments tagged by coaching staff</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagForm(!showTagForm)}
            className="border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10"
          >
            + Tag Moment
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTags.length === 0 ? (
            <div className="py-8 text-center">
              <Target className="h-8 w-8 mx-auto mb-3 text-white/20" />
              <p className="text-base text-white/60">No moments tagged yet.</p>
              <p className="text-sm text-white/40 mt-1">Watch the video and tag key moments — goals, tackles, pressing triggers, sprints.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTags.map((tag) => {
                const config = TAG_CONFIG[tag.tag_type] || TAG_CONFIG.custom;
                const Icon = config.icon;
                return (
                  <div
                    key={tag.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-white/[0.03] ${config.bg}`}
                  >
                    <div className={`shrink-0 mt-0.5 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-white">
                          {formatMatchMinute(tag.timestamp_start)}
                        </span>
                        <Badge variant="outline" className={`text-xs font-semibold uppercase ${config.color} border-current/20`}>
                          {tag.tag_type}
                        </Badge>
                        {tag.players && (
                          <span className="text-sm font-medium text-white">
                            #{tag.players.jersey_number} {tag.players.name}
                          </span>
                        )}
                      </div>
                      {tag.label && (
                        <p className="text-sm text-white/70 leading-relaxed">
                          {tag.label}
                        </p>
                      )}
                      <p className="text-xs text-white/40 mt-1 font-mono">
                        {formatTimestamp(tag.timestamp_start)} — {formatTimestamp(tag.timestamp_end)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showTagForm && (
            <TagMomentForm
              sessionId={sessionId}
              videoId={videos[0]?.id}
              onClose={() => setShowTagForm(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TagMomentForm({
  sessionId,
  videoId,
  onClose,
}: {
  sessionId: string;
  videoId?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!videoId) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("video_tags").insert({
      video_id: videoId,
      player_id: (formData.get("player_id") as string) || null,
      timestamp_start: parseFloat(formData.get("start") as string) || 0,
      timestamp_end: parseFloat(formData.get("end") as string) || 0,
      tag_type: formData.get("tag_type") as string,
      label: (formData.get("label") as string) || null,
      tagged_by: user?.id ?? "",
    });

    setLoading(false);
    onClose();
  }

  if (!videoId) {
    return (
      <p className="text-sm text-white/60 mt-4">
        Link a video to this session before adding tags.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-white/60">Start (seconds)</Label>
          <Input name="start" type="number" step="0.1" required className="bg-white/[0.04] border-white/10" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-white/60">End (seconds)</Label>
          <Input name="end" type="number" step="0.1" required className="bg-white/[0.04] border-white/10" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-white/60">Tag Type</Label>
        <Select name="tag_type" defaultValue="custom">
          <SelectTrigger className="bg-white/[0.04] border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(VideoTagType).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-white/60">Description</Label>
        <Input name="label" placeholder="e.g. Great pressing trigger from #6 Ziad" className="bg-white/[0.04] border-white/10" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading} className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7]">
          {loading ? "Saving..." : "Save Tag"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="border-white/10">
          Cancel
        </Button>
      </div>
    </form>
  );
}
