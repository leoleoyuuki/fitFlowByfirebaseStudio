
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
    .describe('The user’s training experience (beginner: <1 year consistent lifting, intermediate: 1-3 years, advanced: 3+ years). Affects exercise selection and complexity.'),
  trainingFrequency: z.coerce.number().min(2).max(6)
    .describe('How many days per week the user can train (2-6 days). This heavily influences the training split.'),
  trainingVolumePreference: z.enum(["low", "medium", "high"], { required_error: "Please select your preferred training volume."})
    .describe('User preference for weekly training volume per major muscle group. Low: ~10-13 sets, Medium: ~14-17 sets, High: ~18-20 sets.'),
  availableEquipment: z
    .string()
    .min(5, { message: "Please list available equipment (min 5 characters, e.g., 'dumbbells, bands', 'full gym', 'bodyweight only')."})
    .describe('The equipment available to the user (e.g., dumbbells, barbells, machines, bodyweight only). This influences exercise selection.'),
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
  focus: z.string().optional().describe("Primary muscle groups or focus for the day (e.g., 'Chest, Shoulders & Triceps', 'Full Body')."),
  exercises: z.array(ExerciseDetailSchema).describe("List of exercises for the day.")
});

const TrainingPlanSchema = z.object({
  weeklySplitDescription: z.string().describe("Description of the training split used (e.g., '4-Day Upper/Lower Split', '3-Day Full Body Split')."),
  weeklyVolumeSummary: z.string().describe("Brief summary of the average weekly sets per major muscle group (e.g., 'Approx. 15 sets per major muscle group/week')."),
  workouts: z.array(DailyWorkoutSchema).describe("Array of daily workouts for the week."),
  notes: z.string().optional().describe("General notes or advice for the training plan (e.g., 'Ensure progressive overload by increasing weight or reps over time', 'Warm-up before each session with light cardio and dynamic stretches').")
});

const FoodSuggestionCategorySchema = z.object({
    category: z.string().describe("Macronutrient category, e.g., 'Proteins', 'Carbohydrates', 'Fats'."),
    suggestions: z.array(z.string()).describe("List of 3-5 common Brazilian food options for this category.")
});

const DietGuidanceSchema = z.object({
  estimatedDailyCalories: z.number().describe("Estimated daily calorie target based on goal phase."),
  proteinGrams: z.number().describe("Daily protein target in grams."),
  carbGrams: z.number().describe("Daily carbohydrate target in grams."),
  fatGrams: z.number().describe("Daily fat target in grams."),
  mealStructureExamples: z.array(z.string()).optional().describe("Example meal structures for the day (e.g., 'Breakfast: Protein + Carb', 'Lunch: Protein + Carb + Fat + Veggies')."),
  brazilianFoodSuggestions: z.array(FoodSuggestionCategorySchema).optional().describe("Suggestions of common Brazilian food items categorized by macronutrient, to help with meal planning."),
  notes: z.string().optional().describe("General dietary advice, e.g., hydration, food quality, importance of fiber, meal timing flexibility.")
});

