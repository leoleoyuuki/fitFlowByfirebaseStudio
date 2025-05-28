
"use client";
import { PersonalizedPlanForm } from "@/components/app/personalized-plan-form";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function PersonalizedPlanPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || user.subscriptionTier !== 'hypertrophy' || user.subscriptionStatus !== 'active') {
    return <SubscriptionRequiredBlock featureName="o Gerador de Planos com IA" />;
  }

  return (
    <div>
      <PersonalizedPlanForm />
    </div>
  );
}

