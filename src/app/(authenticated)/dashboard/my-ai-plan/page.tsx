
"use client";

import { useState, useEffect, Suspense } from "react";
import type { PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, orderBy, limit, deleteDoc, DocumentData } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Dumbbell, Utensils, Wand2, Info, Edit, Trash2, FileText, Eye, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";
import { APP_NAME } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ClientPlan } from "@/types";


function MyAiPlanPageContent() {
  const { user, loading: authLoading, isPro, isTrialing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get("planId");
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<ClientPlan | null>(null);
  const [userPlans, setUserPlans] = useState<ClientPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const canAccessFeatures = isPro || isTrialing;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Você precisa estar logado para ver os planos.");
      setIsLoading(false);
      return;
    }
    
    if (!canAccessFeatures) {
      setIsLoading(false);
      return; 
    }

    const fetchPlansAndSelected = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const plansCollectionRef = collection(db, "userGeneratedPlans", user.id, "plans");
        const q = query(plansCollectionRef, orderBy("createdAt", "desc"));
        const plansSnapshot = await getDocs(q);
        
        const fetchedPlans: ClientPlan[] = plansSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ClientPlan, 'id'>)
        }));
        setUserPlans(fetchedPlans);

        if (planIdFromQuery) {
          const planDocRef = doc(db, "userGeneratedPlans", user.id, "plans", planIdFromQuery);
          const planSnap = await getDoc(planDocRef);
          if (planSnap.exists()) {
            setSelectedPlan({ id: planSnap.id, ...(planSnap.data() as Omit<ClientPlan, 'id'>) });
          } else {
            setError(`Plano com ID ${planIdFromQuery} não encontrado.`);
            setSelectedPlan(null);
          }
        } else if (fetchedPlans.length > 0) {
          setSelectedPlan(fetchedPlans[0]);
          router.replace(`/dashboard/my-ai-plan?planId=${fetchedPlans[0].id}`, { scroll: false });
        } else {
          setSelectedPlan(null); 
        }

      } catch (err: any) {
        console.error("Erro ao buscar planos:", err);
        setError("Falha ao carregar os planos. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlansAndSelected();
  }, [user, authLoading, planIdFromQuery, router, canAccessFeatures]);

  const handleExportPdf = async (planId: string) => {
    if (!planId) return;
    setIsExportingPdf(true);
    toast({ title: "Gerando PDF...", description: "Criando o PDF para você enviar ao aluno. Isso pode levar alguns segundos." });

    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, userId: user?.id }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao gerar o PDF no servidor.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `Plano - ${selectedPlan?.clientName || 'Cliente'}.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch.length > 1) {
                filename = filenameMatch[1];
            }
        }
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast({ title: "PDF Gerado com Sucesso!", description: "O download do seu PDF foi iniciado." });

    } catch (error: any) {
        console.error("Erro ao exportar PDF:", error);
        toast({
            title: "Erro ao Gerar PDF",
            description: error.message || "Não foi possível gerar o PDF. Tente novamente ou contate o suporte.",
            variant: "destructive",
        });
    } finally {
        setIsExportingPdf(false);
    }
  };


  const handleDeletePlan = async (planIdToDelete: string) => {
    if (!user?.id || !planIdToDelete) return;
    setDeletingPlanId(planIdToDelete);
    try {
      await deleteDoc(doc(db, "userGeneratedPlans", user.id, "plans", planIdToDelete));
      toast({ title: "Plano Deletado", description: "O plano do cliente foi removido com sucesso." });
      
      const updatedPlans = userPlans.filter(p => p.id !== planIdToDelete);
      setUserPlans(updatedPlans);
      
      if (selectedPlan?.id === planIdToDelete) { 
        if (updatedPlans.length > 0) {
          setSelectedPlan(updatedPlans[0]);
          router.replace(`/dashboard/my-ai-plan?planId=${updatedPlans[0].id}`, { scroll: false });
        } else {
          setSelectedPlan(null);
          router.replace('/dashboard/my-ai-plan', { scroll: false }); 
        }
      }
    } catch (err: any) {
      console.error("Erro ao deletar plano:", err);
      toast({ title: "Erro ao Deletar", description: "Não foi possível remover o plano. Tente novamente.", variant: "destructive" });
    } finally {
      setDeletingPlanId(null);
    }
  };

  if (authLoading || (isLoading && userPlans.length === 0 && !planIdFromQuery)) { 
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seus planos...</p>
      </div>
    );
  }
  
  if (!canAccessFeatures && !authLoading) {
    return <SubscriptionRequiredBlock featureName="seus Planos Salvos de Clientes" />;
  }

  const planDisplayDate = selectedPlan?.createdAt?.toDate ? 
    new Date(selectedPlan.createdAt.toDate()).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) + 
    " às " + 
    new Date(selectedPlan.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : "Data indisponível";

  const PlanContent = () => {
    if (isLoading && planIdFromQuery && !selectedPlan) { 
         return (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando plano detalhado...</p>
            </div>
        );
    }

    if (!selectedPlan && !isLoading) {
      return (
         <div className="space-y-8 print:hidden">
            <Card className="text-center py-12 shadow-lg border-muted">
              <CardHeader>
                <CardTitle className="mt-6 text-2xl font-semibold">Nenhum Plano de Cliente Encontrado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">{error || "Você ainda não salvou nenhum plano para seus clientes."}</p>
                <Button asChild>
                  <Link href="/dashboard/personalized-plan">
                    <Wand2 className="mr-2 h-5 w-5" /> Gerar Plano Base para Cliente
                  </Link>
                </Button>
              </CardContent>
            </Card>
        </div>
      );
    }
    if (!selectedPlan) return null; 

    const { planData, clientName, professionalRegistration, goalPhase, trainingFrequency, createdAt } = selectedPlan;

    return (
      <div className="space-y-8 printable-plan-area">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-b print:pb-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Plano Detalhado: {clientName}</h1>
                <p className="text-muted-foreground">
                Gerado em: {planDisplayDate} | Objetivo: <span className="capitalize">{goalPhase}</span> | Dias de Treino: {trainingFrequency}
                {professionalRegistration && ` | Resp. Técnico: ${professionalRegistration}`}
                </p>
            </div>
            <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={() => router.push(`/dashboard/personalized-plan?planIdToEdit=${selectedPlan.id}`)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar Plano
                </Button>
                 <Button variant="outline" onClick={() => handleExportPdf(selectedPlan.id)} disabled={isExportingPdf}>
                    {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}
                </Button>
            </div>
          </div>

          {planData.trainingPlan && (
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-xl text-primary">
                          <Dumbbell className="inline-block mr-2 h-5 w-5" /> Plano de Treino (Base IA)
                      </CardTitle>
                      <CardDescription>
                          {planData.trainingPlan.weeklySplitDescription}
                          <br />
                          {planData.trainingPlan.weeklyVolumeSummary}
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {planData.trainingPlan.workouts?.map((workoutDay, dayIndex) => (
                          <div key={dayIndex} className="border-t pt-4 first:border-t-0 first:pt-0 print:border-muted">
                              <h3 className="text-lg font-semibold mb-2 text-foreground">{workoutDay.day} {workoutDay.focus ? `(${workoutDay.focus})` : ''}</h3>
                              <ul className="space-y-2 list-disc list-inside pl-2 text-sm">
                                  {workoutDay.exercises?.map((ex, exIndex) => (
                                      <li key={exIndex} className="mb-1">
                                          <strong className="font-medium">{ex.name}:</strong> {ex.sets} séries de {ex.reps} reps.
                                          {ex.restSeconds && <span className="text-muted-foreground"> Descanso: {ex.restSeconds / 60} min.</span>}
                                          {ex.notes && <p className="block text-xs text-muted-foreground italic pl-5">- {ex.notes}</p>}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ))}
                      {planData.trainingPlan.notes && <p className="mt-6 text-sm text-muted-foreground italic border-t pt-4 print:border-muted"><strong>Notas Gerais do Treino (Base IA):</strong> {planData.trainingPlan.notes}</p>}
                  </CardContent>
              </Card>
          )}

          {planData.dietGuidance && (
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="text-xl text-primary">
                          <Utensils className="inline-block mr-2 h-5 w-5" /> Diretrizes de Dieta (Base IA - {goalPhase})
                      </CardTitle>
                          <CardDescription>Metas Diárias Estimadas (Base IA): ~{planData.dietGuidance.estimatedDailyCalories} kcal | Proteínas: {planData.dietGuidance.proteinGrams}g | Carboidratos: {planData.dietGuidance.carbGrams}g | Gorduras: {planData.dietGuidance.fatGrams}g</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {planData.dietGuidance.dailyMealPlans?.map((mealPlan, mealPlanIndex) => (
                      <div key={mealPlanIndex} className="border-t pt-4 first:border-t-0 first:pt-0 print:border-muted">
                          <h4 className="text-lg font-semibold mb-3 text-foreground">{mealPlan.mealName}</h4>
                          {mealPlan.mealOptions?.map((option, optionIndex) => (
                          <div key={optionIndex} className="mb-4 pl-4 border-l-2 border-primary/30 print:border-muted">
                              <p className="text-sm font-medium text-primary mb-1">Opção {optionIndex + 1}{option.optionDescription ? `: ${option.optionDescription}` : ''}</p>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {option.items?.map((foodItem, foodItemIndex) => (
                                  <li key={foodItemIndex}>
                                  {foodItem.foodName}: <span className="font-medium text-foreground/80">{foodItem.quantity}</span>
                                  </li>
                              ))}
                              </ul>
                          </div>
                          ))}
                      </div>
                      ))}
                      {planData.dietGuidance.notes && <p className="mt-4 text-sm text-muted-foreground italic border-t pt-4 print:border-muted"><strong>Notas Gerais da Dieta (Base IA):</strong> {planData.dietGuidance.notes}</p>}
                  </CardContent>
              </Card>
          )}
          
          {planData.overallSummary && (
              <Card className="shadow-lg js-omit-from-print">
                  <CardHeader>
                      <CardTitle className="text-xl text-primary">Resumo Geral do Plano (Base IA)</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                      <ReactMarkdown>{planData.overallSummary}</ReactMarkdown>
                  </CardContent>
              </Card>
          )}
          <Card className="bg-secondary/50 border-dashed print:hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Lembrete Profissional</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Este é o plano base gerado pela IA para o cliente {clientName}. Use o botão "Editar Plano" para ajustá-lo e adicionar suas considerações profissionais antes de exportar ou compartilhar.</p>
              <p className="mt-2">Para criar um novo plano base para outro cliente, vá para "Gerar Novo Plano Cliente".</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="default">
                <Link href="/dashboard/personalized-plan">
                  <Wand2 className="mr-2 h-5 w-5" /> Gerar Novo Plano Cliente
                </Link>
              </Button>
            </CardFooter>
          </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-1/4 xl:w-1/5 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5" /> Planos de Clientes Salvos</CardTitle>
            <CardDescription>{userPlans.length} plano(s) salvo(s).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {isLoading && userPlans.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                Carregando...
              </div>
            )}
            {!isLoading && userPlans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano salvo ainda.</p>
            )}
            {userPlans.map(plan => (
              <div key={plan.id} className={`p-3 rounded-md border ${selectedPlan?.id === plan.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/dashboard/my-ai-plan?planId=${plan.id}`} scroll={false}>
                      <h4 className={`font-semibold hover:underline ${selectedPlan?.id === plan.id ? 'text-primary' : ''}`}>{plan.clientName || "Cliente"}</h4>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Salvo em: {plan.createdAt?.toDate ? new Date(plan.createdAt.toDate()).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 print:hidden" disabled={deletingPlanId === plan.id}>
                        {deletingPlanId === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o plano de "{plan.clientName || 'este cliente'}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive hover:bg-destructive/90">
                          Excluir Plano
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full text-xs print:hidden" 
                  onClick={() => router.push(`/dashboard/my-ai-plan?planId=${plan.id}`)}
                >
                  <Eye className="mr-1.5 h-3 w-3"/> Ver Detalhes
                </Button>
              </div>
            ))}
          </CardContent>
          <CardFooter className="print:hidden">
             <Button asChild variant="default" className="w-full mt-2">
                <Link href="/dashboard/personalized-plan">
                    <Wand2 className="mr-2 h-4 w-4" /> Gerar Novo Plano
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </aside>
      <main className="flex-1">
        <PlanContent />
      </main>
    </div>
  );
}


export default function MyAiPlanPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando página de planos...</p>
      </div>
    }>
      <MyAiPlanPageContent />
    </Suspense>
  );
}
