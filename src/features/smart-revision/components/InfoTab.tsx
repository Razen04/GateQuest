import * as React from 'react';
import { motion } from 'framer-motion';
import {
    Info,
    CheckCircle,
    ShieldCheck,
    ArrowsClockwise,
    Fire,
    Sparkle,
    Lightning,
} from '@phosphor-icons/react';

type BoxCardProps = {
    step: string;
    icon: React.ReactNode;
    title: string;
    badge: string;
    desc: string;
    glowColor: string;
    accentClass: string;
};

const BoxCard = ({ step, icon, title, badge, desc, glowColor, accentClass }: BoxCardProps) => (
    <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group relative overflow-hidden border border-slate-900/10 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition-all hover:shadow-2xl dark:border-white/10 dark:bg-zinc-950/40"
    >
        {/* Glow Spotlight Effect on Hover */}
        <div
            className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${glowColor}`}
        />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-slate-900/5 bg-slate-100/80 shadow-inner dark:border-white/10 dark:bg-white/5">
                    {icon}
                </div>
                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    STAGE // {step}
                </span>
            </div>

            <span
                className={`border px-2.5 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold tracking-wider ${accentClass}`}
            >
                {badge}
            </span>
        </div>

        {/* Card Body */}
        <div className="relative z-10 space-y-1.5">
            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-slate-900 dark:text-white">
                {title}
            </h3>
            <p className="font-['Fraunces',serif] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {desc}
            </p>
        </div>
    </motion.div>
);

const InfoTab = () => {
    return (
        <div className="space-y-8 pt-4">
            {/* Header Section */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center bg-blue-500/10 text-[#2A5CFF] dark:text-blue-400">
                    <Info size={18} weight="bold" />
                </div>
                <div>
                    <h2 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-slate-900 dark:text-white">
                        Algorithmic Progression Model
                    </h2>
                    <p className="font-['JetBrains_Mono',monospace] text-[10px] font-semibold text-slate-400">
                        SPACED REPEAT // LEITNER SYSTEM
                    </p>
                </div>
            </div>

            {/* 3 Leitner Stages Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <BoxCard
                    step="01"
                    icon={<Fire size={22} weight="fill" className="text-rose-500 animate-pulse" />}
                    title="Box 1: Critical Core"
                    badge="EVERY 7 DAYS"
                    desc="New errors and persistent failures. Automatically queued weekly until successfully overcome."
                    glowColor="bg-rose-500/20"
                    accentClass="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                />

                <BoxCard
                    step="02"
                    icon={<ArrowsClockwise size={22} weight="bold" className="text-amber-500" />}
                    title="Box 2: Intermediate"
                    badge="EVERY 14 DAYS"
                    desc="Questions cleared once. Subject to a 14-day hold pattern to verify long-term memory consolidation."
                    glowColor="bg-amber-500/20"
                    accentClass="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />

                <BoxCard
                    step="03"
                    icon={<CheckCircle size={22} weight="fill" className="text-emerald-500" />}
                    title="Box 3: Mastery Vault"
                    badge="EVERY 30 DAYS"
                    desc="The final verification. Solve it once more here to permanently graduate the concept from your queue."
                    glowColor="bg-emerald-500/20"
                    accentClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
            </div>

            {/* Safeguard Telemetry Callout */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden border border-[#2A5CFF]/20 bg-gradient-to-br from-[#2A5CFF]/[0.03] via-transparent to-blue-500/[0.02] p-6 shadow-xl backdrop-blur-xl dark:border-blue-500/20 dark:bg-blue-500/[0.03]"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900/10 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#2A5CFF]/10 text-[#2A5CFF] dark:bg-blue-400/10 dark:text-blue-400">
                            <ShieldCheck size={22} weight="duotone" />
                        </div>
                        <div>
                            <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-slate-900 dark:text-white">
                                Burnout Prevention Safeguards
                            </h3>
                            <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-slate-400">
                                SYSTEM REGULATOR // OPTIMAL LOAD
                            </p>
                        </div>
                    </div>

                    <span className="self-start sm:self-auto bg-[#2A5CFF]/10 px-3 py-1 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#2A5CFF] dark:bg-blue-400/10 dark:text-blue-300">
                        STRESS_CAP = 30 QUEUE_MAX
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div className="space-y-1 border border-slate-900/5 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 font-['Space_Grotesk',sans-serif] font-bold text-slate-800 dark:text-slate-200">
                            <Lightning size={14} className="text-amber-500" weight="fill" />
                            <span>Strict 30-Question Cap</span>
                        </div>
                        <p className="font-['Fraunces',serif] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Caps revision volume at 30 items per week so you can reserve peak mental
                            energy for learning unmastered concepts.
                        </p>
                    </div>

                    <div className="space-y-1 border border-slate-900/5 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-1.5 font-['Space_Grotesk',sans-serif] font-bold text-slate-800 dark:text-slate-200">
                            <Sparkle size={14} className="text-blue-500" weight="fill" />
                            <span>Fresh Start Protocol</span>
                        </div>
                        <p className="font-['Fraunces',serif] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Missed a week? Backlogs are archived instantly without penalty, serving
                            you a clean set based on immediate priority.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InfoTab;
