import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server/authGuard";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Forbidden", message: "Super Admin session required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "10";
    const make = searchParams.get("make");
    const rawLang = (searchParams.get("lang") || "english").toLowerCase();
    const allowedLangs: Record<string, string> = {
      en: "english",
      th: "thai",
      zh: "chinese",
      english: "english",
      thai: "thai",
      chinese: "chinese",
    };
    const lang = allowedLangs[rawLang] || "english";

    let query = `?per_page=${encodeURIComponent(perPage)}&page=${encodeURIComponent(page)}&lang=${lang}`;
    if (search) {
      query += `&search=${encodeURIComponent(search)}`;
    }
    if (make && make !== "all") {
      query += `&make=${encodeURIComponent(make)}`;
    }

    const data = await wordpressAdminGet(`/listivo/v1/all-listings${query}`);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
