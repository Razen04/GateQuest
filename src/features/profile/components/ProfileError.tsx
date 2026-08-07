import { ArrowLeft, House, LockKey, UserMinus } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { glassPanel } from '../styles/profileTheme';

interface ProfileErrorProps {
    message?: string | null;
}

export default function ProfileError({ message }: ProfileErrorProps) {
    const navigate = useNavigate();
    const isPrivate = message === 'This profile is private.';

    const Icon = isPrivate ? LockKey : UserMinus;
    const titleText = isPrivate ? 'Profile is private' : 'Profile not found';
    const descriptionText = isPrivate
        ? 'This user has chosen to keep their study progress and activity history hidden from the public.'
        : 'The username might be misspelled, or the user may have changed their handle or deleted their account.';
    const accent = isPrivate ? '#FF9F43' : '#3E8EFF';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 font-['Plus_Jakarta_Sans',sans-serif] dark:from-[#06070A] dark:via-[#0A0D12] dark:to-[#0F1218]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 blur-[140px]"
                    style={{ backgroundColor: `${accent}20` }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className={`${glassPanel} p-8`}>
                    <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.06]">
                        <Icon
                            size={30}
                            weight="duotone"
                            style={{ color: accent }}
                        />
                    </div>

                    <div className="text-center">
                        <h2 className="font-['Sora',sans-serif] text-2xl font-bold text-slate-900 dark:text-white">
                            {titleText}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/60">
                            {descriptionText}
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-white/60 bg-white/50 px-5 text-sm font-medium text-slate-800 transition-all hover:bg-white/70 active:scale-[0.98] dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <ArrowLeft size={16} />
                            Go back
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex h-11 items-center justify-center gap-2 border border-white/50 bg-white/30 px-5 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/10"
                        >
                            <House size={16} />
                            Return dashboard
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
