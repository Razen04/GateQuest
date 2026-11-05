import {
    ArrowSquareOutIcon,
    ChatTeardropTextIcon,
    CircleNotchIcon,
    XIcon,
} from '@phosphor-icons/react';
import React, { useState } from 'react';
import { Textarea } from '@/shared/components/ui/textarea.tsx';
import type { AIProvider } from '@/shared/types/Settings';

interface AskAIBannerProps {
    provider: AIProvider;
    onClick: (doubt?: string) => void;
}

const PROVIDER_UI: Record<
    AIProvider,
    { label: string; badgeBg: string; btnClass: string; icon: React.ReactNode }
> = {
    chatgpt: {
        label: 'ChatGPT',
        badgeBg: 'bg-[#10a37f]',
        btnClass:
            'bg-[#10a37f] hover:bg-[#0e8f6f] text-white focus:ring-[#10a37f]',
        icon: (
            <img
                src="/ai_providers/chatgpt.svg"
                alt="ChatGPT"
                className="h-4 w-4"
            />
        ),
    },
    claude: {
        label: 'Claude',
        badgeBg: 'bg-[#cc785c]',
        btnClass:
            'bg-[#cc785c] hover:bg-[#b5694f] text-white focus:ring-[#cc785c]',
        icon: (
            <img
                src="/ai_providers/claude.svg"
                alt="Claude"
                className="h-4 w-4"
            />
        ),
    },
    grok: {
        label: 'Grok',
        // Grok is grayscale → maps cleanly to theme fg/bg
        badgeBg: 'bg-foreground',
        btnClass:
            'bg-foreground hover:bg-foreground/85 text-background focus:ring-ring',
        icon: (
            <img
                src="/ai_providers/grok.svg"
                alt="Grok"
                className="h-4 w-4 dark:invert"
            />
        ),
    },
};

const AskAIBanner: React.FC<AskAIBannerProps> = ({ provider, onClick }) => {
    const [showDoubtField, setShowDoubtField] = useState(false);
    const [doubt, setDoubt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const ui = PROVIDER_UI[provider] || PROVIDER_UI['chatgpt'];

    const handleAction = () => {
        setIsProcessing(true);
        try {
            onClick(doubt);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mt-5 mb-2 flex flex-col gap-3 border border-border bg-muted p-4 shadow-sm transition-all duration-300">
            {/* Top Row: Info and Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div
                        className={`shrink-0 flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center shadow-sm ${ui.badgeBg}`}
                    >
                        {ui.icon}
                    </div>
                    <div className="min-w-0 flex-1 sm:flex-initial">
                        <p className="text-[15px] sm:text-sm font-semibold text-foreground leading-tight">
                            Stuck on this question?
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Get a step-by-step explanation via{' '}
                            <span className="font-medium text-foreground">
                                {ui.label}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {!showDoubtField && (
                        <button
                            onClick={() => setShowDoubtField(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ChatTeardropTextIcon size={16} />
                            Add specific doubt
                        </button>
                    )}

                    <button
                        disabled={isProcessing}
                        onClick={handleAction}
                        className={`shrink-0 flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs md:text-sm px-5 py-2.5 sm:py-1.5 font-bold sm:font-semibold active:scale-[0.98] transition-all duration-150 ${ui.btnClass}`}
                    >
                        {isProcessing ? (
                            <CircleNotchIcon
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <>
                                Ask {ui.label}
                                <ArrowSquareOutIcon
                                    className="text-base shrink-0"
                                    weight="bold"
                                />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Optional Doubt Field */}
            {showDoubtField && (
                <div className="pt-2 border-t border-border mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Your specific doubt (optional)
                        </label>
                        <button
                            onClick={() => {
                                setShowDoubtField(false);
                                setDoubt('');
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon size={14} />
                        </button>
                    </div>
                    <Textarea
                        value={doubt}
                        onChange={(e) => setDoubt(e.target.value)}
                        placeholder="e.g., Why is option B incorrect? or How did we get to the second step?"
                        className="min-h-[80px] text-sm bg-background border-border focus:ring-ring"
                    />
                </div>
            )}
        </div>
    );
};

export default AskAIBanner;
