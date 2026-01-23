// This custom hook is responsible for fetching questions for a given subject.
// It handles loading and error states, and implements a caching strategy using localStorage to reduce network requests.
// It also compresses data to save space in localStorage and handles migration for existing uncompressed data.

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserProfile, sortQuestionsByYear } from '../helper.ts';
import type { Question } from '../types/question.ts';
import { supabase } from '../utils/supabaseClient.ts';
import {
    bulkUpsertQuestions,
    getQuestionByIds,
    getQuestionsBySubject,
    getSubjectSyncMetadata,
    updateSubjectSyncMetadata,
} from '@/storage/questionRepository.ts';

const getLatestTimestamp = (questions: Question[], currentMax: string | undefined) => {
    if (!questions.length) return currentMax;

    let max = currentMax || '';
    questions.forEach((q) => {
        if (q.updated_at && q.updated_at > max) {
            max = q.updated_at;
        }
    });
    return max;
};

// Questions fetch using supabase
const fetchQuestionsBySubject = async (
    subject: string | undefined,
    last_fetched_at: string | undefined,
) => {
    console.log('Fetching');

    let query = supabase.from('questions').select('*').eq('subject', subject);

    if (last_fetched_at) {
        query = query.gt('updated_at', last_fetched_at);
    }
    if (subject) {
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching questions: ', error.message);
            return [];
        }

        return data;
    }

    return [];
};

// Fetches questions for a specific subject, handling both regular and bookmarked questions.
const useQuestions = (subject: string | undefined, bookmarked: boolean) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // A guard to prevent fetching if the subject is not yet defined.
        if (!subject) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError('');

            try {
                let localData: Question[] = [];
                // If the 'bookmarked' flag is true, we fetch bookmarked questions.
                if (bookmarked) {
                    const profile = getUserProfile();
                    // The user's bookmarked questions are retrieved from their profile.
                    const bookmarkIds =
                        (profile?.bookmark_questions as unknown as Question[])?.map((q) => q.id) ||
                        [];
                    if (bookmarkIds.length > 0) {
                        localData = await getQuestionByIds(bookmarkIds);
                        localData = localData.filter((q) => q.subject === subject);
                    }
                } else {
                    localData = await getQuestionsBySubject(subject);
                }

                if (isMounted) {
                    setQuestions(sortQuestionsByYear(localData));
                    if (localData.length > 0) setIsLoading(false);
                }

                // Background Sync
                const syncMeta = await getSubjectSyncMetadata(subject);
                const lastFetched = syncMeta?.last_fetched_at;
                const lastSynced = syncMeta?.last_sync;

                let remoteUpdates: Question[] = [];
                let remotedFetched = false;
                if (!lastSynced || Date.now() - Number(lastSynced) >= 1 * 60 * 60 * 1000) {
                    remoteUpdates = await fetchQuestionsBySubject(subject, lastFetched);
                    await updateSubjectSyncMetadata(subject);
                    remotedFetched = true;
                }

                if (remoteUpdates.length > 0) {
                    await bulkUpsertQuestions(remoteUpdates);
                    const newMaxTime = getLatestTimestamp(remoteUpdates, lastFetched);
                    if (newMaxTime) {
                        await updateSubjectSyncMetadata(subject, newMaxTime);
                    }

                    // refresh UI
                    if (bookmarked) {
                        const profile = getUserProfile();
                        const bookmarkIds =
                            (profile?.bookmark_questions as unknown as Question[])?.map(
                                (q) => q.id,
                            ) || [];
                        if (bookmarkIds.length > 0) {
                            const updatedLocal = await getQuestionByIds(bookmarkIds);
                            const filtered = updatedLocal.filter((q) => q.subject === subject);
                            if (isMounted) setQuestions(sortQuestionsByYear(filtered));
                        }
                    } else {
                        const updatedLocal = await getQuestionsBySubject(subject);
                        if (isMounted) setQuestions(sortQuestionsByYear(updatedLocal));
                    }

                    if (isMounted && remotedFetched) toast.success('Questions updated.');
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    console.error(String(err)); // fallback for non-Error objects
                }
                toast.error('Could not load questions.');
            } finally {
                // Ensure the loading state is set to false in all cases (success or error).
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [subject, bookmarked]); // The effect re-runs whenever the subject or the bookmarked flag changes.

    // Expose the questions, loading state, and error state to the component.
    return { questions, isLoading, error };
};

export default useQuestions;
