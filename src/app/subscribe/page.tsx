
"use client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"; // Import useRouter

export default function SubscribePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const handleSubscribe = (planId: string) => {
    if (!user && planId !== 'free') { // Allow free "selection" without login, redirect for paid
      toast({
        title: "Login Required",
        description: "Please log in or sign up to subscribe to a plan.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    // Mock subscription logic
    toast({
      title: "Subscription Initiated (Mock)",
      description: `You've selected the ${MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name} plan. Redirecting to Stripe (mock)...`,
    });
    // In a real app, you'd redirect to Stripe Checkout here
    // For now, let's simulate a successful subscription and redirect to dashboard
    setTimeout(() => {
        // Update user context (mock)
        if(user) {
            // This would be a proper API call to update user's subscription status
            const updatedUser = { ...user, subscriptionTier: planId as 'free' | 'pro' | 'premium' };
            localStorage.setItem('fitflowUser', JSON.stringify(updatedUser)); // Update mock storage
             // Force re-render or context update if needed, though localStorage change might not trigger it
        }
      toast({ title: "Subscription Successful (Mock)!", description: "Your plan has been updated."});
      if (user) router.push("/dashboard"); // only redirect if user was already logged in
    }, 2000);
  };
  
  const PageWrapper = user ? 'div' : 'div'; // If user, it's part of dashboard layout, else standalone
  const WrapperProps = user ? {} : { className: "min-h-screen flex flex-col"};

  const Content = () => (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
          Choose Your FitFlow Plan
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Unlock your full potential with a plan that matches your ambition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {MOCK_SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.id} className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 ${plan.id === 'pro' ? 'border-primary border-2 ring-4 ring-primary/20' : ''}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-primary">{plan.name}</CardTitle>
              <CardDescription className="text-4xl font-bold text-foreground mt-2">{plan.price}</CardDescription>
              {plan.id === 'pro' && <p className="text-sm font-medium text-accent">Most Popular</p>}
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
                variant={plan.id === 'pro' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading || (user?.subscriptionTier === plan.id && plan.id !== 'free')}
              >
                {user?.subscriptionTier === plan.id && plan.id !== 'free' ? "Current Plan" : `Choose ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <p className="text-center mt-12 text-muted-foreground">
        All subscriptions are mock and for demonstration purposes only. No actual payment will be processed.
      </p>
    </div>
  );

  if (user) { // Part of authenticated layout
    return <Content />;
  }

  return ( // Standalone page with its own header/footer
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-primary/5 via-background to-background">
        <Content />
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
