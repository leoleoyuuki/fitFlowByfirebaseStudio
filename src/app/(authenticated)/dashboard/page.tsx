
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, LineChart, Utensils, Gift, Users, FileText } from "lucide-react"; 
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSubscribed = user && user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo(a) ao {APP_NAME}, {user?.displayName || "Profissional"}!</h1>
          <p className="text-muted-foreground">
            {isSubscribed 
              ? `Você está no plano ${user.subscriptionTier}. Pronto para otimizar a criação de planos?` 
              : `Desbloqueie todo o potencial do ${APP_NAME} com uma de nossas assinaturas.`}
          </p>
        </div>
        {isSubscribed ? (
          <Button asChild>
            <Link href="/dashboard/personalized-plan">
              <Brain className="mr-2 h-4 w-4" /> Gerar Plano Base para Cliente
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/subscribe">
              <Gift className="mr-2 h-4 w-4" /> Ver Planos de Assinatura
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos de Clientes Salvos</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSubscribed ? "Gerencie Aqui" : "Funcionalidade Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? "Acesse e edite os planos dos seus clientes" : "Assine para salvar e gerenciar planos"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/my-ai-plan" : "/subscribe"}>
                {isSubscribed ? "Ver Planos Salvos" : "Ver Planos (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biblioteca de Exercícios</CardTitle>
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "Acesso Completo" : "Conteúdo Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Detalhes e vídeos para seus clientes" : "Assine para acesso total à biblioteca"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/exercises" : "/subscribe"}>
                {isSubscribed ? "Explorar Exercícios" : "Explorar (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ferramenta de Geração IA</CardTitle>
            <Brain className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "Disponível" : "Funcionalidade Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Crie planos base em segundos" : "Assine para usar a IA"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/personalized-plan" : "/subscribe"}>
                {isSubscribed ? "Gerar Plano Cliente" : "Gerar Plano (Bloqueado)"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-primary" /> Dica {APP_NAME} para Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt="Dica para Profissionais" 
            width={300} 
            height={200} 
            className="rounded-lg object-cover"
            data-ai-hint="professional fitness nutrition tip" 
          />
          <div>
            <p className="text-lg font-semibold mb-2">Maximize a Adesão do Cliente com Planos Editáveis!</p>
            <p className="text-muted-foreground">
              Use os planos gerados pela IA como um ponto de partida robusto. Em seguida, personalize cada detalhe – desde a seleção de exercícios até as opções de refeições – para alinhar perfeitamente com as preferências, restrições e o dia a dia do seu cliente. Um plano verdadeiramente individualizado aumenta drasticamente a adesão e os resultados.
            </p>
            {!isSubscribed && (
                <p className="text-sm text-primary mt-3">
                    <Link href="/subscribe" className="underline hover:text-primary/80">Assine um dos nossos planos</Link> para ter acesso completo às ferramentas de personalização e IA.
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
