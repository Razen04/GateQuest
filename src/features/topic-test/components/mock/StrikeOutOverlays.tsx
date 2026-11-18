import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';

export function StrikeOutOverlay({
    testId,
    maxStrikes,
}: {
    testId: string;
    maxStrikes: number;
}) {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-50 bg-destructive/95 text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold mb-3">Attempt disqualified</h1>
            <p className="max-w-md mb-6">
                You exited fullscreen {maxStrikes} times. Your attempt has been
                submitted.
            </p>
            <Button
                variant="secondary"
                onClick={() => navigate(`/mock-tests/result/${testId}`)}
            >
                Go to Result
            </Button>
        </div>
    );
}

export function PreStartStrikeOut({
    pickerPath,
    maxStrikes,
}: {
    pickerPath: string;
    maxStrikes: number;
}) {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 z-50 bg-destructive/95 text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold mb-3">Attempt cancelled</h1>
            <p className="max-w-md mb-6">
                You exited fullscreen {maxStrikes} times before starting. No
                attempt was recorded.
            </p>
            <Button variant="secondary" onClick={() => navigate(pickerPath)}>
                Back to Mock Tests
            </Button>
        </div>
    );
}
