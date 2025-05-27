
"use client";
import { MOCK_EXERCISES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video, ListOrdered } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.exerciseId as string;

  const exercise = MOCK_EXERCISES.find(ex => ex.id === exerciseId);

  if (!exercise) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Exercise not found</h1>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exercises
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{exercise.name}</h1>
        <p className="text-muted-foreground mt-1">{exercise.description}</p>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center"><Video className="mr-2 h-6 w-6 text-primary" /> Tutorial Video</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for video player. Using an image for now. */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {exercise.videoUrl ? (
                <Image 
                    src={exercise.videoUrl} 
                    alt={`${exercise.name} tutorial`} 
                    width={1280} 
                    height={720} 
                    className="w-full h-full object-cover"
                    data-ai-hint={exercise.dataAiHint || "fitness tutorial"}
                />
            ) : (
                <p className="text-muted-foreground">Video tutorial coming soon.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ListOrdered className="mr-2 h-6 w-6 text-primary" /> Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {exercise.instructions.split('. ').map((step, index, arr) => 
                step.trim() && <p key={index}>{`${index + 1}. ${step.trim()}${index === arr.length - 1 ? '' : '.'}`}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Primary Muscle Groups Targeted</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {exercise.muscleGroups.map(group => <li key={group}>{group}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
