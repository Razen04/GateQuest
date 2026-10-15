import { Check, CircleNotch, FloppyDisk } from '@phosphor-icons/react';
import { Button } from '@/shared/components/ui/button';

type SaveButtonProps = {
    isSaving: boolean;
    savedSuccess: boolean;
    disabled: boolean;
    onClick: () => void;
};

export function SaveButton({
    isSaving,
    savedSuccess,
    disabled,
    onClick,
}: SaveButtonProps) {
    return (
        <div className="pt-4">
            <Button
                onClick={onClick}
                disabled={disabled}
                className={`rounded-none group relative flex h-12 w-full items-center justify-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white transition-all md:w-auto md:min-w-[200px] ${
                    savedSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#2A5CFF] hover:bg-[#2A5CFF]/90 hover:shadow-lg hover:shadow-[#2A5CFF]/20 active:scale-[0.99]'
                }`}
            >
                {isSaving ? (
                    <>
                        <CircleNotch className="animate-spin" size={18} />
                        <span>Syncing Changes...</span>
                    </>
                ) : savedSuccess ? (
                    <>
                        <Check size={18} weight="bold" />
                        <span>Changes Saved</span>
                    </>
                ) : (
                    <>
                        <FloppyDisk size={18} />
                        <span>Save Profile Changes</span>
                    </>
                )}
            </Button>
        </div>
    );
}
