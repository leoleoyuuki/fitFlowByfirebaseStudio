
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
import { Loader2, Star } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Endereço de e-mail inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup, loading } = useAuth();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    await signup(values.email, values.password, values.displayName);
  }

  return (
    <AuthFormWrapper
      title={`Teste o ${APP_NAME} por 14 Dias`}
      description={`Crie sua conta e ganhe acesso imediato a todos os recursos Pro. Não é necessário cartão de crédito.`}
      footerText="Já possui uma conta?"
      footerLinkText="Faça login"
      footerLinkHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seu Nome (Profissional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Dr. Nome Sobrenome" {...field} disabled={loading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail Profissional</FormLabel>
                <FormControl>
                  <Input placeholder="seuemail@profissional.com" {...field} disabled={loading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="•••••••• (mín. 6 caracteres)" {...field} disabled={loading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando sua conta...
              </>
            ) : (
               <>
                <Star className="mr-2 h-4 w-4" />
                Iniciar meu Teste Gratuito
               </>
            )}
          </Button>
        </form>
      </Form>
    </AuthFormWrapper>
  );
}
