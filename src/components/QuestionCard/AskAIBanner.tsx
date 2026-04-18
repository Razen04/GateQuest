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
            // OpenAI logo
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.412-.663zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .033-.062l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
            </svg>
        ),
    },
    claude: {
        label: 'Claude',
        badgeBg: 'bg-[#cc785c]',
        btnClass: 'bg-[#cc785c] hover:bg-[#b5694f] text-white focus:ring-[#cc785c]',
        icon: (
            // Anthropic / Claude minimal mark
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674L12.15 17.37H5.76l-1.092 3.11H1l5.569-16.96zm5.066 11.077L8.55 7.94l-3.132 6.657h6.217z" />
            </svg>
        ),
    },
    grok: {
        label: 'Grok',
        badgeBg: 'bg-zinc-900 dark:bg-zinc-100',
        btnClass:
            'bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 focus:ring-zinc-500',
        icon: (
            // X / Grok logo
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white dark:fill-zinc-900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
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
