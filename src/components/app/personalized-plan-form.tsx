
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  // FormDescription, // No longer used here directly for the header
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PersonalizedPlanInput, PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import { generatePersonalizedPlan } from "@/ai/flows/generate-personalized-plan";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Loader2, Wand2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';


const PersonalizedPlanInputSchema = z.object({
  fitnessGoals: z.string().min(10, { message: "Please describe your fitness goals in more detail (min 10 characters)." }),
  currentFitnessLevel: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your fitness level." }),
  availableEquipment: z.string().min(5, { message: "Please list available equipment (min 5 characters, e.g., 'dumbbells, bands' or 'none')." }),
});

export function PersonalizedPlanForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PersonalizedPlanInput>({
    resolver: zodResolver(PersonalizedPlanInputSchema),
    defaultValues: {
      fitnessGoals: "",
      currentFitnessLevel: undefined,
      availableEquipment: "",
    },
  });

  async function onSubmit(values: PersonalizedPlanInput) {
    setIsLoading(true);
    setGeneratedPlan(null);
    setError(null);
    try {
      const result = await generatePersonalizedPlan(values);
      setGeneratedPlan(result);
    } catch (e) {
      console.error(e);
      setError("Failed to generate plan. Please try again.");
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            Create Your AI-Powered Workout Plan
          </CardTitle>
          <CardDescription> {/* Changed from FormDescription to CardDescription */}
            Tell us about your goals, and our AI will craft a personalized workout plan for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fitnessGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are your fitness goals?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Lose 10 pounds, build muscle in arms and chest, run a 5k" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentFitnessLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your current fitness level?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your fitness level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What equipment do you have access to?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dumbbells, resistance bands, full gym, bodyweight only" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate My Plan
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {generatedPlan && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Your Personalized Workout Plan</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {/* Using ReactMarkdown to render the plan which might contain markdown */}
            <ReactMarkdown>{generatedPlan.workoutPlan}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
