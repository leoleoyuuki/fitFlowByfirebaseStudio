
"use client"; // Added "use client" as we'll use useState

import { useState, useEffect } from "react"; // Added useState and useEffect
import type { Workout } from "@/types"; // Assuming Workout type is needed if we fetch data
// import { MOCK_WORKOUTS } from "@/lib/constants"; // Removed MOCK_WORKOUTS import
import { WorkoutCard } from "@/components/app/workout-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Dumbbell, Wand2, ClipboardX } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WorkoutsPage() {
  // Placeholder for user's workouts - in a real app, this would be fetched
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]); 

  // Placeholder for filtering logic - updated for hypertrophy
  const trainingSplits = ["All Splits", "Full Body", "Upper/Lower", "Push/Pull/Legs"];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  // Simulate fetching user workouts (replace with actual fetch in the future)
  // useEffect(() => {
  //   // Example: fetchUserWorkouts().then(data => setUserWorkouts(data));
  //   // For now, it remains empty until AI generation & saving is implemented
  // }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Dumbbell className="mr-3 h-8 w-8 text-primary" /> Meu Plano de Treino</h1>
        <p className="text-muted-foreground">Seu plano de treino de hipertrofia gerado por IA aparecerá aqui.</p>
      </div>

      {userWorkouts.length === 0 ? (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <ClipboardX className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="mt-6 text-2xl font-semibold">Nenhum Plano de Treino Encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Parece que você ainda não gerou seu plano de treino personalizado.
              <br />
              Use nosso gerador com IA para criar um plano de hipertrofia baseado em ciência!
            </p>            
            <Button asChild size="lg">
              <Link href="/dashboard/personalized-plan">
                <Wand2 className="mr-2 h-5 w-5" /> Gerar Meu Plano de Treino com IA
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Buscar planos de treino..." className="pl-10" />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Select defaultValue="All Splits">
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por divisão" />
                </SelectTrigger>
                <SelectContent>
                  {trainingSplits.map(split => <SelectItem key={split} value={split}>{split}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select defaultValue="All">
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {userWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
