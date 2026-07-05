import { AuthProvider } from './context/auth'
import { ThemeProvider } from './context/theme'
import { BrandingProvider } from './context/branding'
import { LocaleProvider } from './context/locale'
import { Router } from './router'

export function App() {
  return (
    <ThemeProvider>
      <BrandingProvider>
        <LocaleProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </LocaleProvider>
      </BrandingProvider>
    </ThemeProvider>
  )
}
