
"use client";

import type { UserProfile } from '@/types';
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { APP_NAME } from '@/lib/constants';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileField: (userId: string, field: keyof UserProfile, value: any) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isPro: boolean;
  isTrialing: boolean;
  daysLeftInTrial: number | null;
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
            trainingStylePreference: userProfileData.trainingStylePreference || null,
            subscriptionTier: userProfileData.subscriptionTier || 'free',
            subscriptionStatus: userProfileData.subscriptionStatus || null,
            stripeCustomerId: userProfileData.stripeCustomerId || null,
            stripeSubscriptionId: userProfileData.stripeSubscriptionId || null,
            trialEndsAt: userProfileData.trialEndsAt || null,
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
                trainingStylePreference: null,
                subscriptionTier: 'free',
                subscriptionStatus: null,
                trialEndsAt: null,
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
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        const trialEndsAtTimestamp = Timestamp.fromDate(trialEndDate);
        
        const initialUserProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any, trialEndsAt: any } = {
          id: userCredential.user.uid,
          email: userCredential.user.email || "",
          displayName: name,
          photoURL: userCredential.user.photoURL || null,
          professionalType: null,
          professionalRegistration: null, 
          trainingStylePreference: null,
          subscriptionTier: 'free',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: 'trialing',
          trialEndsAt: trialEndsAtTimestamp,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialUserProfile);

        setUser(initialUserProfile as UserProfile);
      }
      toast({ title: "Cadastro Realizado e Teste Iniciado!", description: `Bem-vindo(a) ao ${APP_NAME}! Você tem 14 dias para testar todos os recursos Pro.` });
      router.push('/dashboard');
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
      setUser(prevUser => prevUser ? ({ ...prevUser, [field]: value, updatedAt: new Date() }) : null);
    } catch (error: any) {
      console.error(`Erro ao atualizar campo ${field} do perfil:`, error);
      toast({ title: "Erro ao Atualizar", description: `Não foi possível atualizar suas informações. Tente novamente.`, variant: "destructive" });
      throw error; // Re-throw para que o chamador saiba que falhou
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "E-mail de Redefinição Enviado",
        description: `Se uma conta com o e-mail ${email} existir, você receberá um link para redefinição. Verifique sua caixa de entrada e spam.`,
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de redefinição (ocultado do usuário):", error);
      toast({
        title: "E-mail de Redefinição Enviado",
        description: `Se uma conta com o e-mail ${email} existir, você receberá um link para redefinição. Verifique sua caixa de entrada e spam.`,
      });
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const isPro = user?.subscriptionStatus === 'active' && user?.subscriptionTier !== 'free';
  const isTrialing = user?.subscriptionStatus === 'trialing' && user?.trialEndsAt && user.trialEndsAt.toDate() > new Date();

  const daysLeftInTrial = useMemo(() => {
    if (isTrialing && user?.trialEndsAt) {
      const endDate = user.trialEndsAt.toDate();
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return null;
  }, [user, isTrialing]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserProfileField, sendPasswordReset, isPro, isTrialing, daysLeftInTrial }}>
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
