import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Settings from '../pages/Settings/Settings'
import PrivacySettings from '../pages/Settings/PrivacySettings'
import AccountSettings from '../pages/Settings/AccountSettings'
import AppSettings from '../pages/Settings/AppSettings'

const SettingsRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Settings />}>
                <Route index element={<Navigate to='account' replace />} />
                <Route path='account' element={<AccountSettings />} />
                <Route path='privacy' element={<PrivacySettings />} />
                <Route path='app-settings' element={<AppSettings />} />
            </Route>
        </Routes>
    )
}

export default SettingsRoutes