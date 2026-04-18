export type AIProvider = 'chatgpt' | 'claude' | 'grok';

export type Settings = {
    sound: boolean;
    autoTimer: boolean;
    darkMode: boolean;
    // Placeholder settings as of now
    shareProgress: boolean;
    dataCollection: boolean;
    /** Which AI provider to deep-link to for question explanations */
    aiProvider: AIProvider;
};
