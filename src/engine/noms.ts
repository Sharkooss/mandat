import type { CharacterDef, GameState } from "./types";
import type { Rng } from "./rng";
import {
  CAST,
  NOMS,
  NOMS_ALLEMAGNE,
  NOMS_MAGHREB,
  PRENOMS_F,
  PRENOMS_F_MAGHREB,
  PRENOMS_F_ALLEMAGNE,
  PRENOMS_M,
  PRENOMS_M_ALLEMAGNE,
  PRENOMS_M_MAGHREB,
  VIVIERS_ETRANGERS,
} from "../content/france/data";

// ---------------------------------------------------------------------------
// Le casting change de visage à chaque partie.
//
// Les fonctions, les biais, les ambitions et les rancunes sont écrits dans le
// contenu et ne bougent pas : c'est ce qui fait la cohérence du jeu. Seuls les
// noms sont tirés au sort, au démarrage, une fois pour toutes.
//
// Les textes du contenu, eux, continuent d'écrire « Rochefort » ou « Camille
// Roze » : ces noms de référence servent de gabarit, et la substitution se
// fait au moment de l'affichage. Aucun texte à réécrire, et un contenu qui
// reste lisible quand on l'édite.
//
// Le genre, lui, ne bouge jamais : « la Première ministre », « elle s'est
// inclinée », « un garçon de votre âge » sont en dur dans des centaines de
// phrases. Tirer le genre au sort casserait la moitié de la prose.
// ---------------------------------------------------------------------------

export interface NomTire {
  prenom: string;
  nom: string;
}

function viviers(def: CharacterDef): { prenoms: readonly string[]; noms: readonly string[] } {
  switch (def.registre) {
    case "allemagne":
      return { prenoms: def.genre === "f" ? PRENOMS_F_ALLEMAGNE : PRENOMS_M_ALLEMAGNE, noms: NOMS_ALLEMAGNE };
    case "maghreb":
      return { prenoms: def.genre === "f" ? PRENOMS_F_MAGHREB : PRENOMS_M_MAGHREB, noms: NOMS_MAGHREB };
    case undefined:
      return { prenoms: def.genre === "f" ? PRENOMS_F : PRENOMS_M, noms: NOMS };
    default: {
      // Les capitales étrangères ont chacune leur vivier — un premier ministre
      // hongrois qui s'appellerait Vasseur ferait sortir du jeu.
      const v = VIVIERS_ETRANGERS[def.registre];
      if (!v) return { prenoms: def.genre === "f" ? PRENOMS_F : PRENOMS_M, noms: NOMS };
      return { prenoms: def.genre === "f" ? v.f : v.m, noms: v.noms };
    }
  }
}

/**
 * Rebaptise tout le casting. Aucun patronyme n'est servi deux fois : deux
 * ministres homonymes seraient une plaisanterie, pas une partie.
 */
