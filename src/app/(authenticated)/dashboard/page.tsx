
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Dumbbell, Activity, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || "Fitness Enthusiast"}!</h1>
          <p className="text-muted-foreground">Here's a quick overview of your fitness journey.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/personalized-plan">
            <Brain className="mr-2 h-4 w-4" /> Get Your Personalized Plan
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workouts</CardTitle>
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Workouts in your current plan</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/workouts">View Workouts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Logged</div>
            <p className="text-xs text-muted-foreground">Exercises logged this week</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/progress">Track Progress</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Goal</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bench Press 70kg</div>
            <p className="text-xs text-muted-foreground">Target for next month</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/progress">Set Goals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Fitness Tip of the Day</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
          <Image 
            src="https://placehold.co/300x200.png" 
            alt="Fitness Tip" 
            width={300} 
            height={200} 
            className="rounded-lg object-cover"
            data-ai-hint="fitness motivation" 
          />
          <div>
            <p className="text-lg font-semibold mb-2">Stay Hydrated!</p>
            <p className="text-muted-foreground">
              Drinking enough water is crucial for optimal performance and recovery. Aim for at least 8 glasses a day, and more if you're active. Proper hydration helps maintain energy levels, supports muscle function, and aids in nutrient transport.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
