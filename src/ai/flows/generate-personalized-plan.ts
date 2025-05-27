'use server';
/**
 * @fileOverview AI-powered personalized workout plan generator.
 *
 * - generatePersonalizedPlan - A function that generates a personalized workout plan based on user input.
 * - PersonalizedPlanInput - The input type for the generatePersonalizedPlan function.
 * - PersonalizedPlanOutput - The return type for the generatePersonalizedPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedPlanInputSchema = z.object({
  fitnessGoals: z
    .string()
    .describe('The user\u2019s fitness goals (e.g., weight loss, muscle gain).'),
  currentFitnessLevel: z
    .string()
    .describe('The user\u2019s current fitness level (e.g., beginner, intermediate, advanced).'),
  availableEquipment: z
    .string()
    .describe('The equipment available to the user (e.g., dumbbells, resistance bands, gym access).'),
});

export type PersonalizedPlanInput = z.infer<typeof PersonalizedPlanInputSchema>;

const PersonalizedPlanOutputSchema = z.object({
  workoutPlan: z.string().describe('A personalized workout plan tailored to the user\u2019s needs.'),
});

export type PersonalizedPlanOutput = z.infer<typeof PersonalizedPlanOutputSchema>;

export async function generatePersonalizedPlan(input: PersonalizedPlanInput): Promise<PersonalizedPlanOutput> {
  return generatePersonalizedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedPlanPrompt',
  input: {schema: PersonalizedPlanInputSchema},
  output: {schema: PersonalizedPlanOutputSchema},
  prompt: `You are an expert personal trainer. Based on the user's input, generate a workout plan tailored to their needs.

Fitness Goals: {{{fitnessGoals}}}
Current Fitness Level: {{{currentFitnessLevel}}}
Available Equipment: {{{availableEquipment}}}

Workout Plan:`,
});

const generatePersonalizedPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedPlanFlow',
    inputSchema: PersonalizedPlanInputSchema,
    outputSchema: PersonalizedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
