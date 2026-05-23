import type { Question, MCQQuestion, MSQQuestion } from '@/shared/types/storage';
import type { AIProvider } from '@/shared/types/Settings';
import { toast } from 'sonner';
import type React from 'react';
import { isNumericalQuestion } from '@/features/questions/utils/questionUtils';
import { DEFAULT_TEMPLATE } from '../data/ai_prompt_template';

// ---------------------------------------------------------------------------
// Provider config — deep-link URL templates for each AI assistant
// ---------------------------------------------------------------------------

export const AI_PROVIDERS: Record<
    AIProvider,
    {
        label: string;
        /** url(encodedPrompt) => full deep-link URL */
        url: (encoded: string) => string;
        /** Tailwind bg colour for the logo badge */
        badgeBg: string;
        /** Tailwind text colour for the CTA button */
        btnClass: string;
        /** Inline SVG path data for the provider icon */
        icon: React.ReactNode;
    }
> = {
    chatgpt: {
        label: 'ChatGPT',
        url: (q) => `https://chatgpt.com/?q=${q}`,
        badgeBg: 'bg-[#10a37f]',
        btnClass: 'bg-[#10a37f] hover:bg-[#0e8f6f] text-white focus:ring-[#10a37f]',
        icon: null, // set in component
    },
    claude: {
        label: 'Claude',
        url: (q) => `https://claude.ai/new?q=${q}`,
        badgeBg: 'bg-[#cc785c]',
        btnClass: 'bg-[#cc785c] hover:bg-[#b5694f] text-white focus:ring-[#cc785c]',
        icon: null,
    },
    grok: {
        label: 'Grok',
        url: (q) => `https://grok.com/?q=${q}`,
        badgeBg: 'bg-zinc-900 dark:bg-white',
        btnClass:
            'bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 focus:ring-zinc-500',
        icon: null,
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract all image URLs from markdown image syntax in a question string.
 * Returns an empty array if there are no images.
 */
export function extractImageUrls(questionText: string): string[] {
    return [...questionText.matchAll(/!\[.*?\]\((.*?)\)/g)].map((m) => m[1] as string);
}

/**
 * Label options as A) B) C) D) for clarity in the ChatGPT prompt.
 */
function labelledOptions(options: string[]): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return options.map((opt, i) => `${labels[i] ?? i}) ${opt}`).join('\n');
}

/**
 * Resolve the correct answer to a human-readable string.
 * Handles MCQ (index array), MSQ (index array), and Numerical.
 */
function resolveCorrectAnswer(question: Question): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (isNumericalQuestion(question)) {
        const ca = question.correct_answer;
        if (ca.type === 'exact') return String(ca.value);
        if (ca.type === 'multiple') return ca.values.join(', ');
        if (ca.type === 'range') return `between ${ca.min} and ${ca.max}`;
        if (ca.type === 'tolerance') return `${ca.value} ± ${ca.tolerance}`;
        return 'See solution';
    }

    const typeStr = question.question_type?.toLowerCase() || '';

    if (typeStr.includes('multiple')) {
        const q = question as MCQQuestion | MSQQuestion;
        if (!q.options || !Array.isArray(q.correct_answer)) return 'See solution';

        return q.correct_answer
            .map((idx: number) => `${labels[idx] ?? idx}) ${q.options[idx]}`)
            .join(', ');
    }

    return 'See solution';
}

// ---------------------------------------------------------------------------
// Main prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds a rich, structured prompt optimised for GATE exam explanations.
 * Works with any AI provider (ChatGPT, Gemini, Claude, Grok).
 *
 * @param question    The GATE question object.
 * @param imageCount  The number of diagrams in the question. Used to format placeholders.
 * @param userTemplate A custom AI prompt which the users can customize according to their liking.
 */
export function buildGateAIPrompt(
    question: Question,
    imageCount = 0,
    userTemplate?: string,
    doubt?: string,
): string {
    const isMCQ = question.question_type?.toLowerCase().includes('multiple-choice') ?? false;
    const q = question as MCQQuestion | MSQQuestion;

    // --- Data Pre-processing (The "Necessary Defaults") ---
    let imagePlaceholder = '[Image — diagram not available]';
    if (imageCount === 1) imagePlaceholder = '[Diagram attached — refer to the pasted image]';
    else if (imageCount > 1) imagePlaceholder = '[Diagrams attached — refer to pasted images]';

    const cleanQuestion = question.question.replace(/!\[.*?\]\(.*?\)/g, imagePlaceholder).trim();

    const optionsBlock =
        isMCQ && q.options?.length ? `\nOPTIONS:\n${labelledOptions(q.options)}\n` : '';

    const correctAnswer = resolveCorrectAnswer(question);

    const doubtText = doubt?.trim() || '';
    const formattedDoubt = doubtText
        ? `\n\nUSER'S SPECIFIC DOUBT:\n"${doubtText}"\n\nPlease ensure you address this doubt specifically in your explanation.`
        : '';

    // --- Template Logic ---
    const template = userTemplate?.trim() ? userTemplate : DEFAULT_TEMPLATE;

    // Map tags to processed values
    const replacements: Record<string, string> = {
        '{{SUBJECT}}': question.subject || 'Engineering',
        '{{YEAR}}': String(question.year),
        '{{TYPE}}': question.question_type || 'General',
        '{{QUESTION_TEXT}}': cleanQuestion,
        '{{OPTIONS}}': optionsBlock,
        '{{CORRECT_ANSWER}}': correctAnswer,
        '{{DOUBT}}': formattedDoubt,
    };

    // Replace all tags in the template
    let finalPrompt = template;
    Object.entries(replacements).forEach(([tag, value]) => {
        // Use a global regex to replace all instances of the tag
        finalPrompt = finalPrompt.split(tag).join(value);
    });

    if (doubtText && !template.includes('{{DOUBT}}')) {
        finalPrompt += formattedDoubt;
    }

    return finalPrompt.trim();
}

