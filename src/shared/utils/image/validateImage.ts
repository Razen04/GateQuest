type ValidationResult =
    | { ok: true; kind: 'image' | 'gif' }
    | { ok: false; reason: string };

// Magic byte signatures — first N bytes identify the file type
const SIGNATURES: Record<string, { offset: number; bytes: number[] }> = {
    'image/jpeg': { offset: 0, bytes: [0xff, 0xd8, 0xff] },
    'image/png': { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] },
    'image/gif': { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
    'image/webp': { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
};

const ALLOWED_MIMES = Object.keys(SIGNATURES);

async function matchesSignature(file: File, mime: string): Promise<boolean> {
    const sig = SIGNATURES[mime];
    if (!sig) return false;

    const needed = sig.offset + sig.bytes.length;
    const buffer = await file.slice(0, needed).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < needed) return false;

    return sig.bytes.every((b, i) => bytes[sig.offset + i] === b);
}

// NOTE: Only donors are allowed for GIFs, add that check in-future
export async function validateImageFile(
    file: File,
    opts: {
        allowGif: boolean;
        imageMaxBytes: number;
        gifMaxBytes: number;
    }
): Promise<ValidationResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedExts = opts.allowGif
        ? ['jpg', 'jpeg', 'png', 'webp', 'gif']
        : ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedExts.includes(ext)) {
        return {
            ok: false,
            reason: `Unsupported file type. Use ${allowedExts.join(', ')}.`,
        };
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
        return { ok: false, reason: 'Invalid image file.' };
    }

    const isValid = await matchesSignature(file, file.type);
    if (!isValid) {
        return { ok: false, reason: 'File content does not match its type.' };
    }

    const isGif = file.type === 'image/gif';

    if (isGif && !opts.allowGif) {
        return { ok: false, reason: 'GIF avatars are not available.' };
    }

    const max = isGif ? opts.gifMaxBytes : opts.imageMaxBytes;
    if (file.size > max) {
        const mb = (max / (1024 * 1024)).toFixed(1);
        return {
            ok: false,
            reason: `File too large. Maximum ${mb}MB for ${isGif ? 'GIFs' : 'images'}.`,
        };
    }

    return { ok: true, kind: isGif ? 'gif' : 'image' };
}
