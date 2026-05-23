export const DEFAULT_TEMPLATE = `You are an expert GATE exam tutor specialising in {{SUBJECT}}.

QUESTION (GATE {{YEAR}} | {{TYPE}}):
{{QUESTION_TEXT}}
{{OPTIONS}}
CORRECT ANSWER: {{CORRECT_ANSWER}}

Please provide a complete explanation:
1. Short summary — confirm why {{CORRECT_ANSWER}} is correct in 1-2 sentences.
2. Step-by-step reasoning from first principles.
3. Key concepts, theorems, or formulas used (state them explicitly).
4. Why each wrong option is incorrect (for MCQ/MSQ questions).
5. A quick exam tip or memory trick for this topic if applicable.

{{DOUBT}}

Keep the explanation student-friendly but thorough — suitable for someone encountering this topic for the first time.`;
