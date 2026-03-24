import { type LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  accentColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accentColor = "#00d4ff",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-2xl mb-6"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
          border: `1px solid ${accentColor}20`,
          boxShadow: `0 0 40px ${accentColor}08`,
        }}
      >
        <Icon
          className="h-9 w-9"
          style={{
            color: `${accentColor}90`,
            filter: `drop-shadow(0 0 8px ${accentColor}40)`,
          }}
        />
        {/* Subtle animated ring */}
        <div
          className="absolute inset-0 rounded-2xl animate-pulse-slow"
          style={{
            border: `1px solid ${accentColor}10`,
          }}
        />
      </div>

      <h3 className="text-lg font-bold text-white mb-2 text-center">{title}</h3>
      <p className="text-sm text-white/45 max-w-sm text-center leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                color: "#0a0e1a",
                boxShadow: `0 0 20px ${accentColor}30, 0 4px 12px rgba(0,0,0,0.3)`,
              }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                color: "#0a0e1a",
                boxShadow: `0 0 20px ${accentColor}30, 0 4px 12px rgba(0,0,0,0.3)`,
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
