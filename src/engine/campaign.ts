import type { CampaignState, CheckRang, GameState } from "./types";
import type { Rng } from "./rng";
import { clamp } from "./ctx";
import { nomCompletDe } from "./noms";

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
  const oppRaw = c.opposantScore * 0.48;
  const tiersRaw = 18;
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
// La campagne d'en face.
//
// Une campagne où seul le joueur agit n'est pas une élection, c'est un
// entraînement. L'adversaire a désormais son arsenal — et cet arsenal est tiré
// de votre bilan réel : chaque semaine, il choisit le chiffre qui vous
// embarrasse le plus et en fait son sujet. On ne peut pas tout couvrir : c'est
// exactement le problème qu'on veut poser au joueur.
// ---------------------------------------------------------------------------

export interface Riposte {
  id: string;
  /** Le thème, affiché au joueur — c'est sa ligne de campagne. */
  theme: string;
  /** Plus le grief est fondé, plus le coup porte. Rend 0 quand il ne l'est pas. */
  force: (s: GameState) => number;
  attaque: (s: GameState) => string;
  /** Là où l'attaque mord : le segment qu'elle détache de vous. */
  segments: string[];
  /**
   * À qui l'attaque peut être adressée. On ne reproche pas son bilan à
   * quelqu'un qui n'a jamais gouverné, ni son inexpérience à un sortant.
   */
  quand?: "sortant" | "candidat";
}

