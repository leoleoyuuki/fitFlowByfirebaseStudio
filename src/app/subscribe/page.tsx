
"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SUBSCRIPTION_PLANS, APP_NAME } from "@/lib/constants";
import { CheckCircle, Loader2, Zap, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { type Stripe as StripeType, loadStripe } from '@stripe/stripe-js';

let stripePromiseInstance: Promise<StripeType | null> | null = null;

const getStripePromise = () => {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publicKey) {
    console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definido. A funcionalidade do Stripe será limitada.");
    return Promise.resolve(null);
  }
  if (!stripePromiseInstance) {
    stripePromiseInstance = loadStripe(publicKey);
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

  const hypertrophyPlan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === 'hypertrophy');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && hypertrophyPlan && hypertrophyPlan.stripePriceId !== 'price_B2B_PLAN_ID_REPLACE_ME') { // Verifica se o price ID não é o placeholder
         toast({
            title: "Erro de Configuração do Stripe",
            description: "A chave publicável do Stripe não está definida. Pagamentos para planos não funcionarão.",
            variant: "destructive",
        });
    }
     if (hypertrophyPlan && hypertrophyPlan.stripePriceId === 'price_B2B_PLAN_ID_REPLACE_ME') {
      toast({
        title: "Aviso de Configuração",
        description: "O plano Pro requer um Price ID do Stripe válido. Configure-o em src/lib/constants.ts e no seu Stripe Dashboard.",
        variant: "default",
        duration: 10000,
      });
    }
  }, [toast, hypertrophyPlan]);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success) {
      toast({
        title: "Assinatura Realizada com Sucesso!",
        description: `Seu plano ${APP_NAME} está ativo. Potencialize seus serviços!`,
      });
      setTimeout(() => {
          if (user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active') {
            router.push("/dashboard");
          } else {
            router.replace('/subscribe?subscription_updated=true', undefined);
          }
      }, 2000); 
    } else if (searchParams.get("subscription_updated")) {
      // Logic handled by page re-render
    }

    if (canceled) {
      toast({
        title: "Assinatura Cancelada",
        description: "O processo de assinatura foi cancelado. Você pode tentar novamente a qualquer momento.",
        variant: "destructive", 
      });
    }
    
    if (success || canceled || searchParams.get("subscription_updated") || searchParams.get("session_id")) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete('success');
        current.delete('canceled');
        current.delete('session_id');
        current.delete('subscription_updated');
        const newPathQuery = current.toString();
        const newPath = newPathQuery ? `/subscribe?${newPathQuery}` : '/subscribe';

        if (window.location.pathname + (window.location.search || '') !== newPath) {
             router.replace(newPath, { scroll: false });
        }
    }
  }, [searchParams, toast, router, user]);


  const handleSubscribe = async (planId: string) => {
    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Por favor, faça login ou cadastre-se para assinar o plano Pro.",
        variant: "destructive",
      });
      router.push(`/login?redirect=/subscribe&planId=${planId}`);
      return;
    }

    if (!plan.stripePriceId || plan.stripePriceId === 'price_B2B_PLAN_ID_REPLACE_ME') {
      toast({
        title: "Erro de Configuração do Plano",
        description: "Este plano não está configurado corretamente para pagamento (Stripe Price ID ausente ou placeholder). Contate o suporte ou verifique as configurações.",
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
        description: "Seu ID de cliente Stripe não foi encontrado. Isso pode acontecer se você assinou no modo de teste e agora está tentando gerenciar no modo de produção. Tente assinar novamente ou contate o suporte.",
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
        let errorMessage = data.error || "Falha ao criar sessão do portal.";
        if (typeof data.error === 'string') {
            if (data.error.includes("Cliente Stripe não encontrado") || data.error.includes("No such customer")) {
                errorMessage = "Seu ID de cliente Stripe não foi encontrado no ambiente atual. Se você assinou no modo de Teste, esse ID não é válido no modo de Produção. Para gerenciar sua assinatura, você pode precisar assinar novamente no ambiente de Produção ou contatar o suporte.";
            } else if (data.error.includes("Conflito de ambiente de chaves Stripe")) {
                 errorMessage = "Detectamos um conflito entre o ambiente do seu ID de cliente (Teste/Produção) e as chaves de API atuais. Por favor, verifique suas configurações ou contate o suporte.";
            }
        }
        throw new Error(errorMessage);
      }
      window.location.href = data.url; 
    } catch (error: any) {
      console.error("Erro ao gerenciar assinatura:", error);
      toast({
        title: "Erro ao Gerenciar Assinatura",
        description: error.message,
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
            Você já é um Assinante {APP_NAME}!
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
            Continue aproveitando todos os benefícios do seu plano Pro para otimizar a criação de planos para seus clientes.
          </p>
          <Button 
            onClick={handleManageSubscription} 
            className="mt-8 text-lg px-8 py-6"
            disabled={isManagingSubscription || authLoading}
          >
            {isManagingSubscription ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Settings className="mr-2 h-5 w-5" />}
            Gerenciar Minha Assinatura Pro
          </Button>
           <p className="mt-4 text-sm text-muted-foreground">
            Você será redirecionado para o portal do Stripe para gerenciar seus pagamentos e assinatura.
          </p>
        </div>
      );
    }

    if (!hypertrophyPlan) {
        return (
             <div className="container mx-auto px-4 py-12 md:py-16 text-center">
                <h1 className="text-3xl font-bold text-destructive">Erro de Configuração</h1>
                <p className="mt-4 text-muted-foreground">O plano de assinatura principal não pôde ser carregado. Por favor, contate o suporte.</p>
            </div>
        )
    }

    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            Assine o {APP_NAME} para Profissionais
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            Desbloqueie a geração de planos base com IA, ferramentas de personalização e economize tempo valioso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-md mx-auto">
            <Card key={hypertrophyPlan.id} className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 border-primary border-2 ring-4 ring-primary/20`}>
              <CardHeader className="text-center">
                <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
                <CardTitle className="text-2xl font-semibold text-primary">{hypertrophyPlan.name}</CardTitle>
                <CardDescription className="text-4xl font-bold text-foreground mt-2">{hypertrophyPlan.price}</CardDescription>
                <p className="text-sm font-medium text-accent">Potencialize Seus Serviços</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {hypertrophyPlan.features.map((feature, index) => (
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
                  variant='default'
                  onClick={() => handleSubscribe(hypertrophyPlan.id)}
                  disabled={authLoading || isSubscribing === hypertrophyPlan.id || (user?.subscriptionTier === hypertrophyPlan.id) || (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) || (!hypertrophyPlan.stripePriceId || hypertrophyPlan.stripePriceId === 'price_B2B_PLAN_ID_REPLACE_ME')}
                >
                  {isSubscribing === hypertrophyPlan.id ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (user?.subscriptionTier === hypertrophyPlan.id) ? "Plano Pro Atual" : `Assinar ${hypertrophyPlan.name}`}
                </Button>
              </CardFooter>
            </Card>
        </div>
        <p className="text-center mt-12 text-sm text-muted-foreground">
          A assinatura é mensal e recorrente. Você pode gerenciar ou cancelar sua assinatura a qualquer momento.
        </p>
      </div>
    );
  };

  if (authLoading && !user) { // Apenas mostra loader global se estiver autenticando e não houver usuário ainda
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
        {authLoading && user ? ( // Mostra um loader menor se já tem usuário mas ainda está loading (ex: atualizando estado da subscription)
             <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Verificando assinatura...</p>
            </div>
        ) : (
            <Content />
        )}
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Ferramenta para Profissionais.</p>
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

    