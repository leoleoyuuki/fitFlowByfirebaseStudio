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
import { useAuth } from "@/contexts/auth-context";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Endereço de e-mail inválido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { sendPasswordReset, loading } = useAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    await sendPasswordReset(values.email);
  }

  return (
    <AuthFormWrapper
      title="Redefinir sua Senha"
      description="Insira seu e-mail abaixo. Enviaremos um link para você redefinir sua senha."
      footerText="Lembrou sua senha?"
      footerLinkText="Voltar para o login"
      footerLinkHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail Profissional</FormLabel>
                <FormControl>
                  <Input placeholder="seuemail@profissional.com" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar E-mail de Redefinição"
            )}
          </Button>
        </form>
      </Form>
    </AuthFormWrapper>
  );
}
