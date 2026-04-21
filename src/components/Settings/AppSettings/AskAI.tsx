import { Robot, ArrowCounterClockwise, Info } from '@phosphor-icons/react';
import { PROVIDERS } from '@/data/ai_providers.ts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import type { AIProvider } from '@/types/Settings.ts';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import useSettings from '@/hooks/useSettings';
import { DEFAULT_TEMPLATE } from '@/data/ai_prompt_template';
import { useEffect, useState } from 'react';

const PROMPT_TAGS = [
    { label: 'Subject', tag: '{{SUBJECT}}' },
    { label: 'Year', tag: '{{YEAR}}' },
    { label: 'Type', tag: '{{TYPE}}' },
    { label: 'Question', tag: '{{QUESTION_TEXT}}' },
    { label: 'Options', tag: '{{OPTIONS}}' },
    { label: 'Answer', tag: '{{CORRECT_ANSWER}}' },
    { label: 'Doubt', tag: '{{DOUBT}' },
];

const AskAI = () => {
    const { settings, handleSettingToggle } = useSettings();

    // Use setting or fallback to default
    const currentPrompt = settings.aiCustomPrompt ?? DEFAULT_TEMPLATE;
    const [localPrompt, setLocalPrompt] = useState(currentPrompt);

    // Debounce to prevent excessive DB calls while updating the prompt
    useEffect(() => {
        if (localPrompt === currentPrompt) return;

        const timer = setTimeout(() => {
            handleSettingToggle('aiCustomPrompt', localPrompt);
        }, 10000);

        return () => clearTimeout(timer);
    }, [localPrompt, currentPrompt, handleSettingToggle]);

    const insertTag = (tag: string) => {
        handleSettingToggle('aiCustomPrompt', currentPrompt + ' ' + tag);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-semibold mb-1 dark:text-white flex items-center gap-2">
                    <Robot size={24} className="text-blue-500" />
                    Ask AI Provider
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    Choose the AI assistant that will open when you click "Ask AI".
                </p>

                <RadioGroup
                    value={settings.aiProvider ?? 'chatgpt'}
                    onValueChange={(value) =>
                        handleSettingToggle('aiProvider', value as AIProvider)
                    }
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                    {PROVIDERS.map((p) => {
                        const isActive = (settings.aiProvider ?? 'chatgpt') === p.id;
                        return (
                            <Label
                                key={p.id}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-3 transition-all
                                ${
                                    isActive
                                        ? `${p.colour} shadow-sm border-transparent`
                                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                            >
                                <RadioGroupItem value={p.id} className="sr-only" />
                                <span
                                    className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${p.dot}`}
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold leading-tight dark:text-white flex items-center">
                                        {p.label}
                                        {isActive && (
                                            <span className="ml-2 text-[9px] font-black uppercase bg-white/20 px-1.5 rounded">
                                                active
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                                        {p.desc}
                                    </p>
                                </div>
                            </Label>
                        );
                    })}
                </RadioGroup>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold dark:text-white">
                        Custom Prompt Template
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocalPrompt(DEFAULT_TEMPLATE)}
                        className="h-8 text-xs text-zinc-500 hover:text-red-500 gap-1"
                    >
                        <ArrowCounterClockwise size={14} /> Reset to Default
                    </Button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Personalize the instructions sent to the AI. Click a tag to insert it.
                </p>

                <p className="text-xs text-red-500 dark:text-red-400 mb-3">
                    <span className="font-bold">Note:</span> Browser security sometimes prevents
                    auto-copying diagrams from external sites. While your text instructions are
                    always copied, you may need to right-click the image and select{' '}
                    <i>Copy Image</i> to paste it into the AI chat manually.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                    {PROMPT_TAGS.map((t) => (
                        <button
                            key={t.tag}
                            onClick={() => insertTag(t.tag)}
                            className="px-2 py-1 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-600 dark:text-zinc-400 rounded transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                            {t.tag}
                        </button>
                    ))}
                </div>

                <Textarea
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    placeholder="Enter your AI prompt template..."
                    className="min-h-[180px] text-xs font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950/50"
                />

                <div className="mt-3 flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-normal">
                        <strong>Note:</strong> We recommend keeping{' '}
                        <code>{`{{QUESTION_TEXT}}`}</code> to ensure the AI knows what to solve!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AskAI;
