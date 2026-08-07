import { useEffect, useState } from 'react';
import type { ProfileData } from '../types/profile';
import { getPublicProfile } from '../api/profileApi';

const profileCache = new Map<string, ProfileData>();

export const invalidateProfileCache = (username?: string) => {
    if (username) {
        profileCache.delete(username);
    } else {
        profileCache.clear(); // Clears all if no username provided
    }
};

export const useProfile = (username: string) => {
    // Synchronously initialize state from cache if it exists
    const [data, setData] = useState<ProfileData | null>(() => {
        return username ? profileCache.get(username) || null : null;
    });

    // Only set initial loading to true if we don't already have cached data
    const [loading, setLoading] = useState<boolean>(() => !data);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) return;

        // If cached data already exists, skip network request entirely
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

                // Save to module cache
                profileCache.set(username, profileData as ProfileData);

                if (isMounted) {
                    setData(profileData as ProfileData);
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
