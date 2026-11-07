import {
    ArrowRightIcon,
    ArrowsClockwiseIcon,
    BookOpenIcon,
    ChartBarIcon,
    ChartLineUpIcon,
    CloudArrowUpIcon,
    CoffeeIcon,
    DiscordLogoIcon,
    GitBranchIcon,
    GithubLogoIcon,
    MoonIcon,
    SlidersHorizontalIcon,
    SparkleIcon,
    SunIcon,
} from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { Button } from '@/shared/components/ui/button';

const SITE = {
    name: { plain: 'GATE', accent: 'Quest' },
    tagline:
        'A simple, distraction-free way to prepare for GATE. Practice questions, track your progress, and focus on what matters.',
};

const LINKS = {
    discord: 'https://discord.gg/dFmg3g52c5',
    github: 'https://github.com/Razen04/GateQuest',
};

const ROUTES = {
    about: '/about',
    donate: '/donate',
    start: '/dashboard',
};

const IMAGES = {
    logoSvg: '/icons/logo.svg',
    logoPng: '/icons/logo.png',

    desktop: {
        dark: '/screenshots/Desktop.png',
        light: '/screenshots/DesktopLight.png',
    },
    ipad: {
        dark: '/screenshots/iPadDark.png',
        light: '/screenshots/iPadLight.png',
    },
    mobile: {
        dark: '/screenshots/Dashboard.png',
        light: '/screenshots/DashboardLight.png',
    },
};

const ACCENT = 'text-[#0066CC] dark:text-[#3399FF]';

const FEATURES = [
    {
        icon: ChartLineUpIcon,
        title: 'Interactive Dashboard',
        description:
            'Follow a personalized study roadmap and a daily streak graph that shows how consistent your practice has been.',
        tag: 'Study overview',
        span: 'lg:col-span-2',
    },
    {
        icon: BookOpenIcon,
        title: 'Question Library',
        description:
            'Previous-year questions organized by subject, year, and difficulty.',
        tag: 'Practice',
        span: 'lg:col-span-1',
    },
    {
        icon: ArrowsClockwiseIcon,
        title: 'Smart Revision',
        description:
            'Spaced revision, weekly recovery sets, and timed topic tests to strengthen weak areas.',
        tag: 'Active recall',
        span: 'lg:col-span-1',
    },
    {
        icon: ChartBarIcon,
        title: 'Performance Tracking',
        description:
            'Accuracy, completion, and subject-wise progress. Bookmarks and notes help you revisit hard questions.',
        tag: 'Analytics',
        span: 'lg:col-span-1',
    },
    {
        icon: SparkleIcon,
        title: 'AskAI',
        description:
            'Step-by-step explanations, problem breakdowns, and quick doubt clearing for FREE.',
        tag: 'AI assistant',
        span: 'lg:col-span-1',
    },
    {
        icon: GitBranchIcon,
        title: 'Multi-Branch Support',
        description:
            'Switch between target branches while shared subject progress, mistakes, and goals stay in sync.',
        tag: 'Flexible preparation',
        span: 'lg:col-span-2',
    },
    {
        icon: SlidersHorizontalIcon,
        title: 'Made to Fit You',
        description:
            'Light or dark mode, optional audio feedback, and a built-in timer to practice under exam-like conditions.',
        tag: 'Customizable',
        span: 'lg:col-span-2',
    },
    {
        icon: CloudArrowUpIcon,
        title: 'Sync & Install',
        description:
            'Keep your progress in sync across devices and install GATEQuest as a desktop or mobile app.',
        tag: 'Cross-device',
        span: 'lg:col-span-2',
    },
];

function scrollToId(id: string) {
    const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
    document.getElementById(id)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
    });
}

function Wordmark({ className = '' }: { className?: string }) {
    return (
        <span
            className={`font-semibold tracking-tight text-foreground ${className}`}
        >
            {SITE.name.plain}
            <span className={ACCENT}>{SITE.name.accent}</span>
        </span>
    );
}

