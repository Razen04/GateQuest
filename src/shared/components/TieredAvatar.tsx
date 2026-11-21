import type { ReactNode } from 'react';
import type { DonorTier } from '@/shared/types/donor';
import { DONOR_TIER_LABELS } from '@/shared/types/donor';
import { Avatar } from './Avatar';
import { TIER_RINGS } from './tier-rings';

interface TieredAvatarProps {
    src: string | null | undefined;
    alt: string;
    tier: DonorTier;
    /** Disable rotation/animation for compact lists. Colors stay. */
    animated?: boolean;
    priority?: boolean;
    /** Sizes the AVATAR. Ring extends beyond this automatically. */
    className?: string;
    fallback?: ReactNode;
}

export function TieredAvatar({
    src,
    alt,
    tier,
    animated = true,
    priority = false,
    className = 'h-20 w-20',
    fallback,
}: TieredAvatarProps) {
    const ariaLabel = tier > 0 ? `${alt} (${DONOR_TIER_LABELS[tier]})` : alt;

    const Ring = tier > 0 ? TIER_RINGS[tier] : null;

    return (
        <div className={`relative ${className}`}>
            {Ring && (
                <Ring
                    className={`pointer-events-none absolute inset-[-42.35%] ${
                        !animated ? 'tier-paused' : ''
                    }`}
                />
            )}

            <div className="relative h-full w-full overflow-hidden rounded-full border border-border ring-2 ring-card">
                {src ? (
                    <Avatar
                        src={src}
                        alt={ariaLabel}
                        priority={priority}
                        className="h-full w-full object-cover"
                    />
                ) : fallback ? (
                    <div
                        className="flex h-full w-full items-center justify-center"
                        role="img"
                        aria-label={ariaLabel}
                    >
                        {fallback}
                    </div>
                ) : (
                    <Avatar
                        src={null}
                        alt={ariaLabel}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>
        </div>
    );
}
