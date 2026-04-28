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
import { SignOutIcon, SignInIcon, BroomIcon } from '@phosphor-icons/react';
import { getUserProfile } from '@/shared/utils/helper';
import { toast } from 'sonner';
import { supabase } from '@/shared/utils/supabaseClient';

const PrivacySettings = () => {
    const { logout, showLogin, setShowLogin } = useAuth();
    const { settings, handleSettingToggle } = useSettings();
    const user = getUserProfile();

    const handleClearData = async () => {
        try {
            const { data, error } = await supabase.rpc('clear_user_data');

            if (error) throw error;
            toast.success(`Data cleared. Starting Profile Version ${data.version}.`);
        } catch (error) {
            console.error('Unable to clear data: ', error);
            toast.error('Unable to clear data.');
            return;
        } finally {
            // perform logout
            logout();
        }
    };

    return (
        <div className="pb-20 px-4">
            <div className={`${showLogin ? 'blur-2xl' : null}`}>
                <div className="space-y-2">
                    <ToggleSwitch
                        isOn={settings.shareProgress}
                        onToggle={() => handleSettingToggle('shareProgress')}
                        label="Share My Progress & Ranking"
                    />

                    <ToggleSwitch
                        isOn={settings.dataCollection}
                        onToggle={() => handleSettingToggle('dataCollection')}
                        label="Remain Anonymous"
                    />

                    <div className="py-3 border-t border-gray-100 mt-3 pt-3">
                        <h3 className="text-base font-medium mb-4">Data Management</h3>
                        <div className="flex gap-2">
                            {user && user.version_number && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline">
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
                                                clear your data and this can only be performed at
                                                max 5 times. You have used {user.version_number}/5
                                                already. You will be logout after this.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleClearData()}
                                                disabled={user?.version_number >= 5}
                                            >
                                                Continue
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {user ? (
                                <Button
                                    className="bg-red-600 hover:bg-red-800"
                                    onClick={() => logout()}
                                >
                                    <SignOutIcon />
                                    Logout
                                </Button>
                            ) : (
                                <Button onClick={() => setShowLogin(true)}>
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
