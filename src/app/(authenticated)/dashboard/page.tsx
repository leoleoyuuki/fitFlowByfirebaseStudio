
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, LineChart, Utensils, Gift } from "lucide-react"; 
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();
  const isSubscribed = user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || "Lifter"}!</h1>
          <p className="text-muted-foreground">
            {isSubscribed 
              ? "Ready to optimize your hypertrophy journey?" 
              : "Unlock your full potential with our Hypertrophy plan."}
          </p>
        </div>
        {isSubscribed ? (
          <Button asChild>
            <Link href="/dashboard/personalized-plan">
              <Brain className="mr-2 h-4 w-4" /> Get Your AI Hypertrophy Plan
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/subscribe">
              <Gift className="mr-2 h-4 w-4" /> Subscribe to FitFlow Hypertrophy
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Training Plan</CardTitle>
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isSubscribed ? "Hypertrophy Focus" : "Plan Locked"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? "Based on your AI-generated plan" : "Subscribe to unlock your AI plan"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/workouts" : "/subscribe"}>
                {isSubscribed ? "View My Plan" : "View Plan (Locked)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logged Lifts</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "12 Logged" : "Progress Locked"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Exercises tracked this week" : "Subscribe to log progress"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/progress" : "/subscribe"}>
                {isSubscribed ? "Track Progress" : "Log Progress (Locked)"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Strength Goal</CardTitle>
            <LineChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {isSubscribed ? "Bench Press 85kg x 5" : "Goals Locked"}
            </div>
            <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Target for progressive overload" : "Subscribe to set & track goals"}
            </p>
             <Button variant="outline" size="sm" className="mt-4" asChild disabled={!isSubscribed}>
              <Link href={isSubscribed ? "/dashboard/progress" : "/subscribe"}>
                {isSubscribed ? "Set & Track Goals" : "Goals (Locked)"}
              </Link>
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
            {!isSubscribed && (
                <p className="text-sm text-primary mt-3">
                    <Link href="/subscribe" className="underline hover:text-primary/80">Subscribe to FitFlow Hypertrophy</Link> for AI-driven diet plans tailored to your protein needs!
                </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
