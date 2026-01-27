import { type ReactNode, createContext, useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  createdAt: string
}

type AuthContextValue = {
  user: User | null
  isBootstrapping: boolean
  loginWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  registerWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'codium_token'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    const controller = new AbortController()

    const bootstrap = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrap()

    return () => controller.abort()
  }, [])

  const loginWithPassword = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { ok: false, error: data?.error || 'Unable to sign in.' }
      }

      if (data?.token) {
        localStorage.setItem(STORAGE_KEY, data.token)
      }
      if (data?.user) {
        setUser(data.user)
      }

      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Please try again.' }
    }
  }

  const registerWithPassword = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { ok: false, error: data?.error || 'Unable to create account.' }
      }

      if (data?.token) {
        localStorage.setItem(STORAGE_KEY, data.token)
      }
      if (data?.user) {
        setUser(data.user)
      }

      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isBootstrapping, loginWithPassword, registerWithPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
