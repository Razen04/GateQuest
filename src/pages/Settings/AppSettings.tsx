import { useState } from 'react';
import { Faders, Eye, EyeSlash, Key, CheckCircle, ArrowSquareOut } from '@phosphor-icons/react';
import useSettings from '../../hooks/useSettings.ts';
import ToggleSwitch from '@/components/ui/ToggleSwitch.tsx';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const AppSettings = () => {
    const { settings, handleSettingToggle, handleSettingChange } = useSettings();
    const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [keySaved, setKeySaved] = useState(false);

    const handleSaveKey = () => {
        handleSettingChange('geminiApiKey', apiKeyInput.trim() || undefined);
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 2000);
    };

    const handleClearKey = () => {
        setApiKeyInput('');
        handleSettingChange('geminiApiKey', undefined);
    };

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



                {/* BYOK — Bring Your Own Gemini API Key */}
                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-4">
                    <h3 className="text-base font-semibold mb-1 dark:text-white flex items-center gap-2">
                        <Key className="text-blue-500" weight="bold" />
                        AI Answer Key
                        {settings.geminiApiKey && (
                            <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-500 flex items-center gap-1">
                                <CheckCircle weight="fill" /> Active
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                        Add your own{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline inline-flex items-center gap-0.5"
                        >
                            Gemini API key <ArrowSquareOut className="inline" size={11} />
                        </a>{' '}
                        to generate AI answers directly. Your key is stored only on this device and is never shared.
                    </p>

                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <input
                                id="gemini-api-key-input"
                                type={showKey ? 'text' : 'password'}
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                                placeholder="Paste your API key here…"
                                spellCheck={false}
                                autoComplete="off"
                                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 pr-9 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((v) => !v)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                                aria-label={showKey ? 'Hide key' : 'Show key'}
                            >
                                {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveKey}
                            disabled={!apiKeyInput.trim()}
                            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-all cursor-pointer
                                ${ keySaved
                                    ? 'bg-emerald-500 text-white scale-95'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                        >
                            {keySaved ? '✓ Saved' : 'Save'}
                        </button>

                        {settings.geminiApiKey && (
                            <button
                                type="button"
                                onClick={handleClearKey}
                                className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
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
