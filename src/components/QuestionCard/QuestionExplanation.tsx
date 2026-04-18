import * as React from 'react';
import MathRenderer from '../Renderers/MathRenderer';
import type { RevisionQuestion, Question } from '@/types/storage';

interface QuestionExplanationProps {
    question: RevisionQuestion | Question;
    customAiAnswer: string | undefined;
}

const QuestionExplanation: React.FC<QuestionExplanationProps> = ({ question, customAiAnswer }) => {
    const textToRender = customAiAnswer || question.answer_text;
    
    if (!textToRender) return null;

    return (
        <div className="my-4 question-explanation border-l-4 border-blue-500 pl-4 overflow-x-auto bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-r">
            <h4 className="text-xl font-semibold text-blue-500 dark:text-blue-400 mb-1">AI Explanation</h4>
            <p className="text-xs text-blue-400 dark:text-blue-300 mb-4 italic">
                This is AI-generated and may contain errors. If it seems incorrect or unclear,
                please report it. You can look at GO explanation too.
            </p>
            <div className="text-gray-800 dark:text-gray-200">
                <MathRenderer text={textToRender} />
            </div>
        </div>
    );
};

export default QuestionExplanation;
