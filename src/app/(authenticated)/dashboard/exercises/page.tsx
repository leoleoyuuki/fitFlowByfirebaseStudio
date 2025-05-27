
"use client";

import { MOCK_EXERCISES } from "@/lib/constants";
import { ExerciseCard } from "@/components/app/exercise-card";
import { Input } from "@/components/ui/input";
import { Search, BookOpenCheck, Loader2 } from "lucide-react"; 
import { useAuth } from "@/contexts/auth-context";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";

export default function ExercisesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || user.subscriptionTier !== 'hypertrophy' || user.subscriptionStatus !== 'active') {
    return <SubscriptionRequiredBlock featureName="a Biblioteca de Exercícios" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><BookOpenCheck className="mr-3 h-8 w-8 text-primary" /> Exercise Library for Hypertrophy</h1>
        <p className="text-muted-foreground">Explore detailed guides for exercises optimal for muscle growth.</p>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search exercises (e.g., Squats, Bicep Curls)..." className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_EXERCISES.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
