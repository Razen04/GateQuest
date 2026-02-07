import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar.tsx';
import Navbar from './Navbar.tsx';
import { getUserProfile } from '../helper.ts';
import { supabase } from '../utils/supabaseClient.ts';
import type { AppUser } from '../types/AppUser.ts';
import useStudyPlan from '@/hooks/useStudyPlan.ts';

type SyncOnUnloadProps = {
    user: AppUser | null;
};
function SyncOnUnload({ user }: SyncOnUnloadProps) {
    const { refresh } = useStudyPlan();
    useEffect(() => {
        const LOCAL_KEY = `attempt_buffer_${user?.id}`;

        const handleBeforeUnload = async () => {
            const buffer = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');

            if (user?.id && buffer.length > 0) {
                // Avoid toast and UI in unload
                try {
                    await supabase.from('user_question_activity').insert(buffer);

                    refresh(); // safe to call

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
    const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1024);
    const user = getUserProfile();

    // to get location for focus mode to remove mobile dock
    const location = useLocation();
    const FOCUS_PATHS = ['/topic-test'];
    const isPracticeCard = /^\/practice\/[^/]+\/[^/]+/.test(location.pathname);

    const hideMobileNavigation = FOCUS_PATHS.some(
        (path) => location.pathname.startsWith(path) || isPracticeCard,
    );

    return (
        <div className="flex h-dvh transition-colors duration-500">
            <Sidebar
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
                hideMobileNavigation={hideMobileNavigation}
            />
            <div className="flex-1 flex flex-grow flex-col overflow-x-hidden">
                <Navbar />
                <main className="h-full overflow-y-auto overflow-x-hidden flex-1 dark:bg-zinc-900">
                    <SyncOnUnload user={user} />
                    <Outlet />
                </main>
            </div>

            {showSidebar && (
                <div
                    className="fixed inset-0 bg-transparent bg-opacity-40 z-0 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
        </div>
    );
};

export default Layout;
