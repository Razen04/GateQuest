// This custom hook provides logic for paginating a list of items.
// It calculates the total number of pages and returns the items for the current page.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question, RevisionQuestion } from '../types/question.ts';

// Manages the state and calculations for paginating an array of items.
export default function usePagination(items: Question[] | RevisionQuestion[], perPage = 20) {
    // State to keep track of the current page number.
    const [currentPage, setCurrentPage] = useState(1);
    // A ref to attach to the list container, used for scrolling to the top on page change.
    const listRef = useRef<HTMLDivElement>(null);

    // Calculate the total number of pages required to display all items.
    // Math.max ensures there is always at least one page, even if there are no items.
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));

    // Memoize the sliced array of items for the current page.
    // This is a performance optimization that prevents re-slicing the array on every render, only when the source items, current page, or items per page change.
    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return items.slice(start, start + perPage);
    }, [items, currentPage, perPage]);

    // This effect resets the pagination to the first page whenever the underlying data set changes.
    // This is important, for example, when filters are applied to the list.
    useEffect(() => {
        setCurrentPage(1);
    }, [items]);

    // This effect provides a better user experience by scrolling the list container to the top whenever the user navigates to a new page.
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [currentPage]);

    // Expose all necessary state and functions to the component using the hook.
    return {
        currentPage,
        setCurrentPage,
        totalPages,
        pageItems,
        listRef,
        perPage,
    };
}
