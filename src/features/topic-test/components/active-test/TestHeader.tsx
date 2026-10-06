import {
    ArrowLeftIcon,
    ArrowsInSimpleIcon,
    ArrowsOutSimpleIcon,
    ClockIcon,
} from '@phosphor-icons/react';
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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { useFullscreen } from '@/shared/hooks/useFullScreen';

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

const TestHeader: React.FC<TestHeaderProps> = ({
    timeDisplay,
    questionStatus,
    onEndTest,
}) => {
    const critical = isTimeCritical(timeDisplay);
    const navigate = useNavigate();
    const onBack = () => {
        navigate('/topic-test');
    };

    const { isFullscreen, toggleFullscreen } = useFullscreen();

    return (
        <header className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 px-4 py-2">
                {/* Left Section: Back Action & Test Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 px-2.5 shrink-0"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Back</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will pause the test, but this is not
                                    advisable and you should complete the test
                                    in one sitting.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-none">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-none"
                                    onClick={onBack}
                                >
                                    Leave Test
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="min-w-0 flex items-center gap-2">
                        <h1 className="hidden md:block truncate text-xs font-semibold sm:text-sm">
                            Custom Test
                        </h1>
                        <span className="text-slate-400 dark:text-zinc-600 text-xs hidden md:block">
                            •
                        </span>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            {questionStatus}
                        </p>
                    </div>
                </div>

                {/* Center Section: Timer */}
                <div className="flex justify-center shrink-0">
                    <div
                        className={`px-3 py-1 text-sm sm:text-base flex items-center gap-1.5 font-mono font-bold tabular-nums rounded-none transition ${
                            critical
                                ? 'animate-pulse bg-red-950 text-red-400'
                                : 'bg-slate-100 dark:bg-zinc-900 dark:text-zinc-100 text-slate-800'
                        }`}
                        aria-live="polite"
                    >
                        <ClockIcon className="w-4 h-4" />
                        {timeDisplay}
                    </div>
                </div>

                {/* Right Section: Finish Action */}
                <div className="flex items-center  gap-2 justify-end flex-1">
                    {/* Fullscreen Button (Desktop Only) */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="hidden lg:flex items-center gap-1.5 rounded-none h-8 px-2.5"
                        title={
                            isFullscreen
                                ? 'Exit Fullscreen'
                                : 'Enter Fullscreen'
                        }
                    >
                        {isFullscreen ? (
                            <>
                                <ArrowsInSimpleIcon size={16} />
                                <span className="text-sm">Exit Fullscreen</span>
                            </>
                        ) : (
                            <>
                                <ArrowsOutSimpleIcon size={16} />
                                <span className="text-sm">Fullscreen</span>
                            </>
                        )}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-none h-8 px-3"
                            >
                                Finish
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-none">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className="rounded-none bg-red-600 hover:bg-red-700"
                                    onClick={onEndTest}
                                >
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
