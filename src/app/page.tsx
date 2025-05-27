
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, Target, Brain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Workout Library",
      description: "Access a vast library of pre-designed workout routines for all fitness levels.",
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Progress Tracking",
      description: "Monitor your gains, PBs, and consistency with intuitive tracking tools.",
    },
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI Personalized Plans",
      description: "Get workout plans tailored to your specific goals and needs by our smart AI.",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Exercise Tutorials",
      description: "Learn proper form with detailed instructions and visual guides for every exercise.",
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
              <span className="block text-foreground">Your Personalized Fitness Journey Starts Here</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
              Achieve your fitness goals with AI-powered personalized plans, comprehensive workout tracking, and expert-guided exercises. Join FitFlow today and transform your fitness.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Everything You Need to Succeed
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

        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Transform Your Fitness?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of users who are already achieving their goals with FitFlow.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/signup">Start Your Journey Now</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FitFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
