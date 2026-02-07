import React, { useState } from 'react';
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../../helper.ts';
import { User, UserCircle } from '@phosphor-icons/react';
import useAuth from '../../hooks/useAuth.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx';
import { toast } from 'sonner';

const AccountSettings = () => {
    const user = getUserProfile();
    const { isLogin } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [college, setCollege] = useState(user?.college || '');
    const [targetYear, setTargetYear] = useState(user?.targetYear ?? 2026);

    const handleSaveButton = async () => {
        const updated = { ...user, name, college, targetYear };
        updateUserProfile(updated);
        try {
            await syncUserToSupabase(isLogin);
            toast.success('Profile updated successfully.');
        } catch (err) {
            console.error('Unable to save profile: ', err);
            toast.error('Unable to save profile.');
        }
    };

    return (
        <div className="overflow-y-scroll pb-20 px-4">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <UserCircle className="mr-2" /> Account Settings
            </h2>

            <div className="space-y-6">
                <div className="flex items-center">
                    <div className="h-12 w-12 flex items-center justify-center p-1 mr-5 bg-gray-100 dark:bg-gray-800">
                        {user?.avatar ? (
                            <img src={user?.avatar} className="w-full" />
                        ) : (
                            <User className="text-gray-600 dark:text-gray-300" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">
                            {user?.name ? user.name : 'Anonymous User'}{' '}
                            <span className="text-gray-500">• v{user?.version_number}</span>
                        </h3>
                        <p className="text-sm text-gray-500">GATE {user?.targetYear} Aspirant</p>
                        <p className="text-sm text-gray-500">{user?.college}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <Label>Your Name</Label>
                        <Input
                            type="text"
                            placeholder="Your name"
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-md"
                        />
                    </div>

                    {user?.email ? (
                        <div className="flex flex-col gap-2">
                            <Label>Email Address</Label>
                            <Input type="email" defaultValue={user.email} className="rounded-md" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="your.email@example.com"
                                className="rounded-md"
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label>College/University</Label>
                        <Input
                            type="text"
                            placeholder="Your Institution"
                            onChange={(e) => setCollege(e.target.value)}
                            className="rounded-md"
                        />
                    </div>

                    <div>
                        <Label className="block text-sm font-medium mb-1">Target Year</Label>
                        <Select
                            onValueChange={(e) => setTargetYear(Number(e))}
                            value={String(targetYear)}
                        >
                            <SelectTrigger className="rounded-md w-full">
                                <SelectValue placeholder="Select a year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Years</SelectLabel>
                                    <SelectItem value="2026">GATE 2026</SelectItem>
                                    <SelectItem value="2027">GATE 2027</SelectItem>
                                    <SelectItem value="2028">GATE 2028</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button onClick={handleSaveButton}>Save changes</Button>
            </div>
        </div>
    );
};

export default AccountSettings;
