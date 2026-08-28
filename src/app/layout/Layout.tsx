import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import useStudyPlan from '@/features/dashboard/hooks/useStudyPlan';
import { useSessionLogger } from '@/shared/hooks/useSessionLogger.ts';
import type { AppUser } from '@/shared/types/AppUser';
import { getUserProfile } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';
import Navbar from './Navbar.tsx';
import Sidebar from './Sidebar/Sidebar.tsx';
import { UsernameModal } from './UsernameModal.tsx';

type SyncOnUnloadProps = {
    user: AppUser | null;
};

function SyncOnUnload({ user }: SyncOnUnloadProps) {
    const { refresh } = useStudyPlan();
    useSessionLogger();

    useEffect(() => {
        const LOCAL_KEY = `attempt_buffer_${user?.id}`;

        const handleBeforeUnload = async () => {
            const buffer = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');

            if (user?.id && buffer.length > 0) {
                try {
                    await supabase
                        .from('user_question_activity')
                        .insert(buffer);
                    refresh();
                    localStorage.removeItem(LOCAL_KEY);
                } catch (err) {
                    console.error('Sync failed during unload: ', err);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [user, refresh]);

    return null;
}

const Layout = () => {
    const user = getUserProfile();
    const location = useLocation();

    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        mainRef.current?.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });
    }, [location.pathname]);

    const FOCUS_PATHS = ['/topic-test'];
    const isPracticeCard = /^\/practice\/[^/]+\/[^/]+/.test(location.pathname);

    const hideMobileNavigation = FOCUS_PATHS.some(
        (path) => location.pathname.startsWith(path) || isPracticeCard
    );

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
            <Navbar />

            <main
                ref={mainRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
            >
                <SyncOnUnload user={user} />
                <Outlet />
            </main>

            <Sidebar
                showSidebar={false}
                setShowSidebar={() => {}}
                hideMobileNavigation={hideMobileNavigation}
            />

            <UsernameModal />
        </div>
    );
};

export default Layout;
