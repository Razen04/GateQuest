import { useEffect, useState } from 'react';
import type { ProfileData } from '../types/profile';
import { getPublicProfile } from '../api/profileApi';

export const useProfile = (username: string) => {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;

            setLoading(true);
            setError(null);

            try {
                const profileData = await getPublicProfile(username);

                setData(profileData as ProfileData);
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                setError(err.message || 'This profile is private.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    return { data, loading, error };
};
