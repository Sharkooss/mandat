import type { Dossier, Enquete, EuropeState, GameState, NationDef, NationState } from "./types";
import type { Rng } from "./rng";
import { NATIONS } from "../content/france/data";
import { clamp } from "./ctx";

// ---------------------------------------------------------------------------
// Le second plateau.
//
// Trois idées, et tout le reste en découle :
//
// 1. Une capitale ne vous suit pas par amitié. Elle vous suit quand sa ligne
//    est proche de la vôtre, quand vous ne lui coûtez rien, et quand vous
//    pesez. Déplacer votre curseur politique redessine donc la carte de vos
//    alliances sans que vous ayez rien demandé.
// 2. Leurs électeurs votent aussi. Une élection à l'étranger peut vous prendre
//    votre meilleur allié et vous rendre un adversaire — ou l'inverse.
// 3. Ce qu'on fait dans l'arrière-cuisine laisse une trace. Les dossiers ne
//    disparaissent pas : ils s'enterrent, et ce qui est enterré ressort.
// ---------------------------------------------------------------------------

export const SEUIL_ALLIE = 35;
export const SEUIL_HOSTILE = -25;
/** Au-delà, quelqu'un finit par ouvrir une enquête. */
const SEUIL_ENQUETE = 52;
/** Semestres entre deux étapes de l'enquête européenne. */
const CADENCE_ENQUETE = 2;

export function nationsDef(): NationDef[] {
  return NATIONS;
}

export function defDe(id: string): NationDef | undefined {
  return NATIONS.find((n) => n.id === id);
}

export function etatInitial(): EuropeState {
  const nations: Record<string, NationState> = {};
  for (const d of NATIONS) {
    // Personne ne commence hostile : on hérite d'un capital de sympathie que
    // la fonction procure, et qu'on dilapide ensuite à sa guise.
    nations[d.id] = { id: d.id, relation: d.institution ? 20 : 25 - Math.abs(d.bord) * 2, bord: d.bord, faveurs: 0, savoir: 0 };
  }
  return { nations, dossiers: [], enquete: null, prochaineElection: 3 };
}

// ---------------------------------------------------------------------------
// Ce qu'une capitale pense de vous
// ---------------------------------------------------------------------------

/**
 * Vers quoi la relation tend, toutes choses égales. On n'y arrive jamais tout
 * à fait : la relation glisse vers cette cible, ce qui laisse le temps de voir
 * venir et de corriger.
 */
export function affinite(s: GameState, def: NationDef, st: NationState): number {
  // La proximité idéologique fait l'essentiel. Onze crans d'écart, et il n'y a
  // plus de sommet qui tienne.
  let cible = 55 - Math.abs(s.bord - st.bord) * 5.5;

  // La dérive autoritaire ne se juge pas partout de la même façon.
  if (def.institution || def.traits.includes("federaliste")) cible -= s.derive * 4.4;
  else if (def.traits.includes("souverainiste")) cible += s.derive * 1.6;
  else cible -= s.derive * 1.8;

  // Une France à l'extrême inquiète jusqu'à ceux qui pensent comme elle : un
  // allié idéologique reste un voisin, et un voisin de cette taille qui part
  // très loin dans une direction est d'abord un problème de sécurité.
  if (!def.traits.includes("souverainiste")) cible -= Math.max(0, Math.abs(s.bord) - 5) * 4.5;
  else cible -= Math.max(0, Math.abs(s.bord) - 8) * 3;

  // Les frugales comptent votre dette avant de compter sur vous.
  if (def.traits.includes("frugale")) cible -= Math.max(0, s.country.dette - 115) * 0.32;
  // Les industrielles regardent si vous êtes un débouché ou un concurrent.
  if (def.traits.includes("industrielle")) cible += (s.country.croissance - 1) * 3;
  // Les atlantistes se méfient d'une France qui parle trop fort toute seule.
  if (def.traits.includes("atlantiste")) cible -= Math.max(0, s.country.influence - 65) * 0.25;

  cible += (s.country.prestige - 50) * 0.3;
  cible += st.faveurs * 0.4;
  // Ce qu'elles savent de vos arrière-cuisines ne les rapproche jamais.
  cible -= st.savoir * 0.35;

  return clamp(cible, -100, 100);
}

