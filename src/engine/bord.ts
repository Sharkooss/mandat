import type { GameState } from "./types";

// ---------------------------------------------------------------------------
// La ligne politique : −10 (gauche révolutionnaire) à +10 (droite identitaire).
//
// Contrairement à la dérive autoritaire, qui se subit, la ligne s'assume : elle
// est affichée, elle décide de qui vous aime, et surtout elle ouvre des pans
// entiers de contenu. Chaque extrême a ses maux propres — la gauche radicale
// attire la violence politique et la fuite des capitaux, la droite nationale
// paie en environnement, en rang international et en paix civile.
// ---------------------------------------------------------------------------

export interface BordPalier {
  /** Borne haute incluse de ce palier. */
  max: number;
  id: string;
  label: string;
  /** Étiquette courte pour les bandeaux et les tags. */
  court: string;
  tone: string;
  /** Ce que la ligne fait au pays, en une phrase. */
  resume: string;
}

export const BORD_PALIERS: BordPalier[] = [
  {
    max: -8,
    id: "revolutionnaire",
    label: "Gauche révolutionnaire",
    court: "Révolution",
    tone: "var(--color-bad)",
    resume: "Rupture assumée avec le capital. Les marchés fuient, les milices s'arment, la rue est à vous.",
  },
  {
    max: -5,
    id: "gauche_radicale",
    label: "Gauche radicale",
    court: "Gauche radicale",
    tone: "var(--color-pouvoir)",
    resume: "Nationalisations, partage, bras de fer permanent avec Bruxelles et le patronat.",
  },
  {
    max: -2,
    id: "gauche",
    label: "Gauche sociale",
    court: "Gauche",
    tone: "var(--color-pouvoir)",
    resume: "Services publics, salaires, protection. Cher, populaire, contesté par les marchés.",
  },
  {
    max: 1,
    id: "centre",
    label: "Centre",
    court: "Centre",
    tone: "var(--color-r-commune)",
    resume: "Ni l'un ni l'autre. Confortable tant que le pays va bien, intenable dès qu'il gronde.",
  },
  {
    max: 4,
    id: "droite",
    label: "Droite libérale",
    court: "Droite",
    tone: "var(--color-secu)",
    resume: "Travail, entreprise, ordre. Le patronat suit, les syndicats décrochent.",
  },
  {
    max: 7,
    id: "droite_nationale",
    label: "Droite nationale",
    court: "Droite nationale",
    tone: "var(--color-secu)",
    resume: "Frontières, autorité, souveraineté. L'environnement et le rang international paient l'addition.",
  },
  {
    max: 10,
    id: "identitaire",
    label: "Droite identitaire",
    court: "Identitaire",
    tone: "var(--color-bad)",
    resume: "Préférence nationale, épuration administrative, isolement diplomatique. Les quartiers brûlent.",
  },
];

export function bordMeta(bord: number): BordPalier {
  return BORD_PALIERS.find((p) => bord <= p.max) ?? BORD_PALIERS[BORD_PALIERS.length - 1];
}

/** −1 à gauche, 0 au centre, +1 à droite. */
export function bordCote(bord: number): -1 | 0 | 1 {
  if (bord <= -2) return -1;
  if (bord >= 2) return 1;
  return 0;
}

/** Un bord marqué (≥ 5 en valeur absolue) ouvre le contenu radical. */
export function bordRadical(s: GameState): boolean {
  return Math.abs(s.bord) >= 5;
}

/** Le seuil au-delà duquel la bascule autoritaire devient possible. */
export function bordExtreme(s: GameState): boolean {
  return Math.abs(s.bord) >= 8;
}

// Les segments qui suivent chaque camp. Le périurbain est absent des deux
// listes : c'est le segment pivot, il ne se donne à personne durablement.
export const SEGMENTS_GAUCHE = ["public", "jeunes", "urbains", "quartiers"];
export const SEGMENTS_DROITE = ["retraites", "pavillonnaires", "independants", "csp", "ruraux"];
