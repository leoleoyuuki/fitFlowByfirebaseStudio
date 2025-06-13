
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
import type { PersonalizedPlanInput, PersonalizedPlanOutput, ExerciseDetail, DailyWorkout, FoodItemWithQuantity, MealOption, DailyMealPlan } from "@/ai/flows/generate-personalized-plan";
import { generatePersonalizedPlan } from "@/ai/flows/generate-personalized-plan";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, Dumbbell, Utensils, Save, Edit } from "lucide-react"; 
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

// Schema para o formulário de geração de inputs para a IA
const ClientPersonalizedPlanInputSchema = z.object({
  professionalRole: z.enum(["physical_educator", "nutritionist", "both"], { required_error: "Selecione sua principal área de atuação." }),
  professionalRegistration: z.string().min(3, {message: "Insira um registro profissional válido (mín. 3 caracteres)."}),
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
  clientName: z.string().min(2, {message: "Nome do cliente é obrigatório (mín. 2 caracteres)"}),
});

type ClientPersonalizedPlanInputValues = z.infer<typeof ClientPersonalizedPlanInputSchema>;

interface PersonalizedPlanFormProps {
  planIdToEdit?: string;
  initialClientInputs?: ClientPersonalizedPlanInputValues | null;
  initialPlanDataToEdit?: PersonalizedPlanOutput | null;
}