// ---------------------------------------------------------------------------
// Deep-link opener — works for all providers
// ---------------------------------------------------------------------------

/** Fallback base URLs when the encoded prompt is too long */
const FALLBACK_URLS: Record<AIProvider, string> = {
    chatgpt: 'https://chatgpt.com/',
    claude: 'https://claude.ai/new',
    grok: 'https://grok.com/',
};

/**
 * Attempts to stitch images, but returns null if CORS prevents reading the data.
 */
async function stitchImagesToBlob(urls: string[]): Promise<Blob | null> {
    try {
        const loadedImages = await Promise.all(
            urls.map((url) => {
                return new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    // This is the trigger: if the server doesn't support CORS,
                    // this will cause the 'onerror' you saw.
                    img.crossOrigin = 'anonymous';
                    img.src = url;
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`CORS block on: ${url}`));
                });
            }),
        );

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const spacing = 20;
        const maxWidth = Math.max(...loadedImages.map((img) => img.width));
        const totalHeight = loadedImages.reduce((sum, img) => sum + img.height + spacing, 0);

        canvas.width = maxWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = 0;
        loadedImages.forEach((img) => {
            ctx.drawImage(img, 0, currentY);
            currentY += img.height + spacing;
        });

        return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    } catch (error) {
        // Log the error for debugging but don't crash the app
        console.warn('Stitching blocked by browser security (CORS). Fallback to manual copy.');
        return null;
    }
}

/**
 * Main AI Opener with robust fallback
 */
export async function openInAI(
    question: Question,
    provider: AIProvider = 'chatgpt',
    aiCustomPrompt: string,
    doubt?: string,
): Promise<void> {
    const config = AI_PROVIDERS[provider] || AI_PROVIDERS['chatgpt'];
    const fallback = FALLBACK_URLS[provider] || FALLBACK_URLS['chatgpt'];

    const imageUrls = extractImageUrls(question.question);
    const hasImages = imageUrls.length > 0;
    const prompt = buildGateAIPrompt(question, imageUrls.length, aiCustomPrompt, doubt);

    if (hasImages) {
        const stitchedBlob = await stitchImagesToBlob(imageUrls);

        if (stitchedBlob) {
            try {
                const clipboardItem = new ClipboardItem({
                    'text/plain': new Blob([prompt], { type: 'text/plain' }),
                    [stitchedBlob.type]: stitchedBlob,
                });
                await navigator.clipboard.write([clipboardItem]);
                window.open(fallback, '_blank', 'noopener,noreferrer');
                toast.success(`Prompt & Diagrams copied! Just paste in ${config.label}.`);
                return;
            } catch (err) {
                console.error('Clipboard write failed', err);
            }
        }

        // --- FALLBACK: Text Only ---
        // If we get here, CORS blocked stitching or the Clipboard API failed.
        await navigator.clipboard.writeText(prompt);
        window.open(fallback, '_blank', 'noopener,noreferrer');

        toast.info(
            "Prompt copied! Note: Diagrams couldn't be auto-copied. Please right-click the image and 'Copy Image' manually.",
            { duration: 10000 },
        );
        return;
    }

    // Standard Text-Only flow
    const encoded = encodeURIComponent(prompt);
    if (encoded.length > 8000) {
        await navigator.clipboard.writeText(prompt);
        window.open(fallback, '_blank', 'noopener,noreferrer');
        toast.info('Prompt copied to clipboard!');
    } else {
        window.open(config.url(encoded), '_blank', 'noopener,noreferrer');
    }
}

/** @deprecated use buildGateAIPrompt */
export const buildGateChatGPTPrompt = buildGateAIPrompt;

/** @deprecated Use openInAI instead */
export const openInChatGPT = (question: Question): Promise<void> => openInAI(question, 'chatgpt');
