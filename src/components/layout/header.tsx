
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME, mainNavItems } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { Dumbbell, User, LogOut, LogIn, LayoutDashboard, Settings, Gift, Badge, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, logout, loading, isTrialing, daysLeftInTrial } = useAuth();
  const router = useRouter();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const UserStatus = () => {
    if (isTrialing) {
        return (
            <DropdownMenuItem onClick={() => router.push('/subscribe')}>
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                <span>{daysLeftInTrial} dias de teste</span>
            </DropdownMenuItem>
        );
    }
    if (user?.subscriptionTier && user.subscriptionTier !== 'free') {
        return (
             <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Plano: <span className="capitalize font-semibold text-foreground">{user.subscriptionTier}</span>
             </DropdownMenuLabel>
        );
    }
    return (
        <DropdownMenuItem onClick={() => router.push('/subscribe')}>
            <Gift className="mr-2 h-4 w-4" />
            <span>Fazer Upgrade</span>
        </DropdownMenuItem>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/60 transition-colors hover:text-foreground/80 hidden md:block"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuário"} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <UserStatus />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Painel Principal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push("/login")} className="px-2 py-1 sm:px-3 sm:py-2">
                <LogIn className="h-4 w-4 sm:mr-2" /> 
                <span className="hidden sm:inline">Entrar</span>
              </Button>
              <Button onClick={() => router.push("/signup")} size="sm">
                Iniciar Teste Gratuito
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
