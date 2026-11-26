import {
    ArrowLeftIcon,
    HouseIcon,
    LockKeyIcon,
    UserMinusIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { glassPanel } from '../styles/profileTheme';

interface ProfileErrorProps {
    message?: string | null;
}

export default function ProfileError({ message }: ProfileErrorProps) {
    const navigate = useNavigate();
    const isPrivate = message === 'This profile is private.';

    const Icon = isPrivate ? LockKeyIcon : UserMinusIcon;

    const titleText = isPrivate ? 'Profile is private' : 'Profile not found';

    const descriptionText = isPrivate
        ? 'This user has chosen to keep their study progress and activity history hidden from the public.'
        : 'The username might be misspelled, or the user may have changed their handle or deleted their account.';

    const accent = isPrivate ? 'var(--color-chart-4)' : 'var(--color-chart-1)';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 font-sans text-foreground">
            {/* Ambient accent glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 blur-[140px] opacity-15"
                    style={{
                        backgroundColor: accent,
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className={`${glassPanel} p-8`}>
                    {/* Icon */}
                    <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center border border-border bg-card/70 shadow-sm">
                        <Icon
                            size={30}
                            weight="duotone"
                            style={{ color: accent }}
                        />
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                            {titleText}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {descriptionText}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-border bg-secondary px-5 text-sm font-medium text-secondary-foreground transition-all hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <ArrowLeftIcon size={16} weight="bold" />
                            Go back
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <HouseIcon size={16} weight="bold" />
                            Return dashboard
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
