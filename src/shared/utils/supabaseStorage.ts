import { supabase } from './supabaseClient';

const BUCKET = 'avatars';
const BANNER_BUCKET = 'banners';

function buildPath(userId: string, ext: string): string {
    const clean = ext.startsWith('.') ? ext.slice(1) : ext;
    return `${userId}/${Math.floor(Date.now() / 1000)}.${clean}`;
}

function extensionFor(file: File | Blob, fallback = 'jpg'): string {
    const type = file.type.split('/')[1] ?? '';
    if (type === 'jpeg') return 'jpg';
    return type || fallback;
}

async function uploadToBucket(
    bucket: string,
    userId: string,
    file: File | Blob
): Promise<{ url: string; path: string }> {
    const path = buildPath(userId, extensionFor(file));
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '31536000',
        upsert: false,
        contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
}

async function deleteFromBucket(bucket: string, url: string): Promise<void> {
    try {
        const match = url.match(new RegExp(`/${bucket}/(.+)$`));
        if (!match) return;
        const path = match[1];
        if (!path || path.includes('default-')) return;
        await supabase.storage.from(bucket).remove([path]);
    } catch (err) {
        console.warn(`Failed to delete from ${bucket}:`, err);
    }
}

export const uploadAvatar = (userId: string, file: File | Blob) =>
    uploadToBucket(BUCKET, userId, file);
export const deleteAvatarByUrl = (url: string) => deleteFromBucket(BUCKET, url);

export const uploadBanner = (userId: string, file: File | Blob) =>
    uploadToBucket(BANNER_BUCKET, userId, file);
export const deleteBannerByUrl = (url: string) =>
    deleteFromBucket(BANNER_BUCKET, url);
