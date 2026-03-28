import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';

export const useGenerateAIAnswer = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateAIAnswer = async (questionId: string, onSuccess: (answer: string) => void) => {
        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-ai-answer', {
                body: { question_id: questionId }
            });

            if (error) {
                console.error("AI Generation Error from Function:", error);
                toast.error("Failed to generate answer. Admin has been notified.");
                setIsGenerating(false);
                return;
            }

            if (data?.answer) {
                toast.success("AI Answer Generated!");
                onSuccess(data.answer);
            } else if (data?.error) {
                toast.error(data.error);
            }
        } catch (e: any) {
             console.error("Network error generating AI answer:", e);
             toast.error("Network error while generating AI answer.");
        } finally {
            setIsGenerating(false);
        }
    };

    return { generateAIAnswer, isGenerating };
};
