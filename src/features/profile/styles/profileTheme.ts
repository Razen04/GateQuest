// Shared design tokens for the profile "Liquid Glass" system.
// One source of truth so every panel reads as the same material.

// DEPRECATED: brand palette — all consumers now use inline `chart-*` classes
// (ProfileStatsGrid, ProfileSidePanel, ProfileActivityTabs were the last users).
// Kept as CSS-var aliases for backward compatibility. Safe to delete once:
//   grep -r "palette\." src/features/profile/
// returns nothing.
export const palette = {
    photon: 'var(--chart-1)', // primary signal — vivid blue
    mint: 'var(--chart-2)', // accuracy / success — mint green
    ember: 'var(--chart-5)', // study streak — orange
    violet: 'var(--chart-6)', // learning streak — violet
};

// The core "glass" surface. Composes:
//   - bg-card/40  → theme-tinted, tracks the app's elevated surface
//   - white border/inset → physical glass edge (must stay white in both modes)
//   - --glass-shadow / --glass-edge → themeable via CSS vars (see theme file)
//   - backdrop-blur-2xl + dark:backdrop-blur-3xl → extra depth on dark mode
export const glassPanel =
    'relative overflow-hidden border border-white/70 bg-card/40 ' +
    'shadow-[0_20px_60px_-20px_var(--glass-shadow),inset_0_1px_0_0_var(--glass-edge)] ' +
    'backdrop-blur-2xl dark:border-white/10 dark:backdrop-blur-3xl';

// Smaller inner surface (tiles, badges, rows within a glassPanel).
// More opaque than glassPanel to create depth hierarchy.
export const glassTile =
    'relative overflow-hidden border border-white/60 bg-card/50 ' +
    'shadow-[inset_0_1px_0_0_var(--glass-edge)] dark:border-white/10';

export const eyebrow =
    'text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground font-mono';
