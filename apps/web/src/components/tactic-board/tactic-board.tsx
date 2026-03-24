"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Waypoints,
  Play,
  Save,
  Share2,
  Dumbbell,
  ChevronDown,
  Loader2,
  Sparkles,
  User,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Swords,
  Target,
  RotateCcw,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

export interface EnrichedPlayer {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  age_group: string;
  status: string;
  acwr_ratio: number | null;
  risk_flag: string | null;
  hr_avg: number | null;
  trimp_score: number | null;
  hr_recovery_60s: number | null;
  sprint_count: number | null;
  total_distance_m: number | null;
  max_speed_kmh: number | null;
}

interface PositionSlot {
  id: string;
  label: string; // "GK", "LB", "CB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"
  category: "GK" | "DEF" | "MID" | "ATK";
  x: number; // 0-100 percent of pitch width
  y: number; // 0-100 percent of pitch height (0 = own goal)
  assignedPlayer: EnrichedPlayer | null;
}

interface TacticalAnalysis {
  strengths: string[];
  vulnerabilities: string[];
  playerFitScores: { name: string; position: string; score: number; note: string }[];
  adjustments: string[];
  counterFormations: string[];
  summary: string;
}

/* ────────────────────────────────────────────
   Formation definitions
   ──────────────────────────────────────────── */

type FormationKey = "4-3-3" | "4-2-3-1" | "3-5-2" | "3-4-3" | "4-4-2" | "5-3-2" | "custom";

const FORMATIONS: Record<Exclude<FormationKey, "custom">, Omit<PositionSlot, "id" | "assignedPlayer">[]> = {
  "4-3-3": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "LB", category: "DEF", x: 15, y: 25 },
    { label: "CB", category: "DEF", x: 37, y: 22 },
    { label: "CB", category: "DEF", x: 63, y: 22 },
    { label: "RB", category: "DEF", x: 85, y: 25 },
    { label: "CM", category: "MID", x: 30, y: 45 },
    { label: "CDM", category: "MID", x: 50, y: 40 },
    { label: "CM", category: "MID", x: 70, y: 45 },
    { label: "LW", category: "ATK", x: 20, y: 70 },
    { label: "ST", category: "ATK", x: 50, y: 75 },
    { label: "RW", category: "ATK", x: 80, y: 70 },
  ],
  "4-2-3-1": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "LB", category: "DEF", x: 15, y: 25 },
    { label: "CB", category: "DEF", x: 37, y: 22 },
    { label: "CB", category: "DEF", x: 63, y: 22 },
    { label: "RB", category: "DEF", x: 85, y: 25 },
    { label: "CDM", category: "MID", x: 38, y: 40 },
    { label: "CDM", category: "MID", x: 62, y: 40 },
    { label: "LW", category: "MID", x: 20, y: 58 },
    { label: "CAM", category: "MID", x: 50, y: 60 },
    { label: "RW", category: "MID", x: 80, y: 58 },
    { label: "ST", category: "ATK", x: 50, y: 78 },
  ],
  "3-5-2": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "CB", category: "DEF", x: 25, y: 22 },
    { label: "CB", category: "DEF", x: 50, y: 20 },
    { label: "CB", category: "DEF", x: 75, y: 22 },
    { label: "LWB", category: "MID", x: 10, y: 45 },
    { label: "CM", category: "MID", x: 35, y: 42 },
    { label: "CDM", category: "MID", x: 50, y: 38 },
    { label: "CM", category: "MID", x: 65, y: 42 },
    { label: "RWB", category: "MID", x: 90, y: 45 },
    { label: "ST", category: "ATK", x: 38, y: 72 },
    { label: "ST", category: "ATK", x: 62, y: 72 },
  ],
  "3-4-3": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "CB", category: "DEF", x: 25, y: 22 },
    { label: "CB", category: "DEF", x: 50, y: 20 },
    { label: "CB", category: "DEF", x: 75, y: 22 },
    { label: "LM", category: "MID", x: 15, y: 45 },
    { label: "CM", category: "MID", x: 38, y: 42 },
    { label: "CM", category: "MID", x: 62, y: 42 },
    { label: "RM", category: "MID", x: 85, y: 45 },
    { label: "LW", category: "ATK", x: 22, y: 70 },
    { label: "ST", category: "ATK", x: 50, y: 75 },
    { label: "RW", category: "ATK", x: 78, y: 70 },
  ],
  "4-4-2": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "LB", category: "DEF", x: 15, y: 25 },
    { label: "CB", category: "DEF", x: 37, y: 22 },
    { label: "CB", category: "DEF", x: 63, y: 22 },
    { label: "RB", category: "DEF", x: 85, y: 25 },
    { label: "LM", category: "MID", x: 15, y: 48 },
    { label: "CM", category: "MID", x: 38, y: 45 },
    { label: "CM", category: "MID", x: 62, y: 45 },
    { label: "RM", category: "MID", x: 85, y: 48 },
    { label: "ST", category: "ATK", x: 38, y: 72 },
    { label: "ST", category: "ATK", x: 62, y: 72 },
  ],
  "5-3-2": [
    { label: "GK", category: "GK", x: 50, y: 8 },
    { label: "LWB", category: "DEF", x: 10, y: 30 },
    { label: "CB", category: "DEF", x: 28, y: 22 },
    { label: "CB", category: "DEF", x: 50, y: 20 },
    { label: "CB", category: "DEF", x: 72, y: 22 },
    { label: "RWB", category: "DEF", x: 90, y: 30 },
    { label: "CM", category: "MID", x: 30, y: 45 },
    { label: "CM", category: "MID", x: 50, y: 42 },
    { label: "CM", category: "MID", x: 70, y: 45 },
    { label: "ST", category: "ATK", x: 38, y: 72 },
    { label: "ST", category: "ATK", x: 62, y: 72 },
  ],
};

