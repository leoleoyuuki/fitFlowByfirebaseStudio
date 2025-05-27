
import type { Exercise } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl">{exercise.name}</CardTitle>
        {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
          <CardDescription className="text-xs text-primary">
            Targets: {exercise.muscleGroups.join(", ")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image 
                src={exercise.imageUrl || exercise.videoUrl || "https://placehold.co/300x168.png"} 
                alt={exercise.name} 
                layout="fill"
                objectFit="cover"
                data-ai-hint={exercise.dataAiHint || "fitness exercise"}
            />
        </div>
        <p className="text-sm text-muted-foreground h-16 overflow-hidden text-ellipsis">
          {exercise.description}
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant="outline">
          <Link href={`/dashboard/exercises/${exercise.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
