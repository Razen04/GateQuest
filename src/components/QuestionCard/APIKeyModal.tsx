import React, { useState, useRef, useEffect } from 'react';
import { Key, Eye, EyeSlash, ArrowSquareOut, X, Sparkle } from '@phosphor-icons/react';

interface APIKeyModalProps {
    /** Called when the user saves a valid key. Receives the trimmed key string. */
    onKeySaved: (key: string) => void;
    /** Called when the modal is dismissed without saving */
    onClose: () => void;
}

const APIKeyModal: React.FC<APIKeyModalProps> = ({ onKeySaved, onClose }) => {
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the input when the modal opens
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSave = () => {
        const trimmed = keyInput.trim();
        if (!trimmed) return;
        onKeySaved(trimmed);
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-modal-title"
        >
            {/* Panel */}
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-bottom-4 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                            <Sparkle weight="fill" className="text-teal-600 dark:text-teal-400" size={18} />
                        </span>
                        <div>
                            <h2 id="api-key-modal-title" className="text-base font-bold dark:text-white leading-tight">
                                Add your Gemini API Key
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Required to generate AI answers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-5 space-y-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Get a free key from{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 font-medium hover:underline inline-flex items-center gap-0.5"
                        >
                            Google AI Studio <ArrowSquareOut size={12} className="inline" />
                        </a>
                        {' '}— it&apos;s free and takes under a minute. Your key stays on your device only.
                    </p>

                    {/* Input row */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                            <Key size={16} />
                        </span>
                        <input
                            ref={inputRef}
                            id="api-key-modal-input"
                            type={showKey ? 'text' : 'password'}
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            placeholder="Paste your Gemini API key…"
                            spellCheck={false}
                            autoComplete="off"
                            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 pl-9 pr-10 py-2.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                            aria-label={showKey ? 'Hide key' : 'Show key'}
                        >
                            {showKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Hint */}
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug">
                        You can manage or remove this key anytime in{' '}
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">Settings → AI Answer Key</span>.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!keyInput.trim()}
                            className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Sparkle weight="fill" size={15} />
                            Save &amp; Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIKeyModal;
