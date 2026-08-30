import type { CSSProperties } from "react";

export const paperTones = [
  { key: "parchment", color: "#f5f0e7" },
  { key: "sage", color: "#b8cdbb" },
  { key: "blue", color: "#bbd1d6" },
  { key: "rose", color: "#dfaaa0" },
  { key: "lilac", color: "#d8c7d8" },
  { key: "butter", color: "#efe0a6" },
  { key: "terracotta", color: "#d7a28e" },
] as const;

export type PaperTone = (typeof paperTones)[number]["key"];
export const isCustomPaperColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
export const getPaperClass = (value: string) => isCustomPaperColor(value) ? "note-custom" : `note-${value || "parchment"}`;

function getRelativeLuminance(hex: string) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255).map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export const getPaperStyle = (value: string): CSSProperties | undefined => {
  if (!isCustomPaperColor(value)) return undefined;
  const dark = getRelativeLuminance(value) < 0.42;
  return {
    "--custom-paper-color": value,
    "--note-ink": dark ? "#fffaf4" : "#352b2a",
    "--note-muted": dark ? "rgba(255,250,244,.78)" : "#766967",
    "--note-line": dark ? "rgba(255,250,244,.34)" : "rgba(93,72,60,.35)",
    "--note-control-bg": dark ? "rgba(255,250,244,.14)" : "rgba(255,250,244,.48)",
    "--note-control-hover": dark ? "rgba(255,250,244,.24)" : "rgba(255,250,244,.82)",
    "--note-accent": dark ? "#ffd1a8" : "#b95748",
  } as CSSProperties;
};
