
import type { LucideIcon } from 'lucide-react';

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
  photoURL?: string;
  subscriptionTier?: 'free' | 'hypertrophy';
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | null;
}

export interface Workout {
  id: string;
  name: string;
  goal: 'Hypertrophy' | 'Strength'; // Focused goals
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  description: string;
  icon: LucideIcon;
  exercises: string[]; // Array of exercise IDs
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string;
  videoUrl?: string; 
  imageUrl?: string; 
  dataAiHint?: string;
  muscleGroups?: string[]; // Key muscle groups targeted
}

export interface SubscriptionPlan {
  id: 'free' | 'hypertrophy'; // Updated plan IDs
  name: string;
  price: string;
  features: string[];
  stripePriceId: string; 
}

export interface ProgressLog {
  id: string;
  date: string; // ISO string
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number; 
  duration?: number; 
  notes?: string;
  // Could add RPE (Rate of Perceived Exertion) or other hypertrophy metrics
}

