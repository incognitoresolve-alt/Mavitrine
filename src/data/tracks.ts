export type Track = {
  /** Identifiant unique, utilisé comme clé React et pour les ancres. */
  id: string;
  title: string;
  /** Courte description : style, prompt utilisé, IA employée, etc. */
  description: string;
  /** ID de la vidéo YouTube (la partie après ?v= dans l'URL). */
  youtubeId: string;
  /** Tags libres (genre musical, IA utilisée, ambiance...). */
  tags?: string[];
  /** Date de sortie au format ISO (AAAA-MM-JJ), utilisée pour trier. */
  releaseDate?: string;
};

/**
 * Ajoutez vos morceaux ici : chaque entrée devient une carte sur la page
 * d'accueil avec le lecteur YouTube intégré et le compteur de vues.
 */
export const tracks: Track[] = [
  {
    id: "exemple-01",
    title: "Titre de votre morceau",
    description:
      "Remplacez cette entrée par vos propres créations : décrivez le style, le prompt ou le modèle d'IA utilisé.",
    youtubeId: "dQw4w9WgXcQ",
    tags: ["Suno", "Pop", "IA"],
    releaseDate: "2026-01-01",
  },
];
