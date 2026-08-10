import type { CheckPlan, CheckRang, Choice, GameEvent, GameState, PlayerStats } from "./types";
import type { Rng } from "./rng";
import { clamp } from "./ctx";

// ---------------------------------------------------------------------------
// Les moments de vérité. Certaines décisions ne se jugent pas seulement à ce
// qu'on a choisi, mais à la façon dont on l'a tenu : une interview où l'on
// trouve la formule, ou huit secondes de silence en direct.
//
// Le mini-jeu est court, rare, et son résultat ne remplace jamais l'effet du
// choix : il l'accompagne d'un bonus ou d'un malus, et d'une ligne de récit.
// ---------------------------------------------------------------------------

const APTITUDE_META: Record<keyof PlayerStats, { label: string; consigne: string }> = {
  charisme: { label: "Charisme", consigne: "Tenir la salle" },
  rhetorique: { label: "Rhétorique", consigne: "Trouver la formule" },
  strategie: { label: "Stratégie", consigne: "Frapper au bon moment" },
  integrite: { label: "Intégrité", consigne: "Regarder les gens en face" },
  cynisme: { label: "Sang-froid", consigne: "Garder le masque" },
  endurance: { label: "Endurance", consigne: "Tenir le choc" },
  reseau: { label: "Réseau", consigne: "Passer les bons coups de fil" },
};

/** Largeur de base de la fenêtre de réussite, par difficulté. */
const ZONE_BASE: Record<1 | 2 | 3, number> = { 1: 30, 2: 21, 3: 14 };
/** Durée d'un aller simple du curseur, en millisecondes. */
const VITESSE_BASE: Record<1 | 2 | 3, number> = { 1: 1450, 2: 1100, 3: 820 };

const LABEL_DIFFICULTE: Record<1 | 2 | 3, string> = { 1: "Tendu", 2: "Risqué", 3: "Funambule" };

/**
 * Construit la géométrie du mini-jeu. Elle est calculée ici, avec le RNG de la
 * partie, pour que la difficulté reste honnête : votre aptitude élargit la
 * fenêtre, votre fatigue la referme.
 */
function geometrie(
  s: GameState,
  rng: Rng,
  aptitude: keyof PlayerStats,
  difficulte: 1 | 2 | 3
): Pick<CheckPlan, "zone" | "zoneCrit" | "depart" | "vitesse" | "passes"> {
  const niveau = s.player[aptitude];
  const fatigue = s.hidden.fatigue;
  const zone = clamp(ZONE_BASE[difficulte] + (niveau - 45) * 0.2 - Math.max(0, fatigue - 35) * 0.14, 9, 44);
  const zoneCrit = Math.max(3.5, zone * 0.3);
  const vitesse = Math.round(VITESSE_BASE[difficulte] * (fatigue > 65 ? 0.85 : 1));
  return {
    zone: Math.round(zone * 10) / 10,
    zoneCrit: Math.round(zoneCrit * 10) / 10,
    depart: rng.int(5, Math.max(6, Math.floor(94 - zone))),
    vitesse,
    passes: 3,
  };
}

function plan(
  s: GameState,
  rng: Rng,
  cible: CheckPlan["cible"],
  titre: string,
  aptitude: keyof PlayerStats,
  difficulte: 1 | 2 | 3
): CheckPlan {
  const meta = APTITUDE_META[aptitude];
  return {
    cible,
    titre,
    consigne: meta.consigne,
    aptitude,
    aptitudeLabel: meta.label,
    difficulte,
    difficulteLabel: LABEL_DIFFICULTE[difficulte],
    ...geometrie(s, rng, aptitude, difficulte),
  };
}

/** Aptitude par défaut d'un événement, quand le contenu n'en impose pas. */
function aptitudeDe(ev: GameEvent, choice: Choice): keyof PlayerStats {
  if (choice.aptitude) return choice.aptitude;
  if (ev.kind === "crise") return "strategie";
  if (ev.kind === "perso") return "integrite";
  if (ev.kind === "intrigue") return "cynisme";
  return "rhetorique";
}