export function genererNoms(rng: Rng, dejaPris: readonly string[] = []): Record<string, NomTire> {
  const nomsPris = new Set(dejaPris);
  const prenomsPris = new Set<string>();
  const out: Record<string, NomTire> = {};

  for (const def of CAST) {
    if (def.id === "conjoint") continue; // le conjoint est nommé par la biographie
    const { prenoms, noms } = viviers(def);
    const nomsLibres = noms.filter((n) => !nomsPris.has(n));
    const prenomsLibres = prenoms.filter((p) => !prenomsPris.has(p));
    const nom = rng.pick(nomsLibres.length > 0 ? nomsLibres : noms);
    const prenom = rng.pick(prenomsLibres.length > 0 ? prenomsLibres : prenoms);
    nomsPris.add(nom);
    prenomsPris.add(prenom);
    out[def.id] = { prenom, nom };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

function majuscule(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function tire(s: GameState, id: string): NomTire | null {
  const t = s.castNames?.[id];
  return t && t.nom ? t : null;
}

/** Le patronyme seul — la forme la plus courante dans les textes. */
export function nomDe(s: GameState, id: string): string {
  if (id === "conjoint") return s.bio.conjointPrenom || "—";
  const t = tire(s, id);
  if (t) return t.nom;
  const def = CAST.find((c) => c.id === id);
  return def ? def.nom.split(" ").slice(-1)[0] : id;
}

/**
 * Prénom et nom, avec le titre éventuel — la forme des présentations. Le titre
 * prend la majuscule : cette forme n'apparaît jamais au fil d'une phrase, mais
 * en tête de fiche, de liste ou de signature.
 */
export function nomCompletDe(s: GameState, id: string): string {
  if (id === "conjoint") return s.bio.conjointPrenom || "—";
  const def = CAST.find((c) => c.id === id);
  const t = tire(s, id);
  const base = t ? `${t.prenom} ${t.nom}` : (def?.nom ?? id);
  return def?.titre ? `${majuscule(def.titre)} ${base}` : base;
}

// ---------------------------------------------------------------------------
// Substitution dans les textes
// ---------------------------------------------------------------------------

type Forme = "titre_complet" | "complet" | "titre_nom" | "nom" | "prenom";

interface Motif {
  source: string; // ce qu'écrit le contenu
  id: string;
  forme: Forme;
}

function echappe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Toutes les formes sous lesquelles le contenu peut désigner un personnage.
 * Construit une fois : la liste ne dépend que du casting.
 */
const MOTIFS: Motif[] = (() => {
  const out: Motif[] = [];
  for (const def of CAST) {
    if (def.id === "conjoint") continue;
    const morceaux = def.nom.split(" ");
    const patronyme = morceaux[morceaux.length - 1];
    const complet = def.nom;
    if (def.titre) {
      out.push({ source: `${def.titre} ${complet}`, id: def.id, forme: "titre_complet" });
      out.push({ source: `${majuscule(def.titre)} ${complet}`, id: def.id, forme: "titre_complet" });
      out.push({ source: `${def.titre} ${patronyme}`, id: def.id, forme: "titre_nom" });
      out.push({ source: `${majuscule(def.titre)} ${patronyme}`, id: def.id, forme: "titre_nom" });
    }
    if (complet !== patronyme) out.push({ source: complet, id: def.id, forme: "complet" });
    out.push({ source: patronyme, id: def.id, forme: "nom" });
    for (const a of def.alias ?? []) out.push({ source: a, id: def.id, forme: "prenom" });
  }
  // Les formes longues d'abord : « général Paul Verdier » avant « Verdier ».
  return out.sort((a, b) => b.source.length - a.source.length);
})();

const REGEX_MOTIFS = new RegExp(`(?<![\\p{L}-])(${MOTIFS.map((m) => echappe(m.source)).join("|")})(?![\\p{L}-])`, "gu");

function rendu(s: GameState, motif: Motif): string {
  const def = CAST.find((c) => c.id === motif.id)!;
  const t = tire(s, motif.id);
  if (!t) return motif.source;
  switch (motif.forme) {
    case "prenom":
      return t.prenom;
    case "nom":
      return t.nom;
    case "complet":
      return `${t.prenom} ${t.nom}`;
    case "titre_nom":
      return `${def.titre} ${t.nom}`;
    case "titre_complet":
      return `${def.titre} ${t.prenom} ${t.nom}`;
  }
}

/**
 * Remplace les noms de référence du contenu par ceux de la partie en cours.
 * Un seul passage, formes longues d'abord : on ne peut pas réécrire deux fois
 * le même fragment, et un nom fraîchement posé ne peut pas être repris pour
 * quelqu'un d'autre.
 */
export function substituerNoms(texte: string, s: GameState | null | undefined): string {
  if (!texte || !s?.castNames) return texte;
  return texte.replace(REGEX_MOTIFS, (trouve) => {
    const motif = MOTIFS.find((m) => m.source === trouve);
    // La majuscule initiale du contenu fait foi : « Général » en début de phrase.
    if (!motif) return trouve;
    const remplace = rendu(s, motif);
    return /^\p{Lu}/u.test(trouve) ? majuscule(remplace) : remplace;
  });
}

/** Les alias à repérer dans les textes déjà substitués, pour la colorisation. */
export function aliasAffiches(s: GameState): { alias: string; id: string }[] {
  const out: { alias: string; id: string }[] = [];
  for (const def of CAST) {
    if (def.id === "conjoint") continue;
    const t = tire(s, def.id);
    if (!t) continue;
    out.push({ alias: `${t.prenom} ${t.nom}`, id: def.id });
    out.push({ alias: t.nom, id: def.id });
    if (def.alias?.length) out.push({ alias: t.prenom, id: def.id });
  }
  if (s.bio.conjointPrenom) out.push({ alias: s.bio.conjointPrenom, id: "conjoint" });
  return out;
}
