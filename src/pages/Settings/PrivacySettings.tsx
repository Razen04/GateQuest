import React from 'react';
import ToggleSwitch from '../../components/ui/ToggleSwitch.tsx';
import { ShieldCheck } from '@phosphor-icons/react';
import useAuth from '../../hooks/useAuth.ts';
import useSettings from '../../hooks/useSettings.ts';

type PrivacyButtonsProps = {
    label: string;
    format?: string;
    type: 'login' | 'delete';
    onClick: () => void;
};

const PrivacyButtons = ({ label, format = '', type, onClick }: PrivacyButtonsProps) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left cursor-pointer px-4 py-3 border border-border-primary dark:border-border-primary-dark ${type !== 'delete' ? (type === 'login' ? ' hover:bg-green-500 hover:text-white dark:hover:text-text-primary' : 'hover:bg-gray-50 dark:hover:bg-text-primary') : 'hover:bg-red-400 dark:hover:bg-red-500'} flex justify-between items-center`}
        >
            <span>{label}</span>
            <span className="text-blue-500">{format}</span>
        </button>
    );
};

const PrivacySettings = () => {
    const { user, logout, showLogin, setShowLogin } = useAuth();
    const { settings, handleSettingToggle } = useSettings();

    return (
        <div className="pb-20 px-4">
            <div className={`${showLogin ? 'blur-2xl' : null}`}>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <ShieldCheck className="mr-2" /> Privacy & Data
                </h2>

                <div className="space-y-4">
                    <h1 className="text-lg text-red-500 italic">
                        Placeholder Settings: Does not work as of now, except Logout/Login.
                    </h1>
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

                        <div className="space-y-3">
                            {user ? (
                                <PrivacyButtons
                                    label="Logout"
                                    type="delete"
                                    onClick={() => logout()}
                                />
                            ) : (
                                <PrivacyButtons
                                    label="Sign up/Login"
                                    type="login"
                                    onClick={() => setShowLogin(true)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
