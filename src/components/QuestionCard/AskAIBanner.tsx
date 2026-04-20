import React from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import type { AIProvider } from '@/types/Settings';

interface AskAIBannerProps {
    provider: AIProvider;
    onClick: () => void;
}

// ---------------------------------------------------------------------------
// Per-provider visual config (colours + SVG icons)
// ---------------------------------------------------------------------------

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
            <img src="/ai_providers/chatgpt.svg" alt="ChatGPT" className="h-4 w-4" />
        ),
    },
    claude: {
        label: 'Claude',
        badgeBg: 'bg-[#cc785c]',
        btnClass: 'bg-[#cc785c] hover:bg-[#b5694f] text-white focus:ring-[#cc785c]',
        icon: (
            <img src="/ai_providers/claude.svg" alt="Claude" className="h-4 w-4" />
        ),
    },
    grok: {
        label: 'Grok',
        badgeBg: 'bg-zinc-900 dark:bg-zinc-100',
        btnClass:
            'bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 focus:ring-zinc-500',
        icon: (
            <img src="/ai_providers/grok.svg" alt="Grok" className="h-4 w-4 dark:invert" />
        ),
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const AskAIBanner: React.FC<AskAIBannerProps> = ({ provider, onClick }) => {
    // Fallback to chatgpt if the provider is no longer supported (e.g. users who had gemini saved)
    const ui = PROVIDER_UI[provider] || PROVIDER_UI['chatgpt'];

    return (
        <div className="mt-5 mb-2 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 shadow-sm">
            {/* Left — provider badge + text */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Coloured logo badge */}
                <div
                    className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${ui.badgeBg}`}
                    aria-hidden="true"
                >
                    {ui.icon}
                </div>

                {/* Text */}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                        Stuck on this question?
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Get a free step-by-step explanation via{' '}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {ui.label}
                        </span>
                    </p>
                </div>
            </div>

            {/* Right — CTA pill */}
            <button
                onClick={onClick}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${ui.btnClass}`}
                title={`Open ${ui.label} with this question pre-filled — free, no API key needed`}
                aria-label={`Ask ${ui.label} about this question`}
            >
                Ask {ui.label}
                <ArrowSquareOut className="text-base shrink-0" weight="bold" />
            </button>
        </div>
    );
};

export default AskAIBanner;
