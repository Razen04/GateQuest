import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';
import { useGoals } from '@/shared/hooks/useGoals';

const CACHE_TTL = 1000 * 60 * 60; // 1 hour for the cache after which we will refetch the topics

export interface Topic {
    name: string;
    subjectName: string;
    subjectId: string;
    questionCount: number;
    unattemptedCount: number;
}

interface UseTopicTestGeneratorParams {
    subjectId: string | null;
    requestedQuestionCount: number;
    includeAttempted: boolean;
}

interface TopicFromSupabase {
    topic: string;
    question_count: number;
    unattempted_count: number;
}

export const useTopicTestGenerator = ({
    subjectId,
    requestedQuestionCount,
    includeAttempted,
}: UseTopicTestGeneratorParams) => {
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    const { getPracticeSubjects } = useGoals();

    const subjects = getPracticeSubjects();
    const subjectName = subjects.find((s) => s.id === subjectId)?.name;

    // cache helpers
    const getCacheKey = (id: string) => `topic_counts:${id}`;

    const readCache = useCallback((subject: string) => {
        try {
            const raw = localStorage.getItem(getCacheKey(subject));
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CACHE_TTL) return null;

            return parsed.data as Topic[];
        } catch {
            return null;
        }
    }, []);

    const writeCache = useCallback((subject: string, data: Topic[]) => {
        localStorage.setItem(getCacheKey(subject), JSON.stringify({ timestamp: Date.now(), data }));
    }, []);

    // fetch topics from supabase
    const fetchTopics = useCallback(async () => {
        if (!subjectId) return;

        const cached = readCache(subjectId);
        if (cached) {
            setAvailableTopics(cached);
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.rpc('get_topic_counts', {
            p_subject_id: subjectId,
        });

        console.log('Data: ', data);

        if (error) {
            console.error(error);
            setAvailableTopics([]);
        } else {
            const topics: Topic[] = data.map((t: TopicFromSupabase) => ({
                name: t.topic,
                subjectName,
                subjectId,
                questionCount: t.question_count,
                unattemptedCount: t.unattempted_count,
            }));

            console.log('Topics: ', topics);

            setAvailableTopics(topics);
            writeCache(subjectId, topics);
        }

        setLoading(false);
    }, [subjectId, subjectName, readCache, writeCache]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    // topics selection
    const toggleTopic = (topic: Topic) => {
        setSelectedTopics((prev) => {
            const exists = prev.find(
                (t) => t.name === topic.name && t.subjectName === topic.subjectName,
            );

            if (exists) {
                return prev.filter(
                    (t) => !(t.name === topic.name && t.subjectName === topic.subjectName),
                );
            }

            return [...prev, topic];
        });
    };

    const removeTopic = (topicName: string) => {
        setSelectedTopics((prev) => prev.filter((t) => !(t.name === topicName)));
    };

    const clearSelection = () => setSelectedTopics([]);

    // state to track the minimum questionCount requirement
    const poolSize = useMemo(() => {
        return selectedTopics.reduce((sum, t) => {
            // If includeAttempted is false, use unattemptedCount
            return sum + (includeAttempted ? t.questionCount : t.unattemptedCount);
        }, 0);
    }, [selectedTopics, includeAttempted]);

    const canGenerate = poolSize >= requestedQuestionCount;

    useEffect(() => {
        const w: string[] = [];

        if (poolSize < requestedQuestionCount) {
            w.push(`Selected topics contain only ${poolSize}/${requestedQuestionCount} questions.`);
        }

        setWarnings(w);
    }, [poolSize, requestedQuestionCount]);

    return {
        availableTopics,
        selectedTopics,
        poolSize,
        loading,
        warnings,
        canGenerate,

        toggleTopic,
        removeTopic,
        clearSelection,
        refreshCache: fetchTopics,
    };
};
