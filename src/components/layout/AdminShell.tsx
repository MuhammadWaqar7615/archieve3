"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("Administrator");
  const [portal, setPortal] = useState<"admin" | "dealer">(
    pathname.startsWith("/dealer") ? "dealer" : "admin"
  );

  const isLoginPage =
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/dealer/login";

  useEffect(() => {
    if (!isLoginPage) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            if (data.user?.displayName) {
              setUserDisplayName(data.user.displayName);
            }
            if (data.portal) {
              setPortal(data.portal);
            }
          }
        })
        .catch(() => {});
    }
  }, [isLoginPage]);

  useEffect(() => {
    if (portal === "dealer") {
      document.documentElement.classList.add("theme-benz");
    } else {
      document.documentElement.classList.remove("theme-benz");
    }
  }, [portal]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#F7F8FA]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans" suppressHydrationWarning>
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        userDisplayName={userDisplayName}
        portal={portal}
      />

      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0",
          collapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <TopHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          userDisplayName={userDisplayName}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
