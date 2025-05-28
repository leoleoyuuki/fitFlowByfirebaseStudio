
"use client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Mail, ShieldCheck, CreditCard, Bell, Loader2 } from "lucide-react"; // Renamed User to UserIcon to avoid conflict
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { auth, db } from "@/lib/firebase"; // Import auth and db
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react"; // Imported useEffect

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth(); // Added authLoading
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  // Update defaultValues when user data is available
  useEffect(() => { // Changed React.useEffect to useEffect
    if (user) {
      profileForm.reset({ displayName: user.displayName || "" });
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
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: values.displayName });

      // Update Firestore document
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, { displayName: values.displayName });

      toast({
        title: "Perfil Atualizado!",
        description: "Seu nome foi atualizado com sucesso.",
      });
      // AuthContext will automatically pick up the change via onAuthStateChanged
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao Atualizar Perfil",
        description: error.message || "Não foi possível atualizar seu nome. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // This is still a simulation as password change requires more complex logic
    // (re-authentication, handling current password, etc.)
    setIsUpdatingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: "Alteração de Senha (Simulação)",
      description: "Funcionalidade de alteração de senha ainda não implementada.",
    });
    setIsUpdatingPassword(false);
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
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferências.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Navegação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start"><UserIcon className="mr-2 h-4 w-4"/> Perfil</Button>
                    <Button variant="ghost" className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4"/> Segurança da Conta</Button>
                    <Button variant="ghost" className="w-full justify-start" asChild><Link href="/subscribe"><CreditCard className="mr-2 h-4 w-4"/> Assinatura</Link></Button>
                    <Button variant="ghost" className="w-full justify-start"><Bell className="mr-2 h-4 w-4"/> Notificações</Button>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize seus dados pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-10" placeholder="Seu nome completo"/>
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
                  </div>
                  <Button type="submit" disabled={isUpdatingProfile || authLoading}>
                    {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações no Perfil
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie sua senha e configurações de segurança.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input id="currentPassword" type="password" placeholder="Digite a senha atual" disabled={isUpdatingPassword}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input id="newPassword" type="password" placeholder="Digite a nova senha" disabled={isUpdatingPassword}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirme a nova senha" disabled={isUpdatingPassword}/>
                </div>
              <Button type="submit" variant="outline" disabled={isUpdatingPassword || authLoading}>
                 {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha (Simulação)
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
