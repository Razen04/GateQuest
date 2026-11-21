import { describe, expect, it } from 'vitest';
import type { DonorTier } from '@/shared/types/donor';
import type { MockServerEntry } from '@/shared/types/mock';
import {
    isMockSessionEmbargoed,
    MOCK_HERO_HORIZON_MS,
    pickHeroMock,
    resolveMockState,
} from '../mockState';

const NOW = new Date('2026-12-07T10:00:00Z').getTime();

function makeServer(overrides: Partial<MockServerEntry> = {}): MockServerEntry {
    return {
        mock_id: 'mock-cs-01',
        label: 'Mock 1',
        starts_at: '2026-12-07T09:30:00Z',
        ends_at: '2026-12-07T12:30:00Z',
        duration_seconds: 10800,
        question_count: 65,
        total_marks: 100,
        attempt_min_tier: 0,
        post_min_tier: 1,
        series_number: 1,
        blurb: 'test',
        announcement: null,
        is_live: true,
        results_released: false,
        can_attempt: true,
        attempt_lock_reason: null,
        session_id: null,
        session_status: null,
        session_score: null,
        active_test_id: null,
        active_test_label: null,
        ...overrides,
    };
}

function resolve(opts: {
    server?: Partial<MockServerEntry>;
    tier?: DonorTier;
    isAuthenticated?: boolean;
    now?: number;
}) {
    return resolveMockState({
        server: makeServer(opts.server),
        userTier: opts.tier ?? 0,
        isAuthenticated: opts.isAuthenticated ?? true,
        now: opts.now ?? NOW,
    });
}

describe('resolveMockState', () => {
    it('returns login_required for unauthenticated users', () => {
        const result = resolve({ isAuthenticated: false });
        expect(result.state).toBe('login_required');
        expect(result.canAttempt).toBe(false);
    });

    it('returns upcoming before window', () => {
        const result = resolve({
            now: new Date('2026-12-07T09:00:00Z').getTime(),
        });
        expect(result.state).toBe('upcoming');
        expect(result.canAttempt).toBe(false);
        expect(result.secondsUntilStart).toBeGreaterThan(0);
    });

    it('returns live inside window with no session', () => {
        const result = resolve({ now: NOW });
        expect(result.state).toBe('live');
        expect(result.canAttempt).toBe(true);
        expect(result.timeAllowedSeconds).toBeGreaterThan(0);
    });

    it('returns resumable when session is ongoing', () => {
        const result = resolve({
            server: { session_id: 's1', session_status: 'ongoing' },
        });
        expect(result.state).toBe('resumable');
        expect(result.canAttempt).toBe(false);
    });

    it('returns embargoed when completed but window open', () => {
        const result = resolve({
            server: { session_id: 's1', session_status: 'completed' },
            now: NOW, // window still open
        });
        expect(result.state).toBe('embargoed');
        expect(result.canSeeAnalysis).toBe(false);
    });

    it('returns donor_locked when window closed, free tier, gated mock', () => {
        const result = resolve({
            server: { session_id: 's1', session_status: 'completed' },
            now: new Date('2026-12-07T13:00:00Z').getTime(), // past window
            tier: 0,
        });
        expect(result.state).toBe('donor_locked');
        expect(result.canSeeAnalysis).toBe(false);
        expect(result.canReAttempt).toBe(false);
    });

    it('returns attempted when window closed, donor tier', () => {
        const result = resolve({
            server: { session_id: 's1', session_status: 'completed' },
            now: new Date('2026-12-07T13:00:00Z').getTime(),
            tier: 1,
        });
        expect(result.state).toBe('attempted');
        expect(result.canSeeAnalysis).toBe(true);
        expect(result.canReAttempt).toBe(true);
    });

    it('returns attempted for beta mocks even at tier 0', () => {
        const result = resolve({
            server: {
                session_id: 's1',
                session_status: 'completed',
                post_min_tier: 0,
            },
            now: new Date('2026-12-07T13:00:00Z').getTime(),
            tier: 0,
        });
        expect(result.state).toBe('attempted');
        expect(result.canSeeAnalysis).toBe(true);
        expect(result.isBeta).toBe(true);
        expect(result.canReAttempt).toBe(false); // still tier-1+ for re-attempts
    });

    it('returns open after window with no session (practice mode)', () => {
        const result = resolve({
            now: new Date('2026-12-07T13:00:00Z').getTime(),
        });
        expect(result.state).toBe('open');
        expect(result.canAttempt).toBe(true);
    });

    it('does not grant re-attempt at tier 0 even for beta', () => {
        const result = resolve({
            server: {
                session_id: 's1',
                session_status: 'completed',
                post_min_tier: 0,
            },
            now: new Date('2026-12-07T13:00:00Z').getTime(),
            tier: 0,
        });
        expect(result.canReAttempt).toBe(false);
    });

    it('counts down secondsUntilEnd inside window', () => {
        const result = resolve({
            now: new Date('2026-12-07T11:30:00Z').getTime(),
        });
        expect(result.state).toBe('live');
        expect(result.secondsUntilEnd).toBe(3600); // 1 hour
    });

    it('passes through session_score after results release', () => {
        const result = resolve({
            server: {
                session_id: 's1',
                session_status: 'completed',
                session_score: 42,
            },
            now: new Date('2026-12-07T13:00:00Z').getTime(),
            tier: 1,
        });
        expect(result.sessionScore).toBe(42);
    });
});

