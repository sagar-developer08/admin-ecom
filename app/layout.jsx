import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { MetricsProvider } from '../contexts/MetricsContext'

export const metadata = {
  title: 'QLIQ Admin Dashboard',
  description: 'Admin dashboard for QLIQ platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <MetricsProvider>
            {children}
          </MetricsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
