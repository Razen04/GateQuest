// This custom hook synchronizes the filter state of the question list with the URL's query parameters.
// This allows filter states to be bookmarkable and shareable.

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

type useUrlFiltersProps = {
    searchQuery: string;
    difficultyFilter: string;
    yearFilter: string;
    topicFilter: string;
    attemptFilter: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setDifficultyFilter: React.Dispatch<React.SetStateAction<string>>;
    setYearFilter: React.Dispatch<React.SetStateAction<string>>;
    setTopicFilter: React.Dispatch<React.SetStateAction<string>>;
    setAttemptFilter: React.Dispatch<React.SetStateAction<string>>;
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
}: useUrlFiltersProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    // A ref to ensure the initialization logic runs only once.
    const initRef = useRef(false);

    // This effect runs on mount to ensure the URL has a complete set of default filter parameters.
    // This prevents an inconsistent state if a user navigates to a URL with missing parameters.
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const params = new URLSearchParams(searchParams);
        // Define the default values for all filter parameters.
        const defaults = {
            bookmarked: searchParams.get('bookmarked') ?? 'false',
            q: searchParams.get('q') ?? '',
            diff: searchParams.get('diff') ?? 'all',
            year: searchParams.get('year') ?? 'all',
            topic: searchParams.get('topic') ?? 'all',
            attempt: searchParams.get('attempt') ?? 'unattempted',
        };

        let changed = false;
        // Check if any default parameter is missing from the URL and add it if so.
        Object.entries(defaults).forEach(([k, v]) => {
            if (params.get(k) === null) {
                params.set(k, v);
                changed = true;
            }
        });

        // If any parameters were added, update the URL. 'replace: true' avoids creating a new history entry.
        if (changed) setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // This effect runs once on mount to "hydrate" the local filter state from the URL.
    // This ensures that if a user lands on a URL with pre-set filters, the UI reflects that state.
    useEffect(() => {
        const q = searchParams.get('q') ?? '';
        const diff = searchParams.get('diff') ?? 'all';
        const year = searchParams.get('year') ?? 'all';
        const topic = searchParams.get('topic') ?? 'all';
        const attempt = searchParams.get('attempt') ?? 'unattempted';
        setSearchQuery(q);
        setDifficultyFilter(diff);
        setYearFilter(year);
        setTopicFilter(topic);
        setAttemptFilter(attempt);
        // The exhaustive-deps rule is disabled because this effect is intentionally designed to run only once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // This effect runs whenever the local filter state changes, and it updates the URL to match.
    // This is the "state to URL" part of the two-way binding.
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        // Construct the next state of the URL parameters based on the current filter state.
        const next = {
            bookmarked: searchParams.get('bookmarked') ?? 'false',
            q: searchQuery || '',
            diff: difficultyFilter,
            year: yearFilter,
            topic: topicFilter,
            attempt: attemptFilter,
        };

        let changed = false;
        // Compare the current URL params with the next state and update only what's necessary.
        Object.entries(next).forEach(([k, v]) => {
            if (params.get(k) !== v) {
                params.set(k, v);
                changed = true;
            }
        });

        if (changed) setSearchParams(params, { replace: true });
    }, [
        searchQuery,
        difficultyFilter,
        yearFilter,
        topicFilter,
        attemptFilter,
        searchParams,
        setSearchParams,
    ]);

    // A derived boolean state for the 'bookmarked' filter.
    const bookmarked = searchParams.get('bookmarked') === 'true';

    // Memoize the full query string. This is useful for constructing links that need to preserve the current filter state.
    const queryString = useMemo(() => {
        return new URLSearchParams({
            bookmarked: String(bookmarked),
            q: searchQuery || '',
            diff: difficultyFilter,
            year: yearFilter,
            topic: topicFilter,
            attempt: attemptFilter,
        }).toString();
    }, [bookmarked, searchQuery, difficultyFilter, yearFilter, topicFilter, attemptFilter]);

    // Expose the generated query string and the raw searchParams object.
    return { queryString, searchParams };
}
