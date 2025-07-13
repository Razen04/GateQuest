import React, { useContext } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AuthContext from '../context/AuthContext'
import Login from './Login'

const Layout = () => {
    const { isLogin } = useContext(AuthContext)

    return (
        <div className={`flex h-screen transition-colors duration-500`}>
            {isLogin ? (
                <div className='w-full h-full z-10 flex items-center justify-center dark:bg-primary-dark'>
                    <Login />
                </div>
            ) : (
                <div className='flex-1 flex h-screen'>
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Navbar />
                        <main className="flex-1 overflow-y-auto dark:bg-gray-900">
                            <Outlet />
                        </main>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Layout