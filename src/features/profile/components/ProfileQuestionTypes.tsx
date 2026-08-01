import { Card } from '@/shared/components/ui/card';

const ProfileQuestionTypes = () => {
    return (
        <Card className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                Question Types
            </p>
            {global.question_types.map((qt) => {
                const pct =
                    global.total_unique_solved > 0
                        ? Math.round((qt.solved / global.total_unique_solved) * 100)
                        : 0;
                const color =
                    qt.type === 'MCQ'
                        ? 'bg-blue-500'
                        : qt.type === 'NAT'
                          ? 'bg-violet-500'
                          : 'bg-amber-400';
                return (
                    <div key={qt.type} className="flex items-center gap-2 mb-2.5 last:mb-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-8">
                            {qt.type}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${color} rounded-full`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-8 text-right font-['JetBrains_Mono',monospace]">
                            {qt.solved}
                        </span>
                    </div>
                );
            })}
        </Card>
    );
};

export default ProfileQuestionTypes;
