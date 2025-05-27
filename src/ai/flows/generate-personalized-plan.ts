
'use server';
/**
 * @fileOverview AI-powered personalized hypertrophy training and diet plan generator.
 *
 * - generatePersonalizedPlan - Generates a science-based hypertrophy plan.
 * - PersonalizedPlanInput - Input for generating the plan.
 * - PersonalizedPlanOutput - Output containing training and diet guidance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedPlanInputSchema = z.object({
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Please select your primary goal (bulking, cutting, or maintenance)." })
    .describe('The user’s primary goal: bulking (muscle gain with calorie surplus), cutting (fat loss with calorie deficit while preserving muscle), or maintenance.'),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your training experience level." })
    .describe('The user’s training experience (beginner: <1 year consistent lifting, intermediate: 1-3 years, advanced: 3+ years).'),
  trainingFrequency: z.coerce.number().min(2).max(6)
    .describe('How many days per week the user can train (2-6 days).'),
  availableEquipment: z
    .string()
    .min(5, { message: "Please list available equipment (min 5 characters, e.g., 'dumbbells, bands', 'full gym', 'bodyweight only')."})
    .describe('The equipment available to the user (e.g., dumbbells, barbells, machines, bodyweight only).'),
  heightCm: z.coerce.number().positive().optional()
    .describe('User height in centimeters (optional, for more accurate diet plan).'),
  weightKg: z.coerce.number().positive().optional()
    .describe('User weight in kilograms (optional, for more accurate diet plan).'),
  age: z.coerce.number().positive().optional()
    .describe('User age in years (optional, for more accurate diet plan).'),
  sex: z.enum(["male", "female"]).optional()
    .describe('User biological sex (optional, for more accurate diet plan).'),
  dietaryPreferences: z.string().optional()
    .describe('Any dietary preferences or restrictions (e.g., vegetarian, vegan, allergies like gluten-free, lactose intolerant). Default is no restrictions.'),
});

export type PersonalizedPlanInput = z.infer<typeof PersonalizedPlanInputSchema>;

const ExerciseDetailSchema = z.object({
  name: z.string().describe("Name of the exercise."),
  sets: z.string().describe("Number of sets (e.g., '3-4' or '3')."),
  reps: z.string().describe("Repetition range (e.g., '8-12', '5', 'AMRAP')."),
  restSeconds: z.number().optional().describe("Rest time in seconds between sets (e.g., 60, 90, 120)."),
  tempo: z.string().optional().describe("Optional tempo for lifts (e.g., '2-0-1-0': 2s eccentric, 0s pause, 1s concentric, 0s pause)."),
  notes: z.string().optional().describe("Specific instructions or notes for the exercise (e.g., 'Focus on controlled eccentric', 'Go to failure on last set').")
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe("Day of the week (e.g., 'Monday', 'Day 1') or muscle group focus (e.g., 'Push Day')."),
  focus: z.string().optional().describe("Primary focus for the day if applicable (e.g., 'Chest & Triceps', 'Full Body')."),
  exercises: z.array(ExerciseDetailSchema).describe("List of exercises for the day.")
});

const TrainingPlanSchema = z.object({
  weeklySplitDescription: z.string().describe("Description of the training split (e.g., '3-Day Full Body Split', '4-Day Upper/Lower Split')."),
  workouts: z.array(DailyWorkoutSchema).describe("Array of daily workouts for the week."),
  notes: z.string().optional().describe("General notes or advice for the training plan (e.g., 'Ensure progressive overload', 'Warm-up before each session').")
});

const DietGuidanceSchema = z.object({
  estimatedDailyCalories: z.number().describe("Estimated daily calorie target based on goal phase."),
  proteinGrams: z.number().describe("Daily protein target in grams."),
  carbGrams: z.number().describe("Daily carbohydrate target in grams."),
  fatGrams: z.number().describe("Daily fat target in grams."),
  mealExamples: z.array(z.string()).optional().describe("Example meal ideas or food suggestions aligned with macros and preferences."),
  notes: z.string().optional().describe("General dietary advice, e.g., hydration, food quality, meal timing flexibility.")
});

const PersonalizedPlanOutputSchema = z.object({
  trainingPlan: TrainingPlanSchema.describe("A detailed, science-based hypertrophy training plan."),
  dietGuidance: DietGuidanceSchema.describe("Personalized dietary guidance including macro targets and meal ideas."),
  overallSummary: z.string().describe("A brief summary of the plan and key recommendations.")
});

export type PersonalizedPlanOutput = z.infer<typeof PersonalizedPlanOutputSchema>;

export async function generatePersonalizedPlan(input: PersonalizedPlanInput): Promise<PersonalizedPlanOutput> {
  return generatePersonalizedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedHypertrophyPlanPrompt',
  input: {schema: PersonalizedPlanInputSchema},
  output: {schema: PersonalizedPlanOutputSchema},
  prompt: `You are an expert kinesiologist and certified nutrition coach specializing in science-based hypertrophy (muscle growth) for natural lifters.
Your task is to generate a comprehensive, personalized training and diet plan based on the user's input.

User Details:
- Goal Phase: {{{goalPhase}}} (bulking = calorie surplus for muscle gain; cutting = calorie deficit for fat loss while preserving muscle; maintenance = maintain current physique)
- Training Experience: {{{trainingExperience}}}
- Training Frequency: {{{trainingFrequency}}} days per week
- Available Equipment: {{{availableEquipment}}}
- Height (cm): {{#if heightCm}}{{{heightCm}}}{{else}}Not Provided{{/if}}
- Weight (kg): {{#if weightKg}}{{{weightKg}}}{{else}}Not Provided{{/if}}
- Age: {{#if age}}{{{age}}}{{else}}Not Provided{{/if}}
- Sex: {{#if sex}}{{{sex}}}{{else}}Not Provided{{/if}}
- Dietary Preferences: {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}None{{/if}}

Instructions for Plan Generation:

1.  **Training Plan:**
    *   Design a weekly training split appropriate for the user's experience and frequency (e.g., Full Body, Upper/Lower, Push/Pull/Legs). Clearly state the split type.
    *   For each workout day, list exercises with specific sets, rep ranges (e.g., 6-10 for compounds, 10-15 for isolation, 12-20 for some accessories), and recommended rest times in seconds.
    *   Prioritize compound exercises (squats, deadlifts, bench press, overhead press, rows) and supplement with isolation exercises based on the split and available equipment.
    *   Emphasize progressive overload: suggest how the user might progress (e.g., adding weight, reps, sets over time). This can be in the notes.
    *   Include tempo if relevant for hypertrophy (e.g., controlled eccentrics).
    *   Ensure exercise selection matches available equipment. If equipment is very limited (e.g., bodyweight only), adapt accordingly.
    *   Provide brief notes for the overall training plan or specific exercises where helpful.

2.  **Diet Guidance:**
    *   Based on the goalPhase (bulking/cutting/maintenance), height, weight, age, and sex (if provided), estimate daily calorie needs. If insufficient data for precise calculation, provide a reasonable estimate and state assumptions.
        *   For bulking, suggest a moderate surplus (e.g., +250-500 kcal).
        *   For cutting, suggest a moderate deficit (e.g., -250-500 kcal).
        *   For maintenance, calories to maintain current weight.
    *   Calculate macronutrient targets (protein, carbs, fat) in grams.
        *   Protein: Typically 1.6-2.2g per kg of body weight.
        *   Fat: Typically 0.8-1.2g per kg of body weight or 20-30% of total calories.
        *   Carbs: Remainder of calories.
    *   Provide 3-5 example meal ideas or food suggestions that align with the macros and any dietary preferences. If preferences are complex, offer general guidance.
    *   Include general dietary advice (e.g., hydration, importance of whole foods, fiber).

3.  **Overall Summary:**
    *   Write a brief (2-3 sentences) summary of the plan and key recommendations to help the user get started.

**Output Format:**
Ensure your response strictly adheres to the JSON schema defined for PersonalizedPlanOutputSchema.
The training plan should be structured with daily workouts, and each exercise should have name, sets, reps, and optionally rest/tempo/notes.
The diet guidance should clearly list calorie and macro targets.
Be encouraging and scientific in your tone.
Focus on practical, actionable advice.
`,
});

const generatePersonalizedPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedHypertrophyPlanFlow',
    inputSchema: PersonalizedPlanInputSchema,
    outputSchema: PersonalizedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid plan. Please try again.");
    }
    return output;
  }
);

