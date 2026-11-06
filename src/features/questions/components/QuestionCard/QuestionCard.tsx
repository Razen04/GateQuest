import { ArrowLeftIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef } from 'react';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import Branding from '@/shared/components/Branding';
import useGoal from '@/shared/hooks/useGoal';
import { usePresence } from '@/shared/hooks/usePresence';
import type { Question } from '@/shared/types/storage';
import type { Database } from '@/shared/types/supabase';
import { openInAI } from '@/shared/utils/aiPromptUtils';
import {
    getCorrectAnswerText,
    isNumericalQuestion,
} from '../../utils/questionUtils';
import ActionButtons from './ActionButtons';
import AskAIBanner from './AskAIBanner';
import QuestionContent from './QuestionContent';
import QuestionExplanation from './QuestionExplanation';
import QuestionHeader from './QuestionHeader';
import QuestionPeerStats from './QuestionPeerStats';
import ResultMessage from './ResultMessage';

type TimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
};

type PeerStatsProps = {
    loading: boolean;
    message: string | null;
    data: Database['public']['Tables']['question_peer_stats']['Row'] | null;
};

type QuestionCardProps = {
    question: Question;
    totalQuestions: number;
    questionNumber: number;
    subjectSlug: string | undefined;

    userAnswerIndex: number | null;
    selectedOptionIndices: number[];
    numericalAnswer: number | null;
    marked?: boolean;

    showAnswer: boolean;
    result: 'correct' | 'incorrect' | 'unattempted';

    timer?: TimerProps;
    peerStats?: PeerStatsProps;

    onOptionSelect?: (index: number) => void;
    onNumericalChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onShowAnswer?: () => void;
    handleSubmit?: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReport: () => void;
    onShare: () => void;
    onCopy: () => void;
    onExplanationClick: () => void;
    onBack: () => void;

    isFirst: boolean;
    isLast: boolean;
};

