import type { CampaignState, GameState } from "./types";
import type { Rng } from "./rng";
import { clamp } from "./ctx";

// ---------------------------------------------------------------------------
// Les scores : le vrai score n'est jamais montré tel quel.
// ---------------------------------------------------------------------------

export function scoreBrut(s: GameState): number {
  let raw = 0;
  for (const seg of Object.values(s.segments)) {
    const poids = POIDS[seg.id] ?? 0;
    raw += poids * (seg.soutien / 100) * (seg.participation / 100);
  }
  return raw; // ~15-45
}

const POIDS: Record<string, number> = {
  retraites: 20, periurbain: 15, urbains: 10, jeunes: 12, ruraux: 8,
  pavillonnaires: 12, quartiers: 7, public: 9, independants: 4, csp: 3,
};

export function intentions(s: GameState): { joueur: number; opposant: number; tiers: number } {
  const c = s.campaign!;
  const joueurRaw = scoreBrut(s);
  const oppRaw = c.opposantScore * 0.42;
  const tiersRaw = 16;
  const total = joueurRaw + oppRaw + tiersRaw;
  return {
    joueur: (joueurRaw / total) * 100,
    opposant: (oppRaw / total) * 100,
    tiers: (tiersRaw / total) * 100,
  };
}

/** Le sondage affiché : vrai score + bruit + un peu de dynamique. Marge ±3. */
export function sondageAffiche(s: GameState, rng: Rng): { joueur: number; opposant: number } {
  const i = intentions(s);
  const c = s.campaign!;
  return {
    joueur: Math.round(clamp(i.joueur + (rng.next() - 0.5) * 4 + c.dynamique * 0.4, 5, 90)),
    opposant: Math.round(clamp(i.opposant + (rng.next() - 0.5) * 4 - c.dynamique * 0.2, 5, 90)),
  };
}

// ---------------------------------------------------------------------------
// Les actions de campagne
// ---------------------------------------------------------------------------

export interface CampaignAction {
  id: string;
  nom: string;
  detail: string;
  fatigue: number;
  needSegment?: boolean;
}

export const CAMPAIGN_ACTIONS: CampaignAction[] = [
  { id: "meeting", nom: "Meeting régional", detail: "Mobiliser un segment : + soutien, + participation.", fatigue: 8, needSegment: true },
  { id: "plateau", nom: "Plateau télévisé", detail: "Toucher large. Votre rhétorique décide — et votre fatigue se voit.", fatigue: 6 },
  { id: "fonds", nom: "Levée de fonds", detail: "Dîner en ville. Les CSP+ signent des chèques, la presse compte les petits fours.", fatigue: 4 },
  { id: "attaque", nom: "Attaque de l'adversaire", detail: "Votre base adore. Les modérés, moins.", fatigue: 5 },
  { id: "annonce", nom: "Grande annonce", detail: "Mettre une promesse en lumière. Les électeurs s'en souviendront — c'est le problème.", fatigue: 6 },
  { id: "dossier", nom: "Faire travailler les équipes", detail: "Chercher ce que l'adversaire cache. Utile pour le débat.", fatigue: 2 },
  { id: "repos", nom: "Repos", detail: "Une journée à la campagne. La presse dira que vous fuyez.", fatigue: -18 },
];

