
"use client";

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Brain, UserCheck, Clock, CheckCircle, TrendingUp, Target, Zap, FileText } from "lucide-react";
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
      title: "Retenção Máxima desde o Dia 1",
      description: "Entregue um plano de treino completo e profissional, em formato PDF, na primeira visita do aluno. Uma experiência de onboarding que impressiona e fideliza.",
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "Padrão de Qualidade Elevado",
      description: "Garanta que todos os instrutores prescrevam treinos com a mesma base científica de alta qualidade. A IA cria a base, seu time personaliza.",
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Instrutores Livres para Engajar",
      description: "Reduza drasticamente o tempo gasto com planilhas. Libere seus instrutores para focar em vendas de personal, aulas e no atendimento de excelência no salão.",
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Entrega Profissional em PDF",
      description: "Exporte planos de treino e dieta com aparência profissional, prontos para impressão ou envio digital, melhorando a percepção de valor da sua academia.",
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
                Sua Academia na Frente da Concorrência.
              </span>
              <span className="mt-2 block text-foreground sm:mt-3" data-aos="fade-up" data-aos-delay="200">
                Planos de Treino em PDF, Instantâneos para Cada Novo Aluno.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground sm:text-xl" data-aos="fade-up" data-aos-delay="300">
              Chega de perder alunos no primeiro mês. Com {APP_NAME}, seus instrutores geram e exportam planos de treino de alta qualidade em segundos, garantindo uma experiência fantástica desde o primeiro dia.
            </p>
            <div className="mt-10 flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4" data-aos="fade-up" data-aos-delay="400" data-aos-anchor-placement="top-bottom">
              <Button asChild size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/signup">Otimize sua Academia Agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                <Link href="/#features">Veja como Funciona</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground" data-aos="fade-down">
              Uma Ferramenta, Múltiplos Benefícios para sua Academia
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
                    <h2 className="text-3xl font-bold text-foreground">Acelere o Onboarding, Não a Qualidade</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto" data-aos-delay="100">
                        {APP_NAME} usa IA para eliminar a espera na criação de planos. Sua equipe recebe uma base científica e robusta em segundos, liberando tempo para aplicar seu conhecimento único e refinar cada plano com perfeição.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    {[
                        { icon: <TrendingUp className="h-10 w-10 text-primary mx-auto" />, title: "Base Científica Instantânea", description: "Planos iniciais considerando sobrecarga progressiva, volume e seleção de exercícios, tudo em segundos." },
                        { icon: <UserCheck className="h-10 w-10 text-primary mx-auto" />, title: "Personalização da sua Equipe", description: "Seus instrutores ajustam cada detalhe, aplicando a expertise da sua marca a cada plano gerado." },
                        { icon: <Target className="h-10 w-10 text-primary mx-auto" />, title: "Foco Total no Aluno", description: "Mais tempo para acompanhamento individualizado, engajamento no salão e construção de um relacionamento duradouro." }
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
              Um Investimento Inteligente na Sua Academia
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-xl mx-auto" data-aos="fade-down" data-aos-delay="200">
              Aumente a retenção de alunos e a eficiência da sua equipe com um único plano.
            </p>
            <div className="flex justify-center">
              <Card className="w-full max-w-md shadow-xl border-2 border-primary ring-4 ring-primary/20" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="300">
                <CardHeader className="text-center items-center">
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-2xl font-semibold text-primary">Plano para Academias</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-5xl font-extrabold text-foreground mb-2">
                    R$99,90<span className="text-xl font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Cancele quando quiser. Sem contratos de fidelidade.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6 list-none text-left">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Geração de planos de treino ilimitados para alunos</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Ferramenta de edição para personalização pelos instrutores</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Exportação de planos em formato PDF profissional</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Aumente a retenção e a percepção de valor dos seus alunos</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> Suporte prioritário para sua equipe</li>
                  </ul>
                </CardContent>
                <CardFooter className="flex-col space-y-4 p-6 pt-0">
                   <Button asChild size="lg" className="w-full text-lg px-8 py-6">
                    <Link href="/subscribe">Assine e Modernize sua Academia</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6" data-aos="fade-up" data-aos-delay="100">Transforme a Experiência do Aluno e a Produtividade da sua Equipe!</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              Experimente como {APP_NAME} pode revolucionar o onboarding da sua academia, fidelizar mais alunos e liberar o potencial da sua equipe de instrutores.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6" data-aos="zoom-in" data-aos-delay="300">
              <Link href="/signup">Quero Otimizar Minha Academia</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Menos espera, mais resultados para sua academia.</p>
        </div>
      </footer>
    </div>
  );
}
