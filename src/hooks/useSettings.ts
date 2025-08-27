import { useContext } from 'react';
import AppSettingContext from '../context/AppSettingContext.ts';

export default function useSettings() {
    const context = useContext(AppSettingContext);
    if (!context) {
        throw new Error('useSettings must be used within a AppSettingProvider');
    }
    return context;
}
