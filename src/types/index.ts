
import type { LucideIcon } from 'lucide-react';
import type { PersonalizedPlanOutput, PersonalizedPlanInput } from '@/ai/flows/generate-personalized-plan';

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
  photoURL?: string | null; 
  professionalType?: 'physical_educator' | 'nutritionist' | 'both' | null; 
  professionalRegistration?: string | null; 
  subscriptionTier?: 'free' | 'light' | 'pro' | 'elite'; 
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | null;
  createdAt?: any; 
  updatedAt?: any; 
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

export interface PlanFeature {
    text: string;
    included: boolean;
}

export interface SubscriptionPlan {
  id: 'light' | 'pro' | 'elite';
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  stripePriceId: string;
  isPopular?: boolean;
  icon?: LucideIcon;
  planLimit: number;
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

// Input type for the client form, slightly different from PersonalizedPlanInput for AI
export type ClientPersonalizedPlanInputValues = {
  professionalRole: "physical_educator" | "nutritionist" | "both";
  professionalRegistration: string;
  clientName: string;
  goalPhase: "bulking" | "cutting" | "maintenance";
  trainingExperience: "beginner" | "intermediate" | "advanced";
  trainingFrequency: number;
  trainingVolumePreference: "low" | "medium" | "high";
  availableEquipment: string;
  heightCm?: number | string; // string to allow empty input, coerced to number
  weightKg?: number | string;
  age?: number | string;
  sex?: "male" | "female" | "prefer_not_to_say" | "";
  dietaryPreferences?: string;
};


export interface ClientPlan {
  id: string; 
  professionalId: string; 
  clientName: string;
  professionalRegistration?: string | null;
  goalPhase: string;
  trainingFrequency: number;
  planData: PersonalizedPlanOutput; 
  originalInputs: ClientPersonalizedPlanInputValues; // Inputs used to generate this plan
  createdAt: any; 
  updatedAt: any; 
}
