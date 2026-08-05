import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useSessionLogger = () => {
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname + location.search;
        const segments = location.pathname.split('/').filter(Boolean);

        if (
            !segments[0] ||
            segments[0] === 'dashboard' ||
            segments[0] === 'settings' ||
            segments[0] === 'about'
        ) {
            return;
        }

        const isPractice = segments[0] === 'practice';
        const isRevision = segments[0] === 'revision';
        const isDonate = segments[0] === 'donate';

        const isTopicTest =
            segments[0] === 'topic-test' ||
            segments[0] === 'topic-test-generate' ||
            segments[0] === 'topic-test-result' ||
            segments[0] === 'topic-test-review';

        if (isPractice || isRevision || isTopicTest || isDonate) {
            localStorage.setItem('gatequest_last_active_session', currentPath);
            localStorage.setItem('gatequest_last_active_timestamp', String(Date.now()));
        }
    }, [location]);
};
