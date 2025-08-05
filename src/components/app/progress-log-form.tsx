
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MOCK_EXERCISES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProgressLog } from "@/types";
import { useState, useEffect } from "react";

const progressLogFormSchema = z.object({
  date: z.date({ required_error: "Data é obrigatória." }),
  exerciseId: z.string().min(1, { message: "Por favor, selecione um exercício." }),
  sets: z.coerce.number().min(1, { message: "Séries devem ser pelo menos 1." }),
  reps: z.coerce.number().min(1, { message: "Repetições devem ser pelo menos 1." }),
  weight: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().nonnegative({message: "Peso não pode ser negativo."}).optional()
  ),
  duration: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().nonnegative({message: "Duração não pode ser negativa."}).optional()
  ),
  notes: z.string().optional(),
});

type ProgressLogFormValues = z.infer<typeof progressLogFormSchema>;
type ProgressLogSubmissionData = Omit<ProgressLogFormValues, 'exerciseName'>;


interface ProgressLogFormProps {
  onLogAdded: (data: ProgressLogSubmissionData) => void;
  existingLog?: Omit<ProgressLog, "userId" | "exerciseName"> &amp; {date: Date};
}

export function ProgressLogForm({ onLogAdded, existingLog }: ProgressLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProgressLogFormValues>({
    resolver: zodResolver(progressLogFormSchema),
    defaultValues: existingLog ? {
        ...existingLog,
        date: existingLog.date instanceof Date ? existingLog.date : new Date(existingLog.date), 
    } : {
      date: new Date(),
      exerciseId: "",
      sets: 3,
      reps: 10,
      weight: undefined,
      duration: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (existingLog) {
        form.reset({
            ...existingLog,
            date: existingLog.date instanceof Date ? existingLog.date : new Date(existingLog.date),
        });
    } else {
        form.reset({
            date: new Date(),
            exerciseId: "",
            sets: 3,
            reps: 10,
            weight: undefined,
            duration: undefined,
            notes: "",
        });
    }
  }, [existingLog, form]);


  async function onSubmit(values: ProgressLogFormValues) {
    setIsLoading(true);
    try {
      await onLogAdded(values); 
    } catch (error) {
        console.error("Erro na submissão do formulário", error);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="exerciseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exercício</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um exercício" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MOCK_EXERCISES.map(ex => (
                      <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="sets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Séries</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reps</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 50 (opcional)" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (min)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ex: 30 (opcional)" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas adicionais sobre seu treino..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingLog ? "Atualizar Registro" : "Adicionar Registro"}
        </Button>
      </form>
    </Form>
  );
}

    