
"use client"; 

import { useState, useEffect } from "react";
import type { PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Dumbbell, Wand2, ClipboardX, Eye, Info, Gift } from "lucide-react";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedPlanData, setSavedPlanData] = useState<{ latestPlan: PersonalizedPlanOutput, goalPhase: string, trainingFrequency: number, savedAt: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active';

  useEffect(() => {
    if (authLoading) return; // Wait for auth context to load

    if (!user) {
      setIsLoading(false); // Not logged in, not loading a plan
      setSavedPlanData(null);
      return;
    }

    if (!isSubscribed) {
        setIsLoading(false); // Not subscribed, not loading a plan
        setSavedPlanData(null);
        return;
    }

    if (user?.id) {
      const fetchPlan = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const planRef = doc(db, "userGeneratedPlans", user.id);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            setSavedPlanData(planSnap.data() as { latestPlan: PersonalizedPlanOutput, goalPhase: string, trainingFrequency: number, savedAt: any });
          } else {
            setSavedPlanData(null); // No plan found for this user
          }
        } catch (err: any) {
          console.error("Error fetching plan:", err);
          setError("Falha ao carregar o plano. Tente novamente.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlan();
    } else {
      setIsLoading(false); 
      setSavedPlanData(null); 
    }
  }, [user, authLoading, isSubscribed]);

  if (authLoading || (isLoading && isSubscribed) ) { // Only show main loader if expecting to load a plan
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seu plano...</p>
      </div>
    );
  }

  if (!isSubscribed && !authLoading) {
    return <SubscriptionRequiredBlock featureName="acessar seus Planos de Treino e Dieta salvos" />;
  }

  if (error) {
     return (
        <Card className="text-center py-12 shadow-lg border-destructive">
          <CardHeader>
            <ClipboardX className="mx-auto h-16 w-16 text-destructive" />
            <CardTitle className="mt-6 text-2xl font-semibold text-destructive">Erro ao Carregar Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
          </CardContent>
        </Card>
     );
  }
  
  const planDisplayDate = savedPlanData?.savedAt?.toDate ? 
    new Date(savedPlanData.savedAt.toDate()).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) + 
    " às " + 
    new Date(savedPlanData.savedAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : "Data indisponível";


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Dumbbell className="mr-3 h-8 w-8 text-primary" /> Meu Plano de Treino e Dieta (IA)</h1>
        <p className="text-muted-foreground">Aqui você encontra seu plano de hipertrofia mais recente gerado pela IA.</p>
      </div>

      {savedPlanData?.latestPlan ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Visão Geral do Seu Plano de Hipertrofia</CardTitle>
            <CardDescription>
              Gerado em: {planDisplayDate}
              <br />
              Objetivo: <span className="capitalize font-medium">{savedPlanData.goalPhase}</span> | Dias de Treino: {savedPlanData.trainingFrequency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2"><strong>Resumo Geral:</strong></p>
            <p className="text-sm mb-4">{savedPlanData.latestPlan.overallSummary}</p>
            <p className="text-muted-foreground mb-2"><strong>Divisão Semanal:</strong></p>
            <p className="text-sm">{savedPlanData.latestPlan.trainingPlan.weeklySplitDescription}</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard/my-ai-plan">
                <Eye className="mr-2 h-5 w-5" /> Ver Plano Completo
              </Link>
            </Button>
             <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/personalized-plan">
                <Wand2 className="mr-2 h-5 w-5" /> Gerar Novo Plano
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <ClipboardX className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-6 text-2xl font-semibold">Nenhum Plano de Treino Gerado ou Salvo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Parece que você ainda não gerou e salvou seu plano de treino personalizado.
              <br />
              Use nosso gerador com IA para criar um plano de hipertrofia baseado em ciência!
            </p>            
            <Button asChild size="lg">
              <Link href="/dashboard/personalized-plan">
                <Wand2 className="mr-2 h-5 w-5" /> Gerar Meu Plano com IA
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
       <Card className="bg-secondary/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Importante</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Seu plano salvo aqui é o mais recente que você gerou e salvou.</p>
            <p>Ao gerar um novo plano e salvá-lo, ele substituirá o plano atual exibido aqui.</p>
            <p>Futuramente, implementaremos um histórico de planos para você acessar versões anteriores.</p>
          </CardContent>
        </Card>
    </div>
  );
}
