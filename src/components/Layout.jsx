import React, { useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AuthContext from '../context/AuthContext'
import Login from './Login'

const Layout = () => {
    const { isLogin } = useContext(AuthContext)
    const [showSidebar, setShowSidebar] = useState(false)

    return (
        <div className={`flex h-[100dvh] transition-colors duration-500`}>
            {isLogin ? (
                <div className='w-full h-full z-10 flex items-center justify-center dark:bg-primary-dark'>
                    <Login />
                </div>
            ) : (
                <div className='flex-1 flex h-[100dvh]'>
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
                </div>
            )}

        </div>
    )
}

export default Layout