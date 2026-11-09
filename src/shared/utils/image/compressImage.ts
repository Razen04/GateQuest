import imageCompression from 'browser-image-compression';

export async function compressImage(
    file: File,
    opts?: { maxDimension?: number; targetSizeMB?: number }
): Promise<File> {
    const maxDim = opts?.maxDimension ?? 512;
    const targetMB = opts?.targetSizeMB ?? 0.2;

    const targetType =
        file.type === 'image/png' || file.type === 'image/webp'
            ? 'image/webp'
            : 'image/jpeg';

    return imageCompression(file, {
        maxSizeMB: targetMB,
        maxWidthOrHeight: maxDim,
        useWebWorker: true,
        fileType: targetType,
        initialQuality: 0.85,
    });
}

export const compressBanner = (file: File) =>
    compressImage(file, { maxDimension: 1600, targetSizeMB: 0.3 });
