"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { logout } from "@/lib/authService";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart2,
  ClipboardList,
  BookText,
  ListChecks,
  User,
  CreditCard,
  UserPlus,
  LogOut,
  Layers,
  Edit,
  UsersRound,
  ChevronDown,
  Loader2,
} from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCheckingAuth } = useAuthRedirect();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const navItems = [
    {
      href: "/dashboard?tab=overview",
      label: "Dashboard",
      tabName: "overview",
      icon: BarChart2,
      type: "link",
    },
    {
      label: "Audits",
      icon: ClipboardList,
      type: "collapsible",
      tabName: "audits_group",
      subItems: [
        {
          href: "/dashboard?tab=qa-audits",
          label: "QAi Audit",
          tabName: "qa-audits",
          icon: Layers,
        },
        {
          href: "/dashboard?tab=manual-audit",
          label: "Manual Audit",
          tabName: "manual-audit",
          icon: Edit,
        },
        {
          href: "/dashboard?tab=bulk-qa-audit",
          label: "Bulk QA Audit",
          tabName: "bulk-qa-audit",
          icon: UsersRound,
        },
      ],
    },
    {
      href: "/dashboard/sop-management",
      label: "SOP Management",
      tabName: "sop-management",
      icon: BookText,
      type: "link",
    },
    {
      href: "/dashboard/parameter-management",
      label: "Parameter Management",
      tabName: "parameter-management",
      icon: ListChecks,
      type: "link",
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      tabName: "profile",
      icon: User,
      type: "link",
    },
    {
      href: "/dashboard/billing",
      label: "Billing",
      tabName: "billing",
      icon: CreditCard,
      type: "link",
    },
    {
      href: "/dashboard/add-user",
      label: "Add User",
      tabName: "add-user",
      icon: UserPlus,
      type: "link",
    },
  ];

  const activeTab = searchParams.get("tab") || "overview";

  const auditTabNames =
    navItems
      .find((i) => i.type === "collapsible")
      ?.subItems?.map((si) => si.tabName) || [];
  const [isAuditsOpen, setIsAuditsOpen] = useState(
    auditTabNames.includes(activeTab)
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsAuditsOpen(auditTabNames.includes(activeTab));
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        data-ai-hint="loading screen"
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart2 className="h-4 w-4" />
            </div>
            <span className="font-semibold">AssureQAI</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.type === "link" && item.href) {
                const isActive =
                  (item.href.includes("?tab=") && activeTab === item.tabName) ||
                  (!item.href.includes("?tab=") &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              if (item.type === "collapsible") {
                return (
                  <Collapsible
                    key={item.label}
                    open={isAuditsOpen}
                    onOpenChange={setIsAuditsOpen}
                    className="w-full"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isAuditsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenu className="ml-4">
                        {item.subItems?.map((subItem) => (
                          <SidebarMenuItem key={subItem.label}>
                            <SidebarMenuButton
                              asChild
                              isActive={activeTab === subItem.tabName}
                            >
                              <Link href={subItem.href}>
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
              return null;
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayoutContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
