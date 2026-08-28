export type AIProvider = 'chatgpt' | 'claude' | 'grok';

export type Settings = {
    sound: boolean;
    autoTimer: boolean;
    darkMode: boolean;
    is_beta: boolean;
    // Which AI provider to deep-link to for question explanations
    aiProvider: AIProvider;
    aiCustomPrompt: string;
    notifications: boolean;
    // Placeholder settings as of now
    shareProgress: boolean;
    dataCollection: boolean;
};

export type SettingToggle = <K extends keyof Settings>(
    key: K,
    value?: Settings[K]
) => void;
