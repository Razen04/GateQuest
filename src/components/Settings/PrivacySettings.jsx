import React, { useContext } from 'react'
import { FaShieldAlt } from 'react-icons/fa'
import ToggleSwitch from '../ToggleSwitch'
import AuthContext from '../../context/AuthContext'
import Login from '../Login'
import AppSettingContext from '../../context/AppSettingContext'

const PrivacyButtons = ({ label, format = "", type = "", onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left cursor-pointer px-4 py-3 border border-border-primary dark:border-border-primary-dark rounded-lg ${type !== "delete" ? type === "login" ? "dark:bg-primary-dark hover:bg-green-500 dark:hover:text-text-primary" : "hover:bg-gray-50 dark:hover:bg-text-primary" : "hover:bg-red-400 dark:hover:bg-red-500"} flex justify-between items-center`}
        >
            <span>{label}</span>
            <span className="text-blue-500">{format}</span>
        </button>
    )
}

const PrivacySettings = () => {
    const { user, logout, showLogin, setShowLogin } = useContext(AuthContext);
    const { settings, handleSettingToggle } = useContext(AppSettingContext);

    return (
        <div>
            <div className={`${showLogin ? 'blur-2xl' : null}`}>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <FaShieldAlt className="mr-2" /> Privacy & Data
                </h2>

                <div className="space-y-4">
                    <ToggleSwitch
                        isOn={settings.shareProgress}
                        onToggle={() => handleSettingToggle('shareProgress')}
                        label="Share My Progress & Ranking"
                    />

                    <ToggleSwitch
                        isOn={settings.dataCollection}
                        onToggle={() => handleSettingToggle('dataCollection')}
                        label="Remain Anonymous"
                    />

                    <div className="py-3 border-t border-gray-100 mt-3 pt-3">
                        <h3 className="text-base font-medium mb-4">Data Management</h3>

                        <div className="space-y-3">
                            <PrivacyButtons label="Export My Data" format="JSON / CSV" />
                            <PrivacyButtons label="Clear Local Storage" format="34.2 MB" />
                            {user ? (<PrivacyButtons label="Logout" type="delete" onClick={() => logout()} />) : (<PrivacyButtons label="Sign up/Login" type="login" onClick={() => setShowLogin(true)} />)}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default PrivacySettings