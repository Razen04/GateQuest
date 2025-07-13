import React, { useEffect, useState } from 'react'
import ThemeContext from './ThemeContext';

const ThemeProvider = ({ children }) => {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") === "true";
    });


    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [dark]);

    const toggleDarkMode = () => {
        localStorage.setItem("theme", !dark);
        setDark(!dark);
    }

    return (
        <ThemeContext.Provider value={{ dark, toggleDarkMode }}>{children}</ThemeContext.Provider>
    )
}

export default ThemeProvider