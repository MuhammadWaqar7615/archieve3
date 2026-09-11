export interface TenantPermissions {
  dashboard: boolean;
  listings: boolean;
  usersBasicInfo: boolean;
  profileSettings: boolean;
  notifications: boolean;
}

export interface PortalTenant {
  id: string;
  name: string;
  wpBaseUrl: string;
  permissions: TenantPermissions;
}

export const DEFAULT_TENANT: PortalTenant = {
  id: "wowcar",
  name: "WowCar",
  wpBaseUrl: (process.env.WOWCAR_WORDPRESS_URL || "https://user110.wowcar.co.th/wp-json").replace(/\/+$/, ""),
  permissions: {
    dashboard: true,
    listings: true,
    usersBasicInfo: true,
    profileSettings: true,
    notifications: true,
  },
};

export const TENANTS: Record<string, PortalTenant> = {
  "wowcar": DEFAULT_TENANT,
  "benz-rajchakru": {
    id: "benz-rajchakru",
    name: "Benz Rajchakru",
    wpBaseUrl: "https://rajchakru.wowcar.co.th/wp-json",
    permissions: {
      dashboard: true,
      listings: true,
      usersBasicInfo: true,
      profileSettings: true,
      notifications: true,
    },
  },
};

/**
 * Resolves a portal tenant by username (case-insensitive + trim).
 * benzrajchakru => benz-rajchakru
 * All others => wowcar
 */
export function resolveTenantByUsername(username?: string): PortalTenant {
  const normalized = String(username || "").trim().toLowerCase();
  if (normalized === "benzrajchakru") {
    return TENANTS["benz-rajchakru"];
  }
  return DEFAULT_TENANT;
}

/**
 * Client-safe helper returning ONLY user-friendly dealer portal display name.
 * Never exposes wpBaseUrl or server keys.
 */
export function getDealerNameByUsername(username?: string): string {
  const normalized = String(username || "").trim().toLowerCase();
  if (normalized === "benzrajchakru") {
    return "Benz Rajchakru Dealer Portal";
  }
  return "WowCar Dealer Portal";
}

/**
 * Safely resolves a tenant by stored tenantId.
 */
export function getTenantById(tenantId?: string): PortalTenant {
  if (!tenantId || !TENANTS[tenantId]) {
    return DEFAULT_TENANT;
  }
  return TENANTS[tenantId];
}
