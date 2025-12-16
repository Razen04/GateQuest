import { ArrowLeft } from '@phosphor-icons/react';
import type { Question } from '../../types/question.js';

type HeaderProps = {
    handleBack: () => void;
    questions: Question[];
    attemptFilter?: string;
};

const Header = ({ handleBack, questions, attemptFilter }: HeaderProps) => {
    return (
        <div className="flex justify-between items-center w-full  mb-4 sm:mb-6">
            <button
                onClick={handleBack}
                className="flex items-center hover:text-blue-500 transition-colors cursor-pointer text-xs md:text-base sm:w-auto"
            >
                <ArrowLeft className="mr-2" />
                <span>Back</span>
            </button>

            <div className="flex">
                <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 text-xs md:text-sm">
                    {questions?.length}{' '}
                    {attemptFilter &&
                        attemptFilter.charAt(0).toUpperCase() + attemptFilter.slice(1)}{' '}
                    Question
                </span>
            </div>
        </div>
    );
};

export default Header;
