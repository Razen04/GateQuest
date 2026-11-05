import {
    ArrowsClockwise,
    CheckCircle,
    Fire,
    Info,
    Lightning,
    ShieldCheck,
    Sparkle,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import * as React from 'react';

type BoxCardProps = {
    step: string;
    icon: React.ReactNode;
    title: string;
    badge: string;
    desc: string;
    glowColor: string;
    accentClass: string;
};

const BoxCard = ({
    step,
    icon,
    title,
    badge,
    desc,
    glowColor,
    accentClass,
}: BoxCardProps) => (
    <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group relative overflow-hidden border border-border bg-card/70 p-6 shadow-lg backdrop-blur-xl transition-all hover:shadow-2xl"
    >
        {/* Glow Spotlight Effect on Hover */}
        <div
            className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${glowColor}`}
        />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-border bg-muted/80 shadow-inner">
                    {icon}
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    STAGE // {step}
                </span>
            </div>

            <span
                className={`border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${accentClass}`}
            >
                {badge}
            </span>
        </div>

        {/* Card Body */}
        <div className="relative z-10 space-y-1.5">
            <h3 className="font-grotesk text-base font-bold text-foreground">
                {title}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
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
                <div className="flex h-8 w-8 items-center justify-center bg-chart-1/10 text-chart-1">
                    <Info size={18} weight="bold" />
                </div>
                <div>
                    <h2 className="font-grotesk text-base font-bold text-foreground">
                        Algorithmic Progression Model
                    </h2>
                    <p className="font-mono text-[10px] font-semibold text-muted-foreground">
                        SPACED REPEAT // LEITNER SYSTEM
                    </p>
                </div>
            </div>

            {/* 3 Leitner Stages Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <BoxCard
                    step="01"
                    icon={
                        <Fire
                            size={22}
                            weight="fill"
                            className="text-destructive"
                        />
                    }
                    title="Box 1: Critical Core"
                    badge="EVERY 3 DAYS"
                    desc="New errors and persistent failures. Automatically queued weekly until successfully overcome."
                    glowColor="bg-destructive/20"
                    accentClass="border-destructive/20 bg-destructive/10 text-destructive"
                />

                <BoxCard
                    step="02"
                    icon={
                        <ArrowsClockwise
                            size={22}
                            weight="bold"
                            className="text-chart-4"
                        />
                    }
                    title="Box 2: Intermediate"
                    badge="EVERY 6 DAYS"
                    desc="Questions cleared once. Subject to a 14-day hold pattern to verify long-term memory consolidation."
                    glowColor="bg-chart-4/20"
                    accentClass="border-chart-4/20 bg-chart-4/10 text-chart-4"
                />

                <BoxCard
                    step="03"
                    icon={
                        <CheckCircle
                            size={22}
                            weight="fill"
                            className="text-chart-2"
                        />
                    }
                    title="Box 3: Mastery Vault"
                    badge="EVERY 12 DAYS"
                    desc="The final verification. Solve it once more here to permanently graduate the concept from your queue."
                    glowColor="bg-chart-2/20"
                    accentClass="border-chart-2/20 bg-chart-2/10 text-chart-2"
                />
            </div>

            {/* Safeguard Telemetry Callout */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden border border-chart-1/20 bg-gradient-to-br from-chart-1/[0.03] via-transparent to-chart-1/[0.02] p-6 shadow-xl backdrop-blur-xl"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-chart-1/10 text-chart-1">
                            <ShieldCheck size={22} weight="duotone" />
                        </div>
                        <div>
                            <h3 className="font-grotesk text-sm font-bold text-foreground">
                                Burnout Prevention Safeguards
                            </h3>
                            <p className="font-mono text-[10px] font-bold text-muted-foreground">
                                SYSTEM REGULATOR // OPTIMAL LOAD
                            </p>
                        </div>
                    </div>

                    <span className="self-start sm:self-auto bg-chart-1/10 px-3 py-1 font-mono text-[10px] font-bold text-chart-1">
                        STRESS_CAP = 30 QUEUE_MAX
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                    <div className="space-y-1 border border-border bg-muted/50 p-4">
                        <div className="flex items-center gap-1.5 font-grotesk font-bold text-foreground">
                            <Lightning
                                size={14}
                                className="text-chart-4"
                                weight="fill"
                            />
                            <span>Strict 30-Question Cap</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Caps revision volume at 30 items per week so you can
                            reserve peak mental energy for learning unmastered
                            concepts.
                        </p>
                    </div>

                    <div className="space-y-1 border border-border bg-muted/50 p-4">
                        <div className="flex items-center gap-1.5 font-grotesk font-bold text-foreground">
                            <Sparkle
                                size={14}
                                className="text-chart-1"
                                weight="fill"
                            />
                            <span>Fresh Start Protocol</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Missed a week? Backlogs are archived instantly
                            without penalty, serving you a clean set based on
                            immediate priority.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InfoTab;
