import {
    ArrowCounterClockwise,
    Check,
    FloppyDisk,
    Info,
    Robot,
    Sparkle,
    Warning,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSettings from '@/features/settings/hooks/useSettings';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template';
import { PROVIDERS } from '@/shared/data/ai_providers';
import type { AIProvider } from '@/shared/types/Settings';

const PROMPT_TAGS = [
    { label: 'Subject', tag: '{{SUBJECT}}' },
    { label: 'Year', tag: '{{YEAR}}' },
    { label: 'Type', tag: '{{TYPE}}' },
    { label: 'Question', tag: '{{QUESTION_TEXT}}' },
    { label: 'Options', tag: '{{OPTIONS}}' },
    { label: 'Answer', tag: '{{CORRECT_ANSWER}}' },
    { label: 'Doubt', tag: '{{DOUBT}}' },
];

const AskAI = () => {
    const { settings, handleSettingToggle } = useSettings();

    const currentPrompt = settings.aiCustomPrompt ?? DEFAULT_TEMPLATE;
    const [localPrompt, setLocalPrompt] = useState(currentPrompt);
    const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'dirty'>(
        'synced'
    );

    // Debounce to prevent excessive DB calls while updating the prompt
    useEffect(() => {
        if (localPrompt === currentPrompt) {
            setSaveStatus('synced');
            return;
        }

        setSaveStatus('dirty');
        const timer = setTimeout(() => {
            setSaveStatus('saving');
            handleSettingToggle('aiCustomPrompt', localPrompt);
            setTimeout(() => setSaveStatus('synced'), 600);
        }, 3000); // 3s snappy debounce

        return () => clearTimeout(timer);
    }, [localPrompt, currentPrompt, handleSettingToggle]);

    const insertTag = (tag: string) => {
        const updated = localPrompt ? `${localPrompt} ${tag}` : tag;
        setLocalPrompt(updated);
    };

    return (
        <div className="space-y-8 px-2 py-4">
            {/* Header & Provider Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900/10 pb-4 dark:border-white/10">
                    <div className="space-y-1">
                        <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.25em] text-[#2A5CFF]">
                            INTELLIGENCE // ENGINE
                        </p>
                        <h2 className="flex items-center gap-2.5 font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            <Robot
                                size={26}
                                className="text-[#2A5CFF]"
                                weight="duotone"
                            />
                            AI Neural Dispatch
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 border border-slate-900/10 bg-slate-50/50 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                        <Sparkle
                            size={16}
                            className="text-amber-500"
                            weight="fill"
                        />
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600 dark:text-slate-300">
                            PROMPT ENGINE V2
                        </span>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select the target LLM environment to route your question
                    contexts and custom prompt variables.
                </p>

                <RadioGroup
                    value={settings.aiProvider ?? 'chatgpt'}
                    onValueChange={(value) =>
                        handleSettingToggle('aiProvider', value as AIProvider)
                    }
                    className="grid grid-cols-1 sm:grid-cols-2"
                >
                    {PROVIDERS.map((p) => {
                        const isActive =
                            (settings.aiProvider ?? 'chatgpt') === p.id;
                        return (
                            <Label
                                key={p.id}
                                className="group relative cursor-pointer outline-none"
                            >
                                <RadioGroupItem
                                    value={p.id}
                                    className="sr-only"
                                />
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`relative flex items-start gap-3.5 border p-4 transition-all w-full ${
                                        isActive
                                            ? 'border-[#2A5CFF] bg-[#2A5CFF]/[0.03] shadow-md shadow-blue-500/5 dark:border-blue-500 dark:bg-blue-500/10'
                                            : 'border-slate-900/10 bg-slate-50/50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                                    }`}
                                >
                                    <span
                                        className={`mt-1 h-3 w-3 shrink-0 transition-transform ${p.dot} ${
                                            isActive
                                                ? 'scale-125 ring-4 ring-[#2A5CFF]/20'
                                                : 'opacity-60'
                                        }`}
                                    />
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-slate-900 dark:text-white">
                                                {p.label}
                                            </p>
                                            {isActive && (
                                                <span className="bg-[#2A5CFF] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-black uppercase text-white shadow-sm">
                                                    Active Engine
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {p.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </Label>
                        );
                    })}
                </RadioGroup>
            </div>

            {/* Custom Prompt Template Editor */}
            <div className="space-y-4 border-t border-slate-900/10 pt-6 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-3">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-slate-900 dark:text-white">
                                Custom Prompt Injector
                            </h3>
                            {/* Live Sync Status */}
                            <AnimatePresence mode="wait">
                                {saveStatus === 'dirty' && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-amber-500"
                                    >
                                        [ UNSAVED CHANGES ]
                                    </motion.span>
                                )}
                                {saveStatus === 'saving' && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-blue-500"
                                    >
                                        <FloppyDisk
                                            size={12}
                                            className="animate-spin"
                                        />{' '}
                                        SYNCING...
                                    </motion.span>
                                )}
                                {saveStatus === 'synced' && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-emerald-500"
                                    >
                                        <Check size={12} weight="bold" /> SYNCED
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Construct systemic instructions. Variables will be
                            dynamically injected at query runtime.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setLocalPrompt(DEFAULT_TEMPLATE);
                            handleSettingToggle(
                                'aiCustomPrompt',
                                DEFAULT_TEMPLATE
                            );
                        }}
                        className="h-8 gap-1.5 rounded-none border border-slate-900/10 px-3 font-['Space_Grotesk',sans-serif] text-xs font-bold text-slate-600 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 dark:border-white/10 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:text-red-400"
                    >
                        <ArrowCounterClockwise size={14} /> Reset Template
                    </Button>
                </div>

                {/* Variable Injection Pills */}
                <div className="space-y-2">
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        // CLICK TO INJECT CONTEXT VARIABLE
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {PROMPT_TAGS.map((t) => (
                            <motion.button
                                key={t.tag}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => insertTag(t.tag)}
                                className="group flex items-center gap-1 border border-slate-900/10 bg-slate-100/70 px-2.5 py-1 font-['JetBrains_Mono',monospace] text-[11px] font-semibold text-slate-700 transition-colors hover:border-[#2A5CFF]/40 hover:bg-[#2A5CFF]/10 hover:text-[#2A5CFF] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
                            >
                                <span className="opacity-40 transition-opacity group-hover:opacity-100">
                                    +
                                </span>
                                {t.tag}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Main Textarea */}
                <div className="relative">
                    <Textarea
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        placeholder="Enter your AI prompt template..."
                        className="min-h-[200px] w-full rounded-none border-slate-900/10 bg-slate-50/50 p-4 font-['JetBrains_Mono',monospace] text-xs leading-relaxed text-slate-900 transition-all focus:border-[#2A5CFF] focus:ring-2 focus:ring-[#2A5CFF]/20 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                    />
                </div>

                {/* Notice & Limitations Banner */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 border border-amber-500/20 bg-amber-500/[0.03] p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.05]">
                        <Warning
                            size={18}
                            className="shrink-0 text-amber-500"
                            weight="bold"
                        />
                        <div className="space-y-0.5">
                            <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-slate-900 dark:text-white">
                                Diagram Clipboard Restriction
                            </p>
                            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                                Browser cross-origin policies may block diagram
                                auto-copying. Right-click diagrams and select{' '}
                                <i>Copy Image</i> to attach manually.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 border border-[#2A5CFF]/20 bg-[#2A5CFF]/[0.03] p-3.5 dark:border-blue-500/20 dark:bg-blue-500/[0.05]">
                        <Info
                            size={18}
                            className="shrink-0 text-[#2A5CFF] dark:text-blue-400"
                            weight="bold"
                        />
                        <div className="space-y-0.5">
                            <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-slate-900 dark:text-white">
                                Variable Preservation
                            </p>
                            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                                Retain the{' '}
                                <code className="font-['JetBrains_Mono',monospace] font-bold text-[#2A5CFF] dark:text-blue-300">{`{{QUESTION_TEXT}}`}</code>{' '}
                                key to ensure accurate problem context
                                generation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskAI;
