
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
import { Loader2, Wand2, Dumbbell, Utensils, Save, Download, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { ClientPersonalizedPlanInputValues, ClientPlan } from "@/types";

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
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Altura deve ser um número."}).positive({message: "Altura deve ser positiva."}).optional()
  ),
  weightKg: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
    z.coerce.number({invalid_type_error: "Peso deve ser um número."}).positive({message: "Peso deve ser positivo."}).optional()
  ),
  age: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : val),
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

  const [editableProfessionalRole, setEditableProfessionalRole] = useState<ClientPersonalizedPlanInputValues['professionalRole'] | undefined>(undefined);
  const [editableProfessionalRegistration, setEditableProfessionalRegistration] = useState("");
  const [editableClientName, setEditableClientName] = useState("");
  
  const [profRoleError, setProfRoleError] = useState<string | null>(null);
  const [profRegError, setProfRegError] = useState<string | null>(null);
  const [clientNameError, setClientNameError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const isEditingExistingPlan = !!planIdToEdit;

  const form = useForm<ClientPersonalizedPlanInputValues>({
    resolver: zodResolver(ClientPersonalizedPlanInputSchema),
    // Default values are set in useEffect
  });

  useEffect(() => {
    let preparedInitialInputs: Partial<ClientPersonalizedPlanInputValues> = {};

    if (isEditingExistingPlan && initialClientInputs) {
        // Set local state for the three editable fields in edit mode
        setEditableProfessionalRole(initialClientInputs.professionalRole || user?.professionalType || undefined);
        setEditableProfessionalRegistration(initialClientInputs.professionalRegistration || user?.professionalRegistration || "");
        setEditableClientName(initialClientInputs.clientName || "");
        setProfRoleError(null); setProfRegError(null); setClientNameError(null);

        // Populate preparedInitialInputs with all values from initialClientInputs for form.reset
        // This ensures react-hook-form has values for hidden fields too.
        preparedInitialInputs = {
            ...initialClientInputs,
            professionalRole: initialClientInputs.professionalRole || user?.professionalType || undefined,
            professionalRegistration: initialClientInputs.professionalRegistration || user?.professionalRegistration || "",
            clientName: initialClientInputs.clientName || "",
            // Ensure string representation for optional number inputs if they are null/undefined initially
            heightCm: initialClientInputs.heightCm ?? '',
            weightKg: initialClientInputs.weightKg ?? '',
            age: initialClientInputs.age ?? '',
            sex: initialClientInputs.sex ?? "prefer_not_to_say",
            dietaryPreferences: initialClientInputs.dietaryPreferences ?? "",
        };
        form.reset(preparedInitialInputs);


        if (initialPlanDataToEdit) {
            setGeneratedPlanOutput(initialPlanDataToEdit);
            setEditablePlanDetails(JSON.parse(JSON.stringify(initialPlanDataToEdit)));
        } else {
            setGeneratedPlanOutput(null);
            setEditablePlanDetails(null);
        }
    } else if (!isEditingExistingPlan) { // Creating a new plan
        const defaultNewPlanInputs: ClientPersonalizedPlanInputValues = {
            professionalRole: user?.professionalType || undefined,
            professionalRegistration: user?.professionalRegistration || "",
            clientName: "",
            goalPhase: undefined, // Explicitly undefined for required fields
            trainingExperience: undefined,
            trainingFrequency: 3,
            trainingVolumePreference: "medium",
            availableEquipment: "",
            heightCm: '', 
            weightKg: '',
            age: '',
            sex: "prefer_not_to_say",
            dietaryPreferences: "",
        };
        form.reset(defaultNewPlanInputs); // Reset RHF with defaults for new plan
        setEditablePlanDetails(null);
        setGeneratedPlanOutput(null);
        setEditableProfessionalRole(user?.professionalType || undefined);
        setEditableProfessionalRegistration(user?.professionalRegistration || "");
        setEditableClientName("");
        setProfRoleError(null); setProfRegError(null); setClientNameError(null);
    }
  }, [planIdToEdit, initialClientInputs, initialPlanDataToEdit, user, isEditingExistingPlan, form]);


  async function onGenerateSubmit(values: ClientPersonalizedPlanInputValues) {
    setIsLoadingAi(true);
    setGeneratedPlanOutput(null);
    setEditablePlanDetails(null);
    setError(null);

    const apiValues: PersonalizedPlanInput = {
        ...values,
        professionalRegistration: values.professionalRegistration || undefined, // Ensure Zod optional string is not empty
        heightCm: values.heightCm ? Number(values.heightCm) : undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        age: values.age ? Number(values.age) : undefined,
        sex: (values.sex === "" || values.sex === "prefer_not_to_say")
             ? undefined
             : values.sex as "male" | "female" | undefined,
        dietaryPreferences: values.dietaryPreferences || undefined, // Ensure Zod optional string
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
      toast({ title: "Erro na Geração IA", description: errorMessage, variant: "destructive" });
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
    
    const planDataContent = editablePlanDetails || initialPlanDataToEdit; // Use edits, or original if no edits but plan was loaded
    if (!planDataContent) {
        toast({ title: "Nenhum plano para salvar", description: "Gere um plano base primeiro ou carregue um para edição. O conteúdo do plano está vazio.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    let finalOriginalInputs: ClientPersonalizedPlanInputValues;

    if (isEditingExistingPlan && initialClientInputs) {
        // Manual validation for the three editable fields in edit mode
        let manualValidationOk = true;
        setProfRoleError(null); setProfRegError(null); setClientNameError(null);

        if (!editableProfessionalRole) {
            setProfRoleError("Área de atuação é obrigatória."); manualValidationOk = false;
        }
        if (!editableProfessionalRegistration || editableProfessionalRegistration.trim().length < 3) {
            setProfRegError("Registro profissional é obrigatório (mín. 3 caracteres)."); manualValidationOk = false;
        }
        if (!editableClientName || editableClientName.trim().length < 2) {
            setClientNameError("Nome do cliente é obrigatório (mín. 2 caracteres)."); manualValidationOk = false;
        }

        if (!manualValidationOk) {
            toast({ title: "Erro de Validação", description: "Corrija os dados do profissional/cliente antes de salvar.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        // Construct finalOriginalInputs using initialClientInputs as base, then override with local editable state for the 3 fields
        finalOriginalInputs = {
            ...(initialClientInputs as ClientPersonalizedPlanInputValues), // Base
            professionalRole: editableProfessionalRole!,
            professionalRegistration: editableProfessionalRegistration.trim(),
            clientName: editableClientName.trim(),
        };
    } else { // Creating a new plan, validate the full RHF form
        const isValid = await form.trigger(); // Validate all RHF fields

        if (!isValid) {
            toast({ title: "Erro de Validação", description: "Por favor, corrija os erros no formulário de dados do cliente antes de salvar.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        finalOriginalInputs = form.getValues(); // All values from RHF
    }
    
    // Sanitize all inputs that will be saved to originalInputs
    const sanitizedInputs: Partial<ClientPersonalizedPlanInputValues> = {};
    (Object.keys(ClientPersonalizedPlanInputSchema.shape) as Array<keyof ClientPersonalizedPlanInputValues>).forEach(key => {
        let value = finalOriginalInputs[key];
        let valueToSave: any;

        if (value === undefined) {
            valueToSave = null;
        } else if (typeof value === 'string') {
            if ((key === 'professionalRegistration' || key === 'dietaryPreferences') && value.trim() === "") {
                 valueToSave = null;
            } else if (key === 'sex' && (value.trim() === "" || value.trim() === "prefer_not_to_say")) {
                 valueToSave = null;
            } else if ((key === 'heightCm' || key === 'weightKg' || key === 'age') && value.trim() === "") {
                 valueToSave = null; 
            } else {
                 valueToSave = value;
            }
        } else { // Numbers, enums (already validated by Zod or manual check)
            valueToSave = value;
        }
        
        if (key === 'heightCm' || key === 'weightKg' || key === 'age') {
            if (valueToSave === null || valueToSave === undefined || String(valueToSave).trim() === '') { // Check for empty string too
                valueToSave = null;
            } else {
                const numVal = Number(valueToSave);
                valueToSave = isNaN(numVal) ? null : numVal;
            }
        }
        (sanitizedInputs as any)[key] = valueToSave;
    });
    
    const finalOriginalInputsToSave = sanitizedInputs as ClientPersonalizedPlanInputValues;

    // Critical checks AFTER sanitization for required fields
    const requiredFieldsForSave: Array<keyof ClientPersonalizedPlanInputValues> = ['professionalRole', 'professionalRegistration', 'clientName'];
    if (!isEditingExistingPlan) { // For new plans, these are also required as per Zod schema
        requiredFieldsForSave.push('goalPhase', 'trainingExperience', 'availableEquipment', 'trainingFrequency', 'trainingVolumePreference');
    }

    for (const field of requiredFieldsForSave) {
      const fieldValue = finalOriginalInputsToSave[field];
      // Check for null, undefined, or empty string for string fields after sanitization
      const isMissing = fieldValue === null || fieldValue === undefined || (typeof fieldValue === 'string' && fieldValue.trim() === "");
      if (isMissing) {
          toast({ title: "Dados Faltando", description: `O campo '${ClientPersonalizedPlanInputSchema.shape[field]?.description || field}' é obrigatório e não foi preenchido corretamente.`, variant: "destructive" });
          setIsSaving(false);
          return;
      }
    }
    
    const dataToSave: Omit<ClientPlan, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      planData: planDataContent,
      originalInputs: finalOriginalInputsToSave,
      professionalId: user.id,
      professionalRegistration: finalOriginalInputsToSave.professionalRegistration!,
      clientName: finalOriginalInputsToSave.clientName!,
      goalPhase: finalOriginalInputsToSave.goalPhase!,
      trainingFrequency: finalOriginalInputsToSave.trainingFrequency!,
      updatedAt: serverTimestamp(),
    };

    try {
      if (planIdToEdit) {
        const planRef = doc(db, "userGeneratedPlans", user.id, "plans", planIdToEdit);
        await updateDoc(planRef, dataToSave);
        toast({
          title: "Plano Atualizado!",
          description: `O plano para ${finalOriginalInputsToSave.clientName} foi atualizado com sucesso.`,
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
          description: `O plano base para ${finalOriginalInputsToSave.clientName} foi salvo. Você pode gerenciá-lo em "Planos Salvos".`,
          action: (
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/my-ai-plan?planId=${newPlanRef.id}`)}>
              Ver Plano Salvo
            </Button>
          ),
        });
        // Reset RHF form and local state after successful save of a NEW plan
        const defaultNewPlanInputs: ClientPersonalizedPlanInputValues = {
            professionalRole: user?.professionalType || undefined, professionalRegistration: user?.professionalRegistration || "", clientName: "",
            goalPhase: undefined, trainingExperience: undefined, trainingFrequency: 3, trainingVolumePreference: "medium", availableEquipment: "",
            heightCm: '', weightKg: '', age: '', sex: "prefer_not_to_say", dietaryPreferences: "",
        };
        form.reset(defaultNewPlanInputs);
        setGeneratedPlanOutput(null);
        setEditablePlanDetails(null);
        setEditableProfessionalRole(user?.professionalType || undefined);
        setEditableProfessionalRegistration(user?.professionalRegistration || "");
        setEditableClientName("");
        setProfRoleError(null); setProfRegError(null); setClientNameError(null);
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

  const clientInfoSectionTitle = isEditingExistingPlan
    ? `Editando Plano de ${editableClientName || initialClientInputs?.clientName || 'Cliente'}`
    : "Gerar Plano Base para Cliente";

  return (
    <div className="space-y-8">
      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="flex items-center text-2xl">
            <Wand2 className="mr-2 h-6 w-6 text-primary print:hidden" />
            {clientInfoSectionTitle}
          </CardTitle>
           <ShadCnCardDescription className="print:hidden">
             {isEditingExistingPlan
              ? `Ajuste os detalhes do plano abaixo. Os dados originais do cliente e profissional são mantidos, apenas o nome do cliente e seu registro podem ser atualizados aqui.`
              : `Profissional, preencha os dados do seu cliente abaixo. A IA criará um rascunho inicial que você poderá editar antes de salvar.`
            }
          </ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          {!isEditingExistingPlan ? (
            // FULL FORM FOR CREATING NEW PLAN (Uses react-hook-form)
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
                          <Input type="number" placeholder="Ex: 3 (2-6 dias)" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} value={String(field.value || 3)} />
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
                <Button type="button" onClick={form.handleSubmit(onGenerateSubmit)} className="w-full md:w-auto print:hidden" disabled={isLoadingAi || isSaving}>
                  {isLoadingAi ? (
                    <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Rascunho com IA... </>
                  ) : (
                    <> <Wand2 className="mr-2 h-4 w-4" /> {(editablePlanDetails || generatedPlanOutput) ? "Gerar Novo Rascunho (Substituirá Edições Atuais)" : "Gerar Rascunho com IA"} </>
                  )}
                </Button>
              </form>
            </Form>
          ) : ( 
            // SIMPLIFIED DISPLAY FOR EDITING EXISTING PLAN
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Dados Principais (Editáveis)</h3>
                 <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="editProfessionalRole">Sua Principal Área de Atuação</Label>
                        <Select
                            onValueChange={(value) => {
                                setEditableProfessionalRole(value as any);
                                if (value) setProfRoleError(null);
                            }}
                            value={editableProfessionalRole || undefined}
                            name="editProfessionalRole"
                            id="editProfessionalRole"
                        >
                            <SelectTrigger className={profRoleError ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione sua área" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="physical_educator">Educador Físico (Foco em Treino)</SelectItem>
                            <SelectItem value="nutritionist">Nutricionista (Foco em Dieta)</SelectItem>
                            <SelectItem value="both">Ambos (Educador Físico e Nutricionista)</SelectItem>
                            </SelectContent>
                        </Select>
                        {profRoleError && <p className="text-sm text-destructive mt-1">{profRoleError}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="editProfessionalRegistration">Seu Registro Profissional (CREF/CFN)</Label>
                        <Input
                            id="editProfessionalRegistration"
                            placeholder="Ex: 012345-G/SP ou CRN-3 12345"
                            value={editableProfessionalRegistration || ""}
                            onChange={(e) => {
                                setEditableProfessionalRegistration(e.target.value);
                                if (e.target.value.trim().length >= 3) setProfRegError(null);
                            }}
                            className={profRegError ? "border-destructive" : ""}
                        />
                        {profRegError && <p className="text-sm text-destructive mt-1">{profRegError}</p>}
                    </div>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="editClientName">Nome do Cliente</Label>
                  <Input
                      id="editClientName"
                      placeholder="Nome completo do cliente"
                      value={editableClientName || ""}
                      onChange={(e) => {
                          setEditableClientName(e.target.value);
                          if (e.target.value.trim().length >=2) setClientNameError(null);
                      }}
                      className={clientNameError ? "border-destructive" : ""}
                  />
                  {clientNameError && <p className="text-sm text-destructive mt-1">{clientNameError}</p>}
                </div>
              </div>
              {initialClientInputs && (
                <Card className="bg-muted/30 p-4 print:border-none print:shadow-none print:p-0">
                    <CardHeader className="p-2 pt-0 print:hidden"><CardTitle className="text-base">Resumo dos Inputs Originais (Não Editável Nesta Tela)</CardTitle></CardHeader>
                    <CardContent className="p-2 text-sm space-y-1 print:p-0 print:text-xs">
                        <p><strong>Objetivo:</strong> {initialClientInputs.goalPhase}</p>
                        <p><strong>Experiência:</strong> {initialClientInputs.trainingExperience}</p>
                        <p><strong>Frequência Treino:</strong> {initialClientInputs.trainingFrequency} dias/semana</p>
                        <p><strong>Volume:</strong> {initialClientInputs.trainingVolumePreference}</p>
                        <p><strong>Equipamento:</strong> {initialClientInputs.availableEquipment}</p>
                         {initialClientInputs.heightCm && <p><strong>Altura:</strong> {initialClientInputs.heightCm} cm</p>}
                         {initialClientInputs.weightKg && <p><strong>Peso:</strong> {initialClientInputs.weightKg} kg</p>}
                         {initialClientInputs.age && <p><strong>Idade:</strong> {initialClientInputs.age} anos</p>}
                         {initialClientInputs.sex && initialClientInputs.sex !== "prefer_not_to_say" && initialClientInputs.sex !== "" && <p><strong>Sexo:</strong> {initialClientInputs.sex}</p>}
                         {initialClientInputs.dietaryPreferences && <p><strong>Preferências Alimentares:</strong> {initialClientInputs.dietaryPreferences}</p>}
                    </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && !isEditingExistingPlan && !editablePlanDetails && !generatedPlanOutput && (
        <Card className="border-destructive bg-destructive/10 shadow-lg print:hidden">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao Gerar Rascunho</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Por favor, verifique os dados fornecidos ou tente novamente mais tarde. Se o erro persistir, pode ser uma instabilidade temporária no serviço de IA.</p>
          </CardContent>
        </Card>
      )}

      {/* Plan Details Editing Section - Common for both modes after generation/loading */}
      {editablePlanDetails ? (
        <div className="space-y-6 mt-8">
            <Card className="shadow-lg sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:shadow-none print:border-none print:sticky-auto print:top-auto print:z-auto">
                <CardHeader className="print:border-b print:pb-2">
                    <CardTitle className="text-xl text-primary">
                    Detalhes {isEditingExistingPlan ? 'Editáveis do Plano' : 'do Rascunho'} para: <span className="font-semibold">{isEditingExistingPlan ? (editableClientName || initialClientInputs?.clientName) : (form.getValues('clientName') || 'Cliente')}</span>
                    </CardTitle>
                    <ShadCnCardDescription className="print:hidden">
                    Abaixo estão os detalhes. Revise e edite conforme necessário.
                    Seu registro profissional ({isEditingExistingPlan ? (editableProfessionalRegistration || initialClientInputs?.professionalRegistration) : (form.getValues('professionalRegistration') || 'N/A')}) será associado a este plano.
                    </ShadCnCardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row gap-4 print:hidden">
                    <Button onClick={handleSavePlan} disabled={isSaving || !user || isLoadingAi} className="w-full sm:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {user ? (isEditingExistingPlan ? "Salvar Alterações no Plano" : "Salvar Plano para Cliente") : "Faça login para Salvar"}
                    </Button>
                     <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> Exportar para PDF
                    </Button>
                </CardFooter>
            </Card>

            <Card className="shadow-lg print:shadow-none print:border-none js-omit-from-print">
                <CardHeader><CardTitle className="text-lg">Resumo Geral (Editável)</CardTitle></CardHeader>
                <CardContent>
                {renderTextInput(editablePlanDetails?.overallSummary, 'overallSummary', 'Resumo geral do plano...', true, 4)}
                </CardContent>
            </Card>

            { (editablePlanDetails?.trainingPlan) && (
                <Card className="shadow-lg print:shadow-none print:border-none">
                <CardHeader>
                    <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary" /> Plano de Treino (Editável)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label className="text-sm font-medium">Descrição da Divisão Semanal</Label>
                    {renderTextInput(editablePlanDetails?.trainingPlan?.weeklySplitDescription, 'trainingPlan.weeklySplitDescription', 'Ex: Divisão ABCDE...', true)}
                    </div>
                    <div>
                    <Label className="text-sm font-medium">Resumo do Volume Semanal</Label>
                    {renderTextInput(editablePlanDetails?.trainingPlan?.weeklyVolumeSummary, 'trainingPlan.weeklyVolumeSummary', 'Ex: Aprox. 15 séries por grupo...', true)}
                    </div>

                    {(editablePlanDetails?.trainingPlan?.workouts)?.map((workoutDay, dayIndex) => (
                    <Card key={dayIndex} className="p-4 border bg-muted/30 print:bg-transparent print:border-muted">
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
                        <Card key={exIndex} className="p-3 mb-3 bg-background print:bg-transparent">
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
                    {renderTextInput(editablePlanDetails?.trainingPlan?.notes, 'trainingPlan.notes', 'Notas gerais sobre o treino...', true)}
                    </div>
                </CardContent>
                </Card>
            )}

            {(editablePlanDetails?.dietGuidance) && (
                <Card className="shadow-lg print:shadow-none print:border-none">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Utensils className="mr-2 h-5 w-5 text-primary" />
                        Diretrizes de Dieta (Editável - {isEditingExistingPlan ? (initialClientInputs?.goalPhase) : form.getValues('goalPhase')})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label className="text-xs font-medium">Calorias Diárias Est.</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.estimatedDailyCalories, 'dietGuidance.estimatedDailyCalories', 'Ex: 2500')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Proteínas (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.proteinGrams, 'dietGuidance.proteinGrams', 'Ex: 180')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Carboidratos (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.carbGrams, 'dietGuidance.carbGrams', 'Ex: 300')}
                    </div>
                    <div>
                        <Label className="text-xs font-medium">Gorduras (g)</Label>
                        {renderNumberInput(editablePlanDetails?.dietGuidance?.fatGrams, 'dietGuidance.fatGrams', 'Ex: 70')}
                    </div>
                    </div>

                    {(editablePlanDetails?.dietGuidance?.dailyMealPlans)?.map((mealPlan, mealPlanIndex) => (
                    <Card key={mealPlanIndex} className="p-4 border bg-muted/30 print:bg-transparent print:border-muted">
                        <div>
                        <Label className="text-sm font-semibold">Nome da Refeição</Label>
                        {renderTextInput(mealPlan.mealName, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealName`, 'Ex: Café da Manhã')}
                        </div>
                        <Label className="text-sm font-semibold mt-3 mb-2 block">Opções de Refeição:</Label>
                        {mealPlan.mealOptions.map((option, optionIndex) => (
                        <Card key={optionIndex} className="p-3 mb-3 bg-background print:bg-transparent">
                            <div>
                            <Label className="text-xs">Descrição da Opção (Opcional)</Label>
                            {renderTextInput(option.optionDescription, `dietGuidance.dailyMealPlans.${mealPlanIndex}.mealOptions.${optionIndex}.optionDescription`, 'Ex: Alto em proteína', true, 1)}
                            </div>
                            <Label className="text-sm font-medium mt-2 mb-1 block">Itens:</Label>
                            {option.items.map((foodItem, itemIndex) => (
                            <div key={itemIndex} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-2 border-b border-dashed pb-1 last:border-b-0 last:pb-0 print:border-muted">
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
                    {renderTextInput(editablePlanDetails?.dietGuidance?.notes, 'dietGuidance.notes', 'Notas sobre hidratação, suplementos...', true)}
                    </div>
                </CardContent>
                </Card>
            )}
            <Card className="bg-secondary/50 border-dashed print:hidden">
                <CardHeader>
                <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Lembrete Profissional</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {isEditingExistingPlan ? (
                        <p>Este é o plano carregado para {editableClientName || initialClientInputs?.clientName}. Ajuste-o e adicione suas considerações profissionais. Para criar um novo plano base para outro cliente, vá para "Gerar Novo Plano Cliente" no menu lateral.</p>
                    ) : (
                        <p>Este é o rascunho gerado pela IA. Revise e edite os detalhes. Após salvar, você poderá encontrá-lo em "Planos Salvos".</p>
                    )}
                </CardContent>
            </Card>
        </div>
      ) : null}
    </div>
  );
}

