// This custom hook is responsible for fetching questions for a given subject.
// It handles loading and error states, and implements a caching strategy using localStorage to reduce network requests.

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { getUserProfile, sortQuestionsByYear } from '../helper';

// The base URL for the questions API is retrieved from environment variables.
const API_BASE = import.meta.env.VITE_API_BASE;

// Fetches questions for a specific subject, handling both regular and bookmarked questions.
const useQuestions = (subject, bookmarked) => {
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // A guard to prevent fetching if the subject is not yet defined.
        if (!subject) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // If the 'bookmarked' flag is true, we fetch bookmarked questions.
                if (bookmarked) {
                    const profile = getUserProfile();
                    // All questions for the subject are loaded from localStorage.
                    const subjectQuestions = JSON.parse(localStorage.getItem(subject) || "[]");
                    // The user's bookmarked questions are retrieved from their profile.
                    const bookmarkedQuestions = profile?.bookmark_questions?.filter(q => q.subject === subject) || [];

                    if (bookmarkedQuestions.length > 0) {
                        // We create a Set of bookmarked IDs for efficient lookup.
                        const ids = new Set(bookmarkedQuestions.map(q => q.id));
                        // Then, we filter the full list of subject questions to get the bookmarked ones.
                        const questions = subjectQuestions.filter(q => ids.has(q.id));
                        
                        setQuestions(sortQuestionsByYear(questions));
                    } else {
                        setQuestions([]); // If no bookmarks, return an empty array.
                        toast.message("No questions bookmarked yet.");
                    }
                } else {
                    // For regular (non-bookmarked) questions, we first check localStorage for a cached version.
                    const localQuestions = JSON.parse(localStorage.getItem(subject));
                    if (Array.isArray(localQuestions) && localQuestions.length > 0) {
                        // If a cached version exists, we use it directly.
                        setQuestions(localQuestions);
                    } else {
                        // If not cached, we fetch the questions from the API.
                        const encodedSubject = encodeURIComponent(subject);
                        const res = await axios.get(`${API_BASE}/api/questions?subject=${encodedSubject}`);
                        const loadedQuestions = sortQuestionsByYear(res.data);
                        // After fetching, we cache the questions in localStorage for future use.
                        localStorage.setItem(subject, JSON.stringify(loadedQuestions));
                        setQuestions(loadedQuestions);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch questions:", err);
                setError(err);
                toast.error("Could not load questions.");
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