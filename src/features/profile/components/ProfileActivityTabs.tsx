import { CheckCircle, Clock, ClockIcon, XCircle } from '@phosphor-icons/react';
import { formatDistanceToNowStrict } from 'date-fns';
import { type JSX, lazy, Suspense, useState } from 'react';

const MathRenderer = lazy(
    () => import('@/features/questions/components/Renderers/MathRenderer')
);

import ModernLoader from '@/shared/components/ModernLoader';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/shared/components/ui/tabs';
import { formatTime } from '@/shared/utils/helper';
import { glassPanel } from '../styles/profileTheme';
import type { ProfileData } from '../types/profile';
import { accuracyTextColor } from '../utils';

type AttemptStatus = 'Correct' | 'Wrong' | 'Skipped';

const STATUS_CFG: Record<AttemptStatus, { icon: JSX.Element; cls: string }> = {
    Correct: {
        icon: <CheckCircle size={15} weight="fill" />,
        cls: 'text-chart-2',
    },
    Wrong: {
        icon: <XCircle size={15} weight="fill" />,
        cls: 'text-destructive',
    },
    Skipped: {
        icon: <Clock size={15} weight="fill" />,
        cls: 'text-muted-foreground',
    },
};

const TYPE_LABEL: Record<string, string> = {
    'multiple-choice': 'MCQ',
    'multiple-select': 'MSQ',
    numerical: 'NAT',
};

const TYPE_CLASS: Record<string, string> = {
    'multiple-choice': 'border-chart-1/25 bg-chart-1/[0.08] text-chart-1',
    'multiple-select': 'border-chart-6/25 bg-chart-6/[0.08] text-chart-6',
    numerical: 'border-chart-5/25 bg-chart-5/[0.08] text-chart-5',
};

interface ProfileActivityTabsProps {
    recentHistory: ProfileData['recent_history'];
    examStats: ProfileData['exam_stats'];
}

export default function ProfileActivityTabs({
    recentHistory,
    examStats,
}: ProfileActivityTabsProps) {
    const [currentTab, setCurrentTab] = useState<string>('history');

    const availableExams = Object.keys(examStats || {});
    const [selectedExam, setSelectedExam] = useState<string>(
        availableExams[0] || 'gate'
    );

    const subjects = examStats?.[selectedExam]?.subjects || [];

    return (
        <div className={glassPanel}>
            <Tabs
                value={currentTab}
                onValueChange={setCurrentTab}
                className="w-full"
            >
                <div className="flex items-center justify-between overflow-x-auto border-b border-border px-2">
                    <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
                        <TabsTrigger
                            value="history"
                            className="rounded-none border-b-2 border-transparent px-3 py-3.5 text-xs font-medium text-muted-foreground data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:text-chart-1 sm:px-4"
                        >
                            Recent attempts
                        </TabsTrigger>
                        <TabsTrigger
                            value="subjects"
                            className="rounded-none border-b-2 border-transparent px-3 py-3.5 text-xs font-medium text-muted-foreground data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:text-chart-1 sm:px-4"
                        >
                            By subject
                        </TabsTrigger>
                    </TabsList>

                    <span className="hidden pr-4 font-['JetBrains_Mono',monospace] text-[10px] text-muted-foreground sm:block">
                        {currentTab === 'history'
                            ? `Last ${recentHistory.length} attempts`
                            : `${subjects.length} subjects in ${selectedExam.toUpperCase()}`}
                    </span>
                </div>

                <TabsContent value="history" className="m-0">
                    <div className="divide-y divide-border">
                        {recentHistory.length === 0 && (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No recent activity found.
                            </div>
                        )}

                        {recentHistory.map((item) => {
                            const attemptStatus: AttemptStatus =
                                item.was_correct === true
                                    ? 'Correct'
                                    : item.was_correct === false
                                      ? 'Wrong'
                                      : 'Skipped';
                            const st = STATUS_CFG[attemptStatus];
                            const typeClass =
                                TYPE_CLASS[item.question_type] ||
                                TYPE_CLASS['multiple-choice'];

                            return (
                                <div
                                    key={item.question_id + item.attempted_at}
                                    className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40 sm:px-5"
                                >
                                    <span
                                        className={`mt-0.5 shrink-0 ${st.cls}`}
                                    >
                                        {st.icon}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/80 group-hover:text-foreground">
                                            <Suspense
                                                fallback={<ModernLoader />}
                                            >
                                                <MathRenderer
                                                    text={item.question_text}
                                                />
                                            </Suspense>
                                        </p>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <Badge className="rounded-none h-5 border border-border bg-muted text-[11px] text-muted-foreground">
                                                {item.subject_name}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="rounded-none h-5 border-border text-[11px] font-mono"
                                            >
                                                {item.exam_year}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="rounded-none h-5 border-border text-[11px]"
                                            >
                                                {item.marks} Marks
                                            </Badge>
                                            {item.time_taken && (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-none h-5 gap-1 border-border text-[11px] font-mono"
                                                >
                                                    <ClockIcon
                                                        size={12}
                                                        className="text-muted-foreground"
                                                    />
                                                    {formatTime(
                                                        item.time_taken
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <span
                                            className={`border px-1.5 py-0.5 text-[10px] font-semibold ${typeClass}`}
                                        >
                                            {TYPE_LABEL[item.question_type] ||
                                                'MCQ'}
                                        </span>
                                        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-muted-foreground/70">
                                            {formatDistanceToNowStrict(
                                                new Date(item.attempted_at),
                                                {
                                                    addSuffix: true,
                                                }
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="subjects" className="m-0">
                    {availableExams.length > 1 && (
                        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                            <span className="text-xs text-muted-foreground">
                                Target:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {availableExams.map((exam) => (
                                    <Button
                                        key={exam}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedExam(exam)}
                                        className={`uppercase rounded-none ${
                                            selectedExam === exam
                                                ? 'bg-chart-1 text-white'
                                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    >
                                        {exam}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-border">
                        {subjects.length === 0 && (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No subject progress found.
                            </div>
                        )}

                        {subjects.map((s) => (
                            <div
                                key={s.subject_slug}
                                className="border-b border-border px-4 py-4 last:border-b-0"
                            >
                                {/* Header */}
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="truncate text-sm font-medium text-foreground">
                                        {s.subject_name}
                                    </h3>

                                    <span
                                        className={`text-xs font-semibold ${accuracyTextColor(
                                            s.accuracy
                                        )}`}
                                    >
                                        {s.accuracy}% Accuracy
                                    </span>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{s.progress}%</span>
                                    </div>

                                    <div className="h-1 bg-muted">
                                        <div
                                            className="h-full bg-chart-1"
                                            style={{ width: `${s.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Correct
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground">
                                            {s.correct}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Attempted
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground">
                                            {s.attempted}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Total
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground">
                                            {s.total_available}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
