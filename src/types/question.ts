export type NumericalQuestion = {
    id: string;
    year: number;
    question_number: number;
    subject: string;
    topic?: string;
    question_type: 'Numerical Answer';
    question: string;
    options?: never;
    correct_answer: number;
    answer_text?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    source_url: string;
    added_by?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
    created_at: string;
    updated_at: string;
};

export type MCQQuestion = {
    id: string;
    year: number;
    question_number: number;
    subject: string;
    topic?: string;
    question_type: 'Multiple Choice Question';
    question: string;
    options?: string[];
    correct_answer: number[];
    answer_text?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    source_url: string;
    added_by?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
    created_at: string;
    updated_at: string;
};

export type MSQQuestion = {
    id: string;
    year: number;
    question_number: number;
    subject: string;
    topic?: string;
    question_type: 'Multiple Select Question';
    question: string;
    options?: string[];
    correct_answer: number[];
    answer_text?: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    source_url: string;
    added_by?: string;
    verified: boolean;
    explanation: string;
    metadata: {
        set: string;
        paperType: string;
        language: string;
    };
    created_at: string;
    updated_at: string;
};

export type Question = NumericalQuestion | MCQQuestion | MSQQuestion;

export type RevisionQuestion = Question & {
    // Extra fields specific to revision
    is_correct?: boolean | null; // from backend
    time_spent_seconds?: number | null; // from backend
};