/** Le poids, en pourcentage du Conseil, de ceux qui vous suivraient aujourd'hui. */
export function majorite(s: GameState): number {
  let pour = 0;
  let total = 0;
  for (const def of NATIONS) {
    if (def.institution || def.horsUnion) continue;
    total += def.poids;
    const st = s.europe.nations[def.id];
    if (!st) continue;
    // Une capitale tiède ne bloque pas, mais elle ne porte pas non plus.
    if (st.relation >= SEUIL_ALLIE) pour += def.poids;
    else if (st.relation > SEUIL_HOSTILE) pour += def.poids * 0.25;
  }
  // La France pèse pour elle-même : c'est le seul vote qu'on ne négocie pas.
  const soi = 90;
  return Math.round(((pour + soi) / (total + soi)) * 100);
}

export function alliees(s: GameState): NationDef[] {
  return NATIONS.filter((d) => (s.europe.nations[d.id]?.relation ?? 0) >= SEUIL_ALLIE);
}

export function hostiles(s: GameState): NationDef[] {
  return NATIONS.filter((d) => (s.europe.nations[d.id]?.relation ?? 0) <= SEUIL_HOSTILE);
}

/** Celle qui en sait le plus et vous aime le moins — le danger, nommé. */
export function menaceExterieure(s: GameState): NationDef | null {
  const candidates = NATIONS.map((d) => ({ d, st: s.europe.nations[d.id] }))
    .filter((x) => x.st && x.st.savoir >= 35 && x.st.relation < 0)
    .sort((a, b) => b.st!.savoir - a.st!.savoir);
  return candidates[0]?.d ?? null;
}

// ---------------------------------------------------------------------------
// Les dossiers
// ---------------------------------------------------------------------------

export function ouvrirDossier(s: GameState, id: string, titre: string, gravite: number): void {
  const existant = s.europe.dossiers.find((d) => d.id === id);
  if (existant) {
    // Recommencer, c'est aggraver : le second montage prouve que le premier
    // n'était pas un accident.
    existant.gravite = clamp(existant.gravite + Math.round(gravite * 0.6), 0, 100);
    existant.etouffe = false;
    return;
  }
  s.europe.dossiers.push({ id, titre, turn: s.turnCount, gravite: clamp(gravite, 0, 100) });
}

export function dossierDe(s: GameState, id: string): Dossier | undefined {
  return s.europe.dossiers.find((d) => d.id === id);
}

/** Les dossiers qui peuvent encore éclater — les enterrés comptent à moitié. */
export function dossiersActifs(s: GameState): Dossier[] {
  return s.europe.dossiers.filter((d) => !d.public);
}

export function pressionDossiers(s: GameState): number {
  return s.europe.dossiers.reduce((n, d) => {
    if (d.public) return n;
    return n + d.gravite * (d.etouffe ? 0.35 : 1);
  }, 0);
}

/** Enterrer coûte cher et ne détruit rien : la gravité reste, la trace dort. */
export function etoufferDossier(s: GameState, id: string): boolean {
  const d = dossierDe(s, id);
  if (!d || d.public) return false;
  d.etouffe = true;
  return true;
}

// ---------------------------------------------------------------------------
// L'enquête européenne — le pendant institutionnel de la vendetta
// ---------------------------------------------------------------------------

export interface EtapeEnquete {
  titre: string;
  resume: string;
}

export const ETAPES_ENQUETE: Record<number, EtapeEnquete> = {
  1: { titre: "Le signalement", resume: "Une cellule anti-fraude a transmis une note. Personne n'est encore saisi." },
  2: { titre: "La saisine", resume: "Le parquet européen a ouvert. À partir d'ici, la France n'est plus seule maîtresse du dossier." },
  3: { titre: "Les perquisitions", resume: "Des scellés ont été posés. Ce qui est saisi ne se négocie plus." },
  4: { titre: "Les réquisitions", resume: "L'accusation est écrite. Il ne reste que la date." },
};

function evenementEnquete(etape: number): string | null {
  if (etape === 2) return "enquete_saisine";
  if (etape === 3) return "enquete_perquisition";
  if (etape === 4) return "enquete_requisitions";
  return null;
}

/**
 * L'enquête ne naît pas d'une rancune mais d'une trace. Elle est donc plus
 * lente, plus sourde, et beaucoup plus difficile à désamorcer : on n'apaise
 * pas une procédure, on ne peut que la retarder ou l'étouffer — et étouffer
 * un parquet européen est en soi un dossier de plus.
 */
