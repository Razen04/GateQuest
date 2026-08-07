import { X } from '@phosphor-icons/react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { toast } from 'sonner';
import useAuth from '@/shared/hooks/useAuth.ts';
import { supabase } from '@/shared/utils/supabaseClient.ts';

type LoginProp = {
    canClose?: boolean;
    onClose?: () => void;
};

const Login = ({ canClose = true, onClose }: LoginProp) => {
    const handleDevLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'password',
        });

        if (error) {
            console.error('Error logging in:', error.message);
            toast.error('Error logging in');
        } else {
            window.location.reload();
        }
    };

    const { handleLogin } = useAuth();

    return (
        <GoogleOAuthProvider clientId="635706138983-n2tb8pl1iltjs112g2faeoq26um4hj4r.apps.googleusercontent.com">
            <div className="relative mx-4 flex items-center justify-center bg-gradient-to-br from-blue-50/70 via-white/60 to-purple-100/70 dark:from-zinc-900/70 dark:via-zinc-800/60 dark:to-zinc-900/70 backdrop-blur-3xl">
                <div className="w-full max-w-md bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl border border-white/30 dark:border-white/10 p-8 flex flex-col items-center animate-fade-in">
                    {canClose && (
                        <button
                            aria-label="Close"
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 absolute right-3 top-3 cursor-pointer font-bold text-lg transition-all backdrop-blur-xl"
                        >
                            <X className="text-zinc-400 font-bold text-2xl hover:text-black dark:hover:text-white transition-colors" />
                        </button>
                    )}

                    <div className="mb-8 w-full text-center">
                        <h1 className="text-3xl font-bold dark:text-white mb-2 tracking-tight">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
                                GATE
                            </span>
                            Quest
                        </h1>

                        <p className="text-gray-600 dark:text-gray-300 text-base">
                            Sign up or log in to track your progress, bookmark
                            important questions, and join the leaderboard (in
                            future)!
                        </p>
                    </div>

                    <div className="flex w-full justify-center my-2">
                        <GoogleLogin
                            onSuccess={(credentialResponse) => {
                                if (credentialResponse.credential) {
                                    handleLogin(credentialResponse.credential);
                                    if (onClose) onClose();
                                }
                            }}
                            onError={() => {
                                console.error('Google login widget failed');
                            }}
                            theme="filled_blue"
                            shape="rectangular"
                            text="continue_with"
                        />
                    </div>

                    {import.meta.env.DEV && (
                        <div className="mt-5 border border-red-400/50 bg-red-500/10 backdrop-blur-xl p-3 w-full">
                            <h3 className="text-black dark:text-white text-center font-semibold">
                                Dev Tools
                            </h3>
                            <p className="text-black dark:text-white text-center mb-2 text-sm">
                                Login as `test@example.com`
                            </p>

                            <button
                                onClick={handleDevLogin}
                                className="w-full bg-red-500/80 hover:bg-red-600 text-white p-2 cursor-pointer transition-all backdrop-blur-xl shadow-sm"
                            >
                                Log In (Local Dev)
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-xs text-gray-400 text-center w-full">
                        <span>
                            By continuing, you agree to give your details like
                            gmail, name and profile photo.
                        </span>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
