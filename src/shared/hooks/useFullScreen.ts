import { useCallback, useEffect, useState } from 'react';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState<boolean>(
        !!document.fullscreenElement
    );

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error toggling fullscreen mode:', err);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange
            );
        };
    }, []);

    return { isFullscreen, toggleFullscreen };
};
