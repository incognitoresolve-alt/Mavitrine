import { NextResponse } from "next/server";
import { getChannelStats } from "@/lib/youtube";

export async function GET() {
  const stats = await getChannelStats();

  if (!stats) {
    return NextResponse.json(
      { configured: false, message: "YouTube API non configurée." },
      { status: 200 },
    );
  }

  return NextResponse.json({ configured: true, ...stats });
}
