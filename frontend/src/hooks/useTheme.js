import { useState, useEffect } from "react";

// ── COLOR TOKENS ─────────────────────────────────────────────────────────────
// These tokens are aligned with the Tailwind config for maximum visibility 
// and a premium 'Industrial Stone' aesthetic.

const DARK = {
  // ── Backgrounds
  bgPage:          "#0c0a09",          // stone-950 (deepest)
  bgCard:          "#1c1917",          // stone-900 (surface)
  bgInput:         "#0c0a09",          // stone-950
  bgGoogle:        "#292524",          // stone-800
  bgGoogleHov:     "#44403c",          // stone-700

  // ── Borders
  borderDefault:   "#44403c",          // stone-700
  borderFocus:     "#f97316",          // brand-orange
  borderCard:      "#292524",          // stone-800

  // ── Brand / Accent
  brandPrimary:    "#f97316",          
  brandHover:      "#ea580c",
  brandSubtle:     "rgba(249,115,22,0.12)",

  // ── Text (CONTRAST FIX)
  textPrimary:     "#fff7ed",          // orange-50 (bright/readable)
  textSecondary:   "#a8a29e",          // stone-400 (visible muted)
  textMuted:       "#78716c",          // stone-500 (visible hints)
  textOnBrand:     "#ffffff",

  // ── Semantic
  successColor:    "#10b981",          // emerald-500
  successBg:       "rgba(16,185,129,0.1)",
  successBorder:   "rgba(16,185,129,0.2)",
  errorColor:      "#ef4444",          // red-500
  errorBg:         "rgba(239,68,68,0.1)",
  errorBorder:     "rgba(239,68,68,0.2)",

  strengthEmpty:   "#292524",
};

const LIGHT = {
  // ── Backgrounds
  bgPage:          "#fff7ed",          // orange-50 (warm cream)
  bgCard:          "#ffffff",          
  bgInput:         "#fdf4e7",
  bgGoogle:        "#fff3e0",
  bgGoogleHov:     "#ffe0b2",

  // ── Borders
  borderDefault:   "#fed7aa",          
  borderFocus:     "#f97316",          
  borderCard:      "#fdba74",          

  // ── Brand / Accent
  brandPrimary:    "#f97316",          
  brandHover:      "#ea580c",
  brandSubtle:     "rgba(249,115,22,0.08)",

  // ── Text
  textPrimary:     "#1c1917",          // stone-900
  textSecondary:   "#78350f",          // amber-900
  textMuted:       "#a16207",          // yellow-700
  textOnBrand:     "#ffffff",

  // ── Semantic
  successColor:    "#059669",
  successBg:       "rgba(5,150,105,0.08)",
  successBorder:   "rgba(5,150,105,0.2)",
  errorColor:      "#dc2626",
  errorBg:         "#fef2f2",
  errorBorder:     "#fecaca",

  strengthEmpty:   "#fed7aa",
};

export function useTheme() {
  const prefersDark = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [isDark, setIsDark] = useState(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { C: isDark ? DARK : LIGHT, isDark };
}