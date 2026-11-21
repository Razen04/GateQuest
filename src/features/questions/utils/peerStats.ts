/**
 * Peer statistics are withheld until there is a usable sample. With one
 * or two attempts a percentage reads as fact ("100% correct") when it is
 * just noise. Mirrors the >10 gate used by `dynamic_difficulty_stats`.
 */
export const MIN_PEER_ATTEMPTS = 10;

export const hasEnoughPeerData = (
    totalAttempts: number | null | undefined
): boolean => (totalAttempts ?? 0) >= MIN_PEER_ATTEMPTS;
