import {
    Broom,
    ChartLineUp,
    GlobeSimple,
    LockKey,
    ShieldCheck,
    SignIn,
    SignOut,
    Trash,
    Warning,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import useSettings from '@/features/settings/hooks/useSettings';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import useAuth from '@/shared/hooks/useAuth';
import type { Settings } from '@/shared/types/Settings';
import { supabase } from '@/shared/utils/supabaseClient';

const PrivacySettings = () => {
    const { logout, showLogin, setShowLogin, user } = useAuth();
    const {
        settings,
        handleSettingToggle,
        isUpdatingSettings,
        handleUserAnonymity,
    } = useSettings();
    const userSettings = user?.settings as Settings | undefined;

    const handleClearData = async () => {
        try {
            const { data, error } = await supabase.rpc('clear_user_data');
            if (error) throw error;

            const result = data as { version?: number } | null;

            toast.success(
                `Data cleared. Starting Profile Version ${result?.version ?? ''}.`
            );
            logout();
        } catch (error) {
            console.error('Unable to clear data: ', error);
            toast.error('Unable to clear data.');
        }
    };

    const handleAccDelete = async () => {
        try {
            const { error } = await supabase.rpc('delete_account');
            if (error) throw error;

            toast.success('Account deleted successfully.');
            logout();
        } catch (error) {
            console.error('Unable to delete account: ', error);
            toast.error('Unable to delete account.');
        }
    };

    const versionNum = user?.version_number ?? 0;
    const isMaxVersionsReached = versionNum >= 5;

    return (
        <div className="space-y-8 px-2 pb-20 pt-4">
            <div
                className={`space-y-8 transition-all duration-300 ${showLogin ? 'blur-xl opacity-50' : ''}`}
            >
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-slate-900/10 pb-4 dark:border-white/10">
                    <div className="space-y-1">
                        <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.25em] text-[#2A5CFF]">
                            SECURITY // PRIVACY
                        </p>
                        <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Data Governance & Anonymity
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 border border-slate-900/10 bg-slate-50/50 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                        <LockKey size={16} className="text-[#2A5CFF]" />
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-600 dark:text-slate-300">
                            ZERO-TRUST
                        </span>
                    </div>
                </div>

                {/* Privacy & Sharing Matrix */}
                <div className="space-y-3">
                    <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        // VISIBILITY & SOCIAL SHARES
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        <ToggleSwitch
                            icon={<ChartLineUp size={20} />}
                            title="Share Progress & Global Ranking"
                            description="Broadcast study metrics, daily streaks, and leaderboard rank to peers"
                            isOn={settings.shareProgress}
                            onToggle={() =>
                                handleSettingToggle('shareProgress')
                            }
                            disabled={isUpdatingSettings}
                        />

                        <ToggleSwitch
                            icon={
                                user?.is_public ? (
                                    <GlobeSimple size={20} />
                                ) : (
                                    <ShieldCheck size={20} />
                                )
                            }
                            title="Public Community Profile"
                            description="Allow other students to view your publicly shared study decks and stats"
                            isOn={user?.is_public ?? false}
                            onToggle={() => {
                                if (!user) return;
                                handleUserAnonymity(!user.is_public);
                            }}
                            disabled={!user || isUpdatingSettings}
                        />
                    </div>
                </div>

                {/* Data Management & Account Governance */}
                <div className="space-y-4 border border-red-500/20 bg-red-500/[0.015] p-6 dark:border-red-500/20 dark:bg-red-500/[0.02]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center bg-red-500/10 text-red-500">
                                <Warning size={18} weight="bold" />
                            </div>
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-slate-900 dark:text-white">
                                Data Governance & Danger Zone
                            </h3>
                        </div>

                        {user && user.version_number !== undefined && (
                            <span className="font-['JetBrains_Mono',monospace] text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                RESET QUOTA:{' '}
                                <span className="text-red-500">
                                    {versionNum}/5
                                </span>{' '}
                                USED
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage your raw database records, profile snapshot
                        resets, and active session tokens.
                    </p>

                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                        {/* Clear Data Trigger */}
                        {user && user.version_number !== undefined && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full justify-start gap-2.5 border-slate-900/10 font-['Space_Grotesk',sans-serif] rounded-none font-bold text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                                    >
                                        <Broom
                                            size={18}
                                            className="text-amber-500"
                                        />
                                        Clear Profile Data
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="border-slate-900/10 rounded-none bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-['Space_Grotesk',sans-serif] text-xl font-black text-slate-900 dark:text-white">
                                            Re-initialize Profile Data?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                            This action will flush your active
                                            progress, resetting you to a clean
                                            slate. You are currently on{' '}
                                            <span className="font-['JetBrains_Mono',monospace] font-bold text-slate-900 dark:text-white">
                                                Version {versionNum}
                                            </span>
                                            . This reset can only be performed 5
                                            times total. You will be logged out
                                            automatically.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter className="pt-2">
                                        <AlertDialogCancel className="font-['Space_Grotesk',sans-serif] font-bold rounded-none">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleClearData}
                                            disabled={isMaxVersionsReached}
                                            className="bg-amber-600 font-['Space_Grotesk',sans-serif] font-bold rounded-none text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                                        >
                                            Confirm Flush ({versionNum}/5)
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {/* Delete Account Trigger (Beta) */}
                        {userSettings?.is_beta && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full justify-start gap-2.5 border-red-500/20 bg-red-500/5 rounded-none font-['Space_Grotesk',sans-serif] font-bold text-red-600 hover:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                                    >
                                        <Trash size={18} />
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="border-red-500/30 bg-white/95 backdrop-blur-xl dark:bg-slate-950/95 rounded-none">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-['Space_Grotesk',sans-serif] rounded-none text-xl font-black text-red-600 dark:text-red-400">
                                            Permanently Delete Account?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                            This operation is non-reversible.
                                            All account ownership, personalized
                                            preferences, and linked records will
                                            be purged immediately from primary
                                            storage.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter className="pt-2">
                                        <AlertDialogCancel className="font-['Space_Grotesk',sans-serif] font-bold rounded-none">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleAccDelete}
                                            className="bg-red-600 rounded-none font-['Space_Grotesk',sans-serif] font-bold text-white hover:bg-red-700"
                                        >
                                            Delete Account
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        {/* Auth Action (Login / Logout) */}
                        {user ? (
                            <Button
                                className="h-12 rounded-none w-full justify-start gap-2.5 bg-red-600 font-['Space_Grotesk',sans-serif] font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
                                onClick={() => logout()}
                            >
                                <SignOut size={18} weight="bold" />
                                Terminate Session
                            </Button>
                        ) : (
                            <Button
                                className="rounded-none h-12 w-full justify-start gap-2.5 bg-[#2A5CFF] font-['Space_Grotesk',sans-serif] font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
                                onClick={() => setShowLogin(true)}
                            >
                                <SignIn size={18} weight="bold" />
                                Account Login
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
