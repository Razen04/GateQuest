import React, { useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { getUserProfile } from '../helper'
import StatsContext from '../context/StatsContext'
import { supabase } from '../../supabaseClient'

const Layout = () => {
    const { updateStats } = useContext(StatsContext);
    const [showSidebar, setShowSidebar] = useState(false)
    const user = getUserProfile();
    function SyncOnUnload({ user, updateStats }) {
        useEffect(() => {
            const LOCAL_KEY = `attempt_buffer_${user?.id}`;

            const handleBeforeUnload = async () => {
                const buffer = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");

                if (user?.id && buffer.length > 0) {
                    // Avoid toast and UI in unload
                    try {
                        await supabase
                            .from('user_question_activity')
                            .insert(buffer);

                        await updateStats(user); // safe to call

                        localStorage.removeItem(LOCAL_KEY);
                    } catch (err) {
                        console.error("Sync failed during unload: ", err);
                    }
                }
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }, [user, updateStats]);

        return null;
    }

    return (
        <div className={`flex h-dvh transition-colors duration-500`}>
            <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <div className="flex-1 flex flex-grow flex-col overflow-hidden">
                <Navbar setShowSidebar={setShowSidebar} />
                <main className="flex-1 dark:bg-zinc-900">
                    <SyncOnUnload user={user} updateStats={updateStats} />
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
    )
}

export default Layout