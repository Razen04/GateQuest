import { describe, expect, it } from 'vitest';
import { hasEnoughPeerData, MIN_PEER_ATTEMPTS } from '../peerStats';

describe('hasEnoughPeerData', () => {
    it('withholds stats below the minimum sample', () => {
        expect(MIN_PEER_ATTEMPTS).toBe(10);
        expect(hasEnoughPeerData(0)).toBe(false);
        expect(hasEnoughPeerData(9)).toBe(false);
        expect(hasEnoughPeerData(null)).toBe(false);
        expect(hasEnoughPeerData(undefined)).toBe(false);
    });

    it('shows stats once the minimum is reached', () => {
        expect(hasEnoughPeerData(10)).toBe(true);
        expect(hasEnoughPeerData(25)).toBe(true);
    });
});
