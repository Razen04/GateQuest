import type { Attempt, Question } from '@/shared/types/storage';

export interface FullAttempt extends Attempt {
    questions?: Question;
    originalIndex: number;
    /** Section-local number shown to the student (GA 1–10, TECH 1–N). */
    displayNumber: number;
    displayTotal: number;
}
