type ExactAnswer = {
    type: 'exact';
    value: number;
};

type MultipleExactAnswers = {
    type: 'multiple';
    values: number[];
};

type RangeAnswer = {
    type: 'range';
    min: number;
    max: number;
    inclusive?: boolean;
};

type ToleranceAnswer = {
    type: 'tolerance';
    value: number;
    tolerance: number;
};

export type NumericalAnswerSpec =
    | ExactAnswer
    | MultipleExactAnswers
    | RangeAnswer
    | ToleranceAnswer;

interface BaseQuestion {
    id: string;
    year: number;
    question_number: number;
    subject: string;
    subject_id: string;
    topic?: string;
    question: string;
    difficulty: string;
    marks: number;
    tags?: string[];
    source?: string;
    source_url: string;
    added_by?: string;
    verified: boolean;
    answer_text: string;
    explanation: string;
    metadata: {
        set: string;
        exam: string; // To identify which exam this particular question belongs too.
        paperType: string;
        language: string;
    };
    created_at: string;
    updated_at: string;
}

export interface NumericalQuestion extends BaseQuestion {
    question_type: 'Numerical Answer';
    correct_answer: NumericalAnswerSpec;
    options?: never;
}

export interface MCQQuestion extends BaseQuestion {
    question_type: 'Multiple Choice Question';
    options: string[];
    correct_answer: number[];
}

export interface MSQQuestion extends BaseQuestion {
    question_type: 'Multiple Select Question';
    options: string[];
    correct_answer: number[];
}

export type Question = NumericalQuestion | MCQQuestion | MSQQuestion;

export type RevisionQuestion = Question & {
    is_correct?: boolean | null;
    time_spent_seconds?: boolean | null;
};

export interface QuestionSyncMetadata {
    subject_id: string;
    last_fetched_at?: string;
    last_sync: string;
}

export interface TestSession {
    id: string;
    user_id: string;
    topics: string[];
    created_at: string;
    updated_at: string;
    completed_at?: string;
    status: string;
    branch_id: string;
    remaining_time_seconds: number;
    total_questions: number;
    score?: number;
    total_marks: number;
    accuracy?: number;
    correct_count: number;
    attempted_count: number;
    is_synced: number;
}

export interface Attempt {
    session_id: string;
    question_id: string;
    attempt_order: number;
    user_answer: number | number[] | null;
    questions: Question;
    marked_for_review: boolean;
    status: string;
    is_correct: boolean;
    score: number;
    time_spent_seconds: number;
    is_synced: number;
}
