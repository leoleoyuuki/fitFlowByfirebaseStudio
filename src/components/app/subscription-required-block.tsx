
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Gift } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface SubscriptionRequiredBlockProps {
  featureName?: string;
}

export function SubscriptionRequiredBlock({ featureName = "esta funcionalidade" }: SubscriptionRequiredBlockProps) {
  const { isTrialing, daysLeftInTrial } = useAuth();
  
  if (isTrialing) {
    // This case should ideally not be reached if the access control logic is correct,
    // but as a fallback, we show a loading or redirecting state.
    return (
      <Card className="w-full max-w-lg mx-auto my-8 shadow-lg">
          <CardHeader>
              <CardTitle>Acesso Permitido via Teste</CardTitle>
          </CardHeader>
          <CardContent>
              <p>Redirecionando... você tem {daysLeftInTrial} dias de teste restantes.</p>
          </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-8 shadow-lg border-primary/50">
      <CardHeader className="text-center">
        <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Funcionalidade Pro</CardTitle>
        <CardDescription>
          Para acessar {featureName}, você precisa de uma assinatura Pro ou estar em período de teste.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          Nossos planos Pro desbloqueiam o gerador de planos com IA, salvamento ilimitado de clientes e muito mais!
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/subscribe">
            <Gift className="mr-2 h-5 w-5" /> Ver Planos Pro
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
           <Link href="/signup">
            Iniciar Teste de 14 dias
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