export function PersonalizedPlanForm({ planIdToEdit, initialClientInputs, initialPlanDataToEdit }: PersonalizedPlanFormProps) {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPlanOutput, setGeneratedPlanOutput] = useState<PersonalizedPlanOutput | null>(null);
  const [editablePlanDetails, setEditablePlanDetails] = useState<PersonalizedPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<ClientPersonalizedPlanInputValues>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    defaultValues: initialClientInputs || {
      professionalRole: user?.professionalType || undefined,
      professionalRegistration: user?.professionalRegistration || "",
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

  useEffect(() => {
    if (initialClientInputs) {
      form.reset(initialClientInputs);
    }
    if (initialPlanDataToEdit) {
      setGeneratedPlanOutput(initialPlanDataToEdit); // Mantém a saída original da IA (ou do plano salvo)
      setEditablePlanDetails(JSON.parse(JSON.stringify(initialPlanDataToEdit))); // Cria cópia profunda para edição
    }
  }, [initialClientInputs, initialPlanDataToEdit, form]);


  async function onGenerateSubmit(values: ClientPersonalizedPlanInputValues) {
    setIsLoadingAi(true);
    setGeneratedPlanOutput(null);
    setEditablePlanDetails(null);
    setError(null);

    const apiValues: PersonalizedPlanInput = {
        ...values,
        professionalRegistration: values.professionalRegistration || undefined, // Já é string, se vazio usa undefined
        heightCm: values.heightCm ? Number(values.heightCm) : undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        age: values.age ? Number(values.age) : undefined,
        sex: (values.sex === "" || values.sex === "prefer_not_to_say") 
             ? undefined 
             : values.sex as "male" | "female" | undefined,
    };

    try {
      const result = await generatePersonalizedPlan(apiValues);
      setGeneratedPlanOutput(result);
      setEditablePlanDetails(JSON.parse(JSON.stringify(result))); // Cópia profunda para edição
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
        } else {
          errorMessage = e.message;
        }
      }
      setError(errorMessage);
    }
    setIsLoadingAi(false);
  }

  const handlePlanDetailChange = (path: string, value: any) => {
    setEditablePlanDetails(prev => {
      if (!prev) return null;
      const newDetails = JSON.parse(JSON.stringify(prev)); // Deep copy
      let current = newDetails;
      const keys = path.split('.');
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key] = value;
        } else {
          if (!current[key]) current[key] = isNaN(Number(keys[index+1])) ? {} : [];
          current = current[key];
        }
      });
      return newDetails;
    });
  };

  const handleSavePlan = async () => {
    if (!editablePlanDetails) {
      toast({ title: "Nenhum plano para salvar", description: "Gere ou carregue um plano base primeiro.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Usuário não autenticado", description: "Faça login para salvar o plano do cliente.", variant: "destructive" });
      return;
    }
    const clientInputs = form.getValues(); // Inputs que geraram (ou carregaram) o plano

    setIsSaving(true);
    try {
      const dataToSave = {
        planData: editablePlanDetails, // O plano com as edições feitas pelo profissional
        originalInputs: clientInputs, // Inputs que originaram este plano
        professionalId: user.id,
        professionalRegistration: clientInputs.professionalRegistration || null,
        clientName: clientInputs.clientName,
        goalPhase: clientInputs.goalPhase,
        trainingFrequency: clientInputs.trainingFrequency,
        updatedAt: serverTimestamp(),
      };

      if (planIdToEdit) { // Se estamos editando um plano existente
        const planRef = doc(db, "userGeneratedPlans", user.id, "plans", planIdToEdit);
        await updateDoc(planRef, dataToSave);
        toast({
          title: "Plano Atualizado!",
          description: `O plano para ${clientInputs.clientName} foi atualizado com sucesso.`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${planIdToEdit}`)}>
              Ver Plano Salvo
            </Button>
          ),
        });
         // Não limpar o formulário aqui, pois o usuário pode querer continuar editando
      } else { // Criando um novo plano
        const plansCollectionRef = collection(db, "userGeneratedPlans", user.id, "plans");
        const newPlanRef = await addDoc(plansCollectionRef, {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Plano Salvo com Sucesso!",
          description: `O plano base para ${clientInputs.clientName} foi salvo. Você pode gerenciá-lo em "Planos Salvos".`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${newPlanRef.id}`)}>
              Ver Plano Salvo
            </Button>
          ),
        });
        // Limpar tudo para um novo cliente, exceto dados do profissional
        setGeneratedPlanOutput(null);
        setEditablePlanDetails(null);
        form.reset({
          ...form.getValues(), // Mantém dados do profissional
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
        });
      }
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
  
  // Helper para renderizar inputs para campos de texto
  const renderTextInput = (value: string | undefined | null, path: string, placeholder = "", isTextarea = false, rows = 2) => (
    isTextarea ? (
      <Textarea
        value={value || ""}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handlePlanDetailChange(path, e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm"
        rows={rows}
      />
    ) : (
      <Input
        type="text"
        value={value || ""}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handlePlanDetailChange(path, e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm"
      />
    )
  );

  const renderNumberInput = (value: number | undefined | null, path: string, placeholder = "") => (
    <Input
      type="number"
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e: ChangeEvent<HTMLInputElement>) => handlePlanDetailChange(path, e.target.value === "" ? null : Number(e.target.value))}
      placeholder={placeholder}
      className="w-full text-sm"
    />
  );


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            {planIdToEdit ? "Editar Plano Existente" : "Gerador de Plano Base para Clientes por IA"}
          </CardTitle>
          <ShadCnCardDescription>
            {planIdToEdit 
              ? `Editando o plano para ${form.getValues('clientName') || 'Cliente'}. Modifique os detalhes abaixo ou gere um novo rascunho com base nos inputs atuais.`
              : `Profissional, preencha os dados do seu cliente abaixo. Nossa IA criará um rascunho inicial de treino e dieta focado em hipertrofia.`
            }
            <br/>Este rascunho poderá ser revisado e editado por você antes de salvar.
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerateSubmit)} className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Profissional e Cliente</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="professionalRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sua Principal Área de Atuação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                      <FormDescription>Obrigatório. Será exibido no plano final.</FormDescription>
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
                      <FormDescription>Obrigatório. Para identificar o plano.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <h3 className="text-lg font-semibold border-t pt-4 mt-6">Informações do Cliente para Geração IA</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="goalPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo Principal do Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
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
                      <Select onValueChange={field.onChange} value={field.value ?? "prefer_not_to_say"}>
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
              <Button type="submit" className="w-full md:w-auto" disabled={isLoadingAi || isSaving}>
                {isLoadingAi ? (
                  <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Rascunho com IA... </>
                ) : (
                  <> <Wand2 className="mr-2 h-4 w-4" /> {planIdToEdit && editablePlanDetails ? "Gerar Novo Rascunho com IA (Substituir Edição Atual)" : "Gerar Rascunho com IA"} </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao Gerar Rascunho</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Por favor, verifique os dados fornecidos ou tente novamente mais tarde. Se o erro persistir, pode ser uma instabilidade temporária no serviço de IA.</p>
          </CardContent>
        </Card>
      )}

      {editablePlanDetails && (
        <div className="space-y-6 mt-8">
          <Card className="shadow-lg sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
                <CardTitle className="text-xl text-primary">
                  {planIdToEdit ? "Editando Plano de " : "Rascunho do Plano Gerado para "}
                  <span className="font-semibold">{form.getValues('clientName') || 'Cliente'}</span>
                </CardTitle>
                <ShadCnCardDescription>
                  Abaixo está o rascunho para o cliente. Revise e edite os detalhes conforme necessário.
                  Lembre-se que seu registro profissional ({form.getValues('professionalRegistration') || 'N/A'}) será associado a este plano.
                </ShadCnCardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSavePlan} disabled={isSaving || !user || isLoadingAi} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {user ? (planIdToEdit ? "Salvar Alterações no Plano" : "Salvar Plano para Cliente") : "Faça login para Salvar"}
                </Button>
            </CardFooter>
          </Card>
          
          {/* Seção de Edição do Plano */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Resumo Geral (Editável)</CardTitle></CardHeader>
            <CardContent>
              {renderTextInput(editablePlanDetails.overallSummary, 'overallSummary', 'Resumo geral do plano...', true, 4)}
            </CardContent>
          </Card>

          {editablePlanDetails.trainingPlan && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary" /> Plano de Treino (Editável)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Descrição da Divisão Semanal</Label>
                  {renderTextInput(editablePlanDetails.trainingPlan.weeklySplitDescription, 'trainingPlan.weeklySplitDescription', 'Ex: Divisão ABCDE...', true)}
                </div>
                <div>
                  <Label className="text-sm font-medium">Resumo do Volume Semanal</Label>
                  {renderTextInput(editablePlanDetails.trainingPlan.weeklyVolumeSummary, 'trainingPlan.weeklyVolumeSummary', 'Ex: Aprox. 15 séries por grupo...', true)}
                </div>

                {editablePlanDetails.trainingPlan.workouts.map((workoutDay, dayIndex) => (
                  <Card key={dayIndex} className="p-4 border bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <Label className="text-xs font-medium">Dia de Treino {dayIndex + 1}</Label>
                        {renderTextInput(workoutDay.day, `trainingPlan.workouts.${dayIndex}.day`, 'Ex: Segunda-feira ou Dia de Peito')}
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Foco do Dia</Label>
                        {renderTextInput(workoutDay.focus, `trainingPlan.workouts.${dayIndex}.focus`, 'Ex: Peito, Ombros & Tríceps')}
                      </div>
                    </div>
                    <Label className="text-sm font-semibold mb-2 block">Exercícios:</Label>
                    {workoutDay.exercises.map((ex, exIndex) => (
                      <Card key={exIndex} className="p-3 mb-3 bg-background">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                          <div>
                            <Label className="text-xs">Nome</Label>
                            {renderTextInput(ex.name, `trainingPlan.workouts.${dayIndex}.exercises.${exIndex}.name`, 'Nome do Exercício')}
                          </div>
                          <div>
                            <Label className="text-xs">Séries</Label>
                            {renderTextInput(ex.sets, `trainingPlan.workouts.${dayIndex}.exercises.${exIndex}.sets`, 'Ex: 3-4')}
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            {renderTextInput(ex.reps, `trainingPlan.workouts.${dayIndex}.exercises.${exIndex}.reps`, 'Ex: 8-12')}
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-xs">Descanso (segundos)</Label>
                            {renderNumberInput(ex.restSeconds, `trainingPlan.workouts.${dayIndex}.exercises.${exIndex}.restSeconds`, 'Ex: 120')}
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label className="text-xs">Notas do Exercício</Label>
                            {renderTextInput(ex.notes, `trainingPlan.workouts.${dayIndex}.exercises.${exIndex}.notes`, 'Instruções específicas...', true, 1)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Card>
                ))}
                <div>
                  <Label className="text-sm font-medium">Notas Gerais do Treino</Label>
                  {renderTextInput(editablePlanDetails.trainingPlan.notes, 'trainingPlan.notes', 'Notas gerais sobre o treino...', true)}
                </div>
              </CardContent>
            </Card>
          )}

          {editablePlanDetails.dietGuidance && (
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><Utensils className="mr-2 h-5 w-5 text-primary" /> Diretrizes de Dieta (Editável - {form.getValues('goalPhase')})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Calorias Diárias Est.</Label>
                    {renderNumberInput(editablePlanDetails.dietGuidance.estimatedDailyCalories, 'dietGuidance.estimatedDailyCalories', 'Ex: 2500')}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Proteínas (g)</Label>
                    {renderNumberInput(editablePlanDetails.dietGuidance.proteinGrams, 'dietGuidance.proteinGrams', 'Ex: 180')}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Carboidratos (g)</Label>
                    {renderNumberInput(editablePlanDetails.dietGuidance.carbGrams, 'dietGuidance.carbGrams', 'Ex: 300')}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Gorduras (g)</Label>
                    {renderNumberInput(editablePlanDetails.dietGuidance.fatGrams, 'dietGuidance.fatGrams', 'Ex: 70')}
                  </div>
                </div>

                {editablePlanDetails.dietGuidance.dailyMealPlans.map((mealPlan, mealPlanIndex) => (
                  <Card key={mealPlanIndex} className="p-4 border bg-muted/30">
                    <div>
                      <Label className="text-sm font-semibold">Nome da Refeição</Label>
                      {renderTextInput(mealPlan.mealName, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealName`, 'Ex: Café da Manhã')}
                    </div>
                    <Label className="text-sm font-semibold mt-3 mb-2 block">Opções de Refeição:</Label>
                    {mealPlan.mealOptions.map((option, optionIndex) => (
                      <Card key={optionIndex} className="p-3 mb-3 bg-background">
                        <div>
                          <Label className="text-xs">Descrição da Opção (Opcional)</Label>
                           {renderTextInput(option.optionDescription, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealOptions.${optionIndex}.optionDescription`, 'Ex: Alto em proteína', true, 1)}
                        </div>
                        <Label className="text-sm font-medium mt-2 mb-1 block">Itens:</Label>
                        {option.items.map((foodItem, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2 border-b border-dashed pb-1 last:border-b-0 last:pb-0">
                            <div>
                              <Label className="text-xs">Nome do Alimento</Label>
                              {renderTextInput(foodItem.foodName, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealOptions.${optionIndex}.items.${itemIndex}.foodName`, 'Ex: Peito de Frango')}
                            </div>
                            <div>
                              <Label className="text-xs">Quantidade</Label>
                              {renderTextInput(foodItem.quantity, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealOptions.${optionIndex}.items.${itemIndex}.quantity`, 'Ex: 150g')}
                            </div>
                          </div>
                        ))}
                      </Card>
                    ))}
                  </Card>
                ))}
                 <div>
                  <Label className="text-sm font-medium">Notas Gerais da Dieta</Label>
                  {renderTextInput(editablePlanDetails.dietGuidance.notes, 'dietGuidance.notes', 'Notas sobre hidratação, suplementos...', true)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

    
