
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, LineChart, Utensils, Gift } from "lucide-react"; 
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSubscribed = user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta, {user?.displayName || "Maromba"}!</h1>
          <p className="text-muted-foreground">
            {isSubscribed 
              ? "Pronto para otimizar sua jornada de hipertrofia?" 
              : "Desbloqueie seu potencial máximo com nosso plano Hipertrofia."}
          </p>
        </div>
        {isSubscribed ? (
          <Button asChild>
            <Link href="/dashboard/personalized-plan">
              <Brain className="mr-2 h-4 w-4" /> Obtenha Seu Plano de Hipertrofia com IA
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/subscribe">
              <Gift className="mr-2 h-4 w-4" /> Assine o FitFlow Hipertrofia
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano de Treino Atual</CardTitle>
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSubscribed ? "Foco em Hipertrofia" : "Plano Bloqueado"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? "Baseado no seu plano gerado por IA" : "Assine para desbloquear seu plano IA"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/workouts" : "/subscribe"}>
                {isSubscribed ? "Ver Meu Plano" : "Ver Plano (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Levantamentos Registrados</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "12 Registrados" : "Progresso Bloqueado"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Exercícios acompanhados esta semana" : "Assine para registrar o progresso"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/progress" : "/subscribe"}>
                {isSubscribed ? "Registrar Progresso" : "Registrar Progresso (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Meta de Força</CardTitle>
            <LineChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "Supino 85kg x 5" : "Metas Bloqueadas"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Alvo para sobrecarga progressiva" : "Assine para definir e acompanhar metas"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/progress" : "/subscribe"}>
                {isSubscribed ? "Definir & Acompanhar Metas" : "Metas (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-primary" /> Sua Dica de Hipertrofia do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt="Dica de Hipertrofia" 
            width={300} 
            height={200} 
            className="rounded-lg object-cover"
            data-ai-hint="muscle growth nutrition" 
          />
          <div>
            <p className="text-lg font-semibold mb-2">Distribuição de Proteína para Ganho Muscular!</p>
            <p className="text-muted-foreground">
              Para otimizar a síntese de proteína muscular (MPS), distribua sua ingestão diária de proteína uniformemente em 4-5 refeições/lanches. Consumir 20-40g de proteína de alta qualidade por refeição pode melhorar significativamente a recuperação e a hipertrofia.
            </p>
            {!isSubscribed && (
                <p className="text-sm text-primary mt-3">
                    <Link href="/subscribe" className="underline hover:text-primary/80">Assine o FitFlow Hipertrofia</Link> para planos de dieta orientados por IA e adaptados às suas necessidades de proteína!
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

