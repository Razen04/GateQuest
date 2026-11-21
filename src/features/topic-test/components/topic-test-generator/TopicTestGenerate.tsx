import { ArrowLeft, ArrowRight, BookIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { useTopicTestGenerator } from '@/features/topic-test/hooks/useTopicTestGenerator';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { Button } from '@/shared/components/ui/button';
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
import type { TestSession } from '@/shared/types/storage';
import { SubjectIconMap } from '@/shared/utils/helper';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { supabase } from '@/shared/utils/supabaseClient';
import { createTestFromPaper, getActiveTest } from '../../api/topicTest';
import ActiveTestBlocker, {
    getActiveTestLabel,
    getActiveTestResumePath,
} from './ActiveTestBlocker';
import MockTestPicker from './MockTestPicker';
import PyqPaperPicker from './PyqPaperPicker';
import TopicsSelection from './TopicsSelection';
import TopicTestConfiguration from './TopicTestConfiguration';
import TopicTestFooter from './TopicTestFooter';

type Mode = 'custom' | 'pyq' | 'mocks';

const isMode = (v: string | null): v is Mode =>
    v === 'custom' || v === 'pyq' || v === 'mocks';

const TopicTestGeneratePage = () => {
    const navigate = useNavigate();
    const userGoal = useGoalStore((s) => s.userGoal);
    const { getPracticeSubjects } = useGoal();
    const subjects = getPracticeSubjects();
    const userId = useAuthStore((s) => s.user?.id);

    const [searchParams, setSearchParams] = useSearchParams();
    const [mode, setModeState] = useState<Mode>(() => {
        const t = searchParams.get('tab');
        return isMode(t) ? t : 'custom';
    });

    // ─── Active-test gate ───────────────────────────────────
    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [activeLoading, setActiveLoading] = useState(true);

    useEffect(() => {
        if (!userId || !userGoal?.branch_id) {
            setActiveLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setActiveLoading(true);
            try {
                const { data } = await getActiveTest(
                    userId,
                    userGoal.branch_id!
                );
                if (!cancelled)
                    setActiveTest((data as unknown as TestSession) ?? null);
            } catch {
                if (!cancelled) setActiveTest(null);
            } finally {
                if (!cancelled) setActiveLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, userGoal?.branch_id]);

    const previewMode =
        searchParams.get('preview') === '1' && activeTest !== null;

    const switchMode = (next: Mode) => {
        setModeState(next);
        const params = new URLSearchParams(searchParams);
        if (next === 'custom') params.delete('tab');
        else params.set('tab', next);
        setSearchParams(params, { replace: true });
    };

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
        null
    );
    const [questionLimit, setQuestionLimit] = useState<number>(20);
    const [includeAttempted, setIncludeAttempted] = useState(false);
    const [recordActivity, setRecordActivity] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
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

    const finalQuestionCount = useMemo(
        () => Math.min(questionLimit, poolSize),
        [questionLimit, poolSize]
    );
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

    const modeBtnClass = (active: boolean) =>
        `px-4 py-2 text-xs font-bold uppercase transition-all ${
            active ? 'bg-card shadow-sm text-chart-1' : 'text-muted-foreground'
        }`;

    // ─── Loading (active test check) ────────────────────────
    if (activeLoading) return <ModernLoader />;

    // ─── Blocked (active test, not preview) ─────────────────
    if (activeTest && !previewMode) {
        return (
            <div className="max-w-7xl mx-auto flex flex-col text-foreground">
                <div className="p-6">
                    <button
                        onClick={onBack}
                        className="flex items-center mb-4 hover:text-chart-1 transition-colors"
                    >
                        <ArrowLeft className="mr-2" />
                        Back
                    </button>
                    <PageHeader
                        primaryTitle="Custom"
                        secondaryTitle="Test Generate"
                        caption="Select topics across subjects and build your practice test."
                    />
                </div>
                <div className="px-6 pb-40">
                    <ActiveTestBlocker activeTest={activeTest} />
                </div>
            </div>
        );
    }

    // ─── Preview banner (preview mode, active test) ─────────
    const resumePath = activeTest
        ? getActiveTestResumePath(activeTest)
        : '/topic-test';
    const resumeLabel = activeTest ? getActiveTestLabel(activeTest) : '';

    const displayedMode: Mode = previewMode ? 'mocks' : mode;

    return (
        <div className="max-w-7xl mx-auto flex flex-col text-foreground">
            <div className="p-6">
                <button
                    onClick={onBack}
                    className="flex items-center mb-4 hover:text-chart-1 transition-colors"
                >
                    <ArrowLeft className="mr-2" />
                    Back
                </button>
                <PageHeader
                    primaryTitle="Custom"
                    secondaryTitle="Test Generate"
                    caption="Select topics across subjects and build your practice test."
                />
            </div>

            {/* Tabs — hidden in preview */}
            {!previewMode && (
                <div className="flex bg-muted/40 border border-border p-1 mx-6 mb-2 w-fit">
                    <button
                        onClick={() => switchMode('custom')}
                        className={modeBtnClass(mode === 'custom')}
                    >
                        Custom
                    </button>
                    <button
                        onClick={() => switchMode('pyq')}
                        className={modeBtnClass(mode === 'pyq')}
                    >
                        PYQ Mock
                    </button>
                    <button
                        onClick={() => switchMode('mocks')}
                        className={modeBtnClass(mode === 'mocks')}
                    >
                        Quest Mocks
                    </button>
                </div>
            )}

            {/* Preview banner */}
            {previewMode && (
                <div className="mx-6 mb-4 border border-chart-4/30 bg-chart-4/5 p-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-foreground">
                        <strong>Preview only</strong> — you have an ongoing test
                        {resumeLabel && (
                            <span className="text-muted-foreground">
                                {' '}
                                ({resumeLabel})
                            </span>
                        )}
                        . Finish it to start a new one.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate(resumePath)}
                        className="rounded-none"
                    >
                        Resume Test
                        <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                </div>
            )}

            {/* Custom mode */}
            {displayedMode === 'custom' && (
                <>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="px-6"
                    >
                        {warnings.length > 0 && (
                            <div className="text-sm text-destructive">
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

                        <label className="text-sm mb-2 font-semibold uppercase tracking-wide flex items-center gap-2 text-foreground">
                            <BookIcon className="w-4 h-4 text-chart-1" />
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
            )}

            {/* PYQ mode */}
            {displayedMode === 'pyq' && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 p-6 pb-40"
                >
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                        <div>
                            <p className="text-sm font-medium">
                                Record Test Activity
                            </p>
                            <span className="text-xs text-muted-foreground">
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

            {/* Mocks mode */}
            {displayedMode === 'mocks' && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 p-6 pb-40"
                >
                    <MockTestPicker />
                </motion.div>
            )}

            {/* Footers — only for custom + pyq in normal mode */}
            {!previewMode && displayedMode === 'custom' && (
                <TopicTestFooter
                    estimatedTime={estimatedTime}
                    finalQuestionCount={finalQuestionCount}
                    handleStartTest={handleStartTest}
                    canGenerate={canGenerate}
                    isGenerating={isGenerating}
                />
            )}
            {!previewMode && displayedMode === 'pyq' && (
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
