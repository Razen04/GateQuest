import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StepFinish } from '../StepFinish';

const mockOnComplete = vi.fn();
const mockOnRetry = vi.fn();

const renderStep = (
    over: Partial<React.ComponentProps<typeof StepFinish>> = {}
) =>
    render(
        <StepFinish
            summary={{
                username: 'razen',
                fullName: 'Razen',
                email: 'r@example.com',
                college: 'IIT',
                about: 'GATE aspirant',
                socialsCount: 2,
                branchName: 'Computer Science',
                examNames: ['GATE', 'ISRO'],
                targetYear: 2027,
            }}
            onComplete={mockOnComplete}
            onRetry={mockOnRetry}
            isSubmitting={false}
            error={null}
            duplicateUsername={false}
            {...over}
        />
    );

describe('StepFinish', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('summary rendering', () => {
        it('shows username', () => {
            renderStep();
            expect(screen.getByText('@razen')).toBeInTheDocument();
        });

        it('shows branch name', () => {
            renderStep();
            expect(screen.getByText('Computer Science')).toBeInTheDocument();
        });

        it('shows target exams as list', () => {
            renderStep();
            expect(
                screen.getByText(/GATE, ISRO|GATE.*ISRO/)
            ).toBeInTheDocument();
        });

        it('shows target year', () => {
            renderStep();
            expect(screen.getByText('2027')).toBeInTheDocument();
        });

        it('shows college when present', () => {
            renderStep();
            expect(screen.getByText('IIT')).toBeInTheDocument();
        });

        it('shows socials count', () => {
            renderStep();
            expect(screen.getByText(/2 connected/i)).toBeInTheDocument();
        });

        it('hides college row when empty', () => {
            renderStep({
                summary: {
                    username: 'razen',
                    fullName: 'Razen',
                    email: 'r@example.com',
                    college: '',
                    about: 'GATE aspirant',
                    socialsCount: 0,
                    branchName: 'CS',
                    examNames: ['GATE'],
                    targetYear: 2027,
                },
            });
            expect(screen.queryByText(/college/i)).toBeNull();
        });
    });

    describe('completion', () => {
        it('calls onComplete when Get Started clicked', async () => {
            const user = userEvent.setup();
            renderStep();
            await user.click(
                screen.getByRole('button', { name: /get started/i })
            );
            expect(mockOnComplete).toHaveBeenCalled();
        });

        it('disables button during submission', () => {
            renderStep({ isSubmitting: true });
            expect(
                screen.getByRole('button', {
                    name: /saving/i,
                })
            ).toBeDisabled();
        });
    });

    describe('error handling', () => {
        it('shows generic error message when error is present', () => {
            renderStep({ error: 'Could not save. Try again.' });
            expect(screen.getByText(/could not save/i)).toBeInTheDocument();
        });

        it('shows specific error for duplicate username', () => {
            renderStep({
                error: 'Username was taken.',
                duplicateUsername: true,
            });
            expect(screen.getByText(/username was taken/i)).toBeInTheDocument();
        });

        it('shows Retry button on profile-only failure', () => {
            renderStep({ error: 'Could not save.', duplicateUsername: false });
            expect(
                screen.getByRole('button', { name: /retry/i })
            ).toBeInTheDocument();
        });

        it('calls onRetry when Retry clicked', async () => {
            const user = userEvent.setup();
            renderStep({ error: 'Could not save.' });
            await user.click(screen.getByRole('button', { name: /retry/i }));
            expect(mockOnRetry).toHaveBeenCalled();
        });
    });
});
