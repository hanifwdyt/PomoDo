import { useAuth } from '../../hooks/useAuth'
import LoginPage from './LoginPage'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}
