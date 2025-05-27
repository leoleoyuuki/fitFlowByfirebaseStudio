
import { APP_NAME } from "@/lib/constants";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dumbbell, UserCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserNav } from "@/components/layout/user-nav";


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen>
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1 hover:bg-sidebar-accent rounded-md">
              <Dumbbell className="h-7 w-7 text-sidebar-primary" />
              <span className="text-xl font-semibold text-sidebar-foreground">{APP_NAME}</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter>
            {/* Placeholder for user avatar or settings quick link */}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
             <SidebarTrigger className="md:hidden" /> {/* Hidden on md+, shown on mobile to toggle sheet */}
             <div className="flex-1">
                {/* Breadcrumbs or page title can go here */}
             </div>
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
