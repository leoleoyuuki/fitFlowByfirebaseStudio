
"use client";

import { PersonalizedPlanForm } from "@/components/app/personalized-plan-form";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PersonalizedPlanOutput } from "@/ai/flows/generate-personalized-plan";
import type { ClientPlan } from "@/types"; 

type ClientPersonalizedPlanInputValues = ClientPlan['originalInputs'];


function PersonalizedPlanPageContent() {
  const { user, loading: authLoading, isPro, isTrialing } = useAuth();
  const searchParams = useSearchParams();
  const planIdToEdit = searchParams.get("planIdToEdit");

  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [initialClientInputs, setInitialClientInputs] = useState<ClientPersonalizedPlanInputValues | null>(null);
  const [initialPlanData, setInitialPlanData] = useState<PersonalizedPlanOutput | null>(null);
  const [errorLoadingPlan, setErrorLoadingPlan] = useState<string | null>(null);

  const canAccessFeatures = isPro || isTrialing;

  useEffect(() => {
    const fetchPlanToEdit = async () => {
      if (planIdToEdit && user?.id) {
        setIsLoadingPlan(true);
        setErrorLoadingPlan(null);
        try {
          const planRef = doc(db, "userGeneratedPlans", user.id, "plans", planIdToEdit);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            const planDataFromDb = planSnap.data() as ClientPlan; 
            
            const clientInputs = planDataFromDb.originalInputs as ClientPersonalizedPlanInputValues | undefined;
            setInitialClientInputs(clientInputs || null); 
            setInitialPlanData(planDataFromDb.planData);
          } else {
            setErrorLoadingPlan("Plano para edição não encontrado.");
            setInitialClientInputs(null);
            setInitialPlanData(null);
          }
        } catch (err) {
          console.error("Erro ao buscar plano para edição:", err);
          setErrorLoadingPlan("Falha ao carregar o plano para edição.");
        } finally {
          setIsLoadingPlan(false);
        }
      } else {
        setInitialClientInputs(null);
        setInitialPlanData(null);
      }
    };

    if (!authLoading && canAccessFeatures) { 
        fetchPlanToEdit();
    }
  }, [planIdToEdit, user, authLoading, canAccessFeatures]);

  if (authLoading || (isLoadingPlan && planIdToEdit)) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">{isLoadingPlan ? "Carregando plano para edição..." : "Carregando..."}</p>
      </div>
    );
  }

  if (!canAccessFeatures && !authLoading) {
    return <SubscriptionRequiredBlock featureName="o Gerador de Planos com IA" />;
  }
  
  if (errorLoadingPlan) {
    return (
        <div className="text-center py-10 text-destructive print:hidden">
            <p>{errorLoadingPlan}</p>
        </div>
    );
  }

  return (
    <div className="printable-plan-area">
      <PersonalizedPlanForm 
        planIdToEdit={planIdToEdit || undefined} 
        initialClientInputs={initialClientInputs} 
        initialPlanDataToEdit={initialPlanData} 
      />
    </div>
  );
}

export default function PersonalizedPlanPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando página de geração de plano...</p>
      </div>
    }>
      <PersonalizedPlanPageContent />
    </Suspense>
  );
}
