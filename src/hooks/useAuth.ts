import { useContext } from 'react';
import AuthContext from '../context/AuthContext.ts';

export default function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
}
