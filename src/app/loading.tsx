/** Squelette de l'accueil pendant le chargement des données YouTube. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="flex items-center gap-6 p-4 sm:p-6">
        <div className="h-20 w-20 shrink-0 rounded-full bg-surface-strong sm:h-24 sm:w-24" />
        <div className="flex flex-1 justify-around">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-5 w-10 rounded bg-surface-strong" />
              <div className="h-3 w-14 rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 px-4 sm:px-6">
        <div className="h-5 w-40 rounded bg-surface-strong" />
        <div className="h-4 w-64 rounded bg-surface" />
        <div className="mt-2 h-10 w-full rounded-lg bg-surface-strong" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-0.5 px-2 sm:gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-square bg-surface-strong" />
        ))}
      </div>
    </div>
  );
}
