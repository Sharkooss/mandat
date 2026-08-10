import type { CharacterDef, GameState, Vendetta } from "./types";
import type { Rng } from "./rng";
import { CAST } from "../content/france/data";
import { nomCompletDe } from "./noms";

// ---------------------------------------------------------------------------
// Le fil rouge de la rancune.
//
// Une rancune élevée n'est pas un chiffre : c'est quelqu'un qui a du temps,
// des relations et une raison. Passé un seuil, elle se met en marche et suit
// quatre temps — la rupture, le recrutement, le dossier, le coup — à raison
// d'un tous les deux semestres environ.
//
// Chaque temps laisse une trace visible et offre une porte de sortie. Le
// joueur qui regarde son entourage peut désamorcer ; celui qui ne regarde que
// ses courbes découvre le fil au dernier moment.
// ---------------------------------------------------------------------------

/** Le seuil d'entrée en guerre. En dessous, on boude ; au-dessus, on agit. */
const SEUIL_DECLENCHEMENT = 62;
/** En dessous de ce seuil, la rancune retombe et le fil s'éteint. */
const SEUIL_ABANDON = 38;
/** Nombre de semestres entre deux étapes. */
const CADENCE = 2;

/** Ce dont chaque camp est capable — c'est le camp qui décide du dénouement. */
export type VendettaArme = "publication" | "motion" | "putsch" | "censure" | "greve" | "revelation";

const ARME_PAR_CAMP: Record<CharacterDef["camp"], VendettaArme> = {
  presse: "publication",
  gouvernement: "motion",
  parti: "motion",
  opposition: "censure",
  corps: "greve",
  institutions: "censure",
  intime: "revelation",
  etranger: "publication",
};

export function armeDe(id: string): VendettaArme {
  const def = CAST.find((c) => c.id === id);
  // Le chef d'état-major est le seul à disposer de l'argument décisif.
  if (id === "verdier") return "putsch";
  return def ? ARME_PAR_CAMP[def.camp] : "publication";
}

/** Le personnage a-t-il les moyens de nuire, au-delà de l'envie ? */
function capable(s: GameState, id: string): boolean {
  const c = s.characters[id];
  if (!c?.vivant || id === "conjoint") return false;
  const def = CAST.find((x) => x.id === id);
  if (!def) return false;
  // Un ministre limogé garde son carnet d'adresses ; un ami d'enfance, non.
  if (def.camp === "intime") return id !== "bensalah" || c.rancune >= 75;
  return true;
}

export interface EtapeInfo {
  titre: string;
  resume: string;
}

export const ETAPES: Record<number, EtapeInfo> = {
  1: { titre: "La rupture", resume: "Le silence s'est installé. Rien n'est encore engagé." },
  2: { titre: "Le recrutement", resume: "Des rendez-vous, des alliances. Le fil peut encore être coupé net." },
  3: { titre: "La préparation", resume: "Quelque chose est prêt. Il reste à choisir le moment." },
  4: { titre: "Le coup", resume: "C'est maintenant." },
};

/** L'événement à jouer pour une étape donnée. */
function evenementDe(etape: number): string | null {
  if (etape === 2) return "vendetta_recrutement";
  if (etape === 3) return "vendetta_preparation";
  if (etape === 4) return "vendetta_coup";
  return null;
}

/**
 * Fait vivre le fil rouge à chaque fin de semestre : ouverture, progression,
 * extinction. Ne déclenche jamais rien directement — elle arme des
 * événements, pour que tout se joue devant le joueur.
 */
export function progresserVendetta(s: GameState, rng: Rng): void {
  const v = s.vendetta;

  if (!v) {
    // Un seul fil à la fois : deux vengeances simultanées seraient illisibles.
    const candidats = Object.values(s.characters)
      .filter((c) => c.rancune >= SEUIL_DECLENCHEMENT && capable(s, c.id))
      .sort((a, b) => b.rancune - a.rancune);
    const cible = candidats[0];
    if (!cible) return;
    s.vendetta = { id: cible.id, etape: 1, depuis: s.turnCount, reperee: false };
    s.log.push({ turn: s.turnCount, text: `${nomCompletDe(s, cible.id)} a cessé de vous adresser la parole.` });
    return;
  }

  const perso = s.characters[v.id];
  if (!perso?.vivant || v.desamorcee) {
    s.vendetta = null;
    return;
  }
  // La rancune retombe : le fil s'éteint de lui-même, sans que personne
  // n'ait rien annoncé. C'est la récompense discrète de qui répare.
  if (perso.rancune < SEUIL_ABANDON) {
    s.log.push({ turn: s.turnCount, text: `${nomCompletDe(s, v.id)} a fini par passer à autre chose.` });
    s.vendetta = null;
    return;
  }
  if (s.turnCount - v.depuis < CADENCE) return;
  if (v.etape >= 4) return;

  // Une rancune brûlante avance plus vite ; une rancune tiède peut stagner.
  const elan = perso.rancune >= 80 ? 0.9 : perso.rancune >= 68 ? 0.7 : 0.45;
  if (!rng.chance(elan)) {
    v.depuis = s.turnCount - 1;
    return;
  }

  v.etape = (v.etape + 1) as Vendetta["etape"];
  v.depuis = s.turnCount;
  const ev = evenementDe(v.etape);
  if (ev) s.delayed.push({ eventId: ev, minTurn: s.turnCount + 1, maxTurn: s.turnCount + 2, chance: 1 });
}

/** Coupe le fil — réconciliation, achat, ou neutralisation. */
export function desamorcer(s: GameState, apaisement = 30): void {
  if (!s.vendetta) return;
  const c = s.characters[s.vendetta.id];
  if (c) c.rancune = Math.max(0, c.rancune - apaisement);
  s.vendetta.desamorcee = true;
}
