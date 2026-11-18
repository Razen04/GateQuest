import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockChain, mockFrom } = vi.hoisted(() => {
    const mockChain = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
    };
    mockChain.select.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);
    return { mockChain, mockFrom: vi.fn(() => mockChain) };
});

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: { from: mockFrom },
}));

import {
    fetchTestHistory,
    TEST_HISTORY_PAGE_SIZE,
} from '@/features/topic-test/api/topicTest';

describe('fetchTestHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChain.range.mockResolvedValue({ data: [], error: null });
    });

    it('defaults to the first page of 10', async () => {
        await fetchTestHistory('user-1', 'branch-A');

        expect(TEST_HISTORY_PAGE_SIZE).toBe(10);
        expect(mockFrom).toHaveBeenCalledWith('topic_tests');
        expect(mockChain.range).toHaveBeenCalledWith(0, 9);
    });

    it('maps limit and offset onto an inclusive range', async () => {
        await fetchTestHistory('user-1', 'branch-A', {
            limit: 11,
            offset: 10,
        });

        expect(mockChain.range).toHaveBeenCalledWith(10, 20);
    });
});
