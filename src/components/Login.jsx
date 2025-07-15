import React, { useContext } from 'react'
import { FaCross, FaGoogle } from 'react-icons/fa'
import AuthContext from '../context/AuthContext'
import { FaXmark } from 'react-icons/fa6'

const Login = () => {
    const { login, toggleLogin } = useContext(AuthContext)
    return (
        <div className="relative mx-4 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 rounded-2xl">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-primary dark:border-border-primary-dark p-8 flex flex-col items-center animate-fade-in">
                <button onClick={toggleLogin} className='p-2 rounded-full hover:bg-red-400 absolute right-3 top-3 cursor-pointer font-bold text-lg'><FaXmark className='text-red-500 font-bold text-2xl' /></button>
                <div className="mb-8 w-full text-center">
                    <h1 className="text-3xl font-extrabold dark:text-white mb-2 tracking-tight"><span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Welcom to GATE</span>Quest</h1>
                    <p className="text-gray-600 dark:text-gray-300 text-base italic">Sign up or log in to track your progress, bookmark important questions, and join the leaderboard!</p>
                </div>
                <button
                    onClick={login}
                    className="flex items-center justify-center w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 mb-2 cursor-pointer"
                >
                    <FaGoogle className="mr-3 text-xl" /> Continue with Google
                </button>
                <div className="mt-6 text-xs text-gray-400 text-center w-full">
                    <span>By continuing, you agree to give your details like gmail, name and profile photo.</span>
                </div>
            </div>
        </div>
    )
}

export default Login