const CATEGORY_COLORS: Record<string, string> = {
  GK: "#eab308",
  DEF: "#3b82f6",
  MID: "#22d3ee",
  ATK: "#ef4444",
};

const RISK_COLORS: Record<string, string> = {
  green: "#00ff88",
  blue: "#3b82f6",
  amber: "#f59e0b",
  red: "#ff3355",
};

function getPositionSuitability(playerPos: string, slotLabel: string): number {
  const p = playerPos.toUpperCase();
  const s = slotLabel.toUpperCase();
  if (p === s) return 100;
  const posMap: Record<string, string[]> = {
    GK: ["GK"],
    CB: ["CB", "SW"],
    LB: ["LB", "LWB"],
    RB: ["RB", "RWB"],
    LWB: ["LWB", "LB", "LM"],
    RWB: ["RWB", "RB", "RM"],
    CDM: ["CDM", "CM", "CB"],
    CM: ["CM", "CDM", "CAM"],
    CAM: ["CAM", "CM", "SS"],
    LM: ["LM", "LW", "LB"],
    RM: ["RM", "RW", "RB"],
    LW: ["LW", "LM", "ST"],
    RW: ["RW", "RM", "ST"],
    ST: ["ST", "CF", "LW", "RW"],
    CF: ["CF", "ST", "CAM"],
  };
  const compatible = posMap[s] ?? [];
  if (compatible.includes(p)) return 80;
  // Check if the player's position map includes the slot
  const playerCompatible = posMap[p] ?? [];
  if (playerCompatible.includes(s)) return 70;
  // General category match
  const catMap: Record<string, string> = {
    GK: "GK", CB: "DEF", LB: "DEF", RB: "DEF", LWB: "DEF", RWB: "DEF",
    CDM: "MID", CM: "MID", CAM: "MID", LM: "MID", RM: "MID",
    LW: "ATK", RW: "ATK", ST: "ATK", CF: "ATK",
  };
  if (catMap[p] === catMap[s]) return 50;
  return 20;
}

/* ────────────────────────────────────────────
   Football Pitch SVG
   ──────────────────────────────────────────── */

