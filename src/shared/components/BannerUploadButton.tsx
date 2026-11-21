import { LockSimple, PencilSimple, SpinnerIcon } from '@phosphor-icons/react';
import { type ChangeEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Banner } from '@/shared/components/Banner';
import { getDonorTier } from '@/shared/types/donor';
import { compressBanner } from '@/shared/utils/image/compressImage';
import { gifToWebm } from '@/shared/utils/image/gifToWebm';
import { validateImageFile } from '@/shared/utils/image/validateImage';
import { supabase } from '@/shared/utils/supabaseClient';
import {
    deleteBannerByUrl,
    uploadBanner,
} from '@/shared/utils/supabaseStorage';

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const GIF_MAX_BYTES = 5 * 1024 * 1024;

interface BannerUploadButtonProps {
    className?: string;
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
    const navigate = useNavigate();

    const isGuest = !user || user.id === '1';
    const tier = getDonorTier(user?.notification_tags);
    const canUploadStatic = !isGuest && tier >= 1;
    const canUploadAnimated = !isGuest && tier >= 2;

    const handleClick = () => {
        if (uploading) return;
        if (!canUploadStatic) {
            navigate('/donate');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!canUploadStatic) {
            toast.error('Banner uploads are available for supporters');
            return;
        }

        const validation = await validateImageFile(file, {
            allowGif: canUploadAnimated,
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

            const { url } = await uploadBanner(user!.id, uploadBlob);

            const { error: dbError } = await supabase
                .from('users')
                .update({ banner: url })
                .eq('id', user!.id);

            if (dbError) {
                await deleteBannerByUrl(url);
                throw dbError;
            }

            if (user!.banner && user!.banner !== url) {
                await deleteBannerByUrl(user!.banner);
            }

            setUser({ ...user!, banner: url });
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
            {/* Banner or placeholder */}
            {displaySrc ? (
                <Banner
                    src={displaySrc}
                    className={`${className} object-cover transition-opacity ${
                        uploading ? 'opacity-60' : ''
                    }`}
                />
            ) : canUploadStatic ? (
                /* Empty state, tier 1+ — clickable CTA to add a banner */
                <button
                    type="button"
                    onClick={handleClick}
                    className={`${className} flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/40 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                >
                    <PencilSimple size={22} weight="bold" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                        Add a banner
                    </span>
                    <span className="text-[10px] opacity-70">
                        {canUploadAnimated ? 'Image or GIF' : 'Image only'}
                    </span>
                </button>
            ) : (
                /* Empty state, tier 0 — locked hint */
                <div
                    className={`${className} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/40 text-muted-foreground`}
                >
                    <LockSimple
                        size={18}
                        weight="bold"
                        className="text-chart-4"
                    />
                    <span className="text-[11px] font-medium">
                        Supporters unlock custom banners and avatars
                    </span>
                    {!isGuest && (
                        <Link
                            to="/donate"
                            className="text-[10px] font-medium text-chart-1 hover:underline"
                        >
                            Learn more →
                        </Link>
                    )}
                </div>
            )}

            {/* Upload-in-progress overlay */}
            {uploading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
                    <SpinnerIcon
                        size={20}
                        className="animate-spin text-chart-1"
                    />
                </div>
            )}

            {/* Pencil / Lock badge */}
            {!uploading && displaySrc && (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isGuest}
                    title={
                        isGuest
                            ? 'Sign in to change your banner'
                            : !canUploadStatic
                              ? 'Banner uploads available for supporters'
                              : displaySrc
                                ? 'Change banner'
                                : 'Add banner'
                    }
                    aria-label={
                        canUploadStatic
                            ? 'Change banner'
                            : 'Banner uploads available for supporters'
                    }
                    className={`absolute ${pencilClass} flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 ${
                        canUploadStatic
                            ? 'text-muted-foreground opacity-70 hover:opacity-100'
                            : 'text-chart-4 opacity-90'
                    }`}
                >
                    {canUploadStatic ? (
                        <PencilSimple size={14} weight="bold" />
                    ) : (
                        <LockSimple size={14} weight="bold" />
                    )}
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={
                    canUploadAnimated
                        ? 'image/jpeg,image/png,image/webp,image/gif'
                        : 'image/jpeg,image/png,image/webp'
                }
                onChange={handleFile}
                className="hidden"
            />
        </div>
    );
}
