import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBranch, makeBranchExam, makeExam } from '../../__tests__/helper';
import { StepGoal } from '../StepGoal';

const mockOnNext = vi.fn();
const mockOnBack = vi.fn();

const mockBranches = [
    makeBranch('cs', 'Computer Science'),
    makeBranch('xl', 'Life Sciences'),
];
const mockExams = [
    makeExam('gate', 'GATE', 'GATE'),
    makeExam('isro', 'ISRO', 'ISRO'),
];
const mockBranchExams = [
    makeBranchExam('cs', 'gate'),
    makeBranchExam('cs', 'isro'),
    makeBranchExam('xl', 'gate'),
];

const mockStoreState = {
    branches: mockBranches,
    exams: mockExams,
    branchExams: mockBranchExams,
};

vi.mock('@/app/stores/useGoalStore', () => ({
    useGoalStore: Object.assign(
        (sel: (s: typeof mockStoreState) => unknown) => sel(mockStoreState),
        { getState: () => mockStoreState }
    ),
}));

const renderStep = (
    over: Partial<React.ComponentProps<typeof StepGoal>> = {}
) =>
    render(
        <StepGoal
            defaultValue={{
                branchId: '',
                targetExams: [],
                targetYear: 2027,
            }}
            onNext={mockOnNext}
            onBack={mockOnBack}
            isFirst={false}
            isLast={false}
            {...over}
        />
    );

describe('StepGoal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders branch select, exams select, target year', () => {
            renderStep();
            expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/target exams/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/target year/i)).toBeInTheDocument();
        });

        it('prefills from defaultValue', () => {
            renderStep({
                defaultValue: {
                    branchId: 'cs',
                    targetExams: ['gate'],
                    targetYear: 2028,
                },
            });
            expect(screen.getByLabelText(/branch/i)).toHaveTextContent(
                /computer science/i
            );
            expect(screen.getByLabelText(/target year/i)).toHaveValue('2028');
        });
    });

    describe('branch → exam filtering', () => {
        it('shows only exams valid for selected branch', async () => {
            const user = userEvent.setup();
            renderStep({
                defaultValue: {
                    branchId: '',
                    targetExams: [],
                    targetYear: 2027,
                },
            });

            // Select cs branch
            await user.click(screen.getByLabelText(/branch/i));
            await user.click(
                screen.getByRole('option', { name: /computer science/i })
            );

            // Open exams select
            await user.click(screen.getByLabelText(/target exams/i));
            expect(
                screen.getByRole('option', { name: 'GATE' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'ISRO' })
            ).toBeInTheDocument();
        });

        it('shows only gate for xl branch', async () => {
            const user = userEvent.setup();
            renderStep();
            await user.click(screen.getByLabelText(/branch/i));
            await user.click(
                screen.getByRole('option', { name: /life sciences/i })
            );
            await user.click(screen.getByLabelText(/target exams/i));
            expect(
                screen.getByRole('option', { name: 'GATE' })
            ).toBeInTheDocument();
            expect(screen.queryByRole('option', { name: 'ISRO' })).toBeNull();
        });

        it('clears selected exams when branch changes', async () => {
            const user = userEvent.setup();
            renderStep({
                defaultValue: {
                    branchId: 'cs',
                    targetExams: ['gate', 'isro'],
                    targetYear: 2027,
                },
            });

            // Change to xl — isro should be dropped (not valid for xl)
            await user.click(screen.getByLabelText(/branch/i));
            await user.click(
                screen.getByRole('option', { name: /life sciences/i })
            );

            // Click Next to see what gets passed
            await user.click(screen.getByRole('button', { name: /next/i }));
            expect(mockOnNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    branchId: 'xl',
                    targetExams: expect.not.arrayContaining(['isro']),
                })
            );
        });
    });

    describe('validation gating', () => {
        it('disables Next when branch is empty', () => {
            renderStep({
                defaultValue: {
                    branchId: '',
                    targetExams: ['gate'],
                    targetYear: 2027,
                },
            });
            expect(
                screen.getByRole('button', { name: /next/i })
            ).toBeDisabled();
        });

        it('disables Next when no exams selected', () => {
            renderStep({
                defaultValue: {
                    branchId: 'cs',
                    targetExams: [],
                    targetYear: 2027,
                },
            });
            expect(
                screen.getByRole('button', { name: /next/i })
            ).toBeDisabled();
        });

        it('enables Next when branch and exams are set', () => {
            renderStep({
                defaultValue: {
                    branchId: 'cs',
                    targetExams: ['gate'],
                    targetYear: 2027,
                },
            });
            expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
        });
    });

    describe('onNext payload', () => {
        it('calls onNext with branch, exams, targetYear', async () => {
            const user = userEvent.setup();
            renderStep({
                defaultValue: {
                    branchId: 'cs',
                    targetExams: ['gate'],
                    targetYear: 2028,
                },
            });
            await user.click(screen.getByRole('button', { name: /next/i }));
            expect(mockOnNext).toHaveBeenCalledWith({
                branchId: 'cs',
                targetExams: ['gate'],
                targetYear: 2028,
            });
        });
    });

    describe('target year default', () => {
        it('defaults to 2027 when no value provided', () => {
            renderStep({
                defaultValue: {
                    branchId: '',
                    targetExams: [],
                    targetYear: null as unknown as number,
                },
            });
            expect(screen.getByLabelText(/target year/i)).toHaveValue('2027');
        });
    });
});
