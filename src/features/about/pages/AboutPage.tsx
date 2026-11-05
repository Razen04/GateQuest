import {
    ArrowUpRightIcon,
    CaretDownIcon,
    CoffeeIcon,
    DiscordLogoIcon,
    GithubLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button.js';
import { faqs } from '@/shared/data/faqs.js';

const ACCENT = 'text-[#0066CC] dark:text-[#3399FF]';

const LINKS = {
    github: 'https://github.com/Razen04/GATEQuest',
    discord: 'https://discord.gg/dFmg3g52c5',
};

const ROUTES = {
    donate: '/donate',
};

const WHY = {
    title: 'Why this exists',
    text: 'Good GATE resources already existed, such as GO and Examside, and I have used both of them. But the interface always felt like an afterthought bolted onto good content. I wanted something that respected your time: fast, clean, and modern.',
};

const INVOLVED = {
    title: 'Get involved',
    text: "This is a one-person project. If any of it is useful to you, here's where to push back or just say thanks.",
    items: [
        {
            icon: GithubLogoIcon,
            accent: 'text-[#181717] dark:text-white',
            label: 'Contribute code',
            desc: 'Issues, PRs, and bug reports are all read.',
            cta: 'GitHub',
            href: LINKS.github,
        },
        {
            icon: DiscordLogoIcon,
            accent: 'text-[#5865F2]',
            label: 'Talk to other candidates',
            desc: 'A running room for GATE prep, not just this app.',
            cta: 'Discord',
            href: LINKS.discord,
        },
        {
            icon: CoffeeIcon,
            accent: 'text-[#16A34A] dark:text-[#4ADE80]',
            label: 'Support the project',
            desc: 'No pressure, but it helps keep things running.',
            cta: 'Buy me a chai',
            route: ROUTES.donate,
        },
    ],
};

type Answer =
    | { type: 'text'; content: string }
    | { type: 'link'; text: string; href: string };

const renderAnswer = (parts: Answer[]) =>
    parts.map((part, i) =>
        part.type === 'link' ? (
            <a
                key={i}
                href={part.href}
                className={`${ACCENT} hover:underline`}
                target="_blank"
                rel="noopener noreferrer"
            >
                {part.text}
            </a>
        ) : (
            <span key={i}>{part.content}</span>
        )
    );

function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-20 py-12 sm:py-14">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Faq() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="mt-6 divide-y divide-border border-y">
            {faqs.map((faq, i) => {
                const open = openIndex === i;
                const panelId = `faq-panel-${i}`;

                return (
                    <div key={i}>
                        <button
                            onClick={() => setOpenIndex(open ? null : i)}
                            aria-expanded={open}
                            aria-controls={panelId}
                            className="flex w-full items-start justify-between gap-4 py-4 text-left"
                        >
                            <span className="text-sm font-medium text-foreground sm:text-base">
                                {faq.question}
                            </span>
                            <CaretDownIcon
                                size={16}
                                className={`mt-1 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                    open ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        <div
                            id={panelId}
                            className={`grid transition-all duration-200 ease-in-out ${
                                open
                                    ? 'grid-rows-[1fr] opacity-100'
                                    : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <p className="pb-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    {renderAnswer(faq.answer as Answer[])}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const About = ({ landing = false }: { landing?: boolean }) => {
    const navigate = useNavigate();

    return (
        <div
            className={`mx-auto bg-background max-w-3xl px-5 pb-16 sm:px-8 ${
                landing ? 'w-full' : 'min-h-screen'
            }`}
        >
            <header className="py-12 sm:py-16">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    About{' '}
                    <span className="font-semibold tracking-tight">
                        GATE<span className={ACCENT}>Quest</span>
                    </span>
                </h1>
            </header>

            <main>
                <Section id="why" title={WHY.title}>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {WHY.text}
                    </p>
                </Section>

                <Section id="involved" title={INVOLVED.title}>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {INVOLVED.text}
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {INVOLVED.items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    className="flex min-h-[180px] flex-col border border-border bg-card p-5 transition-colors hover:border-foreground/30"
                                >
                                    <Icon size={22} className={item.accent} />

                                    <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                                        {item.label}
                                    </h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                        {item.desc}
                                    </p>

                                    <div className="mt-auto pt-4">
                                        {'route' in item && item.route ? (
                                            <Button
                                                variant="outline"
                                                className="h-9 rounded-none px-3 text-sm"
                                                onClick={() =>
                                                    navigate(item.route)
                                                }
                                            >
                                                {item.cta}
                                                <ArrowUpRightIcon
                                                    size={14}
                                                    className="ml-1.5"
                                                />
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="h-9 rounded-none px-3 text-sm"
                                            >
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {item.cta}
                                                    <ArrowUpRightIcon
                                                        size={14}
                                                        className="ml-1.5"
                                                    />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                <Section id="faq" title="Frequently asked questions">
                    <Faq />
                </Section>
            </main>
        </div>
    );
};

export default About;