export function applyCampaignAction(s: GameState, rng: Rng, actionId: string, segmentId?: string): string {
  const c = s.campaign!;
  c.lastAction = actionId;
  const fatigueMalus = s.hidden.fatigue > 70 ? 0.4 : s.hidden.fatigue > 50 ? 0.75 : 1;
  const rate = (base: number) => Math.round(base * fatigueMalus);
  const act = CAMPAIGN_ACTIONS.find((a) => a.id === actionId)!;
  s.hidden.fatigue = clamp(s.hidden.fatigue + act.fatigue);
  let res = "";

  switch (actionId) {
    case "meeting": {
      const seg = s.segments[segmentId ?? "pavillonnaires"];
      const gain = rate(4 + Math.floor(s.player.charisme / 25));
      seg.soutien = clamp(seg.soutien + gain);
      seg.participation = clamp(seg.participation + rate(5));
      if (fatigueMalus < 0.7 && rng.chance(0.4)) {
        c.dynamique = clamp(c.dynamique - 2, -10, 10);
        res = `Salle correcte, discours récité. Vous avez confondu deux villes à la tribune — la séquence tourne en boucle.`;
      } else {
        c.dynamique = clamp(c.dynamique + 1, -10, 10);
        res = `Bonne salle. Le segment visé bouge. Les caméras ont montré les drapeaux, pas les chaises vides.`;
      }
      break;
    }
    case "plateau": {
      const perf = s.player.rhetorique * fatigueMalus + rng.int(-15, 15);
      if (perf > 55) {
        for (const id of ["pavillonnaires", "urbains", "retraites"]) s.segments[id].soutien = clamp(s.segments[id].soutien + 2);
        c.dynamique = clamp(c.dynamique + 2, -10, 10);
        res = "Prestation solide. Une formule fait mouche, elle sera reprise partout demain.";
      } else if (perf > 35) {
        res = "Prestation sans relief. L'éditorialiste Bec vous trouve « gestionnaire ». Ce n'était pas un compliment.";
      } else {
        c.dynamique = clamp(c.dynamique - 3, -10, 10);
        s.power.presse = clamp(s.power.presse - 3);
        res = "Un trou. Huit secondes de silence en direct. Le clip a déjà deux millions de vues.";
      }
      break;
    }
    case "fonds": {
      s.segments["csp"].soutien = clamp(s.segments["csp"].soutien + 5);
      s.flags["budget_campagne"] = ((s.flags["budget_campagne"] as number) ?? 0) + 1;
      res = "Les chèques sont signés. Espitalier note tout dans un carnet. Vous préférez ne pas savoir lequel.";
      break;
    }
    case "attaque": {
      c.opposantScore = clamp(c.opposantScore - rate(4));
      for (const id of ["periurbain", "jeunes"]) s.segments[id].participation = clamp(s.segments[id].participation + 3);
      s.segments["pavillonnaires"].soutien = clamp(s.segments["pavillonnaires"].soutien - 2);
      s.segments["retraites"].soutien = clamp(s.segments["retraites"].soutien - 1);
      res = "La pique est cruelle et juste. Votre base jubile. Les modérés trouvent ça « petit ».";
      break;
    }
    case "annonce": {
      const promesses = s.promises.filter((p) => p.status === "en_cours");
      if (promesses.length > 0) {
        const p = rng.pick(promesses);
        s.flags[`annonce_${p.id}`] = true;
        c.dynamique = clamp(c.dynamique + 2, -10, 10);
        res = "L'annonce fait la une. Les électeurs l'ont notée. Ils vérifieront.";
      } else {
        res = "Rien de neuf à annoncer. La conférence de presse tourne au bilan météo.";
      }
      break;
    }
    case "dossier": {
      c.dossierAdversaire = Math.min(3, c.dossierAdversaire + 1);
      res = "Les équipes ont trouvé quelque chose. Utilisable en débat — si vous osez.";
      break;
    }
    case "repos": {
      s.hidden.sante = clamp(s.hidden.sante + 2);
      c.dynamique = clamp(c.dynamique - 1, -10, 10);
      res = "Vingt-quatre heures sans caméra. La presse écrit que vous « disparaissez ». Vous dormez.";
      break;
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Le débat : trois temps rhétoriques
// ---------------------------------------------------------------------------

export interface DebateBeat {
  id: string;
  nom: string;
  detail: string;
}

export const DEBATE_BEATS: DebateBeat[] = [
  { id: "frontale", nom: "L'attaque frontale", detail: "Frapper fort, tout de suite. Votre base adore, les modérés jugent." },
  { id: "bilan", nom: "Le bilan chiffré", detail: "Des faits, des chiffres. Solide — si vous les maîtrisez." },
  { id: "unite", nom: "L'appel à l'unité", detail: "Au-dessus de la mêlée. Rassure les retraités et les modérés." },
  { id: "choc", nom: "La promesse choc", detail: "Une annonce en direct. Spectaculaire, et elle vous engagera." },
  { id: "ironie", nom: "L'ironie", detail: "Une pique brillante peut ravir votre camp — et faire fuir les autres." },
  { id: "gravite", nom: "La gravité présidentielle", detail: "Le ton d'un chef d'État. Peu de gain, peu de risque." },
  { id: "dossier_secret", nom: "Sortir le dossier", detail: "Ce que vos équipes ont trouvé. Dévastateur ou dégueulasse, selon le camp." },
];

export function runDebate(s: GameState, rng: Rng, beats: string[]): string {
  const c = s.campaign!;
  c.debatFait = true;
  const fatigueMalus = s.hidden.fatigue > 70 ? -15 : s.hidden.fatigue > 50 ? -6 : 0;
  let score = s.player.rhetorique * 0.4 + fatigueMalus + rng.int(-10, 10);
  const lignes: string[] = [];

  for (const b of beats) {
    switch (b) {
      case "frontale":
        score += 8;
        s.segments["periurbain"].participation = clamp(s.segments["periurbain"].participation + 3);
        s.segments["retraites"].soutien = clamp(s.segments["retraites"].soutien - 1);
        lignes.push("L'attaque porte. L'adversaire encaisse mal.");
        break;
      case "bilan":
        score += s.flags["credibilite_budget"] ? 12 : 6;
        lignes.push(s.flags["credibilite_budget"] ? "Vos chiffres tiennent — la thèse d'économie, enfin utile." : "Les chiffres passent, sans éclat.");
        break;
      case "unite":
        score += 7;
        s.segments["retraites"].soutien = clamp(s.segments["retraites"].soutien + 2);
        s.segments["pavillonnaires"].soutien = clamp(s.segments["pavillonnaires"].soutien + 2);
        lignes.push("Le ton rassemble. Les modérés notent.");
        break;
      case "choc":
        score += rng.int(2, 14);
        s.flags["promesse_debat"] = true;
        lignes.push("L'annonce surprend tout le monde — y compris votre équipe, qui l'apprend en direct.");
        break;
      case "ironie": {
        const reussite = s.player.rhetorique + rng.int(-20, 20) > 55;
        if (reussite) {
          score += 10;
          s.segments["jeunes"].participation = clamp(s.segments["jeunes"].participation + 4);
          s.segments["retraites"].soutien = clamp(s.segments["retraites"].soutien - 2);
          lignes.push("La pique est parfaite. Elle fera l'ouverture de tous les journaux — et fera fuir quelques modérés.");
        } else {
          score -= 8;
          lignes.push("La pique tombe à plat. Un silence. Le pire des silences.");
        }
        break;
      }
      case "gravite":
        score += 4;
        lignes.push("Présidentiel. Personne ne s'en souviendra, personne ne vous le reprochera.");
        break;
      case "dossier_secret":
        if (c.dossierAdversaire >= 2) {
          score += 14;
          c.opposantScore = clamp(c.opposantScore - 6);
          s.player.integrite = clamp(s.player.integrite - 4);
          lignes.push("Le dossier sort. L'adversaire blêmit. C'était bas. C'était efficace.");
        } else {
          score -= 10;
          s.power.presse = clamp(s.power.presse - 4);
          lignes.push("Vous insinuez sans preuve. Ça se voit. La presse parle de « méthodes ».");
        }
        break;
    }
  }

  if (score > 60) {
    c.dynamique = clamp(c.dynamique + 4, -10, 10);
    for (const seg of Object.values(s.segments)) seg.participation = clamp(seg.participation + 2);
    lignes.push("Verdict des rédactions : débat gagné.");
  } else if (score > 40) {
    lignes.push("Verdict des rédactions : match nul. Chacun garde ses électeurs.");
  } else {
    c.dynamique = clamp(c.dynamique - 4, -10, 10);
    lignes.push("Verdict des rédactions : débat perdu. La photo de votre front en sueur est partout.");
  }
  return lignes.join(" ");
}

// ---------------------------------------------------------------------------
// La résolution de l'élection
// ---------------------------------------------------------------------------

export interface ElectionOutcome {
  t1: { joueur: number; opposant: number; tiers: number };
  t2: { joueur: number; opposant: number };
  gagne: boolean;
  recit: string[];
  sieges: number;
}

export function resolveElection(s: GameState, rng: Rng): ElectionOutcome {
  const c = s.campaign!;
  const i = intentions(s);
  const bruit = (rng.next() - 0.5) * 5;
  const t1 = {
    joueur: clamp(i.joueur + c.dynamique * 0.5 + bruit, 8, 70),
    opposant: clamp(i.opposant - c.dynamique * 0.2 + (rng.next() - 0.5) * 4, 8, 70),
    tiers: 0,
  };
  t1.tiers = Math.max(0, 100 - t1.joueur - t1.opposant);

  // Second tour : les reports.
  const opposantTribun = c.opposantId === "sallenave" || c.opposantId === "figure_rp";
  let reportJoueur: number;
  const recit: string[] = [];
  if (opposantTribun) {
    // Front républicain — sauf si la dérive l'a tué.
    reportJoueur = 0.62 - s.derive * 0.035 - (50 - s.power.popularite) * 0.003;
    recit.push(
      s.derive >= 5
        ? "L'entre-deux-tours est glacial. « Ni l'un ni l'autre », titrent trois quotidiens : le front républicain ne se lève pas pour vous."
        : "L'entre-deux-tours voit se former un front : on vote pour vous sans vous aimer, « pour faire barrage »."
    );
  } else {
    reportJoueur = 0.48 + (s.power.popularite - 45) * 0.004 + c.dynamique * 0.008;
    recit.push("Face à une adversaire de gouvernement, pas de barrage qui tienne : le second tour se joue au centre, voix par voix.");
  }
  reportJoueur = Math.min(0.8, Math.max(0.2, reportJoueur + (rng.next() - 0.5) * 0.1));

  const t2joueur = clamp(t1.joueur + t1.tiers * reportJoueur, 5, 95);
  const t2 = { joueur: t2joueur, opposant: 100 - t2joueur };
  const gagne = t2.joueur > 50;

  // Les législatives dans la foulée.
  let sieges = 0;
  if (gagne) {
    sieges = Math.round(230 + (t2.joueur - 50) * 5.5 + c.dynamique * 4 + (rng.next() - 0.5) * 30);
    sieges = clamp(sieges, 180, 400);
    if (s.flags["proportionnelle_active"]) sieges = clamp(Math.round(sieges * 0.82), 150, 350);
    recit.push(
      sieges >= 289
        ? `Les législatives suivent : ${sieges} sièges. Une majorité absolue. Le pays vous a donné les clés — toutes les clés.`
        : sieges >= 250
          ? `Les législatives suivent : ${sieges} sièges. Une majorité relative. Chaque loi sera une négociation — ou un 49.3.`
          : `Les législatives tournent mal : ${sieges} sièges. L'Assemblée est à vos adversaires. La cohabitation commence au premier jour.`
    );
  }

  c.scoreT1 = { joueur: Math.round(t1.joueur * 10) / 10, opposant: Math.round(t1.opposant * 10) / 10, tiers: Math.round(t1.tiers * 10) / 10 };
  return { t1, t2, gagne, recit, sieges };
}

export function makeCampaign(kind: CampaignState["kind"], opposantId: string, opposantScore: number): CampaignState {
  return {
    kind,
    week: 1,
    totalWeeks: kind === "presidentielle" ? 12 : 8,
    dynamique: 0,
    debatFait: false,
    opposantId,
    opposantScore,
    dossierAdversaire: 0,
    round: 1,
  };
}
