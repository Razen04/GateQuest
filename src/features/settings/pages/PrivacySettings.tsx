import useAuth from '@/shared/hooks/useAuth';
import useSettings from '@/features/settings/hooks/useSettings';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { Button } from '@/shared/components/ui/button';
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
import { SignOutIcon, SignInIcon, BroomIcon, TrashIcon } from '@phosphor-icons/react';
import { getUserProfile } from '@/shared/utils/helper';
import { toast } from 'sonner';
import { supabase } from '@/shared/utils/supabaseClient';
import type { Settings } from '@/shared/types/Settings';

const PrivacySettings = () => {
    const { logout, showLogin, setShowLogin } = useAuth();
    const { settings, handleSettingToggle, isUpdatingSettings } = useSettings();
    const user = getUserProfile();
    const userSettings = user?.settings as Settings | undefined;

    const handleClearData = async () => {
        try {
            const { data, error } = await supabase.rpc('clear_user_data');
            if (error) throw error;

            const result = data as { version?: number } | null;

            toast.success(`Data cleared. Starting Profile Version ${result?.version ?? ''}.`);
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

    const isMaxVersionsReached = (user?.version_number ?? 0) >= 5;

    return (
        <div className="pb-16 px-3 sm:px-4">
            <div className={showLogin ? 'blur-2xl' : undefined}>
                <div className="space-y-1">
                    <ToggleSwitch
                        isOn={settings.shareProgress}
                        onToggle={() => handleSettingToggle('shareProgress')}
                        label="Share My Progress & Ranking"
                        disabled={isUpdatingSettings}
                    />

                    <ToggleSwitch
                        isOn={settings.dataCollection}
                        onToggle={() => handleSettingToggle('dataCollection')}
                        label="Remain Anonymous"
                        disabled={isUpdatingSettings}
                    />

                    <div className="border-t border-gray-100 dark:border-zinc-800 mt-3 pt-3">
                        <h3 className="text-base font-semibold mb-3">Data Management</h3>

                        <div className="flex flex-col sm:flex-row gap-2">
                            {user && user.version_number !== undefined && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="flex-1">
                                            <BroomIcon />
                                            Clear Data
                                        </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Are you absolutely sure?
                                            </AlertDialogTitle>

                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently
                                                clear your data and can only be performed up to 5
                                                times. You have used {user.version_number}/5
                                                already. You will be logged out after this.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>

                                            <AlertDialogAction
                                                onClick={handleClearData}
                                                disabled={isMaxVersionsReached}
                                            >
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {userSettings?.is_beta && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="flex-1">
                                            <TrashIcon />
                                            Delete Account
                                        </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Are you absolutely sure?
                                            </AlertDialogTitle>

                                            <AlertDialogDescription>
                                                This action cannot be undone. Deleting your account
                                                will permanently remove your account information.
                                                Your engagement data may be retained for community
                                                features. You will be logged out once the deletion
                                                process is complete.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>

                                            <AlertDialogAction onClick={handleAccDelete}>
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {user ? (
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-800"
                                    onClick={() => logout()}
                                >
                                    <SignOutIcon />
                                    Logout
                                </Button>
                            ) : (
                                <Button className="flex-1" onClick={() => setShowLogin(true)}>
                                    <SignInIcon />
                                    Login
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
