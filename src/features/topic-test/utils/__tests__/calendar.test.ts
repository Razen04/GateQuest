import { describe, expect, it, vi } from 'vitest';
import type { ResolvedMock } from '@/shared/types/mock';
import { buildIcs, googleCalendarUrl } from '../calendar';

const makeMock = (overrides: Partial<ResolvedMock> = {}): ResolvedMock => ({
    state: 'upcoming',
    mockId: 'mock-cs-2026-01',
    label: 'GATE CS Mock, 01',
    startsAt: Date.parse('2026-11-25T03:30:00Z'),
    endsAt: Date.parse('2026-11-25T06:30:00Z'),
    durationSeconds: 10800,
    questionCount: 65,
    totalMarks: 100,
    attemptMinTier: 0,
    postMinTier: 1,
    sessionId: null,
    sessionStatus: null,
    sessionScore: null,
    secondsUntilStart: 3600,
    secondsUntilEnd: null,
    timeAllowedSeconds: null,
    canAttempt: true,
    canReAttempt: false,
    canSeeAnalysis: false,
    isBeta: false,
    seriesNumber: null,
    blurb: 'Full-length mock',
    announcement: null,
    activeTestId: null,
    activeTestLabel: null,
    ...overrides,
});

describe('calendar utilities', () => {
    it('builds a Google Calendar URL with UTC timestamps and encoded text', () => {
        vi.stubGlobal('window', { location: { origin: 'https://gate.test' } });
        const url = new URL(googleCalendarUrl(makeMock()));

        expect(url.origin + url.pathname).toBe(
            'https://calendar.google.com/calendar/render'
        );
        expect(url.searchParams.get('action')).toBe('TEMPLATE');
        expect(url.searchParams.get('text')).toBe('GATE CS Mock, 01');
        expect(url.searchParams.get('dates')).toBe(
            '20261125T033000Z/20261125T063000Z'
        );
        expect(url.searchParams.get('location')).toContain(
            '/mock-tests/mock-cs-2026-01'
        );
        vi.unstubAllGlobals();
    });

    it('builds an .ics payload with the label as title and escaped text', () => {
        vi.stubGlobal('window', { location: { origin: 'https://gate.test' } });
        const ics = buildIcs(makeMock());

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('SUMMARY:GATE CS Mock\\, 01');
        expect(ics).toContain('DTSTART:20261125T033000Z');
        expect(ics).toContain('DTEND:20261125T063000Z');
        expect(ics).toContain('UID:mock-cs-2026-01@gatequest');
        expect(ics).toContain('DESCRIPTION:Full-length mock');
        expect(ics.endsWith('\r\n')).toBe(true);
        vi.unstubAllGlobals();
    });
});
