
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import type { ClientPlan } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, History, Eye, Wand2, AlertCircle, Edit, Replace } from "lucide-react";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReviewPlansPage() {
  const { user, loading: authLoading, isPro, isTrialing } = useAuth();
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const fetchPlansToReview = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const plansCollectionRef = collection(db, "userGeneratedPlans", user.id, "plans");
        const q = query(plansCollectionRef, where("updatedAt", "<", threeMonthsAgo), orderBy("updatedAt", "asc"));
        const plansSnapshot = await getDocs(q);
        
        const fetchedPlans: ClientPlan[] = plansSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ClientPlan, 'id'>)
        }));
        
        setPlans(fetchedPlans);

      } catch (err: any) {
        console.error("Erro ao buscar planos para revisar:", err);
        setError("Falha ao carregar os planos para revisão. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlansToReview();
  }, [user, authLoading, canAccessFeatures]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!canAccessFeatures) {
    return <SubscriptionRequiredBlock featureName="a Revisão de Planos" />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Buscando planos desatualizados...</p>
        </div>
      );
    }
    
    if (error) {
      return <p className="text-destructive text-center py-4">{error}</p>;
    }

    if (plans.length === 0) {
      return (
        <Card className="text-center py-12 shadow-lg border-muted">
          <CardHeader>
            <CardTitle className="mt-6 text-2xl font-semibold">Tudo em Dia!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">Nenhum plano de cliente precisa de revisão no momento.</p>
            <p className="text-sm text-muted-foreground">Todos os planos foram atualizados nos últimos 3 meses.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">
                Voltar ao Painel
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
        <div className="space-y-4">
            {plans.map(plan => (
                <Card key={plan.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle>{plan.clientName}</CardTitle>
                            <CardDescription>
                                Última atualização há{" "}
                                <span className="font-bold text-amber-600">
                                {formatDistanceToNow(plan.updatedAt.toDate(), { addSuffix: false, locale: ptBR })}
                                </span>
                            </CardDescription>
                        </div>
                        <AlertCircle className="h-8 w-8 text-amber-500 hidden sm:block" />
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                         <Button asChild variant="secondary" className="w-full sm:w-auto">
                            <Link href={`/dashboard/my-ai-plan?planId=${plan.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Ver Plano
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href={`/dashboard/personalized-plan?planIdToEdit=${plan.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </Link>
                        </Button>
                         <Button asChild className="w-full sm:w-auto">
                            <Link href={`/dashboard/personalized-plan?planIdToClone=${plan.id}`}>
                                <Replace className="mr-2 h-4 w-4" /> Criar Novo (Substituir)
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <History className="mr-3 h-8 w-8 text-primary" />
            Revisão de Planos de Clientes
          </h1>
          <p className="text-muted-foreground">
            Planos que não são atualizados há 3 meses ou mais.
          </p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
