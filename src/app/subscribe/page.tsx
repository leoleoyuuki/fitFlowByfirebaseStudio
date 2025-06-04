
"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants";
import { CheckCircle, Loader2, Zap, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { type Stripe, loadStripe } from '@stripe/stripe-js';

let stripePromiseInstance: Promise<Stripe | null> | null = null;

const getStripePromise = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definido. A funcionalidade do Stripe será limitada.");
    return Promise.resolve(null);
  }
  if (!stripePromiseInstance) {
    stripePromiseInstance = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromiseInstance;
};

function SubscribePageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && MOCK_SUBSCRIPTION_PLANS.some(p => p.id !== 'free' && p.stripePriceId)) {
         toast({
            title: "Erro de Configuração do Stripe",
            description: "A chave publicável do Stripe não está definida. Pagamentos para planos não funcionarão.",
            variant: "destructive",
        });
    }
  }, [toast]);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success) {
      toast({
        title: "Assinatura Realizada com Sucesso!",
        description: "Seu plano FitFlow Hipertrofia está ativo. Vamos construir músculos!",
      });
      if (user) router.push("/dashboard"); 
    }

    if (canceled) {
      toast({
        title: "Assinatura Cancelada",
        description: "O processo de assinatura foi cancelado. Você pode tentar novamente a qualquer momento.",
        variant: "destructive", 
      });
    }
    
    if (success || canceled) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete('success');
        current.delete('canceled');
        current.delete('session_id'); 
        const newPathQuery = current.toString();
        const newPath = newPathQuery ? `/subscribe?${newPathQuery}` : '/subscribe';

        if (window.location.pathname + window.location.search !== newPath) {
            router.replace(newPath, undefined);
        }
    }
  }, [searchParams, toast, router, user]);


  const handleSubscribe = async (planId: string) => {
    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (plan.id === 'free') {
        toast({
            title: "Plano Básico",
            description: "Para mudar para o plano básico, por favor, gerencie sua assinatura.",
        });
        return;
    }

    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Por favor, faça login ou cadastre-se para assinar o plano Hipertrofia.",
        variant: "destructive",
      });
      router.push(`/login?redirect=/subscribe&planId=${planId}`);
      return;
    }

    if (!plan.stripePriceId) {
      toast({
        title: "Erro de Configuração do Plano",
        description: "Este plano não está configurado corretamente para pagamento. Contate o suporte.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubscribing(planId);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Falha ao iniciar a assinatura.');
      }

      const stripe = await getStripePromise();
      if (!stripe) {
        toast({
          title: "Erro de Configuração do Stripe",
          description: "A chave publicável do Stripe não está configurada ou o Stripe.js falhou ao carregar.",
          variant: "destructive",
        });
        setIsSubscribing(null);
        return;
      }
      
      console.log("Tentando redirecionar para o Stripe Checkout com o ID da Sessão:", data.sessionId);

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

      if (stripeError) {
        console.error("Erro de redirecionamento do Stripe:", stripeError);
        toast({
          title: "Erro de Pagamento",
          description: stripeError.message || "Não foi possível redirecionar para o Stripe. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro na assinatura:", error);
      toast({
        title: "Falha na Assinatura",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !user.stripeCustomerId) {
      toast({
        title: "Erro",
        description: "ID do cliente Stripe não encontrado. Faça login novamente ou contate o suporte.",
        variant: "destructive",
      });
      return;
    }
    setIsManagingSubscription(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user.stripeCustomerId }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Falha ao criar sessão do portal.");
      }
      window.location.href = data.url; 
    } catch (error: any)
     {
      console.error("Erro ao gerenciar assinatura:", error);
      let errorMessage = error.message || "Não foi possível abrir o portal de gerenciamento. Tente novamente.";
      if (typeof error.message === 'string') {
        if (error.message.includes("a similar object exists in test mode, but a live mode key was used") ||
            error.message.includes("a similar object exists in live mode, but a test mode key was used")) {
          errorMessage = "Erro de configuração do Stripe: Há uma incompatibilidade entre as chaves de API (Live/Test) e o cliente. Verifique suas chaves no .env e os dados do cliente no Stripe.";
        } else if (error.message.startsWith("No such customer")) {
            errorMessage = "Cliente Stripe não encontrado. Verifique se o ID do cliente está correto e se corresponde ao ambiente (Live/Test) das suas chaves de API.";
        }
      }
      toast({
        title: "Erro ao Gerenciar Assinatura",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsManagingSubscription(false);
    }
  };
  
  const Content = () => {
    const isHypertrophySubscriber = user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active';

    if (isHypertrophySubscriber) {
      return (
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Você já é um Assinante FitFlow Hipertrofia!
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
            Continue aproveitando todos os benefícios do seu plano, incluindo treinos e dietas personalizadas com IA.
          </p>
          <Button 
            onClick={handleManageSubscription} 
            className="mt-8 text-lg px-8 py-6"
            disabled={isManagingSubscription || authLoading}
          >
            {isManagingSubscription ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Settings className="mr-2 h-5 w-5" />}
            Gerenciar Minha Assinatura
          </Button>
           <p className="mt-4 text-sm text-muted-foreground">
            Você será redirecionado para o portal do Stripe para gerenciar seus pagamentos e assinatura.
          </p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            Escolha Seu Plano FitFlow Hipertrofia
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            Desbloqueie treinos e nutrição baseados em ciência e IA para um crescimento muscular sério.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-md mx-auto">
          {MOCK_SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 ${plan.id === 'hypertrophy' ? 'border-primary border-2 ring-4 ring-primary/20' : ''}`}>
              <CardHeader className="text-center">
                {plan.id === 'hypertrophy' && <Zap className="h-8 w-8 text-accent mx-auto mb-2" />}
                <CardTitle className="text-2xl font-semibold text-primary">{plan.name}</CardTitle>
                <CardDescription className="text-4xl font-bold text-foreground mt-2">{plan.price}</CardDescription>
                {plan.id === 'hypertrophy' && <p className="text-sm font-medium text-accent">Potência Total</p>}
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full text-lg py-6" 
                  variant={plan.id === 'hypertrophy' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={authLoading || isSubscribing === plan.id || (user?.subscriptionTier === plan.id && plan.id !== 'free') || (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && plan.id !== 'free' && !!plan.stripePriceId) || (!plan.stripePriceId && plan.id !== 'free')}
                >
                  {isSubscribing === plan.id ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (user?.subscriptionTier === plan.id && plan.id !== 'free') ? "Plano Atual" : `Escolher ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-center mt-12 text-sm text-muted-foreground">
          A assinatura é mensal e recorrente. Você pode gerenciar ou cancelar sua assinatura a qualquer momento através do seu painel.
        </p>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-background">
        <Content />
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. Projetado para Hipertrofia.</p>
        </div>
      </footer>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando informações da página...</p>
      </div>
    }>
      <SubscribePageContent />
    </Suspense>
  );
}

    