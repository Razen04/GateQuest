import type { DonorTier } from '@/shared/types/donor';

/**
 * Material palette — matches the tier rings but tuned for text.
 * Light values are darkened for contrast on white backgrounds;
 * dark values are brightened for contrast on near-black.
 *
 * Deliberately uses literal oklch (not theme tokens) — the color
 * represents tier materiality, not the user's accent choice.
 */
const TIER_NAME_CLASS: Record<DonorTier, string> = {
    0: 'text-foreground',
    1: 'text-[oklch(0.45_0.13_45)] dark:text-[oklch(0.72_0.14_55)]',
    2: 'text-[oklch(0.52_0.14_75)] dark:text-[oklch(0.85_0.14_90)]',
    3: [
        'bg-clip-text text-transparent',
        'bg-gradient-to-r',
        'from-[oklch(0.48_0.18_300)]',
        'to-[oklch(0.48_0.16_340)]',
        'dark:from-[oklch(0.82_0.14_300)]',
        'dark:to-[oklch(0.82_0.14_340)]',
    ].join(' '),
};

interface TieredNameProps {
    name: string;
    tier: DonorTier;
    /** Optional className for the wrapper — e.g. to preserve truncate */
    className?: string;
}

/**
 * Renders a display name with tier materiality:
 *   Tier 0 → neutral (inherits text color)
 *   Tier 1 → copper/bronze
 *   Tier 2 → gold
 *   Tier 3 → iridescent violet/cyan/rose gradient
 *
 * Text selection works normally. Screen readers read the actual
 * string (it's real text; only the paint is clipped).
 */
export function TieredName({ name, tier, className = '' }: TieredNameProps) {
    return (
        <span
            className={`inline-block ${TIER_NAME_CLASS[tier]} ${className}`.trim()}
        >
            {name}
        </span>
    );
}
