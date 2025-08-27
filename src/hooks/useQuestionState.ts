// This custom hook manages all the local state related to a single question,such as the user's selected answer, the result, and whether the answer is revealed.
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { isMultipleSelection } from '../utils/questionUtils.ts';
import type { Question } from '../types/question.ts';

// Manages the interactive state for a question card.
export const useQuestionState = (currentQuestion: Question) => {
    // State for single-choice questions.
    const [userAnswerIndex, setUserAnswerIndex] = useState<number | null>(null);
    // State for multiple-choice questions.
    const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
    // State for numerical answer type questions.
    const [numericalAnswer, setNumericalAnswer] = useState<number | null>(null);
    // State to control the visibility of the correct answer and explanation.
    const [showAnswer, setShowAnswer] = useState(false);
    // State to store the result of the user's answer (e.g., 'Correct', 'Incorrect').
    const [result, setResult] = useState<'correct' | 'incorrect' | 'unattempted'>('unattempted');

    // Handles changes to the numerical input field.
    const handleNumericalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Prevent input changes after the answer has been revealed.
        if (showAnswer) return;
        setNumericalAnswer(e.target.valueAsNumber);
    };

    // Handles the selection of an option for both single and multiple-choice questions.
    const handleOptionSelect = (index: number) => {
        // Prevent option changes after the answer has been revealed.
        if (showAnswer) return;

        // Check if the question is a multiple-selection type.
        if (isMultipleSelection(currentQuestion)) {
            // If it is, toggle the selected index in the array.
            setSelectedOptionIndices((prev) =>
                prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
            );
        } else {
            // For single-choice, selecting the same option deselects it.
            const newIndex = userAnswerIndex === index ? null : index;
            setUserAnswerIndex(newIndex);
            // The selectedOptionIndices array is kept in sync for consistency.
            setSelectedOptionIndices(newIndex !== null ? [newIndex] : []);
        }
    };

    // A memoized function to reset all local state to its initial values.
    // useCallback ensures this function reference is stable across re-renders,
    // which is important for its use in dependency arrays.
    const reset = useCallback(() => {
        setUserAnswerIndex(null);
        setSelectedOptionIndices([]);
        setNumericalAnswer(null);
        setShowAnswer(false);
        setResult('unattempted');
    }, []); // An empty dependency array is used because the state setters from useState are stable.

    // This effect triggers the reset function whenever the current question changes.
    // This ensures the UI is clean and ready for the new question.
    useEffect(() => {
        reset();
    }, [currentQuestion?.id, reset]); // It depends on the question ID and the reset function itself.

    // Expose all the necessary state and handlers to the component.
    return {
        userAnswerIndex,
        selectedOptionIndices,
        numericalAnswer,
        setNumericalAnswer,
        showAnswer,
        setShowAnswer,
        result,
        setResult,
        handleOptionSelect,
        resetState: reset, // Rename 'reset' to 'resetState' for clarity in the consuming component.
        handleNumericalInputChange,
    };
};
