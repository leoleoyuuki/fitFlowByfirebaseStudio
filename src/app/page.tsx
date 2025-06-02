
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Dumbbell, Zap, Target, Brain, CheckCircle, TrendingUp, ShieldCheck, LineChart, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "Planos de Hipertrofia com IA",
      description: "Receba planos de treino e dieta baseados em ciência para bulking ou cutting, personalizados por IA.",
    },
    {
      icon: <Dumbbell className="h-8 w-8 text-primary" />,
      title: "Treinos Eficazes",
      description: "Acesse uma biblioteca de rotinas focadas em hipertrofia, desenhadas para o crescimento muscular ideal.",
    },
    {
      icon: <LineChart className="h-8 w-8 text-primary" />,
      title: "Acompanhamento de Progresso",
      description: "Registre seus levantamentos, monitore ganhos de força e acompanhe sua jornada para um físico mais forte.",
    },
    {
      icon: <Utensils className="h-8 w-8 text-primary" />,
      title: "Orientação Nutricional",
      description: "Obtenha aconselhamento dietético direcionado por IA, metas de macronutrientes e ideias de refeições para apoiar seus objetivos.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-primary">
              <span className="block">Bem-vindo ao FitFlow</span>
              <span className="block text-foreground">Construa Músculos, de Forma Inteligente.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
              Desbloqueie seu potencial com planos de treino e nutrição para hipertrofia direcionados por IA e baseados em ciência. Seja para bulking ou cutting, o FitFlow guia sua transformação.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/signup">Inicie Sua Transformação Agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/#features">Entenda a Ciência</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Seu Kit Completo para Hipertrofia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works / Science Section Teaser */}
        <section className="py-16 md:py-24 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground">Resultados Baseados em Ciência</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        O FitFlow integra princípios comprovados de hipertrofia. Nossa IA considera sobrecarga progressiva, volume ótimo, seleção de exercícios e estratégias nutricionais para fases eficazes de bulking ou cutting.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="space-y-3">
                        <TrendingUp className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Sobrecarga Progressiva</h3>
                        <p className="text-muted-foreground">Desafie continuamente seus músculos para o crescimento. Registre os levantamentos e garanta sua progressão.</p>
                    </div>
                    <div className="space-y-3">
                        <Target className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Nutrição Direcionada</h3>
                        <p className="text-muted-foreground">Planos de dieta orientados por IA para bulking (superávit calórico) ou cutting (déficit calórico) com macros ideais.</p>
                    </div>
                    <div className="space-y-3">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Recuperação Inteligente</h3>
                        <p className="text-muted-foreground">Orientações sobre descanso e recuperação para maximizar o reparo e crescimento muscular (em breve).</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
              Transformação Completa por um Preço Justo
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Acesso total à plataforma FitFlow e conquiste o físico que você sempre sonhou, de forma acessível.
            </p>
            <div className="flex justify-center">
              <Card className="w-full max-w-md shadow-xl border-2 border-primary ring-4 ring-primary/20">
                <CardHeader className="text-center items-center">
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-2xl font-semibold text-primary">Plano FitFlow Hipertrofia</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-5xl font-extrabold text-foreground mb-2">
                    R$37,90<span className="text-xl font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Cancele quando quiser. Sem compromisso.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-none text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Planos de Treino e Dieta com IA</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Biblioteca Completa de Exercícios</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Acompanhamento Detalhado de Progresso</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Suporte e Atualizações Contínuas</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col space-y-4 p-6 pt-0">
                   <Button asChild size="lg" className="w-full text-lg px-8 py-6">
                    <Link href="/subscribe">Assine Agora e Evolua</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>


        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Pronto para Esculpir Seu Físico?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Junte-se ao FitFlow e utilize a IA para construir músculos de forma eficaz e sustentável.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">Comece Sua Transformação</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. Todos os direitos reservados. Projetado para Hipertrofia.</p>
        </div>
      </footer>
    </div>
  );
}

