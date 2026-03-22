import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite football performance analyst at Coach M8, an AI-powered sports analytics platform for youth football academies. You analyze heart rate, load, and training data to provide actionable coaching insights.

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

Write a comprehensive player development report with these sections (use ## headers):

## Physical Profile
Analyze HR trends across sessions — is fitness improving (lower resting HR, faster recovery)? How does this player's intensity compare across session types? Identify patterns.

## Load Management Assessment
Current ACWR status and trajectory. Is the load sustainable? When was the last spike? Project where they'll be in 7 days if current pattern continues. Flag any injury risk with specific numbers.

## Strengths (Data-Backed)
What does the data tell us this player does well? High work rate? Good recovery? Consistent performer? Cite specific sessions and metrics.

## Development Areas
Where are the gaps? Poor recovery? Inconsistent intensity? Over/under-training patterns? Be specific.

## Coaching Recommendations
5 specific, actionable recommendations for the next 2 weeks. Each should reference a data point. Format as numbered list.

## Weekly Load Prescription
Suggest an ideal training week template for this player based on their current load state (which days high/medium/low/rest).

Be specific to this player. Reference actual numbers. Write like a performance analyst briefing a head coach.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
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

Write a detailed session analysis report with these sections (use ## headers):

## Session Summary
2-3 sentences capturing the overall session — intensity level, purpose achieved or not, standout observations.

## Intensity Analysis
Break down the team's HR zone distribution. Was this session appropriately intense for its purpose (e.g., recovery session should be mostly Z1-Z2, match prep should hit Z4-Z5)? Compare to expected intensity for this session type.

## Player Standouts
Top 3 performers and why. Also flag the bottom 2 performers — were they underperforming or appropriately managed?

## Load Impact
How does this session affect the team's weekly load? Are any players now in the danger zone that weren't before? Who needs modified training tomorrow?

## Tactical Observations
Based on the intensity patterns, what can we infer about the session structure? High Z5 bursts suggest sprint work, sustained Z3-Z4 suggests possession-based drills.

## Recommendations for Next Session
5 specific, numbered recommendations for the next training session based on today's data.

Write like a performance analyst delivering a post-session debrief to the coaching staff.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "Unable to generate summary.";
}
