// Centralized feature flags. Add a new flag here instead of an inline
// `if (true)` / `if (process.env.X)` check scattered across apps.

export const FEATURE_FLAGS = {
  articlesEnabled: true,
  searchAnalyticsEnabled: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
