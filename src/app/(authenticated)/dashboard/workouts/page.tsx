
import { MOCK_WORKOUTS } from "@/lib/constants";
import { WorkoutCard } from "@/components/app/workout-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function WorkoutsPage() {
  // Placeholder for filtering logic
  const goals = ["All", "Strength", "Cardio", "Flexibility", "Balance"];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workout Library</h1>
        <p className="text-muted-foreground">Discover routines tailored to your fitness goals.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search workouts..." className="pl-10" />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select defaultValue="All">
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map(goal => <SelectItem key={goal} value={goal}>{goal}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select defaultValue="All">
            <SelectTrigger className="w-full md:w-[180px]">
               <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_WORKOUTS.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
}
