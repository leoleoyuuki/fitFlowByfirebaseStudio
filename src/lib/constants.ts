
import type { NavItem, Workout, Exercise, SubscriptionPlan, ProgressLog } from '@/types';
import { Dumbbell, Zap, Heart, Target, Brain, User, Settings, LayoutDashboard, BookOpen, Activity, Gift, Flame, Pizza, Barbell } from 'lucide-react'; // Added Flame, Pizza, Barbell

export const APP_NAME = "FitFlow";

export const mainNavItems: NavItem[] = [
  { title: "Hypertrophy Science", href: "/#features" },
  { title: "Pricing", href: "/subscribe" },
];

export const dashboardNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Training Plan", href: "/dashboard/workouts", icon: Barbell }, // Changed icon
  { title: "Exercise Library", href: "/dashboard/exercises", icon: BookOpen },
  { title: "Log Progress", href: "/dashboard/progress", icon: Activity },
  { title: "AI Plan Generator", href: "/dashboard/personalized-plan", icon: Brain },
  { title: "Subscription", href: "/subscribe", icon: Gift },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const MOCK_WORKOUTS: Workout[] = [
  { id: "1", name: "Full Body Hypertrophy", goal: "Hypertrophy", difficulty: "Intermediate", duration: "75 mins", description: "A science-based full-body workout optimized for muscle growth, hitting all major muscle groups.", icon: Barbell, exercises: ["1", "5", "2", "10", "11", "8"] },
  { id: "2", name: "Upper Body Power & Pump", goal: "Hypertrophy", difficulty: "Intermediate", duration: "60 mins", description: "Focus on building strength and size in your chest, back, shoulders, and arms.", icon: Dumbbell, exercises: ["2", "10", "12", "13", "14"] },
  { id: "3", name: "Lower Body & Core Strength", goal: "Hypertrophy", difficulty: "All Levels", duration: "60 mins", description: "Develop powerful legs and a rock-solid core with compound and isolation movements.", icon: Target, exercises: ["1", "5", "3", "8", "9"] },
  { id: "4", name: "Push Day Specialization", goal: "Hypertrophy", difficulty: "Advanced", duration: "70 mins", description: "Intensive push workout focusing on chest, shoulders, and triceps for maximum hypertrophy.", icon: Flame, exercises: ["2", "12", "13", "15", "16"] },
];

