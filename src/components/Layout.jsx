import React, { useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Login from './Login'
import AuthContext from '../context/AuthContext'

const Layout = () => {
    const [showSidebar, setShowSidebar] = useState(false)
    const { showLogin, setShowLogin } = useContext(AuthContext)

    return (
        <div className={`flex h-[100dvh] transition-colors duration-500`}>
            <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar setShowSidebar={setShowSidebar} />
                <main className="flex-1 overflow-y-auto dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-transparent bg-opacity-40 z-0 lg:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <Login onClose={() => setShowLogin(false)} canClose={true} />
                </div>
            )}
        </div>
    )
}

export default Layout