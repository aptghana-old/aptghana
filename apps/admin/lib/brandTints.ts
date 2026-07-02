/**
 * Deterministic tint palette for brand identity tiles (list cards + detail
 * hero). A brand without a logo gets an initials tile whose colour is stable
 * across renders because it's derived from the brand name.
 */
export interface BrandTint {
  bg: string;
  fg: string;
}

const TINTS: BrandTint[] = [
  { bg: "#E7F8EF", fg: "#0B8A4E" },
  { bg: "#FDECEC", fg: "#C0392B" },
  { bg: "#E6F7F6", fg: "#0BA5A5" },
  { bg: "#EEF0FF", fg: "#3D4CD6" },
  { bg: "#EAF4FE", fg: "#0369A1" },
  { bg: "#FFF3E6", fg: "#B45309" },
  { bg: "#FFF7E0", fg: "#B7791F" },
  { bg: "#F3ECFD", fg: "#7C3AED" },
];

export function brandTint(name: string): BrandTint {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

export function brandInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
