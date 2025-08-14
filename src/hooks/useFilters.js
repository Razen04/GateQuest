// This custom hook provides comprehensive filtering and sorting logic for question lists.
// It manages filter states and efficiently computes the filtered list based on user selections.

import { useContext, useMemo, useState } from "react";
import StatsContext from "../context/StatsContext";
import { sortQuestionsByYear } from "../helper";

// The main hook function that encapsulates all filtering logic.
const useFilters = (sourceQuestions, subject, selectedQuestion) => {

    // State for each available filter option.
    const [searchQuery, setSearchQuery] = useState('')
    const [difficultyFilter, setDifficultyFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [topicFilter, setTopicFilter] = useState('all')
    const [attemptFilter, setAttemptFilter] = useState('unattempted')

    // Access the global stats context to get information about attempted questions.
    const { stats } = useContext(StatsContext);
    const subjectStats = stats?.subjectStats;

    // Memoize the set of attempted question IDs for the current subject.
    // This prevents recalculating this set on every render, only when stats or the subject changes.
    const attemptedIds = useMemo(() => {
        if (!subjectStats) return new Set();

        const merged = new Set();
        // Find the stats for the current subject and add all attempted question IDs to the set.
        subjectStats
            .filter((s) => s.subject === subject)
            .forEach((s) => {
                for (const id of s.attemptedQuestionIds) {
                    merged.add(id);
                }
            })

        return merged;
    }, [subjectStats, subject])

    // This is the core of the hook. useMemo ensures that the filtering logic only re-runs when the source data or any of the filter dependencies change. This is crucial for performance.
    const filteredQuestions = useMemo(() => {
        let filtered = [...sourceQuestions];

        // Apply search filter against the question text and tags.
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(qn =>
                qn.question?.toLowerCase().includes(q) ||
                qn.tags?.some(tag => tag.toLowerCase().includes(q))
            );
        }

        // Apply difficulty filter.
        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(qn => qn.difficulty === difficultyFilter);
        }

        // Apply year filter.
        if (yearFilter !== 'all') {
            filtered = filtered.filter(qn => qn.year?.toString() === yearFilter);
        }

        // Apply topic filter.
        if (topicFilter && topicFilter !== 'all') {
            filtered = filtered.filter(qn => qn.topic === topicFilter);
        }

        // Apply filter for attempted/unattempted questions.
        if (attemptFilter && attemptFilter !== 'all') {
            filtered = filtered.filter(qn => {
                const isAttempted = attemptedIds?.has(qn.id);
                // This ensures the currently selected question remains visible even if it's attempted and the filter is set to 'unattempted'.
                const isActive = qn.id === selectedQuestion;
                return attemptFilter === 'attempted' ? isAttempted : !isAttempted || isActive;
            });
        }

        // Finally, sort the filtered results by year.
        return sortQuestionsByYear(filtered);
    }, [sourceQuestions, searchQuery, difficultyFilter, yearFilter, topicFilter, attemptFilter, attemptedIds, selectedQuestion]);

    // Expose the filtered data and the state setters for the UI components to use.
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
        setAttemptFilter
    };
}

export default useFilters;