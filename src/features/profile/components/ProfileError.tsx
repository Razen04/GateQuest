import { motion } from 'framer-motion';
import { UserMinus, LockKey, ArrowLeft, House } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface ProfileErrorProps {
    message?: string | null;
}

export default function ProfileError({ message }: ProfileErrorProps) {
    const navigate = useNavigate();

    // Determine the state based on the exact Postgres exception message
    const isPrivate = message === 'This profile is private.';

    // Dynamically set the content
    const Icon = isPrivate ? LockKey : UserMinus;
    const titleText = isPrivate ? 'Profile is Private' : 'Profile not found';
    const descriptionText = isPrivate
        ? 'This user has chosen to keep their study progress and activity history hidden from the public.'
        : 'The username might be misspelled, or the user may have changed their handle or deleted their account.';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Soft background ambient glow (Changes color if private) */}
            <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none ${
                    isPrivate
                        ? 'bg-amber-500/10 dark:bg-amber-500/5'
                        : 'bg-blue-500/10 dark:bg-blue-500/5'
                }`}
            />

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.99, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="max-w-md w-full flex flex-col items-center z-10"
            >
                {/* Abstract Premium Visual Component */}
                <div className="relative flex items-center justify-center w-24 h-24 mb-8">
                    {/* Pulsing outer decorative ring */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 shadow-sm"
                    />

                    {/* Dotted geometric target accent */}
                    <div className="absolute inset-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700" />

                    {/* Inner high-contrast container */}
                    <div className="absolute inset-4 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                        <Icon
                            size={28}
                            className="text-slate-400 dark:text-slate-500"
                            weight="duotone"
                        />
                    </div>
                </div>

                {/* Typography Block */}
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight mb-3">
                    {titleText}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-[340px]">
                    {descriptionText}
                </p>

                {/* Styled Action Button Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {/* Primary Button: Go Back */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 h-10 px-5 w-full sm:w-auto shadow-sm transition-all active:scale-[0.98]"
                    >
                        <ArrowLeft size={16} weight="bold" />
                        Go Back
                    </button>

                    {/* Secondary Button: Return Home */}
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 h-10 px-5 w-full sm:w-auto shadow-sm transition-all active:scale-[0.98]"
                    >
                        <House size={16} />
                        Return Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
