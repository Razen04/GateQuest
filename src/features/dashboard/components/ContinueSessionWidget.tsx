import {
    ArrowRightIcon,
    BookmarkIcon,
    BookOpenIcon,
    ChartBarIcon,
    ClockIcon,
    EyeIcon,
    HeartIcon,
    HighlighterIcon,
    SlidersIcon,
    TargetIcon,
    XIcon,
} from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SessionTheme = {
    iconColor: string;
    iconBg: string;
    hoverBorder: string;
    badge: string;
};

const sessionThemes: Record<string, SessionTheme> = {
    default: {
        iconColor: 'text-muted-foreground',
        iconBg: 'bg-muted',
        hoverBorder: 'hover:border-primary/40',
        badge: 'border-border bg-muted text-muted-foreground',
    },
    practice: {
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        hoverBorder: 'hover:border-primary/40',
        badge: 'border-primary/20 bg-primary/10 text-primary',
    },
    revision: {
        iconColor: 'text-chart-4',
        iconBg: 'bg-chart-4/10',
        hoverBorder: 'hover:border-chart-4/40',
        badge: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
    },
    test: {
        iconColor: 'text-destructive',
        iconBg: 'bg-destructive/10',
        hoverBorder: 'hover:border-destructive/40',
        badge: 'border-destructive/20 bg-destructive/10 text-destructive',
    },
    donate: {
        iconColor: 'text-chart-2',
        iconBg: 'bg-chart-2/10',
        hoverBorder: 'hover:border-chart-2/40',
        badge: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
    },
};

