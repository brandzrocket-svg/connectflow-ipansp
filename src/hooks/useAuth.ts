import { useState } from 'react'

const SENHA_CORRETA = 'Connect@2026'
const AUTH_KEY = 'connectflow_auth'

interface AuthUser {
  nome: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    return stored ? JSON.parse(stored) : null
  })

  function login(_email: string, senha: string): Promise<boolean> {
    if (senha === SENHA_CORRETA) {
      const u: AuthUser = { nome: 'Connect IPAN SP', email: 'connect@ipan.com' }
      localStorage.setItem(AUTH_KEY, JSON.stringify(u))
      setUser(u)
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
    return Promise.resolve()
  }

  return { user, login, logout, isAuthenticated: !!user, loading: false }
}
