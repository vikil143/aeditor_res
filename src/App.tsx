import { Navigate, Route, Routes } from 'react-router-dom'
import CodiumEditor from './components/codium-editor/CodiumEditor'
import { CodiumEditorProvider } from './components/codium-editor/CodiumEditorContext'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, logout, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Loading</p>
          <h1 className="auth-card__title">Checking session</h1>
          <p className="auth-card__subtitle">Please wait a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/"
        element={
          user ? (
            <div className="app-shell">
              <header className="app-header">
                <div className="app-header__title">Codium Studio</div>
                <div className="app-header__actions">
                  <span className="app-header__user">Signed in as {user.email}</span>
                  <button type="button" className="app-header__logout" onClick={logout}>
                    Sign out
                  </button>
                </div>
              </header>
              <CodiumEditorProvider>
                <CodiumEditor />
              </CodiumEditorProvider>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
