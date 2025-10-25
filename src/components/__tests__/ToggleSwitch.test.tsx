import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToggleSwitch from '../ToggleSwitch.tsx';

test('renders with given label and initial state', () => {
    render(<ToggleSwitch label="Dark Mode" isOn={false} onToggle={() => {}} />);

    // Checking if label appears
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();

    // Checking if the button has aria-checked label as false
    const toggleButton = screen.getByRole('switch');
    expect(toggleButton).toHaveAttribute('aria-checked', 'false');
});

test('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();

    render(<ToggleSwitch label="Dark Mode" isOn={false} onToggle={handleToggle} />);

    const toggleButton = screen.getByRole('switch');

    // Simulating a click
    await user.click(toggleButton);

    // Verifying if the callback was called once
    expect(handleToggle).toHaveBeenCalledTimes(1);
});
