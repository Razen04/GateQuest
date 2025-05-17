import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
    // Check if user had previously selected dark mode
    const storedDarkMode = localStorage.getItem('darkMode') === 'true'
    const [darkMode, setDarkMode] = useState(storedDarkMode)

    // Update localStorage and document class when dark mode changes
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode)

        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    // Toggle dark mode
    const toggleDarkMode = () => setDarkMode(!darkMode)

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext)