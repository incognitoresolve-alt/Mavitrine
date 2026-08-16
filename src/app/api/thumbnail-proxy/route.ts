import { NextRequest, NextResponse } from "next/server";

const VIDEO_ID_PATTERN = /^[\w-]{6,15}$/;

/**
 * Sert une vignette YouTube depuis notre propre origine, pour pouvoir la
 * dessiner sur un <canvas> sans le "tainter" (i.ytimg.com n'envoie pas
 * d'en-têtes CORS permissifs) — utilisé par la génération d'images de
 * partage (story).
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!VIDEO_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "ID vidéo invalide." }, { status: 400 });
  }

  const upstream = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, {
    next: { revalidate: 86400 },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Vignette introuvable." },
      { status: 404 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
