import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminDelete, WordPressApiError } from "@/lib/server/wordpress";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;

    // Super Admin fallback
    const data = await wordpressAdminDelete(
      `/wowcar/v1/trash-listing/${resolvedParams.id}`
    );
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to move listing to trash." },
      { status }
    );
  }
}

