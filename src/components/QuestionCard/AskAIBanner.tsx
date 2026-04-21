import React, { useState } from 'react';
import {
    CircleNotchIcon,
    ArrowSquareOutIcon,
    ChatTeardropTextIcon,
    XIcon,
} from '@phosphor-icons/react';
import type { AIProvider } from '@/types/Settings';
import { Textarea } from '@/components/ui/textarea.tsx';

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
        btnClass: 'bg-[#10a37f] hover:bg-[#0e8f6f] text-white focus:ring-[#10a37f]',
        icon: <img src="/ai_providers/chatgpt.svg" alt="ChatGPT" className="h-4 w-4" />,
    },
    claude: {
        label: 'Claude',
        badgeBg: 'bg-[#cc785c]',
        btnClass: 'bg-[#cc785c] hover:bg-[#b5694f] text-white focus:ring-[#cc785c]',
        icon: <img src="/ai_providers/claude.svg" alt="Claude" className="h-4 w-4" />,
    },
    grok: {
        label: 'Grok',
        badgeBg: 'bg-zinc-900 dark:bg-zinc-100',
        btnClass:
            'bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 focus:ring-zinc-500',
        icon: <img src="/ai_providers/grok.svg" alt="Grok" className="h-4 w-4 dark:invert" />,
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
        <div className="mt-5 mb-2 flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-4 shadow-sm transition-all duration-300">
            {/* Top Row: Info and Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div
                        className={`shrink-0 flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full shadow-sm ${ui.badgeBg}`}
                    >
                        {ui.icon}
                    </div>
                    <div className="min-w-0 flex-1 sm:flex-initial">
                        <p className="text-[15px] sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                            Stuck on this question?
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Get a step-by-step explanation via{' '}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                {ui.label}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {!showDoubtField && (
                        <button
                            onClick={() => setShowDoubtField(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <ChatTeardropTextIcon size={16} />
                            Add specific doubt
                        </button>
                    )}

                    <button
                        disabled={isProcessing}
                        onClick={handleAction}
                        className={`shrink-0 flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs md:text-sm rounded-xl sm:rounded-full px-5 py-2.5 sm:py-1.5 font-bold sm:font-semibold active:scale-[0.98] transition-all duration-150 ${ui.btnClass}`}
                    >
                        {isProcessing ? (
                            <CircleNotchIcon size={16} className="animate-spin" />
                        ) : (
                            <>
                                Ask {ui.label}
                                <ArrowSquareOutIcon className="text-base shrink-0" weight="bold" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Optional Doubt Field */}
            {showDoubtField && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Your specific doubt (optional)
                        </label>
                        <button
                            onClick={() => {
                                setShowDoubtField(false);
                                setDoubt('');
                            }}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <XIcon size={14} />
                        </button>
                    </div>
                    <Textarea
                        value={doubt}
                        onChange={(e) => setDoubt(e.target.value)}
                        placeholder="e.g., Why is option B incorrect? or How did we get to the second step?"
                        className="min-h-[80px] text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-blue-500"
                    />
                </div>
            )}
        </div>
    );
};

export default AskAIBanner;
