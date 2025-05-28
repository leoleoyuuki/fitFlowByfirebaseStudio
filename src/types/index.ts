
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
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | null;
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
  id: string; // Firestore document ID
  userId: string; // ID of the user who created the log
  date: string; // ISO string for consistency, can be Timestamp in Firestore
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number; 
  duration?: number; 
  notes?: string;
}

