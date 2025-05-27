
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PersonalizedPlanInput, PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import { generatePersonalizedPlan } from "@/ai/flows/generate-personalized-plan";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from "@/components/ui/card";
import { Loader2, Wand2, Dumbbell, Utensils } from "lucide-react"; // Changed Barbell to Dumbbell
import ReactMarkdown from 'react-markdown';

// Re-define schema or import if types are sufficient from flow directly
// For form validation, it's often good to have it client-side.
const ClientPersonalizedPlanInputSchema = z.object({
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Please select your primary goal." }),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your training experience." }),
  trainingFrequency: z.coerce.number({invalid_type_error: "Must be a number"}).min(2, "Minimum 2 days").max(6, "Maximum 6 days").default(3),
  availableEquipment: z.string().min(5, { message: "List equipment (min 5 chars, e.g., 'dumbbells, bands' or 'full gym')." }),
  heightCm: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Height must be positive."}).optional().or(z.literal("")),
  weightKg: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Weight must be positive."}).optional().or(z.literal("")),
  age: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Age must be positive."}).optional().or(z.literal("")),
  sex: z.enum(["male", "female", ""]).optional(),
  dietaryPreferences: z.string().optional(),
});


export function PersonalizedPlanForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ClientPersonalizedPlanInputSchema>>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    defaultValues: {
      goalPhase: undefined,
      trainingExperience: undefined,
      trainingFrequency: 3,
      availableEquipment: "",
      heightCm: "",
      weightKg: "",
      age: "",
      sex: "",
      dietaryPreferences: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ClientPersonalizedPlanInputSchema>) {
    setIsLoading(true);
    setGeneratedPlan(null);
    setError(null);

    // Convert empty strings from optional number fields to undefined
    const apiValues: PersonalizedPlanInput = {
        ...values,
        heightCm: values.heightCm ? Number(values.heightCm) : undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        age: values.age ? Number(values.age) : undefined,
        sex: values.sex === "" ? undefined : values.sex as "male" | "female" | undefined,
    };


    try {
      const result = await generatePersonalizedPlan(apiValues);
      setGeneratedPlan(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate plan. The AI model might be busy or the request too complex. Please try again with simpler inputs or check back later.");
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            AI Hypertrophy Plan Generator
          </CardTitle>
          <ShadCnCardDescription>
            Provide your details, and our AI will craft a science-based hypertrophy training and diet plan for your bulking or cutting phase.
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="goalPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Goal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select goal (Bulking/Cutting)" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bulking">Bulking (Gain Muscle)</SelectItem>
                          <SelectItem value="cutting">Cutting (Lose Fat, Preserve Muscle)</SelectItem>
                          <SelectItem value="maintenance">Maintenance (Maintain Physique)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainingExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Experience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner (&lt;1 year lifting)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (1-3 years lifting)</SelectItem>
                          <SelectItem value="advanced">Advanced (3+ years lifting)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="trainingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Days Per Week</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3 (2-6 days)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Equipment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Full gym access, dumbbells and bench, bodyweight only, resistance bands" {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-sm font-medium text-muted-foreground pt-2">Optional: For more accurate diet plan</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 180" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 75" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 25" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                           <SelectItem value="">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="dietaryPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Preferences/Restrictions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Vegetarian, vegan, no dairy, gluten allergy" {...field} rows={2} />
                    </FormControl>
                    <FormDescription>List any specific food preferences or allergies.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Your Hypertrophy Plan...
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
            <CardTitle className="text-destructive">Error Generating Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {generatedPlan && (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">
                        <Dumbbell className="inline-block mr-2 h-5 w-5" /> Your Hypertrophy Training Plan {/* Changed Barbell to Dumbbell */}
                    </CardTitle>
                    <ShadCnCardDescription>{generatedPlan.trainingPlan.weeklySplitDescription}</ShadCnCardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {generatedPlan.trainingPlan.workouts.map((workoutDay, dayIndex) => (
                        <div key={dayIndex} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-semibold mb-2">{workoutDay.day} {workoutDay.focus ? `(${workoutDay.focus})` : ''}</h3>
                            <ul className="space-y-1 list-disc list-inside pl-2 text-sm">
                                {workoutDay.exercises.map((ex, exIndex) => (
                                    <li key={exIndex}>
                                        <strong>{ex.name}:</strong> {ex.sets} sets of {ex.reps} reps.
                                        {ex.restSeconds && ` Rest: ${ex.restSeconds}s.`}
                                        {ex.tempo && ` Tempo: ${ex.tempo}.`}
                                        {ex.notes && <span className="block text-xs text-muted-foreground italic pl-4">- {ex.notes}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {generatedPlan.trainingPlan.notes && <p className="mt-4 text-sm text-muted-foreground italic"><strong>Training Notes:</strong> {generatedPlan.trainingPlan.notes}</p>}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">
                        <Utensils className="inline-block mr-2 h-5 w-5" /> Your Diet Guidance ({form.getValues('goalPhase')})
                    </CardTitle>
                     <ShadCnCardDescription>Daily Targets: ~{generatedPlan.dietGuidance.estimatedDailyCalories} kcal | P: {generatedPlan.dietGuidance.proteinGrams}g | C: {generatedPlan.dietGuidance.carbGrams}g | F: {generatedPlan.dietGuidance.fatGrams}g</ShadCnCardDescription>
                </CardHeader>
                <CardContent>
                    {generatedPlan.dietGuidance.mealExamples && generatedPlan.dietGuidance.mealExamples.length > 0 && (
                        <>
                            <h4 className="font-semibold mb-2">Example Meal Ideas:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {generatedPlan.dietGuidance.mealExamples.map((meal, mealIndex) => (
                                    <li key={mealIndex}>{meal}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    {generatedPlan.dietGuidance.notes && <p className="mt-4 text-sm text-muted-foreground italic"><strong>Diet Notes:</strong> {generatedPlan.dietGuidance.notes}</p>}
                </CardContent>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">Plan Summary</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{generatedPlan.overallSummary}</ReactMarkdown>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
