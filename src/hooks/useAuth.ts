import { useState, useEffect } from 'react';
import { getAuthUser, login as doLogin, logout as doLogout } from '../lib/storage';

export function useAuth() {
  const [user, setUser] = useState(getAuthUser());

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  function login(email: string, senha: string): boolean {
    const ok = doLogin(email, senha);
    if (ok) setUser(getAuthUser());
    return ok;
  }

  function logout() {
    doLogout();
    setUser(null);
  }

  return { user, login, logout, isAuthenticated: !!user };
}
