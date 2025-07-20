import { useState, useEffect, useCallback } from 'react'; // 1. Import useCallback
import { isMultipleSelection } from '../utils/questionUtils';

export const useQuestionState = (currentQuestion) => {
    const [userAnswerIndex, setUserAnswerIndex] = useState(null);
    const [selectedOptionIndices, setSelectedOptionIndices] = useState([]);
    const [numericalAnswer, setNumericalAnswer] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [result, setResult] = useState(null);

    const handleOptionSelect = (index) => {
        if (showAnswer) return;

        if (isMultipleSelection(currentQuestion)) {
            setSelectedOptionIndices(prev =>
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            );
        } else {
            const newIndex = userAnswerIndex === index ? null : index;
            setUserAnswerIndex(newIndex);
            setSelectedOptionIndices(newIndex !== null ? [newIndex] : []);
        }
    };

    // 2. Wrap the reset function in useCallback
    const reset = useCallback(() => {
        setUserAnswerIndex(null);
        setSelectedOptionIndices([]);
        setNumericalAnswer('');
        setShowAnswer(false);
        setResult(null);
    }, []); // 3. Use an empty dependency array because the setters are stable

    useEffect(() => {
        reset();
    }, [currentQuestion?.id, reset]); // Also add reset to this dependency array

    return {
        userAnswerIndex,
        selectedOptionIndices,
        numericalAnswer, setNumericalAnswer,
        showAnswer, setShowAnswer,
        result, setResult,
        handleOptionSelect,
        resetState: reset
    };
};