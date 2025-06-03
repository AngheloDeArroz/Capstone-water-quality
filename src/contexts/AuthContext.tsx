
"use client";

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Simulate a user object for now
interface AppUser extends Pick<User, 'email'> {
  // Add any other custom user properties here
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a logged-in user from localStorage
    try {
      const storedUser = localStorage.getItem('rrjAquatiqueUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('rrjAquatiqueUser');
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    const simulatedUser: AppUser = { email };
    localStorage.setItem('rrjAquatiqueUser', JSON.stringify(simulatedUser));
    setUser(simulatedUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('rrjAquatiqueUser');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
