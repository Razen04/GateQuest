import React from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'

const Pagination = ({ currentPage, setCurrentPage, totalPages }) => {
    return (
        <div className="flex justify-between items-center w-full py-2 mt-2">
            <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-8 py-2 bg-gray-100 dark:bg-zinc-700 rounded disabled:opacity-50 cursor-pointer"
            >
                <FaChevronLeft />
            </button>
            <span className="text-sm">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-8 cursor-pointer py-2 bg-gray-100 dark:bg-zinc-700 rounded disabled:opacity-50"
            >
                <FaChevronRight />
            </button>
        </div>
    )
}

export default Pagination