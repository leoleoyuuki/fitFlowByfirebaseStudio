
"use client";

import { useState, useEffect } from "react";
import type { PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Dumbbell, Utensils, Wand2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

export default function MyAiPlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [planData, setPlanData] = useState<{ latestPlan: PersonalizedPlanOutput, goalPhase: string, trainingFrequency: number, savedAt: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const fetchPlan = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const planRef = doc(db, "userGeneratedPlans", user.id);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            setPlanData(planSnap.data() as { latestPlan: PersonalizedPlanOutput, goalPhase: string, trainingFrequency: number, savedAt: any });
          } else {
            setError("Nenhum plano salvo encontrado. Gere um novo plano.");
            setPlanData(null);
          }
        } catch (err: any) {
          console.error("Error fetching plan details:", err);
          setError("Falha ao carregar os detalhes do plano. Tente novamente.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlan();
    } else if (!user && !isLoading) { // if loading is false and there's no user, they are likely logged out
        setError("Você precisa estar logado para ver seu plano.");
        setIsLoading(false);
    }
  }, [user, isLoading]); // Add isLoading to dependency array to refetch if user logs in while on page.

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seu plano detalhado...</p>
      </div>
    );
  }

  if (error || !planData?.latestPlan) {
     return (
        <div className="space-y-8">
             <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Card className="text-center py-12 shadow-lg border-destructive">
            <CardHeader>
                <CardTitle className="mt-6 text-2xl font-semibold text-destructive">{error ? "Erro ao Carregar Plano" : "Nenhum Plano Encontrado"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">{error || "Não encontramos um plano salvo para você."}</p>
                <Button asChild>
                <Link href="/dashboard/personalized-plan">
                    <Wand2 className="mr-2 h-5 w-5" /> Gerar Plano com IA
                </Link>
                </Button>
            </CardContent>
            </Card>
        </div>
     );
  }
  
  const { latestPlan, goalPhase, trainingFrequency, savedAt } = planData;
  const planDisplayDate = savedAt?.toDate ? 
    new Date(savedAt.toDate()).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) + 
    " às " + 
    new Date(savedAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : "Data indisponível";

  return (
    <div className="space-y-8">
        <div>
            <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Visão Geral
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Seu Plano de Hipertrofia Detalhado</h1>
            <p className="text-muted-foreground">Gerado em: {planDisplayDate} | Objetivo: <span className="capitalize">{goalPhase}</span> | Dias de Treino: {trainingFrequency}</p>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary">
                    <Dumbbell className="inline-block mr-2 h-5 w-5" /> Plano de Treino
                </CardTitle>
                <CardDescription>
                    {latestPlan.trainingPlan.weeklySplitDescription}
                    <br />
                    {latestPlan.trainingPlan.weeklyVolumeSummary}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {latestPlan.trainingPlan.workouts.map((workoutDay, dayIndex) => (
                    <div key={dayIndex} className="border-t pt-4 first:border-t-0 first:pt-0">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">{workoutDay.day} {workoutDay.focus ? `(${workoutDay.focus})` : ''}</h3>
                        <ul className="space-y-2 list-disc list-inside pl-2 text-sm">
                            {workoutDay.exercises.map((ex, exIndex) => (
                                <li key={exIndex} className="mb-1">
                                    <strong className="font-medium">{ex.name}:</strong> {ex.sets} séries de {ex.reps} reps.
                                    {ex.restSeconds && <span className="text-muted-foreground"> Descanso: {ex.restSeconds}s.</span>}
                                    {ex.tempo && <span className="text-muted-foreground"> Cadência: {ex.tempo}.</span>}
                                    {ex.notes && <p className="block text-xs text-muted-foreground italic pl-5">- {ex.notes}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                {latestPlan.trainingPlan.notes && <p className="mt-6 text-sm text-muted-foreground italic border-t pt-4"><strong>Notas Gerais do Treino:</strong> {latestPlan.trainingPlan.notes}</p>}
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary">
                    <Utensils className="inline-block mr-2 h-5 w-5" /> Diretrizes de Dieta ({goalPhase})
                </CardTitle>
                    <CardDescription>Metas Diárias Estimadas: ~{latestPlan.dietGuidance.estimatedDailyCalories} kcal | Proteínas: {latestPlan.dietGuidance.proteinGrams}g | Carboidratos: {latestPlan.dietGuidance.carbGrams}g | Gorduras: {latestPlan.dietGuidance.fatGrams}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {latestPlan.dietGuidance.mealStructureExamples && latestPlan.dietGuidance.mealStructureExamples.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-foreground">Exemplos de Estrutura de Refeições:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {latestPlan.dietGuidance.mealStructureExamples.map((meal, mealIndex) => (
                                <li key={mealIndex}>{meal}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {latestPlan.dietGuidance.brazilianFoodSuggestions && latestPlan.dietGuidance.brazilianFoodSuggestions.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-foreground">Sugestões de Alimentos Brasileiros Comuns:</h4>
                        {latestPlan.dietGuidance.brazilianFoodSuggestions.map((categoryItem, catIndex) =>(
                            <div key={catIndex} className="mb-3">
                                <p className="text-sm font-medium text-foreground">{categoryItem.category}:</p>
                                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                                    {categoryItem.suggestions.map((food, foodIndex) => (
                                        <li key={foodIndex}>{food}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
                {latestPlan.dietGuidance.notes && <p className="mt-4 text-sm text-muted-foreground italic border-t pt-4"><strong>Notas Gerais da Dieta:</strong> {latestPlan.dietGuidance.notes}</p>}
            </CardContent>
        </Card>
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-primary">Resumo Geral do Plano</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground">
                <ReactMarkdown>{latestPlan.overallSummary}</ReactMarkdown>
            </CardContent>
        </Card>
         <Card className="bg-secondary/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Lembrete</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Este é o seu plano mais recente gerado e salvo. Para criar um plano diferente, vá para o Gerador de Planos com IA.</p>
          </CardContent>
          <CardFooter>
             <Button asChild variant="default">
              <Link href="/dashboard/personalized-plan">
                <Wand2 className="mr-2 h-5 w-5" /> Ir para Gerador de Planos
              </Link>
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}
