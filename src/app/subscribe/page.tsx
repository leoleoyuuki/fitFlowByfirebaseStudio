
"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe functionality will be limited.");
}

export default function SubscribePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubscribing, setIsSubscribing = useState<string | null>(null);

  useEffect(() => {
    if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) { 
      console.error("Stripe.js failed to load, even though a key is present. Check network or Stripe status.");
       toast({
        title: "Payment System Error",
        description: "Could not initialize payment system. Please try again later.",
        variant: "destructive",
      });
    } else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && MOCK_SUBSCRIPTION_PLANS.some(p => p.id !== 'free')) { // Only warn if there are paid plans
         toast({
            title: "Configuration Error",
            description: "Stripe payments are not configured correctly for paid plans.",
            variant: "destructive",
        });
    }
  }, [toast]);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success) {
      toast({
        title: "Subscription Successful!",
        description: "Your FitFlow Hypertrophy plan is now active. Let's build some muscle!",
      });
      if (user) router.push("/dashboard");
    }

    if (canceled) {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled. You can try again anytime.",
        variant: "destructive",
      });
    }
    
    if (success || canceled) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete('success');
        current.delete('canceled');
        current.delete('session_id');
        // Use replace to avoid adding to history if already on /subscribe
        const newPath = `/subscribe?${current.toString()}`;
        if (window.location.pathname + window.location.search !== newPath) {
            router.replace(newPath);
        }
    }
  }, [searchParams, toast, router, user]);


  const handleSubscribe = async (planId: string) => {
    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (plan.id === 'free') {
        toast({
            title: "Switched to Basic Plan",
            description: "You are now on the FitFlow Basic plan.",
        });
        if (user) {
            // Mock update for free plan
            const updatedUser = { ...user, subscriptionTier: 'free' as 'free' | 'hypertrophy' };
            localStorage.setItem('fitflowUser', JSON.stringify(updatedUser));
             // TODO: Force AuthContext update or API call if backend manages this
        }
        return;
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in or sign up to subscribe to the Hypertrophy plan.",
        variant: "destructive",
      });
      router.push(`/login?redirect=/subscribe&planId=${planId}`);
      return;
    }

    if (!stripePromise || !plan.stripePriceId) {
      toast({
        title: "Payment Error",
        description: "Stripe is not configured, the plan has no price ID, or failed to load. Please contact support.",
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
        throw new Error(data.error || 'Failed to initiate subscription.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load.');
      }
      
      console.log("Attempting to redirect to Stripe Checkout with Session ID:", data.sessionId);

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        toast({
          title: "Payment Error",
          description: stripeError.message || "Could not redirect to Stripe. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(null);
    }
  };
  
  const Content = () => (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
          Choose Your FitFlow Hypertrophy Plan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Unlock AI-powered, science-based training and nutrition for serious muscle growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {MOCK_SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.id} className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 ${plan.id === 'hypertrophy' ? 'border-primary border-2 ring-4 ring-primary/20' : ''}`}>
            <CardHeader className="text-center">
               {plan.id === 'hypertrophy' && <Zap className="h-8 w-8 text-accent mx-auto mb-2" />}
              <CardTitle className="text-2xl font-semibold text-primary">{plan.name}</CardTitle>
              <CardDescription className="text-4xl font-bold text-foreground mt-2">{plan.price}</CardDescription>
              {plan.id === 'hypertrophy' && <p className="text-sm font-medium text-accent">Full Power</p>}
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
                disabled={authLoading || isSubscribing === plan.id || (user?.subscriptionTier === plan.id && plan.id !== 'free') || (!stripePromise && plan.id !== 'free' && !!plan.stripePriceId) || (!plan.stripePriceId && plan.id !== 'free')}
              >
                {isSubscribing === plan.id ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (user?.subscriptionTier === plan.id && plan.id !== 'free') ? "Current Plan" : `Choose ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <p className="text-center mt-12 text-sm text-muted-foreground">
        Ensure your Stripe Price IDs are correctly configured in the constants file for paid plans.
      </p>
       <p className="text-center mt-2 text-sm text-muted-foreground">
        Stripe Webhook Endpoint: `/api/stripe/webhook`
      </p>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render content whether user is logged in or not, handle auth within `handleSubscribe`
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-background">
        <Content />
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. Engineered for Hypertrophy.</p>
        </div>
      </footer>
    </div>
  );
}
