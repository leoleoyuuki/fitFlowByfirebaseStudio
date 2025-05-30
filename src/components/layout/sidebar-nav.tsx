
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "@/lib/constants";
import type { NavItem } from "@/types";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";


export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get context for mobile state

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); // Close mobile sidebar on link click
    }
  };

  return (
    <SidebarMenu>
      {dashboardNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref onClick={handleLinkClick}>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
              tooltip={item.title}
              aria-disabled={item.disabled}
              className={cn(item.disabled && "cursor-not-allowed opacity-80")}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
