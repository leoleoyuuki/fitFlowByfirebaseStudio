
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userProfileData: Partial<UserProfile> = {};
          if (userDocSnap.exists()) {
            userProfileData = userDocSnap.data() as UserProfile;
          }
          
          const userProfile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || userProfileData.displayName || undefined,
            photoURL: firebaseUser.photoURL || userProfileData.photoURL || undefined,
            subscriptionTier: userProfileData.subscriptionTier || 'free',
            stripeCustomerId: userProfileData.stripeCustomerId || null,
            stripeSubscriptionId: userProfileData.stripeSubscriptionId || null,
            subscriptionStatus: userProfileData.subscriptionStatus || null,
          };
          setUser(userProfile);

        } catch (error) {
            console.error("Erro ao buscar perfil do usuário no Firestore:", error);
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || undefined,
                photoURL: firebaseUser.photoURL || undefined,
                subscriptionTier: 'free',
            };
            setUser(userProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Login Efetuado", description: "Bem-vindo de volta!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({ title: "Falha no Login", description: error.message || "E-mail ou senha inválidos.", variant: "destructive" });
      setLoading(false); // Explicitly set loading false on error
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const initialUserProfile: UserProfile = {
          id: userCredential.user.uid,
          email: userCredential.user.email || "",
          displayName: name,
          photoURL: userCredential.user.photoURL || undefined,
          subscriptionTier: 'free',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
        };
        await setDoc(userDocRef, {
            ...initialUserProfile,
            createdAt: serverTimestamp()
        });

        setUser(initialUserProfile);
      }
      toast({ title: "Cadastro Realizado", description: "Bem-vindo ao FitFlow!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({ title: "Falha no Cadastro", description: error.message || "Não foi possível criar a conta.", variant: "destructive" });
      setLoading(false); // Explicitly set loading false on error
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Logout Efetuado", description: "Você foi desconectado com sucesso." });
      router.push('/login');
    } catch (error: any) {
      console.error("Erro no logout:", error);
      toast({ title: "Falha no Logout", description: error.message || "Não foi possível desconectar.", variant: "destructive" });
      setLoading(false); // Explicitly set loading false on error
    }
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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