describe('isMockSessionEmbargoed', () => {
    const WINDOW_END = '2026-12-07T12:30:00Z';

    it('flags a mock attempt while the window is still open', () => {
        expect(
            isMockSessionEmbargoed(
                { paper_id: 'mock-cs-01', mock_ends_at: WINDOW_END },
                NOW
            )
        ).toBe(true);
    });

    it('releases a mock attempt after the window closes', () => {
        expect(
            isMockSessionEmbargoed(
                { paper_id: 'mock-cs-01', mock_ends_at: WINDOW_END },
                new Date('2026-12-07T12:30:00Z').getTime()
            )
        ).toBe(false);
    });

    it('never hides practice attempts', () => {
        expect(
            isMockSessionEmbargoed(
                {
                    paper_id: 'mock-cs-01-practice-1',
                    mock_ends_at: WINDOW_END,
                },
                NOW
            )
        ).toBe(false);
    });

    it('ignores topic tests', () => {
        expect(
            isMockSessionEmbargoed(
                { paper_id: 'pyq-cs-2024', mock_ends_at: WINDOW_END },
                NOW
            )
        ).toBe(false);
    });

    it('keeps legacy mock rows without a window end visible', () => {
        expect(isMockSessionEmbargoed({ paper_id: 'mock-cs-01' }, NOW)).toBe(
            false
        );
    });
});

describe('pickHeroMock', () => {
    const live = (id: string, endsAt: string) =>
        resolve({
            server: {
                mock_id: id,
                starts_at: '2026-12-07T09:30:00Z',
                ends_at: endsAt,
            },
        });

    const upcoming = (id: string, startsAt: string, endsAt: string) =>
        resolve({
            server: { mock_id: id, starts_at: startsAt, ends_at: endsAt },
        });

    it('returns null when there are no mocks', () => {
        expect(pickHeroMock([], NOW)).toBeNull();
    });

    it('prefers a resumable attempt over a live mock', () => {
        const resumable = resolve({
            server: {
                mock_id: 'resumable',
                starts_at: '2026-12-07T09:30:00Z',
                ends_at: '2026-12-07T12:30:00Z',
                session_id: 's1',
                session_status: 'ongoing',
            },
        });
        const liveMock = live('live', '2026-12-07T12:30:00Z');

        expect(pickHeroMock([liveMock, resumable], NOW)?.mockId).toBe(
            'resumable'
        );
    });

    it('prefers a live mock over an upcoming one', () => {
        const liveMock = live('live', '2026-12-07T12:30:00Z');
        const upcomingMock = upcoming(
            'upcoming',
            '2026-12-07T11:00:00Z',
            '2026-12-07T14:00:00Z'
        );

        expect(pickHeroMock([upcomingMock, liveMock], NOW)?.mockId).toBe(
            'live'
        );
    });

    it('picks the live mock that ends soonest', () => {
        const later = live('later', '2026-12-07T13:30:00Z');
        const sooner = live('sooner', '2026-12-07T11:30:00Z');

        expect(pickHeroMock([later, sooner], NOW)?.mockId).toBe('sooner');
    });

    it('pins an upcoming mock inside the 24h horizon', () => {
        const soon = upcoming(
            'soon',
            '2026-12-07T20:00:00Z',
            '2026-12-07T23:00:00Z'
        );

        expect(MOCK_HERO_HORIZON_MS).toBe(24 * 60 * 60 * 1000);
        expect(pickHeroMock([soon], NOW)?.mockId).toBe('soon');
    });

    it('ignores an upcoming mock beyond the horizon', () => {
        const far = upcoming(
            'far',
            '2026-12-09T10:00:00Z',
            '2026-12-09T13:00:00Z'
        );

        expect(pickHeroMock([far], NOW)).toBeNull();
    });

    it('ignores completed and closed-window mocks', () => {
        const completed = resolve({
            server: {
                mock_id: 'completed',
                starts_at: '2026-12-07T06:00:00Z',
                ends_at: '2026-12-07T09:00:00Z',
                session_id: 's1',
                session_status: 'completed',
                post_min_tier: 0,
            },
        });
        const closed = resolve({
            server: {
                mock_id: 'closed',
                starts_at: '2026-12-07T06:00:00Z',
                ends_at: '2026-12-07T09:00:00Z',
            },
        });

        expect(completed.state).toBe('attempted');
        expect(closed.state).toBe('open');
        expect(pickHeroMock([completed, closed], NOW)).toBeNull();
    });
});
