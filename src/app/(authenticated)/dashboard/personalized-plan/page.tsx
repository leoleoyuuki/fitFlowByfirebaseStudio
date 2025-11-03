
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
  const planIdToClone = searchParams.get("planIdToClone");
  
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [initialClientInputs, setInitialClientInputs] = useState<ClientPersonalizedPlanInputValues | null>(null);
  const [initialPlanData, setInitialPlanData] = useState<PersonalizedPlanOutput | null>(null);
  const [errorLoadingPlan, setErrorLoadingPlan] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const canAccessFeatures = isPro || isTrialing;

  useEffect(() => {
    const fetchPlanData = async () => {
      const idToFetch = planIdToEdit || planIdToClone;
      if (!idToFetch || !user?.id) {
        // Reset for a completely new plan
        setInitialClientInputs(null);
        setInitialPlanData(null);
        setIsCloning(false);
        return;
      }

      setIsLoadingPlan(true);
      setErrorLoadingPlan(null);
      setIsCloning(!!planIdToClone);

      try {
        const planRef = doc(db, "userGeneratedPlans", user.id, "plans", idToFetch);
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
          const planDataFromDb = planSnap.data() as ClientPlan;
          const clientInputs = planDataFromDb.originalInputs as ClientPersonalizedPlanInputValues | undefined;
          
          setInitialClientInputs(clientInputs || null);
          
          // If editing, load the plan data. If cloning/replacing, start with a clean slate for results.
          if (planIdToEdit) {
            setInitialPlanData(planDataFromDb.planData);
          } else {
            setInitialPlanData(null);
          }
        } else {
          setErrorLoadingPlan("Plano para edição/substituição não encontrado.");
          setInitialClientInputs(null);
          setInitialPlanData(null);
        }
      } catch (err) {
        console.error("Erro ao buscar plano:", err);
        setErrorLoadingPlan("Falha ao carregar o plano.");
      } finally {
        setIsLoadingPlan(false);
      }
    };

    if (!authLoading && canAccessFeatures) { 
        fetchPlanData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIdToEdit, planIdToClone, user?.id, authLoading, canAccessFeatures]);

  if (authLoading || (isLoadingPlan && (planIdToEdit || planIdToClone))) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)] print:hidden">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">{isLoadingPlan ? "Carregando dados do plano..." : "Carregando..."}</p>
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
        planIdToEdit={planIdToEdit || planIdToClone || undefined}
        initialClientInputs={initialClientInputs} 
        initialPlanDataToEdit={initialPlanData}
        isCloning={isCloning}
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
