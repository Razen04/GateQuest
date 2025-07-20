// src/hooks/useQuestions.js

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { getUserProfile } from '../helper';

const API_BASE = import.meta.env.VITE_API_BASE;

// Helper to sort questions by year, newest first
const sortQuestionsByYear = (questionsToSort) => {
    return [...questionsToSort].sort((a, b) => {
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;
        return yearB - yearA;
    });
};

const useQuestions = (subject, activeFilter) => {
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Don't run if the necessary props aren't available yet
        if (!subject || !activeFilter) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (activeFilter === "bookmarked") {
                    const profile = getUserProfile();
                    const bookmarkedQuestions = profile?.bookmark_questions?.filter(q => q.subject === subject) || [];

                    if (bookmarkedQuestions.length > 0) {
                        const ids = bookmarkedQuestions.map(q => q.id).join(",");
                        const res = await axios.get(`${API_BASE}/api/questions/bookmarked?ids=${ids}`);
                        setQuestions(sortQuestionsByYear(res.data));
                    } else {
                        setQuestions([]); // No bookmarks for this subject
                        toast.message("No questions bookmarked yet.");
                    }
                } else {
                    // Check local storage first for non-bookmarked questions
                    const localQuestions = JSON.parse(localStorage.getItem(subject));
                    if (Array.isArray(localQuestions) && localQuestions.length > 0) {
                        setQuestions(localQuestions);
                    } else {
                        const encodedSubject = encodeURIComponent(subject);
                        const res = await axios.get(`${API_BASE}/api/questions?subject=${encodedSubject}`);
                        const loadedQuestions = sortQuestionsByYear(res.data);
                        localStorage.setItem(subject, JSON.stringify(loadedQuestions));
                        setQuestions(loadedQuestions);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch questions:", err);
                setError(err);
                toast.error("Could not load questions.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [subject, activeFilter]); // Re-fetch whenever the subject or filter changes

    return { questions, isLoading, error };
};

export default useQuestions;