import { NextResponse } from "next/server";
import { wordpressAdminPost, WordPressApiError } from "@/lib/server/wordpress";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await wordpressAdminPost("/wowcar-admin/v1/send", body);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
