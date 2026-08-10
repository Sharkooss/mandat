import type { GameState, PressItem } from "./types";
import type { Rng } from "./rng";
import {
  ACTIONS,
  CHANCE_OPPORTUNITE,
  REFORMES,
  reformesOuvertes,
  type ActionDef,
  type OpportuniteRarete,
  type ReformeDef,
} from "../content/france/actions";

// ---------------------------------------------------------------------------
// Ce que le semestre met sur la table.
//
// Rien n'est jamais offert en entier : ni les actions, ni les chantiers, ni
// les occasions. Un menu complet n'est pas une décision, c'est une liste — le
// joueur doit composer avec ce que la situation lui donne ce semestre-là.
// ---------------------------------------------------------------------------

/** Nombre d'actions ordinaires tirées en plus du socle. */
export const ACTIONS_TIREES = 4;

/** Nombre de chantiers proposés quand on ouvre « Lancer une réforme ». */
export const REFORMES_PROPOSEES = 4;

function dispo(s: GameState, a: ActionDef): boolean {
  if (a.cond && !a.cond(s)) return false;
  const utilise = s.actionCooldown[a.id];
  if (utilise !== undefined && a.cooldown && s.turnCount - utilise < a.cooldown) return false;
  return true;
}

/** Le socle, plus quatre actions tirées : deux semestres ne se ressemblent pas. */
export function tirerActionsSemestre(s: GameState, rng: Rng): string[] {
  const tirables = ACTIONS.filter((a) => !a.socle && !a.opportunite && dispo(s, a));
  const tires: string[] = [];
  while (tires.length < ACTIONS_TIREES && tirables.length > 0) {
    const choisi = rng.pick(tirables);
    tirables.splice(tirables.indexOf(choisi), 1);
    tires.push(choisi.id);
  }
  return [...ACTIONS.filter((a) => a.socle).map((a) => a.id), ...tires];
}

// ---------------------------------------------------------------------------
// Les chantiers
// ---------------------------------------------------------------------------

/** Un chantier que la campagne a promis et qui reste à faire. */
function promis(s: GameState, r: ReformeDef): boolean {
  return s.promises.some((p) => p.id === r.promesse && p.status === "en_cours");
}

/**
 * Quatre chantiers, pas dix. Le premier tiré est, s'il en reste un, une
 * promesse de campagne : le programme doit toujours pouvoir avancer, sinon on
 * finit un mandat sans en avoir tenu une seule.
 */
export function tirerReformes(s: GameState, rng: Rng): string[] {
  const pool = reformesOuvertes(s);
  const tires: ReformeDef[] = [];
  const prendre = (r: ReformeDef) => {
    tires.push(r);
    pool.splice(pool.indexOf(r), 1);
  };

  const promesses = pool.filter((r) => promis(s, r));
  if (promesses.length > 0) prendre(rng.pick(promesses));
  while (tires.length < REFORMES_PROPOSEES && pool.length > 0) {
    prendre(rng.weighted(pool.map((r) => ({ item: r, weight: promis(s, r) ? 2.2 : 1 }))));
  }
  // Rendus dans l'ordre du vivier : la liste reste lisible d'un semestre à l'autre.
  return REFORMES.filter((r) => tires.includes(r)).map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Les occasions
// ---------------------------------------------------------------------------

/**
 * Le semestre à partir duquel une occasion de ce rang peut seulement commencer
 * à se former. Une occasion historique au premier trimestre du premier mandat
 * n'est pas historique : c'est une case de menu.
 */
const PREMIER_TOUR: Record<OpportuniteRarete, number> = {
  rare: 2,
  exceptionnelle: 3,
  historique: 4,
};

/**
 * Combien de semestres la situation doit tenir avant que la fenêtre s'ouvre
 * vraiment. C'est ce qui distingue un seuil franchi d'une situation installée
 * — et ce qui laisse au joueur le temps de lire les signes au briefing.
 */
const MATURITE: Record<OpportuniteRarete, number> = {
  rare: 2,
  exceptionnelle: 3,
  historique: 3,
};

function rangDe(a: ActionDef): OpportuniteRarete {
  return a.rarete ?? "exceptionnelle";
}

function mure(s: GameState, a: ActionDef): boolean {
  return (s.opportuniteMurissement?.[a.id] ?? 0) >= MATURITE[rangDe(a)];
}

/**
 * Fait mûrir les occasions en début de semestre et rend les signes avant-coureurs
 * à glisser dans le briefing.
 *
 * Une occasion s'ouvre de deux façons, jamais autrement : parce qu'un événement
 * l'a déclenchée (`declencheur`, et elle est alors mûre tout de suite — la chose
 * vient d'arriver), ou parce qu'une situation dure (`cond` vérifiée plusieurs
 * semestres d'affilée). Dès que la situation se referme, le compteur retombe à
 * zéro : ce qui avait commencé à s'ouvrir est perdu.
 */
export function murirOpportunites(s: GameState, rng: Rng): PressItem[] {
  const signaux: PressItem[] = [];
  if (!s.opportuniteMurissement) s.opportuniteMurissement = {};
  for (const a of ACTIONS) {
    if (!a.opportunite) continue;
    // Une occasion saisie est sortie du jeu : plus rien à faire mûrir.
    if (s.actionCooldown[a.id] !== undefined) {
      delete s.opportuniteMurissement[a.id];
      continue;
    }
    const rang = rangDe(a);
    const declenchee = !!a.declencheur && !!s.flags[a.declencheur];
    const situation = !a.cond || a.cond(s);
    const assezTard = declenchee || s.turnCount >= PREMIER_TOUR[rang];
    if (!situation || (a.declencheur && !declenchee) || !assezTard) {
      delete s.opportuniteMurissement[a.id];
      continue;
    }
    const avant = s.opportuniteMurissement[a.id] ?? 0;
    s.opportuniteMurissement[a.id] = declenchee ? MATURITE[rang] : avant + 1;
    // Le semestre où la situation s'installe, on en parle au briefing — et une
    // seule fois. Le joueur doit pouvoir dire « je l'avais vu venir ».
    if (avant === 0 && !declenchee && a.signal && signaux.length < 2 && rng.chance(0.85)) {
      signaux.push({ kind: "symptome", text: a.signal, tone: "neutre" });
    }
  }
  return signaux;
}

/**
 * Tire l'occasion du semestre — une au plus, et jamais deux fois la même de
 * toute la partie. Quatre garde-fous font qu'elle reste une occasion et non une
 * rubrique du menu : il faut qu'elle ait mûri, elle disparaît définitivement
 * une fois saisie, un temps mort la suit, et même mûre elle ne se présente que
 * selon sa rareté. Une fenêtre qu'on est sûr de revoir n'oblige à rien.
 */
export function tirerOpportunite(s: GameState, rng: Rng): string[] {
  if (s.opportuniteCooldown > 0) {
    s.opportuniteCooldown -= 1;
    return [];
  }
  const poids = (a: ActionDef) => CHANCE_OPPORTUNITE[rangDe(a)];
  const ouvertes = ACTIONS.filter(
    (a) => a.opportunite && s.actionCooldown[a.id] === undefined && mure(s, a) && (!a.cond || a.cond(s))
  );
  if (ouvertes.length === 0) return [];
  const choisie = rng.weighted(ouvertes.map((a) => ({ item: a, weight: poids(a) })));
  return rng.chance(poids(choisie)) ? [choisie.id] : [];
}
