import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext.js';
import { GoogleLogo, X } from 'phosphor-react';
import Buttons from './Buttons.js';

type LoginProp = {
    canClose?: boolean;
    onClose?: () => void;
};

const Login = ({ canClose = true, onClose }: LoginProp) => {
    const { handleLogin } = useContext(AuthContext);
    return (
        <div className="relative mx-4 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 rounded-2xl">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border-primary dark:border-border-primary-dark p-8 flex flex-col items-center animate-fade-in">
                {canClose && (
                    <button
                        aria-label="Close"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-red-500 absolute right-3 top-3 cursor-pointer font-bold text-lg"
                    >
                        <X className="text-zinc-300 font-bold text-2xl hover:text-black" />
                    </button>
                )}
                <div className="mb-8 w-full text-center">
                    <h1 className="text-3xl font-bold dark:text-white mb-2 tracking-tight">
                        Welcome to{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                            GATE
                        </span>
                        Quest
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-base ">
                        Sign up or log in to track your progress, bookmark important questions, and
                        join the leaderboard(in future)!
                    </p>
                    <p className="mt-2 italic text-sm text-red-300">
                        You can try out the Practice page without sign up.
                    </p>
                </div>
                <Buttons
                    active={true}
                    onClick={handleLogin}
                    className="flex items-center justify-center"
                >
                    <GoogleLogo className="mr-3 text-xl" />
                    <span>Continue with Google</span>
                </Buttons>
                <div className="mt-6 text-xs text-gray-400 text-center w-full">
                    <span>
                        By continuing, you agree to give your details like gmail, name and profile
                        photo.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Login;
