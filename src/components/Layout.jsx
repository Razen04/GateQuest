import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = () => {
    const [showSidebar, setShowSidebar] = useState(false)

    return (
        <div className={`flex h-dvh transition-colors duration-500`}>
            <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <div className="flex-1 flex flex-grow flex-col overflow-hidden">
                <Navbar setShowSidebar={setShowSidebar} />
                <main className="flex-1 dark:bg-zinc-900">
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