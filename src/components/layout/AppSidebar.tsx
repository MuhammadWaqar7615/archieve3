"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_SECTIONS, getFilteredNavSections } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
  X,
} from "lucide-react";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  userDisplayName?: string;
  portal?: "admin" | "dealer";
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  userDisplayName = "Administrator",
  portal,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const isDealer = portal === "dealer" || pathname.startsWith("/dealer");

  const getItemLabel = (id: string, defaultLabel: string): string => {
    switch (id) {
      case "dashboard":
        return t("nav.dashboard");
      case "listings":
      case "all-listings":
        return t("nav.allListings");
      case "add-new-listing":
        return t("nav.createListing");
      case "settings":
        return t("nav.profileSettings");
      case "notifications":
        return t("nav.notifications");
      case "users":
        return t("nav.audience");
      case "logs":
        return t("nav.queue");
      default:
        return defaultLabel;
    }
  };

  const routePrefix = isDealer ? "/dealer" : "/admin";

  const navSections = React.useMemo(
    () => getFilteredNavSections(undefined, routePrefix),
    [routePrefix]
  );

  // Detect if current route is any Listings-related page
  const isListingsRoute =
    pathname.includes("/vehicles") ||
    pathname.includes("/listings");

  // Detect if current route is any Notifications-related page
  const isNotificationsRoute =
    pathname.includes("/notifications") ||
    pathname.includes("/send");

  // State to track open submenus
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>(() => ({
    listings: isListingsRoute,
    notifications: isNotificationsRoute,
  }));

  // Auto-expand parent submenus when user navigates into their child routes
  React.useEffect(() => {
    if (isListingsRoute) {
      setOpenSubmenus((prev) => ({ ...prev, listings: true }));
    }
    if (isNotificationsRoute) {
      setOpenSubmenus((prev) => ({ ...prev, notifications: true }));
    }
  }, [isListingsRoute, isNotificationsRoute]);

  const toggleSubmenu = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      const logoutTarget = routePrefix === "/admin" ? "/admin/login" : "/dealer/login";
      router.push(logoutTarget);
      router.refresh();
    }
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1B2935] text-slate-100 select-none transition-all duration-300" suppressHydrationWarning>
      {/* Brand Header */}
      <div className="flex items-center justify-center h-20 px-4 py-4 border-b border-slate-800 relative" suppressHydrationWarning>
        <Link href={routePrefix} className="flex items-center justify-center" suppressHydrationWarning>
          {mounted && isDealer ? (
            collapsed && !mobileOpen ? (
              <div className="w-10 h-10 rounded-xl bg-[#0078d6] text-white flex items-center justify-center font-black text-xs tracking-wider shadow-lg ring-2 ring-[#0078d6]/30 select-none">
                BR
              </div>
            ) : (
              <div className="flex items-center gap-2 select-none px-2 py-1">
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-white">
                  Benz <span className="text-[#0078d6]">Rajchakru</span>
                </span>
              </div>
            )
          ) : (
            collapsed && !mobileOpen ? (
              <img
                src="/square3.png"
                alt="Icon"
                className="w-11 h-11 object-contain rounded-xl shadow-lg ring-1 ring-white/10"
              />
            ) : (
              <img
                src="/Wow-Inverse.png"
                alt="Logo"
                className="h-9 w-auto object-contain max-w-[170px]"
              />
            )
          )}
        </Link>

        {mobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="absolute right-3 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.titleKey} className="space-y-1.5">
            {(!collapsed || mobileOpen) && (
              <h3 className="px-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {t(section.titleKey)}
              </h3>
            )}
            {section.items.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;

              // Check if parent should be highlighted (user inside any child or sub-route)
              const isChildActive = hasSubItems
                ? item.id === "listings"
                  ? isListingsRoute
                  : item.id === "notifications"
                  ? isNotificationsRoute
                  : item.subItems!.some(
                      (sub) =>
                        pathname === sub.href ||
                        (sub.href !== "/" && pathname.startsWith(sub.href))
                    )
                : false;

              // Item itself matches route (for items without subItems)
              const isDirectActive =
                !hasSubItems &&
                (pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href)));

              const isSubOpen = Boolean(openSubmenus[item.id]);
              const Icon = item.icon;

              const activeBgClass = isDealer
                ? "bg-[#0078d6] text-white font-bold shadow-md shadow-blue-950/40"
                : "bg-[#FF9540] text-white font-bold shadow-md shadow-orange-950/40";

              return (
                <div key={item.id} className="space-y-1">
                  {hasSubItems ? (
                    // Parent item with subItems: acts strictly as accordion toggle button
                    <button
                      type="button"
                      onClick={(e) => toggleSubmenu(item.id, e)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 group cursor-pointer",
                        isChildActive
                          ? activeBgClass
                          : "text-white hover:text-white hover:bg-[#2A3C4D]"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                            isChildActive ? "text-white" : "text-slate-200 group-hover:text-white"
                          )}
                        />
                        {(!collapsed || mobileOpen) && (
                          <span className="truncate text-sm">{getItemLabel(item.id, item.label)}</span>
                        )}
                      </div>

                      {(!collapsed || mobileOpen) && (
                        <div className="flex items-center gap-1">
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-200 shrink-0",
                              isChildActive ? "text-white" : "text-slate-300",
                              isSubOpen ? "transform rotate-180" : "transform rotate-0"
                            )}
                          />
                        </div>
                      )}
                    </button>
                  ) : (
                    // Standard item without subItems
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? getItemLabel(item.id, item.label) : undefined}
                      className={cn(
                        "flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 group relative",
                        isDirectActive
                          ? activeBgClass
                          : "text-white hover:text-white hover:bg-[#2A3C4D]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                          isDirectActive ? "text-white" : "text-slate-200 group-hover:text-white"
                        )}
                      />
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate text-sm">{getItemLabel(item.id, item.label)}</span>
                      )}
                      {item.badge && (!collapsed || mobileOpen) && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Render Submenu Items vertically inside sidebar when open */}
                  {hasSubItems && isSubOpen && (!collapsed || mobileOpen) && (
                    <div className="pl-4 space-y-1 pt-1 overflow-hidden transition-all duration-200 ease-in-out">
                      {item.subItems!.map((sub) => {
                        const isSubActive =
                          sub.href === "/vehicles"
                            ? pathname === "/vehicles"
                            : sub.href === "/notifications"
                            ? pathname === "/notifications"
                            : pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href));

                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative group",
                              isSubActive
                                ? activeBgClass
                                : "text-slate-300 hover:text-white hover:bg-[#2A3C4D]/80"
                            )}
                          >
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full transition-all shrink-0",
                                isSubActive ? "bg-white ring-2 ring-white/40" : "bg-slate-400 group-hover:bg-white"
                              )}
                            />
                            <span className="truncate">{getItemLabel(sub.id, sub.label)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Staff Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#16212B]">
        {!collapsed || mobileOpen ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {isDealer ? (
                  <div className="w-9 h-9 rounded-full bg-[#0078d6] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#0078d6]/40 select-none">
                    BR
                  </div>
                ) : (
                  <img
                    src="/square3.png"
                    alt="Avatar"
                    className="w-9 h-9 rounded-full object-cover shadow-xs ring-2 ring-[#FF9540]/40"
                  />
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-slate-300 flex items-center gap-1 truncate">
                  <Shield className={cn("w-3 h-3 shrink-0", isDealer ? "text-[#0078d6]" : "text-[#FF9540]")} />{" "}
                  {isDealer ? "Dealer Portal" : "Admin Portal"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            {isDealer ? (
              <div className="w-9 h-9 rounded-full bg-[#0078d6] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#0078d6]/40 select-none">
                BR
              </div>
            ) : (
              <img
                src="/square3.png"
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover shadow-xs ring-2 ring-[#FF9540]/40"
              />
            )}
          </div>
        )}

        {!mobileOpen && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full mt-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition gap-2 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-bold">{t("common.collapseSidebar")}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden md:block fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 border-r border-slate-800 shadow-2xl",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex-1 w-72 max-w-xs bg-[#1B2935] z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
