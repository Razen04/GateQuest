import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Subject } from '@/shared/types/Goal';
import {
    selectIsSubjectInGoal,
    selectOptionalSubjects,
    selectPracticeSubjects,
    useGoalStore,
} from '../useGoalStore';

const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        auth: {
            getSession: vi.fn(),
            getUser: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: mockSupabase,
}));

const subject = (over: Partial<Subject>): Subject => ({
    id: 's1',
    slug: 's1',
    name: 's1',
    category: null,
    difficulty: null,
    icon_name: null,
    question_count: null,
    theme_color: null,
    is_universal: false,
    ...over,
});

// We cast through `any` because the real type includes actions we don't need.
const makeState = (over: Partial<any> = {}): any => ({
    subjects: [],
    branchSubjects: [],
    examSubjects: [],
    userGoal: null,
    ...over,
});

describe('selectOptionalSubjects', () => {
    it('returns XL subjects minus the two mandatory ones', () => {
        const state = makeState({
            subjects: [
                subject({ id: 'apt', slug: 'general-aptitude' }),
                subject({ id: 'chm', slug: 'chemistry' }),
                subject({ id: 'bio', slug: 'biochemistry' }),
                subject({ id: 'bot', slug: 'botany' }),
                subject({ id: 'algo', slug: 'algorithms' }), // not in XL
            ],
            branchSubjects: [
                { branch_id: 'xl', subject_id: 'apt' },
                { branch_id: 'xl', subject_id: 'chm' },
                { branch_id: 'xl', subject_id: 'bio' },
                { branch_id: 'xl', subject_id: 'bot' },
                { branch_id: 'cs', subject_id: 'algo' },
            ],
        });
        expect(selectOptionalSubjects(state).map((s) => s.id)).toEqual([
            'bio',
            'bot',
        ]);
    });

    it('returns empty when there are no XL subjects', () => {
        expect(selectOptionalSubjects(makeState())).toEqual([]);
    });
});

describe('selectPracticeSubjects', () => {
    it('returns [] when there is no user goal', () => {
        expect(selectPracticeSubjects(makeState())).toEqual([]);
    });

    it('GATE XL: returns aptitude + chemistry + selected optionals only', () => {
        const state = makeState({
            subjects: [
                subject({ id: 'apt', slug: 'aptitude' }),
                subject({ id: 'chm', slug: 'chemistry' }),
                subject({ id: 'bio', slug: 'biochemistry' }),
                subject({ id: 'bot', slug: 'botany' }),
                subject({ id: 'zoo', slug: 'zoology' }),
            ],
            userGoal: {
                branch_id: 'xl',
                target_exams: ['gate'],
                additional_subjects: ['bio', 'bot'],
            },
        });
        expect(selectPracticeSubjects(state).map((s) => s.id)).toEqual([
            'apt',
            'chm',
            'bio',
            'bot',
        ]);
    });

    it('normal path: intersects branch/exam with universal override', () => {
        const state = makeState({
            subjects: [
                subject({ id: 'univ', is_universal: true }),
                subject({ id: 'cs-ds' }), // in branch and exam
                subject({ id: 'cs-only' }), // in branch, not exam
                subject({ id: 'exam-only' }), // in exam, not branch
            ],
            branchSubjects: [
                { branch_id: 'cs', subject_id: 'cs-ds' },
                { branch_id: 'cs', subject_id: 'cs-only' },
            ],
            examSubjects: [
                { exams_id: 'gate', subject_id: 'cs-ds' },
                { exams_id: 'gate', subject_id: 'exam-only' },
                { exams_id: 'gate', subject_id: 'univ' },
            ],
            userGoal: {
                branch_id: 'cs',
                target_exams: ['gate'],
                additional_subjects: null,
            },
        });
        expect(
            selectPracticeSubjects(state)
                .map((s) => s.id)
                .sort()
        ).toEqual(['cs-ds', 'univ']);
    });
});

describe('selectIsSubjectInGoal', () => {
    it('is false when no goal', () => {
        expect(selectIsSubjectInGoal(makeState())('x')).toBe(false);
    });

    it('is true for universal subjects regardless of branch', () => {
        const state = makeState({
            subjects: [subject({ id: 'x', is_universal: true })],
            userGoal: {
                branch_id: 'cs',
                target_exams: ['gate'],
                additional_subjects: null,
            },
        });
        expect(selectIsSubjectInGoal(state)('x')).toBe(true);
    });

    it('is false for a branch subject not in the user branch', () => {
        const state = makeState({
            subjects: [subject({ id: 'x' })],
            branchSubjects: [{ branch_id: 'me', subject_id: 'x' }],
            userGoal: {
                branch_id: 'cs',
                target_exams: ['gate'],
                additional_subjects: null,
            },
        });
        expect(selectIsSubjectInGoal(state)('x')).toBe(false);
    });
});

describe('setInitialGoal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useGoalStore.setState({ userGoal: null, loading: false }); // reset
    });

    it('does nothing when not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
        await useGoalStore.getState().setInitialGoal('cs', ['gate']);
        expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('deactivates prior goals and upserts the new one', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'u1' } },
        });

        const updateChain = { eq: vi.fn().mockResolvedValue({ error: null }) };
        mockSupabase.from.mockReturnValueOnce({ update: () => updateChain });

        const newGoal = {
            id: 'g1',
            user_id: 'u1',
            branch_id: 'cs',
            is_active: true,
        };
        const upsertChain = {
            upsert: vi.fn().mockReturnValue({
                select: () => ({
                    single: () =>
                        Promise.resolve({ data: newGoal, error: null }),
                }),
            }),
        };
        mockSupabase.from.mockReturnValueOnce(upsertChain);

        await useGoalStore.getState().setInitialGoal('cs', ['gate']);

        expect(mockSupabase.from).toHaveBeenCalledWith('user_goals');
        expect(useGoalStore.getState().userGoal).toEqual(newGoal);
    });
});
