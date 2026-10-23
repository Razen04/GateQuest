import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSubject } from '../../__tests__/helper';
import { StepXL } from '../StepXL';

const mockOnNext = vi.fn();
const mockOnBack = vi.fn();

const mockSubjects = [
    makeSubject('s1', 'biochemistry', 'Biochemistry'),
    makeSubject('s2', 'botany', 'Botany'),
    makeSubject('s3', 'microbiology', 'Microbiology'),
    makeSubject('s4', 'zoology', 'Zoology'),
    makeSubject('s5', 'food-tech', 'Food Technology'),
];

vi.mock('@/shared/hooks/useGoal', () => ({
    default: () => ({ optionalSubjects: mockSubjects }),
}));

const renderStep = (over: Partial<React.ComponentProps<typeof StepXL>> = {}) =>
    render(
        <StepXL
            defaultValue={{ xlOptionals: [] }}
            onNext={mockOnNext}
            onBack={mockOnBack}
            isFirst={false}
            isLast={false}
            {...over}
        />
    );

describe('StepXL', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all optional subjects', () => {
        renderStep();
        expect(screen.getByText('Biochemistry')).toBeInTheDocument();
        expect(screen.getByText('Botany')).toBeInTheDocument();
        expect(screen.getByText('Microbiology')).toBeInTheDocument();
        expect(screen.getByText('Zoology')).toBeInTheDocument();
        expect(screen.getByText('Food Technology')).toBeInTheDocument();
    });

    it('prefills selected subjects', () => {
        renderStep({ defaultValue: { xlOptionals: ['s1', 's2'] } });
        const biochem = screen.getByRole('checkbox', { name: /biochemistry/i });
        expect(biochem).toBeChecked();
    });

    it('disables Next when fewer than 2 selected', async () => {
        const user = userEvent.setup();
        renderStep();
        await user.click(
            screen.getByRole('checkbox', { name: /biochemistry/i })
        );
        expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('enables Next when exactly 2 selected', async () => {
        const user = userEvent.setup();
        renderStep();
        await user.click(
            screen.getByRole('checkbox', { name: /biochemistry/i })
        );
        await user.click(screen.getByRole('checkbox', { name: /botany/i }));
        expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });

    it('prevents selecting more than 2', async () => {
        const user = userEvent.setup();
        renderStep();
        await user.click(
            screen.getByRole('checkbox', { name: /biochemistry/i })
        );
        await user.click(screen.getByRole('checkbox', { name: /botany/i }));
        await user.click(
            screen.getByRole('checkbox', { name: /microbiology/i })
        );

        const micro = screen.getByRole('checkbox', { name: /microbiology/i });
        expect(micro).not.toBeChecked();
        expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });

    it('allows deselecting a subject', async () => {
        const user = userEvent.setup();
        renderStep({ defaultValue: { xlOptionals: ['s1', 's2'] } });
        await user.click(
            screen.getByRole('checkbox', { name: /biochemistry/i })
        );
        const biochem = screen.getByRole('checkbox', { name: /biochemistry/i });
        expect(biochem).not.toBeChecked();
    });

    it('calls onNext with selected subject ids', async () => {
        const user = userEvent.setup();
        renderStep();
        await user.click(
            screen.getByRole('checkbox', { name: /biochemistry/i })
        );
        await user.click(screen.getByRole('checkbox', { name: /zoology/i }));
        await user.click(screen.getByRole('button', { name: /next/i }));
        expect(mockOnNext).toHaveBeenCalledWith({
            xlOptionals: ['s1', 's4'],
        });
    });
});
