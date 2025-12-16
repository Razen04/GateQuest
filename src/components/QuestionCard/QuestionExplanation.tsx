import type { RevisionQuestion } from '@/types/question';
import * as React from 'react';
import MathRenderer from '../Renderers/MathRenderer';

interface QuestionExplanationProps {
    question: RevisionQuestion;
}

const QuestionExplanation: React.FC<QuestionExplanationProps> = ({ question }) => {
    if (!question.answer_text)
        return <p className="italic text-red-300">No explanation available as of yet.</p>;
    return (
        <div className="my-4 question-explanation border-l-4 border-blue-500 pl-4 overflow-x-scroll">
            <h4 className="text-xl font-semibold text-blue-400 underline">Explanation</h4>
            <p className="text-xs md:text-sm text-red-400 mb-2">
                This is AI-generated and may contain errors. If it seems incorrect or unclear,
                please report it. You can look at GO explanation too.
            </p>

            <MathRenderer text={question.answer_text} />
        </div>
    );
};

export default QuestionExplanation;
