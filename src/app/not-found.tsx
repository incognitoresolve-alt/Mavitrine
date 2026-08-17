import Link from "next/link";
import { siteConfig } from "@/lib/config";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold uppercase tracking-wide text-faint">
        Erreur 404
      </p>
      <h1 className="text-2xl font-bold">Ce morceau n&apos;existe pas (ou plus)</h1>
      <p className="max-w-sm text-sm text-muted">
        Le lien que vous avez suivi est peut-être incorrect ou la vidéo a été
        retirée de la chaîne YouTube.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
      >
        Retour à {siteConfig.name}
      </Link>
    </div>
  );
}
