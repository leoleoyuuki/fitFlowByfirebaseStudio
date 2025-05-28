
"use client";
import { useState, useMemo, useEffect } from "react";
import type { ProgressLog } from "@/types";
import { ProgressLogForm } from "@/components/app/progress-log-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { PlusCircle, Edit, Trash2, BarChartHorizontalBig, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { SubscriptionRequiredBlock } from "@/components/app/subscription-required-block";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, Timestamp } from "firebase/firestore";
import { MOCK_EXERCISES } from "@/lib/constants"; // Keep for exercise names if not stored in log

const chartConfigBase = {
  weight: { label: "Weight (kg)", color: "hsl(var(--primary))" },
  reps: { label: "Reps", color: "hsl(var(--accent))" },
};

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<ProgressLog | undefined>(undefined);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);


  const fetchUserLogs = async () => {
    if (!user?.id) return;
    setIsLoadingLogs(true);
    setErrorLogs(null);
    try {
      const logsCollectionRef = collection(db, "userProgressLogs");
      const q = query(logsCollectionRef, where("userId", "==", user.id), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedLogs = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        // Ensure date is a string; Firestore Timestamps need to be converted
        const dateString = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        return { 
          id: docSnap.id, 
          ...data,
          date: dateString,
         } as ProgressLog;
      });
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Error fetching progress logs:", err);
      setErrorLogs("Failed to load progress logs. Please try again.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (authLoading) return; 

    if (user && user.subscriptionTier === 'hypertrophy' && user.subscriptionStatus === 'active') {
      fetchUserLogs();
    } else if (user && (user.subscriptionTier !== 'hypertrophy' || user.subscriptionStatus !== 'active')) {
      setLogs([]);
      setIsLoadingLogs(false); // Not subscribed, no logs to load or show error for
    } else if (!user) {
        setLogs([]);
        setIsLoadingLogs(false); // Not logged in
    }
  }, [user, authLoading]);

  const handleLogSubmit = async (logData: Omit<ProgressLog, "id" | "userId" | "exerciseName"> & {exerciseId: string}) => {
    if (!user?.id) {
      setErrorLogs("User not authenticated.");
      return;
    }
    
    const exerciseName = MOCK_EXERCISES.find(ex => ex.id === logData.exerciseId)?.name || "Unknown Exercise";
    
    setIsLoadingLogs(true); // Use general loading state or a specific one for submissions
    try {
      if (editingLog) {
        const logRef = doc(db, "userProgressLogs", editingLog.id);
        await updateDoc(logRef, { 
            ...logData, 
            userId: user.id, 
            exerciseName,
            date: new Date(logData.date).toISOString() // Ensure date is ISO string
        });
      } else {
        await addDoc(collection(db, "userProgressLogs"), { 
            ...logData, 
            userId: user.id, 
            exerciseName,
            date: new Date(logData.date).toISOString() // Ensure date is ISO string
        });
      }
      setEditingLog(undefined);
      setShowFormDialog(false);
      await fetchUserLogs(); // Re-fetch logs to show the new/updated one
    } catch (err) {
      console.error("Error submitting log:", err);
      setErrorLogs("Failed to save log. Please try again.");
    } finally {
       // setIsLoadingLogs(false); // fetchUserLogs will handle this
    }
  };

  const handleEditLog = (log: ProgressLog) => {
    setEditingLog(log);
    setShowFormDialog(true);
  };

  const confirmDeleteLog = async () => {
    if (!logToDeleteId) return;
    setIsLoadingLogs(true);
    try {
      const logRef = doc(db, "userProgressLogs", logToDeleteId);
      await deleteDoc(logRef);
      setLogToDeleteId(null);
      await fetchUserLogs(); // Re-fetch logs
    } catch (err) {
      console.error("Error deleting log:", err);
      setErrorLogs("Failed to delete log. Please try again.");
    } finally {
      // setIsLoadingLogs(false); // fetchUserLogs will handle this
    }
  };
  
  const groupedChartData = useMemo(() => {
    if (!logs.length) return {};
    const exercisesData: Record<string, { exerciseName: string; data: Array<{ date: string; weight?: number; reps?: number; originalDate: Date }> }> = {};

    logs.forEach(log => {
        // Ensure log.weight is a number before trying to chart it
        if (!log.exerciseId || typeof log.weight !== 'number') return; 

        if (!exercisesData[log.exerciseId]) {
            exercisesData[log.exerciseId] = {
                exerciseName: log.exerciseName,
                data: [],
            };
        }
        exercisesData[log.exerciseId].data.push({
            date: log.date, // Keep ISO string for originalDate reference
            weight: log.weight,
            reps: log.reps,
            originalDate: new Date(log.date),
        });
    });

    for (const exId in exercisesData) {
        exercisesData[exId].data = exercisesData[exId].data
            .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
            .slice(-10) // Take last 10 logs
            .map(d => ({ ...d, date: format(d.originalDate, "MMM d") })); // Format date for XAxis display
    }
    return exercisesData;
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
  
  const renderContent = () => {
    if (isLoadingLogs && logs.length === 0) { // Initial load
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando seus logs...</p>
        </div>
      );
    }
    if (errorLogs) {
      return <p className="text-destructive text-center">{errorLogs}</p>;
    }
    if (logs.length === 0 && !isLoadingLogs) {
      return (
        <Card className="text-center py-12">
          <CardHeader>
            <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Nenhum Progresso Registrado Ainda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Comece registrando seus treinos para ver seu progresso aqui.</p>
            <Button onClick={() => { setEditingLog(undefined); setShowFormDialog(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Registrar Seu Primeiro Treino
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Logs de Treino</CardTitle>
            <CardDescription>Um registro dos seus treinos completados.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLogs && logs.length > 0 && <p className="text-sm text-muted-foreground text-center py-2">Atualizando logs... <Loader2 className="inline-block h-4 w-4 animate-spin" /></p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Exercício</TableHead>
                  <TableHead className="text-center">Séries</TableHead>
                  <TableHead className="text-center">Reps</TableHead>
                  <TableHead className="text-center">Peso (kg)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{log.exerciseName}</TableCell>
                    <TableCell className="text-center">{log.sets}</TableCell>
                    <TableCell className="text-center">{log.reps}</TableCell>
                    <TableCell className="text-center">{log.weight ?? "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditLog(log)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => setLogToDeleteId(log.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Deletar</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso irá deletar permanentemente este log de treino.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setLogToDeleteId(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteLog} className="bg-destructive hover:bg-destructive/90">
                              Deletar
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {Object.entries(groupedChartData).map(([exerciseId, chartInfo]) => (
            chartInfo.data.length > 0 && (
              <Card key={exerciseId}>
                <CardHeader>
                  <CardTitle>{chartInfo.exerciseName} - Progresso (Peso)</CardTitle>
                  <CardDescription>Últimas {chartInfo.data.length} sessões registradas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigBase} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartInfo.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" dataKey="weight" orientation="left" stroke="hsl(var(--primary))" tickLine={false} axisLine={false} name="Peso (kg)" />
                        <YAxis yAxisId="right" dataKey="reps" orientation="right" stroke="hsl(var(--accent))" tickLine={false} axisLine={false} name="Reps" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar yAxisId="left" dataKey="weight" fill="var(--color-weight)" radius={4} name="Peso (kg)" />
                        <Bar yAxisId="right" dataKey="reps" fill="var(--color-reps)" radius={4} name="Reps" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )
          ))}
        </div>
        {Object.keys(groupedChartData).length === 0 && logs.length > 0 && !isLoadingLogs && (
            <p className="text-center text-muted-foreground mt-8">Nenhum dado de progressão de peso para exibir nos gráficos. Registre treinos com peso para ver os gráficos.</p>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acompanhe Seu Progresso</h1>
          <p className="text-muted-foreground">Registre seus treinos e veja o quão longe você chegou.</p>
        </div>
        <Dialog open={showFormDialog} onOpenChange={(isOpen) => { setShowFormDialog(isOpen); if(!isOpen) setEditingLog(undefined);}}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLog(undefined); setShowFormDialog(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> {logs.length > 0 ? "Registrar Novo Treino" : "Registrar Primeiro Treino"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Editar Registro de Treino" : "Registrar Novo Treino"}</DialogTitle>
              <DialogDescription>
                {editingLog ? "Atualize os detalhes do seu treino." : "Adicione um novo registro de treino para acompanhar seu progresso."}
              </DialogDescription>
            </DialogHeader>
            <ProgressLogForm 
                onLogAdded={handleLogSubmit} 
                existingLog={editingLog ? {
                    ...editingLog,
                    // Ensure date is passed as Date object to form if stored as ISO string
                    date: editingLog.date ? new Date(editingLog.date) : new Date() 
                } : undefined} 
            />
          </DialogContent>
        </Dialog>
      </div>
      {renderContent()}
    </div>
  );
}
