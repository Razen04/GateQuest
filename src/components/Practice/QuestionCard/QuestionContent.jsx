import React from 'react';
import { motion } from 'framer-motion';
import MathRenderer from '../MathRenderer';
import { isMultipleSelection } from '../../../utils/questionUtils';
import { CheckCircle } from 'phosphor-react';

// This component now only receives props. It has NO hooks.
const QuestionContent = ({
    currentQuestion,
    hasOptions,
    showAnswer,
    selectedOptionIndices,
    userAnswerIndex,
    onOptionSelect,
}) => {
    // Helper function to detect if options contain images
    const hasImageOptions = () => {
        return currentQuestion.options && currentQuestion.options.some(option => 
            option && typeof option === 'string' && option.includes('![')
        );
    };

    // Determine if we should use grid layout (for image options on large screens)
    const shouldUseGridLayout = hasImageOptions();

    return (
        <div>
            <div className="mb-4 sm:mb-6 overflow-x-scroll">
                <div className="text-sm md:text-lg">
                    {currentQuestion.question ? (
                        <MathRenderer text={currentQuestion.question} />
                    ) : (
                        <span>Question content unavailable</span>
                    )}
                </div>
            </div>

            {hasOptions && (
                <div className={`mb-4 sm:mb-6 ${
                    shouldUseGridLayout 
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4' 
                        : 'space-y-2 sm:space-y-3'
                }`}>
                    {currentQuestion.options.map((option, index) => {
                        // For MSQ: selectedOptionIndices, for MCQ: userAnswerIndex
                        let isSelected;
                        if(isMultipleSelection(currentQuestion)) {
                            isSelected = selectedOptionIndices?.includes(index) ?? false
                        } else {
                            isSelected = userAnswerIndex === index;
                        }

                        let isCorrect;
                        let correctAnswer = currentQuestion.correctAnswer;
                        if (isMultipleSelection(currentQuestion)) {
                            // MSQ
                            isCorrect = correctAnswer.includes(index);
                        } else {
                            // MCQ
                            isCorrect = correctAnswer[0] === index;
                        }

                        // Determine the final styles based on state
                        let optionStyle = 'border-gray-200 dark:border-zinc-700 hover:border-blue-200';
                        if (showAnswer) {
                            if (isCorrect) optionStyle = 'border-green-500 bg-green-50 dark:bg-green-600';
                            else if (isSelected) optionStyle = 'border-red-500 bg-red-50 dark:bg-red-600';
                        } else if (isSelected) {
                            optionStyle = 'border-blue-500 bg-blue-50 dark:bg-blue-600';
                        }

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: showAnswer ? 1 : 1.01 }}
                                whileTap={{ scale: showAnswer ? 1 : 0.99 }}
                                className={`p-4 border rounded-lg transition-all ${showAnswer ? 'cursor-default' : 'cursor-pointer'} ${optionStyle}`}
                                onClick={() => !showAnswer && onOptionSelect(index)}
                            >
                                <div className="flex items-center">
                                    {isMultipleSelection(currentQuestion) ? (
                                        // Checkbox for multiple selection
                                        <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-700'}`}>
                                            {isSelected && <CheckCircle className="text-white text-xs" />}
                                        </div>
                                    ) : (
                                        // Radio button for single selection
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${userAnswerIndex === index ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700'}`}>
                                            {userAnswerIndex === index && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        {option ? <MathRenderer text={option} /> : 'Option unavailable'}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuestionContent;