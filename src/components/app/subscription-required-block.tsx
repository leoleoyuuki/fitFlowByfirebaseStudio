
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Gift } from "lucide-react";

interface SubscriptionRequiredBlockProps {
  featureName?: string;
}

export function SubscriptionRequiredBlock({ featureName = "esta funcionalidade" }: SubscriptionRequiredBlockProps) {
  return (
    <Card className="w-full max-w-lg mx-auto my-8 shadow-lg border-primary/50">
      <CardHeader className="text-center">
        <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
        <CardDescription>
          Para acessar {featureName}, você precisa de uma assinatura FitFlow Hipertrofia ativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          Desbloqueie o acesso completo ao nosso gerador de planos de hipertrofia com IA, planos de dieta personalizados, biblioteca de exercícios completa e muito mais!
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/subscribe">
            <Gift className="mr-2 h-5 w-5" /> Ver Planos de Assinatura
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

