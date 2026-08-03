// This custom hook provides comprehensive filtering and sorting logic for question lists.
// It manages filter states and efficiently computes the filtered list based on user selections.

import { useEffect, useMemo, useState } from 'react';
import { normalizeTag, sortQuestionsByYear } from '@/shared/utils/helper';
import type { Question, RevisionQuestion } from '@/shared/types/storage';
import { supabase } from '@/shared/utils/supabaseClient';

// Type of filter mode for smart-Revision
type FilterMode = 'practice' | 'revision';

type AttemptFilterMode = 'all' | 'attempted' | 'unattempted' | 'bookmarked';

// The main hook function that encapsulates all filtering logic.
const useFilters = (
    sourceQuestions: Question[] | RevisionQuestion[],
    subject: string | null,
    selectedQuestion: string | null,
    mode: FilterMode,
) => {
    // State for each available filter option.
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
    const [yearFilter, setYearFilter] = useState<string[]>([]);
    const [topicFilter, setTopicFilter] = useState<string[]>([]);
    const [attemptFilter, setAttemptFilter] = useState<AttemptFilterMode>('unattempted');
    const [examFilter, setExamFilter] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string[]>([]);

    const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

    // Fetch attempted question IDs on mount/change & listen for updates
    useEffect(() => {
        async function fetchAttemptedIds() {
            // In practice mode, we need a subject slug. In revision, subject can be null for global revision.
            if (!subject && mode === 'practice') return;

            const { data, error } = await supabase.rpc('get_user_attempted_ids', {
                p_subject_slug: subject,
                p_mode: mode,
            });

            if (!error && data) {
                setAttemptedIds(
                    new Set(data.map((row: { question_id: string }) => row.question_id)),
                );
            }
        }

        fetchAttemptedIds();

        // Refetch when a question is submitted
        window.addEventListener('STATS_UPDATED', fetchAttemptedIds);
        return () => window.removeEventListener('STATS_UPDATED', fetchAttemptedIds);
    }, [subject, mode]);

    // Fetch bookmarked question IDs when needed & listen for updates
    useEffect(() => {
        async function fetchBookmarkedIds() {
            if (!subject && mode === 'practice') return;

            const { data, error } = await supabase.rpc('get_user_bookmarks', {
                p_subject_slug: subject,
            });

            if (!error && data) {
                setBookmarkedIds(
                    new Set(data.map((row: { question_id: string }) => row.question_id)),
                );
            }
        }

        // Fetch bookmarks immediately if bookmarked filter is active
        if (attemptFilter === 'bookmarked') {
            fetchBookmarkedIds();
        }

        // Refetch bookmarks whenever a bookmark action occurs anywhere in the app
        window.addEventListener('BOOKMARKS_UPDATED', fetchBookmarkedIds);
        return () => window.removeEventListener('BOOKMARKS_UPDATED', fetchBookmarkedIds);
    }, [subject, mode, attemptFilter]);

    // Core filtering logic
    const filteredQuestions = useMemo(() => {
        let filtered = [...sourceQuestions];

        // Apply search filter against the question text and tags.
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(
                (qn) =>
                    qn.question?.toLowerCase().includes(q) ||
                    qn.tags?.some((tag) => tag.toLowerCase().includes(q)),
            );
        }

        // Apply difficulty filter.
        if (difficultyFilter.length > 0) {
            filtered = filtered.filter((qn) => difficultyFilter.includes(qn.difficulty || ''));
        }

        // Apply year filter.
        if (yearFilter.length > 0) {
            filtered = filtered.filter((qn) => yearFilter.includes(qn.year?.toString() || ''));
        }

        // Apply topic filter.
        if (topicFilter.length > 0) {
            filtered = filtered.filter((qn) => topicFilter.includes(qn.topic || ''));
        }

        // Apply filter for attempted/unattempted questions.
        if (attemptFilter && attemptFilter !== 'all') {
            filtered = filtered.filter((qn) => {
                const isActive = qn.id === selectedQuestion;
                const isAttempted = attemptedIds.has(qn.id);

                if (attemptFilter === 'bookmarked') {
                    return bookmarkedIds.has(qn.id) || isActive;
                }

                // Ensures currently active question remains visible even if attempted
                return attemptFilter === 'attempted' ? isAttempted : !isAttempted || isActive;
            });
        }

        if (examFilter.length > 0) {
            filtered = filtered.filter((qn) => {
                const examData = qn.metadata?.exam;
                if (!examData) return false;
                const exams = Array.isArray(examData) ? examData : [examData];
                return exams.some((e) => examFilter.includes(e.toUpperCase()));
            });
        }

        if (tagFilter.length > 0) {
            filtered = filtered.filter((qn) => {
                return qn.tags?.some((tag) => tagFilter.includes(normalizeTag(tag)));
            });
        }

        return sortQuestionsByYear(filtered);
    }, [
        sourceQuestions,
        searchQuery,
        difficultyFilter,
        yearFilter,
        topicFilter,
        attemptFilter,
        attemptedIds,
        examFilter,
        selectedQuestion,
        tagFilter,
        bookmarkedIds,
    ]);

    // Expose the filtered data and state setters to UI components
    return {
        filteredQuestions,
        searchQuery,
        setSearchQuery,
        difficultyFilter,
        setDifficultyFilter,
        yearFilter,
        setYearFilter,
        topicFilter,
        setTopicFilter,
        attemptFilter,
        setAttemptFilter,
        examFilter,
        setExamFilter,
        tagFilter,
        setTagFilter,
    };
};

export default useFilters;
