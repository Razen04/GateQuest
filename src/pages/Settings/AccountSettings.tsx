import React, { useState, type ChangeEvent } from 'react';
import Buttons from '../../components/ui/Buttons.tsx';
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../../helper.ts';
import { User, UserCircle } from '@phosphor-icons/react';
import useAuth from '../../hooks/useAuth.ts';

type InputSectionProps = {
    type: string;
    label: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const InputSection = ({ type, label, placeholder, value, onChange }: InputSectionProps) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={value ? true : false}
                className="w-full p-2 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
        </div>
    );
};

const AccountSettings = () => {
    const user = getUserProfile();
    const { isLogin } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [college, setCollege] = useState(user?.college || '');
    const [targetYear, setTargetYear] = useState(user?.targetYear ?? 2026);

    const handleSaveButton = () => {
        const updated = { ...user, name, college, targetYear };
        updateUserProfile(updated);
        syncUserToSupabase(isLogin);
    };

    return (
        <div className="overflow-y-scroll pb-20 px-4">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <UserCircle className="mr-2" /> Account Settings
            </h2>

            <div className="space-y-6">
                <div className="flex items-center">
                    <div className="h-20 w-20 flex items-center justify-center rounded-full p-1 mr-5 bg-gray-100 dark:bg-gray-800">
                        {user?.avatar ? (
                            <img src={user?.avatar} className="rounded-full w-full" />
                        ) : (
                            <User className="text-gray-600 dark:text-gray-300" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">{user?.name ? user.name : 'Anonymous User'}</h3>
                        <p className="text-sm text-gray-500">GATE {user?.targetYear} Aspirant</p>
                        <p className="text-sm text-gray-500">{user?.college}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputSection
                        type="text"
                        label="Your Name"
                        placeholder="Your name"
                        onChange={(e) => setName(e.target.value)}
                    />
                    {user?.email ? (
                        <InputSection type="email" label="Email Address" value={user.email} />
                    ) : (
                        <InputSection
                            type="email"
                            label="Email Address"
                            placeholder="your.email@example.com"
                        />
                    )}
                    <InputSection
                        type="text"
                        label="College/University"
                        placeholder="Your Institution"
                        onChange={(e) => setCollege(e.target.value)}
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Year</label>
                        <select
                            className="w-full p-2 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            onChange={(e) => setTargetYear(Number(e.target.value))}
                            value={String(targetYear)}
                        >
                            <option value="2026">GATE 2026</option>
                            <option value="2027">GATE 2027</option>
                            <option value="2028">GATE 2028</option>
                        </select>
                    </div>
                </div>

                <Buttons children="Save Changes" active={true} onClick={handleSaveButton} />
            </div>
        </div>
    );
};

export default AccountSettings;
