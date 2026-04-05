import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';

export const useGenerateAIAnswer = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    // We use a ref to keep track of the active Realtime channel so we can 
    const channelRef = useRef<any>(null);

    // Cleanup listener on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);


    const generateAIAnswer = async (
        questionId: string, 
        onSuccess: (answer: string) => void,
        syncToLocalDB?: (questionId: string, answer: string) => Promise<void> 
    ) => {
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

    
            if (data?.status === 'generating') {
               
                toast.loading("Another user is generating this. Syncing...", { id: `sync-${questionId}` });
                
            
                const channel = supabase
                    .channel(`question-${questionId}`)
                    .on(
                        'postgres_changes',
                        { 
                            event: 'UPDATE', 
                            schema: 'public', 
                            table: 'questions', 
                            filter: `id=eq.${questionId}` 
                        },
                        async (payload) => {
                            const newAnswer = payload.new.answer_text;
                            const isGeneratingFlag = payload.new.is_generating_ai;
                            
                        
                            if (newAnswer && isGeneratingFlag === false) {
                                toast.success("AI Answer Synced!", { id: `sync-${questionId}` }); 
                                onSuccess(newAnswer);
                                
                                if (syncToLocalDB) {
                                    await syncToLocalDB(questionId, newAnswer);
                                }
                                
                                setIsGenerating(false); 
                                supabase.removeChannel(channel); 
                            }
                        }
                    )
                    .subscribe();
                    
                channelRef.current = channel;
                return; 
            }

            if (data?.answer) {
                toast.success("AI Answer Generated!");
                onSuccess(data.answer);
                
                if (syncToLocalDB) {
                    await syncToLocalDB(questionId, data.answer);
                }
                
                setIsGenerating(false);
            } else if (data?.error) {
                toast.error(data.error);
                setIsGenerating(false);
            } else {
                toast.error("Received an invalid or empty response from the server.");
                setIsGenerating(false);
            }
        } catch (e: any) {
             console.error("Network error generating AI answer:", e);
             toast.error("Network error while generating AI answer.");
             setIsGenerating(false);
        }
    };

    return { generateAIAnswer, isGenerating };
};