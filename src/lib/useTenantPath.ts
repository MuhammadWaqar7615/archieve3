"use client";

import { usePathname } from "next/navigation";

export function useTenantPath() {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/dealer")
    ? "/dealer"
    : pathname.startsWith("/admin")
    ? "/admin"
    : "";

  return (path: string): string => {
    if (!prefix) return path;
    if (path === "/") return prefix;
    if (path.startsWith("/dealer") || path.startsWith("/admin")) return path;
    return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
  };
}
