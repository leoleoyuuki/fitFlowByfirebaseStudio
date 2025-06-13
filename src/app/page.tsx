
"use client";

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Dumbbell, Zap, Target, Brain, CheckCircle, TrendingUp, ShieldCheck, LineChart, Utensils, UserCheck, Clock } from "lucide-react";
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
      title: "Geração de Planos Base com IA",
      description: "Crie rascunhos de treinos e dietas em segundos, com base científica, para seus clientes.",
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "Personalização Completa",
      description: "Edite cada detalhe do plano gerado, adicione seu CREF/CFN e adapte às necessidades individuais de cada cliente.",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Economize Tempo Precioso",
      description: "Reduza horas de trabalho manual na criação de planos, focando no acompanhamento e resultados dos seus clientes.",
    },
    {
      icon: <Utensils className="h-8 w-8 text-primary" />,
      title: "Biblioteca de Exercícios",
      description: "Acesse guias detalhados de exercícios para auxiliar na prescrição e orientação aos seus clientes.",
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
              <span className="block" data-aos="fade-up" data-aos-delay="100">Bem-vindo ao {APP_NAME}</span>
              <span className="block text-foreground" data-aos="fade-up" data-aos-delay="200">Sua Ferramenta Inteligente para Planos de Treino e Nutrição.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl" data-aos="fade-up" data-aos-delay="300">
              Otimize seu tempo e entregue resultados superiores aos seus clientes com planos de hipertrofia e nutrição gerados por IA e totalmente personalizáveis por você, profissional.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4" data-aos="fade-up" data-aos-delay="400" data-aos-anchor-placement="top-bottom">
              <Button asChild size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/signup">Cadastre-se e Otimize Seus Serviços</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/#features">Descubra as Vantagens</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground" data-aos="fade-down">
              Eleve Seu Atendimento Profissional
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
                    <h2 className="text-3xl font-bold text-foreground">Inteligência Artificial a Serviço do Profissional</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto" data-aos-delay="100">
                        Nossa IA cria planos baseados em evidências científicas, que você pode refinar com seu conhecimento e experiência para máxima eficácia.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    {[
                        { icon: <TrendingUp className="h-10 w-10 text-primary mx-auto" />, title: "Base Científica Sólida", description: "Planos iniciais considerando sobrecarga progressiva, volume e seleção de exercícios." },
                        { icon: <UserCheck className="h-10 w-10 text-primary mx-auto" />, title: "Seu Toque Profissional", description: "Ajuste cada detalhe, adicione suas observações e seu registro profissional (CREF/CFN)." },
                        { icon: <Target className="h-10 w-10 text-primary mx-auto" />, title: "Foco no Cliente", description: "Dedique mais tempo ao acompanhamento individualizado, sabendo que a base do plano é robusta." }
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
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Geração de Planos Base (Treino e Dieta) com IA</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Ferramentas de Edição e Personalização</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Adição de CREF/CFN aos Planos</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Gestão de Múltiplos Planos de Clientes</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Biblioteca Completa de Exercícios</li>
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
            <h2 className="text-3xl font-bold text-foreground mb-6" data-aos="fade-up" data-aos-delay="100">Pronto para Potencializar seu Trabalho?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              Junte-se ao {APP_NAME} e use a IA para criar planos incríveis para seus clientes, de forma eficiente e profissional.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6" data-aos="zoom-in" data-aos-delay="300">
              <Link href="/signup">Cadastre-se como Profissional</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Ferramenta para Profissionais de Educação Física e Nutrição.</p>
        </div>
      </footer>
    </div>
  );
}

    