import { NextRequest, NextResponse } from "next/server";
import { getVideoStats } from "@/lib/youtube";

const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
// L'API YouTube elle-même plafonne les requêtes multi-ID à 50 : on applique
// la même limite ici pour éviter qu'une requête abusive ne gonfle inutilement
// notre usage de quota côté serveur.
const MAX_IDS = 50;

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter((id) => VIDEO_ID_PATTERN.test(id))
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ configured: false, videos: [] });
  }

  const stats = await getVideoStats(ids);

  return NextResponse.json({
    configured: stats.size > 0,
    videos: Array.from(stats.values()),
  });
}
