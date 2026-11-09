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
                    className="rounded-none text-muted-foreground hover:text-foreground"
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
                className="min-w-[120px] rounded-none bg-chart-1 text-white hover:bg-chart-1/90"
            >
                {isNextLoading ? 'Saving…' : `${nextLabel} →`}
            </Button>
        </div>
    );
}