/** Risque par défaut d'un choix, quand le contenu n'en déclare pas. */
function risqueDe(ev: GameEvent, choice: Choice): 1 | 2 | 3 {
  if (choice.risque) return choice.risque;
  if (ev.kind === "crise") return 3;
  if (ev.kind === "intrigue") return 2;
  return 1;
}

/**
 * Décide si une décision mérite un moment de vérité. On ne veut surtout pas en
 * mettre partout : un compteur de refroidissement garantit qu'ils restent des
 * respirations, pas une taxe sur chaque clic.
 */
export function planChoixCheck(s: GameState, rng: Rng, ev: GameEvent, choice: Choice): CheckPlan | null {
  if (s.checkCooldown > 0) return null;
  const risque = risqueDe(ev, choice);
  const proba = choice.risque ? 0.75 : risque === 3 ? 0.55 : risque === 2 ? 0.34 : 0.16;
  if (!rng.chance(proba)) return null;
  return plan(s, rng, { kind: "choix", choiceId: choice.id }, ev.titre, aptitudeDe(ev, choice), risque);
}

const CAMPAGNE_CHECKS: Record<string, { titre: string; aptitude: keyof PlayerStats; difficulte: 1 | 2 | 3; proba: number }> = {
  plateau: { titre: "Interview en plateau", aptitude: "rhetorique", difficulte: 2, proba: 0.8 },
  meeting: { titre: "Le meeting", aptitude: "charisme", difficulte: 1, proba: 0.45 },
  attaque: { titre: "L'attaque", aptitude: "rhetorique", difficulte: 3, proba: 0.6 },
  annonce: { titre: "La grande annonce", aptitude: "charisme", difficulte: 2, proba: 0.4 },
};

export function planCampagneCheck(s: GameState, rng: Rng, actionId: string, segmentId?: string): CheckPlan | null {
  const def = CAMPAGNE_CHECKS[actionId];
  if (!def) return null;
  if (s.checkCooldown > 0) return null;
  if (!rng.chance(def.proba)) return null;
  return plan(s, rng, { kind: "campagne", actionId, segmentId }, def.titre, def.aptitude, def.difficulte);
}

/** Le débat, lui, se joue toujours : c'est le seul soir qui compte. */
export function planDebatCheck(s: GameState, rng: Rng, beats: string[]): CheckPlan {
  return plan(s, rng, { kind: "debat", beats }, "Le grand débat", "rhetorique", 3);
}

/** Les actions du semestre qui se jouent en public — les seules à mériter un check. */
const ACTION_CHECKS: Record<string, { aptitude: keyof PlayerStats; difficulte: 1 | 2 | 3 }> = {
  allocution: { aptitude: "rhetorique", difficulte: 2 },
  interview: { aptitude: "rhetorique", difficulte: 2 },
  discours_historique: { aptitude: "rhetorique", difficulte: 3 },
  deplacement: { aptitude: "charisme", difficulte: 1 },
  inauguration: { aptitude: "charisme", difficulte: 1 },
  offensive_mediatique: { aptitude: "rhetorique", difficulte: 3 },
  negocier_syndicats: { aptitude: "strategie", difficulte: 2 },
  diner_patronat: { aptitude: "reseau", difficulte: 2 },
  sommet: { aptitude: "strategie", difficulte: 2 },
  apaiser_rue: { aptitude: "charisme", difficulte: 3 },
};

export function planActionCheck(
  s: GameState,
  rng: Rng,
  actionId: string,
  cout: number,
  param?: string,
  titre = "Votre décision"
): CheckPlan | null {
  const def = ACTION_CHECKS[actionId];
  if (!def) return null;
  if (s.checkCooldown > 0) return null;
  if (!rng.chance(0.45)) return null;
  return plan(s, rng, { kind: "action", actionId, param, cout }, titre, def.aptitude, def.difficulte);
}

