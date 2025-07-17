import React, { useContext, useEffect, useState } from 'react'
import AppSettingContext from './AppSettingContext'
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../helper'
import AuthContext from './AuthContext'

const AppProvider = ({ children }) => {
    const { isLogin } = useContext(AuthContext)
    const [settings, setSettings] = useState(() => {
        const profle = getUserProfile();
        return profle?.settings ||
        {
            sound: true,
            autoTimer: true,
            shareProgress: true,
            dataCollection: true
        }
    })

    const handleSettingToggle = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    useEffect(() => {
        const profile = getUserProfile();

        if (profile) {
            const updatedProfile = { ...profile, settings }
            updateUserProfile(updatedProfile)
            syncUserToSupabase(isLogin)
        }

    }, [settings])

    return (
        <AppSettingContext.Provider value={{ settings, handleSettingToggle }}>
            {children}
        </AppSettingContext.Provider>
    )
}

export default AppProvider