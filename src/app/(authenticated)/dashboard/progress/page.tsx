
"use client";
import { useState, useMemo, useEffect } from "react";
import type { ProgressLog } from "@/types";
import { ProgressLogForm } from "@/components/app/progress-log-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { MOCK_EXERCISES } from "@/lib/constants"; 

const chartConfigBase = {
  weight: { label: "Peso (kg)", color: "hsl(var(--primary))" },
  reps: { label: "Reps", color: "hsl(var(--accent))" },
};

export default function ProgressPage() {
  const { user, loading: authLoading, isPro, isTrialing } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<ProgressLog | undefined>(undefined);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const canAccessFeatures = isPro || isTrialing;

  const fetchUserLogs = async () => {
    if (!user?.id) return;
    setIsLoadingLogs(true);
    setErrorLogs(null);
    try {
      const logsCollectionRef = collection(db, "userProgressLogs");
      const q = query(logsCollectionRef, where("userId", "==", user.id));
      const querySnapshot = await getDocs(q);
      let fetchedLogs = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const dateString = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        return {
          id: docSnap.id,
          ...data,
          date: dateString,
         } as ProgressLog;
      });
      fetchedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error("Erro ao buscar logs de progresso:", err);
      if (err.code === 'failed-precondition' && err.message.includes('index')) {
        setErrorLogs("O banco de dados requer um índice para esta consulta. Por favor, crie o índice no console do Firebase ou aguarde a propagação se já foi criado. Detalhes do erro: " + err.message);
      } else {
        setErrorLogs("Falha ao carregar os logs de progresso. Tente novamente.");
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user && canAccessFeatures) {
      fetchUserLogs();
    } else if (user && !canAccessFeatures) {
      setLogs([]);
      setIsLoadingLogs(false);
    } else if (!user) {
        setLogs([]);
        setIsLoadingLogs(false);
    }
  }, [user, authLoading, canAccessFeatures]);

  const handleLogSubmit = async (logData: Omit<ProgressLog, "id" | "userId" | "exerciseName"> & {exerciseId: string}) => {
    if (!user?.id) {
      setErrorLogs("Usuário não autenticado.");
      return;
    }

    const exerciseName = MOCK_EXERCISES.find(ex => ex.id === logData.exerciseId)?.name || "Exercício Desconhecido";

    const baseData = {
      userId: user.id,
      exerciseId: logData.exerciseId,
      exerciseName,
      date: new Date(logData.date).toISOString(),
      sets: logData.sets,
      reps: logData.reps,
    };

    const optionalData: Partial<Pick<ProgressLog, 'weight' | 'duration' | 'notes'>> = {};

    if (typeof logData.weight === 'number' && !isNaN(logData.weight)) {
      optionalData.weight = logData.weight;
    }
    if (typeof logData.duration === 'number' && !isNaN(logData.duration)) {
      optionalData.duration = logData.duration;
    }
    if (typeof logData.notes === 'string' && logData.notes.trim() !== "") {
      optionalData.notes = logData.notes.trim();
    }

    const dataToSave = { ...baseData, ...optionalData };
    console.log("Dados enviados para o Firestore:", JSON.stringify(dataToSave, null, 2)); 

    try {
      if (editingLog) {
        const logRef = doc(db, "userProgressLogs", editingLog.id);
        await updateDoc(logRef, dataToSave);
      } else {
        await addDoc(collection(db, "userProgressLogs"), dataToSave);
      }
      setEditingLog(undefined);
      setShowFormDialog(false);
      await fetchUserLogs();
    } catch (err: any) {
      console.error("Erro ao submeter log:", err);
      setErrorLogs(`Falha ao salvar log: ${err.message}. Tente novamente.`);
    }
  };

  const handleEditLog = (log: ProgressLog) => {
    setEditingLog(log);
    setShowFormDialog(true);
  };

  const confirmDeleteLog = async () => {
    if (!logToDeleteId) return;
    try {
      const logRef = doc(db, "userProgressLogs", logToDeleteId);
      await deleteDoc(logRef);
      setLogToDeleteId(null);
      await fetchUserLogs();
    } catch (err: any) {
      console.error("Erro ao deletar log:", err);
      setErrorLogs("Falha ao deletar log. Tente novamente.");
    }
  };

  const groupedChartData = useMemo(() => {
    if (!logs.length) return {};
    const exercisesData: Record<string, { exerciseName: string; data: Array<{ date: string; weight?: number; reps?: number; originalDate: Date }> }> = {};

    logs.forEach(log => {
        if (!log.exerciseId) return;

        const weight = typeof log.weight === 'number' && !isNaN(log.weight) ? log.weight : undefined;
        const reps = typeof log.reps === 'number' && !isNaN(log.reps) ? log.reps : undefined;

        if (!exercisesData[log.exerciseId]) {
            exercisesData[log.exerciseId] = {
                exerciseName: log.exerciseName,
                data: [],
            };
        }

        if (weight !== undefined) {
            exercisesData[log.exerciseId].data.push({
                date: log.date,
                weight: weight,
                reps: reps,
                originalDate: new Date(log.date),
            });
        }
    });

    for (const exId in exercisesData) {
        exercisesData[exId].data = exercisesData[exId].data
            .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
            .slice(-10)
            .map(d => ({ ...d, date: format(d.originalDate, "d MMM", { locale: ptBR }) }));
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

  if (!canAccessFeatures && !authLoading) {
    return <SubscriptionRequiredBlock featureName="o Log de Progresso" />;
  }

  const renderContent = () => {
    if (isLoadingLogs && logs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando seus logs...</p>
        </div>
      );
    }
    if (errorLogs && !isLoadingLogs) {
      return <p className="text-destructive text-center py-4">{errorLogs}</p>;
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
            {isLoadingLogs && logs.length > 0 && <div className="flex items-center justify-center py-2 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando logs...</div>}
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
                    <TableCell>{format(new Date(log.date), "d MMM, yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{log.exerciseName}</TableCell>
                    <TableCell className="text-center">{log.sets}</TableCell>
                    <TableCell className="text-center">{log.reps}</TableCell>
                    <TableCell className="text-center">{typeof log.weight === 'number' ? log.weight : "-"}</TableCell>
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
          {Object.keys(groupedChartData).length > 0 ? Object.entries(groupedChartData).map(([exerciseId, chartInfo]) => (
            chartInfo.data.length > 0 && (
              <Card key={exerciseId}>
                <CardHeader>
                  <CardTitle>{chartInfo.exerciseName} - Progresso (Peso & Reps)</CardTitle>
                  <CardDescription>Últimas {chartInfo.data.length} sessões registradas com peso.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfigBase} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartInfo.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" dataKey="weight" orientation="left" stroke="hsl(var(--primary))" tickLine={false} axisLine={false} name="Peso (kg)" domain={['auto', 'auto']}/>
                        <YAxis yAxisId="right" dataKey="reps" orientation="right" stroke="hsl(var(--accent))" tickLine={false} axisLine={false} name="Reps" domain={['auto', 'auto']}/>
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
          )) : ( logs.length > 0 && !isLoadingLogs &&
            <div className="lg:col-span-2 text-center text-muted-foreground mt-8">
                Nenhum dado de progressão de peso para exibir nos gráficos. Registre treinos com peso para ver os gráficos.
            </div>
          )}
        </div>
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
                    date: editingLog.date ? new Date(editingLog.date) : new Date(),
                    weight: editingLog.weight ?? undefined,
                    duration: editingLog.duration ?? undefined,
                    notes: editingLog.notes ?? "",
                } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
      {renderContent()}
    </div>
  );
}
