import React, { createContext } from 'react';
import type { AppUser } from '../types/AppUser.ts';

type AuthContextType = {
    user: AppUser | null;
    handleLogin: () => Promise<void>;
    isLogin: boolean;
    logout: () => Promise<void>;
    loading: boolean;
    showLogin: boolean;
    setShowLogin: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export default AuthContext;
