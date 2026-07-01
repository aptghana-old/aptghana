import type { Variant } from "@/components/ui/Badge";

/**
 * Presentation-layer mappings for the Group → Category → Subcategory → Range
 * taxonomy (see `LEVELS`/`CategoryLevel` in ./categoryHierarchy for the
 * structural side — parent/child rules, hierarchy resolution).
 */
export const LEVEL_LABEL: Record<string, string> = {
  group: "Group", category: "Category", subcategory: "Subcategory", range: "Range",
};

/** Badge variant per level — reuses the existing design-system palette (no new hex). */
export const LEVEL_BADGE_VARIANT: Record<string, Variant> = {
  group: "blue", category: "info", subcategory: "warning", range: "default",
};

/** Same colors as LEVEL_BADGE_VARIANT's dot, for legends / numbered chips outside a <Badge>. */
export const LEVEL_DOT: Record<string, string> = {
  group: "#3b82f6", category: "#0284c7", subcategory: "#d97706", range: "#94a3b8",
};
