import { PencilSimple, SpinnerIcon } from '@phosphor-icons/react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Avatar } from '@/shared/components/Avatar';
import { compressImage } from '@/shared/utils/image/compressImage';
import { gifToWebm } from '@/shared/utils/image/gifToWebm';
import { validateImageFile } from '@/shared/utils/image/validateImage';
import { supabase } from '@/shared/utils/supabaseClient';
import {
    deleteAvatarByUrl,
    uploadAvatar,
} from '@/shared/utils/supabaseStorage';
import type { DonorTier } from '../types/donor';
import { TieredAvatar } from './TieredAvatar';

const IMAGE_MAX_BYTES = 1 * 1024 * 1024; // 1MB
const GIF_MAX_BYTES = 3 * 1024 * 1024; // 3MB

interface AvatarUploadButtonProps {
    size?: 'sm' | 'md' | 'lg';
    tier?: DonorTier;
}

const SIZE_MAP = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-24 w-24',
} as const;

const BADGE_SIZE_MAP = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
} as const;

const ICON_SIZE_MAP = {
    sm: 10,
    md: 12,
    lg: 14,
} as const;

export function AvatarUploadButton({
    size = 'md',
    tier = 0,
}: AvatarUploadButtonProps) {
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isGuest = !user || user.id === '1';

    const handleClick = () => {
        if (uploading || isGuest) return;
        fileInputRef.current?.click();
    };

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting same file
        if (!file || isGuest) return;

        const validation = await validateImageFile(file, {
            allowGif: true,
            imageMaxBytes: IMAGE_MAX_BYTES,
            gifMaxBytes: GIF_MAX_BYTES,
        });

        if (!validation.ok) {
            toast.error(validation.reason);
            return;
        }

        // Instant preview
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setUploading(true);

        try {
            let uploadBlob: File | Blob = file;

            if (validation.kind === 'image') {
                uploadBlob = await compressImage(file);
            } else if (validation.kind === 'gif') {
                try {
                    uploadBlob = await gifToWebm(file);
                } catch (err) {
                    console.warn('GIF→WebM failed, uploading raw GIF:', err);
                    uploadBlob = file;
                }
            }

            const { url } = await uploadAvatar(user.id, uploadBlob);

            // Update DB
            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar: url })
                .eq('id', user.id);

            if (dbError) {
                // Rollback: delete the just-uploaded file
                await deleteAvatarByUrl(url);
                throw dbError;
            }

            // Best-effort delete of old avatar
            if (user.avatar && user.avatar !== url) {
                await deleteAvatarByUrl(user.avatar);
            }

            setUser({ ...user, avatar: url });
            toast.success('Profile picture updated');
        } catch (err) {
            console.error('Avatar upload failed:', err);
            toast.error('Failed to update profile picture');
        } finally {
            setUploading(false);
            URL.revokeObjectURL(localPreview);
            setPreviewUrl(null);
        }
    };

    if (!user) return null;

    return (
        <div className="group relative inline-block">
            <TieredAvatar
                src={previewUrl || user.avatar}
                alt={user.name || 'User avatar'}
                tier={tier}
                priority
                className={`${SIZE_MAP[size]} shrink-0`}
            />

            {/* Uploading overlay — dim avatar + centered spinner */}
            {uploading && (
                <div
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/40 backdrop-blur-[1px]`}
                >
                    <SpinnerIcon
                        size={size === 'sm' ? 16 : size === 'md' ? 18 : 20}
                        className="animate-spin text-chart-1"
                    />
                </div>
            )}

            {/* Pencil badge — bottom-right, hidden during upload */}
            {!uploading && (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isGuest}
                    title={
                        isGuest
                            ? 'Sign in to change your avatar'
                            : 'Change profile picture'
                    }
                    aria-label="Change profile picture"
                    className={`absolute -bottom-0.5 -right-0.5 flex ${BADGE_SIZE_MAP[size]} items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md opacity-70 transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-card`}
                >
                    <PencilSimple size={ICON_SIZE_MAP[size]} weight="bold" />
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFile}
                className="hidden"
            />
        </div>
    );
}
