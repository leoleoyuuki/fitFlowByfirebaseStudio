
import type { NavItem, Workout, Exercise, SubscriptionPlan, ProgressLog } from '@/types';
import { Dumbbell, Zap, Heart, Target, Brain, User, Settings, LayoutDashboard, BookOpen, Activity, Gift } from 'lucide-react';

export const APP_NAME = "FitFlow";

export const mainNavItems: NavItem[] = [
  { title: "Features", href: "/#features" },
  { title: "Pricing", href: "/subscribe" },
];

export const dashboardNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
  { title: "Exercises", href: "/dashboard/exercises", icon: BookOpen },
  { title: "Progress", href: "/dashboard/progress", icon: Activity },
  { title: "Personalized Plan", href: "/dashboard/personalized-plan", icon: Brain },
  { title: "Subscription", href: "/subscribe", icon: Gift },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const MOCK_WORKOUTS: Workout[] = [
  { id: "1", name: "Full Body Strength", goal: "Strength", difficulty: "Intermediate", duration: "60 mins", description: "A comprehensive full-body workout targeting all major muscle groups.", icon: Dumbbell, exercises: ["1", "2", "3", "4", "5"] },
  { id: "2", name: "Cardio Blast", goal: "Cardio", difficulty: "Beginner", duration: "30 mins", description: "Get your heart rate up with this energetic cardio session.", icon: Zap, exercises: ["6", "7"] },
  { id: "3", name: "Core Focus", goal: "Strength", difficulty: "All Levels", duration: "20 mins", description: "Strengthen your core with targeted exercises.", icon: Target, exercises: ["8", "9"] },
  { id: "4", name: "HIIT Challenge", goal: "Cardio", difficulty: "Advanced", duration: "45 mins", description: "High-Intensity Interval Training for maximum calorie burn.", icon: Heart, exercises: ["1", "6", "7"] },
];

export const MOCK_EXERCISES: Exercise[] = [
  { id: "1", name: "Squats", description: "A compound exercise that works the thighs, hips, buttocks, quads, and hamstrings.", instructions: "1. Stand with feet shoulder-width apart. 2. Lower your hips as if sitting in a chair. 3. Keep your chest up and back straight. 4. Push through heels to return to start.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "fitness workout" },
  { id: "2", name: "Push-ups", description: "A classic bodyweight exercise for upper body strength.", instructions: "1. Start in a plank position. 2. Lower your body until your chest nearly touches the floor. 3. Push back up to the starting position.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "exercise pushup" },
  { id: "3", name: "Lunges", description: "Works the glutes, hamstrings, quads, and core.", instructions: "1. Step forward with one leg. 2. Lower hips until both knees are bent at a 90-degree angle. 3. Push back to start and repeat with the other leg.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "fitness lunge" },
  { id: "4", name: "Plank", description: "An isometric core strength exercise.", instructions: "1. Hold a push-up position with forearms on the ground. 2. Keep body in a straight line from head to heels. 3. Engage core and hold.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "exercise plank" },
  { id: "5", name: "Deadlifts", description: "A compound exercise working multiple muscle groups.", instructions: "1. Stand with feet hip-width apart, barbell over midfoot. 2. Hinge at hips, keeping back straight, grip bar. 3. Lift by extending hips and knees. 4. Lower bar with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "weightlifting deadlift" },
  { id: "6", name: "Jumping Jacks", description: "A full-body cardiovascular exercise.", instructions: "1. Stand with feet together, arms at sides. 2. Jump, spreading legs wide and bringing arms overhead. 3. Jump back to start.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "cardio jumping" },
  { id: "7", name: "Burpees", description: "A challenging full-body exercise combining a squat, push-up, and jump.", instructions: "1. Squat, place hands on floor. 2. Kick feet back to plank. 3. Do a push-up. 4. Jump feet forward. 5. Jump up explosively.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "fitness burpee" },
  { id: "8", name: "Crunches", description: "Targets the abdominal muscles.", instructions: "1. Lie on back, knees bent, feet flat. 2. Hands behind head or across chest. 3. Lift upper body towards knees. 4. Lower slowly.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "abs crunches" },
  { id: "9", name: "Leg Raises", description: "Works the lower abdominal muscles.", instructions: "1. Lie on back, legs straight. 2. Raise legs towards ceiling until perpendicular to floor. 3. Lower slowly without touching floor.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "abs legraise" },
];

// IMPORTANT: Replace 'price_xxxx_pro' and 'price_xxxx_premium' with your actual Stripe Price IDs
// associated with your Stripe Product (e.g., 'prod_SNYwJdLjn2v5xb').
// Create these Price IDs in your Stripe Dashboard under the relevant Product.
export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "free", name: "Basic", price: "Free", features: ["Access to 5 workouts", "Limited exercise tutorials", "Basic progress tracking"], stripePriceId: "" },
  { id: "pro", name: "Pro", price: "$9.99/month", features: ["Unlimited workouts", "Full exercise library", "Advanced progress tracking", "Personalized plan generation"], stripePriceId: "price_xxxx_pro" }, // Example: price_1PExamplePro...
  { id: "premium", name: "Premium", price: "$19.99/month", features: ["All Pro features", "1-on-1 coach chat (mock)", "Nutrition guidance (mock)"], stripePriceId: "price_xxxx_premium" }, // Example: price_1PExamplePremium...
];

export const MOCK_PROGRESS_LOGS: ProgressLog[] = [
  { id: "log1", date: new Date(2024, 6, 20).toISOString(), exerciseId: "1", exerciseName: "Squats", sets: 3, reps: 10, weight: 50 },
  { id: "log2", date: new Date(2024, 6, 20).toISOString(), exerciseId: "2", exerciseName: "Push-ups", sets: 3, reps: 15, weight: 0 },
  { id: "log3", date: new Date(2024, 6, 22).toISOString(), exerciseId: "1", exerciseName: "Squats", sets: 3, reps: 12, weight: 55 },
  { id: "log4", date: new Date(2024, 6, 22).toISOString(), exerciseId: "5", exerciseName: "Deadlifts", sets: 1, reps: 5, weight: 100 },
];

