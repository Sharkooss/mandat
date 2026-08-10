import type { GameState } from "./types";
import type { Rng } from "./rng";
import { clamp } from "./ctx";
import { nomCompletDe } from "./noms";

// ---------------------------------------------------------------------------
// La presse comme rapport de force, pas comme jauge subie.
//
// La bienveillance de la presse ne dépendait que de ce que les événements lui
// faisaient : elle ne remontait jamais toute seule, et le contenu la faisait
// plus souvent baisser que monter. Un président finissait donc toujours par
// l'avoir contre lui, quoi qu'il fasse.
//
// Elle revient désormais vers une cible — et cette cible, on la travaille :
// trois journalistes ont une loyauté, on peut la cultiver, et un journaliste
// acquis rend des services qu'aucune jauge ne rend. Le prix est ailleurs :
// une rédaction qu'on tient est une rédaction qui demandera quelque chose.
// ---------------------------------------------------------------------------

/** Les trois voix qui font le climat : le magnat, l'enquêtrice, l'éditorialiste. */
export const PRESSE_IDS = ["rives", "ferrand", "bec"] as const;

/**
 * Au-delà, le journaliste est de votre côté et cela se voit dans le journal.
 * Le seuil est calé sur ce qu'un mandat entier de fréquentation assidue permet
 * d'atteindre : deux déjeuners et une exclusivité amènent l'éditorialiste,
 * l'enquêtrice ne s'achète pas et le magnat demande un pacte.
 */
export const SEUIL_ACQUIS = 58;
/** En dessous, il ne vous rate plus. */
export const SEUIL_HOSTILE = 24;

/** Trois renvois d'ascenseur en réserve au maximum : au-delà, ce n'est plus une faveur. */
export const FAVEURS_MAX = 3;

export type NiveauPresse = "acquis" | "bienveillant" | "neutre" | "hostile";

export interface RelationPresse {
  id: string;
  loyaute: number;
  rancune: number;
  niveau: NiveauPresse;
}

export function niveauPresse(loyaute: number, rancune: number): NiveauPresse {
  if (rancune >= 55) return "hostile";
  if (loyaute >= SEUIL_ACQUIS) return "acquis";
  if (loyaute >= 45) return "bienveillant";
  if (loyaute <= SEUIL_HOSTILE) return "hostile";
  return "neutre";
}

export function relationsPresse(s: GameState): RelationPresse[] {
  return PRESSE_IDS.filter((id) => s.characters[id]?.vivant).map((id) => {
    const c = s.characters[id];
    return { id, loyaute: c.loyaute, rancune: c.rancune, niveau: niveauPresse(c.loyaute, c.rancune) };
  });
}

/** Ceux qui vous sont acquis, du plus fidèle au moins fidèle. */
export function amisPresse(s: GameState): string[] {
  return relationsPresse(s)
    .filter((r) => r.niveau === "acquis")
    .sort((a, b) => b.loyaute - a.loyaute)
    .map((r) => r.id);
}

/**
 * Celui qui peut tenir un papier quarante-huit heures. Le magnat pèse plus
 * lourd que l'éditorialiste : il ne convainc pas une rédaction, il la possède.
 */
export function souffleur(s: GameState): string | null {
  const amis = amisPresse(s);
  if (amis.length === 0) return null;
  return amis.includes("rives") ? "rives" : amis[0];
}

/**
 * La cible vers laquelle la bienveillance revient d'elle-même. C'est le climat
 * de fond : ce que la profession pense de vous quand rien ne se passe.
 */
export function ciblePresse(s: GameState): number {
  let cible = 44;
  for (const r of relationsPresse(s)) {
    if (r.niveau === "acquis") cible += r.id === "rives" ? 11 : 8;
    else if (r.niveau === "bienveillant") cible += 2;
    else if (r.niveau === "hostile") cible -= r.id === "ferrand" ? 8 : 6;
  }
  cible += (s.player.integrite - 50) * 0.09;
  cible += (s.power.popularite - 45) * 0.1;
  cible -= s.derive * 1.4;
  cible -= Math.max(0, Math.abs(s.bord) - 4) * 1.2;
  // Un dossier public est un sujet qui ne se referme pas.
  cible -= (s.europe?.dossiers?.filter((d) => d.public).length ?? 0) * 3;
  return clamp(cible, 8, 92);
}

/**
 * Le retour lent vers la cible, à chaque fin de semestre. Assez lent pour
 * qu'un scandale pèse plusieurs semestres, assez net pour qu'un mandat entier
 * ne se joue pas sur une mauvaise passe du deuxième trimestre.
 */
export function driftPresse(s: GameState): void {
  const cible = ciblePresse(s);
  s.power.presse = clamp(s.power.presse + (cible - s.power.presse) * 0.2);
}

// ---------------------------------------------------------------------------
// Les renvois d'ascenseur
// ---------------------------------------------------------------------------

export function faveursPresse(s: GameState): number {
  return s.faveursPresse ?? 0;
}

/** Un service rendu se stocke — jusqu'à trois, pas plus. */
export function gagnerFaveur(s: GameState, n = 1): void {
  s.faveursPresse = Math.min(FAVEURS_MAX, faveursPresse(s) + n);
}

const RENVOIS: ((nom: string, motif: string) => string)[] = [
  (nom, motif) => `${nom} décroche avant vous : ${motif} passe en page sept, sans photo et sans nom dans le titre.`,
  (nom, motif) => `Un coup de fil suffit. ${nom} garde le papier « le temps de vérifier une source » — la vérification durera le temps qu'il faudra.`,
  (nom, motif) => `${nom} sort le même soir une enquête sur tout autre chose. ${motif.charAt(0).toUpperCase()}${motif.slice(1)} existe toujours, mais plus personne ne la lit.`,
  (nom, motif) => `${nom} accepte de traiter ${motif} « en contexte ». En contexte, c'est-à-dire noyé.`,
];

/**
 * Consomme un renvoi d'ascenseur et rend la phrase à insérer dans le récit.
 * Rend null si personne ne vous doit rien : le contenu doit toujours prévoir
 * le cas, une faveur ne se garantit pas.
 */
export function consommerFaveur(s: GameState, motif: string, rng: Rng): string | null {
  if (faveursPresse(s) <= 0) return null;
  const ami = souffleur(s);
  if (!ami) return null;
  s.faveursPresse = faveursPresse(s) - 1;
  const c = s.characters[ami];
  // Un service rendu se paie en petite monnaie : on use la relation.
  if (c) c.loyaute = clamp(c.loyaute - 5);
  s.power.presse = clamp(s.power.presse + 3);
  s.log.push({ turn: s.turnCount, text: `${nomCompletDe(s, ami)} a enterré un sujet pour vous.` });
  return rng.pick(RENVOIS)(nomCompletDe(s, ami), motif);
}

/**
 * Le filet passif : un journaliste acquis n'attend pas qu'on lui demande, il
 * traite simplement autrement. Rend la phrase d'atténuation, ou null.
 */
export function adoucirUne(s: GameState, rng: Rng): string | null {
  const ami = souffleur(s);
  if (!ami) return null;
  const force = s.characters[ami].loyaute >= 80 ? 0.6 : 0.4;
  if (!rng.chance(force)) return null;
  return `Le sujet du jour aurait dû être vous. ${nomCompletDe(s, ami)} a ouvert sur autre chose — personne ne saura jamais que c'était un choix.`;
}
