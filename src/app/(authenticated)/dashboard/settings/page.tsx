
"use client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, ShieldCheck, CreditCard, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configurações Salvas (Simulação)",
      description: "Suas informações de perfil foram atualizadas.",
    });
  };

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
                    <Button variant="ghost" className="w-full justify-start"><User className="mr-2 h-4 w-4"/> Perfil</Button>
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
              <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="displayName" defaultValue={user?.displayName || ""} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Endereço de E-mail</Label>
                   <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" defaultValue={user?.email || ""} disabled className="pl-10" />
                  </div>
                </div>
                <Button type="submit">Salvar Alterações</Button>
              </form>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie sua senha e configurações de segurança.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input id="currentPassword" type="password" placeholder="Digite a senha atual"/>
                </div>
                 <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input id="newPassword" type="password" placeholder="Digite a nova senha"/>
                </div>
                 <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirme a nova senha"/>
                </div>
              <Button variant="outline" onClick={() => toast({title: "Alteração de Senha (Simulação)", description: "Solicitação de alteração de senha enviada."})}>Alterar Senha</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

