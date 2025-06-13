
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
import { Loader2, Wand2, Dumbbell, Utensils, Save, Edit, FileText } from "lucide-react"; 
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore"; // addDoc e collection para múltiplos planos
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

const ClientPersonalizedPlanInputSchema = z.object({
  professionalRole: z.enum(["physical_educator", "nutritionist", "both"], { required_error: "Selecione sua principal área de atuação." }),
  professionalRegistration: z.string().min(3, {message: "Insira um registro profissional válido (mín. 3 caracteres)."}).optional().or(z.literal("")), // Opcional, mas com validação se preenchido
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Selecione o objetivo principal do cliente." }),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Selecione a experiência de treino do cliente." }),
  trainingFrequency: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(2, "Mínimo de 2 dias").max(6, "Máximo de 6 dias").default(3),
  trainingVolumePreference: z.enum(["low", "medium", "high"], { required_error: "Selecione a preferência de volume de treino do cliente."}),
  availableEquipment: z.string().min(5, { message: "Liste os equipamentos do cliente (mín. 5 caracteres)." }),
  heightCm: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive({message: "Altura deve ser positiva."}).optional().or(z.literal("")),
  weightKg: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive({message: "Peso deve ser positivo."}).optional().or(z.literal("")),
  age: z.coerce.number({invalid_type_error: "Deve ser um número"}).positive({message: "Idade deve ser positiva."}).optional().or(z.literal("")),
  sex: z.enum(["male", "female", "prefer_not_to_say", ""], { required_error: "Selecione uma opção." }).optional(),
  dietaryPreferences: z.string().optional(),
  clientName: z.string().min(2, {message: "Nome do cliente é obrigatório (mín. 2 caracteres)"}).optional().or(z.literal("")), // Adicionado nome do cliente
});


