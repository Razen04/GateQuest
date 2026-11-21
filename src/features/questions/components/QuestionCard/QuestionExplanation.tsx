import React, { lazy, Suspense } from 'react';
import ModernLoader from '@/shared/components/ModernLoader';
import type { Question, RevisionQuestion } from '@/shared/types/storage';

const MathRenderer = lazy(() => import('../Renderers/MathRenderer'));

interface QuestionExplanationProps {
    question: RevisionQuestion | Question;
}

const QuestionExplanation: React.FC<QuestionExplanationProps> = ({
    question,
}) => {
    const textToRender = question.answer_text;

    if (!textToRender) return null;

    return (
        <div className="my-4 border-l-4 border-primary pl-4 overflow-x-auto bg-primary/5 p-3">
            <h4 className="text-xl font-semibold text-primary mb-2">
                Explanation
            </h4>

            <p className="text-sm text-destructive/80 mb-4 italic">
                This is AI-generated and may contain errors. If it seems
                incorrect or unclear, please report it. You can look at GO
                explanation too.
            </p>

            <div className="text-foreground text-sm leading-relaxed">
                <Suspense fallback={<ModernLoader />}>
                    <MathRenderer text={textToRender} />
                </Suspense>
            </div>
        </div>
    );
};

export default QuestionExplanation;
