
"use client";
import { MOCK_EXERCISES, MOCK_WORKOUTS } from "@/lib/constants";
import type { Exercise } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlayCircle, Clock, TrendingUp, ListChecks } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.workoutId as string;

  const workout = MOCK_WORKOUTS.find(w => w.id === workoutId);

  if (!workout) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Workout not found</h1>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const exercisesForWorkout: Exercise[] = workout.exercises
    .map(exId => MOCK_EXERCISES.find(ex => ex.id === exId))
    .filter((ex): ex is Exercise => ex !== undefined);

  return (
    <div className="space-y-8">
      <div>
        <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workouts
        </Button>
        <div className="flex items-center gap-4 mb-2">
           <workout.icon className="h-10 w-10 text-primary" />
           <h1 className="text-3xl font-bold tracking-tight">{workout.name}</h1>
        </div>
        <p className="text-muted-foreground">{workout.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {workout.duration}</div>
          <div className="flex items-center"><TrendingUp className="h-4 w-4 mr-1" /> {workout.difficulty}</div>
          <div className="flex items-center"><ListChecks className="h-4 w-4 mr-1" /> {exercisesForWorkout.length} exercises</div>
        </div>
      </div>

      <Button size="lg" className="w-full md:w-auto text-lg py-6">
        <PlayCircle className="mr-2 h-5 w-5" /> Start Workout Session
      </Button>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Exercises in this Workout</h2>
        {exercisesForWorkout.map((exercise, index) => (
          <Card key={exercise.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{index + 1}. {exercise.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Image 
                src={exercise.videoUrl || "https://placehold.co/150x100.png"} 
                alt={exercise.name} 
                width={150} 
                height={100} 
                className="rounded-md object-cover"
                data-ai-hint={exercise.dataAiHint || "fitness exercise"}
              />
              <div className="flex-grow">
                <p className="text-muted-foreground mb-2">{exercise.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/exercises/${exercise.id}`}>View Instructions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
