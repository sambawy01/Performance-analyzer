"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

interface MetricInfoProps {
  term: string;
  children?: React.ReactNode;
}

const METRIC_EXPLANATIONS: Record<string, { title: string; what: string; why: string; good: string; bad: string }> = {
  // Heart rate metrics
  "hr-avg": {
    title: "Average Heart Rate",
    what: "The average number of heartbeats per minute across the entire session for this player.",
    why: "Shows overall session intensity. Higher = harder session. Compare across sessions to track fitness — as fitness improves, avg HR for the same effort drops.",
    good: "120-155 bpm for training, 150-175 bpm for matches (youth players).",
    bad: "Consistently above 170 bpm in training suggests overexertion. Below 110 bpm may mean the player isn't being pushed enough.",
  },
  "hr-max": {
    title: "Peak Heart Rate",
    what: "The highest heart rate recorded during the session.",
    why: "Shows the peak physical demand. Useful for checking if players hit high-intensity zones during drills designed for it.",
    good: "Within 85-95% of their individual HRmax during high-intensity sessions.",
    bad: "Consistently hitting 100% HRmax suggests the player is being pushed beyond safe limits.",
  },
  "hr-zones": {
    title: "HR Zones",
    what: "Heart rate zones divide effort into 5 levels based on % of max HR. Z1 (Recovery <60%), Z2 (Aerobic 60-70%), Z3 (Tempo 70-80%), Z4 (Threshold 80-90%), Z5 (Anaerobic >90%).",
    why: "Different zones train different physical qualities. Recovery sessions should be Z1-Z2. High-intensity training should include Z4-Z5 bursts.",
    good: "Match: 25-35% in Z4+Z5. Training: depends on session type. Recovery: 80%+ in Z1-Z2.",
    bad: "Recovery session with high Z4-Z5 time means the session was too intense for its purpose.",
  },
  "hr-recovery": {
    title: "HR Recovery (60s)",
    what: "How many BPM the heart rate drops in the first 60 seconds after exercise stops.",
    why: "One of the best indicators of cardiovascular fitness. Better fitness = faster recovery. Also an early warning for overtraining — declining recovery signals accumulated fatigue.",
    good: "Above 30 bpm drop = excellent fitness. 20-30 bpm = good. Regular monitoring shows fitness trends.",
    bad: "Below 15 bpm or declining over weeks suggests overtraining, illness, or insufficient rest.",
  },
  // Load metrics
  "trimp": {
    title: "TRIMP (Training Impulse)",
    what: "A single number that captures total session load by combining duration and heart rate intensity. Higher = more physically demanding session.",
    why: "Allows comparing load across different session types. A 60-min high-intensity session might have the same TRIMP as a 90-min low-intensity one.",
    good: "Match: 150-250. Hard training: 120-200. Technical: 60-120. Recovery: 20-60.",
    bad: "Consistently above 200 in training suggests sessions are too demanding for youth players.",
  },
  "acwr": {
    title: "ACWR (Acute:Chronic Workload Ratio)",
    what: "Compares the last 7 days of training load (acute) to the last 28 days (chronic). It's the #1 predictor of injury risk in sport.",
    why: "If a player suddenly does much more than they're used to (spike), injury risk skyrockets. ACWR tracks this automatically.",
    good: "0.8-1.3 is the 'sweet spot' — the player is training at a level their body is adapted to.",
    bad: "Above 1.5 = danger zone (load spiked 50%+ above normal). Below 0.8 = under-training (losing fitness).",
  },
  "risk-flag": {
    title: "Risk Flag",
    what: "Color-coded injury risk based on ACWR. Green (safe, 0.8-1.3), Amber (caution, 1.3-1.5), Red (danger, >1.5), Blue (under-training, <0.8).",
    why: "Instant visual indicator so coaches can make quick decisions about player load without reading numbers.",
    good: "Green = keep going. Amber = monitor and consider reducing. Blue = player needs more load.",
    bad: "Red = immediate action needed. Reduce load, consider rest day, don't play full match.",
  },
  // Tactical metrics
  "formation": {
    title: "Formation",
    what: "The team's average positional shape during the session (e.g., 4-3-3, 4-2-3-1), calculated from player positions tracked by video analysis.",
    why: "Shows the team's tactical structure and how it changed during the session. Multiple changes may indicate reactive coaching or unsettled shape.",
    good: "Consistent formation with planned changes (e.g., switching to 4-4-2 to defend a lead).",
    bad: "Frequent unplanned changes suggest the team is struggling to maintain shape.",
  },
  "possession": {
    title: "Possession %",
    what: "The percentage of time the team had control of the ball during the session or match.",
    why: "Indicates playing style and control. High possession teams play through the middle, low possession teams rely on counter-attacks.",
    good: "Match: 50%+ shows control. Training: depends on drill design. Not always better — some teams win with 35% possession.",
    bad: "Below 40% in a match suggests the team was under sustained pressure and couldn't keep the ball.",
  },
  "ppda": {
    title: "PPDA (Passes Per Defensive Action)",
    what: "How many passes the opponent makes before your team wins the ball back. Lower = more aggressive pressing.",
    why: "Measures pressing intensity objectively. Elite pressing teams like Liverpool operate at 6-8 PPDA. More conservative teams at 12+.",
    good: "Under 10 = active pressing. 8 or below = aggressive high press. Appropriate for session goals.",
    bad: "Above 14 = very passive. Either a tactical choice, or the team is too tired to press effectively.",
  },
  "compactness": {
    title: "Compactness",
    what: "The average distance (in meters) between the team's furthest-apart players. Measured from video tracking.",
    why: "Shows how tight the team stays as a unit. Compact teams are harder to play through but can be vulnerable to long balls.",
    good: "Under 30m = well-organized. 25-28m is ideal for most youth teams.",
    bad: "Above 35m = stretched. Large gaps between defense and midfield that opponents can exploit.",
  },
  "def-line": {
    title: "Defensive Line Height",
    what: "How far from the team's own goal line the defensive line (back 4) positions itself, in meters.",
    why: "Higher line = more aggressive, squeezes play into opponent's half. Lower line = more conservative, protects the goal.",
    good: "35-45m for youth teams. Should match the team's pressing strategy — high press needs high line.",
    bad: "High line (45m+) without corresponding pressing exposes space behind. Low line (<30m) invites sustained pressure.",
  },
  "team-shape": {
    title: "Team Shape (W × L)",
    what: "The width and length of the team's positional spread in meters. Width = side to side. Length = goal to goal.",
    why: "Shows how the team occupies space. Wider teams stretch the opposition but are harder to keep compact. Longer teams cover more ground but leave gaps.",
    good: "Width 35-42m, Length 28-35m for most formations. Narrow in defense, wide in attack.",
    bad: "Width below 30m = too narrow, easy to press. Length above 40m = disconnected lines.",
  },
  "transition-atk": {
    title: "Transition Speed (Def → Atk)",
    what: "Average time in seconds for the team to reorganize from a defensive shape into an attacking shape after winning the ball.",
    why: "Faster transitions create more goal-scoring opportunities. The best moments to score are immediately after winning the ball when the opponent is out of shape.",
    good: "Under 3.5 seconds = excellent counter-attacking ability.",
    bad: "Above 5 seconds = the team is too slow to exploit turnovers. Opponents have time to get back in shape.",
  },
  "transition-def": {
    title: "Transition Speed (Atk → Def)",
    what: "Average time in seconds for the team to get back into defensive shape after losing the ball.",
    why: "Faster defensive transitions prevent counter-attacks. This is about work rate and tactical discipline — do players sprint back immediately?",
    good: "Under 3 seconds = excellent defensive recovery. Players react immediately to loss of possession.",
    bad: "Above 4 seconds = vulnerable to counter-attacks. Players are ball-watching instead of recovering.",
  },
  // Session metrics
  "session-intensity": {
    title: "Session Intensity",
    what: "An overall rating of how physically demanding the session was, based on average TRIMP across all players.",
    why: "Helps plan the training week — you need a mix of high, medium, and low intensity days. Back-to-back high-intensity days increase injury risk.",
    good: "Matches the session's purpose. Recovery sessions should be 'Low', match prep should be 'Moderate-High'.",
    bad: "Recovery sessions rated 'High' or match prep rated 'Very Low' suggest the session didn't achieve its goal.",
  },
  "players-tracked": {
    title: "Players Tracked",
    what: "The number of players who wore chest strap heart rate monitors during this session.",
    why: "More players tracked = more complete picture. If players are missing, their load can't be monitored and injury risk can't be assessed.",
    good: "All players in the session wearing straps.",
    bad: "Missing players means gaps in load tracking — their ACWR calculations will be inaccurate.",
  },
};

export function MetricInfo({ term, children }: MetricInfoProps) {
  const [open, setOpen] = useState(false);
  const info = METRIC_EXPLANATIONS[term];

  if (!info) {
    return <>{children}</>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="shrink-0 opacity-30 hover:opacity-100 transition-opacity"
        title={`What is ${info.title}?`}
      >
        <HelpCircle className="h-3.5 w-3.5 text-[#00d4ff]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0f1629] border border-white/10 rounded-xl shadow-[0_0_40px_rgba(0,212,255,0.15)] max-w-md w-full mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#00d4ff]" />
                <h3 className="font-semibold text-white">{info.title}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#00d4ff] mb-1">What is it?</p>
                <p className="text-sm text-white/70 leading-relaxed">{info.what}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#a855f7] mb-1">Why does it matter?</p>
                <p className="text-sm text-white/70 leading-relaxed">{info.why}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#00ff88] mb-1">What&apos;s good?</p>
                <p className="text-sm text-white/70 leading-relaxed">{info.good}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#ff3355] mb-1">Warning signs</p>
                <p className="text-sm text-white/70 leading-relaxed">{info.bad}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
