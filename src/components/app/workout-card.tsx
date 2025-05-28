
import type { Workout } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Zap, Dumbbell } from "lucide-react";
import Link from "next/link";

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <workout.icon className="h-8 w-8 text-primary" />
          <span className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground">{workout.goal === "Hypertrophy" ? "Hipertrofia" : workout.goal}</span>
        </div>
        <CardTitle className="text-xl">{workout.name}</CardTitle>
        <CardDescription className="h-16 overflow-hidden text-ellipsis">{workout.description}</CardDescription> 
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{workout.duration}</span>
          </div>
          <div className="flex items-center">
             {workout.difficulty === "Iniciante" && <TrendingUp className="h-4 w-4 mr-1 text-green-500" />}
             {workout.difficulty === "Intermediário" && <TrendingUp className="h-4 w-4 mr-1 text-yellow-500" />}
             {workout.difficulty === "Avançado" && <TrendingUp className="h-4 w-4 mr-1 text-red-500" />}
            <span>{workout.difficulty}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/dashboard/workouts/${workout.id}`}>
            <Dumbbell className="mr-2 h-4 w-4" /> Ver Detalhes do Treino
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

