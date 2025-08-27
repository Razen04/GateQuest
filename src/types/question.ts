export type NumericalQuestion = {
    id: string;
    year: number;
    questionNumber: number;
    subject: string;
    topic?: string;
    questionType: 'Numerical Answer';
    question: string;
    options?: never;
    correctAnswer: number;
    answerText?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    sourceURL: string;
    addedBy?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
};

export type MCQQuestion = {
    id: string;
    year: number;
    questionNumber: number;
    subject: string;
    topic?: string;
    questionType: 'Multiple Choice Question';
    question: string;
    options: string[];
    correctAnswer: number[]; // single index
    answerText?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    sourceURL: string;
    addedBy?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
};

export type MSQQuestion = {
    id: string;
    year: number;
    questionNumber: number;
    subject: string;
    topic?: string;
    questionType: 'Multiple Select Question';
    question: string;
    options: string[];
    correctAnswer: number[]; // multiple indices
    answerText?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    sourceURL: string;
    addedBy?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
};

export type Question = NumericalQuestion | MCQQuestion | MSQQuestion;
