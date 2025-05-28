
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

// Input schema - descriptions here guide the AI's understanding of what it's receiving.
// Keeping these in English can be beneficial if the AI model is primarily trained on English for instruction following.
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

// Output schema - descriptions here guide the AI's output format. 
// These should be in Portuguese if the user-facing output is expected in Portuguese.
const ExerciseDetailSchema = z.object({
  name: z.string().describe("Nome do exercício."),
  sets: z.string().describe("Número de séries (ex: '3-4' ou '3')."),
  reps: z.string().describe("Faixa de repetições (ex: '8-12', '5', 'AMRAP')."),
  restSeconds: z.number().optional().describe("Tempo de descanso em segundos entre as séries (ex: 120 para 2 min, 180 para 3 min, até 300 para 5 min)."),
  notes: z.string().optional().describe("Instruções específicas ou notas para o exercício (ex: 'Foco na fase excêntrica controlada', 'Ir até a falha na última série').")
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe("Dia da semana (ex: 'Segunda-feira', 'Dia 1') ou foco do grupo muscular (ex: 'Dia de Peito')."),
  focus: z.string().optional().describe("Principais grupos musculares ou foco do dia (ex: 'Peito, Ombros & Tríceps', 'Corpo Inteiro')."),
  exercises: z.array(ExerciseDetailSchema).describe("Lista de exercícios para o dia.")
});

const TrainingPlanSchema = z.object({
  weeklySplitDescription: z.string().describe("Descrição da divisão de treino utilizada (ex: 'Divisão Superior/Inferior de 4 Dias', 'Divisão de Corpo Inteiro de 3 Dias')."),
  weeklyVolumeSummary: z.string().describe("Breve resumo da média de séries semanais por grupo muscular principal (ex: 'Aprox. 15 séries por grupo muscular principal/semana')."),
  workouts: z.array(DailyWorkoutSchema).describe("Array de treinos diários para a semana."),
  notes: z.string().optional().describe("Notas gerais ou conselhos para o plano de treino (ex: 'Garanta a sobrecarga progressiva aumentando o peso ou as repetições ao longo do tempo', 'Aqueça antes de cada sessão com cardio leve e alongamentos dinâmicos').")
});

const FoodItemWithQuantitySchema = z.object({
  foodName: z.string().describe("Nome do item alimentar (ex: 'Arroz integral cozido', 'Peito de frango grelhado')."),
  quantity: z.string().describe("Quantidade do item alimentar com unidade (ex: '150g', '1 unidade média', '1 xícara').")
});

const MealOptionSchema = z.object({
  optionDescription: z.string().optional().describe("Breve descrição para esta opção de refeição (ex: 'Café da Manhã Rico em Proteínas', 'Almoço Rápido')."),
  items: z.array(FoodItemWithQuantitySchema).describe("Lista de itens alimentares e suas quantidades para esta opção de refeição.")
});

const DailyMealPlanSchema = z.object({
  mealName: z.string().describe("Nome da refeição (ex: 'Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar')."),
  mealOptions: z.array(MealOptionSchema).min(1).describe("Lista de 1 a 3 opções diferentes de refeição para esta refeição. Refeições principais (Café da Manhã, Almoço, Jantar) devem ter como objetivo 3 opções, lanches (Lanche da Manhã, Lanche da Tarde) 1-2 opções.")
});

const DietGuidanceSchema = z.object({
  estimatedDailyCalories: z.number().describe("Estimativa de calorias diárias alvo com base na fase do objetivo."),
  proteinGrams: z.number().describe("Meta diária de proteína em gramas."),
  carbGrams: z.number().describe("Meta diária de carboidratos em gramas."),
  fatGrams: z.number().describe("Meta diária de gordura em gramas."),
  dailyMealPlans: z.array(DailyMealPlanSchema).describe("Array de planos de refeições diárias para tipicamente 5 refeições: Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar. Cada refeição deve ter múltiplas opções com itens alimentares e quantidades específicas."),
  notes: z.string().optional().describe("Conselhos dietéticos gerais, ex: hidratação, qualidade dos alimentos, importância das fibras, flexibilidade no horário das refeições. Lembre ao usuário que são sugestões e que ele pode adaptar com alimentos equivalentes.")
});

const PersonalizedPlanOutputSchema = z.object({
  trainingPlan: TrainingPlanSchema.describe("Um plano de treino de hipertrofia detalhado e baseado em ciência."),
  dietGuidance: DietGuidanceSchema.describe("Orientação dietética personalizada, incluindo metas de macronutrientes e opções detalhadas de refeições com quantidades."),
  overallSummary: z.string().describe("Um breve resumo do plano e das principais recomendações.")
});

export type PersonalizedPlanOutput = z.infer<typeof PersonalizedPlanOutputSchema>;

export async function generatePersonalizedPlan(input: PersonalizedPlanInput): Promise<PersonalizedPlanOutput> {
  return generatePersonalizedPlanFlow(input);
}

