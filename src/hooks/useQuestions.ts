// This custom hook is responsible for fetching questions for a given subject.
// It handles loading and error states, and implements a caching strategy using localStorage to reduce network requests.
// It also compresses data to save space in localStorage and handles migration for existing uncompressed data.

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserProfile, sortQuestionsByYear } from '../helper.ts';
import type { Question } from '../types/question.ts';
import { supabase } from '../utils/supabaseClient.ts';
import { bulkUpsertQuestions, getQuestionsBySubject } from '@/storage/QuestionRepository.ts';

// Questions fetch using supabase
const fetchQuestionsBySubject = async (subject: string | undefined) => {
    if (subject) {
        const { data, error } = await supabase.from('questions').select('*').eq('subject', subject);

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

        const fetchData = async () => {
            setIsLoading(true);
            setError('');

            try {
                // If the 'bookmarked' flag is true, we fetch bookmarked questions.
                if (bookmarked) {
                    const profile = getUserProfile();
                    // All questions for the subject are loaded from indexedDb
                    const localQuestions = await getQuestionsBySubject(subject);

                    // The user's bookmarked questions are retrieved from their profile.
                    const bookmarkedQuestions: Question[] = Array.isArray(
                        profile?.bookmark_questions,
                    )
                        ? (profile.bookmark_questions as unknown as Question[]).filter(
                              (q) => q.subject === subject,
                          )
                        : [];

                    if (bookmarkedQuestions.length > 0) {
                        // We create a Set of bookmarked IDs for efficient lookup.
                        const ids = new Set(bookmarkedQuestions.map((q) => q.id));
                        // Then, we filter the full list of subject questions to get the bookmarked ones.
                        let questions: Question[];
                        if (localQuestions && localQuestions.length > 0)
                            questions = localQuestions.filter((q: Question) => ids.has(q.id));
                        else {
                            const loadedQuestions = await fetchQuestionsBySubject(subject);
                            questions = loadedQuestions.filter((q: Question) => ids.has(q.id));
                        }

                        setQuestions(sortQuestionsByYear(questions));
                    } else {
                        setQuestions([]); // If no bookmarks, return an empty array.
                        toast.message('No questions bookmarked yet.');
                    }
                } else {
                    const localQuestions = await getQuestionsBySubject(subject);
                    if (localQuestions && localQuestions.length > 0) {
                        setQuestions(localQuestions);
                    } else {
                        const loadedQuestions = await fetchQuestionsBySubject(subject);
                        if (loadedQuestions && loadedQuestions.length > 0) {
                            await bulkUpsertQuestions(loadedQuestions);
                            setQuestions(loadedQuestions);
                        }
                    }
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
                setIsLoading(false);
            }
        };

        fetchData();
    }, [subject, bookmarked]); // The effect re-runs whenever the subject or the bookmarked flag changes.

    // Expose the questions, loading state, and error state to the component.
    return { questions, isLoading, error };
};

export default useQuestions;
