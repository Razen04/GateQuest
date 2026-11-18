/**
 * Deterministic traffic staggering for mock exams.
 *
 * A 500-user mock produces ~32,500 attempt rows on start and another
 * ~32,500 updates on submit. When everyone clicks at the same second
 * that becomes a connection/CPU spike on the shared Free-plan compute.
 * We spread both edges over a short per-user window instead.
 *
 * The delay is derived from a stable hash of the user and the mock /
 * session id. Retries and resumes always land in the same slot, so a
 * user never gets a different delay on the second attempt.
 */

/** Max spread applied before a mock session is created. */
export const MOCK_START_STAGGER_MS = 30_000;

/** Max spread applied before an automatic (timer/window) submit. */
export const MOCK_SUBMIT_STAGGER_MS = 10_000;

/**
 * Never consume the last 90 seconds of the mock window with a queue
 * delay — a user who joins right before the window closes must still
 * get a usable attempt.
 */
export const MOCK_START_MIN_WINDOW_SECONDS = 90;

/** FNV-1a 32-bit. Stable, tiny, and good enough for slotting. */
const hash32 = (input: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
};

/**
 * Stable delay in `[0, windowMs)` for a user + key pair. Returns 0
 * when there is no user (logged out / tests), so callers can use it
 * unconditionally.
 */
export function staggerDelayMs(
    userId: string | null | undefined,
    key: string,
    windowMs: number
): number {
    if (!userId || !Number.isFinite(windowMs) || windowMs <= 0) return 0;
    return hash32(`${userId}:${key}`) % Math.floor(windowMs);
}

/**
 * Start delay for a mock, clamped so the delay never eats into the
 * final 90 seconds of the live window.
 *
 * `secondsUntilEnd` is the window remaining at the moment Start was
 * pressed (null when the window has already closed and the attempt is
 * a practice run — those are not time-boxed and can use the full
 * spread).
 */
export function mockStartDelayMs(
    userId: string | null | undefined,
    mockId: string,
    secondsUntilEnd: number | null
): number {
    const base = staggerDelayMs(
        userId,
        `mock-start:${mockId}`,
        MOCK_START_STAGGER_MS
    );
    if (secondsUntilEnd == null) return base;

    const safeMs = Math.max(
        0,
        (secondsUntilEnd - MOCK_START_MIN_WINDOW_SECONDS) * 1000
    );
    return Math.min(base, safeMs);
}

/**
 * Delay applied before an automatic mock submit. Manual submits are
 * never delayed: the user pressed the button and expects a response.
 * `secondsUntilEnd`-style window checks are unnecessary here because
 * the server already caps the session and `expire_mock_sessions` is
 * the backstop.
 */
export function mockSubmitDelayMs(
    userId: string | null | undefined,
    sessionId: string
): number {
    return staggerDelayMs(
        userId,
        `mock-submit:${sessionId}`,
        MOCK_SUBMIT_STAGGER_MS
    );
}
