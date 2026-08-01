import { useState, type JSX } from 'react';
import { CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { formatDistanceToNowStrict, formatDuration } from 'date-fns'; // 👈 Swapped to date-fns!
import type { ProfileData } from '../types/profile';
import { Card } from '@/shared/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { accuracyColor, accuracyTextColor } from '../utils';
import { Badge } from '@/shared/components/ui/badge';
import MathRenderer from '@/features/questions/components/Renderers/MathRenderer';
import { ClockIcon } from '@phosphor-icons/react';
import { formatTime } from '@/shared/utils/helper';

type AttemptStatus = 'Correct' | 'Wrong' | 'Skipped';

const STATUS_CFG: Record<AttemptStatus, { icon: JSX.Element; cls: string }> = {
    Correct: {
        icon: <CheckCircle size={15} weight="fill" />,
        cls: 'text-emerald-500',
    },
    Wrong: { icon: <XCircle size={15} weight="fill" />, cls: 'text-red-500' },
    Skipped: { icon: <Clock size={15} weight="fill" />, cls: 'text-slate-400' },
};

// Fixed to map your exact string payload values
const TYPE_CLS: Record<string, string> = {
    'multiple-choice':
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    'multiple-select':
        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    numerical:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
};

interface ProfileActivityTabsProps {
    recentHistory: ProfileData['recent_history'];
    subjects: ProfileData['exam_stats'][string]['subjects'];
}

export default function ProfileActivityTabs({ recentHistory, subjects }: ProfileActivityTabsProps) {
    const [currentTab, setCurrentTab] = useState<string>('history');

    return (
        <Card className="rounded-md p-0">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <div className="flex border-b border-slate-100 dark:border-slate-700 px-2 items-center justify-between overflow-x-auto">
                    <TabsList className="bg-transparent h-auto p-0 gap-1 rounded-none">
                        <TabsTrigger
                            value="history"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-none px-3 sm:px-4 py-3.5 text-xs font-medium text-slate-400 dark:text-slate-500"
                        >
                            Recent Attempts
                        </TabsTrigger>
                        <TabsTrigger
                            value="subjects"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-blue-500 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-none px-3 sm:px-4 py-3.5 text-xs font-medium text-slate-400 dark:text-slate-500"
                        >
                            By Subject
                        </TabsTrigger>
                    </TabsList>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 pr-4 font-['JetBrains_Mono',monospace] hidden sm:block">
                        {currentTab === 'history'
                            ? `${recentHistory.length} attempts`
                            : `${subjects.length} subjects`}
                    </span>
                </div>

                <TabsContent value="history" className="m-0 focus-visible:outline-none">
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {recentHistory.length === 0 && (
                            <div className="p-8 text-center text-sm text-slate-500">
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

                            return (
                                <div
                                    key={item.question_id + item.attempted_at}
                                    className="flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group cursor-pointer"
                                >
                                    <span className={`shrink-0 mt-0.5 ${st.cls}`}>{st.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 leading-snug">
                                            <MathRenderer text={item.question_text} />
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <Badge
                                                variant="secondary"
                                                className="text-[11px] h-5 inline-flex items-center justify-center"
                                            >
                                                {item.subject_name}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className="text-[11px] h-5 inline-flex items-center justify-center font-mono"
                                            >
                                                {item.exam_year}
                                            </Badge>

                                            <Badge
                                                variant="outline"
                                                className="text-[11px] h-5 inline-flex items-center justify-center"
                                            >
                                                {item.marks} Marks
                                            </Badge>

                                            {/* ⏳ Dynamic Time Taken display with perfect icon padding */}
                                            {item.time_taken && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[11px] h-5 inline-flex items-center justify-center gap-1 font-mono"
                                                >
                                                    <ClockIcon
                                                        size={12}
                                                        className="shrink-0 text-slate-400 dark:text-slate-500"
                                                    />
                                                    <span>{formatTime(item.time_taken)}</span>
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                        <span
                                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TYPE_CLS[item.question_type] || TYPE_CLS['multiple-choice']}`}
                                        >
                                            {item.question_type === 'multiple-choice'
                                                ? 'MCQ'
                                                : item.question_type === 'multiple-select'
                                                  ? 'MSQ'
                                                  : 'NAT'}
                                        </span>
                                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-['JetBrains_Mono',monospace]">
                                            {/* 🗓️ Upgraded using date-fns */}
                                            {formatDistanceToNowStrict(
                                                new Date(item.attempted_at),
                                                {
                                                    addSuffix: true,
                                                },
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="subjects" className="m-0 focus-visible:outline-none">
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {subjects.length === 0 && (
                            <div className="p-8 text-center text-sm text-slate-500">
                                No subject progress found.
                            </div>
                        )}
                        {subjects.map((s) => (
                            <div
                                key={s.subject_slug}
                                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 group cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                                            {s.subject_name}
                                        </span>
                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-['JetBrains_Mono',monospace]">
                                                {s.attempted}/{s.total_available}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold w-8 text-right ${accuracyTextColor(s.accuracy)}`}
                                            >
                                                {s.accuracy}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${accuracyColor(s.accuracy)}`}
                                            style={{ width: `${s.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
