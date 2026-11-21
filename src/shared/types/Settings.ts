export type AIProvider = 'chatgpt' | 'claude' | 'grok';

export type ThemeMode = 'light' | 'dark' | 'amoled' | 'sepia';

export type AccentId =
    | 'default'
    | 'ocean'
    | 'forest'
    | 'amber'
    | 'rose'
    | 'violet';

export type Settings = {
    sound: boolean;
    autoTimer: boolean;
    mode: ThemeMode;
    accent: AccentId;
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
