import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const serverPassword = process.env.API_CLEAN_PASSWORD;
  const clientPassword = request.nextUrl.searchParams.get("clean_password");
  const tag = request.nextUrl.searchParams.get("tag");
  if (!serverPassword) {
    return Response.json({ error: "Cache cleaning is not configured." }, { status: 503 });
  }
  if (serverPassword !== clientPassword) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  if (tag) {
    revalidateTag(tag, { expire: 0 });
    return Response.json(
      { revalidated: true, now: Date.now(), tag },
      { headers: { "Cache-Control": "no-store" } },
    );
  } else {
    revalidatePath("/", "layout");
    return Response.json(
      { revalidated: true, now: Date.now(), path: "/", type: "layout" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
