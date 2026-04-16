import type { Question, MCQQuestion, MSQQuestion } from '@/types/storage';
import type { AIProvider } from '@/types/Settings';
import { toast } from 'sonner';

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
        url: (q) => `https://x.com/i/grok?text=${q}`,
        badgeBg: 'bg-zinc-900 dark:bg-white',
        btnClass: 'bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 focus:ring-zinc-500',
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
    return [...questionText.matchAll(/!\[.*?\]\((.*?)\)/g)].map(m => m[1]);
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

    if (question.question_type === 'Numerical Answer') {
        const ca = question.correct_answer;
        if (ca.type === 'exact') return String(ca.value);
        if (ca.type === 'multiple') return ca.values.join(', ');
        if (ca.type === 'range') return `between ${ca.min} and ${ca.max}`;
        if (ca.type === 'tolerance') return `${ca.value} ± ${ca.tolerance}`;
        return 'See solution';
    }

    // MCQ or MSQ — correct_answer is an array of option indices
    const q = question as MCQQuestion | MSQQuestion;
    if (!q.options || !Array.isArray(q.correct_answer)) return 'See solution';

    return q.correct_answer
        .map((idx: number) => `${labels[idx] ?? idx}) ${q.options[idx]}`)
        .join(', ');
}

// ---------------------------------------------------------------------------
// Main prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds a rich, structured prompt optimised for GATE exam explanations.
 * Works with any AI provider (ChatGPT, Gemini, Claude, Grok).
 *
 * @param question    The GATE question object.
 * @param hasImages   Pass true when the question contains diagrams — changes the
 *                    image placeholder text to tell the AI to look at the pasted image.
 */
export function buildGateAIPrompt(question: Question, hasImages = false): string {
    const isMCQ = question.question_type !== 'Numerical Answer';
    const q = question as MCQQuestion | MSQQuestion;

    // Replace markdown image syntax with a context-aware placeholder.
    // When hasImages=true the diagram is being sent via clipboard, so we tell
    // the AI to reference the attached image instead of ignoring it.
    const imagePlaceholder = hasImages
        ? '[Diagram attached — refer to the pasted image]'
        : '[Image — diagram not available in text format]';

    const cleanQuestion = question.question
        .replace(/!\[.*?\]\(.*?\)/g, imagePlaceholder)
        .trim();

    const optionsBlock =
        isMCQ && q.options?.length
            ? `\nOPTIONS:\n${labelledOptions(q.options)}\n`
            : '';

    const correctAnswer = resolveCorrectAnswer(question);

    const prompt = `You are an expert GATE exam tutor specialising in ${question.subject}.

QUESTION (GATE ${question.year} | ${question.question_type}):
${cleanQuestion}
${optionsBlock}
CORRECT ANSWER: ${correctAnswer}

Please provide a complete explanation:
1. Short summary — confirm why ${correctAnswer} is correct in 1-2 sentences.
2. Step-by-step reasoning from first principles.
3. Key concepts, theorems, or formulas used (state them explicitly).
4. Why each wrong option is incorrect (for MCQ/MSQ questions).
5. A quick exam tip or memory trick for this topic if applicable.

Keep the explanation student-friendly but thorough — suitable for someone encountering this topic for the first time.`.trim();

    return prompt;
}

// ---------------------------------------------------------------------------
// Deep-link opener — works for all providers
// ---------------------------------------------------------------------------

/** Fallback base URLs when the encoded prompt is too long */
const FALLBACK_URLS: Record<AIProvider, string> = {
    chatgpt: 'https://chatgpt.com/',
    claude:  'https://claude.ai/new',
    grok:    'https://x.com/i/grok',
};

/**
 * Opens the selected AI provider in a new tab with the question pre-filled.
 *
 * Image strategy (when the question has diagrams):
 *   - The TEXT prompt travels via the `?q=` URL param — it is pre-filled
 *     directly into the AI composer without touching the clipboard.
 *   - This leaves the clipboard free to hold the IMAGE blob.
 *   - A toast instructs the user to ⌘V paste the diagram before sending.
 *
 * Long-prompt fallback (encoded length > 8 000 chars):
 *   - Text is copied to clipboard (image clipboard is skipped to avoid conflict).
 *   - The prompt includes a manual note about the diagram URL.
 */
export async function openInAI(question: Question, provider: AIProvider = 'chatgpt'): Promise<void> {
    // Add fallback in case the user has a deprecated provider (like gemini) saved in their local storage settings
    const config   = AI_PROVIDERS[provider] || AI_PROVIDERS['chatgpt'];
    const fallback = FALLBACK_URLS[provider] || FALLBACK_URLS['chatgpt'];

    const imageUrls = extractImageUrls(question.question);
    const hasImages = imageUrls.length > 0;

    // Build the prompt — if we have images, the placeholder tells the AI to
    // reference the attached diagram rather than ignoring it.
    const prompt  = buildGateAIPrompt(question, hasImages);
    const encoded = encodeURIComponent(prompt);

    // ── LONG PROMPT FALLBACK ──────────────────────────────────────────────────
    // Text must go to clipboard; we can't also send the image blob.
    // Append a note about the diagram URL so the user isn't left without context.
    if (encoded.length > 8000) {
        const longPrompt = hasImages
            ? `${prompt}\n\n[NOTE: This question contains a diagram. Please upload it manually from the original question page.]`
            : prompt;

        navigator.clipboard.writeText(longPrompt).finally(() => {
            window.open(fallback, '_blank', 'noopener,noreferrer');
        });

        toast.info(
            hasImages
                ? `Prompt copied! Paste it in ${config.label}, then upload the diagram manually.`
                : `Prompt copied to clipboard — paste it in ${config.label}.`,
            { duration: 6000 }
        );
        return;
    }

    // ── NORMAL PATH ───────────────────────────────────────────────────────────
    // Text travels via URL. If there are images, put the first one on the clipboard.
    if (hasImages) {
        try {
            const res = await fetch(imageUrls[0]);
            if (!res.ok) throw new Error('fetch failed');
            const blob = await res.blob();

            // ClipboardItem API — supported in all modern browsers.
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob }),
            ]);

            // Open the AI app — text is pre-filled from the URL.
            window.open(config.url(encoded), '_blank', 'noopener,noreferrer');

            toast.info(
                `Diagram copied! Paste it (⌘V / Ctrl+V) in the ${config.label} chat before sending.`,
                { duration: 7000 }
            );
        } catch {
            // ClipboardItem unavailable (old browser / non-HTTPS) — open anyway
            // and tell the user to grab the image manually.
            window.open(config.url(encoded), '_blank', 'noopener,noreferrer');
            toast.warning(
                `Question pre-filled in ${config.label}. Couldn't auto-copy the diagram — please upload it manually.`,
                { duration: 7000 }
            );
        }
        return;
    }

    // No images — just open the AI URL, no clipboard needed.
    window.open(config.url(encoded), '_blank', 'noopener,noreferrer');
}

/** @deprecated use buildGateAIPrompt */
export const buildGateChatGPTPrompt = buildGateAIPrompt;

/** @deprecated Use openInAI instead */
export const openInChatGPT = (question: Question): Promise<void> => openInAI(question, 'chatgpt');