const QuestionCard = ({
    question,
    totalQuestions,
    questionNumber,
    userAnswerIndex,
    selectedOptionIndices,
    numericalAnswer,
    marked,
    showAnswer,
    result,
    timer,
    peerStats,
    onOptionSelect,
    onNumericalChange,
    onShowAnswer,
    handleSubmit,
    onNext,
    onPrev,
    onReport,
    onShare,
    onCopy,
    subjectSlug,
    onExplanationClick,
    onBack,
    isFirst,
    isLast,
}: QuestionCardProps) => {
    const { isSubjectInGoal } = useGoal();
    const { count } = usePresence(question.id);

    const numInputRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    const aiProvider = useSettingsStore(
        (s) => s.settings.aiProvider ?? 'chatgpt'
    );
    const aiCustomPrompt = useSettingsStore((s) => s.settings.aiCustomPrompt);

    const handleAskAI = async (doubt?: string) => {
        await openInAI(question, aiProvider, aiCustomPrompt, doubt);
    };

    const hasOptions = !!(
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
    );

    const correctAnswerText = getCorrectAnswerText(question);

    useEffect(() => {
        if (pageRef.current) pageRef.current.scrollTop = 0;
    }, [questionNumber]);

    const isCompatible = isSubjectInGoal(question.subject_id);

    const hasSelection =
        selectedOptionIndices.length > 0 || numericalAnswer !== null;

    const optionPercentages = useMemo<number[] | null>(() => {
        const dist = peerStats?.data?.option_distribution as
            | Record<string, number>
            | null
            | undefined;
        const total = peerStats?.data?.total_attempts ?? 0;

        if (!dist || total === 0 || !question.options?.length) return null;

        return question.options.map((_, i) => {
            const count = dist[String(i)] ?? 0;
            return Math.round((count / total) * 100);
        });
    }, [peerStats?.data, question.options]);

    return (
        <div className="mx-auto mt-4 max-w-6xl p-6 pb-20 font-['Manrope'] text-foreground 2xl:max-w-7xl">
            <motion.button
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={onBack}
                className="mb-1 group inline-flex items-center gap-2 border border-border bg-card/60 px-3.5 py-2 font-grotesk text-xs font-bold text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-chart-1/30 hover:text-chart-1"
            >
                <ArrowLeftIcon
                    size={16}
                    className="transition-transform group-hover:-translate-x-0.5"
                />
                <span>Back to List</span>
            </motion.button>

            {/* Branch Mismatch Warning */}
            {!isCompatible && (
                <div className="mb-4 border border-chart-4/30 border-l-4 border-l-chart-4 bg-chart-4/10 p-4 text-foreground">
                    <p className="font-bold text-chart-4">Branch Mismatch</p>
                    <p className="text-sm text-muted-foreground">
                        This question belongs to a different branch. You can
                        view it, but answering is disabled to protect your
                        current branch progress.
                    </p>
                </div>
            )}

            {/* Main Card Container */}
            <div
                ref={pageRef}
                className="mx-auto mt-6 max-w-6xl flex-1 overflow-y-auto border border-border bg-card text-card-foreground shadow-sm 2xl:max-w-7xl"
            >
                {/* Header Section */}
                <QuestionHeader
                    questionNumber={questionNumber}
                    totalQuestions={totalQuestions}
                    question={question}
                    timer={timer}
                    onReport={onReport}
                    onShare={onShare}
                    onCopy={onCopy}
                    marked={marked}
                    isAnswered={showAnswer}
                    userCount={count}
                    subjectSlug={subjectSlug}
                />

                <div className="p-4 sm:p-6">
                    {/* Question Content */}
                    <QuestionContent
                        env="Practice"
                        currentQuestion={question}
                        hasOptions={hasOptions}
                        showAnswer={showAnswer}
                        selectedOptionIndices={selectedOptionIndices}
                        userAnswerIndex={userAnswerIndex}
                        onOptionSelect={onOptionSelect}
                        optionPercentages={optionPercentages}
                    />

                    {/* Numerical Input */}
                    {isNumericalQuestion(question) && onShowAnswer && (
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-semibold text-foreground">
                                Enter your numerical answer:
                            </label>

                            <input
                                ref={numInputRef}
                                type="number"
                                className="w-full border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={numericalAnswer ?? ''}
                                onChange={onNumericalChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onShowAnswer();
                                    }
                                }}
                                placeholder="Enter your answer"
                                disabled={showAnswer}
                            />

                            {showAnswer &&
                                numericalAnswer ===
                                    Number(correctAnswerText) && (
                                    <p className="mt-2 text-sm font-medium text-chart-2">
                                        Correct answer: {correctAnswerText}
                                    </p>
                                )}
                        </div>
                    )}

                    {/* Result Message */}
                    {showAnswer && (
                        <ResultMessage
                            numericalAnswer={numericalAnswer}
                            showAnswer={showAnswer}
                            result={result}
                            currentQuestion={question}
                        />
                    )}

                    {/* Peer Statistics */}
                    {showAnswer && (
                        <QuestionPeerStats
                            loading={peerStats?.loading}
                            message={peerStats?.message}
                            data={peerStats?.data}
                        />
                    )}

                    {/* Question Explanation */}
                    {showAnswer && <QuestionExplanation question={question} />}

                    {/* Ask AI */}
                    {showAnswer && (
                        <AskAIBanner
                            provider={aiProvider}
                            onClick={handleAskAI}
                        />
                    )}

                    {/* Action Buttons */}
                    <ActionButtons
                        isFirstQuestion={isFirst}
                        isLastQuestion={isLast}
                        handleNext={onNext}
                        handlePrevious={onPrev}
                        showAnswer={showAnswer}
                        handleShowAnswer={onShowAnswer}
                        handleSubmit={handleSubmit}
                        handleExplainationClick={onExplanationClick}
                        isCompatible={isCompatible}
                        hasSelection={hasSelection}
                    />
                </div>

                {/* Branding */}
                <Branding className="mx-4 mb-4 border-border md:mx-6" />
            </div>
        </div>
    );
};

export default QuestionCard;
