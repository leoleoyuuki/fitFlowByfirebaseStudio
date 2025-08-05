
'use server';
/**
 * @fileOverview AI-powered base plan generator for fitness and nutrition professionals.
 *
 * - generatePersonalizedPlan - Generates a science-based hypertrophy plan draft.
 * - PersonalizedPlanInput - Input for generating the plan draft.
 * - PersonalizedPlanOutput - Output containing training and diet guidance for professional review.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedPlanInputSchema = z.object({
  professionalRole: z.enum(["physical_educator", "nutritionist", "both"], { required_error: "Selecione sua principal área de atuação." })
    .describe('The professional\'s primary role: physical educator (focus on training), nutritionist (focus on diet), or both. This will determine the focus and any necessary disclaimers.'),
  professionalRegistration: z.string().optional().describe('The professional\'s registration number (CREF or CFN). Example: "012345-G/SP" or "CFN-9 12345". This will be displayed on the plan but not used by the AI for generation.'),
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Please select your client's primary goal (bulking, cutting, or maintenance)." })
    .describe('The client’s primary goal: bulking (muscle gain with calorie surplus), cutting (fat loss with calorie deficit while preserving muscle), or maintenance.'),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your client's training experience level." })
    .describe('The client’s training experience (beginner: <1 year consistent lifting, intermediate: 1-3 years, advanced: 3+ years). Affects exercise selection and complexity.'),
  trainingFrequency: z.coerce.number().min(2).max(6)
    .describe('How many days per week the client can train (2-6 days). This heavily influences the training split.'),
  trainingVolumePreference: z.enum(["low", "medium", "high"], { required_error: "Please select your client's preferred training volume."})
    .describe('Client preference for weekly training volume per major muscle group. Low: ~10-13 sets, Medium: ~14-17 sets, High: ~18-20 sets.'),
  availableEquipment: z
    .string()
    .min(5, { message: "Please list available equipment (min 5 characters, e.g., 'dumbbells, bands', 'full gym', 'bodyweight only')."})
    .describe('The equipment available to the client (e.g., dumbbells, barbells, machines, bodyweight only). This influences exercise selection.'),
  heightCm: z.coerce.number().positive().optional()
    .describe('Client height in centimeters (optional, for more accurate diet plan).'),
  weightKg: z.coerce.number().positive().optional()
    .describe('Client weight in kilograms (optional, for more accurate diet plan).'),
  age: z.coerce.number().positive().optional()
    .describe('Client age in years (optional, for more accurate diet plan).'),
  sex: z.enum(["male", "female"]).optional()
    .describe('Client biological sex (optional, for more accurate diet plan).'),
  dietaryPreferences: z.string().optional()
    .describe('Any dietary preferences or restrictions for the client (e.g., vegetarian, vegan, allergies like gluten-free, lactose intolerant). Default is no restrictions.'),
});

export type PersonalizedPlanInput = z.infer<typeof PersonalizedPlanInputSchema>;

const ExerciseDetailSchema = z.object({
  name: z.string().describe("Nome do exercício."),
  sets: z.string().describe("Número de séries (ex: '3-4' ou '3')."),
  reps: z.string().describe("Faixa de repetições (ex: '8-12', '5', 'AMRAP')."),
  restSeconds: z.number().optional().describe("Tempo de descanso em segundos entre as séries (ex: 120 para 2 min, 180 para 3 min, até 300 para 5 min)."),
  notes: z.string().optional().describe("Instruções específicas ou notas para o exercício (ex: 'Foco na fase excêntrica controlada', 'Ir até a falha na última série').")
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe("Dia da semana ou do treino (ex: 'Segunda-feira', 'Treino A', 'Dia de Peito')."),
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
  trainingPlan: TrainingPlanSchema.describe("Um plano de treino de hipertrofia detalhado e baseado em ciência, para ser revisado e ajustado pelo profissional."),
  dietGuidance: DietGuidanceSchema.describe("Orientação dietética personalizada, incluindo metas de macronutrientes e opções detalhadas de refeições com quantidades, para ser revisada e ajustada pelo profissional."),
  overallSummary: z.string().describe("Um breve resumo do plano e das principais recomendações, servindo como ponto de partida para o profissional.")
});

export type PersonalizedPlanOutput = z.infer<typeof PersonalizedPlanOutputSchema>;

export async function generatePersonalizedPlan(input: PersonalizedPlanInput): Promise<PersonalizedPlanOutput> {
  return generatePersonalizedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProfessionalPlanDraftPrompt',
  input: {schema: PersonalizedPlanInputSchema},
  output: {schema: PersonalizedPlanOutputSchema},
  prompt: `Você é um assistente especialista em cinesiologia e nutrição, auxiliando um PROFISSIONAL (Educador Físico e/ou Nutricionista) a criar um rascunho inicial de um plano de treino e dieta focado em hipertrofia para o cliente dele.
Sua tarefa é gerar um plano ESTRUTURADO E DETALHADO em PORTUGUÊS (Brasil), baseado nos dados do cliente fornecidos pelo profissional. Este plano servirá como uma BASE SÓLIDA que o profissional irá REVISAR, AJUSTAR e VALIDAR.

**VERIFIQUE O PAPEL DO PROFISSIONAL ANTES DE TUDO.**
- Área de Atuação do Profissional: {{{professionalRole}}}
  - Se 'physical_educator', a seção de dieta DEVE conter um aviso legal.
  - Se 'nutritionist', a seção de treino é uma sugestão.
  - Se 'both', ambas as seções são para revisão profissional.

Dados do Cliente (fornecidos pelo profissional):
- Objetivo Principal do Cliente: {{{goalPhase}}}
- Experiência de Treino do Cliente: {{{trainingExperience}}}
- Frequência de Treino Semanal do Cliente: {{{trainingFrequency}}} dias
- Preferência de Volume Semanal do Cliente: {{{trainingVolumePreference}}}
- Equipamentos Disponíveis para o Cliente: {{{availableEquipment}}}
- Altura (cm): {{#if heightCm}}{{{heightCm}}}{{else}}Não Fornecido{{/if}}
- Peso (kg): {{#if weightKg}}{{{weightKg}}}{{else}}Não Fornecido{{/if}}
- Idade: {{#if age}}{{{age}}}{{else}}Não Fornecido{{/if}}
- Sexo Biológico: {{#if sex}}{{{sex}}}{{else}}Não Fornecido{{/if}}
- Preferências/Restrições Alimentares do Cliente: {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}Nenhuma{{/if}}

Instruções para Geração do Rascunho do Plano (TODO O TEXTO DE SAÍDA DEVE ESTAR EM PORTUGUÊS - BRASIL):

1.  **Rascunho do Plano de Treino:**
    *   Baseie-se em todos os dados do cliente para criar um plano de treino detalhado e científico. Se a função do profissional for 'nutritionist', o plano de treino ainda deve ser completo, mas é entendido como uma sugestão para o cliente ou para colaboração com um educador físico.
    *   **ATENÇÃO ÀS PREFERÊNCIAS:** Analise o campo 'availableEquipment' cuidadosamente para identificar quaisquer preferências ou aversões a exercícios ou grupos musculares (ex: 'não gosta de agachamento', 'focar em glúteos'). Adapte o plano para respeitar isso.
    *   **NOMEAÇÃO DA DIVISÃO DE TREINO:** Se a divisão de treino resultante das preferências do cliente não for um padrão conhecido (ex: ABC, Upper/Lower), nomeie os dias de forma genérica, como "Treino A", "Treino B", "Treino C", etc., e use o campo 'focus' para descrever os músculos trabalhados (ex: day: "Treino A", focus: "Peito, Ombros e Tríceps").

2.  **Rascunho das Diretrizes de Dieta:**
    *   **MUITO IMPORTANTE:** Se o papel do profissional ('professionalRole') for 'physical_educator', a orientação dietética é estritamente SUGESTIVA e EDUCACIONAL. Neste caso, você DEVE obrigatoriamente adicionar o seguinte texto no início do campo 'notes' de 'dietGuidance': "AVISO IMPORTANTE: Estas são sugestões alimentares com fins educacionais, baseadas em diretrizes gerais. Um plano alimentar individualizado e com caráter de prescrição dietética deve ser elaborado por um Nutricionista licenciado. Este material não substitui a consulta com um Nutricionista."
    *   Se o papel for 'nutritionist' ou 'both', gere as diretrizes de dieta normalmente para revisão profissional.
    *   **Macros & Calorias:** Baseado em goalPhase e dados do cliente, estime necessidades calóricas e metas de macronutrientes.
    *   **Planos de Refeições Diárias:** Estruture 5 refeições (Café da Manhã, Lanche, Almoço, Lanche, Jantar) com múltiplas opções, detalhando alimentos e quantidades em gramas ou medidas caseiras. Priorize alimentos comuns no Brasil.
    *   **Notas Gerais da Dieta:** Adicione dicas sobre hidratação e qualidade dos alimentos. Para 'nutritionist' e 'both', enfatize que são sugestões para o profissional adaptar.

3.  **Resumo Geral:**
    *   Escreva um breve resumo (2-3 frases) do plano e recomendações chave, em Português, para o profissional.

Formato de Saída:
Sua resposta DEVE seguir estritamente o schema JSON definido para PersonalizedPlanOutputSchema. Todo o texto de saída deve estar em PORTUGUÊS (Brasil).
`,
});

const generatePersonalizedPlanFlow = ai.defineFlow(
  {
    name: 'generateProfessionalPlanDraftFlow', // Nome do flow atualizado
    inputSchema: PersonalizedPlanInputSchema,
    outputSchema: PersonalizedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("O modelo de IA não retornou um rascunho de plano válido. Por favor, tente novamente.");
    }
    return output;
  }
);

    