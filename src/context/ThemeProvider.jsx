// This file provides a theme context for the application, enabling dark/light mode.
// It uses localStorage to remember the user's theme choice across sessions.

import React, { useEffect, useState } from 'react'
import ThemeContext from './ThemeContext';

// This component provides the theme state (dark/light) and a toggle function to its children.
const ThemeProvider = ({ children }) => {
    // Initialize theme state from localStorage to persist user preference.
    // The value is stored as a string ("true" or "false"), so a comparison is needed.
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") === "true";
    });

    // This effect applies the 'dark' class to the root <html> element when the theme changes.
    // This allows Tailwind CSS's dark mode variants to work globally.
    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [dark]);

    // Toggles the theme, updating both localStorage and the component state.
    const toggleDarkMode = () => {
        localStorage.setItem("theme", !dark);
        setDark(!dark);
    }

    // The context provider makes the theme state and toggle function available to child components.
    return (
        <ThemeContext.Provider value={{ dark, toggleDarkMode }}>{children}</ThemeContext.Provider>
    )
}

export default ThemeProvider