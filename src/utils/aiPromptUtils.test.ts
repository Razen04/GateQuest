import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractImageUrls, buildGateAIPrompt, openInAI } from './aiPromptUtils';
import type { MCQQuestion } from '@/types/storage';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    }
}));

describe('aiPromptUtils', () => {
    const mockQuestionTemplate: MCQQuestion = {
        id: 'test-id',
        question_type: 'Multiple Choice Question',
        year: 2024,
        question_number: 1,
        subject: 'Computer Science',
        subject_id: 'cs',
        question: 'What is the sum of 1+1?',
        options: ['1', '2', '3', '4'],
        correct_answer: [1], // Index 1 is option B
        difficulty: 'Easy',
        marks: 1,
        source_url: '',
        verified: true,
        answer_text: '',
        explanation: '',
        metadata: { set: '', exam: '', paperType: '', language: '' },
        created_at: '',
        updated_at: ''
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup global window properties for testing
        Object.defineProperty(window, 'open', {
            value: vi.fn(),
            writable: true
        });

        // Setup mock clipboard
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
                write: vi.fn().mockResolvedValue(undefined),
            },
            writable: true
        });

        // Setup mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/png' }))
        });

        // Mock ClipboardItem
        global.ClipboardItem = vi.fn() as any;
    });

    describe('extractImageUrls', () => {
        it('returns empty array when no images exist', () => {
            expect(extractImageUrls('Plain text question')).toEqual([]);
        });

        it('extracts a single image URL', () => {
            const text = 'Question statement\n![alt1](https://example.com/img1.png)\nEnd of question.';
            expect(extractImageUrls(text)).toEqual(['https://example.com/img1.png']);
        });

        it('extracts multiple image URLs', () => {
            const text = '![img1](url1.png) and ![img2](url2.png)';
            expect(extractImageUrls(text)).toEqual(['url1.png', 'url2.png']);
        });
    });

    describe('buildGateAIPrompt', () => {
        it('builds standard prompt without images correctly', () => {
            const q = { ...mockQuestionTemplate };
            const prompt = buildGateAIPrompt(q);
            
            expect(prompt).toContain('expert GATE exam tutor');
            expect(prompt).toContain('Computer Science');
            expect(prompt).toContain('What is the sum of 1+1?');
            expect(prompt).toContain('OPTIONS:\nA) 1\nB) 2\nC) 3\nD) 4');
            expect(prompt).toContain('CORRECT ANSWER: B) 2');
        });

        it('removes image markdown in default mode (imageCount = 0)', () => {
            const q = { ...mockQuestionTemplate, question: 'Look here ![alt](img.png).' };
            const prompt = buildGateAIPrompt(q);
            
            expect(prompt).toContain('Look here [Image — diagram not available in text format].');
            expect(prompt).not.toContain('![alt](img.png)');
        });

        it('uses alternative placeholder when imageCount = 1', () => {
            const q = { ...mockQuestionTemplate, question: 'Look here ![alt](img.png).' };
            const prompt = buildGateAIPrompt(q, 1);
            
            expect(prompt).toContain('[Diagram attached — refer to the pasted image]');
        });

        it('uses multiple images placeholder when imageCount > 1', () => {
            const q = { ...mockQuestionTemplate, question: 'Look here ![alt](img.png) and ![alt2](img2.png).' };
            const prompt = buildGateAIPrompt(q, 2);
            
            expect(prompt).toContain('[Diagram attached — refer to the pasted images (the first was copied to your clipboard, the rest must be uploaded manually)]');
        });
    });

    describe('openInAI', () => {
        it('opens external URL correctly without images', async () => {
            await openInAI(mockQuestionTemplate, 'chatgpt');
            
            expect(window.open).toHaveBeenCalledTimes(1);
            const callArgs = (window.open as any).mock.calls[0];
            expect(callArgs[0]).toContain('https://chatgpt.com/?q=');
            expect(navigator.clipboard.write).not.toHaveBeenCalled();
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });

        it('handles text-to-clipboard fallback for long prompts', async () => {
            const longQuestionText = 'A'.repeat(9000);
            const longQ = { ...mockQuestionTemplate, question: longQuestionText };
            
            await openInAI(longQ, 'chatgpt');
            
            expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
            const textWritten = (navigator.clipboard.writeText as any).mock.calls[0][0];
            expect(textWritten).toContain(longQuestionText);
            
            expect(toast.info).toHaveBeenCalledWith(
                expect.stringContaining('Prompt copied to clipboard'),
                expect.any(Object)
            );
        });

        it('processes diagrams by copying image to clipboard', async () => {
            const imageQ = { ...mockQuestionTemplate, question: 'Question ![diag](https://a.com/b.png)' };
            
            await openInAI(imageQ, 'claude');
            
            expect(global.fetch).toHaveBeenCalledWith('https://a.com/b.png');
            expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);
            expect(window.open).toHaveBeenCalledTimes(1);
            expect(toast.info).toHaveBeenCalledWith(
                expect.stringContaining('Diagram copied! Paste it'),
                expect.any(Object)
            );
            
            // The prompt query parameter should include the special diagram placeholder
            const url = (window.open as any).mock.calls[0][0];
            const decoded = decodeURIComponent(url);
            expect(decoded).toContain('[Diagram attached — refer to the pasted image]');
        });

        it('handles fetch failing during image processing', async () => {
            const imageQ = { ...mockQuestionTemplate, question: 'Question ![diag](https://a.com/b.png)' };
            
            // Override fetch to fail
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
            
            await openInAI(imageQ, 'chatgpt');
            
            expect(navigator.clipboard.write).not.toHaveBeenCalled();
            expect(window.open).toHaveBeenCalledTimes(1);
            expect(toast.warning).toHaveBeenCalledWith(
                expect.stringContaining('Couldn\'t auto-copy the diagram'),
                expect.any(Object)
            );
        });

        it('handles multiple images gracefully', async () => {
            const imageQ = { ...mockQuestionTemplate, question: 'Question ![diag](https://a.com/b.png) ![diag2](https://a.com/c.png)' };
            
            await openInAI(imageQ, 'chatgpt');
            
            expect(global.fetch).toHaveBeenCalledWith('https://a.com/b.png');
            expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);
            expect(toast.info).toHaveBeenCalledWith(
                expect.stringContaining('First diagram copied!'),
                expect.any(Object)
            );

            const url = (window.open as any).mock.calls[0][0];
            const decoded = decodeURIComponent(url);
            expect(decoded).toContain('copied to your clipboard, the rest must be uploaded');
        });

        it('handles long prompts with images by writing text, not image, with note', async () => {
             const longQuestionText = 'A'.repeat(9000) + '![diag](img.png)';
             const longQ = { ...mockQuestionTemplate, question: longQuestionText };
             
             await openInAI(longQ, 'chatgpt');

             expect(navigator.clipboard.write).not.toHaveBeenCalled();
             expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
             const textWritten = (navigator.clipboard.writeText as any).mock.calls[0][0];
             expect(textWritten).toContain('[Diagram attached — refer to the pasted image]');
             expect(textWritten).toContain('[NOTE: This question contains a diagram. Please upload it manually from the original question page.]');
        });
    });
});
