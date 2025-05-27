
import { MOCK_WORKOUTS } from "@/lib/constants";
import { WorkoutCard } from "@/components/app/workout-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Barbell } from "lucide-react";

export default function WorkoutsPage() {
  // Placeholder for filtering logic - updated for hypertrophy
  const trainingSplits = ["All Splits", "Full Body", "Upper/Lower", "Push/Pull/Legs"];
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Barbell className="mr-3 h-8 w-8 text-primary" /> My Training Plans</h1>
        <p className="text-muted-foreground">Your current and available hypertrophy-focused workout plans.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search training plans..." className="pl-10" />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select defaultValue="All Splits">
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by split" />
            </SelectTrigger>
            <SelectContent>
              {trainingSplits.map(split => <SelectItem key={split} value={split}>{split}</SelectItem>)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"> {/* Adjusted columns for potentially more detailed cards */}
        {MOCK_WORKOUTS.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
}
