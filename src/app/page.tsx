
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Barbell, Zap, Target, Brain, CheckCircle, TrendingUp, ShieldCheck, LineChart, Utensils } from "lucide-react"; // Added LineChart, Utensils
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI Hypertrophy Plans",
      description: "Receive science-based training & diet plans for bulking or cutting, tailored by AI.",
    },
    {
      icon: <Barbell className="h-8 w-8 text-primary" />,
      title: "Effective Workouts",
      description: "Access a library of hypertrophy-focused routines designed for optimal muscle growth.",
    },
    {
      icon: <LineChart className="h-8 w-8 text-primary" />,
      title: "Progress Tracking",
      description: "Log your lifts, monitor strength gains, and track your journey to a stronger physique.",
    },
    {
      icon: <Utensils className="h-8 w-8 text-primary" />,
      title: "Nutrition Guidance",
      description: "Get AI-driven dietary advice, macro targets, and meal ideas to support your goals.",
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
              <span className="block">Welcome to FitFlow</span>
              <span className="block text-foreground">Build Muscle, Smarter.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
              Unlock your potential with AI-driven, science-based hypertrophy training and nutrition plans. Whether you're bulking or cutting, FitFlow guides your transformation.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/signup">Start Building Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/#features">Learn the Science</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Your Ultimate Hypertrophy Toolkit
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
                    <h2 className="text-3xl font-bold text-foreground">Science-Backed Results</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        FitFlow integrates proven hypertrophy principles. Our AI considers progressive overload, optimal volume, exercise selection, and nutritional strategies for effective bulking or cutting phases.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="space-y-3">
                        <TrendingUp className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Progressive Overload</h3>
                        <p className="text-muted-foreground">Continuously challenge your muscles for growth. Track lifts and ensure you're progressing.</p>
                    </div>
                    <div className="space-y-3">
                        <Target className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Targeted Nutrition</h3>
                        <p className="text-muted-foreground">AI-driven diet plans for bulking (caloric surplus) or cutting (caloric deficit) with optimal macros.</p>
                    </div>
                    <div className="space-y-3">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                        <h3 className="text-xl font-semibold">Smart Recovery</h3>
                        <p className="text-muted-foreground">Guidance on rest and recovery to maximize muscle repair and growth (feature coming soon).</p>
                    </div>
                </div>
            </div>
        </section>


        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Sculpt Your Physique?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join FitFlow and leverage AI to build muscle effectively and sustainably.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">Start Your Transformation</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. All rights reserved. Engineered for Hypertrophy.</p>
        </div>
      </footer>
    </div>
  );
}
