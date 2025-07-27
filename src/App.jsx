import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import ThemeProvider from './context/ThemeProvider'
import AppProvider from './context/AppProvider'
import AuthProvider from './context/AuthProvider'
import StatsProvider from './context/StatsProvider'
import AppRoutes from './routes/AppRoutes'

function App() {

  return (
    <StatsProvider>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </StatsProvider>
  )
}

export default App