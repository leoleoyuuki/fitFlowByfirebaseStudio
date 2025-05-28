
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
import { MOCK_EXERCISES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProgressLog } from "@/types";
import { useState, useEffect } from "react";

// Schema for form values
const progressLogFormSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  exerciseId: z.string().min(1, { message: "Please select an exercise." }),
  sets: z.coerce.number().min(1, { message: "Sets must be at least 1." }),
  reps: z.coerce.number().min(1, { message: "Reps must be at least 1." }),
  weight: z.coerce.number().nonnegative({message: "Weight cannot be negative."}).optional(),
  duration: z.coerce.number().nonnegative({message: "Duration cannot be negative."}).optional(),
  notes: z.string().optional(),
});

type ProgressLogFormValues = z.infer<typeof progressLogFormSchema>;

// Data type for submission callback (omits fields auto-generated or from user context)
type ProgressLogSubmissionData = Omit<ProgressLogFormValues, 'exerciseName'>;


interface ProgressLogFormProps {
  onLogAdded: (data: ProgressLogSubmissionData) => void; // Callback with form data
  existingLog?: Omit<ProgressLog, "userId" | "exerciseName"> & {date: Date}; // For editing, ensure date is Date object
}

export function ProgressLogForm({ onLogAdded, existingLog }: ProgressLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProgressLogFormValues>({
    resolver: zodResolver(progressLogFormSchema),
    defaultValues: existingLog ? {
        ...existingLog,
        // Ensure existingLog.date is a Date object, it might come as string from state
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

  // Reset form if existingLog changes (e.g., dialog reopens for new log after editing)
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
      // The parent component (ProgressPage) will handle Firestore interaction
      await onLogAdded(values); 
      // Form reset is handled by parent dialog close or by useEffect if existingLog becomes undefined
    } catch (error) {
        console.error("Error in form submission callback", error);
        // Optionally show a local error message in the form if needed
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
                        {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
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

