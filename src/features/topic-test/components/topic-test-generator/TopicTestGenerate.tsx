import { ArrowLeft, BookIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { useTopicTestGenerator } from '@/features/topic-test/hooks/useTopicTestGenerator';
import PageHeader from '@/shared/components/PageHeader';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import useGoal from '@/shared/hooks/useGoal';
import type { PyqPaper } from '@/shared/types/pyq';
import { SubjectIconMap } from '@/shared/utils/helper';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { supabase } from '@/shared/utils/supabaseClient';
import { createTestFromPaper } from '../../api/topicTest';
import PyqPaperPicker from './PyqPaperPicker';
import TopicsSelection from './TopicsSelection';
import TopicTestConfiguration from './TopicTestConfiguration';
import TopicTestFooter from './TopicTestFooter';

const TopicTestGeneratePage = () => {
    const navigate = useNavigate();
    const userGoal = useGoalStore((s) => s.userGoal);
    const { getPracticeSubjects } = useGoal();
    const subjects = getPracticeSubjects();

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
        null
    );
    const [questionLimit, setQuestionLimit] = useState<number>(20);
    const [includeAttempted, setIncludeAttempted] = useState(false);
    const [recordActivity, setRecordActivity] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const [mode, setMode] = useState<'custom' | 'pyq'>('custom');
    const [selectedPaper, setSelectedPaper] = useState<PyqPaper | null>(null);

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
                p_record_activity: recordActivity,
            });

            if (error) throw error;

            navigate(`/topic-test/${data?.test_id}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate test.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartPyq = async () => {
        if (!selectedPaper || !userGoal?.branch_id) return;

        if (selectedPaper.branch === 'XL') {
            const optionals = userGoal.additional_subjects ?? [];
            if (optionals.length !== 2) {
                toast.warning(
                    'Set two optional subjects in your goal before starting an XL mock.'
                );
                return;
            }
        }

        try {
            setIsGenerating(true);
            const optionalSubjectIds =
                selectedPaper.branch === 'XL'
                    ? (userGoal.additional_subjects as string[])
                    : [];
            const { data, error } = await createTestFromPaper(
                selectedPaper,
                userGoal.branch_id,
                recordActivity,
                optionalSubjectIds
            );
            if (error) throw error;
            if (data?.status === 'active_exists') {
                toast.warning('Finish your active test first.');
                navigate(`/topic-test/${data.test_id}`);
                return;
            }
            navigate(`/topic-test/${data?.test_id}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to create paper test.');
        } finally {
            setIsGenerating(false);
        }
    };

    const onBack = () => navigate('/topic-test');

    return (
        <div className="max-w-7xl mx-auto flex flex-col text-slate-900 dark:text-slate-100">
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

            <div className="flex bg-white/20 dark:bg-white/[0.05] border border-white/20 p-1 mx-6 mb-2 w-fit">
                <button
                    onClick={() => setMode('custom')}
                    className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                        mode === 'custom'
                            ? 'bg-white/70 dark:bg-white/10 shadow-sm text-blue-500'
                            : 'text-slate-500'
                    }`}
                >
                    Custom
                </button>
                <button
                    onClick={() => setMode('pyq')}
                    className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                        mode === 'pyq'
                            ? 'bg-white/70 dark:bg-white/10 shadow-sm text-blue-500'
                            : 'text-slate-500'
                    }`}
                >
                    PYQ Mock
                </button>
            </div>

            {mode === 'custom' ? (
                <>
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
                                        <span className="font-bold">
                                            Warning:
                                        </span>{' '}
                                        {w}
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
                                onValueChange={(value) =>
                                    setSelectedSubjectId(value)
                                }
                                value={selectedSubjectId?.toString() || ''}
                            >
                                <SelectTrigger className="w-full md:w-2xl rounded-none">
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectGroup>
                                        <SelectLabel>Subjects</SelectLabel>
                                        {subjects.map((s) => {
                                            const SubjectIcon = SubjectIconMap[
                                                s.icon_name || 'default'
                                            ] as React.ElementType;

                                            return (
                                                <SelectItem
                                                    className="rounded-none"
                                                    key={s.id}
                                                    value={s.id.toString()}
                                                >
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
                            onRemoveTopic={(topicId: string) =>
                                removeTopic(topicId)
                            }
                            recordActivity={recordActivity}
                            setRecordActivity={setRecordActivity}
                        />
                    </motion.div>
                </>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 p-6 pb-40"
                >
                    <div className="flex items-center justify-between border-b border-white/20 dark:border-white/10 pb-4 mb-4">
                        <div>
                            <p className="text-sm font-medium">
                                Record Test Activity
                            </p>
                            <span className="text-xs text-gray-400">
                                Include this test in your dashboard stats.
                            </span>
                        </div>

                        <ToggleSwitch
                            isOn={recordActivity}
                            onToggle={() => setRecordActivity((v) => !v)}
                        />
                    </div>

                    <PyqPaperPicker
                        selectedPaper={selectedPaper}
                        onSelect={setSelectedPaper}
                    />
                </motion.div>
            )}

            {mode === 'custom' ? (
                <TopicTestFooter
                    estimatedTime={estimatedTime}
                    finalQuestionCount={finalQuestionCount}
                    handleStartTest={handleStartTest}
                    canGenerate={canGenerate}
                    isGenerating={isGenerating}
                />
            ) : (
                <TopicTestFooter
                    estimatedTime={selectedPaper?.durationMinutes ?? 0}
                    finalQuestionCount={selectedPaper?.questionCount ?? 0}
                    handleStartTest={handleStartPyq}
                    canGenerate={
                        !!selectedPaper &&
                        (selectedPaper.branch !== 'XL' ||
                            (userGoal?.additional_subjects?.length ?? 0) === 2)
                    }
                    isGenerating={isGenerating}
                    buttonLabel="Start Mock"
                    subtitle={selectedPaper?.label}
                />
            )}
        </div>
    );
};

export default TopicTestGeneratePage;
