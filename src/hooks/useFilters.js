import { useMemo, useState } from "react";

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

const useFilters = (sourceQuestions) => {

    const [searchQuery, setSearchQuery] = useState('')
    const [difficultyFilter, setDifficultyFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [topicFilter, setTopicFilter] = useState('all')

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

        return sortQuestionsByYear(filtered);
    }, [sourceQuestions, searchQuery, difficultyFilter, yearFilter, topicFilter]);

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
        setTopicFilter
    };
}

export default useFilters;