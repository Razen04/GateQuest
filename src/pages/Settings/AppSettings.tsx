import { useState } from 'react';
import { Faders } from '@phosphor-icons/react';
import useSettings from '../../hooks/useSettings.ts';
import ToggleSwitch from '@/components/ui/ToggleSwitch.tsx';
import type { AIProvider } from '@/types/Settings.ts';

// ---------------------------------------------------------------------------
// Provider display config
// ---------------------------------------------------------------------------
const PROVIDERS: { id: AIProvider; label: string; desc: string; colour: string; dot: string }[] = [
    {
        id: 'chatgpt',
        label: 'ChatGPT',
        desc: 'OpenAI — most popular, excellent reasoning',
        colour: 'border-[#10a37f] bg-[#10a37f]/10',
        dot: 'bg-[#10a37f]',
    },
    {
        id: 'claude',
        label: 'Claude',
        desc: 'Anthropic — thorough, nuanced explanations',
        colour: 'border-[#cc785c] bg-[#cc785c]/10',
        dot: 'bg-[#cc785c]',
    },
    {
        id: 'grok',
        label: 'Grok',
        desc: 'xAI — concise, direct answers',
        colour: 'border-zinc-700 bg-zinc-100 dark:bg-zinc-800',
        dot: 'bg-zinc-800 dark:bg-zinc-200',
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const AppSettings = () => {
    const { settings, handleSettingToggle } = useSettings();

    return (
        <div className="pb-20 px-4">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Faders className="mr-2" /> App Settings
            </h2>

            <div className="space-y-4">
                <ToggleSwitch
                    isOn={settings.sound}
                    onToggle={() => handleSettingToggle('sound')}
                    label="Sound Effects"
                />
                <ToggleSwitch
                    label="Auto Timer"
                    onToggle={() => handleSettingToggle('autoTimer')}
                    isOn={settings.autoTimer}
                />

                <ToggleSwitch
                    label="Dark Mode"
                    onToggle={() => handleSettingToggle('darkMode')}
                    isOn={settings.darkMode}
                />

                {/* AI Provider Picker */}
                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-4">
                    <h3 className="text-base font-semibold mb-1 dark:text-white">AI Explanation Provider</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                        After viewing an answer, the "Ask AI" button will open your chosen provider
                        with the question pre-filled — free, no API key required.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        {PROVIDERS.map((p) => {
                            const isActive = (settings.aiProvider ?? 'chatgpt') === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleSettingToggle('aiProvider', p.id)}
                                    className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 active:scale-[0.98]
                                        ${isActive
                                            ? `${p.colour} shadow-sm`
                                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                                        }`}
                                    aria-pressed={isActive}
                                >
                                    {/* Colour dot */}
                                    <span className={`mt-0.5 shrink-0 h-3 w-3 rounded-full ${p.dot}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold dark:text-white leading-tight">
                                            {p.label}
                                            {isActive && (
                                                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide opacity-60">
                                                    active
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                            {p.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>



                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <h3 className="text-lg font-medium mb-2">App Information</h3>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Version</span>
                            <span>0.10.4</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Last Updated</span>
                            <span>March 11, 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettings;
