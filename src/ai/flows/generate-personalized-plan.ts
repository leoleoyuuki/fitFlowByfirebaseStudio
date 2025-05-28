
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
  restSeconds: z.number().optional().describe("Rest time in seconds between sets (e.g., 120, 180, 300). Aim for 2-5 minutes."),
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

const FoodItemWithQuantitySchema = z.object({
  foodName: z.string().describe("Name of the food item (e.g., 'Arroz integral cozido', 'Peito de frango grelhado')."),
  quantity: z.string().describe("Quantity of the food item with unit (e.g., '150g', '1 unidade média', '1 xícara').")
});

const MealOptionSchema = z.object({
  optionDescription: z.string().optional().describe("Brief description for this meal option (e.g., 'High Protein Breakfast', 'Quick Lunch')."),
  items: z.array(FoodItemWithQuantitySchema).describe("List of food items and their quantities for this meal option.")
});

const DailyMealPlanSchema = z.object({
  mealName: z.string().describe("Name of the meal (e.g., Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar)."),
  mealOptions: z.array(MealOptionSchema).min(1).describe("List of 1 to 3 different meal options for this meal. Main meals (Breakfast, Lunch, Dinner) should aim for 3 options, snacks (Morning Snack, Afternoon Snack) 1-2 options.")
});

const DietGuidanceSchema = z.object({
  estimatedDailyCalories: z.number().describe("Estimated daily calorie target based on goal phase."),
  proteinGrams: z.number().describe("Daily protein target in grams."),
  carbGrams: z.number().describe("Daily carbohydrate target in grams."),
  fatGrams: z.number().describe("Daily fat target in grams."),
  dailyMealPlans: z.array(DailyMealPlanSchema).describe("Array of daily meal plans for typically 5 meals: Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar. Each meal should have multiple options with specific food items and quantities."),
  notes: z.string().optional().describe("General dietary advice, e.g., hydration, food quality, importance of fiber, meal timing flexibility. Remind user these are suggestions and they can adapt with equivalent foods.")
});

const PersonalizedPlanOutputSchema = z.object({
  trainingPlan: TrainingPlanSchema.describe("A detailed, science-based hypertrophy training plan."),
  dietGuidance: DietGuidanceSchema.describe("Personalized dietary guidance including macro targets and detailed meal options with quantities."),
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
Your task is to generate a structured, personalized training and diet plan based on the user's input. The plan should be actionable, easy to follow, and provide specific quantities for food items.

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
        *   Include recommended rest times in seconds (between 120 to 300 seconds, to ensure 2-5 minutes of rest). This is crucial for recovery between heavy sets aimed at hypertrophy. DO NOT include exercise tempo/cadence.
        *   Provide brief notes for exercises if helpful (e.g., 'Focus on good form').
    *   **General Notes:** Include advice on progressive overload (e.g., "Aim to increase weight or reps on exercises over time while maintaining good form").

2.  **Diet Guidance:**
    *   **Macros & Calories:** Based on goalPhase, height, weight, age, and sex (if provided), estimate daily calorie needs.
        *   Bulking: Moderate surplus (e.g., +250-500 kcal).
        *   Cutting: Moderate deficit (e.g., -250-500 kcal).
        *   Maintenance: Calories to maintain current weight.
    *   Calculate macronutrient targets (protein, carbs, fat) in grams. Protein: 1.6-2.2g/kg body weight. Fat: 20-30% of total calories. Carbs: Remainder.
    *   **Daily Meal Plans:** Structure a typical day with 5 meals: 'Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'.
        *   For 'Café da Manhã', 'Almoço', and 'Jantar', provide 3 distinct meal options.
        *   For 'Lanche da Manhã' and 'Lanche da Tarde', provide 1-2 distinct meal options.
        *   Each meal option must list specific food items and their **quantities in grams (g) or common household units** (e.g., 1 unidade média, 1 xícara, 2 fatias). For example: "Peito de frango grelhado - 150g", "Arroz integral cozido - 100g", "Banana - 1 unidade média".
        *   The sum of calories and macros from all meals in a typical day should align closely with the calculated daily targets.
        *   Prioritize common Brazilian food items. Examples for macronutrient categories:
            *   Proteins: Frango (chicken breast), Ovos (eggs), Peixe (fish like tilapia or salmon), Carne vermelha magra (lean red meat like patinho), Iogurte natural/Queijo cottage, Whey protein.
            *   Carbohydrates: Arroz (rice), Feijão (beans), Batata doce (sweet potato), Mandioca/Aipim (cassava), Aveia (oats), Pão integral (whole wheat bread), Frutas (banana, maçã, mamão, laranja).
            *   Fats: Abacate (avocado), Azeite de oliva extra virgem (olive oil), Castanhas (nuts like Brazil nuts, cashews), Sementes (chia, linhaça), Pasta de amendoim integral (peanut butter).
        *   Consider 'Dietary Preferences/Restrictions' when suggesting foods (e.g., offer plant-based protein options if vegetarian).
    *   **General Notes:** Include advice on hydration, importance of whole foods, fiber. Emphasize that the provided meal options are suggestions and can be adapted by swapping for nutritionally similar foods to maintain adherence and variety.

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
