import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { supabase } from '@/shared/utils/supabaseClient';
import { DEFAULT_TARGET_YEAR } from '../constants';
import type { SubmitPayload } from '../types';

type SubmitResult = {
    isSubmitting: boolean;
    error: string | null;
    duplicateUsername: boolean;
    submit: (data: SubmitPayload) => Promise<void>;
    retry: () => Promise<void>;
    reset: () => void;
};

export function useOnboardingSubmit(): SubmitResult {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateUsername, setDuplicateUsername] = useState(false);
    const lastPayloadRef = useRef<SubmitPayload | null>(null);

    const runSubmit = useCallback(async (data: SubmitPayload) => {
        setIsSubmitting(true);
        setError(null);
        setDuplicateUsername(false);

        try {
            // Step 1: goal first. If this fails, nothing else runs —
            // onboarding stays incomplete, user can retry from Finish.
            if (data.isNewGoal) {
                await useGoalStore
                    .getState()
                    .setInitialGoal(
                        data.branchId,
                        data.targetExams,
                        data.xlOptionals,
                        true
                    );
            }

            const user = useAuthStore.getState().user;
            if (!user) throw new Error('No authenticated user');

            // Step 2: profile update.
            const profileUpdate: Record<string, unknown> = {
                name: data.fullName.trim(),
                college: data.college.trim() || null,
                about: data.about.trim(),
                targetYear: data.targetYear ?? DEFAULT_TARGET_YEAR,
                onboarding_completed: true,
            };

            // Username is set-once. Only write if currently null.
            if (!user.username) {
                profileUpdate.username = data.username.trim();
            }

            const { error: updateError } = await supabase
                .from('users')
                .update(profileUpdate)
                .eq('id', user.id);

            if (updateError) {
                if (updateError.code === '23505') {
                    setDuplicateUsername(true);
                    setError('That username is no longer available.');
                    return;
                }
                throw updateError;
            }

            // Step 3: socials upsert (only if any were filled).
            const nonEmptySocials = Object.entries(data.socials).filter(
                ([, value]) => value.trim().length > 0
            );

            if (nonEmptySocials.length > 0) {
                const socialsRow = Object.fromEntries(nonEmptySocials);
                const { error: socialError } = await supabase
                    .from('users_social')
                    .upsert(
                        { user_id: user.id, ...socialsRow },
                        { onConflict: 'user_id' }
                    );
                if (socialError) throw socialError;
            }

            // Step 4: local store update. Triggers the gate in AppContent
            // to re-evaluate and route the user into the app.
            useAuthStore.getState().setUser({
                ...user,
                username: user.username ?? data.username.trim(),
                name: data.fullName.trim(),
                college: data.college.trim() || '',
                about: data.about.trim(),
                targetYear: data.targetYear ?? DEFAULT_TARGET_YEAR,
                onboarding_completed: true,
            });
        } catch (err) {
            console.error('Onboarding submit failed:', err);
            const message =
                err instanceof Error
                    ? err.message
                    : 'Could not save. Try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const submit = useCallback(
        async (data: SubmitPayload) => {
            lastPayloadRef.current = data;
            await runSubmit(data);
        },
        [runSubmit]
    );

    const retry = useCallback(async () => {
        if (!lastPayloadRef.current) return;
        await runSubmit(lastPayloadRef.current);
    }, [runSubmit]);

    const reset = useCallback(() => {
        setError(null);
        setDuplicateUsername(false);
    }, []);

    return { isSubmitting, error, duplicateUsername, submit, retry, reset };
}
