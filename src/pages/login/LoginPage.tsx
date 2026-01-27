import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type AuthFormState = {
  email: string
  password: string
}

export default function LoginPage() {
  const [form, setForm] = useState<AuthFormState>({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { loginWithPassword } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const email = form.email.trim()
    const password = form.password.trim()

    if (!email) {
      setError('Email is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    const result = await loginWithPassword(email, password)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error || 'Unable to sign in.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Mock login</p>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to access the editor demo.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="auth-form__input"
            placeholder="you@studio.dev"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          <label className="auth-form__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="auth-form__input"
            placeholder="••••••"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          {error ? <div className="auth-form__error">{error}</div> : null}

          <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-card__hint">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}
