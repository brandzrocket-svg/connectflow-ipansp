import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, senha: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    return !error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { user, login, logout, isAuthenticated: !!user, loading }
}
