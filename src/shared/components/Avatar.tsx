import { type ReactNode, useState } from 'react';

interface AvatarProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallback?: ReactNode;
    /** Set true for above-the-fold avatars to skip lazy loading */
    priority?: boolean;
}

export function Avatar({
    src,
    alt,
    className = '',
    fallback = '/icons/logo.svg',
    priority = false,
}: AvatarProps) {
    const [errored, setErrored] = useState(false);
    const resolved = !src || errored ? fallback : src;

    // Render fallback component when no image is available
    if (typeof resolved !== 'string') {
        return <>{resolved}</>;
    }

    // WebM (converted from GIF) — render as looping video
    if (resolved.endsWith('.webm')) {
        return (
            <video
                src={resolved}
                autoPlay
                loop
                muted
                playsInline
                aria-label={alt}
                className={className}
            />
        );
    }

    // Preview objectURLs must load immediately; other images can be lazy
    const isBlob = resolved.startsWith('blob:');

    return (
        <img
            src={resolved}
            alt={alt}
            loading={priority || isBlob ? 'eager' : 'lazy'}
            onError={() => setErrored(true)}
            className={className}
        />
    );
}
