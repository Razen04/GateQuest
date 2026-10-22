import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StepProfile } from '../StepProfile';

const mockOnNext = vi.fn();
const mockOnBack = vi.fn();

const renderStep = (
    over: Partial<React.ComponentProps<typeof StepProfile>> = {}
) =>
    render(
        <StepProfile
            defaultValue={{
                username: '',
                fullName: '',
                email: 'user@example.com',
                college: '',
                about: '',
                socials: {},
            }}
            onNext={mockOnNext}
            onBack={mockOnBack}
            isFirst={false}
            isLast={false}
            {...over}
        />
    );

describe('StepProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders all required fields', () => {
            renderStep();
            expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/about/i)).toBeInTheDocument();
        });

        it('renders email as readonly', () => {
            renderStep();
            const email = screen.getByLabelText(/email/i);
            expect(email).toHaveAttribute('readonly');
        });

        it('prefills from defaultValue', () => {
            renderStep({
                defaultValue: {
                    username: 'razen',
                    fullName: 'Razen',
                    email: 'r@example.com',
                    college: 'IIT',
                    about: 'Hi',
                    socials: { github: 'https://github.com/razen' },
                },
            });
            expect(screen.getByLabelText(/username/i)).toHaveValue('razen');
            expect(screen.getByLabelText(/full name/i)).toHaveValue('Razen');
            expect(screen.getByLabelText(/college/i)).toHaveValue('IIT');
            expect(screen.getByLabelText(/about/i)).toHaveValue('Hi');
        });
    });

    describe('validation gating', () => {
        it('disables Next when username is empty', () => {
            renderStep({
                defaultValue: {
                    username: '',
                    fullName: 'X',
                    email: 'x@x.com',
                    college: '',
                    about: 'bio',
                    socials: {},
                },
            });
            expect(
                screen.getByRole('button', { name: /next/i })
            ).toBeDisabled();
        });

        it('disables Next when full name is empty', () => {
            renderStep({
                defaultValue: {
                    username: 'user',
                    fullName: '',
                    email: 'x@x.com',
                    college: '',
                    about: 'bio',
                    socials: {},
                },
            });
            expect(
                screen.getByRole('button', { name: /next/i })
            ).toBeDisabled();
        });

        it('disables Next when about is empty', () => {
            renderStep({
                defaultValue: {
                    username: 'user',
                    fullName: 'X',
                    email: 'x@x.com',
                    college: '',
                    about: '',
                    socials: {},
                },
            });
            expect(
                screen.getByRole('button', { name: /next/i })
            ).toBeDisabled();
        });

        it('enables Next when required fields are filled', () => {
            renderStep({
                defaultValue: {
                    username: 'user',
                    fullName: 'X',
                    email: 'x@x.com',
                    college: '',
                    about: 'bio',
                    socials: {},
                },
            });
            expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
        });
    });

    describe('user interaction', () => {
        it('calls onNext with all field values when Next clicked', async () => {
            const user = userEvent.setup();
            renderStep({
                defaultValue: {
                    username: 'user',
                    fullName: 'X',
                    email: 'x@x.com',
                    college: '',
                    about: 'bio',
                    socials: {},
                },
            });
            await user.click(screen.getByRole('button', { name: /next/i }));
            expect(mockOnNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'user',
                    fullName: 'X',
                    about: 'bio',
                })
            );
        });

        it('calls onBack when Back clicked', async () => {
            const user = userEvent.setup();
            renderStep();
            await user.click(screen.getByRole('button', { name: /back/i }));
            expect(mockOnBack).toHaveBeenCalled();
        });

        it('shows validation error after blur on invalid username', async () => {
            const user = userEvent.setup();
            renderStep();
            const username = screen.getByLabelText(/username/i);
            await user.type(username, 'ab');
            await user.tab();
            expect(
                screen.getByText(/at least 3 characters/i)
            ).toBeInTheDocument();
        });

        it('hides Back button on first step', () => {
            renderStep({ isFirst: true });
            expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
        });
    });

    describe('socials section', () => {
        it('shows only 2 platforms by default', () => {
            renderStep();
            expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
            expect(
                screen.getByLabelText(/x \(formerly twitter\)/i)
            ).toBeInTheDocument();
            expect(screen.queryByLabelText(/spotify/i)).toBeNull();
        });

        it('expands to show all platforms when clicked', async () => {
            const user = userEvent.setup();
            renderStep();
            await user.click(
                screen.getByRole('button', { name: /show more/i })
            );
            expect(screen.getByLabelText(/spotify/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/leetcode/i)).toBeInTheDocument();
        });

        it('allows skipping socials (Next enabled with all empty)', () => {
            renderStep({
                defaultValue: {
                    username: 'user',
                    fullName: 'X',
                    email: 'x@x.com',
                    college: '',
                    about: 'bio',
                    socials: {},
                },
            });
            expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
        });
    });
});