export const RIPOSTES: Riposte[] = [
  // --- Contre un sortant : son bilan ---------------------------------------
  {
    id: "chomage",
    quand: "sortant",
    theme: "Le chômage",
    force: (s) => Math.max(0, s.country.chomage - 7) * 1.4,
    segments: ["periurbain", "jeunes"],
    attaque: (s) =>
      `« ${s.country.chomage.toFixed(1)} pour cent. Voilà le bilan. Pas un slogan : un chiffre, et derrière ce chiffre, des gens que vous avez cessé de compter. »`,
  },
  {
    id: "vie_chere",
    quand: "sortant",
    theme: "La vie chère",
    force: (s) => Math.max(0, s.country.inflation - 2.2) * 2.2,
    segments: ["retraites", "pavillonnaires"],
    attaque: () =>
      `Le déplacement se fait dans un supermarché, caddie à la main, avec les prix filmés en gros plan. « Expliquez-leur, vous, ce que veut dire "maîtrisé". »`,
  },
  {
    id: "dette",
    quand: "sortant",
    theme: "La dette",
    force: (s) => Math.max(0, s.country.dette - 118) * 0.5,
    segments: ["csp", "independants"],
    attaque: (s) =>
      `« ${Math.round(s.country.dette)} % du PIB. Nous ne parlons plus de gestion, nous parlons de ce que vos enfants rembourseront. »`,
  },
  {
    id: "services",
    quand: "sortant",
    theme: "Les services publics",
    force: (s) => Math.max(0, 45 - s.country.services) * 1.1,
    segments: ["public", "ruraux"],
    attaque: () =>
      `Trois jours de tournée dans des hôpitaux et des sous-préfectures fermées. Aucune promesse, aucune formule : juste des portes closes, filmées les unes après les autres.`,
  },
  {
    id: "insecurite",
    quand: "sortant",
    theme: "L'insécurité",
    force: (s) => Math.max(0, 48 - s.country.securite) * 1.1,
    segments: ["pavillonnaires", "retraites"],
    attaque: () =>
      `Le fait divers de la semaine devient un meeting. C'est indécent, c'est efficace, et tout le monde le sait — y compris ceux qui applaudissent.`,
  },
  {
    id: "fracture",
    quand: "sortant",
    theme: "La fracture du pays",
    force: (s) => Math.max(0, 42 - s.country.cohesion) * 1.2,
    segments: ["quartiers", "urbains"],
    attaque: () =>
      `« Vous avez trouvé un pays divisé. Vous en rendez deux. » La formule est injuste et fera l'ouverture des journaux pendant trois jours.`,
  },
  {
    id: "parole",
    theme: "La parole donnée",
    force: (s) => s.propos.filter((p) => !p.tenu).length * 9,
    segments: ["periurbain", "jeunes", "public"],
    attaque: (s) => {
      const renie = [...s.propos].filter((p) => !p.tenu).sort((a, b) => a.turn - b.turn)[0];
      return renie
        ? `Le clip dure onze secondes : vous, ${renie.contexte}, disant « ${renie.citation} ». Puis un écran noir, et une date. Il tourne en boucle depuis ce matin.`
        : `« Vous avez dit. Vous n'avez pas fait. Le reste est de la communication. »`;
    },
  },
  {
    id: "promesses",
    quand: "sortant",
    theme: "Le programme abandonné",
    force: (s) => s.promises.filter((p) => p.status === "trahie").length * 8,
    segments: ["periurbain", "public", "jeunes"],
    attaque: () =>
      `Son équipe fait imprimer votre profession de foi d'il y a cinq ans, telle quelle, et la distribue sur les marchés. Sans commentaire. C'est le commentaire.`,
  },
  {
    id: "affaires",
    quand: "sortant",
    theme: "Les affaires",
    force: (s) => (s.europe?.dossiers?.filter((d) => d.public).length ?? 0) * 12 + (s.europe?.enquete ? 10 : 0),
    segments: ["csp", "urbains", "retraites"],
    attaque: () =>
      `« Je ne parlerai pas des procédures en cours. » Il le dit trois fois en dix minutes, ce qui permet d'en parler trois fois.`,
  },
  {
    id: "derive",
    quand: "sortant",
    theme: "Les libertés",
    force: (s) => s.derive * 3.2,
    segments: ["urbains", "jeunes", "public"],
    attaque: () =>
      `Le meeting s'ouvre sur la lecture des décrets pris depuis cinq ans. Rien d'inventé, rien de commenté : la lecture suffit, et la salle se lève.`,
  },
  {
    id: "usure",
    quand: "sortant",
    theme: "L'usure",
    force: (s) => Math.max(0, s.hidden.fatigue - 55) * 0.7 + Math.max(0, 45 - s.power.popularite) * 0.5,
    segments: ["pavillonnaires", "retraites"],
    attaque: () =>
      `« Regardez-le. Regardez-nous. » Le duel de photos est humiliant et ne relève d'aucun argument. Il porte quand même.`,
  },
  {
    id: "rang",
    quand: "sortant",
    theme: "Le rang de la France",
    force: (s) => Math.max(0, 55 - s.country.prestige) * 0.6 + Math.max(0, 45 - s.country.influence) * 0.5,
    segments: ["csp", "urbains"],
    attaque: () =>
      `Il énumère les sommets où la France n'a rien obtenu. La liste est longue, exacte, et récitée sans une note.`,
  },

  // --- Contre un candidat : ce qu'il promet et ce qu'il vaut ---------------
  {
    id: "addition",
    quand: "candidat",
    theme: "Le coût du programme",
    force: (s) => s.promises.filter((p) => p.status === "en_cours").length * 3.2,
    segments: ["csp", "independants", "retraites"],
    attaque: () =>
      `Ses équipes ont chiffré votre programme et publient le total en gros caractères. Le chiffre est contestable ; il est déjà repris partout, et vous passerez la semaine à contester au lieu de proposer.`,
  },
  {
    id: "inexperience",
    quand: "candidat",
    theme: "L'inexpérience",
    force: (s) => Math.max(0, 55 - s.player.strategie) * 0.6 + Math.max(0, 45 - s.player.reseau) * 0.4,
    segments: ["retraites", "csp", "pavillonnaires"],
    attaque: () =>
      `« Diriger la France, ce n'est pas un premier emploi. » La phrase est condescendante et fonctionne : elle vise exactement les électeurs qui hésitent encore.`,
  },
  {
    id: "extremite",
    quand: "candidat",
    theme: "Votre ligne",
    force: (s) => Math.max(0, Math.abs(s.bord) - 3) * 3.4,
    segments: ["pavillonnaires", "retraites", "urbains"],
    attaque: (s) =>
      s.bord < 0
        ? `Il ne débat plus avec vous : il lit votre programme à voix haute devant des chefs d'entreprise, en s'arrêtant après chaque ligne. C'est un procédé, et les salles rient.`
        : `Il ressort chacune de vos formules sur l'identité, dans l'ordre, sans commentaire, puis demande : « Vous confirmez ? » Vous ne pouvez ni confirmer ni vous dédire.`,
  },
];

