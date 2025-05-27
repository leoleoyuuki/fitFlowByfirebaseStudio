
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
import { auth, db } from '@/lib/firebase'; // Import initialized auth and db
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
            console.error("Error fetching user profile from Firestore:", error);
            // Fallback to basic profile if Firestore fetch fails
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
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create user document in Firestore
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
          // createdAt: serverTimestamp(), // Add if you want to track creation time
        };
        await setDoc(userDocRef, {
            ...initialUserProfile,
            createdAt: serverTimestamp() // Add creation timestamp
        });

        setUser(initialUserProfile); // Update local state
      }
      toast({ title: "Signup Successful", description: "Welcome to FitFlow!" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    } finally {
      // setLoading(false); // onAuthStateChanged will set user to null and loading to false
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

