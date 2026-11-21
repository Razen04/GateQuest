import type { Attempt, Question } from '@/shared/types/storage';

export interface FullAttempt extends Attempt {
    questions?: Question;
    originalIndex: number;
}
