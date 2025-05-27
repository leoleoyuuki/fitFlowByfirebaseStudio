
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, LineChart, Utensils } from "lucide-react"; // Updated icons, changed Barbell to Dumbbell
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || "Lifter"}!</h1>
          <p className="text-muted-foreground">Ready to optimize your hypertrophy journey?</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/personalized-plan">
            <Brain className="mr-2 h-4 w-4" /> Get Your AI Hypertrophy Plan
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Training Plan</CardTitle>
            <Dumbbell className="h-5 w-5 text-muted-foreground" /> {/* Ensured this is Dumbbell */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hypertrophy Focus</div>
            <p className="text-xs text-muted-foreground">Based on your AI-generated plan</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/workouts">View My Plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logged Lifts</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Logged</div>
            <p className="text-xs text-muted-foreground">Exercises tracked this week</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/progress">Track Progress</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Strength Goal</CardTitle>
            <LineChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bench Press 85kg x 5</div>
            <p className="text-xs text-muted-foreground">Target for progressive overload</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/progress">Set & Track Goals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils className="mr-2 h-5 w-5 text-primary" /> Your Hypertrophy Tip of the Day
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt="Hypertrophy Tip" 
            width={300} 
            height={200} 
            className="rounded-lg object-cover"
            data-ai-hint="muscle growth nutrition" 
          />
          <div>
            <p className="text-lg font-semibold mb-2">Protein Pacing for Muscle Growth!</p>
            <p className="text-muted-foreground">
              For optimal muscle protein synthesis (MPS), aim to distribute your daily protein intake evenly across 4-5 meals/snacks. Consuming 20-40g of high-quality protein per meal can significantly enhance recovery and hypertrophy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