export const ContinueSessionWidget = () => {
    const navigate = useNavigate();

    const [sessionUrl, setSessionUrl] = useState<string | null>(null);

    useEffect(() => {
        const lastSessionUrl = localStorage.getItem(
            'gatequest_last_active_session'
        );

        const lastTimestamp = localStorage.getItem(
            'gatequest_last_active_timestamp'
        );

        if (lastSessionUrl && lastTimestamp) {
            const threeDays = 3 * 24 * 60 * 60 * 1000;

            if (Date.now() - Number(lastTimestamp) < threeDays) {
                setSessionUrl(lastSessionUrl);
            }
        }
    }, []);

    if (!sessionUrl) return null;

    const [pathPart, searchPart] = sessionUrl.split('?');
    const segments = pathPart?.split('/').filter(Boolean) || [];
    const queryParams = new URLSearchParams(searchPart || '');

    const isBookmarkMode = queryParams.get('attempt') === 'bookmarked';

    let cardTitle = 'Continue Learning';
    let cardSubtitle = 'Pick up exactly where you paused.';
    let badgeText = 'Resume';
    let Icon = BookOpenIcon;
    let theme = sessionThemes.default;
    let isLiveTest = false;

    const formatSlug = (slug: string) => {
        if (!slug) return '';

        return slug
            .split('-')
            .map((word) => word.toUpperCase())
            .join(' ');
    };

    // Practice Route
    if (segments[0] === 'practice') {
        theme = sessionThemes.practice;

        if (isBookmarkMode && segments[1]) {
            cardTitle = `Bookmarked Pool: ${formatSlug(segments[1])}`;
            cardSubtitle =
                'Stuff you bookmarked because “I’ll revise this later” sounded believable.';
            badgeText = 'Bookmarks';
            Icon = BookmarkIcon;
        } else if (segments[1] && segments[2]) {
            cardTitle = `${formatSlug(segments[1])} • Active Session`;
            cardSubtitle =
                'You disappeared mid-session. The questions took it personally.';
            badgeText = 'Solving PYQ';
            Icon = TargetIcon;
        } else if (segments[1]) {
            cardTitle = `${formatSlug(segments[1])} Pool`;
            cardSubtitle =
                'Fresh questions waiting to test your confidence levels.';
            badgeText = 'Question List';
            Icon = BookOpenIcon;
        } else {
            cardTitle = 'Practice Arena';
            cardSubtitle =
                'Welcome back soldier, today we fight silly little MCQs again.';
            badgeText = 'Practice Hub';
            Icon = BookOpenIcon;
        }
    }

    // Revision Route
    else if (segments[0] === 'revision') {
        theme = sessionThemes.revision;

        const revisionId = segments[1];
        const subject = segments[2];
        const questionId = segments[3];

        if (revisionId && subject && questionId) {
            cardTitle = `Smart Revision: ${formatSlug(subject)}`;
            cardSubtitle = 'Revisiting one very specific academic betrayal.';
            badgeText = 'Revision Card';
            Icon = TargetIcon;
        } else if (revisionId) {
            cardTitle = 'Smart Revision List';
            cardSubtitle = 'A carefully curated museum of your past mistakes.';
            badgeText = 'Revision Queue';
            Icon = HighlighterIcon;
        } else {
            cardTitle = 'Smart Revision Center';
            cardSubtitle =
                'Because your brain deletes information for fun apparently.';
            badgeText = 'Revision Hub';
            Icon = HighlighterIcon;
        }
    }

    // Topic Test Route
    else if (
        [
            'topic-test',
            'topic-test-generate',
            'topic-test-result',
            'topic-test-review',
        ].includes(segments[0])
    ) {
        theme = sessionThemes.test;

        if (segments[0] === 'topic-test-generate') {
            cardTitle = 'Configure Mock Paper';
            cardSubtitle =
                'Customizing the exact exam that may emotionally damage you.';
            badgeText = 'Test Setup';
            Icon = SlidersIcon;
        } else if (segments[0] === 'topic-test-result') {
            cardTitle = 'Review Performance Analytics';
            cardSubtitle =
                'Some numbers went up. Hopefully the important ones.';
            badgeText = 'Score Card';
            Icon = ChartBarIcon;
        } else if (segments[0] === 'topic-test-review') {
            cardTitle = 'Analyzing Test Solutions';
            cardSubtitle =
                'Let’s calmly inspect where things became unfortunate.';
            badgeText = 'Solution Audit';
            Icon = EyeIcon;
        } else if (segments[2] === 'attempt') {
            cardTitle = 'Live Exam In Progress';
            cardSubtitle = "Your timer is paused. Sadly, your syllabus isn't.";
            badgeText = 'Live Test';
            Icon = ClockIcon;
            isLiveTest = true;
        } else if (segments[1]) {
            cardTitle = 'Topic Test Lobby';
            cardSubtitle =
                'One last peaceful screen before the academic violence begins.';
            badgeText = 'Exam Gate';
            Icon = ClockIcon;
        } else {
            cardTitle = 'Topic Test Center';
            cardSubtitle =
                'Mocks, panic attacks, comeback arcs — everything lives here.';
            badgeText = 'Test Hub';
            Icon = ClockIcon;
        }
    }

    // Donate Route
    else if (segments[0] === 'donate') {
        theme = sessionThemes.donate;

        cardTitle = 'Support GATEQuest';
        cardSubtitle =
            'Aye, thanks for even thinking about donating. Means a lot genuinely 🫶';
        badgeText = 'Contribution';
        Icon = HeartIcon;
    }

    const handleResume = () => navigate(sessionUrl);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        localStorage.removeItem('gatequest_last_active_session');
        localStorage.removeItem('gatequest_last_active_timestamp');

        setSessionUrl(null);
    };

    return (
        <div>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Continue Where You Left Off
            </h2>

            <div
                onClick={handleResume}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleResume();
                    }
                }}
                role="button"
                tabIndex={0}
                className={`
                    group relative mb-6 cursor-pointer
                    overflow-hidden border border-border
                    bg-card/80 p-3.5
                    shadow-sm backdrop-blur-xl backdrop-saturate-150
                    transition-all duration-300
                    ${theme?.hoverBorder}
                `}
            >
                {/* Glass Reflection */}
                <div
                    className="
                    pointer-events-none absolute inset-0
                    bg-gradient-to-b
                    from-foreground/[0.035]
                    to-transparent
                "
                />

                <div
                    className="
                    relative flex flex-col gap-3
                    sm:flex-row sm:items-center sm:justify-between
                "
                >
                    {/* Session Information */}
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className={`
                                flex h-11 w-11 shrink-0
                                items-center justify-center
                                border border-border
                                backdrop-blur-md
                                ${theme?.iconBg}
                            `}
                        >
                            <Icon className={`h-5 w-5 ${theme?.iconColor}`} />
                        </div>

                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                                <span
                                    className={`
                                        border px-2 py-0.5
                                        text-[10px] font-semibold
                                        tracking-wider uppercase
                                        backdrop-blur-md
                                        ${theme?.badge}
                                        ${isLiveTest ? 'animate-pulse font-bold' : ''}
                                    `}
                                >
                                    {badgeText}
                                </span>
                            </div>

                            <h3
                                className="
                                truncate text-sm leading-tight
                                font-semibold text-card-foreground
                                transition-colors
                            "
                            >
                                {cardTitle}
                            </h3>

                            <p
                                className="
                                mt-0.5 line-clamp-2
                                text-xs text-muted-foreground
                            "
                            >
                                {cardSubtitle}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div
                        className="
                        flex items-center gap-2
                        self-end sm:self-center
                    "
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleResume();
                            }}
                            className="
                                flex items-center gap-1.5
                                border border-border
                                bg-secondary px-3 py-1.5
                                text-sm font-medium
                                text-secondary-foreground
                                shadow-sm backdrop-blur-md
                                transition-colors
                                hover:bg-accent
                                hover:text-accent-foreground
                            "
                        >
                            Resume
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            className="
                                p-2 text-muted-foreground
                                transition-colors
                                hover:bg-accent
                                hover:text-foreground
                            "
                            title="Dismiss session"
                            aria-label="Dismiss session"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
