import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/server/session";
import { buildWpUrl } from "@/lib/server/wordpress";

export async function POST() {
  try {
    const session = await getSession();

    if (session?.portalToken) {
      try {
        const logoutUrl = await buildWpUrl("/wowcar-admin/v1/logout");
        await fetch(logoutUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.portalToken}`,
            "X-WowCar-Portal-Token": session.portalToken,
            "Accept": "application/json",
          },
          cache: "no-store",
        });
      } catch (err) {
        console.error("Remote WordPress logout notification failed:", err);
      }
    }
  } finally {
    await destroySession();
    return NextResponse.json({ success: true });
  }
}
