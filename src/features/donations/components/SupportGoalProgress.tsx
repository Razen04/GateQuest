import { HeartIcon, SparkleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';

const INFRA_GOAL = 2500;

export function SupportGoalProgress() {
    const [raised, setRaised] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        supabase.rpc('get_monthly_donation_total').then(({ data, error }) => {
            if (cancelled) return;
            if (error) {
                console.error('[SupportGoalProgress] fetch failed:', error);
                return;
            }
            setRaised(Number(data ?? 0));
        });

        return () => {
            cancelled = true;
        };
    }, []);

    if (raised === null) return null;

    const percent = Math.min(100, (raised / INFRA_GOAL) * 100);
    const goalMet = raised >= INFRA_GOAL;

    return (
        <div className="relative overflow-hidden border border-border bg-card/70 p-5 backdrop-blur-md sm:p-6">
            {/* Subtle warm glow behind the goal */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 bg-chart-1/10 blur-3xl" />

            <div className="relative">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            {goalMet ? (
                                <SparkleIcon
                                    size={16}
                                    weight="fill"
                                    className="text-chart-2"
                                />
                            ) : (
                                <HeartIcon
                                    size={16}
                                    weight="fill"
                                    className="text-chart-4"
                                />
                            )}
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                                {goalMet
                                    ? 'GOAL MET THIS MONTH'
                                    : 'INFRASTRUCTURE GOAL'}
                            </p>
                        </div>
                        <p className="mt-2 font-grotesk text-xl font-black tracking-tight text-foreground sm:text-2xl">
                            ₹{raised.toLocaleString('en-IN')}
                            <span className="ml-1 text-sm font-medium text-muted-foreground">
                                of ₹{INFRA_GOAL.toLocaleString('en-IN')}
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {goalMet
                                ? 'Thank you as this month is covered. Extra goes to next month.'
                                : 'Covers Supabase and development for one month. Resets on the 1st.'}
                        </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-chart-1">
                        {Math.round(percent)}%
                    </span>
                </div>

                <div
                    className="mt-4 h-2 w-full overflow-hidden bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={INFRA_GOAL}
                    aria-valuenow={raised}
                    aria-label={`Infrastructure goal progress: ${Math.round(percent)}%`}
                >
                    <div
                        className={`h-full transition-all duration-700 ${
                            goalMet ? 'bg-chart-2' : 'bg-chart-1'
                        }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
