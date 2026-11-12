import type { ThemeMode } from './Settings';

/**
 * Donor tier levels.
 * 0 = not a donor
 * 1 = Bronze    (cumulative ≥ ₹50)
 * 2 = Gold      (cumulative ≥ ₹169)
 * 3 = Platinum  (cumulative ≥ ₹569)
 */
export type DonorTier = 0 | 1 | 2 | 3;

/**
 * Minimum cumulative donation required for each paid tier.
 * Tier 0 is the default state (no threshold, no tag).
 */
export const DONOR_TIER_THRESHOLDS = {
    1: 50,
    2: 169,
    3: 569,
} as const;

/**
 * The coarse "user is a donor at all" tag. Set independently by the
 * donation-verification flow. A user who donates get this role.
 */
export const DONOR_ROLE_TAG = 'role:donor';

/**
 * Every valid `donor:tier-*` tag. Exported for admin scripts,
 * tests, and any code that needs to enumerate the family.
 * Never write `donor:tier-0` — tier 0 is represented by the
 * *absence* of any tier tag.
 */
export const ALL_DONOR_TIER_TAGS = [
    'donor:tier-1',
    'donor:tier-2',
    'donor:tier-3',
] as const;

/**
 * Human-readable labels for each tier. Used in tooltips,
 * aria-labels, tier-badge captions, and anywhere a display
 * string is needed.
 */
export const DONOR_TIER_LABELS: Record<DonorTier, string> = {
    0: 'Supporter',
    1: 'Bronze Patron',
    2: 'Gold Patron',
    3: 'Platinum Benefactor',
};

/**
 * Extract the highest donor tier from a user's notification_tags.
 *
 * Defensive against:
 *   - null / undefined / empty arrays (guests, brand-new accounts)
 *   - multiple tier tags present (should never happen if the donation
 *     trigger is correct, but resolves to highest tier if it does)
 *   - unknown tags in the array (silently ignored)
 *
 * Ordered highest-first so lookups short-circuit on the best result.
 */
export function getDonorTier(tags: string[] | null | undefined): DonorTier {
    if (!tags?.length) return 0;
    if (tags.includes('donor:tier-3')) return 3;
    if (tags.includes('donor:tier-2')) return 2;
    if (tags.includes('donor:tier-1')) return 1;
    return 0;
}

/**
 * Whether the user has the coarse `role:donor` tag.
 * Distinct from `getDonorTier(tags) > 0` — a ₹20 donor has
 * `role:donor` but tier 0.
 */
export function isDonor(tags: string[] | null | undefined): boolean {
    return !!tags?.includes(DONOR_ROLE_TAG);
}

/**
 * Inverse of `getDonorTier`. Returns the tag string for a tier,
 * or `null` for tier 0 (which is tagless).
 */
export function tierToTag(tier: DonorTier): string | null {
    return tier === 0 ? null : `donor:tier-${tier}`;
}

/**
 * The tier one step above `tier`, or `null` if already at max.
 * Used for "X more to reach <tier>" progress UI.
 */
const NEXT_TIER: Record<DonorTier, DonorTier | null> = {
    0: 1,
    1: 2,
    2: 3,
    3: null,
};

export function getNextTier(tier: DonorTier): DonorTier | null {
    return NEXT_TIER[tier];
}

// ─── Tier gating helpers ────────────────────────────────────────
// Central place to answer "is this option locked for this tier?"
// Future options just add to the free list; no changes at call sites.

export const FREE_MODES: readonly ThemeMode[] = ['light', 'dark', 'sepia'];
export const FREE_ACCENTS = ['default'] as const;

export function isModeLocked(mode: ThemeMode, tier: DonorTier): boolean {
    if (tier >= 1) return false;
    return !FREE_MODES.includes(mode);
}

export function isAccentLocked(accent: string, tier: DonorTier): boolean {
    if (tier >= 1) return false;
    return !(FREE_ACCENTS as readonly string[]).includes(accent);
}

/**
 * Returns the mode that should actually be applied to the DOM.
 * If the stored mode is locked for this tier, falls back to 'dark'
 * (safest — most users prefer dark over light when AMOLED is locked).
 */
export function resolveEffectiveMode(
    storedMode: ThemeMode,
    tier: DonorTier
): ThemeMode {
    return isModeLocked(storedMode, tier) ? 'dark' : storedMode;
}

/**
 * Returns the accent that should actually be applied to the DOM.
 * Locked accents fall back to 'default'.
 */
export function resolveEffectiveAccent(
    storedAccent: string,
    tier: DonorTier
): string {
    return isAccentLocked(storedAccent, tier) ? 'default' : storedAccent;
}
