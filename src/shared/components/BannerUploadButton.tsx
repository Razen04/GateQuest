import { PencilSimple, SpinnerIcon } from '@phosphor-icons/react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Banner } from '@/shared/components/Banner';
import { compressBanner } from '@/shared/utils/image/compressImage';
import { gifToWebm } from '@/shared/utils/image/gifToWebm';
import { validateImageFile } from '@/shared/utils/image/validateImage';
import { supabase } from '@/shared/utils/supabaseClient';
import {
    deleteBannerByUrl,
    uploadBanner,
} from '@/shared/utils/supabaseStorage';

const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const GIF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface BannerUploadButtonProps {
    /** Height class for the banner strip (e.g. "h-40", "h-20") */
    className?: string;
    /** Vertical position of the pencil badge — top-right by default */
    pencilPosition?: 'top-right' | 'bottom-right';
}

export function BannerUploadButton({
    className = 'h-40 w-full',
    pencilPosition = 'top-right',
}: BannerUploadButtonProps) {
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
        e.target.value = '';
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

        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setUploading(true);

        try {
            let uploadBlob: File | Blob = file;

            if (validation.kind === 'image') {
                uploadBlob = await compressBanner(file);
            } else if (validation.kind === 'gif') {
                try {
                    uploadBlob = await gifToWebm(file);
                } catch (err) {
                    console.warn('GIF→WebM failed, uploading raw GIF:', err);
                    uploadBlob = file;
                }
            }

            const { url } = await uploadBanner(user.id, uploadBlob);

            const { error: dbError } = await supabase
                .from('users')
                .update({ banner: url })
                .eq('id', user.id);

            if (dbError) {
                await deleteBannerByUrl(url);
                throw dbError;
            }

            if (user.banner && user.banner !== url) {
                await deleteBannerByUrl(user.banner);
            }

            setUser({ ...user, banner: url });
            toast.success('Banner updated');
        } catch (err) {
            console.error('Banner upload failed:', err);
            toast.error('Failed to update banner');
        } finally {
            setUploading(false);
            URL.revokeObjectURL(localPreview);
            setPreviewUrl(null);
        }
    };

    if (!user) return null;

    const pencilClass =
        pencilPosition === 'top-right' ? 'top-2 right-2' : 'bottom-2 right-2';

    const displaySrc = previewUrl || user.banner;

    return (
        <div className="group relative overflow-hidden">
            {/* Banner image or placeholder */}
            {displaySrc ? (
                <Banner
                    src={displaySrc}
                    className={`${className} object-cover transition-opacity ${
                        uploading ? 'opacity-60' : ''
                    }`}
                />
            ) : (
                <div
                    className={`${className} flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground`}
                >
                    No banner set
                </div>
            )}

            {/* Uploading overlay */}
            {uploading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
                    <SpinnerIcon
                        size={20}
                        className="animate-spin text-chart-1"
                    />
                </div>
            )}

            {/* Pencil badge */}
            {!uploading && (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isGuest}
                    title={
                        isGuest
                            ? 'Sign in to change your banner'
                            : displaySrc
                              ? 'Change banner'
                              : 'Add banner'
                    }
                    aria-label="Change banner"
                    className={`absolute ${pencilClass} flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-md backdrop-blur-sm opacity-70 transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-card`}
                >
                    <PencilSimple size={14} weight="bold" />
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
