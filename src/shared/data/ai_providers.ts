import type { AIProvider } from '@/shared/types/Settings';

// Provider display config
export const PROVIDERS: {
    id: AIProvider;
    label: string;
    desc: string;
    colour: string;
    dot: string;
}[] = [
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
