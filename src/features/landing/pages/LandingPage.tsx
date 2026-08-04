import {
    ArrowRight,
    ArrowUpRight,
    Brain,
    ChartLineUp,
    Fingerprint,
    Lightning,
    MoonIcon,
    SealCheck,
    SunIcon,
    Timer,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import About from '@/features/about/pages/AboutPage';
import useSettings from '@/features/settings/hooks/useSettings';
import { Button } from '@/shared/components/ui/button';
import type { Settings } from '@/shared/types/Settings';

const signal = '#2A5CFF';

const evidence = [
    {
        id: 'EXHIBIT-01',
        icon: Brain,
        title: 'Weaknesses stop hiding in plain sight',
        finding:
            'Every wrong answer becomes a signal. Topics that repeatedly cost marks surface automatically before exam day.',
        proof: 'Subject Accuracy Tracking',
        status: 'IDENTIFIED',
    },
    {
        id: 'EXHIBIT-02',
        icon: ChartLineUp,
        title: 'Progress leaves a verifiable trail',
        finding:
            'Your preparation is not measured by hours spent at a desk, but by lost marks recovered under pressure.',
        proof: 'Performance History',
        status: 'TRACKED',
    },
    {
        id: 'EXHIBIT-03',
        icon: Lightning,
        title: 'Speed becomes a muscle memory',
        finding:
            'Timed sessions recreate the cognitive friction and pressure where preparation actually matters.',
        proof: 'Exam Simulation Engine',
        status: 'ACTIVE',
    },
    {
        id: 'EXHIBIT-04',
        icon: Timer,
        title: 'Consistency transforms into evidence',
        finding:
            'Every practice session adds another indisputable entry to your preparation history.',
        proof: 'Daily Activity Logs',
        status: 'BUILDING',
    },
];

// Drawn Underline Highlight
const HighlightScribble = ({ children }: { children: React.ReactNode }) => (
    <span className="relative inline-block">
        {children}
        <motion.svg
            viewBox="0 0 280 18"
            className="pointer-events-none absolute -bottom-1 left-0 h-4 w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <motion.path
                d="M 6 12 Q 140 2 274 10"
                fill="none"
                stroke={signal}
                strokeWidth={4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
        </motion.svg>
    </span>
);

// Kinetic Rubber Stamp
const ClassifiedStamp = () => (
    <motion.div
        initial={{ scale: 2.2, rotate: 18, opacity: 0 }}
        whileInView={{ scale: 1, rotate: -7, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="flex h-24 w-24 items-center justify-center border-2 border-[#E23744] text-center text-[#E23744] sm:h-28 sm:w-28 rounded-full"
    >
        <div>
            <SealCheck size={30} weight="fill" className="mx-auto" />
            <p className="mt-1 font-['JetBrains_Mono',monospace] text-[8px] font-extrabold tracking-[0.25em]">
                CLASSIFIED
            </p>
        </div>
    </motion.div>
);

// Background Watermark Text
const WatermarkText = () => (
    <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -z-0 overflow-hidden opacity-[0.035] dark:opacity-[0.05]"
    >
        <div className="flex -rotate-5 whitespace-nowrap font-['Space_Grotesk',sans-serif] text-[10vw] font-black leading-none text-slate-900 dark:text-white">
            {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="mr-12">
                    EVIDENCE
                </span>
            ))}
        </div>
    </div>
);

const NavigationMenu = ({
    dark,
    toggle,
}: {
    dark: boolean;
    toggle: (setting: Settings) => void;
}) => {
    return (
        <nav className="sticky top-0 z-50 bg-[#F4F5F1]/50 dark:bg-[#0B0C10]/50 backdrop-blur-3xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <img
                        src="/icons/logo.svg"
                        alt="GateQuest"
                        className="h-9 w-9"
                    />

                    <div className="leading-none">
                        <p className="text-sm font-bold tracking-tight">
                            <span className="text-blue-500">GATE</span>Quest
                        </p>

                        <p className="text-[8px] uppercase text-slate-500 font-bold">
                            Good Luck
                        </p>
                    </div>
                </div>

                {/* Dossier Index */}
                <div className="hidden items-center gap-8 lg:flex">
                    {[
                        ['01', 'File', '#hero'],
                        ['02', 'Evidence', '#evidence'],
                        ['03', 'Report', '#report'],
                        ['04', 'Maintainer', '#about'],
                    ].map(([no, label, href]) => (
                        <a key={label} href={href} className="group">
                            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.25em] text-slate-400 transition-colors group-hover:text-[#2A5CFF]">
                                {no}
                            </div>

                            <div className="mt-1 font-['Space_Grotesk'] text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#2A5CFF] dark:text-white/80">
                                {label}
                            </div>
                        </a>
                    ))}
                </div>

                {/* Theme */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-slate-900/10 bg-white/40 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    onClick={() => toggle('darkMode')}
                >
                    {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                </Button>
            </div>
        </nav>
    );
};

export default function LandingPage() {
    const { settings, handleSettingToggle } = useSettings();
    const isDark = settings.darkMode;

    const navigate = useNavigate();

    return (
        <main className="relative h-dvh w-full overflow-x-hidden bg-[#F4F5F1] font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 transition-colors duration-500 dark:bg-[#0B0C10] dark:text-slate-200">
            <NavigationMenu dark={isDark} toggle={handleSettingToggle} />
            <WatermarkText />

            <div className="relative z-10 mx-auto max-w-6xl px-4 pt-8 sm:px-8">
                {/* HERO */}
                <section className="py-12 sm:py-16" id="hero">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative overflow-hidden border border-white/10 bg-[#F4F5F1] dark:bg-[#12151B] p-6 text-white dark:text-black shadow-2xl sm:p-12"
                    >
                        <div className="pointer-events-none absolute -right-12 -top-12 opacity-10">
                            <Fingerprint
                                size={280}
                                fill={isDark ? 'white' : 'black'}
                            />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.3em] text-[#2A5CFF]">
                                    DOSSIER {/* GQ-2027 */}
                                </p>
                                <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs dark:text-white/40 text-black/40">
                                    STATUS: OPEN INVESTIGATION
                                </p>
                            </div>
                            <ClassifiedStamp />
                        </div>

                        <div className="mt-10 max-w-3xl">
                            <h1 className="font-['Space_Grotesk',sans-serif] text-[clamp(2.5rem,7vw,5rem)] font-black leading-[0.95] tracking-tight text-black dark:text-white">
                                Your preparation
                                <br />
                                has a{' '}
                                <span className="font-['Fraunces',serif] font-normal italic text-[#2A5CFF]">
                                    paper trail.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-xl font-['Fraunces',serif] text-lg leading-relaxed text-black/70 dark:text-white/70">
                                Every solved question. Every unhandled topic.
                                Every recovered mark.{' '}
                                <HighlightScribble>GATEQuest</HighlightScribble>{' '}
                                converts invisible study hours into concrete
                                evidence.
                            </p>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-6">
                            <Button
                                onClick={() => navigate('/practice')}
                                className="h-12 bg-[#2A5CFF] px-7 font-['Space_Grotesk',sans-serif] rounded-none font-bold text-white transition-all hover:bg-[#2A5CFF]/90 hover:shadow-lg"
                            >
                                Open Candidate File
                                <ArrowRight size={18} className="ml-1" />
                            </Button>
                        </div>

                        <div className="mt-12 border-t border-white/10 pt-8">
                            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                                {[
                                    ['QUESTION BANK', '10,000+'],
                                    ['SYLLABUS COVERAGE', '140 TOPICS (IDK)'],
                                    [
                                        'MOCK PRECISION',
                                        '99.99999999% GATE REGIME',
                                    ],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40">
                                            {label}
                                        </p>
                                        <p className="mt-1 font-['Space_Grotesk',sans-serif] text-xl font-bold text-black dark:text-white">
                                            {val}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ── SECTION 01: Evidence Log Transcripts ── */}
                <section
                    id="evidence"
                    className="border-t border-slate-900/10 py-16 dark:border-white/10 sm:py-24"
                >
                    <header className="mb-12">
                        <p className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.3em] text-[#2A5CFF]">
                            EXHIBIT A {/* SYSTEM PROOF */}
                        </p>
                        <h2 className="mt-3 font-['Space_Grotesk',sans-serif] text-3xl font-black tracking-tight sm:text-5xl">
                            Preparation leaves fingerprints.
                        </h2>
                    </header>

                    <div className="divide-y divide-slate-900/10 border-y border-slate-900/10 dark:divide-white/10 dark:border-white/10">
                        {evidence.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: idx * 0.08,
                                    }}
                                    className="group grid gap-4 py-8 sm:grid-cols-[100px_1fr_auto] sm:items-center"
                                >
                                    <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-400 dark:text-white/30">
                                        {item.id}
                                    </span>

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                size={20}
                                                className="text-[#2A5CFF]"
                                            />
                                            <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <p className="mt-2 max-w-2xl font-['Fraunces',serif] text-base leading-relaxed text-slate-600 dark:text-white/60">
                                            {item.finding}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                        <span className="border border-[#1FAA6D]/30 px-3 py-1 font-['JetBrains_Mono',monospace] text-[9px] font-bold tracking-widest text-[#1FAA6D]">
                                            {item.status}
                                        </span>
                                        <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase text-slate-400">
                                            {item.proof}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ── SECTION 02: Correction Ledger Transcripts ── */}
                <section
                    id="report"
                    className="border-t border-slate-900/10 py-16 dark:border-white/10 sm:py-24"
                >
                    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
                        <div>
                            <p className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.3em] text-[#E23744]">
                                EXHIBIT B {/* MARKS RECOVERY */}
                            </p>
                            <h2 className="mt-3 font-['Space_Grotesk',sans-serif] text-3xl font-black sm:text-4xl">
                                Recovering lost accuracy
                            </h2>
                            <p className="mt-4 font-['Fraunces',serif] text-lg leading-relaxed text-slate-600 dark:text-white/60">
                                Systematic error logging catches repetitive
                                conceptual traps long before they cost marks on
                                final exam day.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    subject: 'Engineering Mathematics',
                                    before: '42%',
                                    after: '81%',
                                },
                                {
                                    subject: 'Network Theory',
                                    before: '55%',
                                    after: '89%',
                                },
                                {
                                    subject: 'Data Structures & Algo',
                                    before: '48%',
                                    after: '85%',
                                },
                                {
                                    subject: 'Operating Systems',
                                    before: '38%',
                                    after: '79%',
                                },
                            ].map(({ subject, before, after }) => (
                                <div
                                    key={subject}
                                    className="relative border border-slate-900/10 bg-white/60 p-6 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]"
                                >
                                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {subject}
                                    </span>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-['JetBrains_Mono',monospace] text-[9px] text-slate-400">
                                                BEFORE
                                            </p>
                                            <p className="text-2xl font-black text-[#E23744] line-through">
                                                {before}
                                            </p>
                                        </div>
                                        <ArrowUpRight
                                            size={20}
                                            className="text-slate-400"
                                        />
                                        <div className="text-right">
                                            <p className="font-['JetBrains_Mono',monospace] text-[9px] text-slate-400">
                                                RECOVERED
                                            </p>
                                            <p className="text-2xl font-black text-[#1FAA6D]">
                                                {after}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div id="about">
                <About landing={true} />
            </div>
        </main>
    );
}
