import { AuthProvider } from './context/auth'
import { ThemeProvider } from './context/theme'
import { Router } from './router'

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  )
}
