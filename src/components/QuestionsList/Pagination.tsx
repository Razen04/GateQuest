import React from 'react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { Button } from '../ui/button';

type PaginationProps = {
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
};

const Pagination = ({ currentPage, setCurrentPage, totalPages }: PaginationProps) => {
    return (
        <div className="flex justify-between items-center w-full py-2 mt-2">
            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-md disabled:opacity-50 w-20"
            >
                <ArrowLeft />
            </Button>
            <span className="text-sm">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="ghost"
                size="icon-lg"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className=" rounded-md disabled:opacity-50 w-20"
            >
                <ArrowRight />
            </Button>
        </div>
    );
};

export default Pagination;
