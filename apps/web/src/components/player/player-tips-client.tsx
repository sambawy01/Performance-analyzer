"use client";

import { useState } from "react";
import {
  Lightbulb,
  Target,
  Shield,
  Brain,
  Star,
  BookOpen,
  Trophy,
  TrendingUp,
  MessageCircle,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { MotivationCard } from "./motivation-card";

interface PlayerTipsClientProps {
  playerId: string;
  playerName: string;
  position: string | null;
  stats: {
    avgTrimp: number;
    avgRecovery: number;
    maxSpeed: number;
    avgDistance: number;
    acwr: number;
    strength: string;
    strengthValue: string;
    growthArea: string;
    growthValue: string;
  };
}

interface TipCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  content: string;
  why?: string;
  accentBg: string;
}

function TipCard({ icon, color, title, content, why, accentBg }: TipCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass rounded-xl p-4 border transition-all duration-200 ${accentBg}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
          <p className="text-xs text-white/60 leading-relaxed">{content}</p>
          {why && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-[10px] text-white/30 hover:text-white/50 transition-colors"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
                Why this matters
              </button>
              {expanded && (
                <p className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                  {why}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayerTipsClient({
  playerId,
  playerName,
  position,
  stats,
}: PlayerTipsClientProps) {
  // Determine load status for daily tip context
  const loadStatus =
    stats.acwr > 1.3
      ? "high-load"
      : stats.acwr < 0.8
      ? "under-training"
      : "optimal";

  const dailyTip = getDailyTip(loadStatus, stats);

  // Training recommendations based on data
  const focusRec = getFocusRecommendation(stats);
  const recoveryRec = getRecoveryRecommendation(stats);
  const mentalRec = getMentalRecommendation(stats);

  return (
    <div className="space-y-5">
      {/* Daily Tip */}
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff6b35] via-[#00d4ff] to-[#00ff88]" />
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-[#ff6b35]" />
          <span className="text-xs font-semibold text-[#ff6b35] uppercase tracking-wider">
            Today's Tip
          </span>
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          {dailyTip.title}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed">
          {dailyTip.content}
        </p>
      </div>

      {/* Training Recommendations */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Training Recommendations
        </h2>
        <div className="space-y-2">
          <TipCard
            icon={<Target size={16} style={{ color: "#00d4ff" }} />}
            color="#00d4ff"
            title={focusRec.title}
            content={focusRec.content}
            why={focusRec.why}
            accentBg="border-[#00d4ff]/10"
          />
          <TipCard
            icon={<Shield size={16} style={{ color: "#00ff88" }} />}
            color="#00ff88"
            title={recoveryRec.title}
            content={recoveryRec.content}
            why={recoveryRec.why}
            accentBg="border-[#00ff88]/10"
          />
          <TipCard
            icon={<Brain size={16} style={{ color: "#a855f7" }} />}
            color="#a855f7"
            title={mentalRec.title}
            content={mentalRec.content}
            why={mentalRec.why}
            accentBg="border-[#a855f7]/10"
          />
        </div>
      </div>

      {/* AI Motivation Feed */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Insights & Motivation
        </h2>
        <div className="space-y-2">
          {/* Your Strength */}
          <TipCard
            icon={<Star size={16} style={{ color: "#00ff88" }} />}
            color="#00ff88"
            title="Your Strength"
            content={`Your ${stats.strength.toLowerCase()} stands out. With a recent ${stats.strengthValue} average, you're showing real quality in this area. This is your weapon — use it.`}
            accentBg="border-[#00ff88]/10"
          />

          {/* Growth Area */}
          <TipCard
            icon={<TrendingUp size={16} style={{ color: "#ff6b35" }} />}
            color="#ff6b35"
            title="Growth Area"
            content={`Your ${stats.growthArea.toLowerCase()} at ${stats.growthValue} has room to grow. Focus sessions targeting this will round out your game and make you more complete.`}
            why={`The best players aren't just strong in one area. Working on your ${stats.growthArea.toLowerCase()} will make your ${stats.strength.toLowerCase()} even more effective because opponents can't predict you.`}
            accentBg="border-[#ff6b35]/10"
          />

          {/* Did You Know */}
          <TipCard
            icon={<BookOpen size={16} style={{ color: "#00d4ff" }} />}
            color="#00d4ff"
            title="Did You Know?"
            content={getFootballFact(position)}
            accentBg="border-[#00d4ff]/10"
          />

          {/* Challenge of the Week */}
          <TipCard
            icon={<Trophy size={16} style={{ color: "#ff3355" }} />}
            color="#ff3355"
            title="Challenge of the Week"
            content={getWeeklyChallenge(stats)}
            accentBg="border-[#ff3355]/10"
          />

          {/* Coach Says */}
          <TipCard
            icon={<MessageCircle size={16} style={{ color: "#a855f7" }} />}
            color="#a855f7"
            title="Coach Says"
            content={getCoachFeedback(stats, playerName)}
            accentBg="border-[#a855f7]/10"
          />
        </div>
      </div>

      {/* AI-generated card */}
      <MotivationCard playerId={playerId} context="tip" />
    </div>
  );
}

// --- Helper functions to generate contextual content ---

function getDailyTip(
  loadStatus: string,
  stats: { avgRecovery: number; acwr: number }
) {
  if (loadStatus === "high-load") {
    return {
      title: "Recovery is Training Too",
      content: `Your workload ratio (${stats.acwr.toFixed(
        2
      )}) is elevated. Today, focus on active recovery — light jogging, stretching, and hydration. Your body builds strength during rest, not just during training.`,
    };
  }
  if (loadStatus === "under-training") {
    return {
      title: "Time to Push",
      content: `Your workload ratio is below optimal (${stats.acwr.toFixed(
        2
      )}). Your body is ready for more. Increase your intensity in the next session — add extra sprints or extend your high-intensity intervals.`,
    };
  }
  return {
    title: "You're in the Sweet Spot",
    content: `Your training load is perfectly balanced at ${stats.acwr.toFixed(
      2
    )} ACWR. Keep this rhythm going. Consistency at this level is what separates good players from great ones.`,
  };
}

function getFocusRecommendation(stats: {
  maxSpeed: number;
  avgDistance: number;
  avgTrimp: number;
}) {
  if (stats.maxSpeed < 22) {
    return {
      title: "Speed Development",
      content: `Your top speed of ${stats.maxSpeed} km/h has room to grow. Add 3-4 explosive 30m sprints at the end of each warm-up. Focus on driving your knees high and pumping your arms.`,
      why: "Sprint speed is trainable at every age. Small improvements in acceleration translate directly to beating opponents to the ball.",
    };
  }
  if (stats.avgDistance < 5) {
    return {
      title: "Build Your Engine",
      content: `You're averaging ${stats.avgDistance} km per session. Try to maintain a higher work rate throughout. Set a personal target of covering 10% more distance next session.`,
      why: "Distance covered correlates with game influence. Players who cover more ground create more opportunities for themselves and teammates.",
    };
  }
  return {
    title: "Intensity Control",
    content: `With an average TRIMP of ${stats.avgTrimp}, focus on working smarter. Mix high-intensity bursts with recovery periods — this mirrors real match patterns and builds match fitness.`,
    why: "Football is an interval sport. Training your body to recover quickly between efforts is more valuable than constant moderate effort.",
  };
}

function getRecoveryRecommendation(stats: {
  avgRecovery: number;
  acwr: number;
}) {
  if (stats.avgRecovery < 30) {
    return {
      title: "Prioritize Sleep & Hydration",
      content: `Your HR recovery of ${stats.avgRecovery} bpm/60s suggests your body needs more recovery support. Aim for 9+ hours of sleep and drink at least 2L of water daily.`,
      why: "Heart rate recovery is the single best indicator of cardiovascular fitness. Improving it by even 5 bpm shows significant fitness gains.",
    };
  }
  return {
    title: "Maintain Your Recovery Habits",
    content: `Your recovery rate of ${stats.avgRecovery} bpm/60s is solid. Keep your current sleep and nutrition habits. Consider adding 10 minutes of foam rolling after each session.`,
    why: "Good recovery habits compound over time. The consistency you show now will pay dividends as training intensity increases.",
  };
}

function getMentalRecommendation(stats: { acwr: number; avgTrimp: number }) {
  if (stats.acwr > 1.3) {
    return {
      title: "Stay Patient",
      content:
        "Your body is working hard right now. Trust the process — this high-load phase is building your resilience. Visualize yourself performing well in your next session.",
      why: "Mental fatigue often accompanies physical fatigue. Visualization and positive self-talk have been proven to maintain performance even when tired.",
    };
  }
  return {
    title: "Pre-Session Mindset",
    content:
      "Before your next session, set one specific goal. Not 'play well' — something measurable like 'complete 5 sprints at full speed' or 'make 3 forward passes'. Focus sharpens performance.",
    why: "Athletes who set specific session goals improve 23% faster than those who train without intention. Your brain performs better when it knows exactly what success looks like.",
  };
}

function getFootballFact(position: string | null) {
  const facts: Record<string, string> = {
    GK: "Top goalkeepers cover an average of 5.6 km per match. Your positioning and decision-making matter more than distance — every step should be purposeful.",
    CB: "Elite center-backs win 65% of their aerial duels. Your positioning data shows where you naturally gravitate — use this to anticipate rather than react.",
    LB: "Modern full-backs average 10.5 km per match, more than any other position. Your endurance is literally your superpower — the fitter you are, the more dangerous you become.",
    RB: "Modern full-backs average 10.5 km per match, more than any other position. Your endurance is literally your superpower — the fitter you are, the more dangerous you become.",
    CDM: "The best defensive midfielders make 50+ passes per game with 88%+ accuracy. Your work rate data shows you cover the ground — now focus on what you do with the ball.",
    CM: "Box-to-box midfielders like Bellingham cover 12+ km per match. Your distance and sprint data show your engine capacity — the question is how efficiently you use it.",
    CAM: "Creative midfielders make an average of 2.3 key passes per game. Your sprint data matters because the best #10s use explosive acceleration to find pockets of space.",
    LW: "Top wingers reach speeds of 34+ km/h. Your sprint speed is your calling card — every 0.5 km/h improvement makes you harder to defend against.",
    RW: "Top wingers reach speeds of 34+ km/h. Your sprint speed is your calling card — every 0.5 km/h improvement makes you harder to defend against.",
    ST: "Elite strikers sprint an average of 35 times per match. It's not just about speed — it's about timing your runs. Your sprint data shows your explosive capacity.",
    CF: "The modern center-forward presses an average of 23 times per 90 minutes. Your TRIMP data shows your work rate — pressing is a skill that wins matches.",
  };

  return (
    facts[position ?? "CM"] ??
    "Professional footballers run an average of 10-13 km per match. Your session data is building the foundation for that kind of performance. Every training session counts."
  );
}

function getWeeklyChallenge(stats: {
  maxSpeed: number;
  avgTrimp: number;
  avgRecovery: number;
}) {
  if (stats.maxSpeed > 0) {
    const target = (stats.maxSpeed * 1.03).toFixed(1);
    return `Beat your recent top speed of ${stats.maxSpeed} km/h. Target: ${target} km/h. Pick one sprint in training and give it absolutely everything. One sprint. Maximum effort. That's all it takes.`;
  }
  if (stats.avgTrimp > 0) {
    const target = Math.round(stats.avgTrimp * 1.05);
    return `Push your session intensity to a TRIMP of ${target} (5% above your average of ${stats.avgTrimp}). Achieve this by adding two extra high-intensity efforts during drills.`;
  }
  return "Set a personal goal for your next session. Write it down before you start. After the session, check if you hit it. This simple habit accelerates improvement.";
}

function getCoachFeedback(
  stats: { avgTrimp: number; avgRecovery: number; maxSpeed: number },
  name: string
) {
  const firstName = name.split(" ")[0];
  if (stats.avgTrimp > 140 && stats.avgRecovery > 35) {
    return `${firstName} is showing excellent commitment and fitness. The combination of high training load and strong recovery suggests real physical development. Keep this up.`;
  }
  if (stats.avgTrimp > 140) {
    return `${firstName} works incredibly hard in every session — the data proves it. The focus now should be on recovery quality to match that effort. Great attitude.`;
  }
  if (stats.avgRecovery > 35) {
    return `${firstName} has a strong fitness base — that recovery rate shows real cardiovascular development. Time to challenge yourself with higher intensity to unlock the next level.`;
  }
  return `${firstName} is building steadily. Consistency is the foundation of everything in football. Keep showing up, keep working, and the numbers will follow.`;
}
