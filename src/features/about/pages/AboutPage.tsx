import {
    ArrowUpRight,
    CaretDown,
    Coffee,
    DiscordLogo,
    GithubLogo,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSettings from '@/features/settings/hooks/useSettings';
import { Button } from '@/shared/components/ui/button.js';
import { faqs } from '@/shared/data/faqs.js';

const ink = '#12151B';
const signal = '#2A5CFF';
const verified = '#22C55E';
const alert = '#E23744';

type Answer =
    | { type: 'text'; content: string }
    | { type: 'link'; text: string; href: string };

const renderAnswer = (parts: Answer[]) =>
    parts.map((part, i) =>
        part.type === 'link' ? (
            <a
                key={i}
                href={part.href}
                className="text-[#2A5CFF] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
            >
                {part.text}
            </a>
        ) : (
            <span key={i}>{part.content}</span>
        )
    );

const CircledPhrase = ({ children }: { children: string }) => (
    <span className="relative inline-block whitespace-nowrap px-1">
        {children}
        <motion.svg
            viewBox="0 0 220 70"
            className="pointer-events-none absolute -inset-x-2 -inset-y-3 h-[calc(100%+22px)] w-[calc(100%+16px)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <motion.path
                d="M 12 34 Q 6 6, 60 9 T 160 7 Q 205 9, 208 34 Q 210 58, 155 61 T 45 59 Q 10 57, 12 34"
                fill="none"
                stroke={alert}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
        </motion.svg>
    </span>
);

// ── Marginalia: a strike-through scribble ──
const Struck = ({ children }: { children: string }) => (
    <span className="relative inline-block">
        {children}
        <motion.svg
            viewBox="0 0 220 24"
            className="pointer-events-none absolute inset-0 h-full w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <motion.path
                d="M 4 12 Q 110 22 216 9"
                stroke={alert}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.25, ease: 'easeInOut' }}
            />
        </motion.svg>
    </span>
);

// ── Signature: hand-drawn stroke path that draws itself in ──
const Signature = () => (
    <svg
        viewBox="0 0 300 70"
        className="h-14 w-48 text-black/70 dark:text-white/70 sm:h-16 sm:w-60"
    >
        <motion.path
            d="M8 48 C 26 16, 42 16, 50 40 C 58 64, 70 12, 84 36 C 94 52, 104 26, 120 32 C 142 40, 146 12, 168 28 C 190 44, 202 18, 218 32 C 234 46, 250 20, 270 34 C 280 41, 288 37, 294 42"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
    </svg>
);

const Watermark = () => (
    <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-16 -z-0 overflow-hidden opacity-[0.045] dark:opacity-[0.06]"
    >
        <div className="flex -rotate-2 whitespace-nowrap font-['Space_Grotesk',sans-serif] text-[9vw] font-black leading-none text-slate-900 dark:text-white">
            {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="mr-10">
                    EXHIBIT A &mdash; CASE FILE OPEN &mdash;{' '}
                </span>
            ))}
        </div>
    </div>
);

const TABS = [
    { id: 'origin', label: '01 Origin' },
    { id: 'join', label: '02 Join' },
    { id: 'queries', label: '03 Queries' },
    { id: 'declaration', label: '04 Declaration' },
];

const JoinRow = ({
    icon: Icon,
    color,
    label,
    desc,
    cta,
    href,
    onNavigate,
}: {
    icon: typeof GithubLogo;
    color: string;
    label: string;
    desc: string;
    cta: string;
    href: string;
    onNavigate?: () => void;
}) => (
    <div className="group flex flex-col items-start justify-between gap-3 py-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
            <Icon size={22} style={{ color }} />
            <div>
                <p className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-slate-800 dark:text-white">
                    {label}
                </p>
                <p className="text-sm text-slate-500 dark:text-white/50">
                    {desc}
                </p>
            </div>
        </div>

        <Button
            asChild
            variant="ghost"
            className="gap-1.5 rounded-full border border-slate-900/15 px-4 dark:border-white/15"
        >
            {onNavigate ? (
                <button onClick={onNavigate}>
                    {cta} <ArrowUpRight size={14} />
                </button>
            ) : (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {cta} <ArrowUpRight size={14} />
                </a>
            )}
        </Button>
    </div>
);