export function progresserEnquete(s: GameState, rng: Rng): void {
  const e = s.europe.enquete;

  if (!e) {
    if (s.hidden.soupcons < SEUIL_ENQUETE) return;
    const cible = dossiersActifs(s)
      .filter((d) => !d.etouffe)
      .sort((a, b) => b.gravite - a.gravite)[0];
    if (!cible) return;
    s.europe.enquete = { etape: 1, depuis: s.turnCount, dossier: cible.id };
    s.delayed.push({ eventId: "enquete_signalement", minTurn: s.turnCount + 1, maxTurn: s.turnCount + 2, chance: 1 });
    s.log.push({ turn: s.turnCount, text: `Une cellule anti-fraude européenne s'est intéressée à ${cible.titre.toLowerCase()}.` });
    return;
  }

  if (e.enterree) return;
  if (s.turnCount - e.depuis < CADENCE_ENQUETE) return;
  if (e.etape >= 4) return;

  // Une justice sereine et une presse tenue ralentissent tout. Ce n'est pas
  // moral, c'est mécanique : il faut quelqu'un pour transmettre les pièces.
  const frein = s.power.justice * 0.004 + Math.max(0, s.power.presse - 55) * 0.003;
  const elan = clamp(0.55 + s.hidden.soupcons * 0.005 - frein, 0.1, 0.95);
  if (!rng.chance(elan)) {
    e.depuis = s.turnCount - 1;
    return;
  }

  e.etape = (e.etape + 1) as Enquete["etape"];
  e.depuis = s.turnCount;
  const ev = evenementEnquete(e.etape);
  if (ev) s.delayed.push({ eventId: ev, minTurn: s.turnCount + 1, maxTurn: s.turnCount + 2, chance: 1 });
}

// ---------------------------------------------------------------------------
// La dérive semestrielle du plateau
// ---------------------------------------------------------------------------

/** Une élection à l'étranger : le plateau se redessine sans vous consulter. */
function electionEtrangere(s: GameState, rng: Rng): void {
  if (s.turnCount < s.europe.prochaineElection) return;
  s.europe.prochaineElection = s.turnCount + rng.int(2, 4);

  const candidates = NATIONS.filter((d) => !d.institution);
  const def = rng.pick(candidates);
  const st = s.europe.nations[def.id];
  if (!st) return;

  const avant = st.bord;
  // Un pays sortant peut confirmer sa ligne, l'infléchir, ou basculer d'un
  // bloc à l'autre. Le troisième cas est rare et change tout.
  const bascule = rng.chance(0.28);
  const ecart = bascule ? rng.int(5, 9) * (st.bord > 0 ? -1 : 1) : rng.int(-3, 3);
  st.bord = clamp(st.bord + ecart, -10, 10);
  // Un nouveau gouvernement repart d'une page à moitié blanche : les faveurs
  // consenties au précédent ne se transmettent pas.
  st.faveurs = Math.round(st.faveurs * 0.3);
  st.relation = Math.round(st.relation * 0.55);

  s.flags["election_etrangere"] = def.id;
  s.flags["election_etrangere_ecart"] = st.bord - avant;
  s.delayed.push({ eventId: "europe_election", minTurn: s.turnCount + 1, maxTurn: s.turnCount + 1, chance: 1 });
}

export function driftEurope(s: GameState, rng: Rng): void {
  for (const def of NATIONS) {
    const st = s.europe.nations[def.id];
    if (!st) continue;
    const cible = affinite(s, def, st);
    st.relation = clamp(st.relation + (cible - st.relation) * 0.22 + (rng.next() - 0.5) * 3, -100, 100);
    // Les faveurs se périment : un service rendu il y a trois ans ne vaut plus
    // grand-chose, dans un sens comme dans l'autre.
    st.faveurs = Math.round(st.faveurs * 0.88);
    // Ce qu'on sait ne s'oublie pas, mais les gens qui le savaient changent
    // de poste.
    if (st.savoir > 0) st.savoir = clamp(st.savoir - 0.6, 0, 100);
  }

  // L'influence : le prestige et le nombre d'alliés, moins ce qu'on doit.
  const poidsAllies = alliees(s).reduce((n, d) => n + d.poids, 0);
  const cibleInfluence =
    28 +
    poidsAllies * 0.13 +
    (s.country.prestige - 50) * 0.35 -
    hostiles(s).reduce((n, d) => n + d.poids, 0) * 0.08 -
    Math.max(0, Math.abs(s.bord) - 6) * 4;
  s.country.influence = clamp(s.country.influence + (cibleInfluence - s.country.influence) * 0.25);

  // Les soupçons montent avec ce qu'on a laissé derrière soi, et avec le
  // nombre de gens à l'étranger qui en savent quelque chose.
  const su = Object.values(s.europe.nations).reduce((n, st) => n + st.savoir, 0);
  const montee = pressionDossiers(s) * 0.045 + su * 0.02 - (s.power.justice - 50) * 0.02;
  s.hidden.soupcons = clamp(s.hidden.soupcons + (montee > 0.2 ? montee : -1.2));

  electionEtrangere(s, rng);
  progresserEnquete(s, rng);
}
