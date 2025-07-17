import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Practice from './components/Practice/Practice'
import Settings from './components/Settings'
import Contact from './components/Contact'
import ThemeProvider from './context/ThemeProvider'
import AppProvider from './context/AppProvider'
import AuthProvider from './context/AuthProvider'
import StatsProvider from './context/StatsProvider'

function App() {

  

  return (
    <AuthProvider>
      <StatsProvider>
        <AppProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="practice" element={<Practice />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </AppProvider>
      </StatsProvider>   
    </AuthProvider>
  )
}

export default App