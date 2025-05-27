
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
import { useState } from "react";

const progressLogSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  exerciseId: z.string().min(1, { message: "Please select an exercise." }),
  sets: z.coerce.number().min(1, { message: "Sets must be at least 1." }),
  reps: z.coerce.number().min(1, { message: "Reps must be at least 1." }),
  weight: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type ProgressLogFormValues = z.infer<typeof progressLogSchema>;

interface ProgressLogFormProps {
  onLogAdded: (log: ProgressLog) => void;
  existingLog?: ProgressLog; // For editing
}

export function ProgressLogForm({ onLogAdded, existingLog }: ProgressLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ProgressLogFormValues>({
    resolver: zodResolver(progressLogSchema),
    defaultValues: existingLog ? {
        date: new Date(existingLog.date),
        exerciseId: existingLog.exerciseId,
        sets: existingLog.sets,
        reps: existingLog.reps,
        weight: existingLog.weight,
        duration: existingLog.duration,
        notes: existingLog.notes,
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

  async function onSubmit(values: ProgressLogFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const exerciseName = MOCK_EXERCISES.find(ex => ex.id === values.exerciseId)?.name || "Unknown Exercise";
    const newLog: ProgressLog = {
      id: existingLog?.id || Date.now().toString(), // Use existing ID or generate new
      date: values.date.toISOString(),
      exerciseId: values.exerciseId,
      exerciseName: exerciseName,
      sets: values.sets,
      reps: values.reps,
      weight: values.weight,
      duration: values.duration,
      notes: values.notes,
    };
    onLogAdded(newLog);
    form.reset();
    setIsLoading(false);
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
                <FormLabel>Date</FormLabel>
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
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                <FormLabel>Exercise</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exercise" />
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
                <FormLabel>Sets</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 3" {...field} />
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
                  <Input type="number" placeholder="e.g., 10" {...field} />
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
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 50 (optional)" {...field} value={field.value ?? ""} />
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
                <FormLabel>Duration (min)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 30 (optional)" {...field} value={field.value ?? ""} />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional notes about your workout..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingLog ? "Update Log" : "Add Log"}
        </Button>
      </form>
    </Form>
  );
}