function FootballPitch() {
  return (
    <g>
      {/* Pitch background */}
      <rect x="0" y="0" width="100%" height="100%" rx="12" fill="#0d2818" />
      {/* Subtle grass stripes */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <rect
          key={i}
          x="0"
          y={`${i * 10}%`}
          width="100%"
          height="10%"
          fill={i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent"}
        />
      ))}
      {/* Outer boundary */}
      <rect x="4%" y="3%" width="92%" height="94%" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {/* Center line */}
      <line x1="4%" y1="50%" x2="96%" y2="50%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {/* Center circle */}
      <circle cx="50%" cy="50%" r="10%" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {/* Center spot */}
      <circle cx="50%" cy="50%" r="1%" fill="rgba(255,255,255,0.3)" />
      {/* Goal area bottom (attacking) */}
      <rect x="30%" y="86%" width="40%" height="11%" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="38%" y="91%" width="24%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {/* Goal area top (own goal) */}
      <rect x="30%" y="3%" width="40%" height="11%" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="38%" y="3%" width="24%" height="6%" rx="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {/* Penalty spots */}
      <circle cx="50%" cy="11%" r="0.6%" fill="rgba(255,255,255,0.2)" />
      <circle cx="50%" cy="89%" r="0.6%" fill="rgba(255,255,255,0.2)" />
      {/* Corner arcs */}
      <path d="M 4% 6% A 3% 3% 0 0 1 7% 3%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <path d="M 93% 3% A 3% 3% 0 0 1 96% 6%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <path d="M 4% 94% A 3% 3% 0 0 0 7% 97%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <path d="M 93% 97% A 3% 3% 0 0 0 96% 94%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      {/* Direction arrow */}
      <text x="50%" y="1.8%" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8" fontWeight="bold">ATTACK →</text>
    </g>
  );
}

/* ────────────────────────────────────────────
   Player Token
   ──────────────────────────────────────────── */

