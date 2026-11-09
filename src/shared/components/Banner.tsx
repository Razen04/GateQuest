import { useState } from 'react';

interface BannerProps {
    src: string | null | undefined;
    alt?: string;
    className?: string;
    priority?: boolean;
}

export function Banner({
    src,
    alt = 'Profile banner',
    className = '',
    priority = false,
}: BannerProps) {
    const [errored, setErrored] = useState(false);

    if (!src || errored) return null; // parent handles empty state

    if (src.endsWith('.webm')) {
        return (
            <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                aria-label={alt}
                onError={() => setErrored(true)}
                className={className}
            />
        );
    }

    const isBlob = src.startsWith('blob:');

    return (
        <img
            src={src}
            alt={alt}
            loading={priority || isBlob ? 'eager' : 'lazy'}
            onError={() => setErrored(true)}
            className={className}
        />
    );
}
