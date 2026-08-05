import { supabase } from '@/shared/utils/supabaseClient';
import { useCallback, useState } from 'react';

type Bookmarks = {
    notes: string | null;
    created_at: string;
};

type BookmarksMap = Record<string, Bookmarks>;

interface BookmarkPropTypes {
    subjectSlug: string;
    questionId: string;
    note?: string;
}

const validateNote = (note?: string) => {
    if (note && note.length > 100) {
        throw new Error('Note cannot exceed 100 characters');
    }
};

export default function useBookmark() {
    const [loading, setLoading] = useState(false);
    const [bookmarksMap, setBookmarksMap] = useState<BookmarksMap>({});

    const fetchBookmarks = useCallback(async (subjectSlug: string) => {
        try {
            setLoading(true);
            const { data: bookmarks, error } = await supabase.rpc('get_user_bookmarks', {
                p_subject_slug: subjectSlug,
            });

            if (error) throw error;

            const bookmarksData =
                bookmarks?.reduce<BookmarksMap>((map, bookmark) => {
                    map[bookmark.question_id] = {
                        notes: bookmark.notes,
                        created_at: bookmark.created_at,
                    };

                    return map;
                }, {}) ?? {};

            setBookmarksMap(bookmarksData);
        } catch (err) {
            console.error('Unable to fetch bookmarks: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleBookmark = async ({
        subjectSlug,
        questionId,
        note,
    }: BookmarkPropTypes): Promise<boolean> => {
        validateNote(note);

        try {
            setLoading(true);

            const { data: added, error } = await supabase.rpc('toggle_question_bookmark', {
                p_question_id: questionId,
                ...(note ? { p_note: note } : {}),
            });

            if (error) throw error;

            await fetchBookmarks(subjectSlug);

            return added;
        } catch (err) {
            console.error('Unable to add/delete bookmark: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateBookmarkNote = async ({ subjectSlug, questionId, note }: BookmarkPropTypes) => {
        validateNote(note);

        try {
            setLoading(true);

            const { error } = await supabase.rpc('update_question_bookmark_note', {
                p_question_id: questionId,
                p_note: note,
            });

            if (error) throw error;

            await fetchBookmarks(subjectSlug);
        } catch (err) {
            console.error('Unable to add/delete bookmark: ', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        bookmarksMap,
        fetchBookmarks,
        toggleBookmark,
        updateBookmarkNote,
    };
}
