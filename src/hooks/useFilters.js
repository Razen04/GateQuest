import { useContext, useMemo, useState } from "react";
import StatsContext from "../context/StatsContext";

// Add this helper function above the useEffect
const sortQuestionsByYear = (questionsToSort) => {
    return [...questionsToSort].sort((a, b) => {
        // Convert year to number (default to 0 if year is not present)
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;

        // Sort descending (newest first)
        return yearB - yearA;
    });
};

const useFilters = (sourceQuestions, subject, selectedQuestion) => {

    const [searchQuery, setSearchQuery] = useState('')
    const [difficultyFilter, setDifficultyFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [topicFilter, setTopicFilter] = useState('all')
    const [attemptFilter, setAttemptFilter] = useState('unattempted')

    const { stats } = useContext(StatsContext);
    const subjectStats = stats?.subjectStats;

    const attemptedIds = useMemo(() => {
        if (!subjectStats) return new Set();

        const merged = new Set();

        subjectStats
            .filter((s) => s.subject === subject)
            .forEach((s) => {
                for (const id of s.attemptedQuestionIds) {
                    merged.add(id);
                }
            })

        return merged;
    }, [subjectStats, subject])

    // 2. useMemo will re-calculate the filtered list only when the source data or a filter changes
    const filteredQuestions = useMemo(() => {
        let filtered = [...sourceQuestions];

        // Apply search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(qn =>
                qn.question?.toLowerCase().includes(q) ||
                qn.tags?.some(tag => tag.toLowerCase().includes(q))
            );
        }

        // Apply difficulty filter
        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(qn => qn.difficulty === difficultyFilter);
        }

        // Apply year filter
        if (yearFilter !== 'all') {
            filtered = filtered.filter(qn => qn.year?.toString() === yearFilter);
        }

        // Apply topic filter
        if (topicFilter && topicFilter !== 'all') {
            filtered = filtered.filter(qn => qn.topic === topicFilter);
        }

        // Apply attempted filter
        if (attemptFilter && attemptFilter !== 'all') {
            filtered = filtered.filter(qn => {
                const isAttempted = attemptedIds?.has(qn.id);
                const isActive = qn.id === selectedQuestion;
                return attemptFilter === 'attempted' ? isAttempted : !isAttempted || isActive;
            });
        }

        console.log("filtered: ", filtered)
        return sortQuestionsByYear(filtered);
    }, [sourceQuestions, searchQuery, difficultyFilter, yearFilter, topicFilter, attemptFilter, attemptedIds, selectedQuestion]);

    // 3. Return the filtered data and the state setters for the UI to use
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