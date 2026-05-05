// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const USERS_KEY = 'cb_users';
const SESSION_KEY = 'cb_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getUsers = async () => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  };

  const saveUsers = async (list) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(list));
  };

  // Register (no auto-login)
  const register = async (name, email, password) => {
    const emailNorm = email.trim().toLowerCase();
    const users = await getUsers();
    if (users.some((u) => u.email === emailNorm)) {
      return { ok: false, error: 'Email already registered. Please login.' };
    }
    const profile = { name: name?.trim() || emailNorm.split('@')[0], email: emailNorm, password };
    users.push(profile);
    await saveUsers(users);
    return { ok: true };
  };

  // Login
  const login = async (email, password) => {
    const emailNorm = email.trim().toLowerCase();
    const users = await getUsers();
    const match = users.find((u) => u.email === emailNorm && u.password === password);
    if (!match) return false;
    const profile = { email: match.email, name: match.name };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    setUser(profile);
    return true;
  };

  // Reset password
  const resetPassword = async (email, newPassword) => {
    const emailNorm = email.trim().toLowerCase();
    const users = await getUsers();
    const idx = users.findIndex((u) => u.email === emailNorm);
    if (idx === -1) return { ok: false, error: 'No account found with that email.' };
    users[idx] = { ...users[idx], password: newPassword };
    await saveUsers(users);
    return { ok: true };
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
