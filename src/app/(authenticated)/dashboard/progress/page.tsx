
"use client";
import { useState, useMemo, useEffect } from "react";
import type { ProgressLog } from "@/types";
import { MOCK_PROGRESS_LOGS } from "@/lib/constants";
import { ProgressLogForm } from "@/components/app/progress-log-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { PlusCircle, Edit, Trash2, TrendingUp, BarChartHorizontalBig, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";


const chartConfig = {
  weight: { label: "Weight (kg)", color: "hsl(var(--primary))" },
  reps: { label: "Reps", color: "hsl(var(--accent))" },
};

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<ProgressLog | undefined>(undefined);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data - In a real app, this would fetch from Firestore
    if (user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active') {
      setLogs(MOCK_PROGRESS_LOGS.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() ));
    } else {
      setLogs([]);
    }
  }, [user]);


  const handleLogAddedOrUpdated = (log: ProgressLog) => {
    if(editingLog){
        setLogs(prevLogs => prevLogs.map(l => l.id === log.id ? log : l).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() ));
    } else {
        setLogs(prevLogs => [log, ...prevLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() ));
    }
    setShowForm(false);
    setEditingLog(undefined);
  };

  const handleEditLog = (log: ProgressLog) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleDeleteLog = (logId: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
    setLogToDelete(null);
  };

  const chartData = useMemo(() => {
    // Aggregate data for a specific exercise, e.g., "Squats" (ID "1")
    return logs
      .filter(log => log.exerciseId === "1" && log.weight)
      .map(log => ({
        date: format(new Date(log.date), "MMM d"),
        weight: log.weight,
        reps: log.reps,
      }))
      .slice(0, 10) // Take last 10 for chart
      .reverse(); // Show oldest first for chart
  }, [logs]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || user.subscriptionTier !== 'hypertrophy' || user.subscriptionStatus !== 'active') {
    return <SubscriptionRequiredBlock featureName="o Log de Progresso" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track Your Progress</h1>
          <p className="text-muted-foreground">Log your workouts and see how far you've come.</p>
        </div>
        <Dialog open={showForm} onOpenChange={(isOpen) => { setShowForm(isOpen); if(!isOpen) setEditingLog(undefined);}}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLog(undefined); setShowForm(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit Workout Log" : "Log New Workout"}</DialogTitle>
              <DialogDescription>
                {editingLog ? "Update the details of your workout." : "Add a new workout log to track your progress."}
              </DialogDescription>
            </DialogHeader>
            <ProgressLogForm onLogAdded={handleLogAddedOrUpdated} existingLog={editingLog} />
          </DialogContent>
        </Dialog>
      </div>

      {logs.length === 0 && !showForm ? (
         <Card className="text-center py-12">
            <CardHeader>
                <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4">No Progress Logged Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Start logging your workouts to see your progress here.</p>
                <Button onClick={() => setShowForm(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Log Your First Workout
                </Button>
            </CardContent>
        </Card>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Squats Progress (Weight Lifted)</CardTitle>
                <CardDescription>Showing last 10 logged sessions for Squats.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" tickLine={false} axisLine={false}/>
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" tickLine={false} axisLine={false}/>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar yAxisId="left" dataKey="weight" fill="var(--color-weight)" radius={4} />
                      <Bar yAxisId="right" dataKey="reps" fill="var(--color-reps)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Workout Log History</CardTitle>
              <CardDescription>A record of your completed workouts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="text-center">Sets</TableHead>
                    <TableHead className="text-center">Reps</TableHead>
                    <TableHead className="text-center">Weight (kg)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{log.exerciseName}</TableCell>
                      <TableCell className="text-center">{log.sets}</TableCell>
                      <TableCell className="text-center">{log.reps}</TableCell>
                      <TableCell className="text-center">{log.weight || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditLog(log)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={() => setLogToDelete(log.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this workout log.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setLogToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => logToDelete && handleDeleteLog(logToDelete)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
