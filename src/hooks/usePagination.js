import { useEffect, useMemo, useRef, useState } from 'react';

export default function usePagination(items, perPage = 20) {
    const [currentPage, setCurrentPage] = useState(1);
    const listRef = useRef(null);

    const totalPages = Math.max(1, Math.ceil(items.length / perPage));

    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return items.slice(start, start + perPage);
    }, [items, currentPage, perPage]);

    // Reset to first page when the data set changes
    useEffect(() => {
        setCurrentPage(1);
    }, [items]);

    // Optional: scroll the container to top on page change
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [currentPage]);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        pageItems,
        listRef,
        perPage,
    };
}