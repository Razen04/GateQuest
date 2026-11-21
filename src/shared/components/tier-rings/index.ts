// src/shared/components/tier-rings/index.ts
import type { DonorTier } from '@/shared/types/donor';
import { BronzeRing } from './BronzeRing';
import { GoldRing } from './GoldRing';
import { PlatinumRing } from './PlatinumRing';

export const TIER_RINGS = {
    1: BronzeRing,
    2: GoldRing,
    3: PlatinumRing,
} as const satisfies Record<Exclude<DonorTier, 0>, unknown>;

export { BronzeRing, GoldRing, PlatinumRing };
