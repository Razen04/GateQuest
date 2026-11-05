import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import React from 'react';
import { Button } from '@/shared/components/ui/button';

type PaginationProps = {
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
};

const Pagination = ({
    currentPage,
    setCurrentPage,
    totalPages,
}: PaginationProps) => {
    return (
        <div className="mt-3 flex w-full items-center justify-between py-3 shadow-sm backdrop-blur-xl">
            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-20 rounded-none border border-border bg-secondary/70 text-secondary-foreground backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            >
                <ArrowLeft weight="bold" />
            </Button>

            <span className="font-['Manrope'] text-sm font-semibold text-muted-foreground tabular-nums">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="w-20 rounded-none border border-border bg-secondary/70 text-secondary-foreground backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            >
                <ArrowRight weight="bold" />
            </Button>
        </div>
    );
};

export default Pagination;
