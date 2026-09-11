import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminPostFormData, WordPressApiError } from "@/lib/server/wordpress";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const formData = await request.formData();

    // Super Admin / Non-dealer fallback
    const data = await wordpressAdminPostFormData("/wowcar/v1/create-listing", formData);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Failed to create listing." }, { status });
  }
}

