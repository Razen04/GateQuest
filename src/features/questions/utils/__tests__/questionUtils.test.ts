import { describe, expect, it } from 'vitest';
import type { Question } from '@/shared/types/storage';
import { getQuestionSourceLabel, isMockQuestion } from '../questionUtils';

const makeQuestion = (overrides: Partial<Question> = {}): Question =>
    ({
        year: 2026,
        metadata: {
            exam: 'gate',
            set: 'CS',
            paperType: 'mock',
            language: 'English',
        },
        ...overrides,
    }) as Question;

describe('isMockQuestion', () => {
    it('detects the mock paper type case-insensitively', () => {
        expect(isMockQuestion(makeQuestion())).toBe(true);
        expect(
            isMockQuestion(
                makeQuestion({
                    metadata: {
                        exam: 'gate',
                        set: 'CS',
                        paperType: 'Mock',
                        language: 'English',
                    },
                })
            )
        ).toBe(true);
    });

    it('rejects official papers', () => {
        expect(
            isMockQuestion(
                makeQuestion({
                    metadata: {
                        exam: 'gate',
                        set: '1',
                        paperType: 'Original',
                        language: 'English',
                    },
                })
            )
        ).toBe(false);
    });
});

describe('getQuestionSourceLabel', () => {
    it('labels mock questions as EXAM BRANCH MOCK YEAR', () => {
        expect(getQuestionSourceLabel(makeQuestion())).toBe(
            'GATE CS MOCK 2026'
        );
    });

    it('leaves official PYQs as EXAM SET YEAR', () => {
        expect(
            getQuestionSourceLabel(
                makeQuestion({
                    metadata: {
                        exam: 'gate',
                        set: '2',
                        paperType: 'Original',
                        language: 'English',
                    },
                })
            )
        ).toBe('GATE 2 2026');
    });

    it('joins multi-exam metadata', () => {
        expect(
            getQuestionSourceLabel(
                makeQuestion({
                    year: 2025,
                    metadata: {
                        exam: ['gate', 'da'],
                        set: 'CS',
                        paperType: 'mock',
                        language: 'English',
                    },
                })
            )
        ).toBe('GATE / DA CS MOCK 2025');
    });

    it('omits an empty branch', () => {
        expect(
            getQuestionSourceLabel(
                makeQuestion({
                    metadata: {
                        exam: 'gate',
                        set: '',
                        paperType: 'mock',
                        language: 'English',
                    },
                })
            )
        ).toBe('GATE MOCK 2026');
    });

    it('falls back when the year is missing', () => {
        expect(
            getQuestionSourceLabel(
                makeQuestion({ year: undefined as unknown as number })
            )
        ).toBe('Year Unknown');
    });
});
