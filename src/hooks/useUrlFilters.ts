// This custom hook synchronizes the filter state of the question list with the URL's query parameters.
// This allows filter states to be bookmarkable and shareable.

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

type useUrlFiltersProps = {
    searchQuery: string;
    difficultyFilter: string[];
    yearFilter: string[];
    topicFilter: string[];
    attemptFilter: string;
    examFilter: string[];
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setDifficultyFilter: React.Dispatch<React.SetStateAction<string[]>>;
    setYearFilter: React.Dispatch<React.SetStateAction<string[]>>;
    setTopicFilter: React.Dispatch<React.SetStateAction<string[]>>;
    setAttemptFilter: React.Dispatch<React.SetStateAction<string>>;
    setExamFilter: React.Dispatch<React.SetStateAction<string[]>>;
};

// Manages the two-way data binding between the filter state and the URL search parameters.
export default function useUrlFilters({
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
}: useUrlFiltersProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    // A ref to ensure the initialization logic runs only once.
    const initRef = useRef(false);

    // Helper to parse comma-separated strings into arrays
    const getArrayParam = (key: string) => {
        const val = searchParams.get(key);
        return val && val !== 'all' ? val.split(',') : [];
    };

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        // Populate initial local state from URL
        setSearchQuery(searchParams.get('q') ?? '');
        setDifficultyFilter(getArrayParam('diff'));
        setYearFilter(getArrayParam('year'));
        setTopicFilter(getArrayParam('topic'));
        setExamFilter(getArrayParam('exam'));
        setAttemptFilter(searchParams.get('attempt') ?? 'unattempted');

        // The exhaustive-deps rule is disabled because this effect is intentionally designed to run only once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This prevents an inconsistent state if a user navigates to a URL with missing parameters.
    useEffect(() => {
        if (!initRef.current) return;

        const params = new URLSearchParams(searchParams);

        // Helper to handle array-to-string conversion for URL
        const setArrayParam = (key: string, arr: string[]) => {
            if (arr.length > 0) params.set(key, arr.join(','));
            else params.set(key, 'all');
        };

        params.set('q', searchQuery || '');
        params.set('attempt', attemptFilter);
        params.set('bookmarked', searchParams.get('bookmarked') ?? 'false');

        setArrayParam('diff', difficultyFilter);
        setArrayParam('year', yearFilter);
        setArrayParam('topic', topicFilter);
        setArrayParam('exam', examFilter);

        // Only update if the resulting query string has actually changed
        if (params.toString() !== searchParams.toString()) {
            setSearchParams(params, { replace: true });
        }
    }, [
        searchQuery,
        difficultyFilter,
        yearFilter,
        topicFilter,
        attemptFilter,
        examFilter,
        setSearchParams,
        searchParams,
    ]);

    // A derived boolean state for the 'bookmarked' filter.
    const bookmarked = searchParams.get('bookmarked') === 'true';

    // Memoize the full query string. This is useful for constructing links that need to preserve the current filter state.
    const queryString = useMemo(() => {
        const p = new URLSearchParams({
            bookmarked: String(bookmarked),
            q: searchQuery || '',
            attempt: attemptFilter,
            diff: difficultyFilter.length > 0 ? difficultyFilter.join(',') : 'all',
            year: yearFilter.length > 0 ? yearFilter.join(',') : 'all',
            topic: topicFilter.length > 0 ? topicFilter.join(',') : 'all',
            exam: examFilter.length > 0 ? examFilter.join(',') : 'all',
        });
        return p.toString();
    }, [
        bookmarked,
        searchQuery,
        difficultyFilter,
        yearFilter,
        topicFilter,
        attemptFilter,
        examFilter,
    ]);

    // Expose the generated query string and the raw searchParams object.
    return { queryString, searchParams };
}
