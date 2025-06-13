
import type { LucideIcon } from 'lucide-react';
import type { PersonalizedPlanOutput } from '@/ai/flows/generate-personalized-plan'; // Importando o tipo

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  label?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null; // Consistente com Firebase
  professionalType?: 'physical_educator' | 'nutritionist' | 'both' | null; // Para profissionais
  professionalRegistration?: string | null; // CREF/CFN
  subscriptionTier?: 'free' | 'hypertrophy'; // 'hypertrophy' pode ser renomeado para 'pro' internamente se desejado
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | null;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface Workout {
  id: string;
  name: string;
  goal: 'Hypertrophy' | 'Strength'; 
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  description: string;
  icon: LucideIcon;
  exercises: string[]; 
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string;
  videoUrl?: string; 
  imageUrl?: string; 
  dataAiHint?: string;
  muscleGroups?: string[]; 
}

export interface SubscriptionPlan {
  id: 'free' | 'hypertrophy'; 
  name: string;
  price: string;
  features: string[];
  stripePriceId: string; 
}

export interface ProgressLog {
  id: string; 
  userId: string; 
  date: string; 
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number; 
  duration?: number; 
  notes?: string;
}

// Novo tipo para os dados de plano salvos por profissionais
export interface ClientPlan {
  id: string; // Firestore document ID do plano
  professionalId: string; // ID do profissional que criou
  clientName: string;
  professionalRegistration?: string | null;
  goalPhase: string;
  trainingFrequency: number;
  planData: PersonalizedPlanOutput; // O plano gerado pela IA
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  // Outros metadados que o profissional queira adicionar ao plano
}

    