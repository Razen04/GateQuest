import {
    ArrowsClockwiseIcon,
    BookOpenIcon,
    ChartBarIcon,
    ChartLineUpIcon,
    CloudArrowUpIcon,
    GitBranchIcon,
    SlidersHorizontalIcon,
    SparkleIcon,
    TimerIcon,
} from '@phosphor-icons/react';

export const IMAGES = {
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

export const FEATURES = [
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
        icon: TimerIcon,
        title: 'Live Mock (Alpha)',
        description:
            'Sit scheduled, exam-style mocks in fullscreen with a shared timer. Scores unlock when the window closes.',
        tag: 'Testing',
        span: 'lg:col-span-4',
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
            'Step-by-step explanations, problem breakdowns, and quick doubt clearing for FREE from your favourite AI.',
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
