import {
    ArrowCounterClockwiseIcon,
    CheckIcon,
    FloppyDiskIcon,
    InfoIcon,
    LockSimpleIcon,
    RobotIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template';
import { PROVIDERS } from '@/shared/data/ai_providers';
import { getDonorTier } from '@/shared/types/donor';
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
    const settings = useSettingsStore((s) => s.settings);
    const setSetting = useSettingsStore((s) => s.setSetting);
    const user = useAuthStore((s) => s.user);

    const tier = getDonorTier(user?.notification_tags);
    const canCustomize = tier >= 1;

    // Fallback chain: stored value → default template.
    // Treat empty/whitespace strings as "not set" so the textarea never
    // renders blank even if the DB somehow has '' for old users.
    const currentPrompt =
        settings.aiCustomPrompt && settings.aiCustomPrompt.trim().length > 0
            ? settings.aiCustomPrompt
            : DEFAULT_TEMPLATE;

    const [localPrompt, setLocalPrompt] = useState(currentPrompt);
    const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'dirty'>(
        'synced'
    );

    // Debounced save. For non-donors, this never fires (localPrompt is
    // frozen because the textarea is disabled). The `!canCustomize`
    // guard makes that explicit and prevents accidental writes.
    useEffect(() => {
        if (!canCustomize) {
            setSaveStatus('synced');
            return;
        }

        if (localPrompt === currentPrompt) {
            setSaveStatus('synced');
            return;
        }

        setSaveStatus('dirty');
        const timer = setTimeout(() => {
            setSaveStatus('saving');
            setSetting('aiCustomPrompt', localPrompt);
            setTimeout(() => setSaveStatus('synced'), 600);
        }, 3000);

        return () => clearTimeout(timer);
    }, [localPrompt, currentPrompt, canCustomize, setSetting]);

    const insertTag = (tag: string) => {
        if (!canCustomize) return;
        const updated = localPrompt ? `${localPrompt} ${tag}` : tag;
        setLocalPrompt(updated);
    };

    const resetTemplate = () => {
        if (!canCustomize) return;
        setLocalPrompt(DEFAULT_TEMPLATE);
        setSetting('aiCustomPrompt', DEFAULT_TEMPLATE);
    };

    return (
        <div className="space-y-8 px-2 py-4">
            {/* Header & Provider Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="space-y-1">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                            INTELLIGENCE ENGINE
                        </p>
                        <h2 className="flex items-center gap-2.5 font-grotesk text-2xl font-black tracking-tight text-foreground">
                            <RobotIcon
                                size={26}
                                className="text-chart-1"
                                weight="duotone"
                            />
                            AskAI
                        </h2>
                    </div>

                    <span className="font-mono text-xs font-bold text-muted-foreground">
                        PROMPT ENGINE
                    </span>
                </div>

                <p className="text-xs text-muted-foreground">
                    Select the target LLM environment to route your question
                    contexts and custom prompt variables.
                </p>

                <RadioGroup
                    value={settings.aiProvider ?? 'chatgpt'}
                    onValueChange={(value) =>
                        setSetting('aiProvider', value as AIProvider)
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
                                            ? 'border-chart-1 bg-chart-1/[0.03] shadow-md shadow-chart-1/5'
                                            : 'border-border bg-muted/50 hover:border-muted-foreground/30'
                                    }`}
                                >
                                    <span
                                        className={`mt-1 h-3 w-3 shrink-0 transition-transform ${p.dot} ${
                                            isActive
                                                ? 'scale-125 ring-4 ring-chart-1/20'
                                                : 'opacity-60'
                                        }`}
                                    />
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-grotesk text-sm font-bold text-foreground">
                                                {p.label}
                                            </p>
                                            {isActive && (
                                                <span className="bg-chart-1 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-sm">
                                                    Active Engine
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
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
            <div className="space-y-4 border-t border-border pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-3">
                            <h3 className="font-grotesk text-base font-bold text-foreground">
                                Custom Prompt Injector
                            </h3>

                            {/* Live Save Status — only shown for donors */}
                            {canCustomize && (
                                <AnimatePresence mode="wait">
                                    {saveStatus === 'dirty' && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="font-mono text-[10px] font-bold text-chart-4"
                                        >
                                            [ UNSAVED CHANGES ]
                                        </motion.span>
                                    )}
                                    {saveStatus === 'saving' && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-1 font-mono text-[10px] font-bold text-chart-1"
                                        >
                                            <FloppyDiskIcon
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
                                            className="flex items-center gap-1 font-mono text-[10px] font-bold text-chart-2"
                                        >
                                            <CheckIcon
                                                size={12}
                                                weight="bold"
                                            />{' '}
                                            SYNCED
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* Lock badge for non-donors */}
                            {!canCustomize && (
                                <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-chart-4">
                                    <LockSimpleIcon size={11} weight="bold" />
                                    Supporter perk
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Construct systemic instructions. Variables will be
                            dynamically injected at query runtime.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetTemplate}
                        disabled={!canCustomize}
                        className="h-8 gap-1.5 rounded-none border border-border px-3 font-grotesk text-xs font-bold text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                        <ArrowCounterClockwiseIcon size={14} /> Reset Template
                    </Button>
                </div>

                {/* Lock banner — only for non-donors, sits above the editor */}
                {!canCustomize && (
                    <div className="flex items-start gap-2.5 border border-chart-4/30 bg-chart-4/[0.05] p-3.5">
                        <LockSimpleIcon
                            size={16}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-chart-4"
                        />
                        <div className="min-w-0 space-y-1">
                            <p className="font-grotesk text-xs font-bold text-foreground">
                                Custom Prompt is a supporter perk
                            </p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                Supporters can customize how AI receives their
                                questions. You can read the default template
                                below, which is given to everyone to use.
                            </p>
                            <Link
                                to="/donate"
                                className="inline-block text-[11px] font-medium text-chart-1 hover:underline"
                            >
                                Learn about supporter perks →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Variable Injection Pills */}
                <div className="space-y-2">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        CLICK TO INJECT CONTEXT VARIABLE
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {PROMPT_TAGS.map((t) => (
                            <motion.button
                                key={t.tag}
                                {...(canCustomize && {
                                    whileHover: { scale: 1.05 },
                                    whileTap: { scale: 0.95 },
                                })}
                                onClick={() => insertTag(t.tag)}
                                disabled={!canCustomize}
                                className="group flex items-center gap-1 border border-border bg-muted/70 px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground transition-colors enabled:hover:border-chart-1/40 enabled:hover:bg-chart-1/10 enabled:hover:text-chart-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="opacity-40 transition-opacity group-enabled:group-hover:opacity-100">
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
                        disabled={!canCustomize}
                        readOnly={!canCustomize}
                        placeholder="Enter your AI prompt template..."
                        className={`min-h-[200px] w-full rounded-none border-border bg-background p-4 font-mono text-xs leading-relaxed transition-all placeholder:text-muted-foreground ${
                            canCustomize
                                ? 'text-foreground focus:border-chart-1 focus:ring-2 focus:ring-chart-1/20'
                                : 'text-foreground/80 cursor-not-allowed opacity-70'
                        }`}
                    />
                </div>

                {/* Notice & Limitations Banner */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 border border-chart-4/20 bg-chart-4/[0.03] p-3.5">
                        <WarningIcon
                            size={18}
                            className="shrink-0 text-chart-4"
                            weight="bold"
                        />
                        <div className="space-y-0.5">
                            <p className="font-grotesk text-xs font-bold text-foreground">
                                Diagram Clipboard Restriction
                            </p>
                            <p className="text-[11px] leading-tight text-muted-foreground">
                                Browser cross-origin policies may block diagram
                                auto-copying. Right-click diagrams and select{' '}
                                <i>Copy Image</i> to attach manually.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 border border-chart-1/20 bg-chart-1/[0.03] p-3.5">
                        <InfoIcon
                            size={18}
                            className="shrink-0 text-chart-1"
                            weight="bold"
                        />
                        <div className="space-y-0.5">
                            <p className="font-grotesk text-xs font-bold text-foreground">
                                Variable Preservation
                            </p>
                            <p className="text-[11px] leading-tight text-muted-foreground">
                                Retain the{' '}
                                <code className="font-mono font-bold text-chart-1">{`{{QUESTION_TEXT}}`}</code>{' '}
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
