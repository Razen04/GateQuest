import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient.ts';
import type { RevisionQuestion } from '../types/question.ts';
import { getUserProfile } from '../helper.ts';
import { useNavigate } from 'react-router-dom';
import { compress } from 'lz-string';
import { toast } from 'sonner';

export type WeeklySet = {
    success: boolean;
    set_id: string; // UUID
    start_of_week: string; // date string
    status: 'pending' | 'started' | 'expired';
    created_at: string; // timestamptz
    started_at: string | null; // timestamptz
    expires_at: string | null; // timestamptz
    total_questions: number;
    correct_count: number;
    accuracy: number; // numeric(5,2)
    questions: RevisionQuestion[];
    message: string;
};

export type StartWeeklySetResponse = {
    success: boolean;
    set_id: string;
    started_at: string | null;
    expires_at: string | null;
    message: string;
};

const useSmartRevision = () => {
    // Getting the user
    const user = getUserProfile();
    const userId = user?.id;
    const [loading, setLoading] = useState<boolean>(true);
    const [currentSet, setCurrentSet] = useState<WeeklySet | null>(null);
    const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
    const [criticalQuestionsCount, setCriticalQuestionsCount] = useState(0);

    const navigate = useNavigate();

    // Fetch current user and weekly set
    const fetchCurrentSet = useCallback(async () => {
        setLoading(true);
        try {
            // Call RPC to get weekly set
            const { data, error } = await supabase
                .rpc('get_weekly_set')
                .single()
                .overrideTypes<WeeklySet>();

            if (error) throw error;

            if (data?.success) {
                setCurrentSet(data);
                setQuestions(data.questions || []);

                // storing the weekly set info
                localStorage.setItem('weekly_set_info', compress(JSON.stringify(data)));
            } else {
                setCurrentSet(null);
                setQuestions([]);
            }
        } catch (err) {
            console.error('Error fetching weekly set:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Generate a set
    const generateSet = useCallback(async () => {
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('generate_weekly_revision_set');

            if (error) throw error;
            if (data?.success && data?.status === 'existing') {
                toast.message('Already attempted a set this week');
            } else if (data?.success && data?.status === 'created') {
                toast.success(data?.message);
            }
            if (data?.success) {
                fetchCurrentSet();

                // Letting the event to know the whole app that the app has generated revision set
                window.dispatchEvent(new Event('REVISION_UPDATED'));
            }
        } catch (err) {
            console.error('Error generating set', err);
            toast.error('Error generating set.');
        } finally {
            setLoading(false);
        }
    }, [fetchCurrentSet]);

    // Start the set
    const startSet = useCallback(async () => {
        if (!currentSet) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('start_weekly_revision_set', { v_set_id: currentSet.set_id })
                .single()
                .overrideTypes<StartWeeklySetResponse>();

            if (error) throw error;

            if (data?.success) {
                // Update local state with started info
                setCurrentSet({
                    ...currentSet,
                    started_at: data.started_at,
                    expires_at: data.expires_at,
                    status: 'started',
                });
            }

            navigate(`/revision/${currentSet.set_id}`);
        } catch (err) {
            console.error('Error starting set:', err);
        } finally {
            setLoading(false);
        }
    }, [currentSet, navigate]);

    // Find number of critical questions present in the user_incorrect_queue for the user
    const getCriticalQuestionCount = useCallback(async () => {
        if (!userId) return;

        try {
            // Get present week's Sunday (end of week)
            const now = new Date();

            const { error, count } = await supabase
                .from('user_incorrect_queue')
                .select('user_id', { count: 'exact' })
                .eq('user_id', userId)
                .lte('next_review_at', now.toISOString());

            if (error) throw error;

            setCriticalQuestionsCount(count ?? 0);
        } catch (err) {
            console.error('Error fetching critical question count:', err);
        }
    }, [userId]);

    useEffect(() => {
        fetchCurrentSet();
        getCriticalQuestionCount();
    }, [fetchCurrentSet, getCriticalQuestionCount]);

    return {
        loading,
        user,
        currentSet,
        questions,
        generateSet,
        fetchCurrentSet,
        startSet,
        criticalQuestionsCount,
        getCriticalQuestionCount,
    };
};

export default useSmartRevision;
