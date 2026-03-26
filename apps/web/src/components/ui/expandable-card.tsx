"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableCardAction {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  variant: "primary" | "secondary" | "danger";
  color?: string;
}

interface ExpandableCardProps {
  /** Icon displayed in the header */
  icon?: ReactNode;
  /** Title text (always visible) */
  title: string;
  /** Subtitle text (always visible) */
  subtitle?: string;
  /** Optional badge shown in header */
  badge?: { text: string; color: string };
  /** Accent color for left border glow */
  accentColor?: string;
  /** Content shown when collapsed (preview) */
  preview?: ReactNode;
  /** Content shown when expanded */
  children: ReactNode;
  /** Action buttons shown at the bottom when expanded */
  actions?: ExpandableCardAction[];
  /** Whether card starts expanded */
  defaultExpanded?: boolean;
  /** Optional className for the outer wrapper */
  className?: string;
  /** Compact mode — smaller padding, tighter spacing */
  compact?: boolean;
}

const ACTION_STYLES: Record<
  ExpandableCardAction["variant"],
  { bg: string; border: string; text: string; hover: string }
> = {
  primary: {
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.20)",
    text: "#00d4ff",
    hover: "rgba(0,212,255,0.15)",
  },
  secondary: {
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    text: "rgba(255,255,255,0.7)",
    hover: "rgba(255,255,255,0.08)",
  },
  danger: {
    bg: "rgba(255,51,85,0.08)",
    border: "rgba(255,51,85,0.20)",
    text: "#ff3355",
    hover: "rgba(255,51,85,0.15)",
  },
};

export function ExpandableCard({
  icon,
  title,
  subtitle,
  badge,
  accentColor,
  preview,
  children,
  actions,
  defaultExpanded = false,
  className = "",
  compact = false,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, children, actions]);

  const toggle = () => setExpanded((prev) => !prev);

  const paddingX = compact ? "px-3" : "px-4";
  const paddingY = compact ? "py-2" : "py-3";

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden ${className}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: accentColor
          ? `${accentColor}25`
          : "rgba(255,255,255,0.06)",
        borderLeftWidth: accentColor ? "3px" : undefined,
        borderLeftColor: accentColor || undefined,
        boxShadow: expanded && accentColor
          ? `0 0 20px ${accentColor}10`
          : undefined,
      }}
    >
      {/* Header — clickable */}
      <button
        onClick={toggle}
        className={`w-full ${paddingX} ${paddingY} flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors`}
      >
        {icon && (
          <div className="shrink-0">{icon}</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-white truncate`}>
              {title}
            </span>
            {badge && (
              <span
                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                style={{
                  background: `${badge.color}20`,
                  color: badge.color,
                }}
              >
                {badge.text}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`${compact ? "text-[10px]" : "text-xs"} text-white/40 mt-0.5 truncate`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Preview content — only when collapsed */}
        {!expanded && preview && (
          <div className="hidden sm:block shrink-0">{preview}</div>
        )}

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-white/30 shrink-0 transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable content */}
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: expanded ? `${contentHeight + 16}px` : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <div className={`${paddingX} pb-3 border-t border-white/[0.04] pt-3`}>
            {children}
          </div>

          {/* Actions row */}
          {actions && actions.length > 0 && (
            <div className={`${paddingX} pb-3 flex flex-wrap gap-2`}>
              {actions.map((action, i) => {
                const style = ACTION_STYLES[action.variant];
                const customBg = action.color
                  ? `${action.color}12`
                  : style.bg;
                const customBorder = action.color
                  ? `${action.color}25`
                  : style.border;
                const customText = action.color || style.text;

                const buttonContent = (
                  <>
                    {action.icon && (
                      <span className="shrink-0">{action.icon}</span>
                    )}
                    {action.label}
                  </>
                );

                if (action.href) {
                  return (
                    <a
                      key={i}
                      href={action.href}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: customBg,
                        border: `1px solid ${customBorder}`,
                        color: customText,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {buttonContent}
                    </a>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick?.();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: customBg,
                      border: `1px solid ${customBorder}`,
                      color: customText,
                    }}
                  >
                    {buttonContent}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
