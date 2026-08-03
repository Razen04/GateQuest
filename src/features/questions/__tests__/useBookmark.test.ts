// This file tests useBookmark hook

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useBookmark from '../hooks/useBookmark';
import { supabase } from '@/shared/utils/supabaseClient';

const mockRpc = <T>(data: T) => ({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
});

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        rpc: vi.fn(),
    },
}));

describe('useBookmark hook', () => {
    // Clear mocks before each test
    beforeEach(() => vi.clearAllMocks());

    // toggleBookmark feature
    describe('initial state', () => {
        it('should initialize with empty bookmarksMap and loading as false', () => {
            const { result } = renderHook(() => useBookmark());

            // Assert
            expect(result.current.loading).toBe(false);
            expect(result.current.bookmarksMap).toEqual({});
        });
    });

    describe('fetch bookmarks', () => {
        it('should populate bookmarksMap after fetching bookmarks', async () => {
            const sampleBookmarks = [
                {
                    question_id: 'q1',
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
                {
                    question_id: 'q2',
                    notes: null,
                    created_at: '2026-08-02T11:00:00Z',
                },
            ];

            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc.mockResolvedValueOnce(mockRpc(sampleBookmarks));

            const { result } = renderHook(() => useBookmark());

            // Act: Call fetchBookmark
            await act(async () => {
                await result.current.fetchBookmarks('dsa');
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('get_user_bookmarks', {
                p_subject_slug: 'dsa',
            });
            expect(result.current.bookmarksMap).toEqual({
                q1: {
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
                q2: {
                    notes: null,
                    created_at: '2026-08-02T11:00:00Z',
                },
            });
        });
    });

    describe('toggle bookmark', () => {
        it('adds a bookmark and refreshes bookmark state', async () => {
            const sampleBookmarks = [
                {
                    question_id: 'q1',
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
            ];
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc
                .mockResolvedValueOnce(mockRpc(true))
                .mockResolvedValueOnce(mockRpc(sampleBookmarks));

            const { result } = renderHook(() => useBookmark());

            let added;
            // Act
            await act(async () => {
                added = await result.current.toggleBookmark({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'note',
                });
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('toggle_question_bookmark', {
                p_question_id: 'q1',
                p_note: 'note',
            });

            expect(supabase.rpc).toHaveBeenCalledWith('get_user_bookmarks', {
                p_subject_slug: 'dsa',
            });

            expect(result.current.bookmarksMap).toEqual({
                q1: {
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
            });

            expect(added).toBe(true);
        });

        it('should depopulate bookmarksMap when deleting', async () => {
            const sampleBookmarks = [
                {
                    question_id: 'q2',
                    notes: null,
                    created_at: '2026-08-02T11:00:00Z',
                },
            ];

            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc
                .mockResolvedValueOnce(mockRpc(false))
                .mockResolvedValueOnce(mockRpc(sampleBookmarks));

            const { result } = renderHook(() => useBookmark());

            let added;
            // Act
            await act(async () => {
                added = await result.current.toggleBookmark({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                });
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('toggle_question_bookmark', {
                p_question_id: 'q1',
            });

            expect(supabase.rpc).toHaveBeenCalledWith('get_user_bookmarks', {
                p_subject_slug: 'dsa',
            });

            expect(result.current.bookmarksMap).toEqual({
                q2: {
                    notes: null,
                    created_at: '2026-08-02T11:00:00Z',
                },
            });

            expect(added).toBe(false);
        });

        it('should maintain the same state when there is any error', async () => {
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useBookmark());

            // Before it should be empty
            expect(result.current.bookmarksMap).toEqual({});

            await expect(
                result.current.toggleBookmark({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'note',
                }),
            ).rejects.toThrowError('Network error');

            // after failure the state should remain same
            expect(result.current.bookmarksMap).toEqual({});
            expect(result.current.loading).toBe(false);
        });

        it('should reject note longer than 100 characters before calling RPC', async () => {
            const mockedSupabase = vi.mocked(supabase);

            const { result } = renderHook(() => useBookmark());

            await expect(
                result.current.toggleBookmark({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'a'.repeat(101),
                }),
            ).rejects.toThrowError();

            expect(mockedSupabase.rpc).not.toHaveBeenCalled();
        });
    });

    describe('update bookmark note', () => {
        it('should update the bookmarksMap after updating note', async () => {
            const sampleBookmarks = [
                {
                    question_id: 'q1',
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
            ];

            const updatedSampleBookmarks = [
                {
                    question_id: 'q1',
                    notes: 'note',
                    created_at: '2026-08-02T10:00:00Z',
                },
            ];
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc
                .mockResolvedValueOnce(mockRpc(sampleBookmarks))
                .mockResolvedValueOnce(mockRpc(null))
                .mockResolvedValueOnce(mockRpc(updatedSampleBookmarks));

            const { result } = renderHook(() => useBookmark());

            await act(async () => {
                await result.current.fetchBookmarks('dsa');
            });

            // Before calling the updateBookmarkNote
            expect(result.current.bookmarksMap).toEqual({
                q1: {
                    notes: 'note 1',
                    created_at: '2026-08-02T10:00:00Z',
                },
            });

            // Act
            await act(async () => {
                await result.current.updateBookmarkNote({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'note',
                });
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('update_question_bookmark_note', {
                p_question_id: 'q1',
                p_note: 'note',
            });

            expect(supabase.rpc).toHaveBeenCalledWith('get_user_bookmarks', {
                p_subject_slug: 'dsa',
            });

            expect(result.current.bookmarksMap).toEqual({
                q1: {
                    notes: 'note',
                    created_at: '2026-08-02T10:00:00Z',
                },
            });
        });

        it('should maintain the same state when there is any error', async () => {
            const mockedSupabase = vi.mocked(supabase);

            mockedSupabase.rpc.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useBookmark());

            // Before it should be empty
            expect(result.current.bookmarksMap).toEqual({});

            await expect(
                result.current.updateBookmarkNote({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'note',
                }),
            ).rejects.toThrowError('Network error');

            expect(supabase.rpc).toHaveBeenCalledWith('update_question_bookmark_note', {
                p_question_id: 'q1',
                p_note: 'note',
            });

            // after failure the state should remain same
            expect(result.current.bookmarksMap).toEqual({});
            expect(result.current.loading).toBe(false);
        });

        it('should reject note longer than 100 characters before calling RPC', async () => {
            const mockedSupabase = vi.mocked(supabase);

            const { result } = renderHook(() => useBookmark());

            await expect(
                result.current.updateBookmarkNote({
                    questionId: 'q1',
                    subjectSlug: 'dsa',
                    note: 'a'.repeat(101),
                }),
            ).rejects.toThrowError();

            expect(mockedSupabase.rpc).not.toHaveBeenCalled();
        });
    });

    /* 
        it('deletes bookmark');
        it('updates the note in bookmark'); */
});