// The prompt itself: instructions to the AI model. Best kept in English for optimal model performance unless the model is specifically fine-tuned for Portuguese instructions.
// User-facing examples within the prompt *can* be in Portuguese if it helps the AI generate Portuguese output correctly.
const prompt = ai.definePrompt({
  name: 'generatePersonalizedHypertrophyPlanPrompt',
  input: {schema: PersonalizedPlanInputSchema},
  output: {schema: PersonalizedPlanOutputSchema},
  prompt: `You are an expert kinesiologist and certified nutrition coach specializing in science-based hypertrophy (muscle growth) for natural lifters.
Your task is to generate a structured, personalized training and diet plan in PORTUGUESE (Brazil) based on the user's input. The plan should be actionable, easy to follow, and provide specific quantities for food items.

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

Instructions for Plan Generation (ALL OUTPUT TEXT MUST BE IN PORTUGUESE - BRAZIL):

1.  **Training Plan (Plano de Treino):**
    *   **Split Design:** Based on 'Training Frequency', design an appropriate weekly training split. ALL major muscle groups (Chest, Back, Shoulders, Legs (Quads, Hamstrings, Glutes, Calves), Biceps, Triceps) must be trained throughout the week.
        *   2 days/week: Full Body A / Full Body B. (Ex: Corpo Inteiro A / Corpo Inteiro B)
        *   3 days/week: Full Body A / Full Body B / Full Body C OR Push / Pull / Legs. (Ex: Empurrar / Puxar / Pernas)
        *   4 days/week: Upper / Lower / Rest / Upper / Lower (ensure all major muscles hit 2x). (Ex: Superior / Inferior / Descanso / Superior / Inferior)
        *   5 days/week: Upper / Lower / Push / Pull / Legs (or a similar split ensuring most major muscles are hit 2x, e.g., PPLUL).
        *   6 days/week: Push / Pull / Legs / Push / Pull / Legs.
    *   Clearly state the split used in 'weeklySplitDescription' (in Portuguese).
    *   **Volume:** Distribute total weekly sets per major muscle group according to 'Preferred Weekly Volume'. For example, if 'high' (18-20 sets) and training chest, aim for 18-20 total sets for chest spread across the week's workouts. Summarize this in 'weeklyVolumeSummary' (in Portuguese).
    *   **Daily Workouts:** For each workout day:
        *   List exercises with specific sets and rep ranges (e.g., 6-10 for compounds, 10-15 for isolation). Prioritize compound exercises. Exercise names should be in Portuguese (e.g., "Supino Reto", "Agachamento Livre").
        *   Select exercises matching 'Available Equipment' and 'Training Experience'.
        *   Include recommended rest times in SECONDS (between 120 to 300 seconds, to ensure 2-5 minutes of rest). DO NOT include exercise tempo/cadence.
        *   Provide brief notes for exercises if helpful (e.g., 'Concentre-se na boa forma'). Notes should be in Portuguese.
    *   **General Notes:** Include advice on progressive overload (e.g., "Procure aumentar o peso ou as repetições nos exercícios ao longo do tempo, mantendo a boa forma"). Notes should be in Portuguese.

2.  **Diet Guidance (Diretrizes de Dieta):**
    *   **Macros & Calories:** Based on goalPhase, height, weight, age, and sex (if provided), estimate daily calorie needs.
        *   Bulking: Moderate surplus (e.g., +250-500 kcal).
        *   Cutting: Moderate deficit (e.g., -250-500 kcal).
        *   Maintenance: Calories to maintain current weight.
    *   Calculate macronutrient targets (protein, carbs, fat) in grams. Protein: 1.6-2.2g/kg body weight. Fat: 20-30% of total calories. Carbs: Remainder. These targets should be returned in the respective output fields.
    *   **Daily Meal Plans (Planos de Refeições Diárias):** Structure a typical day with 5 meals: 'Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'.
        *   For 'Café da Manhã', 'Almoço', and 'Jantar', provide 3 distinct meal options.
        *   For 'Lanche da Manhã' and 'Lanche da Tarde', provide 1-2 distinct meal options.
        *   Each meal option must list specific food items and their **quantities in grams (g) or common household units in Portuguese** (e.g., 1 unidade média, 1 xícara, 2 fatias). For example: "Peito de frango grelhado - 150g", "Arroz integral cozido - 100g", "Banana - 1 unidade média".
        *   The sum of calories and macros from all meals in a typical day should align closely with the calculated daily targets.
        *   Prioritize common Brazilian food items. Examples for macronutrient categories:
            *   Proteins: Frango (chicken breast), Ovos (eggs), Peixe (fish like tilapia or salmon), Carne vermelha magra (lean red meat like patinho), Iogurte natural/Queijo cottage, Whey protein.
            *   Carbohydrates: Arroz (rice), Feijão (beans), Batata doce (sweet potato), Mandioca/Aipim (cassava), Aveia (oats), Pão integral (whole wheat bread), Frutas (banana, maçã, mamão, laranja).
            *   Fats: Abacate (avocado), Azeite de oliva extra virgem (olive oil), Castanhas (nuts like Brazil nuts, cashews), Sementes (chia, linhaça), Pasta de amendoim integral (peanut butter).
        *   Consider 'Dietary Preferences/Restrictions' when suggesting foods (e.g., offer plant-based protein options if vegetarian).
    *   **General Notes (Notas da Dieta):** Include advice on hydration, importance of whole foods, fiber. Emphasize that the provided meal options are suggestions and can be adapted by swapping for nutritionally similar foods to maintain adherence and variety. Notes should be in Portuguese.

3.  **Overall Summary (Resumo Geral):**
    *   Write a brief (2-3 sentences) summary of the plan and key recommendations, in Portuguese.

**Output Format:**
Ensure your response strictly adheres to the JSON schema defined for PersonalizedPlanOutputSchema.
Be encouraging and scientific in your tone.
Focus on practical, actionable advice. All text content in the output must be in PORTUGUESE (Brazil).
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
        throw new Error("O modelo de IA não retornou um plano válido. Por favor, tente novamente.");
    }
    return output;
  }
);

