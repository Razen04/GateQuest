// Shared design tokens for the profile "Liquid Glass" system.
// One source of truth so every panel reads as the same material.

export const palette = {
    photon: '#3E8EFF', // primary signal — questions solved / primary actions
    mint: '#2FD8A9', // accuracy / success
    ember: '#FF9F43', // study streak
    violet: '#8B7FFF', // learning streak
};

// The core "glass" surface: soft tint + inset top highlight + real depth shadow.
// This inset highlight is what separates real glass from a flat frosted rectangle.
export const glassPanel =
    'relative overflow-hidden border border-white/70 bg-white/40 ' +
    'shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25),inset_0_1px_0_0_rgba(255,255,255,0.7)] ' +
    'backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] ' +
    'dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] dark:backdrop-blur-3xl';

// Smaller inner surface (tiles, badges, rows within a glassPanel)
export const glassTile =
    'relative overflow-hidden border border-white/60 bg-white/50 ' +
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-white/[0.05] ' +
    'dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]';

export const eyebrow =
    "text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-white/40 font-['JetBrains_Mono',monospace]";
