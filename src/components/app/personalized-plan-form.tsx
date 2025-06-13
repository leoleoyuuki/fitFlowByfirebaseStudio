
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
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Dumbbell, Utensils, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { ClientPersonalizedPlanInputValues, ClientPlan } from "@/types";

// Schema para o formulário de geração de inputs para a IA
const ClientPersonalizedPlanInputSchema = z.object({
  professionalRole: z.enum(["physical_educator", "nutritionist", "both"], { required_error: "Selecione sua principal área de atuação." }),
  professionalRegistration: z.string().min(3, {message: "Insira um registro profissional válido (mín. 3 caracteres)."}),
  clientName: z.string().min(2, {message: "Nome do cliente é obrigatório (mín. 2 caracteres)"}),
  goalPhase: z.enum(["bulking", "cutting", "maintenance"], { required_error: "Selecione o objetivo principal do cliente." }),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Selecione a experiência de treino do cliente." }),
  trainingFrequency: z.coerce.number({invalid_type_error: "Deve ser um número"}).min(2, "Mínimo de 2 dias").max(6, "Máximo de 6 dias").default(3),
  trainingVolumePreference: z.enum(["low", "medium", "high"], { required_error: "Selecione a preferência de volume de treino do cliente."}),
  availableEquipment: z.string().min(5, { message: "Liste os equipamentos do cliente (mín. 5 caracteres)." }),
  heightCm: z.preprocess(
    (val) => (val === "" || val === null ? undefined : String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Altura deve ser um número."}).positive({message: "Altura deve ser positiva."}).optional()
  ),
  weightKg: z.preprocess(
    (val) => (val === "" || val === null ? undefined : String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Peso deve ser um número."}).positive({message: "Peso deve ser positivo."}).optional()
  ),
  age: z.preprocess(
    (val) => (val === "" || val === null ? undefined : String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Idade deve ser um número."}).positive({message: "Idade deve ser positiva."}).optional()
  ),
  sex: z.enum(["male", "female", "prefer_not_to_say", ""], { errorMap: () => ({message: "Selecione o sexo biológico ou 'Prefiro não dizer'."}) }).optional(),
  dietaryPreferences: z.string().optional(),
});


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
  
  // Campos para edição direta no modo de edição (não parte do form principal)
  const [editableClientName, setEditableClientName] = useState("");
  const [editableProfessionalRegistration, setEditableProfessionalRegistration] = useState("");
   const [editableProfessionalRole, setEditableProfessionalRole] = useState<"physical_educator" | "nutritionist" | "both" | undefined>(undefined);


  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const isEditingExistingPlan = !!planIdToEdit;

  const form = useForm<ClientPersonalizedPlanInputValues>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    defaultValues: {
      professionalRole: user?.professionalType || undefined,
      professionalRegistration: user?.professionalRegistration || "",
      clientName: "",
      goalPhase: undefined,
      trainingExperience: undefined,
      trainingFrequency: 3,
      trainingVolumePreference: "medium",
      availableEquipment: "",
      heightCm: '', 
      weightKg: '',
      age: '',
      sex: "prefer_not_to_say", 
      dietaryPreferences: "",
    },
  });
  
   useEffect(() => {
    if (isEditingExistingPlan && initialClientInputs) {
        // Para o modo de edição, não resetamos o form principal da RHF.
        // Populamos os estados locais para os campos editáveis e os dados do plano.
        setEditableClientName(initialClientInputs.clientName || "");
        setEditableProfessionalRegistration(initialClientInputs.professionalRegistration || user?.professionalRegistration || "");
        setEditableProfessionalRole(initialClientInputs.professionalRole || user?.professionalType || undefined);

        if (initialPlanDataToEdit) {
            setGeneratedPlanOutput(initialPlanDataToEdit); // Manter uma cópia do original gerado se necessário
            setEditablePlanDetails(JSON.parse(JSON.stringify(initialPlanDataToEdit)));
        } else {
            setGeneratedPlanOutput(null);
            setEditablePlanDetails(null);
        }
    } else if (!isEditingExistingPlan) {
        // Modo de criação: resetar o formulário da RHF com defaults ou dados do usuário
        form.reset({
            professionalRole: user?.professionalType || undefined,
            professionalRegistration: user?.professionalRegistration || "",
            clientName: "", 
            goalPhase: undefined,
            trainingExperience: undefined,
            trainingFrequency: 3,
            trainingVolumePreference: "medium",
            availableEquipment: "",
            heightCm: '', 
            weightKg: '',
            age: '',
            sex: "prefer_not_to_say",
            dietaryPreferences: "",
        });
        setEditablePlanDetails(null); // Limpar detalhes editáveis
        setGeneratedPlanOutput(null); // Limpar plano gerado
        setEditableClientName("");
        setEditableProfessionalRegistration(user?.professionalRegistration || "");
        setEditableProfessionalRole(user?.professionalType || undefined);
    }
  }, [planIdToEdit, initialClientInputs, initialPlanDataToEdit, form, user, isEditingExistingPlan]);


  async function onGenerateSubmit(values: ClientPersonalizedPlanInputValues) {
    setIsLoadingAi(true);
    setGeneratedPlanOutput(null);
    setEditablePlanDetails(null);
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

    try {
      const result = await generatePersonalizedPlan(apiValues);
      setGeneratedPlanOutput(result); 
      setEditablePlanDetails(JSON.parse(JSON.stringify(result))); 
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
      const newDetails = JSON.parse(JSON.stringify(prev)); 
      let current = newDetails;
      const keys = path.split('.');
      keys.forEach((key, index) => {
        const isLastKey = index === keys.length - 1;
        const nextKeyIsNumber = !isLastKey && !isNaN(Number(keys[index+1]));
        
        if (isLastKey) {
          current[key] = value;
        } else {
          if (current[key] === undefined || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = nextKeyIsNumber ? [] : {};
          }
          current = current[key];
        }
      });
      return newDetails;
    });
  };
  

  const handleSavePlan = async () => {
    if (!user) {
        toast({ title: "Usuário não autenticado", description: "Faça login para salvar o plano do cliente.", variant: "destructive" });
        return;
    }
    if (!editablePlanDetails && !initialPlanDataToEdit && !generatedPlanOutput) {
        toast({ title: "Nenhum plano para salvar", description: "Gere um plano base primeiro ou carregue um para edição.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    let finalOriginalInputs: ClientPersonalizedPlanInputValues;
    const planDataContent = editablePlanDetails || initialPlanDataToEdit || generatedPlanOutput;

    if (!planDataContent) {
         toast({ title: "Dados do Plano Ausentes", description: "Não foi possível encontrar os detalhes do plano para salvar.", variant: "destructive" });
         setIsSaving(false);
         return;
    }

    if (isEditingExistingPlan) {
        if (!initialClientInputs) {
            toast({ title: "Erro Interno", description: "Dados originais do cliente não encontrados para edição.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        if (!editableClientName.trim() || editableClientName.trim().length < 2) {
            toast({ title: "Erro de Validação", description: "Nome do cliente é obrigatório (mín. 2 caracteres).", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        if (!editableProfessionalRegistration.trim() || editableProfessionalRegistration.trim().length < 3) {
            toast({ title: "Erro de Validação", description: "Registro profissional é obrigatório (mín. 3 caracteres).", variant: "destructive" });
            setIsSaving(false);
            return;
        }
         if (!editableProfessionalRole) {
            toast({ title: "Erro de Validação", description: "Área de atuação profissional é obrigatória.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        finalOriginalInputs = {
            ...initialClientInputs, // Preserva todos os dados originais
            clientName: editableClientName.trim(),
            professionalRegistration: editableProfessionalRegistration.trim(),
            professionalRole: editableProfessionalRole,
        };
    } else {
        // Modo de criação: usa o react-hook-form
        const isValid = await form.trigger(Object.keys(ClientPersonalizedPlanInputSchema.shape) as Array<keyof ClientPersonalizedPlanInputValues>);
        if (!isValid) {
            toast({ title: "Erro de Validação", description: "Por favor, corrija os erros no formulário de dados do cliente antes de salvar.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        const rawClientInputsFromForm = form.getValues();
        finalOriginalInputs = { ...rawClientInputsFromForm };
    }

    // Sanitização final para Firestore (null em vez de undefined)
    (Object.keys(finalOriginalInputs) as Array<keyof ClientPersonalizedPlanInputValues>).forEach(key => {
        const k = key as keyof ClientPersonalizedPlanInputValues;
        if (finalOriginalInputs[k] === undefined) {
            (finalOriginalInputs as any)[k] = null;
        } else if (typeof finalOriginalInputs[k] === 'string' && (finalOriginalInputs[k] as string).trim() === "" && 
                   (k === 'heightCm' || k === 'weightKg' || k === 'age' || k === 'dietaryPreferences' || k === 'sex' )) {
            (finalOriginalInputs as any)[k] = null;
        } else if (k === 'sex' && finalOriginalInputs[k] === "prefer_not_to_say") {
             (finalOriginalInputs as any)[k] = null;
        }
    });
    
    // Convert specific numeric fields to numbers or null
    const numericFields = ['heightCm', 'weightKg', 'age'] as const;
    numericFields.forEach(field => {
        const val = finalOriginalInputs[field];
        if (val !== null && val !== undefined && String(val).trim() !== "") {
            const numVal = Number(val);
            (finalOriginalInputs as any)[field] = isNaN(numVal) ? null : numVal;
        } else {
            (finalOriginalInputs as any)[field] = null;
        }
    });


    // Verificações críticas finais
    const requiredFields: Array<keyof ClientPersonalizedPlanInputValues> = ['professionalRole', 'professionalRegistration', 'clientName'];
    if (!isEditingExistingPlan) {
        requiredFields.push('goalPhase', 'trainingExperience', 'availableEquipment');
    }
    for (const field of requiredFields) {
        if (finalOriginalInputs[field] === null || finalOriginalInputs[field] === undefined || String(finalOriginalInputs[field]).trim() === "") {
            toast({ title: "Erro Crítico de Dados", description: `O campo '${field}' é obrigatório e não foi preenchido corretamente.`, variant: "destructive" });
            setIsSaving(false);
            return;
        }
    }


    const dataToSave: Omit<ClientPlan, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      planData: planDataContent, 
      originalInputs: finalOriginalInputs, 
      professionalId: user.id,
      professionalRegistration: finalOriginalInputs.professionalRegistration,
      clientName: finalOriginalInputs.clientName,
      goalPhase: finalOriginalInputs.goalPhase!, // Já validado como não nulo
      trainingFrequency: finalOriginalInputs.trainingFrequency!, // Já validado
      updatedAt: serverTimestamp(),
    };
    
    try {
      if (planIdToEdit) { 
        const planRef = doc(db, "userGeneratedPlans", user.id, "plans", planIdToEdit);
        await updateDoc(planRef, dataToSave);
        toast({
          title: "Plano Atualizado!",
          description: `O plano para ${finalOriginalInputs.clientName} foi atualizado com sucesso.`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${planIdToEdit}`)}>
              Ver Plano Salvo
            </Button>
          ),
        });
      } else { 
        const plansCollectionRef = collection(db, "userGeneratedPlans", user.id, "plans");
        const newPlanRef = await addDoc(plansCollectionRef, {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Plano Salvo com Sucesso!",
          description: `O plano base para ${finalOriginalInputs.clientName} foi salvo. Você pode gerenciá-lo em "Planos Salvos".`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${newPlanRef.id}`)}>
              Ver Plano Salvo
            </Button>
          ),
        });
        // Limpa o estado após salvar um novo plano
        setGeneratedPlanOutput(null);
        setEditablePlanDetails(null);
        form.reset({ 
            professionalRole: user?.professionalType || undefined,
            professionalRegistration: user?.professionalRegistration || "",
            clientName: "", 
            goalPhase: undefined,
            trainingExperience: undefined,
            trainingFrequency: 3,
            trainingVolumePreference: "medium",
            availableEquipment: "",
            heightCm: '' ,
            weightKg: '' ,
            age: '' ,
            sex: "prefer_not_to_say",
            dietaryPreferences: "",
        });
         setEditableClientName("");
         setEditableProfessionalRegistration(user?.professionalRegistration || "");
         setEditableProfessionalRole(user?.professionalType || undefined);
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

  const clientInfoSectionTitle = isEditingExistingPlan ? `Editando Plano de ${initialClientInputs?.clientName || 'Cliente'}` : "Gerar Plano Base para Cliente";


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            {clientInfoSectionTitle}
          </CardTitle>
          <ShadCnCardDescription>
             {isEditingExistingPlan 
              ? `Ajuste os detalhes do plano abaixo. Seu registro profissional (${editableProfessionalRegistration || initialClientInputs?.professionalRegistration || 'N/A'}) será associado a este plano.`
              : `Profissional, preencha os dados do seu cliente abaixo. A IA criará um rascunho inicial que você poderá editar antes de salvar.`
            }
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          {/* Formulário de Dados do Cliente (para criação ou edição limitada) */}
          {!isEditingExistingPlan ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onGenerateSubmit)} className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Profissional e Cliente</h3>
                <ShadCnCardDescription>Profissional, preencha os dados do seu cliente abaixo. A IA criará um rascunho inicial. Você poderá editá-lo antes de salvar.</ShadCnCardDescription>
                
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
                        <FormControl><Input placeholder="Ex: 012345-G/SP ou CRN-3 12345" {...field} value={field.value || ""} /></FormControl>
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
                      <FormControl><Input placeholder="Nome completo do cliente" {...field} value={field.value || ""} /></FormControl>
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
                          <Input type="number" placeholder="Ex: 3 (2-6 dias)" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} value={field.value || 3} />
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
                        <Select onValueChange={field.onChange} value={field.value || "medium"}>
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
                        <Textarea placeholder="Ex: Academia completa, halteres e banco, peso corporal, elásticos" {...field} value={field.value || ""} rows={2} />
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
                        <FormControl><Input type="number" placeholder="Ex: 180" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} /></FormControl>
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
                        <FormControl><Input type="number" placeholder="Ex: 75" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} /></FormControl>
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
                        <FormControl><Input type="number" placeholder="Ex: 25" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} /></FormControl>
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
                      <FormLabel>Preferências/Restrições Alimentares do Cliente</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Vegetariano, sem lactose, alergias, alimentos que não gosta..." {...field} value={field.value ?? ""} rows={3} />
                      </FormControl>
                      <FormDescription>Detalhe as preferências do cliente para um plano alimentar mais assertivo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full md:w-auto" disabled={isLoadingAi || isSaving}>
                  {isLoadingAi ? (
                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Rascunho com IA... </>
                  ) : (
                    <> <Wand2 className="mr-2 h-4 w-4" /> {(editablePlanDetails || generatedPlanOutput) ? "Gerar Novo Rascunho (Substituirá Edições Atuais)" : "Gerar Rascunho com IA"} </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            // Modo de Edição: Exibe alguns dados do cliente e campos para profissional
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Dados do Profissional e Cliente</h3>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <FormItem>
                            <FormLabel>Sua Principal Área de Atuação</FormLabel>
                             <Select onValueChange={(value) => setEditableProfessionalRole(value as any)} value={editableProfessionalRole || undefined}>
                                <SelectTrigger><SelectValue placeholder="Selecione sua área" /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="physical_educator">Educador Físico (Foco em Treino)</SelectItem>
                                <SelectItem value="nutritionist">Nutricionista (Foco em Dieta)</SelectItem>
                                <SelectItem value="both">Ambos (Educador Físico e Nutricionista)</SelectItem>
                                </SelectContent>
                            </Select>
                            {!editableProfessionalRole && <p className="text-sm text-destructive mt-1">Campo obrigatório.</p>}
                        </FormItem>
                        <FormItem>
                            <FormLabel>Seu Registro Profissional (CREF/CFN)</FormLabel>
                            <Input 
                                placeholder="Ex: 012345-G/SP ou CRN-3 12345" 
                                value={editableProfessionalRegistration} 
                                onChange={(e) => setEditableProfessionalRegistration(e.target.value)} 
                            />
                            <FormDescription>Obrigatório. Será exibido no plano final.</FormDescription>
                             {(!editableProfessionalRegistration || editableProfessionalRegistration.trim().length < 3) && <p className="text-sm text-destructive mt-1">Mínimo 3 caracteres.</p>}
                        </FormItem>
                    </div>
                     <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <Input 
                            placeholder="Nome completo do cliente" 
                            value={editableClientName} 
                            onChange={(e) => setEditableClientName(e.target.value)} 
                        />
                        <FormDescription>Obrigatório. Para identificar o plano.</FormDescription>
                        {(!editableClientName || editableClientName.trim().length < 2) && <p className="text-sm text-destructive mt-1">Mínimo 2 caracteres.</p>}
                    </FormItem>
                </div>
                {initialClientInputs && (
                    <Card className="bg-muted/30 p-4">
                        <CardHeader className="p-2 pt-0"><CardTitle className="text-base">Resumo dos Inputs Originais (Não Editável Aqui)</CardTitle></CardHeader>
                        <CardContent className="p-2 text-sm space-y-1">
                            <p><strong>Objetivo:</strong> {initialClientInputs.goalPhase}</p>
                            <p><strong>Experiência:</strong> {initialClientInputs.trainingExperience}</p>
                            <p><strong>Frequência Treino:</strong> {initialClientInputs.trainingFrequency} dias/semana</p>
                            <p><strong>Equipamento:</strong> {initialClientInputs.availableEquipment}</p>
                            {/* Adicionar mais campos se relevante para visualização */}
                        </CardContent>
                    </Card>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && !isEditingExistingPlan && !editablePlanDetails && !generatedPlanOutput && ( 
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
      
      {(editablePlanDetails || (isEditingExistingPlan && initialPlanDataToEdit)) && ( 
        <div className="space-y-6 mt-8">
            <Card className="shadow-lg sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">
                    Detalhes Editáveis do Plano para: <span className="font-semibold">{isEditingExistingPlan ? editableClientName : form.getValues('clientName') || 'Cliente'}</span>
                    </CardTitle>
                    <ShadCnCardDescription>
                    Abaixo estão os detalhes {isEditingExistingPlan ? 'atuais' : 'do rascunho'} para o cliente. Revise e edite conforme necessário.
                    Seu registro profissional ({isEditingExistingPlan ? editableProfessionalRegistration : form.getValues('professionalRegistration') || 'N/A'}) será associado a este plano.
                    </ShadCnCardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleSavePlan} disabled={isSaving || !user || isLoadingAi} className="w-full sm:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {user ? (isEditingExistingPlan ? "Salvar Alterações no Plano" : "Salvar Plano para Cliente") : "Faça login para Salvar"}
                    </Button>
                </CardFooter>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-lg">Resumo Geral (Editável)</CardTitle></CardHeader>
                <CardContent>
                {renderTextInput(editablePlanDetails?.overallSummary ?? initialPlanDataToEdit?.overallSummary, 'overallSummary', 'Resumo geral do plano...', true, 4)}
                </CardContent>
            </Card>

            { (editablePlanDetails?.trainingPlan || initialPlanDataToEdit?.trainingPlan) && (
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary" /> Plano de Treino (Editável)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label className="text-sm font-medium">Descrição da Divisão Semanal</Label>
                    {renderTextInput(editablePlanDetails?.trainingPlan?.weeklySplitDescription ?? initialPlanDataToEdit?.trainingPlan?.weeklySplitDescription, 'trainingPlan.weeklySplitDescription', 'Ex: Divisão ABCDE...', true)}
                    </div>
                    <div>
                    <Label className="text-sm font-medium">Resumo do Volume Semanal</Label>
                    {renderTextInput(editablePlanDetails?.trainingPlan?.weeklyVolumeSummary ?? initialPlanDataToEdit?.trainingPlan?.weeklyVolumeSummary, 'trainingPlan.weeklyVolumeSummary', 'Ex: Aprox. 15 séries por grupo...', true)}
                    </div>

                    {(editablePlanDetails?.trainingPlan?.workouts ?? initialPlanDataToEdit?.trainingPlan?.workouts)?.map((workoutDay, dayIndex) => (
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
                    {renderTextInput(editablePlanDetails?.trainingPlan?.notes ?? initialPlanDataToEdit?.trainingPlan?.notes, 'trainingPlan.notes', 'Notas gerais sobre o treino...', true)}
                    </div>
                </CardContent>
                </Card>
            )}

            {(editablePlanDetails?.dietGuidance || initialPlanDataToEdit?.dietGuidance) && (
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Utensils className="mr-2 h-5 w-5 text-primary" /> 
                        Diretrizes de Dieta (Editável - {isEditingExistingPlan ? initialClientInputs?.goalPhase : form.getValues('goalPhase')})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-xs font-medium">Calorias Diárias Est.</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.estimatedDailyCalories ?? initialPlanDataToEdit?.dietGuidance?.estimatedDailyCalories, 'dietGuidance.estimatedDailyCalories', 'Ex: 2500')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Proteínas (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.proteinGrams ?? initialPlanDataToEdit?.dietGuidance?.proteinGrams, 'dietGuidance.proteinGrams', 'Ex: 180')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Carboidratos (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.carbGrams ?? initialPlanDataToEdit?.dietGuidance?.carbGrams, 'dietGuidance.carbGrams', 'Ex: 300')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Gorduras (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.fatGrams ?? initialPlanDataToEdit?.dietGuidance?.fatGrams, 'dietGuidance.fatGrams', 'Ex: 70')}
                    </div>
                    </div>

                    {(editablePlanDetails?.dietGuidance?.dailyMealPlans ?? initialPlanDataToEdit?.dietGuidance?.dailyMealPlans)?.map((mealPlan, mealPlanIndex) => (
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
                    {renderTextInput(editablePlanDetails?.dietGuidance?.notes ?? initialPlanDataToEdit?.dietGuidance?.notes, 'dietGuidance.notes', 'Notas sobre hidratação, suplementos...', true)}
                    </div>
                </CardContent>
                </Card>
            )}
        </div>
      )}
    </div>
  );
}

