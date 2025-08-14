/**
 * @file SettingsRoutes.jsx
 * @description This file defines the nested routes specifically for the settings section of the application.
 * It modularizes the settings-related navigation, making the main AppRoutes cleaner and easier to manage.
 */

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Settings from '../pages/Settings/Settings'
import PrivacySettings from '../pages/Settings/PrivacySettings'
import AccountSettings from '../pages/Settings/AccountSettings'
import AppSettings from '../pages/Settings/AppSettings'

/**
 * @function SettingsRoutes
 * @description A functional component that encapsulates all routes under the '/settings' path.
 * It uses a nested structure to render different settings pages within a common Settings layout.
 */
const SettingsRoutes = () => {
    return (
        <Routes>
            {/* The parent route uses the Settings component as a layout wrapper for all its children. */}
            {/* This allows for a consistent UI (e.g., a settings menu) across all settings pages. */}
            <Route path="/" element={<Settings />}>
                {/* The index route redirects to the 'account' settings page by default. */}
                {/* This ensures that visiting '/settings' directly lands the user on a valid sub-page. */}
                {/* 'replace' is used to avoid adding an unnecessary entry to the browser's history. */}
                <Route index element={<Navigate to='account' replace />} />
                {/* Defines the route for account-specific settings. */}
                <Route path='account' element={<AccountSettings />} />
                {/* Defines the route for privacy-related settings. */}
                <Route path='privacy' element={<PrivacySettings />} />
                {/* Defines the route for application-wide settings (e.g., theme, sound). */}
                <Route path='app-settings' element={<AppSettings />} />
            </Route>
        </Routes>
    )
}

export default SettingsRoutes