import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

const CACHE_TTL = 1000 * 60 * 60; // 1 hour for the cache after which we will refetch the topics

export interface Topic {
    name: string;
    subjectName: string;
    questionCount: number;
}

interface UseTopicTestGeneratorParams {
    subjectName?: string | undefined;
    requestedQuestionCount: number;
}

interface TopicFromSupabase {
    topic: string;
    question_count: number;
}

export const useTopicTestGenerator = ({
    subjectName,
    requestedQuestionCount,
}: UseTopicTestGeneratorParams) => {
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    // cache helpers
    const getCacheKey = (subject: string) => `topic_counts:${subject}`;

    const readCache = (subject: string) => {
        try {
            const raw = localStorage.getItem(getCacheKey(subject));
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CACHE_TTL) return null;

            return parsed.data as Topic[];
        } catch {
            return null;
        }
    };

    const writeCache = (subject: string, data: Topic[]) => {
        localStorage.setItem(getCacheKey(subject), JSON.stringify({ timestamp: Date.now(), data }));
    };

    // fetch topics from supabase
    const fetchTopics = useCallback(async () => {
        if (!subjectName) return;

        const cached = readCache(subjectName);
        if (cached) {
            setAvailableTopics(cached);
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.rpc('get_topic_counts', {
            p_subject: subjectName,
        });

        if (error) {
            console.error(error);
            setAvailableTopics([]);
        } else {
            const topics: Topic[] = data.map((t: TopicFromSupabase) => ({
                name: t.topic,
                subjectName,
                questionCount: t.question_count,
            }));

            setAvailableTopics(topics);
            writeCache(subjectName, topics);
        }

        setLoading(false);
    }, [subjectName]);

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
        return selectedTopics.reduce((sum, t) => sum + t.questionCount, 0);
    }, [selectedTopics]);

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
