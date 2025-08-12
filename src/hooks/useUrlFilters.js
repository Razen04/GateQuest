// src/hooks/useUrlFilters.js
import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useUrlFilters({
    searchQuery, setSearchQuery,
    difficultyFilter, setDifficultyFilter,
    yearFilter, setYearFilter,
    topicFilter, setTopicFilter,
    attemptFilter, setAttemptFilter,
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const initRef = useRef(false);

    // 1) Normalize defaults once
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const params = new URLSearchParams(searchParams);
        const defaults = {
            bookmarked: searchParams.get('bookmarked') ?? 'false',
            q: searchParams.get('q') ?? '',
            diff: searchParams.get('diff') ?? 'all',
            year: searchParams.get('year') ?? 'all',
            topic: searchParams.get('topic') ?? 'all',
            attempt: searchParams.get('attempt') ?? 'unattempted',
        };

        let changed = false;
        Object.entries(defaults).forEach(([k, v]) => {
            if (params.get(k) === null) {
                params.set(k, v);
                changed = true;
            }
        });

        if (changed) setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // 2) Hydrate filter state from URL once
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    // 3) Keep URL in sync with filter state
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const next = {
            bookmarked: searchParams.get('bookmarked') ?? 'false',
            q: searchQuery || '',
            diff: difficultyFilter,
            year: yearFilter,
            topic: topicFilter,
            attempt: attemptFilter,
        };

        let changed = false;
        Object.entries(next).forEach(([k, v]) => {
            if (params.get(k) !== v) {
                params.set(k, v);
                changed = true;
            }
        });

        if (changed) setSearchParams(params, { replace: true });
    }, [
        searchQuery, difficultyFilter, yearFilter, topicFilter, attemptFilter,
        searchParams, setSearchParams,
    ]);

    const bookmarked = searchParams.get('bookmarked') === 'true';

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

    return { queryString, searchParams };
}