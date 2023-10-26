import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const serverPassword = process.env.API_CLEAN_PASSWORD;
    const clientPassword = request.nextUrl.searchParams.get("clean_password");
    const tag = request.nextUrl.searchParams.get("tag");
    if (serverPassword !== clientPassword) {
        return Response.json({
            error: "Wrong password.",
            tips: "please set clean_password param to the password you set",
        });
    }
    if (tag) {
        revalidateTag(tag);
        return Response.json({ revalidated: true, now: Date.now(), tag: tag });
    } else {
        revalidatePath("/");
        return Response.json({ revalidated: true, now: Date.now(), path: "/" });
    }
}
