// This custom hook is responsible for fetching questions for a given subject.
// It handles loading and error states, and implements a caching strategy using localStorage to reduce network requests.
// It also compresses data to save space in localStorage and handles migration for existing uncompressed data.

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { getUserProfile, sortQuestionsByYear } from '../helper.ts';
import { supabase } from '../utils/supabaseClient.ts';
import {
    bulkUpsertQuestions,
    getQuestionByIds,
    getQuestionsBySubject,
    getSubjectSyncMetadata,
    updateSubjectSyncMetadata,
} from '@/storage/questionRepository.ts';
import { useGoals } from './useGoals.ts';
import type { Question } from '@/types/storage.ts';

// We normalise the mixed "exam" metadata (string or string[])
const isQuestionInActiveExams = (q: Question, activeExams: string[]) => {
    const examData = q.metadata?.exam;
    if (!examData) return false;

    const normalizedActive = activeExams.map((e) => e.toUpperCase());

    // if the metadata is an array
    if (Array.isArray(examData)) {
        return examData.some((e) => normalizedActive.includes(e.toUpperCase()));
    }

    return normalizedActive.includes(examData.toUpperCase());
};

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
    subject_id: string | undefined,
    last_fetched_at: string | undefined,
    examId: string | undefined,
) => {
    let query = supabase.from('questions').select('*').eq('subject_id', subject_id);

    if (examId) {
        query = query.contains('metadata->exam', [examId.toUpperCase()]);
    }

    if (last_fetched_at) {
        query = query.gt('updated_at', last_fetched_at);
    }
    if (subject_id) {
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
const useQuestions = (subjectId: string | undefined, bookmarked: boolean) => {
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { userGoal, getPracticeSubjects } = useGoals();

    // we will filter questions in-memory for display
    const filteredQuestions = useMemo(() => {
        const activeExams = (userGoal?.target_exams as string[]) || [];

        const currSubject = getPracticeSubjects().find((s) => s.id === subjectId);

        const isUniversalSubject = currSubject?.is_universal;

        if (bookmarked || isUniversalSubject) return allQuestions; // bookmarks will show all the questions regadless of exam selected
        return allQuestions.filter((q) => isQuestionInActiveExams(q, activeExams));
    }, [allQuestions, bookmarked, userGoal?.target_exams, getPracticeSubjects, subjectId]);

    useEffect(() => {
        // A guard to prevent fetching if the subject is not yet defined.
        if (!subjectId) {
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
                        localData = localData.filter((q) => q.subject_id === subjectId);
                    }
                } else {
                    localData = await getQuestionsBySubject(subjectId);
                }

                if (isMounted) {
                    setAllQuestions(sortQuestionsByYear(localData));
                    if (localData.length > 0) setIsLoading(false);
                }

                // Background Sync
                const syncMeta = await getSubjectSyncMetadata(subjectId);
                const lastFetched = syncMeta?.last_fetched_at;
                const lastSynced = syncMeta?.last_sync;

                let remoteUpdates: Question[] = [];
                let remotedFetched = false;
                if (!lastSynced || Date.now() - Number(lastSynced) >= 1 * 60 * 60 * 1000) {
                    remoteUpdates = await fetchQuestionsBySubject(
                        subjectId,
                        lastFetched,
                        undefined,
                    ); // we will sync everything
                    await updateSubjectSyncMetadata(subjectId);
                    remotedFetched = true;
                }

                if (remoteUpdates.length > 0) {
                    await bulkUpsertQuestions(remoteUpdates);
                    const newMaxTime = getLatestTimestamp(remoteUpdates, lastFetched);
                    if (newMaxTime) {
                        await updateSubjectSyncMetadata(subjectId, newMaxTime);
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
                            const filtered = updatedLocal.filter((q) => q.subject_id === subjectId);
                            if (isMounted) setAllQuestions(sortQuestionsByYear(filtered));
                        }
                    } else {
                        const updatedLocal = await getQuestionsBySubject(subjectId);
                        if (isMounted) setAllQuestions(sortQuestionsByYear(updatedLocal));
                    }

                    if (isMounted && remotedFetched) toast.success('Questions updated.');
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    console.error(String(err)); // fallback for non-Error objects
                }
                toast.error('Could not load questions. Try clearing cache and fetch again.');
            } finally {
                // Ensure the loading state is set to false in all cases (success or error).
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [subjectId, bookmarked]); // The effect re-runs whenever the subject or the bookmarked flag changes.

    // Expose the questions, loading state, and error state to the component.
    return { questions: filteredQuestions, isLoading, error };
};

export default useQuestions;
