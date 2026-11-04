import { useEffect, useState } from 'react';
import { getPublicProfile } from '../api/profileApi';
import type { ProfileData } from '../types/profile';

const profileCache = new Map<string, ProfileData>();

export const invalidateProfileCache = (username?: string) => {
    if (username) {
        profileCache.delete(username);
    } else {
        profileCache.clear(); // Clears all if no username provided
    }
};

export const useProfile = (username?: string) => {
    const [data, setData] = useState<ProfileData | null>(() => {
        return username ? profileCache.get(username) || null : null;
    });

    const [loading, setLoading] = useState<boolean>(() => !data);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) return;

        if (profileCache.has(username)) {
            setData(profileCache.get(username)!);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);

            try {
                const profileData = await getPublicProfile(username);

                profileCache.set(username, profileData);

                if (isMounted) {
                    setData(profileData);
                }
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                if (isMounted) {
                    setError(err.message || 'This profile is private.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [username]);

    const invalidateCache = () => {
        if (username) {
            profileCache.delete(username);
        }
    };

    return { data, loading, error, invalidateCache };
};
