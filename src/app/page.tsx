
"use client";

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Brain, UserCheck, Clock, Utensils, CheckCircle, TrendingUp, Target, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from '@/lib/constants';

export default function HomePage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      offset: 80,
      easing: 'ease-out-cubic',
    });
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "Planos Base Instantâneos com IA",
      description: "Chega de começar do zero! Gere rascunhos completos de treino e dieta em segundos. Nossa IA cria uma base sólida e científica, otimizando seu fluxo de trabalho.",
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "Controle Total e Personalização Profissional",
      description: "A IA é sua aliada, não sua substituta. Edite cada detalhe, incorpore sua expertise, adicione seu CREF/CFN e ajuste o plano para a individualidade de cada cliente.",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Mais Tempo para Seus Clientes, Menos Tempo Planejando",
      description: "Liberte-se das horas gastas em planilhas. Com FitFlow Pro, você dedica mais tempo ao acompanhamento personalizado, feedback e ao relacionamento com seus clientes.",
    },
    {
      icon: <Utensils className="h-8 w-8 text-primary" />,
      title: "Sua Biblioteca de Exercícios Inteligente",
      description: "Consulte rapidamente uma vasta biblioteca de exercícios com instruções detalhadas, agilizando a prescrição e garantindo clareza para seus clientes.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-primary" data-aos="fade-up" data-aos-delay="100">
                Bem-vindo ao {APP_NAME}:
              </span>
              <span className="mt-2 block text-foreground sm:mt-3" data-aos="fade-up" data-aos-delay="200">
                Sua Rotina Otimizada, Seus Clientes Satisfeitos.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl" data-aos="fade-up" data-aos-delay="300">
              Profissional de Educação Física ou Nutrição? Reduza drasticamente o tempo gasto na criação de planos de treino e dieta. Com {APP_NAME}, você usa a inteligência artificial como seu assistente para elaborar bases científicas rapidamente, liberando mais tempo para o que realmente importa: seus clientes.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4" data-aos="fade-up" data-aos-delay="400" data-aos-anchor-placement="top-bottom">
              <Button asChild size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/signup">Cadastre-se e Otimize Já</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/#features">Descubra Como</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground" data-aos="fade-down">
              Transforme Sua Rotina Profissional com Eficiência
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title} 
                  className="shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105"
                  data-aos="zoom-in-up"
                  data-aos-delay={index * 100}
                >
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
        
        <section className="py-16 md:py-24 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12" data-aos="fade-down">
                    <h2 className="text-3xl font-bold text-foreground">Sua Nova Ferramenta para Máxima Eficiência</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto" data-aos-delay="100">
                        {APP_NAME} usa IA para acelerar a parte demorada da criação de planos. Você recebe uma base robusta e científica, economizando horas para que possa aplicar seu conhecimento único e refinar cada plano com perfeição.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    {[
                        { icon: <TrendingUp className="h-10 w-10 text-primary mx-auto" />, title: "Base Científica Sólida e Rápida", description: "Planos iniciais considerando sobrecarga progressiva, volume e seleção de exercícios, tudo em segundos." },
                        { icon: <UserCheck className="h-10 w-10 text-primary mx-auto" />, title: "Seu Toque Profissional Essencial", description: "Ajuste cada detalhe, adicione suas observações e seu registro profissional (CREF/CFN) aos planos gerados." },
                        { icon: <Target className="h-10 w-10 text-primary mx-auto" />, title: "Foco Total no Cliente", description: "Dedique mais tempo ao acompanhamento individualizado e à evolução dos seus clientes, não à papelada." }
                    ].map((item, index) => (
                         <div 
                            key={item.title} 
                            className="space-y-3"
                            data-aos="fade-up"
                            data-aos-delay={index * 150}
                        >
                            {item.icon}
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section id="pricing" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground" data-aos="fade-down" data-aos-delay="100">
              Invista na Sua Produtividade e Resultados
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto" data-aos="fade-down" data-aos-delay="200">
              Acesso total à plataforma {APP_NAME} para otimizar seu trabalho e entregar mais valor aos seus clientes.
            </p>
            <div className="flex justify-center">
              <Card className="w-full max-w-md shadow-xl border-2 border-primary ring-4 ring-primary/20" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="300">
                <CardHeader className="text-center items-center">
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-2xl font-semibold text-primary">Plano {APP_NAME}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-5xl font-extrabold text-foreground mb-2">
                    R$297,90<span className="text-xl font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Cancele quando quiser. Sem contratos de fidelidade.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-none text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Geração IA Rápida de Planos Base (Treino e Dieta)</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Ferramentas Completas de Edição e Personalização</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Adição de CREF/CFN e Logo aos Planos (Em breve)</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Gestão de Múltiplos Planos de Clientes</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Biblioteca Completa de Exercícios com Vídeos</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Suporte Prioritário</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col space-y-4 p-6 pt-0">
                   <Button asChild size="lg" className="w-full text-lg px-8 py-6">
                    <Link href="/subscribe">Assine Agora e Transforme Sua Prática</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6" data-aos="fade-up" data-aos-delay="100">Recupere Seu Tempo e Eleve Seus Serviços!</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              Experimente como {APP_NAME} pode transformar a maneira como você cria planos de treino e dieta, tornando seu trabalho mais eficiente e permitindo que você se concentre no sucesso dos seus clientes.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6" data-aos="zoom-in" data-aos-delay="300">
              <Link href="/signup">Quero Otimizar Meu Tempo Agora</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Menos tempo planejando, mais tempo com seus clientes.</p>
        </div>
      </footer>
    </div>
  );
}
