import { NextResponse } from "next/server";
import { wordpressAdminPostFormData, WordPressApiError } from "@/lib/server/wordpress";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const wpResponse: any = await wordpressAdminPostFormData("/wowcar/v1/profile/image", formData);
    return NextResponse.json(wpResponse);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to upload profile image." },
      { status }
    );
  }
}
