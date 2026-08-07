import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useAuth from '@/shared/hooks/useAuth';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
    doesUsernameExists,
    handleUsernameSubmittion,
} from './api/usernameCheck';
import { RESERVED_WORDS } from './data/reservedWords';

export function UsernameModal() {
    const { user, setUser, needsUsername, setNeedsUsername } = useAuth();
    const [username, setUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced validation
    useEffect(() => {
        if (!username) {
            setError(null);
            return;
        }

        const checkAvailability = async () => {
            setIsChecking(true);
            setError(null);

            const isValidFormat = /^[a-z0-9_]{3,20}$/.test(username);
            if (!isValidFormat) {
                setError(
                    '3-20 characters. Lowercase, numbers, and underscores only.'
                );
                setIsChecking(false);
                return;
            }
            if (RESERVED_WORDS.includes(username)) {
                setError('This username is reserved.');
                setIsChecking(false);
                return;
            }

            const exists = await doesUsernameExists(username);

            if (exists) {
                setError('Username is already taken.');
            }
            setIsChecking(false);
        };

        const timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (error || isChecking || !username || !user) return;

        setIsSubmitting(true);

        const submitError = await handleUsernameSubmittion(username, user);

        if (submitError) {
            // Postgres unique constraint violation
            if (submitError.code === '23505') {
                setError('Someone just grabbed this! Try another.');
            } else {
                toast.error('Failed to claim username.');
            }
            setIsSubmitting(false);
            return;
        }

        const updatedUser = { ...user, username };

        const stored = localStorage.getItem('gate_user_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            profile.username = username;
            localStorage.setItem('gate_user_profile', JSON.stringify(profile));
        } else {
            localStorage.setItem(
                'gate_user_profile',
                JSON.stringify(updatedUser)
            );
        }

        setUser(updatedUser);

        toast.success(`Welcome to GATEQuest, @${username}!`);
        setNeedsUsername(false);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={needsUsername} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>Claim your Username</DialogTitle>
                    <DialogDescription>
                        This will be your unique identity on GATEQuest. Choose
                        wisely, you can't change it later!
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 py-4"
                >
                    <div className="flex flex-col gap-2">
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-slate-400">
                                @
                            </span>
                            <Input
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value.toLowerCase())
                                }
                                placeholder="razen"
                                className={`pl-8 ${error ? 'border-red-500' : ''}`}
                                maxLength={20}
                            />
                        </div>
                        {error && (
                            <p className="text-xs text-red-500">{error}</p>
                        )}
                        {!error && username && !isChecking && (
                            <p className="text-xs text-emerald-500">
                                Username is available!
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={
                            !!error || isChecking || !username || isSubmitting
                        }
                    >
                        {isSubmitting ? 'Claiming...' : 'Claim Username'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
