"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { UserNav } from "@/components/dashboard/UserNav";
import { getAuthToken, clientLogout } from "../../lib/clientAuthService";
import { getAuthHeaders } from "@/lib/authUtils";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AssureQaiLogo } from "@/components/common/SakshiQaiLogo";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart2,
  ClipboardList,
  Edit,
  Layers,
  BookText,
  ListChecks,
  Users,
  ChevronDown,
  LogOut,
  User as UserIcon,
  UsersRound,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import type { User } from "@/types/auth";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isCheckingAuth, isAuthenticated } = useAuthRedirect();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuditsOpen, setIsAuditsOpen] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = getAuthToken();
        console.log(token);
        if (!token) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const userData = await response.json();
          console.log(userData);
          if (userData.success && userData.data) {
            setCurrentUser(userData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
    setIsClient(true);
  }, []);

  const allNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      tabName: "overview",
      icon: BarChart2,
      type: "link",
      roles: ["Administrator", "Manager", "QA Analyst", "Agent"],
    },
    {
      label: "Audits",
      icon: ClipboardList,
      type: "collapsible",
      tabName: "audits_group",
      roles: ["Administrator", "Manager", "QA Analyst", "Auditor"],
      subItems: [
        {
          href: "/dashboard/qa-audit",
          label: "QAi Audit Form",
          tabName: "qa-audit",
          icon: Layers,
          roles: ["Administrator", "Manager", "QA Analyst", "Auditor"],
        },
        {
          href: "/dashboard/manual-audit",
          label: "Manual Audit Form",
          tabName: "manual-audit",
          icon: Edit,
          roles: ["Administrator", "Manager", "QA Analyst", "Auditor"],
        },
        // Bulk QA Audit intentionally hidden from sidebar
      ],
    },
    {
      href: "/dashboard/sop-management",
      label: "SOP Management",
      tabName: "sop-management",
      icon: BookText,
      type: "link",
      roles: ["Administrator", "Manager"],
    },
    {
      href: "/dashboard/parameter-management",
      label: "Parameter Management",
      tabName: "parameter-management",
      icon: ListChecks,
      type: "link",
      roles: ["Administrator", "Manager"],
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      tabName: "profile",
      icon: UserIcon,
      type: "link",
      roles: ["Administrator", "Manager", "QA Analyst", "Agent"],
    },
    {
      href: "/dashboard/add-user",
      label: "User Management",
      tabName: "add-user",
      icon: Users,
      type: "link",
      roles: ["Administrator"],
    },
  ];

  const navItems = currentUser
    ? allNavItems
        .filter((item) => item.roles.includes(currentUser.role))
        .map((item) => {
          if (item.type === "collapsible" && item.subItems) {
            const filteredSubItems = item.subItems.filter((subItem) =>
              subItem.roles.includes(currentUser.role)
            );
            if (filteredSubItems.length === 0) return null;
            return { ...item, subItems: filteredSubItems };
          }
          return item;
        })
        .filter(Boolean)
    : [];

  const auditTabNames =
    allNavItems
      .find((i) => i.type === "collapsible")
      ?.subItems?.map((si) => si.tabName) || [];
  const isAuditGroupActive = auditTabNames.some((name) =>
    pathname.includes(name)
  );

  useEffect(() => {
    if (isAuditGroupActive) {
      setIsAuditsOpen(true);
    }
  }, [isAuditGroupActive]);

  if (!isClient) {
    return null;
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await clientLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
    router.replace("/login");
  };

  type NavLink = {
    href: string;
    label: string;
    tabName: string;
    icon: React.ForwardRefExoticComponent<
      Omit<React.SVGProps<SVGSVGElement>, "ref"> &
        React.RefAttributes<SVGSVGElement>
    >;
  };

  const allNavLinks = allNavItems.flatMap((item) =>
    item.type === "link"
      ? [item as NavLink]
      : item.subItems
      ? (item.subItems.filter(
          (subItem) => subItem.href !== undefined
        ) as NavLink[])
      : []
  );
  let currentPageLabel = (allNavLinks as NavLink[]).find(
    (item) => item.href && pathname.startsWith(item.href)
  )?.label;

  if (pathname === "/dashboard") {
    currentPageLabel = "Dashboard";
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <Link href="/dashboard" className="text-primary">
            <AssureQaiLogo className="h-8 w-auto" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              if (!item) return null;
              if (item.type === "link") {
                const isLinkActive = Boolean(
                  item.href &&
                    (pathname === item.href ||
                      (pathname.startsWith(item.href) &&
                        item.href !== "/dashboard"))
                );
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive}
                      tooltip={isMobile ? undefined : item.label}
                    >
                      {item.href !== undefined && (
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      )}
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
                        <SidebarMenuButton
                          className="w-full"
                          isActive={isAuditGroupActive}
                          tooltip={isMobile ? undefined : item.label}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <item.icon />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown
                              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isAuditsOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <div className="pl-6 py-1">
                        {item.subItems !== undefined && (
                          <SidebarMenu>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuItem key={subItem.label}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname.startsWith(subItem.href)}
                                  tooltip={isMobile ? undefined : subItem.label}
                                  size="sm"
                                >
                                  <Link href={subItem.href}>
                                    <subItem.icon />
                                    <span>{subItem.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
              return null;
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={isMobile ? undefined : "Log out"}
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">{currentPageLabel}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <UserNav handleLogout={handleLogout} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-secondary p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const dynamic = "force-dynamic";