const PersonalizedPlanOutputSchema = z.object({
  trainingPlan: TrainingPlanSchema.describe("A detailed, science-based hypertrophy training plan."),
  dietGuidance: DietGuidanceSchema.describe("Personalized dietary guidance including macro targets and meal/food suggestions."),
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
Your task is to generate a structured, personalized training and diet plan based on the user's input. The plan should be actionable and easy to follow.

User Details:
- Goal Phase: {{{goalPhase}}} (bulking = calorie surplus for muscle gain; cutting = calorie deficit for fat loss while preserving muscle; maintenance = maintain current physique)
- Training Experience: {{{trainingExperience}}}
- Training Frequency: {{{trainingFrequency}}} days per week
- Preferred Weekly Volume: {{{trainingVolumePreference}}} (low: 10-13 sets/muscle/week; medium: 14-17 sets/muscle/week; high: 18-20 sets/muscle/week)
- Available Equipment: {{{availableEquipment}}}
- Height (cm): {{#if heightCm}}{{{heightCm}}}{{else}}Not Provided{{/if}}
- Weight (kg): {{#if weightKg}}{{{weightKg}}}{{else}}Not Provided{{/if}}
- Age: {{#if age}}{{{age}}}{{else}}Not Provided{{/if}}
- Sex: {{#if sex}}{{{sex}}}{{else}}Not Provided{{/if}}
- Dietary Preferences/Restrictions: {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}None{{/if}}

Instructions for Plan Generation:

1.  **Training Plan:**
    *   **Split Design:** Based on 'Training Frequency', design an appropriate weekly training split. ALL major muscle groups (Chest, Back, Shoulders, Legs (Quads, Hamstrings, Glutes, Calves), Biceps, Triceps) must be trained throughout the week.
        *   2 days/week: Full Body / Full Body.
        *   3 days/week: Full Body / Full Body / Full Body (consider variations) OR Push / Pull / Legs.
        *   4 days/week: Upper / Lower / Rest / Upper / Lower (ensure all major muscles hit 2x).
        *   5 days/week: Upper / Lower / Push / Pull / Legs (or a similar split ensuring most major muscles are hit 2x, e.g., PPLUL).
        *   6 days/week: Push / Pull / Legs / Push / Pull / Legs.
    *   Clearly state the split used in 'weeklySplitDescription'.
    *   **Volume:** Distribute total weekly sets per major muscle group according to 'Preferred Weekly Volume'. For example, if 'high' (18-20 sets) and training chest, aim for 18-20 total sets for chest spread across the week's workouts. Summarize this in 'weeklyVolumeSummary'.
    *   **Daily Workouts:** For each workout day:
        *   List exercises with specific sets and rep ranges (e.g., 6-10 for compounds, 10-15 for isolation). Prioritize compound exercises.
        *   Select exercises matching 'Available Equipment' and 'Training Experience'.
        *   Include recommended rest times in seconds (e.g., 60-90s for isolation, 90-180s for compounds).
        *   Optionally include tempo (e.g., '2-0-1-0').
        *   Provide brief notes for exercises if helpful.
    *   **General Notes:** Include advice on progressive overload (e.g., "Aim to increase weight or reps on exercises over time while maintaining good form").

2.  **Diet Guidance:**
    *   **Macros & Calories:** Based on goalPhase, height, weight, age, and sex (if provided), estimate daily calorie needs.
        *   Bulking: Moderate surplus (e.g., +250-500 kcal).
        *   Cutting: Moderate deficit (e.g., -250-500 kcal).
        *   Maintenance: Calories to maintain current weight.
    *   Calculate macronutrient targets (protein, carbs, fat) in grams. Protein: 1.6-2.2g/kg. Fat: 20-30% of calories. Carbs: Remainder.
    *   **Meal Structure Examples:** Provide a few examples of how meals could be structured through the day (e.g., "Breakfast: Protein source + Carbohydrate source", "Lunch: Protein source + Carbohydrate source + Fat source + Vegetables").
    *   **Brazilian Food Suggestions:** For each macronutrient category (Proteins, Carbohydrates, Fats), list 3-5 common Brazilian food options that are good sources. For example:
        *   Proteins: Frango (chicken breast), Ovos (eggs), Peixe (fish like tilapia or salmon), Carne vermelha magra (lean red meat like patinho), Iogurte natural/Queijo cottage.
        *   Carbohydrates: Arroz (rice), Feijão (beans), Batata doce (sweet potato), Mandioca/Aipim (cassava), Aveia (oats), Pão integral (whole wheat bread), Frutas (banana, maçã, mamão).
        *   Fats: Abacate (avocado), Azeite de oliva extra virgem (olive oil), Castanhas (nuts like Brazil nuts, cashews), Sementes (chia, linhaça), Pasta de amendoim integral (peanut butter).
        *   Structure this in 'brazilianFoodSuggestions' with categories.
    *   This is to provide the user with ideas; they will make their own food choices. Do not ask for their food preferences as input for this list.
    *   **General Notes:** Include advice on hydration, importance of whole foods, fiber. Consider 'Dietary Preferences/Restrictions' for overall advice.

3.  **Overall Summary:**
    *   Write a brief (2-3 sentences) summary of the plan and key recommendations.

**Output Format:**
Ensure your response strictly adheres to the JSON schema defined for PersonalizedPlanOutputSchema.
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

