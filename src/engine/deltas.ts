import type { GameState } from "./types";

// ---------------------------------------------------------------------------
// Le retour visuel : ce qui a bougé après une décision, et de combien.
// Les jauges cachées ne produisent JAMAIS de delta chiffré — au mieux une
// alerte qualitative ("quelque chose s'est tendu").
// ---------------------------------------------------------------------------

export interface Delta {
  label: string;
  value: number;
  /** Domaine sémantique, pour la couleur. */
  domaine: "eco" | "social" | "securite" | "environnement" | "monde" | "pouvoir" | "perso";
  /** true quand une hausse est une mauvaise nouvelle (chômage, dette…). */
  inverse?: boolean;
  suffix?: string;
}

export interface Snapshot {
  country: GameState["country"];
  power: GameState["power"];
  player: GameState["player"];
  hidden: GameState["hidden"];
  derive: number;
  segments: Record<string, number>;
}

export function snapshot(s: GameState): Snapshot {
  const segments: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.segments)) segments[k] = v.soutien;
  return {
    country: { ...s.country },
    power: { ...s.power },
    player: { ...s.player },
    hidden: { ...s.hidden },
    derive: s.derive,
    segments,
  };
}

const META: Record<string, { label: string; domaine: Delta["domaine"]; inverse?: boolean; suffix?: string; seuil?: number }> = {
  // pays
  croissance: { label: "Croissance", domaine: "eco", suffix: " pt", seuil: 0.15 },
  chomage: { label: "Chômage", domaine: "eco", inverse: true, suffix: " pt", seuil: 0.15 },
  inflation: { label: "Inflation", domaine: "eco", inverse: true, suffix: " pt", seuil: 0.15 },
  dette: { label: "Dette", domaine: "eco", inverse: true, suffix: " pt", seuil: 0.6 },
  marge: { label: "Marge budgétaire", domaine: "eco" },
  services: { label: "Services publics", domaine: "social" },
  securite: { label: "Sécurité", domaine: "securite" },
  environnement: { label: "Environnement", domaine: "environnement" },
  cohesion: { label: "Cohésion", domaine: "social" },
  prestige: { label: "Prestige", domaine: "monde" },
  // pouvoir
  popularite: { label: "Popularité", domaine: "pouvoir" },
  sieges: { label: "Sièges", domaine: "pouvoir" },
  parti: { label: "Parti", domaine: "pouvoir" },
  presse: { label: "Presse", domaine: "pouvoir" },
  armee: { label: "Armée", domaine: "securite" },
  patronat: { label: "Patronat", domaine: "eco" },
  syndicats: { label: "Syndicats", domaine: "social" },
  justice: { label: "Justice", domaine: "pouvoir" },
  // vous
  charisme: { label: "Charisme", domaine: "perso" },
  rhetorique: { label: "Rhétorique", domaine: "perso" },
  strategie: { label: "Stratégie", domaine: "perso" },
  integrite: { label: "Intégrité", domaine: "perso" },
  cynisme: { label: "Cynisme", domaine: "perso", inverse: true },
  endurance: { label: "Endurance", domaine: "perso" },
  reseau: { label: "Réseau", domaine: "perso" },
};

function push(out: Delta[], key: string, before: number, after: number): void {
  const m = META[key];
  if (!m) return;
  const diff = after - before;
  const seuil = m.seuil ?? 0.5;
  if (Math.abs(diff) < seuil) return;
  out.push({
    label: m.label,
    value: m.suffix ? Math.round(diff * 10) / 10 : Math.round(diff),
    domaine: m.domaine,
    inverse: m.inverse,
    suffix: m.suffix,
  });
}

/** Les variations chiffrées, triées par ampleur ressentie. */
export function computeDeltas(before: Snapshot, s: GameState, segmentNoms: Record<string, string>): Delta[] {
  const out: Delta[] = [];
  for (const k of Object.keys(before.country)) push(out, k, (before.country as never)[k], (s.country as never)[k]);
  for (const k of Object.keys(before.power)) push(out, k, (before.power as never)[k], (s.power as never)[k]);
  for (const k of Object.keys(before.player)) push(out, k, (before.player as never)[k], (s.player as never)[k]);

  // Les segments d'électorat : on ne montre que les mouvements notables.
  for (const [id, avant] of Object.entries(before.segments)) {
    const apres = s.segments[id]?.soutien ?? avant;
    const diff = apres - avant;
    if (Math.abs(diff) < 2) continue;
    out.push({ label: segmentNoms[id] ?? id, value: Math.round(diff), domaine: "social" });
  }

  out.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return out.slice(0, 8);
}

/** Les signaux qualitatifs : jamais de chiffre, jamais le nom de la jauge. */
export function computeSignals(before: Snapshot, s: GameState): string[] {
  const out: string[] = [];
  if (s.hidden.agitation - before.hidden.agitation >= 4) out.push("Le climat social s'est tendu.");
  else if (before.hidden.agitation - s.hidden.agitation >= 4) out.push("Le pays s'est apaisé.");
  if (s.hidden.fatigue - before.hidden.fatigue >= 5) out.push("Vous avez peu dormi.");
  else if (before.hidden.fatigue - s.hidden.fatigue >= 8) out.push("Vous vous sentez reposé.");
  if (s.hidden.coup - before.hidden.coup >= 4) out.push("Quelque chose s'est refermé du côté des casernes.");
  if (s.hidden.assassinat - before.hidden.assassinat >= 4) out.push("Votre service de protection a resserré le dispositif.");
  if (s.derive > before.derive) out.push("Un contre-pouvoir s'est effacé. Personne ne l'a relevé.");
  else if (s.derive < before.derive) out.push("Un contre-pouvoir a retrouvé de l'air.");
  return out;
}
