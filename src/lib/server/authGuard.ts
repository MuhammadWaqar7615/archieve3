import { getSession } from "@/lib/server/session";

/**
 * Validates strictly that the current request session belongs to Super Admin.
 * Super Admin sessions must have:
 * 1. portal === "admin"
 * 2. !!session.portalToken
 */
export async function requireAdminSession() {
  const session = await getSession();

  const isAdmin =
    session?.portal === "admin" &&
    !!session?.portalToken;

  if (!isAdmin) {
    return null;
  }

  return session;
}
