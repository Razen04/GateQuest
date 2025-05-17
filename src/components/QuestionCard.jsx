import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronLeft, FaChevronRight, FaEye, FaRedo, FaCheck, FaTimes, FaTag } from 'react-icons/fa'
import dsaQuestions from '../data/dsa.json'
import coaQuestions from '../data/coa.json'
import emCombinatory from '../data/em_combinatory.json'
import 'katex/dist/katex.min.css'
import MathRenderer from './MathRenderer'
// New imports for code highlighting
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
// Import renderMathInElement from KaTeX
import renderMathInElement from 'katex/dist/contrib/auto-render'

// Enhanced ContentRenderer that properly handles HTML, LaTeX, images and code
const ContentRenderer = ({ text }) => {
    const containerRef = useRef(null);

    if (!text) return <span className="text-gray-500">Content unavailable</span>;

    // First process code blocks to avoid interference with other formatting
    const processCodeBlocks = (content) => {
        if (!content.includes('```')) return { content, codeBlocks: [] };

        const codeBlocks = [];
        const regex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;

        // Replace code blocks with placeholders
        const processedContent = content.replace(regex, (match, language, code) => {
            const id = `code-${Math.random().toString(36).substr(2, 9)}`;
            codeBlocks.push({ id, language: language || 'plaintext', code });
            return `<div id="${id}"></div>`;
        });

        return { content: processedContent, codeBlocks };
    };

    // Process markdown images
    const processImages = (content) => {
        if (!content.includes('![')) return { content, images: [] };

        const images = [];
        const regex = /!\[(.*?)\]\((.*?)\)/g;

        // Replace images with placeholders
        const processedContent = content.replace(regex, (match, alt, src) => {
            const id = `img-${Math.random().toString(36).substr(2, 9)}`;
            images.push({ id, alt, src });
            return `<div id="${id}"></div>`;
        });

        return { content: processedContent, images };
    };

    // Process inline code
    const processInlineCode = (content) => {
        if (!content.includes('`')) return content;

        // Replace inline code, but avoid replacing already processed code blocks
        return content.replace(/(?<![`])`(?!`)(.*?)(?<!`)`(?![`])/g, (match, code) => {
            return `<code>${escapeHtml(code)}</code>`;
        });
    };

    // Process newlines to <br> tags
    const processNewlines = (content) => {
        return content.replace(/\n/g, '<br>');
    };

    // Process pseudocode tables
    const processPseudocodeTables = (content) => {
        if (!content.includes('|')) return content;

        // Detect if content contains a pseudocode table
        const lines = content.split('\n');
        const tableStartIndex = lines.findIndex(line =>
            line.includes('|') &&
            (line.toLowerCase().includes('function') ||
                line.toLowerCase().includes('algorithm') ||
                line.toLowerCase().includes('procedure'))
        );

        if (tableStartIndex === -1) return content;

        // Simple table processing - wrap in a special div
        return content.replace(/(\S.*?\|.*?\S.*?\n)+/g, (match) => {
            return `<div class="pseudocode-table">${match}</div>`;
        });
    };

    // Helper function to escape HTML special characters
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    };

    // Process LaTeX expressions - protect them from HTML processing
    const processLatex = (content) => {
        // Save inline LaTeX expressions
        const inlineRegex = /\$(.*?)\$/g;
        const inlineLatex = [];

        let processedContent = content.replace(inlineRegex, (match) => {
            const id = `latex-${inlineLatex.length}`;
            inlineLatex.push({ id, latex: match });
            return `<span id="${id}" class="latex-placeholder"></span>`;
        });

        // Save block LaTeX expressions
        const blockRegex = /\$\$(.*?)\$\$/g;
        const blockLatex = [];

        processedContent = processedContent.replace(blockRegex, (match) => {
            const id = `latex-block-${blockLatex.length}`;
            blockLatex.push({ id, latex: match });
            return `<div id="${id}" class="latex-placeholder-block"></div>`;
        });

        return { content: processedContent, inlineLatex, blockLatex };
    };

    // Step 1: Protect LaTeX expressions
    const { content: contentAfterLatex, inlineLatex, blockLatex } = processLatex(text);

    // Step 2: Process code blocks
    const { content: contentAfterCodeBlocks, codeBlocks } = processCodeBlocks(contentAfterLatex);

    // Step 3: Process markdown images
    const { content: contentAfterImages, images } = processImages(contentAfterCodeBlocks);

    // Step 4: Process inline code and pseudocode tables
    const contentAfterInlineCode = processInlineCode(contentAfterImages);
    const contentAfterPseudocode = processPseudocodeTables(contentAfterInlineCode);

    // Step 5: Process newlines
    const processedContent = processNewlines(contentAfterPseudocode);

    useEffect(() => {
        if (!containerRef.current) return;

        // First, render the processed content as HTML
        containerRef.current.innerHTML = processedContent;

        // Restore LaTeX expressions
        inlineLatex.forEach(({ id, latex }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = latex;
            }
        });

        blockLatex.forEach(({ id, latex }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = latex;
            }
        });

        // Process code blocks
        if (codeBlocks.length > 0) {
            codeBlocks.forEach(({ id, language, code }) => {
                const element = document.getElementById(id);
                if (element) {
                    const pre = document.createElement('pre');
                    pre.className = `language-${language}`;
                    const codeEl = document.createElement('code');
                    codeEl.className = `language-${language}`;
                    codeEl.textContent = code;
                    pre.appendChild(codeEl);
                    element.appendChild(pre);
                    Prism.highlightElement(codeEl);
                }
            });
        }

        // Process images
        if (images.length > 0) {
            images.forEach(({ id, alt, src }) => {
                const element = document.getElementById(id);
                if (element) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = alt || '';
                    img.className = 'max-w-full my-4 mx-auto rounded';

                    // Handle image loading errors
                    img.onerror = () => {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200';
                        errorMsg.innerHTML = `<strong>Image not found:</strong> ${src}`;
                        element.innerHTML = '';
                        element.appendChild(errorMsg);
                    };

                    element.appendChild(img);
                }
            });
        }

        // Render all LaTeX expressions after everything else is done
        try {
            renderMathInElement(containerRef.current, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                throwOnError: false
            });
        } catch (error) {
            console.error("Error rendering LaTeX:", error);
        }
    }, [text]);

    return (
        <div className="content-renderer" ref={containerRef}>
            {/* Content will be rendered by the useEffect */}
            <style jsx global>{`
                .content-renderer pre {
                    margin: 1rem 0;
                    border-radius: 0.5rem;
                    overflow: auto;
                }
                
                .content-renderer code {
                    background-color: #f1f1f1;
                    padding: 0.15rem 0.35rem;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }
                
                .content-renderer .pseudocode-table {
                    font-family: 'Courier New', monospace;
                    white-space: pre;
                    overflow-x: auto;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 0.5rem;
                    border: 1px solid #e9ecef;
                }
                
                .content-renderer img {
                    display: block;
                    max-width: 100%;
                    margin: 1rem auto;
                }
                
                .content-renderer br {
                    display: block;
                    margin: 0.5rem 0;
                    content: "";
                }
                
                .content-renderer table {
                    border-collapse: collapse;
                    margin: 1rem 0;
                    width: 100%;
                }
                
                .content-renderer table, .content-renderer th, .content-renderer td {
                    border: 1px solid #e9ecef;
                }
                
                .content-renderer th, .content-renderer td {
                    padding: 0.5rem;
                    text-align: left;
                }
                
                .content-renderer th {
                    background-color: #f8f9fa;
                }
                
                .latex-placeholder, .latex-placeholder-block {
                    color: #718096;
                }
            `}</style>
        </div>
    );
};

