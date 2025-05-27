
import { MOCK_EXERCISES } from "@/lib/constants";
import { ExerciseCard } from "@/components/app/exercise-card";
import { Input } from "@/components/ui/input";
import { Search, BookOpenCheck } from "lucide-react"; // Added BookOpenCheck

export default function ExercisesPage() {
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
