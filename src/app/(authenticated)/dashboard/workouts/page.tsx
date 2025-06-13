
"use client"; 
// Esta página agora é um placeholder ou pode ser removida/reutilizada.
// A lógica de visualização de planos foi movida para my-ai-plan/page.tsx que agora lida com múltiplos planos.
// Para simplificar, vou redirecionar esta rota para /dashboard/my-ai-plan ou para a geração de planos.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function WorkoutsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a nova página de listagem/visualização de planos de clientes
    router.replace("/dashboard/my-ai-plan"); 
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirecionando para seus planos salvos...</p>
    </div>
  );
}

    