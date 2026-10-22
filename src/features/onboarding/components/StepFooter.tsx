import { Button } from '@/shared/components/ui/button';

type StepFooterProps = {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    isNextDisabled?: boolean;
    isNextLoading?: boolean;
};

export function StepFooter({
    onBack,
    onNext,
    nextLabel = 'Next',
    isNextDisabled = false,
    isNextLoading = false,
}: StepFooterProps) {
    return (
        <div className="flex items-center justify-between gap-3 pt-8">
            {onBack ? (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={isNextLoading}
                    className="rounded-none text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                    ← Back
                </Button>
            ) : (
                <div />
            )}

            <Button
                type="button"
                onClick={onNext}
                disabled={isNextDisabled || isNextLoading}
                className="min-w-[120px] rounded-none bg-[#2A5CFF] hover:bg-[#2A5CFF]/90"
            >
                {isNextLoading ? 'Saving…' : `${nextLabel} →`}
            </Button>
        </div>
    );
}
