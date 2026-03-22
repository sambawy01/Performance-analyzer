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
import { VideoTagType } from "@opsnerve/types";
import { createClient } from "@/lib/supabase/client";

interface Video {
  id: string;
  source_type: string;
  source_url: string | null;
  processing_status: string;
}

interface VideoTag {
  id: string;
  timestamp_start: number;
  timestamp_end: number;
  tag_type: string;
  label: string | null;
  players: { name: string; jersey_number: number } | null;
}

export function SessionVideoTab({
  videos,
  tags,
  sessionId,
}: {
  videos: Video[];
  tags: VideoTag[];
  sessionId: string;
}) {
  const [showTagForm, setShowTagForm] = useState(false);

  const veoLinks = videos.filter((v) => v.source_type === "veo_link");

  return (
    <div className="space-y-4">
      {/* Veo Embeds */}
      {veoLinks.length > 0 ? (
        veoLinks.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle>Video</CardTitle>
            </CardHeader>
            <CardContent>
              {v.source_url ? (
                <div className="aspect-video rounded-md overflow-hidden border">
                  <iframe
                    src={v.source_url}
                    className="w-full h-full"
                    allowFullScreen
                    title="Veo video"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No video URL available.
                </p>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No videos linked to this session yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tags List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tagged Moments</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagForm(!showTagForm)}
          >
            + Tag Moment
          </Button>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No moments tagged yet. Use the button above to add tags.
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{tag.tag_type}</Badge>
                    <span className="text-sm">
                      {Math.floor(tag.timestamp_start / 60)}:
                      {String(
                        Math.floor(tag.timestamp_start % 60)
                      ).padStart(2, "0")}
                      {" - "}
                      {Math.floor(tag.timestamp_end / 60)}:
                      {String(
                        Math.floor(tag.timestamp_end % 60)
                      ).padStart(2, "0")}
                    </span>
                    {tag.label && (
                      <span className="text-sm text-muted-foreground">
                        {tag.label}
                      </span>
                    )}
                  </div>
                  {tag.players && (
                    <span className="text-xs text-muted-foreground">
                      #{tag.players.jersey_number} {tag.players.name}
                    </span>
                  )}
                </div>
              ))}
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
      <p className="text-sm text-muted-foreground mt-4">
        Link a video to this session before adding tags.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Start (seconds)</Label>
          <Input name="start" type="number" step="0.1" required />
        </div>
        <div className="space-y-1">
          <Label>End (seconds)</Label>
          <Input name="end" type="number" step="0.1" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Tag Type</Label>
        <Select name="tag_type" defaultValue="custom">
          <SelectTrigger>
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
        <Label>Label (optional)</Label>
        <Input name="label" placeholder="e.g. Great press from Ahmed" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Save Tag"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
