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
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
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
import { supabase } from '@/shared/utils/supabaseClient';

const PrivacySettings = () => {
    const user = useAuthStore((s) => s.user);
    const showLogin = useAuthStore((s) => s.showLogin);
    const setShowLogin = useAuthStore((s) => s.setShowLogin);
    const logout = useAuthStore((s) => s.logout);
    const settings = useSettingsStore((s) => s.settings);
    const toggleSetting = useSettingsStore((s) => s.toggleSetting);
    const isUpdatingSettings = useSettingsStore((s) => s.isUpdatingSettings);
    const handleUserAnonymity = useSettingsStore((s) => s.handleUserAnonymity);

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
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="space-y-1">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                            SECURITY // PRIVACY
                        </p>
                        <h2 className="font-grotesk text-2xl font-black tracking-tight text-foreground">
                            Data Governance & Anonymity
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 border border-border bg-muted/50 px-3 py-1.5">
                        <LockKey size={16} className="text-chart-1" />
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                            ZERO-TRUST
                        </span>
                    </div>
                </div>

                {/* Privacy & Sharing Matrix */}
                <div className="space-y-3">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        // VISIBILITY & SOCIAL SHARES
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        <ToggleSwitch
                            icon={<ChartLineUp size={20} />}
                            title="Share Progress & Global Ranking"
                            description="Broadcast study metrics, daily streaks, and leaderboard rank to peers"
                            isOn={settings.shareProgress}
                            onToggle={() => toggleSetting('shareProgress')}
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
                <div className="space-y-4 border border-destructive/20 bg-destructive/[0.02] p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center bg-destructive/10 text-destructive">
                                <Warning size={18} weight="bold" />
                            </div>
                            <h3 className="font-grotesk text-base font-bold text-foreground">
                                Data Governance & Danger Zone
                            </h3>
                        </div>

                        {user && user.version_number !== undefined && (
                            <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                RESET QUOTA:{' '}
                                <span className="text-destructive">
                                    {versionNum}/5
                                </span>{' '}
                                USED
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
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
                                        className="h-12 w-full justify-start gap-2.5 border-border font-grotesk rounded-none font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <Broom
                                            size={18}
                                            className="text-chart-4"
                                        />
                                        Clear Profile Data
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="border-border rounded-none bg-popover/95 backdrop-blur-xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-grotesk text-xl font-black text-foreground">
                                            Re-initialize Profile Data?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-muted-foreground">
                                            This action will flush your active
                                            progress, resetting you to a clean
                                            slate. You are currently on{' '}
                                            <span className="font-mono font-bold text-foreground">
                                                Version {versionNum}
                                            </span>
                                            . This reset can only be performed 5
                                            times total. You will be logged out
                                            automatically.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter className="pt-2">
                                        <AlertDialogCancel className="font-grotesk font-bold rounded-none">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleClearData}
                                            disabled={isMaxVersionsReached}
                                            className="bg-chart-4 font-grotesk font-bold rounded-none text-white hover:bg-chart-4/90"
                                        >
                                            Confirm Flush ({versionNum}/5)
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 w-full justify-start gap-2.5 border-destructive/20 bg-destructive/5 rounded-none font-grotesk font-bold text-destructive hover:bg-destructive/10"
                                >
                                    <Trash size={18} />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="border-destructive/30 bg-popover/95 backdrop-blur-xl rounded-none">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-grotesk rounded-none text-xl font-black text-destructive">
                                        Permanently Delete Account?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-muted-foreground">
                                        This operation is non-reversible. All
                                        account ownership, personalized
                                        preferences, and linked records will be
                                        purged immediately from primary storage.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter className="pt-2">
                                    <AlertDialogCancel className="font-grotesk font-bold rounded-none">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleAccDelete}
                                        className="bg-destructive rounded-none font-grotesk font-bold text-white hover:bg-destructive/90"
                                    >
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Auth Action (Login / Logout) */}
                        {user && user.id !== '1' ? (
                            <Button
                                className="h-12 rounded-none w-full justify-start gap-2.5 bg-destructive font-grotesk font-bold text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90"
                                onClick={() => logout()}
                            >
                                <SignOut size={18} weight="bold" />
                                Terminate Session
                            </Button>
                        ) : (
                            <Button
                                className="rounded-none h-12 w-full justify-start gap-2.5 bg-chart-1 font-grotesk font-bold text-white shadow-lg shadow-chart-1/20 hover:bg-chart-1/90"
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
