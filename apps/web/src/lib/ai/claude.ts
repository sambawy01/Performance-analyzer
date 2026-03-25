import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * @deprecated Use the new enrichPlayerContext + SYSTEM_PROMPTS.PLAYER_DEVELOPMENT pattern directly in the route.
 * Kept for backward compatibility.
 */
export async function generatePlayerDevelopmentSummary(playerData: {
  name: string;
  position: string;
  ageGroup: string;
  age: number;
  sessionsData: Array<{
    date: string;
    type: string;
    hr_avg: number;
    hr_max: number;
    trimp_score: number;
    hr_zone_1_pct: number;
    hr_zone_2_pct: number;
    hr_zone_3_pct: number;
    hr_zone_4_pct: number;
    hr_zone_5_pct: number;
    hr_recovery_60s: number | null;
  }>;
  loadHistory: Array<{
    date: string;
    daily_load: number;
    acwr_ratio: number;
    risk_flag: string;
  }>;
}): Promise<string> {
  const { name, position, ageGroup, age, sessionsData, loadHistory } = playerData;

  const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.PLAYER_DEVELOPMENT}`;

  const prompt = `Analyze this youth football player's recent performance data and write a development summary using the 4-Corner Model.

PLAYER: ${name}
POSITION: ${position}
AGE GROUP: U${2026 - parseInt(ageGroup)} (${ageGroup})
AGE: ${age} years

RECENT SESSIONS (${sessionsData.length} sessions):
${sessionsData.map(s => `- ${s.date} | ${s.type} | HR avg: ${s.hr_avg} bpm, max: ${s.hr_max} bpm | TRIMP: ${Math.round(s.trimp_score)} | Z4+Z5: ${Math.round(s.hr_zone_4_pct + s.hr_zone_5_pct)}% | Recovery: ${s.hr_recovery_60s ?? 'N/A'} bpm`).join('\n')}

LOAD HISTORY (${loadHistory.length} records):
${loadHistory.map(l => `- ${l.date} | Load: ${Math.round(l.daily_load)} | ACWR: ${l.acwr_ratio} (${l.risk_flag})`).join('\n')}

Follow the PLAYER DEVELOPMENT output format exactly. Cite specific numbers, compare to position benchmarks, and provide 3 measurable 4-week goals.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "Unable to generate summary.";
}

/**
 * @deprecated Use the new enrichSessionContext + SYSTEM_PROMPTS.SESSION_DEBRIEF pattern directly in the route.
 * Kept for backward compatibility.
 */
export async function generateSessionSummary(sessionData: {
  date: string;
  type: string;
  ageGroup: string;
  location: string;
  duration: number | null;
  notes: string | null;
  playerMetrics: Array<{
    name: string;
    position: string;
    hr_avg: number;
    hr_max: number;
    trimp_score: number;
    hr_zone_1_pct: number;
    hr_zone_2_pct: number;
    hr_zone_3_pct: number;
    hr_zone_4_pct: number;
    hr_zone_5_pct: number;
  }>;
  loadAlerts: Array<{
    name: string;
    acwr_ratio: number;
    risk_flag: string;
  }>;
}): Promise<string> {
  const { date, type, ageGroup, location, duration, notes, playerMetrics, loadAlerts } = sessionData;

  if (playerMetrics.length === 0) {
    return "No wearable data available for this session. Attach chest straps to generate AI analysis.";
  }

  const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.SESSION_DEBRIEF}`;

  const avgHr = Math.round(playerMetrics.reduce((s, m) => s + m.hr_avg, 0) / playerMetrics.length);
  const maxHr = Math.max(...playerMetrics.map(m => m.hr_max));
  const avgTrimp = Math.round(playerMetrics.reduce((s, m) => s + m.trimp_score, 0) / playerMetrics.length);
  const avgZ45 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_4_pct + m.hr_zone_5_pct, 0) / playerMetrics.length);

  const prompt = `Analyze this training session using the SESSION DEBRIEF rubric:

SESSION: ${type} on ${date} at ${location}
DURATION: ${duration ?? 'Unknown'} minutes
AGE GROUP: U${2026 - parseInt(ageGroup)} (${ageGroup})
COACH NOTES: ${notes ?? 'None'}
PLAYERS TRACKED: ${playerMetrics.length}

TEAM AVERAGES:
- Avg HR: ${avgHr} bpm | Peak HR: ${maxHr} bpm | Avg TRIMP: ${avgTrimp} | Avg Z4+Z5: ${avgZ45}%

PER-PLAYER DATA:
${[...playerMetrics].sort((a, b) => b.trimp_score - a.trimp_score).map(m => `- ${m.name} (${m.position}): HR avg ${m.hr_avg}, max ${m.hr_max}, TRIMP ${Math.round(m.trimp_score)}, Z4+Z5: ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`).join('\n')}

${loadAlerts.length > 0 ? `INJURY RISK ALERTS:\n${loadAlerts.map(a => `- ${a.name}: ACWR ${a.acwr_ratio} (${a.risk_flag})`).join('\n')}` : 'No injury risk alerts.'}

Rate the session 1-10 using the rubric. Identify top/bottom performers. Give 5 specific recommendations.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "Unable to generate summary.";
}
