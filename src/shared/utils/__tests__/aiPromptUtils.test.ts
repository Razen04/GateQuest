import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'sonner';
import type { MCQQuestion } from '@/shared/types/storage';
import { buildGateAIPrompt, extractImageUrls, openInAI } from '../aiPromptUtils';

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('aiPromptUtils', () => {
    const mockQuestionTemplate: MCQQuestion = {
        id: 'test-id',
        question_type: 'multiple-choice',
        year: 2024,
        question_number: 1,
        subject: 'Computer Science',
        subject_id: 'cs',
        question: 'What is 1+1?',
        options: ['1', '2', '3', '4'],
        correct_answer: [1],
        difficulty: 'Easy',
        marks: 1,
        source_url: '',
        verified: true,
        answer_text: '',
        explanation: '',
        metadata: { set: '', exam: '', paperType: '', language: '' },
        created_at: '',
        updated_at: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock window.open
        Object.defineProperty(window, 'open', { value: vi.fn(), writable: true });

        // Mock Navigator Clipboard
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
                write: vi.fn().mockResolvedValue(undefined),
            },
            writable: true,
        });

        const MockClipboardItem = vi.fn().mockImplementation((obj) => obj);
        (MockClipboardItem as unknown as any).supports = vi.fn().mockReturnValue(true);

        vi.stubGlobal('ClipboardItem', MockClipboardItem);

        // Mock HTML Canvas and Image context for stitching
        // Note: In a real test environment, you might need 'jest-canvas-mock'
        // but for unit tests, we mock the specific failure/success triggers.
        const mockCanvas = {
            getContext: vi.fn().mockReturnValue({
                fillRect: vi.fn(),
                drawImage: vi.fn(),
                fillStyle: '',
            }),
            toBlob: vi.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
            width: 0,
            height: 0,
        };
        vi.stubGlobal('document', {
            createElement: vi.fn().mockReturnValue(mockCanvas),
        });
    });

    describe('extractImageUrls', () => {
        it('extracts multiple image URLs correctly', () => {
            const text = '![img1](url1.png) and ![img2](url2.png)';
            expect(extractImageUrls(text)).toEqual(['url1.png', 'url2.png']);
        });
    });

    describe('buildGateAIPrompt', () => {
        it('includes correctly formatted doubt when provided', () => {
            const prompt = buildGateAIPrompt(
                mockQuestionTemplate,
                0,
                undefined,
                'My specific doubt',
            );
            expect(prompt).toContain("USER'S SPECIFIC DOUBT:");
            expect(prompt).toContain('"My specific doubt"');
        });

        it('uses correct placeholders based on imageCount', () => {
            const q = {
                ...mockQuestionTemplate,
                question: 'Here is the image: ![](test.url)',
            };
            expect(buildGateAIPrompt(q, 0)).toContain('[Image — diagram not available]');
            expect(buildGateAIPrompt(q, 1)).toContain(
                '[Diagram attached — refer to the pasted image]',
            );
            expect(buildGateAIPrompt(q, 2)).toContain(
                '[Diagrams attached — refer to pasted images]',
            );
        });
    });

    describe('openInAI', () => {
        it('opens deep-link directly for short text-only prompts', async () => {
            await openInAI(mockQuestionTemplate, 'chatgpt', '');
            expect(window.open).toHaveBeenCalledWith(
                expect.stringContaining('https://chatgpt.com/?q='),
                '_blank',
                expect.any(String),
            );
        });

        it('falls back to clipboard for very long text-only prompts', async () => {
            const longQ = { ...mockQuestionTemplate, question: 'A'.repeat(8500) };
            await openInAI(longQ, 'chatgpt', '');

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            expect(window.open).toHaveBeenCalledWith(
                'https://chatgpt.com/',
                '_blank',
                expect.any(String),
            );
            expect(toast.info).toHaveBeenCalledWith('Prompt copied to clipboard!');
        });

        it('triggers image stitching flow and composite clipboard when images exist', async () => {
            const imgQ = { ...mockQuestionTemplate, question: '![alt](test.png)' };

            // Mock Image loading success
            vi.stubGlobal(
                'Image',
                vi.fn().mockImplementation(() => {
                    const img = {
                        onload: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                        set src(_s: string) {
                            setTimeout(() => {
                                if (this.onload) this.onload();
                                if (this.onerror) this.onerror();
                            }, 0);
                        },
                        width: 100,
                        height: 100,
                    };
                    return img;
                }),
            );

            await openInAI(imgQ, 'chatgpt', '');

            // Should use navigator.clipboard.write (Composite) not writeText
            expect(navigator.clipboard.write).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('Prompt & Diagrams copied!'),
            );
            // Should redirect to base URL (no query params) to prevent auto-send
            expect(window.open).toHaveBeenCalledWith(
                'https://chatgpt.com/',
                '_blank',
                expect.any(String),
            );
        });

        it('gracefully falls back to text-only if stitching/CORS fails', async () => {
            const imgQ = { ...mockQuestionTemplate, question: '![alt](test.png)' };

            // Mock Image loading failure (CORS)
            vi.stubGlobal(
                'Image',
                vi.fn().mockImplementation(() => {
                    const img = {
                        set onerror(cb: () => void) {
                            setTimeout(cb, 0);
                        },
                        set src(_s: string) {},
                    };
                    return img;
                }),
            );

            await openInAI(imgQ, 'chatgpt', '');

            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            expect(toast.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Prompt copied! Note: Diagrams couldn't be auto-copied. Please right-click the image and 'Copy Image' manually.",
                ),
                expect.objectContaining({ duration: 10000 }),
            );
        });
    });
});
