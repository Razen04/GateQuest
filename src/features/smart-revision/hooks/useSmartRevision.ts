import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { compress } from 'lz-string';
import { toast } from 'sonner';
import { useGoals } from '@/shared/hooks/useGoals';
import type { RevisionQuestion } from '@/shared/types/storage';
import {
    fetchCriticalQuestionCount,
    fetchWeeklySet,
    generateWeeklySet,
    startWeeklySet,
    type WeeklySet,
} from '../api/smartRevision';
import { getUserProfile } from '@/shared/utils/helper';

const useSmartRevision = () => {
    // Getting the user
    const user = getUserProfile();

    const { userGoal, getPracticeSubjects } = useGoals();
    const userId = user?.id;
    const [loading, setLoading] = useState<boolean>(true);
    const [currentSet, setCurrentSet] = useState<WeeklySet | null>(null);
    const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
    const [criticalQuestionsCount, setCriticalQuestionsCount] = useState(0);

    const navigate = useNavigate();

    // Fetch current user and weekly set
    const fetchCurrentSet = useCallback(async () => {
        if (!userId || !userGoal?.branch_id) return;

        setLoading(true);
        try {
            // Call RPC to get weekly set
            const { data, error } = await fetchWeeklySet(userGoal.branch_id);

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
    }, [userGoal?.branch_id, userId]);

    // Generate a set
    const generateSet = useCallback(async () => {
        if (!userGoal?.branch_id) return;

        setLoading(true);
        const activeSubjects = getPracticeSubjects().map((s) => s.id);
        const activeExams = (userGoal?.target_exams as string[])?.map((e) => e.toUpperCase()) || [];

        try {
            const { data, error } = await generateWeeklySet(
                activeSubjects,
                activeExams,
                userGoal?.branch_id,
            );

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
    }, [userGoal?.branch_id, userGoal?.target_exams, getPracticeSubjects, fetchCurrentSet]);

    // Start the set
    const startSet = useCallback(async () => {
        if (!currentSet) return;

        setLoading(true);
        try {
            const { data, error } = await startWeeklySet(currentSet.set_id);

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
            const activeSubjects = getPracticeSubjects().map((s) => s.id);
            const activeExams =
                (userGoal?.target_exams as string[])?.map((e) => e.toUpperCase()) || [];
            const { data: count, error } = await fetchCriticalQuestionCount(
                activeSubjects,
                activeExams,
            );

            if (error) throw error;

            setCriticalQuestionsCount(count ?? 0);
        } catch (err) {
            console.error('Error fetching critical question count:', err);
        }
    }, [userId, getPracticeSubjects, userGoal?.target_exams]);

    useEffect(() => {
        if (userId && userId !== '1') {
            fetchCurrentSet();
            getCriticalQuestionCount();
        }
    }, [fetchCurrentSet, getCriticalQuestionCount, userId]);

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
