import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchTopicCounts, mockGetPracticeSubjects } = vi.hoisted(() => ({
    mockFetchTopicCounts: vi.fn(),
    mockGetPracticeSubjects: vi.fn(),
}));

vi.mock('@/features/topic-test/api/topicTest', () => ({
    fetchTopicCounts: mockFetchTopicCounts,
}));

vi.mock('@/shared/hooks/useGoal', () => ({
    default: () => ({ getPracticeSubjects: mockGetPracticeSubjects }),
}));

import { useTopicTestGenerator } from '@/features/topic-test/hooks/useTopicTestGenerator';

const CACHE_TTL = 1000 * 60 * 5;

const csSubject = { id: 'cs', name: 'Computer Science' };
const ecSubject = { id: 'ec', name: 'Electronics' };

const apiRow = {
    topic: 'Arrays',
    question_count: 10,
    unattempted_count: 5,
};

const cacheEntry = (overrides: Partial<{ timestamp: number }> = {}) => ({
    timestamp: Date.now(),
    data: [
        {
            name: 'Cached',
            subjectName: 'Computer Science',
            subjectId: 'cs',
            questionCount: 20,
            unattemptedCount: 15,
        },
    ],
    ...overrides,
});

describe('useTopicTestGenerator', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.resetAllMocks();
        mockGetPracticeSubjects.mockReturnValue([csSubject, ecSubject]);
    });

    describe('cache lifecycle', () => {
        it('uses a fresh cache without calling the API', async () => {
            localStorage.setItem(
                'topic_counts:cs',
                JSON.stringify(cacheEntry())
            );

            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );

            await waitFor(() =>
                expect(result.current.availableTopics).toHaveLength(1)
            );
            expect(result.current.availableTopics[0]?.name).toBe('Cached');
            expect(mockFetchTopicCounts).not.toHaveBeenCalled();
        });

        it('fetches on cache miss and writes cache', async () => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [apiRow],
                error: null,
            });

            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );

            await waitFor(() =>
                expect(result.current.availableTopics).toHaveLength(1)
            );
            expect(mockFetchTopicCounts).toHaveBeenCalledWith('cs');

            const raw = localStorage.getItem('topic_counts:cs');
            expect(raw).not.toBeNull();
            const parsed = JSON.parse(raw!);
            expect(parsed.data[0]).toMatchObject({
                name: 'Arrays',
                subjectId: 'cs',
                subjectName: 'Computer Science',
                questionCount: 10,
                unattemptedCount: 5,
            });
        });

        it('refetches when the cache is older than TTL', async () => {
            localStorage.setItem(
                'topic_counts:cs',
                JSON.stringify(
                    cacheEntry({ timestamp: Date.now() - CACHE_TTL - 1000 })
                )
            );
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [apiRow],
                error: null,
            });

            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );

            await waitFor(() =>
                expect(result.current.availableTopics).toHaveLength(1)
            );
            expect(mockFetchTopicCounts).toHaveBeenCalledWith('cs');
            expect(result.current.availableTopics[0]?.name).toBe('Arrays');
        });

        it('sets empty topics and settles loading on API error object', async () => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: null,
                error: 'boom',
            });

            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.availableTopics).toEqual([]);
        });

        it('settles loading even if the API rejects', async () => {
            mockFetchTopicCounts.mockRejectedValueOnce(new Error('network'));

            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
        });
    });

    describe('selection', () => {
        const hydrateAndSelect = async () => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [
                    apiRow,
                    { topic: 'Trees', question_count: 8, unattempted_count: 3 },
                ],
                error: null,
            });
            const rendered = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 5,
                    includeAttempted: false,
                })
            );
            await waitFor(() =>
                expect(rendered.result.current.availableTopics).toHaveLength(2)
            );
            return rendered;
        };
        it('toggleTopic adds and removes by name+subjectName', async () => {
            const { result } = await hydrateAndSelect();

            const arrays = result.current.availableTopics.find(
                (topic) => topic.name === 'Arrays'
            );

            if (!arrays) {
                throw new Error('Expected Arrays topic to be available');
            }

            act(() => result.current.toggleTopic(arrays));
            expect(result.current.selectedTopics).toHaveLength(1);

            act(() => result.current.toggleTopic(arrays));
            expect(result.current.selectedTopics).toHaveLength(0);
        });

        it('removeTopic drops by name', async () => {
            const { result } = await hydrateAndSelect();
            const arrays = result.current.availableTopics.find(
                (topic) => topic.name === 'Arrays'
            );

            if (!arrays) {
                throw new Error('Expected Arrays topic to be available');
            }

            act(() => result.current.toggleTopic(arrays));
            act(() => result.current.removeTopic('Arrays'));

            expect(result.current.selectedTopics).toHaveLength(0);
        });

        it('clearSelection empties the list', async () => {
            const { result } = await hydrateAndSelect();
            result.current.availableTopics.forEach((t) =>
                act(() => result.current.toggleTopic(t))
            );
            expect(result.current.selectedTopics).toHaveLength(2);

            act(() => result.current.clearSelection());
            expect(result.current.selectedTopics).toHaveLength(0);
        });
    });

    describe('poolSize / canGenerate / warnings', () => {
        const hydrateWithCounts = async (includeAttempted: boolean) => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [
                    { topic: 'A', question_count: 10, unattempted_count: 4 },
                    { topic: 'B', question_count: 6, unattempted_count: 2 },
                ],
                error: null,
            });
            const rendered = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 8,
                    includeAttempted,
                })
            );
            await waitFor(() =>
                expect(rendered.result.current.availableTopics).toHaveLength(2)
            );
            return rendered;
        };

        it('uses questionCount when includeAttempted is true', async () => {
            const { result } = await hydrateWithCounts(true);
            result.current.availableTopics.forEach((t) =>
                act(() => result.current.toggleTopic(t))
            );
            expect(result.current.poolSize).toBe(16);
        });

        it('uses unattemptedCount when includeAttempted is false', async () => {
            const { result } = await hydrateWithCounts(false);
            result.current.availableTopics.forEach((t) =>
                act(() => result.current.toggleTopic(t))
            );
            expect(result.current.poolSize).toBe(6);
        });

        it('canGenerate is true exactly at the boundary', async () => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [{ topic: 'A', question_count: 8, unattempted_count: 8 }],
                error: null,
            });
            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 8,
                    includeAttempted: false,
                })
            );
            await waitFor(() =>
                expect(result.current.availableTopics).toHaveLength(1)
            );

            const topic = result.current.availableTopics[0];

            if (!topic) {
                throw new Error('Expected at least one available topic');
            }

            act(() => {
                result.current.toggleTopic(topic);
            });

            expect(result.current.poolSize).toBe(8);
            expect(result.current.canGenerate).toBe(true);
        });

        it('emits a warning when the pool is too small and clears when sufficient', async () => {
            mockFetchTopicCounts.mockResolvedValueOnce({
                data: [
                    { topic: 'A', question_count: 10, unattempted_count: 4 },
                    { topic: 'B', question_count: 6, unattempted_count: 4 },
                ],
                error: null,
            });
            const { result } = renderHook(() =>
                useTopicTestGenerator({
                    subjectId: 'cs',
                    requestedQuestionCount: 6,
                    includeAttempted: false,
                })
            );
            await waitFor(() =>
                expect(result.current.availableTopics).toHaveLength(2)
            );
            const topic = result.current.availableTopics[0];

            if (!topic) {
                throw new Error('Expected at least one available topic');
            }

            const [topicA, topicB] = result.current.availableTopics;

            if (!topicA || !topicB) {
                throw new Error('Expected two available topics');
            }

            act(() => {
                result.current.toggleTopic(topicA);
            });

            await waitFor(() => {
                expect(result.current.warnings).toHaveLength(1);
            });

            expect(result.current.warnings[0]).toMatch(/4\/6/);

            act(() => {
                result.current.toggleTopic(topicB);
            });

            await waitFor(() => {
                expect(result.current.warnings).toEqual([]);
            });

            expect(result.current.poolSize).toBe(8);
        });
    });

    describe('subject change', () => {
        it('does not let a slow first response overwrite fresh data', async () => {
            let resolveCs: (v: any) => void = () => {};
            let resolveEc: (v: any) => void = () => {};
            mockFetchTopicCounts
                .mockReturnValueOnce(new Promise((r) => (resolveCs = r)))
                .mockReturnValueOnce(new Promise((r) => (resolveEc = r)));

            const { result, rerender } = renderHook(
                ({ subjectId }) =>
                    useTopicTestGenerator({
                        subjectId,
                        requestedQuestionCount: 1,
                        includeAttempted: false,
                    }),
                { initialProps: { subjectId: 'cs' as string | null } }
            );

            rerender({ subjectId: 'ec' });

            await act(async () => {
                resolveEc({
                    data: [
                        {
                            topic: 'Fresh',
                            question_count: 5,
                            unattempted_count: 5,
                        },
                    ],
                    error: null,
                });
                await Promise.resolve();
            });
            await act(async () => {
                resolveCs({
                    data: [
                        {
                            topic: 'Stale',
                            question_count: 5,
                            unattempted_count: 5,
                        },
                    ],
                    error: null,
                });
                await Promise.resolve();
            });

            expect(result.current.availableTopics[0]?.name).toBe('Fresh');
        });
    });
});