export const MOCK_EXERCISES: Exercise[] = [
  { id: "1", name: "Barbell Squats", description: "The king of leg exercises, building overall lower body mass and strength. Essential for quad, glute, and hamstring development.", instructions: "1. Position bar on upper back. Feet shoulder-width apart, toes slightly out. 2. Brace core, descend by hinging hips and bending knees until thighs are parallel to floor or below. 3. Drive through heels to return to start, squeezing glutes at top.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "barbell squat fitness", muscleGroups: ["Quads", "Glutes", "Hamstrings", "Adductors", "Core"] },
  { id: "2", name: "Bench Press", description: "A fundamental upper body exercise targeting the chest, shoulders, and triceps.", instructions: "1. Lie on bench, feet flat on floor. Grip bar slightly wider than shoulder-width. 2. Lower bar to mid-chest, elbows tucked at ~45 degrees. 3. Press bar up until arms fully extended. Control descent.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bench press fitness", muscleGroups: ["Pectorals", "Deltoids (Anterior)", "Triceps"] },
  { id: "3", name: "Romanian Deadlifts (RDLs)", description: "Excellent for hamstring and glute development, also strengthening the lower back.", instructions: "1. Hold barbell or dumbbells in front of thighs, feet hip-width apart. 2. Keeping legs mostly straight (slight knee bend), hinge at hips, lowering weight towards floor. Keep back straight. 3. Feel stretch in hamstrings. Return to start by squeezing glutes.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "romanian deadlift fitness", muscleGroups: ["Hamstrings", "Glutes", "Erector Spinae"] },
  { id: "4", name: "Plank", description: "An isometric core strength exercise, crucial for stability and injury prevention.", instructions: "1. Hold a push-up position, forearms on ground or hands directly under shoulders. 2. Keep body in a straight line from head to heels. 3. Engage core and glutes. Hold for time.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "exercise plank core", muscleGroups: ["Rectus Abdominis", "Transverse Abdominis", "Obliques"] },
  { id: "5", name: "Conventional Deadlifts", description: "A full-body compound exercise building immense strength and muscle, particularly in the posterior chain.", instructions: "1. Stand with feet hip-width apart, barbell over midfoot. 2. Hinge at hips and bend knees, keeping back straight. Grip bar outside knees. 3. Drive through feet, extend hips and knees simultaneously, pulling bar up. Keep bar close to body. 4. Lower bar with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "weightlifting deadlift fitness", muscleGroups: ["Hamstrings", "Glutes", "Erector Spinae", "Quads", "Traps", "Lats"] },
  { id: "6", name: "Overhead Press (OHP)", description: "Builds shoulder strength and size, also works triceps and core.", instructions: "1. Stand with barbell at front shoulder level, grip slightly wider than shoulders. 2. Brace core, press bar overhead until arms fully extended. 3. Lower bar with control back to shoulders.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "overhead press fitness", muscleGroups: ["Deltoids", "Triceps", "Traps", "Core"] },
  { id: "7", name: "Pull-ups / Lat Pulldowns", description: "Key exercises for back width and thickness, targeting the latissimus dorsi.", instructions: "Pull-ups: 1. Grip bar overhand, slightly wider than shoulders. 2. Hang with arms extended. 3. Pull chest towards bar. 4. Lower with control. Lat Pulldowns: Use machine equivalent.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "pullup latpulldown fitness", muscleGroups: ["Latissimus Dorsi", "Biceps", "Rhomboids", "Traps (Middle/Lower)"] },
  { id: "8", name: "Hanging Leg Raises", description: "Advanced core exercise targeting lower abdominals and hip flexors.", instructions: "1. Hang from a pull-up bar. 2. Keeping legs straight (or knees bent for easier version), raise legs towards chest. 3. Lower slowly with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "abs legraise core", muscleGroups: ["Rectus Abdominis (Lower)", "Hip Flexors", "Obliques"] },
  { id: "9", name: "Walking Lunges", description: "Dynamic lunge variation great for leg hypertrophy and unilateral strength.", instructions: "1. Step forward with one leg into a lunge. 2. Lower hips until both knees are bent at a 90-degree angle. 3. Instead of pushing back, push off back foot to step forward with the other leg into the next lunge.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "walking lunge fitness", muscleGroups: ["Quads", "Glutes", "Hamstrings"] },
  { id: "10", name: "Bent-Over Rows", description: "Builds a thick upper back, targeting lats, rhomboids, and traps.", instructions: "1. Hold barbell or dumbbells, feet shoulder-width apart. Hinge at hips to ~45 degrees, back straight. 2. Pull weight towards lower chest/upper abdomen, squeezing shoulder blades. 3. Lower with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bentover row fitness", muscleGroups: ["Latissimus Dorsi", "Rhomboids", "Traps (Middle)", "Biceps", "Erector Spinae"] },
  { id: "11", name: "Bicep Curls", description: "Isolation exercise for bicep growth.", instructions: "1. Stand or sit holding dumbbells, palms facing forward. 2. Curl weights up towards shoulders, keeping elbows stable. 3. Squeeze biceps at top. Lower with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bicep curl fitness", muscleGroups: ["Biceps Brachii", "Brachialis"] },
  { id: "12", name: "Incline Dumbbell Press", description: "Targets the upper portion of the pectoral muscles.", instructions: "1. Lie on incline bench (30-45 degrees). Hold dumbbells at chest level, palms forward. 2. Press dumbbells up until arms extended. 3. Lower slowly with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "incline press fitness", muscleGroups: ["Pectorals (Upper)", "Deltoids (Anterior)", "Triceps"] },
  { id: "13", name: "Lateral Raises", description: "Isolates the medial (side) deltoids for shoulder width.", instructions: "1. Stand holding dumbbells at sides, palms facing body. 2. Raise arms out to sides until parallel to floor, slight bend in elbows. 3. Lower slowly with control.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "lateral raise fitness", muscleGroups: ["Deltoids (Medial)"] },
  { id: "14", name: "Triceps Pushdowns", description: "Cable exercise to isolate and build triceps mass.", instructions: "1. Attach rope or bar to high cable pulley. Grip attachment, elbows tucked. 2. Extend arms downwards until fully locked out, squeezing triceps. 3. Allow arms to return slowly.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "triceps pushdown fitness", muscleGroups: ["Triceps"] },
  { id: "15", name: "Dips", description: "Compound exercise for chest, shoulders, and triceps. Can be bodyweight or weighted.", instructions: "1. Grip parallel bars, support body with arms extended. 2. Lower body by bending elbows until shoulders are below elbows or comfortable. 3. Push back up to start.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "dips fitness", muscleGroups: ["Pectorals (Lower)", "Triceps", "Deltoids (Anterior)"] },
  { id: "16", name: "Close-Grip Bench Press", description: "Bench press variation emphasizing triceps development.", instructions: "1. Lie on bench, grip bar shoulder-width apart or slightly narrower. 2. Lower bar to lower chest, keeping elbows tucked close to body. 3. Press bar up until arms fully extended.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "closegrip bench fitness", muscleGroups: ["Triceps", "Pectorals", "Deltoids (Anterior)"] },
];

// Reminder: Update Stripe Price IDs with actual values from your Stripe Dashboard.
// These should correspond to a Product focused on Hypertrophy plans.
export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "free", name: "FitFlow Basic", price: "Free", features: ["Access to progress logger", "View 1 sample workout plan", "Limited exercise library access"], stripePriceId: "" },
  { id: "hypertrophy", name: "FitFlow Hypertrophy", price: "$14.99/month", features: ["AI-Powered Hypertrophy Training & Diet Plan Generator (Bulking/Cutting)", "Full access to all workout plans & exercises", "Advanced progress tracking & analytics", "Science-based hypertrophy resources"], stripePriceId: "price_your_hypertrophy_plan_id" }, // Replace with your actual Stripe Price ID
];

export const MOCK_PROGRESS_LOGS: ProgressLog[] = [
  { id: "log1", date: new Date(2024, 6, 20).toISOString(), exerciseId: "1", exerciseName: "Barbell Squats", sets: 4, reps: 8, weight: 100 },
  { id: "log2", date: new Date(2024, 6, 20).toISOString(), exerciseId: "2", exerciseName: "Bench Press", sets: 3, reps: 10, weight: 80 },
  { id: "log3", date: new Date(2024, 6, 22).toISOString(), exerciseId: "1", exerciseName: "Barbell Squats", sets: 4, reps: 8, weight: 102.5 },
  { id: "log4", date: new Date(2024, 6, 22).toISOString(), exerciseId: "5", exerciseName: "Conventional Deadlifts", sets: 1, reps: 5, weight: 140 },
  { id: "log5", date: new Date(2024, 6, 24).toISOString(), exerciseId: "10", exerciseName: "Bent-Over Rows", sets: 3, reps: 12, weight: 60 },
];
