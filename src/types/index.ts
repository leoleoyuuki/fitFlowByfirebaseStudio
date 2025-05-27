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
  subscriptionTier?: 'free' | 'pro' | 'premium';
}

export interface Workout {
  id: string;
  name: string;
  goal: 'Strength' | 'Cardio' | 'Flexibility' | 'Balance';
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
  videoUrl?: string; // URL to a video or placeholder
  imageUrl?: string; // URL to an image or placeholder
  dataAiHint?: string;
  muscleGroups?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  stripePriceId: string; // For actual Stripe integration
}

export interface ProgressLog {
  id: string;
  date: string; // ISO string
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number; // Optional, for bodyweight exercises
  duration?: number; // Optional, for time-based exercises
  notes?: string;
}