interface PlayerTokenProps {
  slot: PositionSlot;
  svgWidth: number;
  svgHeight: number;
  onDragStart: (slotId: string) => void;
  onDrag: (slotId: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onClick: (slotId: string) => void;
  isSelected: boolean;
  hoveredSlotId: string | null;
  onHover: (slotId: string | null) => void;
}

function PlayerToken({
  slot,
  svgWidth,
  svgHeight,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  isSelected,
  hoveredSlotId,
  onHover,
}: PlayerTokenProps) {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const cx = (slot.x / 100) * svgWidth;
  const cy = (slot.y / 100) * svgHeight;
  const color = CATEGORY_COLORS[slot.category] ?? "#fff";
  const riskColor = slot.assignedPlayer?.risk_flag
    ? RISK_COLORS[slot.assignedPlayer.risk_flag] ?? "#666"
    : "#666";
  const isHovered = hoveredSlotId === slot.id;
  const radius = isSelected ? 22 : isHovered ? 20 : 18;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    onDragStart(slot.id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    const svgEl = (e.target as Element).closest("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    const newY = ((e.clientY - rect.top) / rect.height) * 100;
    onDrag(slot.id, Math.max(2, Math.min(98, newX)), Math.max(2, Math.min(98, newY)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    onDragEnd();
    if (!hasMoved.current) {
      onClick(slot.id);
    }
  };

  return (
    <g
      style={{ cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => onHover(slot.id)}
      onPointerLeave={() => onHover(null)}
    >
      {/* Glow */}
      <circle cx={cx} cy={cy} r={radius + 6} fill={`${color}15`} />
      {/* Risk ring */}
      {slot.assignedPlayer && (
        <circle cx={cx} cy={cy} r={radius + 2} fill="none" stroke={riskColor} strokeWidth="2" opacity={0.6} />
      )}
      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`${color}30`}
        stroke={color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{
          filter: isSelected ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color}60)`,
          transition: "r 0.15s ease, filter 0.15s ease",
        }}
      />
      {/* Jersey number */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        fontFamily="var(--font-jetbrains-mono), monospace"
        style={{ pointerEvents: "none" }}
      >
        {slot.assignedPlayer?.jersey_number ?? "?"}
      </text>
      {/* Position label below */}
      <text
        x={cx}
        y={cy + radius + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="8"
        fontWeight="600"
        style={{ pointerEvents: "none" }}
      >
        {slot.label}
      </text>
      {/* Player name above (on hover) */}
      {isHovered && slot.assignedPlayer && (
        <g>
          <rect
            x={cx - 50}
            y={cy - radius - 24}
            width="100"
            height="18"
            rx="4"
            fill="rgba(0,0,0,0.85)"
            stroke={`${color}40`}
            strokeWidth="0.5"
          />
          <text
            x={cx}
            y={cy - radius - 13}
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="500"
            style={{ pointerEvents: "none" }}
          >
            {slot.assignedPlayer.name}
          </text>
        </g>
      )}
    </g>
  );
}

/* ────────────────────────────────────────────
   Player Assignment Dropdown
   ──────────────────────────────────────────── */

function PlayerAssignmentPanel({
  slot,
  availablePlayers,
  onAssign,
  onClose,
}: {
  slot: PositionSlot;
  availablePlayers: EnrichedPlayer[];
  onAssign: (slotId: string, player: EnrichedPlayer | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = availablePlayers
    .map((p) => ({
      ...p,
      suitability: getPositionSuitability(p.position, slot.label),
    }))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.position.toLowerCase().includes(search.toLowerCase()) ||
        p.jersey_number.toString().includes(search)
    )
    .sort((a, b) => b.suitability - a.suitability);

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-[#0c1020]/95 backdrop-blur-xl border-l border-white/[0.08] z-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Assign Player</h4>
            <p className="text-xs text-white/40">
              Position: <span style={{ color: CATEGORY_COLORS[slot.category] }}>{slot.label}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xs px-2 py-1 rounded bg-white/[0.06]">
            Close
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#22d3ee]/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Unassign option */}
        {slot.assignedPlayer && (
          <button
            onClick={() => onAssign(slot.id, null)}
            className="w-full text-left px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
          >
            Remove {slot.assignedPlayer.name}
          </button>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onAssign(slot.id, p)}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
              slot.assignedPlayer?.id === p.id
                ? "bg-[#22d3ee]/15 border-[#22d3ee]/30"
                : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/60 w-6 text-right">#{p.jersey_number}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{p.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-white/40">{p.position}</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: p.suitability >= 80 ? "#00ff88" : p.suitability >= 50 ? "#f59e0b" : "#ff3355" }}
                  >
                    {p.suitability}% fit
                  </span>
                  {p.risk_flag && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: RISK_COLORS[p.risk_flag] ?? "#666" }}
                    />
                  )}
                </div>
              </div>
              <div className="text-right">
                {p.acwr_ratio != null && (
                  <div className="text-[10px] font-mono text-white/40">
                    ACWR {p.acwr_ratio.toFixed(2)}
                  </div>
                )}
                {p.trimp_score != null && (
                  <div className="text-[10px] font-mono text-white/30">
                    TRIMP {Math.round(p.trimp_score)}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main TacticBoard Component
   ──────────────────────────────────────────── */

export function TacticBoard({ players }: { players: EnrichedPlayer[] }) {
  const [formation, setFormation] = useState<FormationKey>("4-3-3");
  const [opponentFormation, setOpponentFormation] = useState<string>("");
  const [slots, setSlots] = useState<PositionSlot[]>(() => initFormation("4-3-3", players));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [showFormationDropdown, setShowFormationDropdown] = useState(false);
  const [analysis, setAnalysis] = useState<TacticalAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMd, setAnalysisMd] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 600, height: 800 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  function initFormation(key: FormationKey, allPlayers: EnrichedPlayer[]): PositionSlot[] {
    if (key === "custom") return slots;
    const template = FORMATIONS[key];
    const used = new Set<string>();
    return template.map((t, i) => {
      // Auto-assign best available player by position suitability
      let best: EnrichedPlayer | null = null;
      let bestScore = -1;
      for (const p of allPlayers) {
        if (used.has(p.id)) continue;
        const score = getPositionSuitability(p.position, t.label);
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
      if (best) used.add(best.id);
      return {
        id: `slot-${i}`,
        label: t.label,
        category: t.category,
        x: t.x,
        y: t.y,
        assignedPlayer: best,
      };
    });
  }

  const handleFormationChange = (key: FormationKey) => {
    setFormation(key);
    setShowFormationDropdown(false);
    if (key !== "custom") {
      setSlots(initFormation(key, players));
    }
    setAnalysis(null);
    setAnalysisMd("");
  };

  const handleDrag = useCallback((slotId: string, x: number, y: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, x, y } : s))
    );
  }, []);

  const handleAssign = (slotId: string, player: EnrichedPlayer | null) => {
    setSlots((prev) => {
      // If assigning a player, remove them from any other slot first
      let updated = prev;
      if (player) {
        updated = prev.map((s) =>
          s.assignedPlayer?.id === player.id ? { ...s, assignedPlayer: null } : s
        );
      }
      return updated.map((s) => (s.id === slotId ? { ...s, assignedPlayer: player } : s));
    });
    setSelectedSlotId(null);
  };

  const assignedPlayerIds = new Set(slots.filter((s) => s.assignedPlayer).map((s) => s.assignedPlayer!.id));
  const availablePlayers = players.filter((p) => !assignedPlayerIds.has(p.id) || slots.find((s) => s.id === selectedSlotId)?.assignedPlayer?.id === p.id);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisMd("");
    try {
      const body = {
        formation,
        players: slots.map((s) => ({
          position: s.label,
          category: s.category,
          name: s.assignedPlayer?.name ?? "Unassigned",
          jerseyNumber: s.assignedPlayer?.jersey_number ?? 0,
          stats: s.assignedPlayer
            ? {
                acwr: s.assignedPlayer.acwr_ratio,
                riskFlag: s.assignedPlayer.risk_flag,
                hrAvg: s.assignedPlayer.hr_avg,
                trimp: s.assignedPlayer.trimp_score,
                hrRecovery: s.assignedPlayer.hr_recovery_60s,
                sprints: s.assignedPlayer.sprint_count,
                distance: s.assignedPlayer.total_distance_m,
                maxSpeed: s.assignedPlayer.max_speed_kmh,
                suitability: getPositionSuitability(s.assignedPlayer.position, s.label),
              }
            : null,
        })),
        opponentFormation: opponentFormation || undefined,
      };

      const res = await fetch("/api/ai/tactic-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysis(data.analysis);
      setAnalysisMd(data.markdown ?? "");
    } catch (err) {
      console.error("Tactic analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    const plan = {
      formation,
      slots: slots.map((s) => ({
        label: s.label,
        category: s.category,
        x: s.x,
        y: s.y,
        player: s.assignedPlayer
          ? { id: s.assignedPlayer.id, name: s.assignedPlayer.name, jersey: s.assignedPlayer.jersey_number }
          : null,
      })),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("coachm8_match_plan", JSON.stringify(plan));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="relative flex flex-col lg:flex-row gap-4">
      {/* LEFT — Pitch */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Formation selector */}
          <div className="relative">
            <button
              onClick={() => setShowFormationDropdown(!showFormationDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm font-medium text-white hover:bg-white/[0.1] transition-all"
            >
              <span className="text-[#22d3ee] font-mono">{formation === "custom" ? "Custom" : formation}</span>
              <ChevronDown className="h-4 w-4 text-white/40" />
            </button>
            {showFormationDropdown && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-[#0c1020]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl z-40 overflow-hidden">
                {(Object.keys(FORMATIONS) as FormationKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleFormationChange(key)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors ${
                      formation === key ? "text-[#22d3ee] bg-[#22d3ee]/10" : "text-white/70"
                    }`}
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => handleFormationChange("custom")}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors border-t border-white/[0.06] ${
                    formation === "custom" ? "text-[#22d3ee] bg-[#22d3ee]/10" : "text-white/70"
                  }`}
                >
                  Custom (keep current)
                </button>
              </div>
            )}
          </div>

          {/* Opponent formation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">vs</span>
            <select
              value={opponentFormation}
              onChange={(e) => setOpponentFormation(e.target.value)}
              className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white/70 outline-none cursor-pointer"
            >
              <option value="">Opponent formation</option>
              {Object.keys(FORMATIONS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* Reset */}
          <button
            onClick={() => handleFormationChange(formation)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/40 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all ${
              saved
                ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
                : "text-white/60 bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved!" : "Save Plan"}
          </button>

          <ExportShareBar
            title={`Tactical Formation: ${formation}`}
            content={analysisMd || `Formation: ${formation}\nPlayers: ${slots.filter(s => s.assignedPlayer).map(s => `${s.label}: ${s.assignedPlayer!.name}`).join(", ")}`}
          />
        </div>

        {/* SVG Pitch */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            className="w-full"
            style={{ aspectRatio: "3/4", maxHeight: "70vh" }}
            preserveAspectRatio="xMidYMid meet"
          >
            <FootballPitch />
            {slots.map((slot) => (
              <PlayerToken
                key={slot.id}
                slot={slot}
                svgWidth={svgDimensions.width}
                svgHeight={svgDimensions.height}
                onDragStart={() => {}}
                onDrag={handleDrag}
                onDragEnd={() => {}}
                onClick={(id) => setSelectedSlotId(selectedSlotId === id ? null : id)}
                isSelected={selectedSlotId === slot.id}
                hoveredSlotId={hoveredSlotId}
                onHover={setHoveredSlotId}
              />
            ))}
          </svg>

          {/* Player assignment panel overlay */}
          {selectedSlot && (
            <PlayerAssignmentPanel
              slot={selectedSlot}
              availablePlayers={availablePlayers}
              onAssign={handleAssign}
              onClose={() => setSelectedSlotId(null)}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `${color}60`, border: `1.5px solid ${color}` }} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{cat}</span>
            </div>
          ))}
          <div className="h-3 w-px bg-white/10" />
          {Object.entries(RISK_COLORS).map(([flag, color]) => (
            <div key={flag} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full ring-1" style={{ backgroundColor: `${color}40`, borderColor: color, boxShadow: `0 0 4px ${color}40` }} />
              <span className="text-[10px] text-white/40 capitalize">{flag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — AI Analysis Panel */}
      <div className="w-full lg:w-96 shrink-0">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-4 sticky top-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#a855f7]" />
              AI Tactical Analysis
            </h3>
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: analyzing
                ? "rgba(168,85,247,0.15)"
                : "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.15))",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "white",
            }}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing formation...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Analyze Formation
              </>
            )}
          </button>

          {/* Quick actions */}
          <div className="flex gap-2">
            <a
              href="/session-design"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              Training Drills
            </a>
          </div>

          {/* Analysis results */}
          {analysis && (
            <div className="space-y-4 pt-2">
              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#00ff88] flex items-center gap-1.5 mb-2">
                    <Shield className="h-3.5 w-3.5" />
                    STRENGTHS
                  </h4>
                  <div className="space-y-1.5">
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 text-xs text-white/60">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00ff88] shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vulnerabilities */}
              {analysis.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#ff3355] flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    VULNERABILITIES
                  </h4>
                  <div className="space-y-1.5">
                    {analysis.vulnerabilities.map((v, i) => (
                      <div key={i} className="flex gap-2 text-xs text-white/60">
                        <AlertTriangle className="h-3.5 w-3.5 text-[#ff3355] shrink-0 mt-0.5" />
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Fit Scores */}
              {analysis.playerFitScores.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#22d3ee] flex items-center gap-1.5 mb-2">
                    <User className="h-3.5 w-3.5" />
                    PLAYER FIT SCORES
                  </h4>
                  <div className="space-y-1">
                    {analysis.playerFitScores.map((pf, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-white/40 w-8 font-mono">{pf.position}</span>
                        <span className="text-white/70 flex-1 truncate">{pf.name}</span>
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pf.score}%`,
                              backgroundColor: pf.score >= 80 ? "#00ff88" : pf.score >= 50 ? "#f59e0b" : "#ff3355",
                            }}
                          />
                        </div>
                        <span
                          className="font-mono w-8 text-right"
                          style={{ color: pf.score >= 80 ? "#00ff88" : pf.score >= 50 ? "#f59e0b" : "#ff3355" }}
                        >
                          {pf.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adjustments */}
              {analysis.adjustments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#f59e0b] flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5" />
                    SUGGESTED ADJUSTMENTS
                  </h4>
                  <div className="space-y-1.5">
                    {analysis.adjustments.map((a, i) => (
                      <div key={i} className="text-xs text-white/60 pl-5 relative">
                        <span className="absolute left-0 top-0.5 text-[#f59e0b]">{i + 1}.</span>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Counter formations */}
              {analysis.counterFormations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#a855f7] flex items-center gap-1.5 mb-2">
                    <Swords className="h-3.5 w-3.5" />
                    COUNTER-FORMATIONS TO WATCH
                  </h4>
                  <div className="space-y-1.5">
                    {analysis.counterFormations.map((c, i) => (
                      <div key={i} className="text-xs text-white/60 flex gap-1.5">
                        <span className="text-[#a855f7]">--</span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {analysis.summary && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-xs text-white/50 leading-relaxed italic">
                    {analysis.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!analysis && !analyzing && (
            <div className="text-center py-6">
              <Waypoints className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">
                Arrange your players on the pitch, then click Analyze Formation for AI tactical insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
