
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Mock loading state and check for a "logged in" user in localStorage
    const storedUser = localStorage.getItem('fitflowUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === "user@example.com" && pass === "password") {
      const mockUser: UserProfile = { id: "1", email, displayName: "Test User", subscriptionTier: "pro" };
      setUser(mockUser);
      localStorage.setItem('fitflowUser', JSON.stringify(mockUser));
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/dashboard');
    } else {
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
    setLoading(false);
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: UserProfile = { id: "2", email, displayName: name, subscriptionTier: "free" };
    setUser(mockUser);
    localStorage.setItem('fitflowUser', JSON.stringify(mockUser));
    toast({ title: "Signup Successful", description: "Welcome to FitFlow!" });
    router.push('/dashboard'); // Or to /subscribe
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    localStorage.removeItem('fitflowUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
