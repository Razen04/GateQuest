

export type Settings = {
    sound: boolean;
    autoTimer: boolean;
    darkMode: boolean;
    // Placeholder settings as of now
    shareProgress: boolean;
    dataCollection: boolean;

    /** User-supplied Gemini API key for generating AI answers (BYOK) */
    geminiApiKey?: string;
};
