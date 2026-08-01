import { useState, type JSX } from 'react';
import { CheckCircle, XCircle, Clock, ClockIcon } from '@phosphor-icons/react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { ProfileData } from '../types/profile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { accuracyColor, accuracyTextColor } from '../utils';
import { Badge } from '@/shared/components/ui/badge';
import MathRenderer from '@/features/questions/components/Renderers/MathRenderer';
import { formatTime } from '@/shared/utils/helper';
import { glassPanel, palette } from '../styles/profileTheme';

type AttemptStatus = 'Correct' | 'Wrong' | 'Skipped';

const STATUS_CFG: Record<AttemptStatus, { icon: JSX.Element; cls: string }> = {
    Correct: {
        icon: <CheckCircle size={15} weight="fill" />,
        cls: 'text-[#2FD8A9]',
    },
    Wrong: { icon: <XCircle size={15} weight="fill" />, cls: 'text-red-500' },
    Skipped: { icon: <Clock size={15} weight="fill" />, cls: 'text-slate-400' },
};

const TYPE_LABEL: Record<string, string> = {
    'multiple-choice': 'MCQ',
    'multiple-select': 'MSQ',
    numerical: 'NAT',
};

const TYPE_COLOR: Record<string, string> = {
    'multiple-choice': palette.photon,
    'multiple-select': palette.violet,
    numerical: palette.ember,
};

interface ProfileActivityTabsProps {
    recentHistory: ProfileData['recent_history'];
    subjects: ProfileData['exam_stats'][string]['subjects'];
}

export default function ProfileActivityTabs({ recentHistory, subjects }: ProfileActivityTabsProps) {
    const [currentTab, setCurrentTab] = useState<string>('history');

    return (
        <div className={glassPanel}>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <div className="flex items-center justify-between overflow-x-auto border-b border-slate-900/5 px-2 dark:border-white/10">
                    <TabsList className="h-auto gap-1 rounded-none bg-transparent p-0">
                        <TabsTrigger
                            value="history"
                            className="rounded-none border-b-2 border-transparent px-3 py-3.5 text-xs font-medium text-slate-500 data-[state=active]:border-[#3E8EFF] data-[state=active]:bg-transparent data-[state=active]:text-[#3E8EFF] dark:text-white/50 sm:px-4"
                        >
                            Recent attempts
                        </TabsTrigger>
                        <TabsTrigger
                            value="subjects"
                            className="rounded-none border-b-2 border-transparent px-3 py-3.5 text-xs font-medium text-slate-500 data-[state=active]:border-[#3E8EFF] data-[state=active]:bg-transparent data-[state=active]:text-[#3E8EFF] dark:text-white/50 sm:px-4"
                        >
                            By subject
                        </TabsTrigger>
                    </TabsList>

                    <span className="hidden pr-4 font-['JetBrains_Mono',monospace] text-[10px] text-slate-400 dark:text-white/40 sm:block">
                        {currentTab === 'history'
                            ? `${recentHistory.length} attempts`
                            : `${subjects.length} subjects`}
                    </span>
                </div>

                <TabsContent value="history" className="m-0">
                    <div className="divide-y divide-slate-900/5 dark:divide-white/10">
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
                            const typeColor = TYPE_COLOR[item.question_type] || palette.photon;

                            return (
                                <div
                                    key={item.question_id + item.attempted_at}
                                    className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.06] sm:px-5"
                                >
                                    <span className={`mt-0.5 shrink-0 ${st.cls}`}>{st.icon}</span>

                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-700 group-hover:text-slate-900 dark:text-white/80 dark:group-hover:text-white">
                                            <MathRenderer text={item.question_text} />
                                        </p>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <Badge className="h-5 border border-white/60 bg-white/50 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70">
                                                {item.subject_name}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="h-5 border-slate-900/10 text-[11px] font-mono dark:border-white/15"
                                            >
                                                {item.exam_year}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="h-5 border-slate-900/10 text-[11px] dark:border-white/15"
                                            >
                                                {item.marks} Marks
                                            </Badge>
                                            {item.time_taken && (
                                                <Badge
                                                    variant="outline"
                                                    className="h-5 gap-1 border-slate-900/10 text-[11px] font-mono dark:border-white/15"
                                                >
                                                    <ClockIcon
                                                        size={12}
                                                        className="text-slate-400 dark:text-white/40"
                                                    />
                                                    {formatTime(item.time_taken)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <span
                                            className="border px-1.5 py-0.5 text-[10px] font-semibold"
                                            style={{
                                                color: typeColor,
                                                borderColor: `${typeColor}40`,
                                                backgroundColor: `${typeColor}14`,
                                            }}
                                        >
                                            {TYPE_LABEL[item.question_type] || 'MCQ'}
                                        </span>
                                        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-400 dark:text-white/30">
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

                <TabsContent value="subjects" className="m-0">
                    <div className="divide-y divide-slate-900/5 dark:divide-white/10">
                        {subjects.length === 0 && (
                            <div className="p-8 text-center text-sm text-slate-500">
                                No subject progress found.
                            </div>
                        )}

                        {subjects.map((s) => (
                            <div
                                key={s.subject_slug}
                                className="group flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.06] sm:px-5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="truncate text-xs font-medium text-slate-700 dark:text-white/80">
                                            {s.subject_name}
                                        </span>
                                        <div className="ml-3 flex shrink-0 items-center gap-3">
                                            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-400 dark:text-white/40">
                                                {s.attempted}/{s.total_available}
                                            </span>
                                            <span
                                                className={`w-8 text-right text-[10px] font-bold ${accuracyTextColor(s.accuracy)}`}
                                            >
                                                {s.accuracy}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-1.5 overflow-hidden bg-slate-900/5 dark:bg-white/10">
                                        <div
                                            className={`h-full ${accuracyColor(s.accuracy)}`}
                                            style={{ width: `${s.accuracy}%` }}
                                        />
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
