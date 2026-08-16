import { NextRequest, NextResponse } from "next/server";
import { getVideoStats } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ configured: false, videos: [] });
  }

  const stats = await getVideoStats(ids);

  return NextResponse.json({
    configured: stats.size > 0,
    videos: Array.from(stats.values()),
  });
}
