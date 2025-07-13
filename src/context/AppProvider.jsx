import React, { useEffect, useState } from 'react'
import AppSettingContext from './AppSettingContext'
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../helper'

const AppProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const profle = getUserProfile();
        return profle?.settings ||
        {
            sound: true,
            autoTimer: true
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

        if(profile) {
            const updatedProfile = { ...profile, settings }
            updateUserProfile(updatedProfile)
            syncUserToSupabase()
        }
        
    }, [settings])

    return (
        <AppSettingContext.Provider value={{ settings, handleSettingToggle }}>
            {children}
        </AppSettingContext.Provider>
    )
}

export default AppProvider