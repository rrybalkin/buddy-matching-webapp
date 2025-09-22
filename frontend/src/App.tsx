import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import BuddiesPage from './pages/BuddiesPage'
import MatchesPage from './pages/MatchesPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import RequestsPage from './pages/RequestsPage'
import NotificationsPage from './pages/NotificationsPage'

// Components
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <SocketProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/buddies" element={<BuddiesPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:matchId" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </SocketProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