// ---------------------------------------------------------------------------
// La résolution : un effet générique, et une phrase qui raconte le moment.
// ---------------------------------------------------------------------------

const RECITS: Record<CheckRang, string[]> = {
  critique: [
    "Vous trouvez la formule au dixième de seconde près. Elle tiendra trois jours en boucle, et on vous la citera dix ans.",
    "Un silence, puis la phrase juste. Même l'équipe adverse la reprend, faute de mieux.",
    "Ce moment-là, vous l'avez tenu comme personne. Les images passeront en boucle sans qu'on ait besoin de les commenter.",
    "Vous voyez le piège arriver et vous le retournez sans hausser le ton. La salle bascule.",
    "Vous êtes exactement là où il fallait être, au moment où il fallait y être. Ça ne s'explique pas et ça ne se refait pas.",
  ],
  reussite: [
    "Vous tenez le moment sans éclat particulier. C'est fait, c'est propre, on passe à la suite.",
    "Rien à redire. Personne n'en parlera demain, et c'est déjà ça.",
    "Correct. Les commentateurs cherchent l'incident et ne le trouvent pas.",
  ],
  echec: [
    "Vous butez sur un mot. Trois secondes de flottement — assez pour que la séquence circule.",
    "Le ton n'y est pas. Vous vous en rendez compte en le disant, ce qui n'arrange rien.",
    "Vous répondez à côté. Rien de grave, sauf que le montage du soir ne gardera que ce passage.",
    "Un blanc, un sourire de trop, et l'impression tenace que vous récitiez.",
  ],
  desastre: [
    "Vous perdez le fil. Huit secondes de silence en direct, un verre d'eau, et un regard vers le régisseur que tout le monde a vu.",
    "Vous vous emmêlez, vous reprenez, vous vous emmêlez encore. Le clip fera deux millions de vues avant minuit.",
    "La phrase sort à l'envers. Vous tentez une plaisanterie pour rattraper. Elle tombe dans un silence complet.",
    "Vous confondez deux chiffres, puis deux villes, puis le nom de votre propre ministre. Personne n'ose vous interrompre.",
  ],
};

const RANG_META: Record<CheckRang, { label: string; tone: string }> = {
  critique: { label: "Réussite critique", tone: "var(--color-good)" },
  reussite: { label: "Réussite", tone: "var(--color-env)" },
  echec: { label: "Échec", tone: "var(--color-warn)" },
  desastre: { label: "Échec critique", tone: "var(--color-bad)" },
};

export function rangMeta(rang: CheckRang) {
  return RANG_META[rang];
}

/**
 * Applique les conséquences génériques du moment de vérité et rend la phrase
 * de récit à placer devant la résolution du choix.
 */
export function appliquerCheck(s: GameState, rng: Rng, rang: CheckRang): string {
  const enCampagne = s.act === "campagne" && s.campaign !== null;
  const dyn = (n: number) => {
    if (s.campaign) s.campaign.dynamique = clamp(s.campaign.dynamique + n, -10, 10);
  };
  const p = s.power;
  switch (rang) {
    case "critique":
      p.presse = clamp(p.presse + 3);
      p.popularite = clamp(p.popularite + 2);
      s.player.charisme = clamp(s.player.charisme + 1);
      if (enCampagne) dyn(3);
      break;
    case "reussite":
      break;
    case "echec":
      p.presse = clamp(p.presse - 2);
      p.popularite = clamp(p.popularite - 2);
      s.hidden.fatigue = clamp(s.hidden.fatigue + 2);
      if (enCampagne) dyn(-2);
      break;
    case "desastre":
      p.presse = clamp(p.presse - 5);
      p.popularite = clamp(p.popularite - 4);
      p.parti = clamp(p.parti - 3);
      s.hidden.fatigue = clamp(s.hidden.fatigue + 6);
      if (enCampagne) dyn(-5);
      break;
  }
  // Les moments de vérité doivent rester rares : on referme la porte derrière.
  s.checkCooldown = rng.int(2, 4);
  return rng.pick(RECITS[rang]);
}
