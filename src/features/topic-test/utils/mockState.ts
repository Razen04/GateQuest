import type { DonorTier } from '@/shared/types/donor';
import type {
    MockServerEntry,
    MockState,
    ResolvedMock,
} from '@/shared/types/mock';

interface ResolveInput {
    server: MockServerEntry;
    userTier: DonorTier;
    isAuthenticated: boolean;
    now: number;
}

export function resolveMockState(input: ResolveInput): ResolvedMock {
    const { server, userTier, isAuthenticated, now } = input;

    const startsAt = new Date(server.starts_at).getTime();
    const durationSeconds = server.duration_seconds;
    const endsAt = new Date(server.ends_at).getTime();

    const questionCount = server.question_count;
    const totalMarks = server.total_marks;
    const attemptMinTier = server.attempt_min_tier;
    const postMinTier = server.post_min_tier;
    const isBeta = postMinTier === 0;

    const sessionId = server.session_id;
    const sessionStatus = server.session_status;
    const sessionScore = server.session_score;
    const activeTestId = server.active_test_id;
    const activeTestLabel = server.active_test_label;

    const secondsUntilStart =
        now < startsAt ? Math.floor((startsAt - now) / 1000) : null;

    const secondsUntilEnd =
        now < endsAt ? Math.floor((endsAt - now) / 1000) : null;

    const base = {
        mockId: server.mock_id,
        label: server.label,
        startsAt,
        endsAt,
        durationSeconds,
        questionCount,
        totalMarks,
        attemptMinTier,
        postMinTier,
        sessionId,
        sessionStatus,
        sessionScore,
        secondsUntilStart,
        secondsUntilEnd,
        isBeta,
        seriesNumber: server.series_number,
        blurb: server.blurb,
        announcement: server.announcement,
        activeTestId,
        activeTestLabel,
    };

    if (!isAuthenticated) {
        return {
            ...base,
            state: 'login_required',
            timeAllowedSeconds: null,
            canAttempt: false,
            canReAttempt: false,
            canSeeAnalysis: false,
        };
    }

    if (sessionId && sessionStatus) {
        if (sessionStatus !== 'completed') {
            return {
                ...base,
                state: 'resumable',
                timeAllowedSeconds: secondsUntilEnd,
                canAttempt: false,
                canReAttempt: false,
                canSeeAnalysis: false,
            };
        }

        const resultsReleased = now >= endsAt;

        if (!resultsReleased) {
            return {
                ...base,
                state: 'embargoed',
                timeAllowedSeconds: null,
                canAttempt: false,
                canReAttempt: false,
                canSeeAnalysis: false,
            };
        }

        const canSeeAnalysis = isBeta || userTier >= postMinTier;

        return {
            ...base,
            state: canSeeAnalysis ? 'attempted' : 'donor_locked',
            timeAllowedSeconds: null,
            canAttempt: false,
            canReAttempt: userTier >= 1,
            canSeeAnalysis,
        };
    }

    if (now < startsAt) {
        return {
            ...base,
            state: 'upcoming',
            timeAllowedSeconds: null,
            canAttempt: false,
            canReAttempt: false,
            canSeeAnalysis: false,
        };
    }

    if (now < endsAt) {
        return {
            ...base,
            state: 'live',
            timeAllowedSeconds: secondsUntilEnd,
            canAttempt: server.can_attempt,
            canReAttempt: false,
            canSeeAnalysis: false,
        };
    }

    return {
        ...base,
        state: 'open',
        timeAllowedSeconds: durationSeconds,
        canAttempt: server.can_attempt,
        canReAttempt: false,
        canSeeAnalysis: false,
    };
}

/**
 * True for an official mock attempt. Practice sessions derived from a
 * mock (`mock-*-practice-*`) are ordinary practice tests and do NOT
 * count: they are not part of the leaderboard and may be pruned.
 */
export function isOfficialMockPaper(paperId?: string | null): boolean {
    const id = paperId ?? '';
    return id.startsWith('mock-') && !id.includes('-practice-');
}

/**
 * True while a completed mock attempt is still under embargo — i.e. the
 * official window has not closed yet. Scores / ranks must not surface
 * anywhere, including generic test history.
 *
 * Practice attempts carry a `-practice-` suffix and are exempt: they are
 * not part of the live leaderboard.
 */
export function isMockSessionEmbargoed(
    session: {
        paper_id?: string | null;
        mock_ends_at?: string | null;
    },
    now: number = Date.now()
): boolean {
    if (!isOfficialMockPaper(session.paper_id) || !session.mock_ends_at)
        return false;

    const endsAt = new Date(session.mock_ends_at).getTime();
    if (Number.isNaN(endsAt)) return false;

    return now < endsAt;
}

/**
 * True when the user has a non-completed test in this branch that is NOT
 * this mock's own session — i.e. starting this mock would hit
 * `active_exists` server-side.
 */
export function isMockBlocked(m: ResolvedMock): boolean {
    if (m.activeTestId == null) return false;
    if (m.activeTestId === m.sessionId) return false;
    return m.state === 'live' || m.state === 'open';
}

export function isMockActionable(state: MockState): boolean {
    return state === 'live' || state === 'resumable' || state === 'open';
}

export function isMockCompleted(state: MockState): boolean {
    return (
        state === 'attempted' ||
        state === 'donor_locked' ||
        state === 'embargoed'
    );
}

/**
 * How far ahead the dashboard hero will pin to an upcoming mock.
 * Outside this window a future mock is still discoverable in the mock
 * picker, but it does not take over the greeting card — otherwise the
 * hero would be pinned permanently once mocks are recurring.
 */
export const MOCK_HERO_HORIZON_MS = 24 * 60 * 60 * 1000;

/**
 * Pick the mock the dashboard hero should "stay on".
 *
 * Priority:
 *   1. A resumable attempt — the user has unfinished business.
 *   2. A live mock — actionable right now.
 *   3. An upcoming mock starting within the horizon.
 *
 * Completed / embargoed / open-window mocks are never pinned.
 */
export function pickHeroMock(
    mocks: ResolvedMock[],
    now: number = Date.now(),
    horizonMs: number = MOCK_HERO_HORIZON_MS
): ResolvedMock | null {
    const byEndingSoonest = (a: ResolvedMock, b: ResolvedMock) =>
        a.endsAt - b.endsAt;

    const resumable = mocks
        .filter((m) => m.state === 'resumable')
        .sort(byEndingSoonest);
    if (resumable.length > 0) return resumable[0] ?? null;

    const live = mocks.filter((m) => m.state === 'live').sort(byEndingSoonest);
    if (live.length > 0) return live[0] ?? null;

    const upcoming = mocks
        .filter((m) => m.state === 'upcoming' && m.startsAt - now <= horizonMs)
        .sort((a, b) => a.startsAt - b.startsAt);

    return upcoming[0] ?? null;
}