const About = ({ landing = false }: { landing: boolean }) => {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const { settings } = useSettings();
    const isDark = settings.darkMode;

    return (
        <div
            className={`relative mx-auto max-w-6xl px-4 pb-32 dark:text-white sm:px-8 ${
                landing ? 'w-full' : 'min-h-screen'
            }`}
        >
            <Watermark />

            <div className="relative flex gap-4">
                {/* Sticky exhibit-tab nav — replaces a conventional nav bar entirely */}
                <nav className="sticky top-24 hidden h-fit shrink-0 flex-col gap-1 pr-8 lg:flex">
                    {TABS.map((t) => (
                        <a
                            key={t.id}
                            href={`#${t.id}`}
                            className="group flex items-center gap-2 py-2 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-[#2A5CFF] dark:text-white/30"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-[#2A5CFF] dark:bg-white/20" />
                            {t.label}
                        </a>
                    ))}
                </nav>

                <main className="min-w-0 flex-1">
                    {/* HERO */}
                    <section className="flex min-h-[75vh] flex-col justify-center py-16 sm:py-20">
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.3em]"
                            style={{ color: signal }}
                        >
                            Exhibit A &mdash; Testimony of the Maintainer
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="mt-4 font-['Space_Grotesk',sans-serif] text-[clamp(2.6rem,9vw,6rem)] font-black leading-[0.94] tracking-tight text-slate-900 dark:text-white"
                        >
                            THIS ISN&rsquo;T
                            <br />
                            <Struck>A LANDING PAGE.</Struck>
                            <br />
                            <span
                                className="font-['Fraunces',serif] text-[0.85em] font-normal italic"
                                style={{ color: signal }}
                            >
                                It&rsquo;s an about page.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mt-8 max-w-xl font-['Fraunces',serif] text-lg leading-relaxed text-slate-600 dark:text-white/60"
                        >
                            Somebody has to explain why this exists. That
                            somebody is me, and this is the paperwork.
                        </motion.p>
                    </section>

                    {/* 01 ORIGIN */}
                    <section
                        id="origin"
                        className="scroll-mt-28 border-t border-slate-900/10 py-16 dark:border-white/10 sm:py-24"
                    >
                        <div className="grid gap-6 sm:grid-cols-[72px_1fr]">
                            <span className="font-['JetBrains_Mono',monospace] text-5xl font-bold text-slate-200 dark:text-white/10">
                                01
                            </span>
                            <div>
                                <h2 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Why this exists
                                </h2>
                                <p className="mt-6 max-w-2xl font-['Fraunces',serif] text-lg leading-relaxed text-slate-700 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-['Space_Grotesk',sans-serif] first-letter:text-7xl first-letter:font-black dark:text-white/70 [&::first-letter]:text-[#2A5CFF]">
                                    Good GATE resources already existed such as
                                    GO, Examside &mdash; and I have used both of
                                    them. But the interface always felt like an
                                    afterthought bolted onto good content. I
                                    wanted{' '}
                                    <CircledPhrase>
                                        something that respected your time
                                    </CircledPhrase>
                                    : fast, clean, and modern.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ── 02 JOIN — a requisition list, not a card grid ── */}
                    <section
                        id="join"
                        className="scroll-mt-28 border-t border-slate-900/10 py-16 dark:border-white/10 sm:py-24"
                    >
                        <div className="grid gap-6 sm:grid-cols-[72px_1fr]">
                            <span className="font-['JetBrains_Mono',monospace] text-5xl font-bold text-slate-200 dark:text-white/10">
                                02
                            </span>
                            <div>
                                <h2 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Requisition for help
                                </h2>
                                <p className="mt-6 max-w-2xl font-['Fraunces',serif] text-lg leading-relaxed text-slate-700 dark:text-white/70">
                                    This is a one-person operation pretending to
                                    be a product. If any of this is useful to
                                    you, here&rsquo;s where to push back or just
                                    say thanks.
                                </p>

                                <div className="mt-8 divide-y divide-slate-900/10 border-y border-slate-900/10 dark:divide-white/10 dark:border-white/10">
                                    <JoinRow
                                        icon={GithubLogo}
                                        color={isDark ? 'gray' : ink}
                                        label="Contribute code"
                                        desc="Issues, PRs, and bug reports — all genuinely read."
                                        cta="GitHub"
                                        href="https://github.com/Razen04/GATEQuest"
                                    />
                                    <JoinRow
                                        icon={DiscordLogo}
                                        color={signal}
                                        label="Talk to other candidates"
                                        desc="A running room for GATE prep, not just this app."
                                        cta="Discord"
                                        href="https://discord.gg/dFmg3g52c5"
                                    />
                                    <JoinRow
                                        icon={Coffee}
                                        color={verified}
                                        label="Fund Me"
                                        desc="No pressure but full pressure."
                                        cta="Buy me a movie ticket"
                                        href="/donate"
                                        onNavigate={() => navigate('/donate')}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 03 QUERIES */}
                    <section
                        id="queries"
                        className="scroll-mt-28 border-t border-slate-900/10 py-16 dark:border-white/10 sm:py-24"
                    >
                        <div className="grid gap-6 sm:grid-cols-[72px_1fr]">
                            <span className="font-['JetBrains_Mono',monospace] text-5xl font-bold text-slate-200 dark:text-white/10">
                                03
                            </span>
                            <div>
                                <h2 className="font-['Space_Grotesk',sans-serif] text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    Cross-examination
                                </h2>
                                <p className="mt-6 font-['Fraunces',serif] text-lg leading-relaxed text-slate-700 dark:text-white/70">
                                    The questions people actually ask, on the
                                    record.
                                </p>

                                <div className="mt-8 divide-y divide-slate-900/10 dark:divide-white/10">
                                    {faqs.map((faq, i) => {
                                        const open = openIndex === i;
                                        return (
                                            <div key={i}>
                                                <button
                                                    onClick={() =>
                                                        setOpenIndex(
                                                            open ? null : i
                                                        )
                                                    }
                                                    className="flex w-full items-start gap-4 py-6 text-left"
                                                >
                                                    <span className="mt-1 shrink-0 font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-300 dark:text-white/20">
                                                        Q
                                                        {String(i + 1).padStart(
                                                            2,
                                                            '0'
                                                        )}
                                                    </span>
                                                    <span className="flex-1 font-['Space_Grotesk',sans-serif] text-base font-semibold text-slate-800 dark:text-white sm:text-lg">
                                                        {faq.question}
                                                    </span>
                                                    <CaretDown
                                                        size={16}
                                                        className={`mt-1.5 shrink-0 text-slate-400 transition-transform duration-300 dark:text-white/40 ${open ? 'rotate-180' : ''}`}
                                                    />
                                                </button>

                                                <AnimatePresence
                                                    initial={false}
                                                >
                                                    {open && (
                                                        <motion.div
                                                            initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                height: 'auto',
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: 'easeInOut',
                                                            }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="flex gap-4 pb-6 pl-9">
                                                                <span
                                                                    className="mt-1 shrink-0 font-['JetBrains_Mono',monospace] text-xs font-bold"
                                                                    style={{
                                                                        color: verified,
                                                                    }}
                                                                >
                                                                    A
                                                                    {String(
                                                                        i + 1
                                                                    ).padStart(
                                                                        2,
                                                                        '0'
                                                                    )}
                                                                </span>
                                                                <p className="font-['Fraunces',serif] text-base leading-relaxed text-slate-600 dark:text-white/60">
                                                                    {renderAnswer(
                                                                        faq.answer as Answer[]
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 04 DECLARATION */}
                    <section
                        id="declaration"
                        className="relative mt-16 overflow-hidden rounded-[32px] px-6 py-20 text-center sm:mt-24 sm:px-12 bg-white/40 dark:bg-black"
                    >
                        <p className="mx-auto mt-10 max-w-xl font-['Fraunces',serif] text-xl italic leading-relaxed text-black/70 dark:text-white/70 sm:text-2xl">
                            &ldquo;I declare that this isn't my design, I ain't
                            that smart pal.&rdquo;
                        </p>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <Signature />
                            <span className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
                                &mdash; the maintainer, GateQuest
                            </span>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default About;
