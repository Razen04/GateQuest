import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MockLeaderboardEntry } from '@/shared/types/mock';
import { LeaderboardAvatar } from '../LeaderboardAvatar';

const entryFor = (tier: 0 | 1 | 2 | 3): MockLeaderboardEntry => ({
    rank: 1,
    user_id: 'user-1',
    username: 'tester',
    name: 'Tester',
    avatar: null,
    tier,
    score: 10,
    time_seconds: 60,
});

describe('LeaderboardAvatar', () => {
    it.each([1, 2, 3] as const)(
        'renders the animated donor frame for tier %i',
        (tier) => {
            const { container } = render(
                <LeaderboardAvatar entry={entryFor(tier)} />
            );
            const ring = container.querySelector('svg[aria-hidden="true"]');
            expect(ring).not.toBeNull();
            expect(ring?.classList.contains('tier-paused')).toBe(false);
        }
    );

    it('renders no frame for a non-donor', () => {
        const { container } = render(<LeaderboardAvatar entry={entryFor(0)} />);
        expect(container.querySelector('svg[aria-hidden="true"]')).toBeNull();
    });

    it('keeps the initial fallback when there is no avatar', () => {
        const { getByRole } = render(<LeaderboardAvatar entry={entryFor(2)} />);
        expect(getByRole('img').getAttribute('aria-label')).toContain(
            'Gold Patron'
        );
    });
});
