import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminPost, wordpressAdminPostFormData, WordPressApiError } from "@/lib/server/wordpress";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

    // Super Admin / Non-dealer fallback
    let data: any;
    if (isMultipart) {
      const formData = await request.formData();
      data = await wordpressAdminPostFormData(
        `/wowcar/v1/update-listing/${resolvedParams.id}`,
        formData
      );
    } else {
      const body = await request.json();
      data = await wordpressAdminPost(
        `/wowcar/v1/update-listing/${resolvedParams.id}`,
        body
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update listing." },
      { status }
    );
  }
}