function NavigationMenu({
    dark,
    toggle,
}: {
    dark: boolean;
    toggle: () => void;
}) {
    const navigate = useNavigate();
    const iconButton =
        'flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
            <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
                <div className="flex items-center gap-2.5">
                    <img src={IMAGES.logoSvg} alt="" className="h-7 w-7" />
                    <Wordmark className="text-sm hidden md:block" />
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(ROUTES.about)}
                        className="h-8 rounded-none px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        About
                    </Button>

                    <button
                        onClick={toggle}
                        aria-label="Toggle theme"
                        className={iconButton}
                    >
                        {dark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
                    </button>

                    <a
                        href={LINKS.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Discord"
                        className={iconButton}
                    >
                        <DiscordLogoIcon size={18} />
                    </a>

                    <a
                        href={LINKS.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub repository"
                        className={iconButton}
                    >
                        <GithubLogoIcon size={18} />
                    </a>

                    <button
                        onClick={() => navigate(ROUTES.donate)}
                        aria-label="Support the project"
                        className={iconButton}
                    >
                        <CoffeeIcon size={17} />
                    </button>
                </div>
            </nav>
        </header>
    );
}

function Hero({ dark }: { dark: boolean }) {
    const navigate = useNavigate();

    const screenshots = {
        desktop: dark ? IMAGES.desktop.dark : IMAGES.desktop.light,
        ipad: dark ? IMAGES.ipad.dark : IMAGES.ipad.light,
        mobile: dark ? IMAGES.mobile.dark : IMAGES.mobile.light,
    };

    return (
        <section id="home" className="pt-8 pb-14 sm:pt-12 sm:pb-20">
            <div className="mx-auto w-full max-w-5xl">
                {/* Device previews */}
                <div className="relative flex w-full items-end justify-center px-2 sm:px-4">
                    {/* iPad - Medium */}
                    <img
                        key={screenshots.ipad}
                        src={screenshots.ipad}
                        alt="GATEQuest iPad dashboard preview"
                        className="relative z-10 -mr-[15%] block h-auto w-[35%] shrink-0 object-contain"
                    />

                    {/* Desktop - Largest */}
                    <img
                        key={screenshots.desktop}
                        src={screenshots.desktop}
                        alt="GATEQuest desktop dashboard preview"
                        className="relative z-0 block h-auto w-[65%] shrink-0 object-contain"
                    />

                    {/* Mobile - Smallest */}
                    <img
                        key={screenshots.mobile}
                        src={screenshots.mobile}
                        alt="GATEQuest mobile dashboard preview"
                        className="relative z-20 -ml-[9.8%] block h-auto w-[11%] shrink-0 object-contain"
                    />
                </div>

                {/* Hero content */}
                <div className="relative z-20 flex flex-col items-center px-4 pt-[6%] text-center">
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-background" />

                    <img
                        src={IMAGES.logoPng}
                        alt=""
                        className="mb-3 h-12 w-12 object-contain sm:h-14 sm:w-14"
                    />

                    <h1 className="block text-3xl font-bold tracking-tight sm:text-4xl md:hidden">
                        <Wordmark />
                    </h1>

                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {SITE.tagline}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Button
                            onClick={() => navigate(ROUTES.start)}
                            className="h-10 rounded-none px-5 text-sm font-semibold"
                        >
                            Get started
                            <ArrowRightIcon size={15} className="ml-2" />
                        </Button>

                        <Button
                            variant="outline"
                            className="h-10 rounded-none"
                            onClick={() => scrollToId('features')}
                        >
                            Explore features
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Features() {
    return (
        <section
            id="features"
            className="border-t border-border py-14 sm:py-16"
        >
            <div className="mb-8">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Everything you need to prepare
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Practice, revise, and stay consistent, all in one place.
                </p>
            </div>

            <div className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map(
                    ({ icon: Icon, title, description, tag, span }) => (
                        <div
                            key={title}
                            className={`flex min-h-[200px] flex-col border border-border bg-card p-5 transition-colors hover:border-foreground/30 ${span}`}
                        >
                            <Icon size={22} className={ACCENT} />

                            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                                {title}
                            </h3>

                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </p>

                            <span className="mt-auto pt-4 text-xs text-muted-foreground/70">
                                {tag}
                            </span>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="flex flex-col gap-3 border-t border-border py-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <img
                    src={IMAGES.logoPng}
                    alt=""
                    className="h-5 w-5 object-contain"
                />
                <Wordmark className="text-xs" />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <Link
                    to="/privacy"
                    className="transition-colors hover:text-chart-1"
                >
                    Privacy Policy
                </Link>
                <Link
                    to="/terms"
                    className="transition-colors hover:text-chart-1"
                >
                    Terms of Service
                </Link>
                <span>© {new Date().getFullYear()} Razen</span>
            </div>
        </footer>
    );
}

export default function LandingPage() {
    const mode = useSettingsStore((s) => s.settings.mode);
    const setSetting = useSettingsStore((s) => s.setSetting);

    const isDark = mode !== 'light';
    const toggleTheme = () => setSetting('mode', isDark ? 'light' : 'dark');

    return (
        <main className="max-h-dvh overflow-y-auto bg-background">
            <NavigationMenu dark={isDark} toggle={toggleTheme} />

            <div className="mx-auto max-w-5xl px-5 sm:px-8">
                <Hero dark={isDark} />
                <Features />
                <Footer />
            </div>
        </main>
    );
}
