import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useTheme } from '../context/ThemeContext'

const Layout = () => {
    const { darkMode } = useTheme()

    return (
        <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout