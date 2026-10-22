import { Button } from '@/shared/components/ui/button';
import { StepFooter } from '../components/StepFooter';

export type OnboardingSummary = {
    username: string;
    fullName: string;
    email: string;
    college: string;
    about: string;
    socialsCount: number;
    branchName: string;
    examNames: string[];
    targetYear: number;
};

type StepFinishProps = {
    summary: OnboardingSummary;
    onComplete: () => void;
    onRetry: () => void;
    isSubmitting: boolean;
    error: string | null;
    duplicateUsername: boolean;
};

export function StepFinish({
    summary,
    onComplete,
    onRetry,
    isSubmitting,
    error,
    duplicateUsername,
}: StepFinishProps) {
    const rows: Array<{ label: string; value: string }> = [
        { label: 'Username', value: `@${summary.username}` },
        { label: 'Full Name', value: summary.fullName },
    ];

    if (summary.college) {
        rows.push({ label: 'College', value: summary.college });
    }

    rows.push({ label: 'Branch', value: summary.branchName });
    rows.push({ label: 'Exams', value: summary.examNames.join(', ') });
    rows.push({ label: 'Target Year', value: String(summary.targetYear) });

    if (summary.socialsCount > 0) {
        rows.push({
            label: 'Social Links',
            value: `${summary.socialsCount} connected`,
        });
    }

    const showRetry = !!error && !duplicateUsername;

    return (
        <>
            <div className="space-y-1 border border-slate-200 bg-white/40 dark:border-zinc-800 dark:bg-white/[0.03]">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-zinc-800"
                    >
                        <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            {row.label}
                        </span>
                        <span className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                </div>
            )}

            {showRetry ? (
                <div className="pt-8">
                    <Button
                        onClick={onRetry}
                        disabled={isSubmitting}
                        className="w-full rounded-none bg-[#2A5CFF] hover:bg-[#2A5CFF]/90"
                    >
                        {isSubmitting ? 'Retrying…' : 'Retry'}
                    </Button>
                </div>
            ) : duplicateUsername ? (
                <div className="pt-8">
                    <Button
                        onClick={onComplete}
                        disabled={isSubmitting}
                        variant="outline"
                        className="w-full rounded-none"
                    >
                        Try a different username
                    </Button>
                </div>
            ) : (
                <StepFooter
                    onNext={onComplete}
                    nextLabel="Get Started"
                    isNextDisabled={isSubmitting}
                    isNextLoading={isSubmitting}
                />
            )}
        </>
    );
}
