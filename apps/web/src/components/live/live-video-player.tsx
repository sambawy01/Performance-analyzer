"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Settings, Maximize2 } from "lucide-react";

interface LiveVideoPlayerProps {
  streamUrl?: string | null;
  veoShareUrl?: string | null;
}

export function LiveVideoPlayer({
  streamUrl,
  veoShareUrl,
}: LiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(streamUrl || "");

  // HLS.js setup for RTMP relay streams
  useEffect(() => {
    const video = videoRef.current;
    const url = customUrl || streamUrl;

    if (!video || !url) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video
          .play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(() => {
            setError("Autoplay blocked — click to play");
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Stream not available — check if Veo is streaming");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Stream error — retrying...");
              hls.destroy();
              break;
          }
        }
      });

      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().then(() => setIsPlaying(true));
      });
    }
  }, [streamUrl, customUrl]);

  // If we have a Veo share URL but no HLS stream, show the Veo link
  if (!streamUrl && !customUrl && veoShareUrl) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4 text-blue-500" />
              Live Video
            </CardTitle>
            <Badge variant="outline">Veo Link</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center text-white/80">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-2">Veo Live Stream</p>
              <a
                href={veoShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm transition-colors"
              >
                Open in Veo
                <Maximize2 className="h-3 w-3" />
              </a>
              <p className="text-xs text-white/60 mt-3 max-w-xs mx-auto">
                To embed the stream directly, configure Veo&apos;s Custom RTMP
                Destination to push to your relay server, then enter the HLS URL
                below.
              </p>
              <button
                onClick={() => setShowConfig(true)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 mx-auto"
              >
                <Settings className="h-3 w-3" />
                Configure HLS stream URL
              </button>
              {showConfig && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="https://your-server.com/live/stream.m3u8"
                    className="w-full px-3 py-1.5 rounded bg-white/10 text-white text-xs border border-white/20"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customUrl) {
                        setShowConfig(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No video source at all
  if (!streamUrl && !customUrl) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <VideoOff className="h-4 w-4 text-muted-foreground" />
              Live Video
            </CardTitle>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Configure
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center text-white/60">
              <VideoOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">No video stream configured</p>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Set up Veo → Custom RTMP → your relay server, then enter the HLS
                URL to embed live video here.
              </p>
              {showConfig && (
                <div className="mt-4 max-w-sm mx-auto">
                  <input
                    type="text"
                    placeholder="https://your-server.com/live/stream.m3u8"
                    className="w-full px-3 py-1.5 rounded bg-white/10 text-white text-xs border border-white/20 mb-2"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <p className="text-xs text-white/60">
                    Enter an HLS (.m3u8) URL from your RTMP relay
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // HLS stream available — show the video player
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4 text-blue-500" />
            Live Video
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <Badge className="bg-red-600 text-white animate-pulse">
                LIVE
              </Badge>
            )}
            {error && (
              <Badge variant="outline" className="text-amber-500">
                {error}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-video bg-black rounded-b-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            playsInline
            muted
            onClick={() => {
              if (videoRef.current?.paused) {
                videoRef.current.play().then(() => setIsPlaying(true));
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
