
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, LineChart, Utensils, Gift, Users, FileText, Badge } from "lucide-react"; 
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, isPro, isTrialing, daysLeftInTrial } = useAuth();
  
  const canAccessFeatures = isPro || isTrialing;

  const WelcomeMessage = () => {
    if (isTrialing) {
        return `Você está em um teste Pro! Restam ${daysLeftInTrial} dias.`;
    }
    if (isPro) {
        return `Você está no plano ${user?.subscriptionTier}. Pronto para otimizar a criação de planos?`;
    }
    return `Desbloqueie todo o potencial do ${APP_NAME} com uma de nossas assinaturas.`;
  }

  return (
    <div className="space-y-8">
       {isTrialing && (
        <Alert className="border-primary/50 text-primary">
          <Badge className="mr-2 h-5 w-5"/>
          <AlertTitle>Período de Teste Ativo!</AlertTitle>
          <AlertDescription>
            Você tem {daysLeftInTrial} dias restantes para usar todos os recursos Pro. <Link href="/subscribe" className="font-bold underline">Faça um upgrade agora</Link> para não perder o acesso.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo(a) ao {APP_NAME}, {user?.displayName || "Profissional"}!</h1>
          <p className="text-muted-foreground">
            <WelcomeMessage />
          </p>
        </div>
        {canAccessFeatures ? (
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos de Clientes Salvos</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canAccessFeatures ? "Gerencie Aqui" : "Funcionalidade Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
              {canAccessFeatures ? "Acesse e edite os planos dos seus clientes" : "Assine para salvar e gerenciar planos"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild disabled={!canAccessFeatures}>
              <Link href={canAccessFeatures ? "/dashboard/my-ai-plan" : "/subscribe"}>
                {canAccessFeatures ? "Ver Planos Salvos" : "Ver Planos (Bloqueado)"}
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
                {canAccessFeatures ? "Disponível" : "Funcionalidade Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
                {canAccessFeatures ? "Crie planos base em segundos" : "Assine para usar a IA"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!canAccessFeatures}>
              <Link href={canAccessFeatures ? "/dashboard/personalized-plan" : "/subscribe"}>
                {canAccessFeatures ? "Gerar Plano Cliente" : "Gerar Plano (Bloqueado)"}
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
            src="/images/treinador-e-aluno.jpg"
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
            {!canAccessFeatures && (
                <p className="text-sm text-primary mt-3">
                    <Link href="/subscribe" className="underline hover:text-primary/80">Assine um dos nossos planos</Link> ou inicie seu teste gratuito para ter acesso completo.
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