// ... Rest of the file remains unchanged

const QuestionCard = ({ subject = 'dsa', chapter = null, initialIndex = 0 }) => {
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [userAnswer, setUserAnswer] = useState(null)
    const [selectedOptions, setSelectedOptions] = useState([]) // For multiple selections
    const [numericalAnswer, setNumericalAnswer] = useState('') // For numerical input
    const [showAnswer, setShowAnswer] = useState(false)
    const [result, setResult] = useState(null) // correct, incorrect, or null

    // Load questions based on subject and chapter
    useEffect(() => {
        let loadedQuestions = []

        if (subject === 'dsa') {
            loadedQuestions = dsaQuestions || []
        } else if (subject === 'coa') {
            loadedQuestions = coaQuestions || []
        } else if (subject === 'em') {
            // Handle EM questions based on chapter
            if (chapter === 'combinatory') {
                loadedQuestions = emCombinatory || []
            }
        }

        setQuestions(loadedQuestions)

        // Reset state when subject changes
        setCurrentIndex(initialIndex)
        resetQuestion()
    }, [subject, chapter, initialIndex])

    const currentQuestion = questions[currentIndex]

    // Determine if current question is a multiple selection question
    const isMultipleSelection = () => {
        if (!currentQuestion) return false;
        if (currentQuestion.tags && Array.isArray(currentQuestion.tags)) {
            return currentQuestion.tags.some(tag =>
                tag.toLowerCase().includes('multiple-select') ||
                tag.toLowerCase().includes('multiple select')
            );
        }
        return currentQuestion.questionType === 'MSQ' ||
            currentQuestion.questionType === 'Multiple Select Question';
    }

    // Determine if current question is a numerical question
    const isNumericalQuestion = () => {
        if (!currentQuestion) return false;

        if (currentQuestion.tags && Array.isArray(currentQuestion.tags)) {
            return currentQuestion.tags.some(tag =>
                tag.toLowerCase().includes('numerical')
            );
        }

        return currentQuestion.questionType === 'Numerical Answer' ||
            (currentQuestion.options &&
                Array.isArray(currentQuestion.options) &&
                currentQuestion.options.length === 0);
    }

    // Handle single option selection
    const handleOptionSelect = (option) => {
        if (showAnswer) return;

        if (isMultipleSelection()) {
            // For multiple selection questions
            const optionIndex = selectedOptions.indexOf(option);
            if (optionIndex === -1) {
                // Add option if not already selected
                setSelectedOptions([...selectedOptions, option]);
            } else {
                // Remove option if already selected
                setSelectedOptions(selectedOptions.filter((_, index) => index !== optionIndex));
            }
        } else {
            // For single selection questions
            setUserAnswer(option);
        }
    }

    // Handle numerical input change
    const handleNumericalInputChange = (e) => {
        if (showAnswer) return;
        setNumericalAnswer(e.target.value);
    }

    // Check if an option is selected (for multiple selection)
    const isOptionSelected = (option) => {
        if (isMultipleSelection()) {
            return selectedOptions.includes(option);
        }
        return userAnswer === option;
    }

    // Handle show answer
    const handleShowAnswer = () => {
        setShowAnswer(true);

        try {
            if (isNumericalQuestion()) {
                // Handle numerical answer checking
                const userNumericValue = parseFloat(numericalAnswer);
                const correctNumericValue = parseFloat(currentQuestion?.correctAnswer);

                if (!isNaN(userNumericValue) && !isNaN(correctNumericValue)) {
                    // Consider small floating point differences as correct
                    const difference = Math.abs(userNumericValue - correctNumericValue);
                    setResult(difference < 0.001 ? 'correct' : 'incorrect');
                } else {
                    setResult('incorrect');
                }
            } else if (isMultipleSelection()) {
                // Handle multiple selection checking
                if (Array.isArray(currentQuestion?.correctAnswer) && selectedOptions.length > 0) {
                    // Get correct options based on indices
                    const correctOptions = currentQuestion.correctAnswer.map(index =>
                        currentQuestion.options[index]
                    ).filter(Boolean);

                    // Check if selected options match correct options
                    const allCorrectSelected = correctOptions.every(opt =>
                        selectedOptions.includes(opt)
                    );
                    const noExtraSelected = selectedOptions.every(opt =>
                        correctOptions.includes(opt)
                    );

                    setResult(allCorrectSelected && noExtraSelected ? 'correct' : 'incorrect');
                } else {
                    setResult('unattempted');
                }
            } else if (userAnswer) {
                // Handle single selection checking
                if (Array.isArray(currentQuestion?.correctAnswer)) {
                    const correctIndex = currentQuestion.correctAnswer[0];
                    if (currentQuestion.options &&
                        Array.isArray(currentQuestion.options) &&
                        correctIndex !== undefined &&
                        currentQuestion.options[correctIndex] !== undefined) {
                        const correctOption = currentQuestion.options[correctIndex];
                        setResult(userAnswer === correctOption ? 'correct' : 'incorrect');
                    } else {
                        setResult('unattempted');
                    }
                } else if (currentQuestion?.correctAnswer) {
                    setResult(userAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect');
                } else {
                    setResult('unattempted');
                }
            } else {
                setResult('unattempted');
            }
        } catch (error) {
            console.error("Error determining answer correctness:", error);
            setResult('unattempted');
        }
    }

    // Get correct answer text
    const getCorrectAnswerText = () => {
        if (!currentQuestion) return '';

        try {
            if (isNumericalQuestion()) {
                return currentQuestion.correctAnswer?.toString() ||
                    currentQuestion.answerText ||
                    'Answer not available';
            }

            if (isMultipleSelection() && Array.isArray(currentQuestion.correctAnswer)) {
                // For multiple selection, show all correct options
                const correctIndices = currentQuestion.correctAnswer;
                if (Array.isArray(currentQuestion.options)) {
                    const correctOptions = correctIndices.map(index =>
                        currentQuestion.options[index]
                    ).filter(Boolean);
                    return correctOptions.join(', ');
                }
            }

            if (Array.isArray(currentQuestion.correctAnswer) &&
                currentQuestion.options &&
                Array.isArray(currentQuestion.options)) {
                const index = currentQuestion.correctAnswer[0];
                if (index !== undefined && currentQuestion.options[index] !== undefined) {
                    return currentQuestion.options[index];
                }
            }

            // For questions that might have answerText
            if (currentQuestion.answerText) {
                return currentQuestion.answerText;
            }

            return currentQuestion.correctAnswer || 'Answer not available';
        } catch (error) {
            console.error("Error getting correct answer text:", error);
            return 'Answer not available';
        }
    }

    // Reset question state
    const resetQuestion = () => {
        setUserAnswer(null);
        setSelectedOptions([]);
        setNumericalAnswer('');
        setShowAnswer(false);
        setResult(null);
    }

    // Get question type text
    const getQuestionTypeText = (type) => {
        if (!type) return 'Question';

        switch (type) {
            case 'MCQ':
            case 'multiple-choice':
                return isMultipleSelection() ? 'Multiple Select Question' : 'Multiple Choice Question';
            case 'MSQ':
            case 'Multiple Select Question':
                return 'Multiple Select Question';
            case 'Numerical Answer':
                return 'Numerical Answer';
            case 'Descriptive':
                return 'Descriptive Question';
            case 'Match the following':
                return 'Match the Following';
            default:
                return type;
        }
    }

    // Move to next question
    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            resetQuestion();
        }
    }

    // Move to previous question
    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            resetQuestion();
        }
    }

    // Skip current question
    const handleSkip = () => {
        handleNext();
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading questions...</p>
            </div>
        );
    }

    // Determine if we should show options
    const hasOptions = currentQuestion.options &&
        Array.isArray(currentQuestion.options) &&
        currentQuestion.options.length > 0;

    // Normalize difficulty for display - handle null case
    let normalizedDifficulty = 'unknown';
    if (currentQuestion.difficulty) {
        normalizedDifficulty = currentQuestion.difficulty.toLowerCase() === 'normal'
            ? 'medium'
            : currentQuestion.difficulty.toLowerCase();
    }

    // Get difficulty class names
    const getDifficultyClassNames = () => {
        if (!currentQuestion.difficulty) return 'bg-gray-100 text-gray-700';

        if (normalizedDifficulty === 'easy') return 'bg-green-100 text-green-700';
        if (normalizedDifficulty === 'medium') return 'bg-yellow-100 text-yellow-700';
        if (normalizedDifficulty === 'hard') return 'bg-red-100 text-red-700';

        return 'bg-gray-100 text-gray-700';
    }

    // Get difficulty display text
    const getDifficultyDisplayText = () => {
        if (!currentQuestion.difficulty) return 'Unknown';
        return normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1);
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Question Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Question {currentIndex + 1} of {questions.length}</h3>
                    <div className="flex space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyClassNames()}`}>
                            {getDifficultyDisplayText()}
                        </span>
                        {currentQuestion.year && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                GATE {currentQuestion.year}
                            </span>
                        )}
                    </div>
                </div>

                {/* Question type and marks */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {currentQuestion.questionType && (
                        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                            {getQuestionTypeText(currentQuestion.questionType)}
                        </span>
                    )}

                    {currentQuestion.marks && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                            {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                        </span>
                    )}

                    {isMultipleSelection() && (
                        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                            Select all that apply
                        </span>
                    )}
                </div>
            </div>

            {/* Question Content */}
            <div className="p-6">
                <div className="mb-6">
                    <div className="text-gray-800 text-lg">
                        {currentQuestion.question ? (
                            <ContentRenderer text={currentQuestion.question} />
                        ) : (
                            <span className="text-gray-500">Question content unavailable</span>
                        )}
                    </div>
                </div>

                {/* Options - Only show if the question has options */}
                {hasOptions && (
                    <div className="space-y-3 mb-6">
                        {currentQuestion.options.map((option, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`p-4 border rounded-lg cursor-pointer transition-all 
                                    ${isOptionSelected(option) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                                    ${showAnswer && currentQuestion.correctAnswer && (
                                        (Array.isArray(currentQuestion.correctAnswer) &&
                                            currentQuestion.correctAnswer.includes(index)) ||
                                        option === currentQuestion.correctAnswer
                                    )
                                        ? 'border-green-500 bg-green-50'
                                        : showAnswer && isOptionSelected(option) && currentQuestion.correctAnswer && (
                                            (Array.isArray(currentQuestion.correctAnswer) &&
                                                !currentQuestion.correctAnswer.includes(index)) ||
                                            option !== currentQuestion.correctAnswer
                                        )
                                            ? 'border-red-500 bg-red-50'
                                            : ''
                                    }
                                `}
                                onClick={() => handleOptionSelect(option)}
                            >
                                <div className="flex items-center">
                                    {isMultipleSelection() ? (
                                        // Checkbox for multiple selection
                                        <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 
                                            ${isOptionSelected(option)
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                            }`}
                                        >
                                            {isOptionSelected(option) && (
                                                <FaCheck className="text-white text-xs" />
                                            )}
                                        </div>
                                    ) : (
                                        // Radio button for single selection
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 
                                            ${userAnswer === option
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                            }`}
                                        >
                                            {userAnswer === option && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="text-gray-700 flex-1">
                                        {option ? <ContentRenderer text={option} /> : 'Option unavailable'}
                                    </div>

                                    {showAnswer && currentQuestion.correctAnswer && (
                                        (Array.isArray(currentQuestion.correctAnswer) &&
                                            currentQuestion.correctAnswer.includes(index)) ||
                                        option === currentQuestion.correctAnswer
                                    ) && (
                                            <FaCheck className="ml-auto text-green-500" />
                                        )}

                                    {showAnswer && isOptionSelected(option) && currentQuestion.correctAnswer && (
                                        (Array.isArray(currentQuestion.correctAnswer) &&
                                            !currentQuestion.correctAnswer.includes(index)) ||
                                        option !== currentQuestion.correctAnswer
                                    ) && (
                                            <FaTimes className="ml-auto text-red-500" />
                                        )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Numerical Answer Input */}
                {isNumericalQuestion() && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your numerical answer:
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={numericalAnswer}
                            onChange={handleNumericalInputChange}
                            placeholder="Enter your answer"
                            disabled={showAnswer}
                        />
                        {showAnswer && (
                            <p className="mt-2 text-sm text-gray-600">
                                Correct answer: {getCorrectAnswerText()}
                            </p>
                        )}
                    </div>
                )}

                {/* Result Message */}
                <AnimatePresence>
                    {showAnswer && (
                        <motion.div
                            className={`p-4 mb-6 rounded-lg ${result === 'correct'
                                ? 'bg-green-50 text-green-700'
                                : result === 'incorrect'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-yellow-50 text-yellow-700'
                                }`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            {result === 'correct' ? (
                                <div className="flex items-center">
                                    <FaCheck className="mr-2" />
                                    <span>Correct! Well done.</span>
                                </div>
                            ) : result === 'incorrect' ? (
                                <div className="flex items-center">
                                    <FaTimes className="mr-2" />
                                    <div>Incorrect. The correct answer is: <ContentRenderer text={getCorrectAnswerText()} /></div>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <FaEye className="mr-2" />
                                    <div>The correct answer is: <ContentRenderer text={getCorrectAnswerText()} /></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-3">
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${currentIndex > 0
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            <FaChevronLeft className="inline mr-1" /> Previous
                        </button>

                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${currentIndex < questions.length - 1
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            onClick={handleNext}
                            disabled={currentIndex === questions.length - 1}
                        >
                            Next <FaChevronRight className="inline ml-1" />
                        </button>
                    </div>

                    <div className="flex space-x-3 mt-3 sm:mt-0">
                        {!showAnswer ? (
                            <>
                                <button
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                                    onClick={handleShowAnswer}
                                >
                                    <FaEye className="inline mr-1" /> Show Answer
                                </button>
                                <button
                                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                                    onClick={handleSkip}
                                >
                                    Skip
                                </button>
                            </>
                        ) : (
                            <button
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                                onClick={handleNext}
                                disabled={currentIndex === questions.length - 1}
                            >
                                <FaRedo className="inline mr-1" /> Next Question
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Question ID Badge and Tags */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 mb-2 sm:mb-0">
                        <span className="mr-4">ID: {currentQuestion.id || 'Unknown'}</span>
                        <span>Subject: {subject.toUpperCase()}</span>
                    </div>

                    {/* Tags display */}
                    {currentQuestion.tags && Array.isArray(currentQuestion.tags) && currentQuestion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-500 flex items-center">
                                <FaTag className="mr-1" /> Tags:
                            </span>
                            {currentQuestion.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Global styles for code highlighting and images */}
            <style jsx global>{`
                .content-renderer pre {
                    margin: 1rem 0;
                    border-radius: 0.5rem;
                    overflow: auto;
                }
                
                .content-renderer code {
                    background-color: #f1f1f1;
                    padding: 0.15rem 0.35rem;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }
                
                .content-renderer .pseudocode-table {
                    font-family: 'Courier New', monospace;
                    white-space: pre;
                    overflow-x: auto;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 0.5rem;
                }
                
                .content-renderer img {
                    display: block;
                    max-width: 100%;
                    margin: 1rem auto;
                }
                
                .content-renderer br {
                    display: block;
                    margin: 0.5rem 0;
                    content: "";
                }
                
                .content-renderer table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                }
                
                .content-renderer th, .content-renderer td {
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem;
                }
                
                .content-renderer th {
                    background-color: #f7fafc;
                }
            `}</style>
        </motion.div>
    );
}

export default QuestionCard;