export function PersonalizedPlanForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PersonalizedPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof ClientPersonalizedPlanInputSchema>>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    defaultValues: {
      professionalRole: undefined,
      professionalRegistration: "",
      clientName: "",
      goalPhase: undefined,
      trainingExperience: undefined,
      trainingFrequency: 3,
      trainingVolumePreference: "medium",
      availableEquipment: "",
      heightCm: "",
      weightKg: "",
      age: "",
      sex: "prefer_not_to_say", 
      dietaryPreferences: "",
    },
  });

  async function onSubmit(values: z.infer<typeof ClientPersonalizedPlanInputSchema>) {
    setIsLoading(true);
    setGeneratedPlan(null);
    setError(null);

    const apiValues: PersonalizedPlanInput = {
        ...values,
        professionalRegistration: values.professionalRegistration || undefined,
        heightCm: values.heightCm ? Number(values.heightCm) : undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        age: values.age ? Number(values.age) : undefined,
        sex: (values.sex === "" || values.sex === "prefer_not_to_say") 
             ? undefined 
             : values.sex as "male" | "female" | undefined,
    };
    // clientName não é enviado para a IA, mas será salvo com o plano.

    try {
      const result = await generatePersonalizedPlan(apiValues);
      setGeneratedPlan(result);
    } catch (e: any) {
      console.error("Erro ao gerar plano pela IA:", e);
      let errorMessage = "Falha ao gerar o plano base. O modelo de IA pode estar ocupado ou a solicitação muito complexa.";
      if (typeof e.message === 'string') {
        if (e.message.includes("503") || e.message.toLowerCase().includes("service unavailable") || e.message.toLowerCase().includes("overloaded")) {
          errorMessage = "O modelo de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns minutos.";
        } else if (e.message.includes("API key not valid")) {
          errorMessage = "Houve um problema com a configuração da IA. Por favor, contate o suporte.";
        } else if (e.message.includes("Error fetching") && e.message.includes("https://generativelanguage.googleapis.com")) {
          errorMessage = "Não foi possível conectar ao serviço de IA. Verifique sua conexão ou tente mais tarde.";
        }
      }
      setError(errorMessage);
    }
    setIsLoading(false);
  }

  const handleSavePlan = async () => {
    if (!generatedPlan) {
      toast({ title: "Nenhum plano para salvar", description: "Gere um plano base primeiro.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Usuário não autenticado", description: "Faça login para salvar o plano do cliente.", variant: "destructive" });
      return;
    }
    const professionalRegistration = form.getValues('professionalRegistration');
    const clientName = form.getValues('clientName') || "Cliente sem nome";

    setIsSaving(true);
    try {
      // Lógica para salvar múltiplos planos por profissional:
      // Cada plano será um novo documento em uma subcoleção 'plans' dentro do documento do profissional.
      const plansCollectionRef = collection(db, "userGeneratedPlans", user.id, "plans");
      const newPlanRef = await addDoc(plansCollectionRef, {
        planData: generatedPlan, // O plano gerado pela IA (e que futuramente será editável)
        professionalId: user.id,
        professionalRegistration: professionalRegistration || null,
        clientName: clientName,
        goalPhase: form.getValues('goalPhase'),
        trainingFrequency: form.getValues('trainingFrequency'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: "Plano Salvo com Sucesso!",
        description: `O plano base para ${clientName} foi salvo. Você pode editá-lo e gerenciá-lo em "Planos Salvos".`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${newPlanRef.id}`)}>
            Ver Plano Salvo
          </Button>
        ),
      });
      setGeneratedPlan(null); // Limpa o plano gerado da tela após salvar
      form.resetField("clientName"); // Limpa o nome do cliente para o próximo
    } catch (e: any) {
      console.error("Erro ao salvar plano:", e);
      toast({
        title: "Erro ao Salvar Plano",
        description: e.message || "Não foi possível salvar o plano. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            Gerador de Plano Base para Clientes por IA
          </CardTitle>
          <ShadCnCardDescription>
            Profissional, preencha os dados do seu cliente abaixo. Nossa IA criará um rascunho inicial de treino e dieta focado em hipertrofia, que você poderá revisar, editar e validar com seu registro profissional.
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="professionalRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sua Principal Área de Atuação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione sua área" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="physical_educator">Educador Físico (Foco em Treino)</SelectItem>
                          <SelectItem value="nutritionist">Nutricionista (Foco em Dieta)</SelectItem>
                          <SelectItem value="both">Ambos (Educador Físico e Nutricionista)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="professionalRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Registro Profissional (CREF/CFN)</FormLabel>
                      <FormControl><Input placeholder="Ex: 012345-G/SP ou CRN-3 12345" {...field} /></FormControl>
                      <FormDescription>Este registro será exibido no plano final.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl><Input placeholder="Nome completo do cliente" {...field} /></FormControl>
                      <FormDescription>Este nome ajudará você a identificar o plano.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <h3 className="text-lg font-semibold border-t pt-4 mt-6">Informações do Cliente</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="goalPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo Principal do Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o objetivo do cliente" /></SelectTrigger>
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
                      <FormLabel>Experiência de Treino do Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o nível do cliente" /></SelectTrigger>
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
                      <FormLabel>Dias de Treino por Semana (Cliente)</FormLabel>
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
                      <FormLabel>Preferência de Volume Semanal (Cliente)</FormLabel>
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
                      <FormDescription>Séries por grupo muscular principal por semana para o cliente.</FormDescription>
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
                    <FormLabel>Equipamentos Disponíveis para o Cliente</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Academia completa, halteres e banco, peso corporal, elásticos" {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura Cliente (cm)</FormLabel>
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
                      <FormLabel>Peso Cliente (kg)</FormLabel>
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
                      <FormLabel>Idade Cliente</FormLabel>
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
                      <FormLabel>Sexo Biológico Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? "prefer_not_to_say"}>
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
                    <FormLabel>Preferências/Restrições Alimentares do Cliente (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Vegetariano, sem lactose, alergias, alimentos que não gosta..." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Detalhe as preferências do cliente para um plano alimentar mais assertivo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isSaving}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Plano Base para Cliente...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Plano Base
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
            <CardTitle className="text-destructive">Erro ao Gerar Plano Base</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Por favor, verifique os dados fornecidos ou tente novamente mais tarde. Se o erro persistir, pode ser uma instabilidade temporária no serviço de IA.</p>
          </CardContent>
        </Card>
      )}

      {generatedPlan && (
        <div className="space-y-6 mt-8">
          <Card className="shadow-lg sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
                <CardTitle className="text-xl text-primary">Rascunho do Plano Gerado!</CardTitle>
                <ShadCnCardDescription>Abaixo está o rascunho inicial para o cliente <span className="font-semibold">{form.getValues('clientName') || 'Não especificado'}</span>. Revise, edite se necessário e salve para seu cliente. Lembre-se de adicionar seu registro profissional (CREF/CFN) se ainda não o fez no formulário acima. O plano será salvo com o registro que estiver no campo acima.</ShadCnCardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSavePlan} disabled={isSaving || !user} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {user ? "Salvar Plano para Cliente" : "Faça login para Salvar"}
                </Button>
                <Button variant="outline" onClick={() => alert("Funcionalidade de edição detalhada do plano gerado antes de salvar estará disponível em breve.")} className="w-full sm:w-auto">
                    <Edit className="mr-2 h-4 w-4" /> Editar Rascunho (Em Breve)
                </Button>
            </CardFooter>
          </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">
                        <Dumbbell className="inline-block mr-2 h-5 w-5" /> Rascunho do Plano de Treino
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
                                        {ex.restSeconds && <span className="text-muted-foreground"> Descanso: {ex.restSeconds / 60} min.</span>}
                                        {ex.notes && <span className="block text-xs text-muted-foreground italic pl-4">- {ex.notes}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {generatedPlan.trainingPlan.notes && <p className="mt-4 text-sm text-muted-foreground italic"><strong>Notas do Treino (Rascunho):</strong> {generatedPlan.trainingPlan.notes}</p>}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">
                  <Utensils className="inline-block mr-2 h-5 w-5" /> Rascunho das Diretrizes de Dieta ({form.getValues('goalPhase')})
                </CardTitle>
                <ShadCnCardDescription>Metas Diárias Estimadas (Rascunho): ~{generatedPlan.dietGuidance.estimatedDailyCalories} kcal | Proteínas: {generatedPlan.dietGuidance.proteinGrams}g | Carboidratos: {generatedPlan.dietGuidance.carbGrams}g | Gorduras: {generatedPlan.dietGuidance.fatGrams}g</ShadCnCardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {generatedPlan.dietGuidance.dailyMealPlans.map((mealPlan, mealPlanIndex) => (
                  <div key={mealPlanIndex} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <h4 className="text-lg font-semibold mb-3 text-foreground">{mealPlan.mealName}</h4>
                    {mealPlan.mealOptions.map((option, optionIndex) => (
                      <div key={optionIndex} className="mb-4 pl-4 border-l-2 border-primary/30">
                        <p className="text-sm font-medium text-primary mb-1">Opção {optionIndex + 1}{option.optionDescription ? `: ${option.optionDescription}` : ''}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {option.items.map((foodItem, foodItemIndex) => (
                            <li key={foodItemIndex}>
                              {foodItem.foodName}: <span className="font-medium text-foreground/80">{foodItem.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
                {generatedPlan.dietGuidance.notes && <p className="mt-4 text-sm text-muted-foreground italic border-t pt-4"><strong>Notas Gerais da Dieta (Rascunho):</strong> {generatedPlan.dietGuidance.notes}</p>}
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">Resumo do Plano Base (Rascunho)</CardTitle>
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

    