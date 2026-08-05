import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import DonorList from '@/features/donations/components/DonorList.js';
import type { DonationData } from '@/shared//types/Donation.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_NOW = new Date('2026-01-01T10:00:00.000Z');

function makeDonation(overrides: Partial<DonationData> = {}): DonationData {
    return {
        donation_id: 'test-1',
        user_id: 'user-1',
        anonymous: false,
        message: null,
        actual_amount: 100,
        verified: true,
        created_at: '2026-01-01T09:55:00.000Z',
        user_name: 'Test User',
        user_avatar: '',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// 1. UTC normalisation logic
// ---------------------------------------------------------------------------
describe('UTC timestamp normalisation (the DonorList fix)', () => {
    it('appends Z to a bare timestamp so it is always parsed as UTC', () => {
        const ts = '2026-01-01T10:00:00.000';
        const result = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
        expect(result.toISOString()).toBe('2026-01-01T10:00:00.000Z');
    });

    it('does not double-append Z to a timestamp that already has it', () => {
        const ts = '2026-01-01T10:00:00.000Z';
        const result = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
        expect(result.toISOString()).toBe('2026-01-01T10:00:00.000Z');
    });

    it('produces the same epoch for the same moment with or without Z', () => {
        const withZ = '2026-01-01T10:00:00.000Z';
        const withoutZ = '2026-01-01T10:00:00.000';
        const dateA = new Date(withZ.endsWith('Z') ? withZ : withZ + 'Z');
        const dateB = new Date(withoutZ.endsWith('Z') ? withoutZ : withoutZ + 'Z');
        expect(dateA.getTime()).toBe(dateB.getTime());
    });
});

// ---------------------------------------------------------------------------
// 2. DonorList component — rendering tests
// ---------------------------------------------------------------------------
describe('DonorList component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(FAKE_NOW);
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('shows correct relative time for a timestamp WITHOUT a trailing Z', () => {
        const donation = makeDonation({ created_at: '2026-01-01T09:55:00.000' });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
        expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it('shows the same relative time whether Z is present or missing', () => {
        const withoutZ = makeDonation({
            donation_id: 'a',
            created_at: '2026-01-01T09:55:00.000',
        });
        const withZ = makeDonation({
            donation_id: 'b',
            created_at: '2026-01-01T09:55:00.000Z',
        });

        const { container: containerA } = render(
            React.createElement(DonorList, { donations: [withoutZ] }),
        );
        const { container: containerB } = render(
            React.createElement(DonorList, { donations: [withZ] }),
        );

        const timeA = containerA.querySelector('.text-gray-500')?.textContent?.trim();
        const timeB = containerB.querySelector('.text-gray-500')?.textContent?.trim();

        expect(timeA).toBe(timeB);
    });

    it('shows "Anonymous" when donation.anonymous is true', () => {
        const donation = makeDonation({ anonymous: true, user_name: 'Real Name' });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText(/anonymous/i)).toBeInTheDocument();
        expect(screen.queryByText('Real Name')).not.toBeInTheDocument();
    });

    it('shows "Anonymous" when user_name is an empty string', () => {
        const donation = makeDonation({ anonymous: false, user_name: '' });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText(/anonymous/i)).toBeInTheDocument();
    });

    it('shows the actual donor name when not anonymous', () => {
        const donation = makeDonation({ anonymous: false, user_name: 'Razen' });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText(/Razen/i)).toBeInTheDocument();
    });

    it('renders the donation amount', () => {
        const donation = makeDonation({ actual_amount: 169 });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText(/169/)).toBeInTheDocument();
    });

    it('shows the message when one is present', () => {
        const donation = makeDonation({ message: 'Keep up the great work!' });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.getByText('Keep up the great work!')).toBeInTheDocument();
    });

    it('does not render a message paragraph when message is null', () => {
        const donation = makeDonation({ message: null });
        render(React.createElement(DonorList, { donations: [donation] }));

        expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });

    it('renders an empty list when donations array is empty', () => {
        const { container } = render(React.createElement(DonorList, { donations: [] }));
        expect(container.querySelectorAll('li')).toHaveLength(0);
    });

    it('renders one card per donation', () => {
        const donations = [
            makeDonation({ donation_id: '1', user_name: 'Alice' }),
            makeDonation({ donation_id: '2', user_name: 'Bob' }),
            makeDonation({ donation_id: '3', user_name: 'Charlie' }),
        ];
        const { container } = render(React.createElement(DonorList, { donations }));
        expect(container.querySelectorAll('li')).toHaveLength(3);
    });
});
