import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import PageHeader from '@/components/ui/PageHeader';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { containerVariants, itemVariants } from '@/utils/motionVariants';
import { supabase } from '@/utils/supabaseClient';

import TopicsSelection from './TopicsSelection';
import TopicTestConfiguration from './TopicTestConfiguration';
import TopicTestFooter from './TopicTestFooter';

import { useTopicTestGenerator } from '@/hooks/topic-test/useTopicTestGenerator';
import { useGoals } from '@/hooks/useGoals';
import { SubjectIconMap } from '@/helper';

const TopicTestGeneratePage = () => {
    const navigate = useNavigate();
    const { getPracticeSubjects, userGoal } = useGoals();
    const subjects = getPracticeSubjects();

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [questionLimit, setQuestionLimit] = useState<number>(20);
    const [includeAttempted, setIncludeAttempted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const {
        availableTopics,
        selectedTopics,
        poolSize,
        loading,
        warnings,
        canGenerate,
        toggleTopic,
        removeTopic,
    } = useTopicTestGenerator({
        subjectId: selectedSubjectId,
        requestedQuestionCount: questionLimit,
        includeAttempted,
    });

    const finalQuestionCount = useMemo(() => {
        return Math.min(questionLimit, poolSize);
    }, [questionLimit, poolSize]);

    const estimatedTime = Math.ceil(finalQuestionCount * 2.76);

    const handleStartTest = async () => {
        if (!canGenerate) {
            toast.warning('Not enough questions in selected topics.');
            return;
        }

        try {
            setIsGenerating(true);
            const topicFilter = selectedTopics.map((t) => ({
                subject_id: t.subjectId,
                topic: t.name,
            }));

            const { data, error } = await supabase.rpc('generate_topic_test', {
                p_filters: topicFilter,
                p_question_count: finalQuestionCount,
                p_total_seconds: estimatedTime * 60,
                p_already_attempted_questions: includeAttempted,
                p_branch_id: userGoal?.branch_id,
            });

            if (error) throw error;

            navigate(`/topic-test/${data.test_id}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate test.');
        } finally {
            setIsGenerating(false);
        }
    };

    const onBack = () => navigate('/topic-test');

    return (
        <div className="max-h-screen overflow-y-auto flex flex-col text-slate-900 dark:text-slate-100">
            <div className="p-6">
                <button
                    onClick={onBack}
                    className="flex items-center mb-4 hover:text-blue-500 transition-colors"
                >
                    <ArrowLeft className="mr-2" />
                    Back
                </button>

                <PageHeader
                    primaryTitle="Topic"
                    secondaryTitle="Test Generate"
                    caption="Select topics across subjects and build your practice test."
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6"
            >
                {warnings.length > 0 && (
                    <div className="text-sm text-red-500">
                        {warnings.map((w) => (
                            <p key={w}>
                                <span className="font-bold">Warning:</span> {w}
                            </p>
                        ))}
                    </div>
                )}
                <label className="text-sm mb-2 font-semibold uppercase tracking-wide flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <BookIcon className="w-4 h-4 text-blue-500" />
                    Select Subject
                </label>

                <motion.div variants={itemVariants}>
                    <Select
                        onValueChange={(value) => setSelectedSubjectId(value)}
                        value={selectedSubjectId?.toString() || ''}
                    >
                        <SelectTrigger className="w-full md:w-2xl rounded-md">
                            <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            <SelectGroup>
                                <SelectLabel>Subjects</SelectLabel>
                                {subjects.map((s) => {
                                    const SubjectIcon = SubjectIconMap[
                                        s.icon_name || 'default'
                                    ] as React.ElementType;

                                    return (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            <SubjectIcon className="h-4 w-4 mr-2 inline" />
                                            {s.name}
                                        </SelectItem>
                                    );
                                })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </motion.div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 p-6 pb-40"
            >
                <TopicsSelection
                    availableTopics={availableTopics}
                    selectedTopics={selectedTopics}
                    isTopicsLoading={loading}
                    handleTopicToggle={toggleTopic}
                    selectedSubjectId={selectedSubjectId}
                    includeAttempted={includeAttempted}
                />

                <TopicTestConfiguration
                    selectedTopics={selectedTopics}
                    questionLimit={questionLimit}
                    setQuestionLimit={setQuestionLimit}
                    includeAttempted={includeAttempted}
                    setIncludeAttempted={setIncludeAttempted}
                    onRemoveTopic={(topicId: string) => removeTopic(topicId)}
                />
            </motion.div>

            <TopicTestFooter
                estimatedTime={estimatedTime}
                finalQuestionCount={finalQuestionCount}
                selectedTopics={selectedTopics}
                handleStartTest={handleStartTest}
                canGenerate={canGenerate}
                isGenerating={isGenerating}
            />
        </div>
    );
};

export default TopicTestGeneratePage;
