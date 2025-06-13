
"use client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Mail, ShieldCheck, CreditCard, Bell, Loader2, KeyRound, Briefcase, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { auth, db } from "@/lib/firebase";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  professionalType: z.enum(["physical_educator", "nutritionist", "both", ""], {errorMap: () => ({message: "Selecione sua área de atuação."})}).optional(),
  professionalRegistration: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Por favor, insira sua senha atual." }),
  newPassword: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação da senha deve ter pelo menos 6 caracteres." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "A nova senha e a confirmação não correspondem.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading, updateUserProfileField } = useAuth();
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      professionalType: user?.professionalType || "",
      professionalRegistration: user?.professionalRegistration || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ 
        displayName: user.displayName || "",
        professionalType: user.professionalType || "",
        professionalRegistration: user.professionalRegistration || "",
      });
    }
  }, [user, profileForm]);

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user || !auth.currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // Atualizar displayName no Firebase Auth (se mudou)
      if (auth.currentUser.displayName !== values.displayName) {
        await updateProfile(auth.currentUser, { displayName: values.displayName });
      }

      // Atualizar dados no Firestore
      const userDocRef = doc(db, "users", user.id);
      const firestoreUpdates: Partial<ProfileFormValues> = {
        displayName: values.displayName,
        professionalType: values.professionalType || null, // Salva null se vazio
        professionalRegistration: values.professionalRegistration || null, // Salva null se vazio
      };
      await updateDoc(userDocRef, {
        ...firestoreUpdates,
        updatedAt: new Date(), // Use client-side date or serverTimestamp
      });
      
      // Atualiza o contexto local
      if (user) {
        await updateUserProfileField(user.id, 'displayName', values.displayName);
        await updateUserProfileField(user.id, 'professionalType', values.professionalType || null);
        await updateUserProfileField(user.id, 'professionalRegistration', values.professionalRegistration || null);
      }


      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações profissionais foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao Atualizar Perfil",
        description: error.message || "Não foi possível atualizar suas informações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const handlePasswordChange = async (values: PasswordFormValues) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Erro", description: "Usuário não autenticado corretamente.", variant: "destructive" });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, values.newPassword);
      toast({ title: "Senha Alterada!", description: "Sua senha foi alterada com sucesso." });
      passwordForm.reset(); 
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      let description = "Não foi possível alterar sua senha. Tente novamente.";
      if (error.code === 'auth/wrong-password') {
        description = "A senha atual está incorreta. Verifique e tente novamente.";
        passwordForm.setError("currentPassword", { type: "manual", message: description });
      } else if (error.code === 'auth/weak-password') {
        description = "A nova senha é muito fraca. Tente uma senha mais forte.";
         passwordForm.setError("newPassword", { type: "manual", message: description });
      } else if (error.code === 'auth/requires-recent-login') {
        description = "Esta operação é sensível e requer autenticação recente. Por favor, faça login novamente e tente de novo.";
      }
      toast({
        title: "Erro ao Alterar Senha",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta Profissional</h1>
        <p className="text-muted-foreground">Gerencie seus dados, assinatura e preferências.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Navegação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start"><UserIcon className="mr-2 h-4 w-4"/> Perfil Profissional</Button>
                    <Button variant="ghost" className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4"/> Segurança da Conta</Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/subscribe"><CreditCard className="mr-2 h-4 w-4"/> Assinatura Pro</Link></Button>
                    <Button variant="ghost" className="w-full justify-start"><Bell className="mr-2 h-4 w-4"/> Notificações (Em Breve)</Button>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil Profissional</CardTitle>
              <CardDescription>Atualize seus dados e registro profissional.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo (Profissional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-10" placeholder="Seu nome profissional"/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" defaultValue={user?.email || ""} disabled className="pl-10" />
                    </div>
                    <FormDescription>Para alterar o e-mail, entre em contato com o suporte.</FormDescription>
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="professionalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal Área de Atuação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="pl-10">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Selecione sua área..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="physical_educator">Educador Físico</SelectItem>
                            <SelectItem value="nutritionist">Nutricionista</SelectItem>
                            <SelectItem value="both">Ambos (Educador Físico e Nutricionista)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="professionalRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registro Profissional (CREF/CFN)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} value={field.value || ""} className="pl-10" placeholder="Ex: 012345-G/SP ou CRN-3 12345"/>
                          </div>
                        </FormControl>
                        <FormDescription>Seu registro será exibido nos planos gerados para seus clientes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isUpdatingProfile || authLoading}>
                    {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar Alterações no Perfil
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie sua senha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                           <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Digite sua senha atual" {...field} className="pl-10" disabled={isUpdatingPassword}/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                         <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Digite a nova senha (mín. 6 caracteres)" {...field} className="pl-10" disabled={isUpdatingPassword}/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Confirme a nova senha" {...field} className="pl-10" disabled={isUpdatingPassword}/>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="outline" disabled={isUpdatingPassword || authLoading}>
                     {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Alterar Senha
                  </Button>
              </form>
             </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    