/** Les attaques recevables selon qu'on défend un bilan ou qu'on en promet un. */
export function arsenalContre(s: GameState, sortant: boolean): Riposte[] {
  return RIPOSTES.filter((r) => !r.quand || r.quand === (sortant ? "sortant" : "candidat"));
}

/** Le grief le mieux fondé — c'est de là que l'adversaire fera sa campagne. */
export function ligneAdverse(s: GameState, sortant = true): Riposte | null {
  const classees = arsenalContre(s, sortant).sort((a, b) => b.force(s) - a.force(s));
  return classees[0] && classees[0].force(s) > 4 ? classees[0] : null;
}

/**
 * La riposte de la semaine. Elle est étouffée quand le joueur a occupé le
 * terrain lui-même — c'est ce qui rend « attaquer » autre chose qu'un caprice.
 */
export function riposter(s: GameState, rng: Rng): string | null {
  const c = s.campaign;
  if (!c) return null;
  c.derniereRiposte = undefined;
  const jouees = c.ripostesJouees ?? [];
  const arsenal = arsenalContre(s, c.kind === "reelection").filter((r) => r.force(s) > 4 && !jouees.includes(r.id));
  if (arsenal.length === 0) return null;
  const choisie = rng.weighted(arsenal.map((r) => ({ item: r, weight: r.force(s) })));

  // Occuper le terrain soi-même coûte cher mais protège : une attaque, un
  // plateau ou un débat laissent moins de place au sujet d'en face.
  const couvert = c.lastAction === "attaque" || c.lastAction === "plateau";
  const ampleur = (choisie.force(s) / 26) * (couvert ? 0.45 : 1);
  const degat = Math.min(5, Math.max(1, Math.round(ampleur * 3)));

  c.dynamique = clamp(c.dynamique - degat, -10, 10);
  c.opposantScore = clamp(c.opposantScore + Math.min(3, degat));
  for (const id of choisie.segments) {
    const seg = s.segments[id];
    if (seg) seg.soutien = clamp(seg.soutien - Math.max(1, degat - 1));
  }
  c.ripostesJouees = [...jouees, choisie.id];

  const nom = nomCompletDe(s, c.opposantId);
  const texte = `${nom} a fait de ${choisie.theme.toLowerCase()} son sujet de la semaine. ${choisie.attaque(s)}${
    couvert ? " Vous occupiez l'antenne : le coup passe en deuxième titre." : ""
  }`;
  c.derniereRiposte = texte;
  return texte;
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

export function applyCampaignAction(
  s: GameState,
  rng: Rng,
  actionId: string,
  segmentId?: string,
  rang?: CheckRang
): string {
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
      // Quand le joueur a tenu la salle lui-même, la tribune paie double.
      const bonus = rang === "critique" ? 1.6 : rang === "desastre" ? 0.3 : rang === "echec" ? 0.7 : 1;
      const gain = Math.round(rate(7 + Math.floor(s.player.charisme / 18)) * bonus);
      seg.soutien = clamp(seg.soutien + gain);
      seg.participation = clamp(seg.participation + Math.round(rate(8) * bonus));
      const rate_ = rang ? rang === "echec" || rang === "desastre" : fatigueMalus < 0.7 && rng.chance(0.4);
      if (rate_) {
        c.dynamique = clamp(c.dynamique - 2, -10, 10);
        res = `Salle correcte, discours récité. Vous avez confondu deux villes à la tribune — la séquence tourne en boucle.`;
      } else {
        c.dynamique = clamp(c.dynamique + 1, -10, 10);
        res = `Bonne salle. Le segment visé bouge. Les caméras ont montré les drapeaux, pas les chaises vides.`;
      }
      break;
    }
    case "plateau": {
      // Si le joueur a tenu le direct lui-même, c'est sa prestation qui compte,
      // pas un jet caché : le plateau est le moment où l'aléatoire se voit.
      const perf =
        rang === "critique" ? 80 : rang === "reussite" ? 58 : rang === "echec" ? 40 : rang === "desastre" ? 15 : s.player.rhetorique * fatigueMalus + rng.int(-15, 15);
      if (perf > 55) {
        for (const id of ["pavillonnaires", "urbains", "retraites"]) s.segments[id].soutien = clamp(s.segments[id].soutien + 4);
        c.dynamique = clamp(c.dynamique + 3, -10, 10);
        res = "Prestation solide. Une formule fait mouche, elle sera reprise partout demain.";
      } else if (perf > 35) {
        for (const id of ["pavillonnaires", "urbains"]) s.segments[id].soutien = clamp(s.segments[id].soutien + 1);
        res = "Prestation sans relief. Philippe Bec vous trouve « gestionnaire ». Ce n'était pas un compliment.";
      } else {
        c.dynamique = clamp(c.dynamique - 4, -10, 10);
        s.power.presse = clamp(s.power.presse - 4);
        for (const id of ["pavillonnaires", "retraites"]) s.segments[id].soutien = clamp(s.segments[id].soutien - 3);
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
      // Une attaque peut se retourner : c'est l'action la plus volatile.
      const seRetourne = rang ? rang === "desastre" : rng.chance(0.25);
      if (seRetourne) {
        c.dynamique = clamp(c.dynamique - 4, -10, 10);
        s.segments["pavillonnaires"].soutien = clamp(s.segments["pavillonnaires"].soutien - 5);
        s.power.presse = clamp(s.power.presse - 5);
        res = "L'attaque se retourne : l'accusation était mal étayée, l'adversaire répond avec des documents. Vous passez la journée à vous expliquer au lieu de faire campagne.";
        break;
      }
      c.opposantScore = clamp(c.opposantScore - rate(rang === "critique" ? 11 : 7));
      for (const id of ["periurbain", "jeunes"]) s.segments[id].participation = clamp(s.segments[id].participation + 5);
      s.segments["pavillonnaires"].soutien = clamp(s.segments["pavillonnaires"].soutien - 3);
      s.segments["retraites"].soutien = clamp(s.segments["retraites"].soutien - 2);
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

export function runDebate(s: GameState, rng: Rng, beats: string[], rang?: CheckRang): string {
  const c = s.campaign!;
  c.debatFait = true;
  const fatigueMalus = s.hidden.fatigue > 70 ? -15 : s.hidden.fatigue > 50 ? -6 : 0;
  // La tenue du direct pèse autant que la composition de l'intervention.
  const tenue = rang === "critique" ? 20 : rang === "reussite" ? 6 : rang === "echec" ? -10 : rang === "desastre" ? -24 : 0;
  let score = s.player.rhetorique * 0.4 + fatigueMalus + tenue + rng.int(-10, 10);
  const lignes: string[] = [];

  // Une sauvegarde d'une version antérieure peut avoir gardé un mini-jeu en
  // attente sans son intervention : le débat se joue alors sans composition
  // plutôt que de bloquer la partie sur un bouton qui lève une exception.
  for (const b of beats ?? []) {
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
  // Une ligne marquée assèche le réservoir du second tour : on ne fait pas
  // barrage avec les voix d'un camp qu'on a passé cinq ans à désigner.
  const malusBord = Math.max(0, Math.abs(s.bord) - 3) * 0.028;
  if (opposantTribun) {
    // Front républicain — sauf si la dérive ou l'extrémisme l'ont tué.
    reportJoueur = 0.55 - s.derive * 0.035 - malusBord - (50 - s.power.popularite) * 0.004;
    recit.push(
      Math.abs(s.bord) >= 7
        ? "Il n'y a pas d'entre-deux-tours : deux candidats de rupture, aucun front, et un électorat modéré qui cherche publiquement où mettre son bulletin."
        : s.derive >= 5
          ? "L'entre-deux-tours est glacial. « Ni l'un ni l'autre », titrent trois quotidiens : le front républicain ne se lève pas pour vous."
          : "L'entre-deux-tours voit se former un front : on vote pour vous sans vous aimer, « pour faire barrage »."
    );
  } else {
    reportJoueur = 0.44 + (s.power.popularite - 45) * 0.005 + c.dynamique * 0.008 - malusBord;
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

export function makeCampaign(
  kind: CampaignState["kind"],
  opposantId: string,
  opposantScore: number,
  ligne?: string
): CampaignState {
  return {
    kind,
    week: 1,
    totalWeeks: kind === "presidentielle" ? 8 : 6,
    dynamique: 0,
    debatFait: false,
    opposantId,
    opposantScore,
    dossierAdversaire: 0,
    round: 1,
    ligneAdverse: ligne,
    ripostesJouees: [],
  };
}
