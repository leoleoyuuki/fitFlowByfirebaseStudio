
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, Dumbbell, Utensils, Save } from "lucide-react"; 
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

const ClientPersonalizedPlanInputSchema = z.object({
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Please select your primary goal." }),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your training experience." }),
  trainingFrequency: z.coerce.number({invalid_type_error: "Must be a number"}).min(2, "Minimum 2 days").max(6, "Maximum 6 days").default(3),
  trainingVolumePreference: z.enum(["low", "medium", "high"], { required_error: "Please select your preferred training volume."}),
  availableEquipment: z.string().min(5, { message: "List equipment (min 5 chars, e.g., 'dumbbells, bands' or 'full gym')." }),
  heightCm: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Height must be positive."}).optional().or(z.literal("")),
  weightKg: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Weight must be positive."}).optional().or(z.literal("")),
  age: z.coerce.number({invalid_type_error: "Must be a number"}).positive({message: "Age must be positive."}).optional().or(z.literal("")),
  sex: z.enum(["male", "female", "prefer_not_to_say", ""], { required_error: "Please select an option." }).optional(),
  dietaryPreferences: z.string().optional(),
});


export function PersonalizedPlanForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ClientPersonalizedPlanInputSchema>>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    defaultValues: {
      goalPhase: undefined,
      trainingExperience: undefined,
      trainingFrequency: 3,
      trainingVolumePreference: "medium",
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

    const apiValues: PersonalizedPlanInput = {
        ...values,
        heightCm: values.heightCm ? Number(values.heightCm) : undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        age: values.age ? Number(values.age) : undefined,
        sex: (values.sex === "" || values.sex === "prefer_not_to_say") 
             ? undefined 
             : values.sex as "male" | "female" | undefined,
        // trainingVolumePreference is already in the correct enum type
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

  const handleSavePlan = () => {
    // Placeholder for actual save functionality
    toast({
        title: "Save Plan",
        description: "Funcionalidade de salvar o plano no seu perfil será implementada em breve!",
    });
    // In a real app, you would send `generatedPlan` to your backend here.
    // e.g., await savePlanToDatabase(generatedPlan, userId);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            Gerador de Plano de Hipertrofia
          </CardTitle>
          <ShadCnCardDescription>
            Forneça seus detalhes, e nosso sistema criará um plano de treino e dieta focado em hipertrofia, baseado em ciência, para suas fases de bulking ou cutting.
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
                      <FormLabel>Objetivo Principal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bulking">Bulking (Ganhar Músculo)</SelectItem>
                          <SelectItem value="cutting">Cutting (Perder Gordura, Preservar Músculo)</SelectItem>
                          <SelectItem value="maintenance">Manutenção (Manter Físico)</SelectItem>
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
                      <FormLabel>Experiência de Treino</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione seu nível" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Iniciante (&lt;1 ano treinando)</SelectItem>
                          <SelectItem value="intermediate">Intermediário (1-3 anos treinando)</SelectItem>
                          <SelectItem value="advanced">Avançado (3+ anos treinando)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="trainingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias de Treino por Semana</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 3 (2-6 dias)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="trainingVolumePreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferência de Volume Semanal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o volume" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixo (10-13 séries/músculo)</SelectItem>
                          <SelectItem value="medium">Médio (14-17 séries/músculo)</SelectItem>
                          <SelectItem value="high">Alto (18-20 séries/músculo)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Séries por grupo muscular principal por semana.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="availableEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipamentos Disponíveis</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Academia completa, halteres e banco, peso corporal, elásticos" {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-sm font-medium text-muted-foreground pt-2">Opcional: Para plano de dieta mais preciso</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 180" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 75" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 25" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo Biológico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o sexo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
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
                    <FormLabel>Preferências/Restrições Alimentares (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Vegetariano, vegano, sem lactose, alergia a glúten" {...field} rows={2} />
                    </FormControl>
                    <FormDescription>Liste quaisquer preferências ou alergias específicas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando seu Plano de Hipertrofia...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Meu Plano
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
            <CardTitle className="text-destructive">Erro ao Gerar Plano</CardTitle>
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
                        <Dumbbell className="inline-block mr-2 h-5 w-5" /> Seu Plano de Treino para Hipertrofia
                    </CardTitle>
                    <ShadCnCardDescription>
                        {generatedPlan.trainingPlan.weeklySplitDescription}
                        <br />
                        {generatedPlan.trainingPlan.weeklyVolumeSummary}
                    </ShadCnCardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {generatedPlan.trainingPlan.workouts.map((workoutDay, dayIndex) => (
                        <div key={dayIndex} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-semibold mb-2">{workoutDay.day} {workoutDay.focus ? `(${workoutDay.focus})` : ''}</h3>
                            <ul className="space-y-1 list-disc list-inside pl-2 text-sm">
                                {workoutDay.exercises.map((ex, exIndex) => (
                                    <li key={exIndex}>
                                        <strong>{ex.name}:</strong> {ex.sets} séries de {ex.reps} reps.
                                        {ex.restSeconds && ` Descanso: ${ex.restSeconds}s.`}
                                        {ex.tempo && ` Cadência: ${ex.tempo}.`}
                                        {ex.notes && <span className="block text-xs text-muted-foreground italic pl-4">- {ex.notes}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {generatedPlan.trainingPlan.notes && <p className="mt-4 text-sm text-muted-foreground italic"><strong>Notas do Treino:</strong> {generatedPlan.trainingPlan.notes}</p>}
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSavePlan} variant="outline">
                        <Save className="mr-2 h-4 w-4" /> Salvar Plano (Em Breve)
                    </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">
                        <Utensils className="inline-block mr-2 h-5 w-5" /> Suas Diretrizes de Dieta ({form.getValues('goalPhase')})
                    </CardTitle>
                     <ShadCnCardDescription>Metas Diárias: ~{generatedPlan.dietGuidance.estimatedDailyCalories} kcal | P: {generatedPlan.dietGuidance.proteinGrams}g | C: {generatedPlan.dietGuidance.carbGrams}g | F: {generatedPlan.dietGuidance.fatGrams}g</ShadCnCardDescription>
                </CardHeader>
                <CardContent>
                    {generatedPlan.dietGuidance.mealStructureExamples && generatedPlan.dietGuidance.mealStructureExamples.length > 0 && (
                        <>
                            <h4 className="font-semibold mb-2">Exemplos de Estrutura de Refeições:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {generatedPlan.dietGuidance.mealStructureExamples.map((meal, mealIndex) => (
                                    <li key={mealIndex}>{meal}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    {generatedPlan.dietGuidance.brazilianFoodSuggestions && generatedPlan.dietGuidance.brazilianFoodSuggestions.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Sugestões de Alimentos Brasileiros Comuns:</h4>
                            {generatedPlan.dietGuidance.brazilianFoodSuggestions.map((categoryItem, catIndex) =>(
                                <div key={catIndex} className="mb-2">
                                    <p className="text-sm font-medium">{categoryItem.category}:</p>
                                    <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                                        {categoryItem.suggestions.map((food, foodIndex) => (
                                            <li key={foodIndex}>{food}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                    {generatedPlan.dietGuidance.notes && <p className="mt-4 text-sm text-muted-foreground italic"><strong>Notas da Dieta:</strong> {generatedPlan.dietGuidance.notes}</p>}
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSavePlan} variant="outline">
                        <Save className="mr-2 h-4 w-4" /> Salvar Plano (Em Breve)
                    </Button>
                </CardFooter>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">Resumo do Plano</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{generatedPlan.overallSummary}</ReactMarkdown>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSavePlan} variant="default">
                        <Save className="mr-2 h-4 w-4" /> Salvar Plano em Meu Perfil (Em Breve)
                    </Button>
                </CardFooter>
            </Card>
        </div>
      )}
    </div>
  );
}

