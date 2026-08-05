import React from 'react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/shared/components/ui/button';

type PaginationProps = {
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
};

const Pagination = ({ currentPage, setCurrentPage, totalPages }: PaginationProps) => {
    return (
        <div className="flex justify-between items-center w-full py-3 mt-3 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl shadow-lg">
            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-20 rounded-none bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20 transition-all disabled:opacity-40"
            >
                <ArrowLeft />
            </Button>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-20 rounded-none bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20 transition-all disabled:opacity-40"
            >
                <ArrowRight />
            </Button>
        </div>
    );
};

export default Pagination;
