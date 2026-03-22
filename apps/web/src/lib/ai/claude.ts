import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite football performance analyst at Opsnerve, an AI-powered sports analytics platform for youth football academies. You analyze heart rate, load, and training data to provide actionable coaching insights.

Your audience is football coaches and directors at youth academies (players aged 12-16). Speak in clear, direct language. No jargon without explanation. Be specific — name players, cite numbers, give concrete recommendations.

Key metrics you understand:
- HR zones: Z1 (recovery <60% max), Z2 (aerobic 60-70%), Z3 (tempo 70-80%), Z4 (threshold 80-90%), Z5 (anaerobic >90%)
- TRIMP: Training Impulse — HR-based session load score. Higher = more intense.
- ACWR: Acute:Chronic Workload Ratio. Optimal 0.8-1.3. Caution 1.3-1.5. Danger >1.5.
- HR Recovery: BPM drop in first 60 seconds post-effort. Higher = better fitness.

Always be constructive. Focus on what coaches can DO, not just what the data says.`;

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

  const prompt = `Analyze this youth football player's recent performance data and write a development summary.

PLAYER: ${name}
POSITION: ${position}
AGE GROUP: U${2026 - parseInt(ageGroup)} (${ageGroup})
AGE: ${age} years

RECENT SESSIONS (${sessionsData.length} sessions):
${sessionsData.map(s => `- ${s.date} | HR avg: ${s.hr_avg} bpm, max: ${s.hr_max} bpm | TRIMP: ${Math.round(s.trimp_score)} | Z4+Z5: ${Math.round(s.hr_zone_4_pct + s.hr_zone_5_pct)}% | Recovery: ${s.hr_recovery_60s ?? 'N/A'} bpm`).join('\n')}

LOAD HISTORY (${loadHistory.length} records):
${loadHistory.map(l => `- ${l.date} | Load: ${Math.round(l.daily_load)} | ACWR: ${l.acwr_ratio} (${l.risk_flag})`).join('\n')}

Write a 3-4 paragraph development summary covering:
1. Current physical form — HR trends, fitness indicators, intensity patterns
2. Load management — ACWR status, injury risk assessment, workload trajectory
3. Key strengths and areas to develop based on the data
4. Specific coaching recommendations for the next 1-2 weeks

Be specific to this player. Reference actual numbers. Keep it under 200 words.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "Unable to generate summary.";
}

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

  const avgHr = Math.round(playerMetrics.reduce((s, m) => s + m.hr_avg, 0) / playerMetrics.length);
  const maxHr = Math.max(...playerMetrics.map(m => m.hr_max));
  const avgTrimp = Math.round(playerMetrics.reduce((s, m) => s + m.trimp_score, 0) / playerMetrics.length);
  const avgZ5 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_5_pct, 0) / playerMetrics.length);

  const prompt = `Analyze this training session and write a coaching summary.

SESSION: ${type} on ${date} at ${location}
DURATION: ${duration ?? 'Unknown'} minutes
AGE GROUP: U${2026 - parseInt(ageGroup)} (${ageGroup})
COACH NOTES: ${notes ?? 'None'}
PLAYERS TRACKED: ${playerMetrics.length}

TEAM AVERAGES:
- Avg HR: ${avgHr} bpm | Peak HR: ${maxHr} bpm
- Avg TRIMP: ${avgTrimp}
- Avg time in Z5 (anaerobic): ${avgZ5}%

TOP 3 BY LOAD:
${[...playerMetrics].sort((a, b) => b.trimp_score - a.trimp_score).slice(0, 3).map(m => `- ${m.name} (${m.position}): HR avg ${m.hr_avg}, TRIMP ${Math.round(m.trimp_score)}, Z4+Z5: ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`).join('\n')}

${loadAlerts.length > 0 ? `INJURY RISK ALERTS:\n${loadAlerts.map(a => `- ${a.name}: ACWR ${a.acwr_ratio} (${a.risk_flag})`).join('\n')}` : 'No injury risk alerts.'}

Write a 2-3 sentence session summary for the coach, then 2-3 bullet points of key observations and recommendations. Under 150 words total.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "Unable to generate summary.";
}
