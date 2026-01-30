import { ArrowLeftIcon } from '@phosphor-icons/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface TestHeaderProps {
    timeDisplay: string; // 00:00
    questionStatus: string;
    onEndTest: () => void;
}

const isTimeCritical = (timeDisplay: string) => {
    const [minutes, seconds] = timeDisplay.split(':').map(Number);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return false;
    return minutes ? minutes < 5 : false;
};

const TestHeader: React.FC<TestHeaderProps> = ({ timeDisplay, questionStatus, onEndTest }) => {
    const critical = isTimeCritical(timeDisplay);
    const navigate = useNavigate();
    const onBack = () => {
        navigate('/topic-test');
    };
    return (
        <header className="sticky top-0 z-10 border-b shadow-sm bg-white dark:bg-zinc-900">
            <div className="flex flex-col gap-3 px-6 py-3">
                <div className="flex items-center">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">
                                <ArrowLeftIcon />
                                <span>Back</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will pause the test, but this is not advisable and you
                                    should complete the test in one sitting.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onBack}>Leave Test</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="truncate text-sm font-semibold sm:text-base">Custom Test</h1>
                        <p className="text-xs">{questionStatus}</p>
                    </div>

                    <div
                        className={`px-4 py-1 text-xl font-mono font-bold tabular-nums transition
                ${
                    critical ? 'animate-pulse bg-red-950 text-red-400' : 'bg-gray-900 text-gray-100'
                }`}
                        aria-live="polite"
                    >
                        {timeDisplay}
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="bg-red-500">Finish</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onEndTest}>
                                    Finish Test
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </header>
    );
};

export default TestHeader;
