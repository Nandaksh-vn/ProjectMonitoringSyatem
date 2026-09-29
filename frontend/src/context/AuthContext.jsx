import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('infrawatch_user');
    const token = localStorage.getItem('infrawatch_token');
    if (saved && token) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    // Backend returns: { token, id, username, email, role }
    const { token, id, username: uname, email, role } = res.data;
    const userData = { id, username: uname, email, role, fullName: uname, department: role };
    localStorage.setItem('infrawatch_token', token);
    localStorage.setItem('infrawatch_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
