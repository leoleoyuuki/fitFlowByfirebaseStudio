
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
import { APP_NAME } from '@/lib/constants';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileField: (userId: string, field: keyof UserProfile, value: any) => Promise<void>;
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
            displayName: firebaseUser.displayName || userProfileData.displayName || "Profissional",
            photoURL: firebaseUser.photoURL || userProfileData.photoURL || null,
            professionalType: userProfileData.professionalType || null,
            professionalRegistration: userProfileData.professionalRegistration || null,
            subscriptionTier: userProfileData.subscriptionTier || 'free',
            stripeCustomerId: userProfileData.stripeCustomerId || null,
            stripeSubscriptionId: userProfileData.stripeSubscriptionId || null,
            subscriptionStatus: userProfileData.subscriptionStatus || null,
            createdAt: userProfileData.createdAt || null,
            updatedAt: userProfileData.updatedAt || null,
          };
          setUser(userProfile);

        } catch (error) {
            console.error("Erro ao buscar perfil do usuário no Firestore:", error);
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "Profissional",
                photoURL: firebaseUser.photoURL || null,
                professionalType: null,
                professionalRegistration: null,
                subscriptionTier: 'free',
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                subscriptionStatus: null,
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
      toast({ title: "Login Efetuado", description: `Bem-vindo(a) de volta ao ${APP_NAME}!` });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Erro no login:", error);
      let description = "Ocorreu um erro ao tentar fazer login. Tente novamente.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.";
      } else if (error.code === 'auth/too-many-requests') {
        description = "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
      }
      toast({ title: "Falha no Login", description: description, variant: "destructive" });
      setLoading(false); 
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
          photoURL: userCredential.user.photoURL || null,
          professionalType: null, // Novo campo
          professionalRegistration: null, // Novo campo
          subscriptionTier: 'free',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialUserProfile);

        setUser(initialUserProfile);
      }
      toast({ title: "Cadastro Realizado", description: `Bem-vindo(a) ao ${APP_NAME}! Sua conta profissional foi criada.` });
      router.push('/dashboard'); // Pode ser /subscribe ou uma página de onboarding para profissionais
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let description = "Não foi possível criar a conta. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este e-mail já está em uso. Tente outro e-mail ou faça login.";
      } else if (error.code === 'auth/weak-password') {
        description = "A senha é muito fraca. Por favor, use uma senha mais forte (mínimo 6 caracteres).";
      }
      toast({ title: "Falha no Cadastro", description: description, variant: "destructive" });
      setLoading(false); 
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
      setLoading(false); 
    }
  };

  const updateUserProfileField = async (userId: string, field: keyof UserProfile, value: any) => {
    if (!userId) return;
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      // Atualiza o estado local do usuário também
      setUser(prevUser => prevUser ? ({ ...prevUser, [field]: value, updatedAt: new Date() }) : null);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram atualizadas." });
    } catch (error: any) {
      console.error(`Erro ao atualizar campo ${field} do perfil:`, error);
      toast({ title: "Erro ao Atualizar", description: `Não foi possível atualizar suas informações. Tente novamente.`, variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserProfileField }}>
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

    