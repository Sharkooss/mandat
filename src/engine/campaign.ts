import type { CampaignState, CheckRang, GameState } from "./types";
import type { Rng } from "./rng";
import { clamp, makeCtx } from "./ctx";
import { nomCompletDe } from "./noms";
import { PROMESSES } from "../content/france/data";

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
  // Le réservoir des voix qui ne sont à personne. Il ne bouge que par un
  // ralliement — c'est le seul geste de campagne qui change l'arithmétique
  // plutôt que de déplacer des points d'un segment à l'autre.
  const tiersRaw = c.tiers ?? 18;
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
  // Un focus group ne change pas le score : il change ce que vous en savez.
  const bruit = c.sondageFiable ? 0 : 4;
  return {
    joueur: Math.round(clamp(i.joueur + (rng.next() - 0.5) * bruit + c.dynamique * 0.4, 5, 90)),
    opposant: Math.round(clamp(i.opposant + (rng.next() - 0.5) * bruit - c.dynamique * 0.2, 5, 90)),
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

/**
 * « faire de X son sujet » : les thèmes sont écrits avec leur article, et
 * « de le chômage » ne se dit pas. On contracte plutôt que de découper.
 */
export function duTheme(theme: string): string {
  const t = theme.trim();
  if (/^les\s/i.test(t)) return "des " + t.slice(4).toLowerCase();
  if (/^le\s/i.test(t)) return "du " + t.slice(3).toLowerCase();
  if (/^la\s/i.test(t)) return "de la " + t.slice(3).toLowerCase();
  if (/^l'/i.test(t)) return "de l'" + t.slice(2).toLowerCase();
  return "de " + t.charAt(0).toLowerCase() + t.slice(1);
}

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
  const texte = `${nom} a fait ${duTheme(choisie.theme)} son sujet de la semaine. ${choisie.attaque(s)}${
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
  /** Toutes les semaines ne rendent pas tout possible. */
  cond?: (s: GameState) => boolean;
  /** Poids dans le tirage hebdomadaire — la routine sort plus que l'exception. */
  poids?: number | ((s: GameState) => number);
  /** Nombre de semaines avant de pouvoir la reprendre. */
  cooldown?: number;
}

/** L'argent de campagne : levé aux dîners, dépensé en affichage et en spots. */
export function budgetCampagne(s: GameState): number {
  return (s.flags["budget_campagne"] as number) ?? 0;
}

export const CAMPAIGN_ACTIONS: CampaignAction[] = [
  {
    id: "meeting",
    nom: "Meeting régional",
    detail: "Deux mille personnes, un segment visé. Le socle se construit là.",
    fatigue: 8,
    needSegment: true,
    poids: 3,
  },
  {
    id: "meeting_geant",
    nom: "Le meeting de Bercy",
    detail: "Vingt mille personnes, une seule soirée, tout le pays qui regarde. Épuisant.",
    fatigue: 18,
    cooldown: 99,
    cond: (s) => s.campaign!.week >= s.campaign!.totalWeeks - 3,
    poids: 2.2,
  },
  {
    id: "plateau",
    nom: "Plateau télévisé",
    detail: "Toucher large. Votre rhétorique décide — et votre fatigue se voit.",
    fatigue: 6,
    poids: 2.6,
  },
  {
    id: "porte_a_porte",
    nom: "Porte-à-porte militant",
    detail: "Vos militants, pas vous. Ça ne fait pas d'images : ça fait des votants.",
    fatigue: 4,
    cond: (s) => s.power.parti >= 32,
    poids: (s) => (s.power.parti >= 55 ? 2.4 : 1.4),
  },
  {
    id: "spot_tv",
    nom: "Affichage et spots",
    detail: "Acheter l'espace. Coûte une levée de fonds, se voit partout pendant huit jours.",
    fatigue: 2,
    cond: (s) => budgetCampagne(s) >= 1,
    poids: 2.2,
  },
  {
    id: "fonds",
    nom: "Levée de fonds",
    detail: "Dîner en ville. Les CSP+ signent des chèques, la presse compte les petits fours.",
    fatigue: 4,
    poids: 2,
  },
  {
    id: "attaque",
    nom: "Attaque de l'adversaire",
    detail: "Votre base adore. Les modérés, moins. Et ça peut se retourner.",
    fatigue: 5,
    poids: 2.4,
  },
  {
    id: "contre_feu",
    nom: "Éteindre l'incendie",
    detail: "Répondre au sujet qu'il vous a imposé cette semaine, et rien d'autre.",
    fatigue: 6,
    cond: (s) => !!s.campaign!.derniereRiposte,
    poids: 3.2,
  },
  {
    id: "annonce",
    nom: "Grande annonce",
    detail: "Mettre une mesure du programme en pleine lumière. Les électeurs vérifieront.",
    fatigue: 6,
    cond: (s) => s.promises.some((p) => p.status === "en_cours"),
    poids: 2,
  },
  {
    id: "promesse_choc",
    nom: "La promesse hors programme",
    detail: "Une annonce que personne n'a chiffrée. Énorme tout de suite. On vous la ressortira.",
    fatigue: 7,
    cooldown: 99,
    poids: 1.6,
  },
  {
    id: "dossier",
    nom: "Faire travailler les équipes",
    detail: "Chercher ce que l'adversaire cache. Utile pour le débat.",
    fatigue: 2,
    cond: (s) => s.campaign!.dossierAdversaire < 3,
    poids: 1.8,
  },
  {
    id: "ralliement",
    nom: "Négocier un ralliement",
    detail: "Aller chercher une figure du camp d'en face. Ça se paie, et ça change l'arithmétique.",
    fatigue: 6,
    cooldown: 3,
    cond: (s) => s.player.reseau >= 40,
    poids: 1.7,
  },
  {
    id: "terrain",
    nom: "Marché, usine, salon agricole",
    detail: "Le terrain, sans filtre : des mains serrées et deux engueulades filmées.",
    fatigue: 7,
    poids: 2.4,
  },
  {
    id: "numerique",
    nom: "Campagne en ligne",
    detail: "Là où sont les moins de trente ans. Personne ne contrôle ce qui en sort.",
    fatigue: 3,
    poids: 2,
  },
  {
    id: "focus_group",
    nom: "Réunion d'électeurs indécis",
    detail: "Six personnes derrière une glace sans tain. Ce qu'elles disent vaut tous les sondages.",
    fatigue: 3,
    cooldown: 99,
    poids: 1.8,
  },
  {
    id: "repos",
    nom: "Repos",
    detail: "Une journée à la campagne. La presse dira que vous fuyez.",
    fatigue: -22,
    poids: (s) => (s.hidden.fatigue > 60 ? 2.5 : 0.8),
  },
];

const ACTIONS_PAR_SEMAINE = 4;

/**
 * Le menu de la semaine. Quatre possibilités, jamais les mêmes : une campagne
 * où l'on dispose chaque semaine de tout l'éventail n'est pas une campagne,
 * c'est une liste de courses. Le tirage force à faire avec ce que la semaine
 * offre — et rend le meeting de Bercy ou le ralliement mémorables.
 */
export function tirerActionsSemaine(s: GameState, rng: Rng): string[] {
  const c = s.campaign!;
  const faites = c.actionsFaites ?? {};
  const dispo = CAMPAIGN_ACTIONS.filter((a) => {
    if (a.cond && !a.cond(s)) return false;
    const quand = faites[a.id];
    if (quand !== undefined && a.cooldown && c.week - quand < a.cooldown) return false;
    return true;
  });

  const tires: string[] = [];
  // Un candidat épuisé doit toujours pouvoir souffler : sans ce garde-fou, le
  // tirage pourrait le condamner à finir la campagne à genoux.
  if (s.hidden.fatigue > 62 && dispo.some((a) => a.id === "repos")) tires.push("repos");

  const restants = dispo.filter((a) => !tires.includes(a.id));
  while (tires.length < ACTIONS_PAR_SEMAINE && restants.length > 0) {
    const choisi = rng.weighted(
      restants.map((a) => {
        const base = typeof a.poids === "function" ? a.poids(s) : (a.poids ?? 1);
        // Ce qu'on n'a pas encore fait de la campagne sort plus volontiers.
        return { item: a, weight: base * (faites[a.id] === undefined ? 1.8 : 1) };
      })
    );
    restants.splice(restants.indexOf(choisi), 1);
    tires.push(choisi.id);
  }
  return tires;
}

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

  const seg = (id: string, d: { soutien?: number; participation?: number }) => {
    const sg = s.segments[id];
    if (!sg) return;
    if (d.soutien) sg.soutien = clamp(sg.soutien + d.soutien);
    if (d.participation) sg.participation = clamp(sg.participation + d.participation);
  };
  const dyn = (n: number) => { c.dynamique = clamp(c.dynamique + n, -10, 10); };

  switch (actionId) {
    case "meeting": {
      const cible = segmentId ?? "pavillonnaires";
      // Quand le joueur a tenu la salle lui-même, la tribune paie double.
      const bonus = rang === "critique" ? 1.6 : rang === "desastre" ? 0.3 : rang === "echec" ? 0.7 : 1;
      const gain = Math.round(rate(12 + Math.floor(s.player.charisme / 12)) * bonus);
      seg(cible, { soutien: gain, participation: Math.round(rate(11) * bonus) });
      const rate_ = rang ? rang === "echec" || rang === "desastre" : fatigueMalus < 0.7 && rng.chance(0.4);
      if (rate_) {
        dyn(-2);
        res = "Salle correcte, discours récité. Vous avez confondu deux villes à la tribune — la séquence tourne en boucle.";
      } else {
        dyn(2);
        res = "Bonne salle, et elle est venue pour vous. Le segment visé bouge franchement. Les caméras ont montré les drapeaux, pas les chaises vides.";
      }
      break;
    }
    case "meeting_geant": {
      const perf = rang === "critique" ? 90 : rang === "desastre" ? 20 : rang === "echec" ? 40 : s.player.charisme * fatigueMalus + rng.int(-12, 18);
      if (perf > 50) {
        for (const id of Object.keys(s.segments)) seg(id, { participation: rate(7) });
        for (const id of ["periurbain", "pavillonnaires", "jeunes", "retraites"]) seg(id, { soutien: rate(8) });
        dyn(6);
        s.power.presse = clamp(s.power.presse + 5);
        res = "Vingt mille personnes debout, une heure quarante sans notes, et la séquence des drapeaux qui passera en boucle jusqu'au vote. Ce n'est pas un meeting, c'est une démonstration : elle dit au pays que vous pouvez encore remplir une salle, et à votre camp qu'il n'a pas à chercher ailleurs.";
      } else {
        dyn(-5);
        s.power.presse = clamp(s.power.presse - 6);
        for (const id of ["pavillonnaires", "retraites"]) seg(id, { soutien: -4 });
        res = "La salle n'est pleine qu'aux deux tiers, et le plan large le montre. Vous parlez cinquante minutes de trop devant des gens qui applaudissent par politesse. Les rédactions ne parleront que des gradins vides — elles ont raison, c'est la seule information de la soirée.";
      }
      break;
    }
    case "plateau": {
      // Si le joueur a tenu le direct lui-même, c'est sa prestation qui compte,
      // pas un jet caché : le plateau est le moment où l'aléatoire se voit.
      const perf =
        rang === "critique" ? 80 : rang === "reussite" ? 58 : rang === "echec" ? 40 : rang === "desastre" ? 15 : s.player.rhetorique * fatigueMalus + rng.int(-15, 15);
      if (perf > 55) {
        for (const id of ["pavillonnaires", "urbains", "retraites", "independants"]) seg(id, { soutien: 7 });
        dyn(4);
        s.power.presse = clamp(s.power.presse + 4);
        res = "Prestation solide. Une formule fait mouche, elle sera reprise partout demain — et par les deux camps, ce qui est le signe qu'elle a porté.";
      } else if (perf > 35) {
        for (const id of ["pavillonnaires", "urbains"]) seg(id, { soutien: 2 });
        res = "Prestation sans relief. Philippe Bec vous trouve « gestionnaire ». Ce n'était pas un compliment.";
      } else {
        dyn(-5);
        s.power.presse = clamp(s.power.presse - 6);
        for (const id of ["pavillonnaires", "retraites"]) seg(id, { soutien: -5 });
        res = "Un trou. Huit secondes de silence en direct. Le clip a déjà deux millions de vues.";
      }
      break;
    }
    case "porte_a_porte": {
      // Le militantisme ne convainc pas les convaincus : il va chercher ceux
      // qui vous aiment bien et ne se déplacent pas. C'est le nerf réel du vote.
      const force = 6 + Math.round(s.power.parti / 12);
      const cibles = Object.values(s.segments)
        .sort((a, b) => a.participation - b.participation)
        .slice(0, 3);
      for (const sg of cibles) seg(sg.id, { participation: rate(force), soutien: 3 });
      s.power.parti = clamp(s.power.parti + 3);
      dyn(1);
      res = "Quatre mille militants, cent vingt mille portes, et pas une caméra. On vous claque au nez, on discute vingt minutes, on promet d'y réfléchir. C'est le travail le moins gratifiant de la politique et celui qui décide des élections serrées : on ne convainc pas, on fait sortir.";
      break;
    }
    case "spot_tv": {
      s.flags["budget_campagne"] = budgetCampagne(s) - 1;
      for (const id of Object.keys(s.segments)) seg(id, { soutien: rate(5) });
      dyn(3);
      res = "Huit jours d'occupation de l'espace : abribus, avant-programmes, préroll. Le message est simple parce qu'il doit survivre à trente secondes. Personne ne dira que c'était beau ; tout le monde l'aura vu quatre fois, et c'est exactement le but.";
      break;
    }
    case "fonds": {
      seg("csp", { soutien: 8 });
      s.flags["budget_campagne"] = budgetCampagne(s) + 1;
      s.power.patronat = clamp(s.power.patronat + 4);
      s.power.presse = clamp(s.power.presse - 3);
      res = "Les chèques sont signés. Espitalier note tout dans un carnet. Vous préférez ne pas savoir lequel. La caisse est refaite : elle servira à acheter l'espace que le talent ne suffit pas à occuper.";
      break;
    }
    case "attaque": {
      // Une attaque peut se retourner : c'est l'action la plus volatile.
      const seRetourne = rang ? rang === "desastre" : rng.chance(0.25);
      if (seRetourne) {
        dyn(-5);
        seg("pavillonnaires", { soutien: -7 });
        s.power.presse = clamp(s.power.presse - 6);
        res = "L'attaque se retourne : l'accusation était mal étayée, l'adversaire répond avec des documents. Vous passez la journée à vous expliquer au lieu de faire campagne.";
        break;
      }
      c.opposantScore = clamp(c.opposantScore - rate(rang === "critique" ? 16 : 11));
      for (const id of ["periurbain", "jeunes"]) seg(id, { participation: 7 });
      seg("pavillonnaires", { soutien: -3 });
      seg("retraites", { soutien: -3 });
      dyn(2);
      res = "La pique est cruelle et juste. Votre base jubile, et surtout elle se lève. Les modérés trouvent ça « petit » — ils le trouveront encore le jour du vote.";
      break;
    }
    case "contre_feu": {
      // Répondre coûte une semaine entière et ne rapporte rien de neuf : ça
      // reprend seulement ce que la riposte avait pris. C'est ça, une campagne.
      const ok = rang ? rang !== "echec" && rang !== "desastre" : s.player.rhetorique + rng.int(-14, 18) > 46;
      const theme = RIPOSTES.find((r) => r.id === (c.ripostesJouees ?? []).slice(-1)[0]);
      if (ok) {
        dyn(4);
        c.opposantScore = clamp(c.opposantScore - 4);
        for (const id of theme?.segments ?? ["pavillonnaires"]) seg(id, { soutien: 6 });
        c.derniereRiposte = undefined;
        res = `Vous prenez le sujet de front, avec des chiffres et une phrase courte, et vous ne parlez que de ça pendant trois jours. Le sujet meurt d'avoir été traité${
          theme ? ` : « ${theme.theme.toLowerCase()} » disparaît des titres` : ""
        }. Vous n'avez rien gagné cette semaine — vous avez simplement cessé de perdre, ce qui en campagne est une victoire.`;
      } else {
        dyn(-3);
        c.opposantScore = clamp(c.opposantScore + 3);
        res = "Vous répondez, donc vous validez. Pendant quatre jours, chaque journal ouvre sur le sujet qu'il a choisi, avec votre démenti en troisième paragraphe. On ne gagne jamais une campagne sur le terrain de l'autre, et vous venez de payer une semaine pour le réapprendre.";
      }
      break;
    }
    case "annonce": {
      const promesses = s.promises.filter((p) => p.status === "en_cours");
      if (promesses.length > 0) {
        const p = rng.pick(promesses);
        const def = PROMESSES.find((x) => x.id === p.id);
        s.flags[`annonce_${p.id}`] = true;
        for (const id of def?.segments ?? []) seg(id, { soutien: 11, participation: 6 });
        dyn(4);
        res = `L'annonce fait la une et sort du lot parce qu'elle est déjà écrite au programme : ${
          def ? `« ${def.label} »` : "la mesure"
        }. Les électeurs concernés l'ont notée. Ils vérifieront — et vous aurez cinq ans pour tenir.`;
      } else {
        res = "Rien de neuf à annoncer. La conférence de presse tourne au bilan météo.";
      }
      break;
    }
    case "promesse_choc": {
      // Le meilleur coup de campagne et la pire dette : le registre des paroles
      // s'en souviendra, et l'adversaire la ressortira au premier reniement.
      const cible = rng.pick(["retraites", "periurbain", "jeunes", "public", "pavillonnaires"]);
      const libelle = ANNONCES_CHOC[cible];
      seg(cible, { soutien: 16, participation: 9 });
      seg("csp", { soutien: -6 });
      dyn(6);
      s.power.presse = clamp(s.power.presse - 4);
      makeCtx(s, rng).dire("promesse_choc", libelle, "en direct, sans l'avoir dit à votre équipe");
      res = `Vous l'annoncez sans prévenir personne : « ${libelle}. » Votre directeur de campagne apprend la nouvelle en même temps que le pays et sort de la pièce. C'est l'annonce de la semaine, peut-être de la campagne. Elle n'est ni chiffrée, ni arbitrée, ni tenable telle quelle — et elle vient d'entrer dans les archives.`;
      break;
    }
    case "dossier": {
      c.dossierAdversaire = Math.min(3, c.dossierAdversaire + 1);
      res =
        c.dossierAdversaire >= 3
          ? "Le dossier est complet : des pièces, des dates, deux témoins qui parleront. Vos équipes vous le remettent sans commentaire — elles savent que ce n'est plus une question de solidité mais de ce que vous acceptez d'être."
          : "Les équipes ont trouvé quelque chose. Incomplet, invérifiable en l'état, utilisable en débat — si vous osez, et si vous avez de quoi tenir.";
      break;
    }
    case "ralliement": {
      const ok = rang ? rang !== "echec" && rang !== "desastre" : s.player.reseau + rng.int(-18, 18) > 48;
      if (ok) {
        // Le seul geste qui touche au réservoir des tiers : ce sont des voix
        // qui n'étaient à personne et qui basculent d'un bloc.
        c.tiers = Math.max(8, (c.tiers ?? 18) - 4);
        c.opposantScore = clamp(c.opposantScore - 5);
        for (const id of ["pavillonnaires", "retraites", "independants"]) seg(id, { soutien: 5 });
        dyn(3);
        s.player.integrite = clamp(s.player.integrite - 3);
        res = "La photo est prise sur le perron, brève, et elle vaut plus que trois meetings : une figure de l'autre bord vous rejoint. Le prix a été fixé en quarante minutes — une circonscription, une commission, une promesse de ministère jamais écrite. Une partie de l'électorat qui n'était à personne vient de trouver une raison de choisir.";
      } else {
        dyn(-2);
        s.power.presse = clamp(s.power.presse - 4);
        res = "La négociation fuite avant d'aboutir. On apprend le prix demandé avant d'apprendre le ralliement, et le ralliement n'aura pas lieu. Il ne reste que le prix, imprimé en gros, et l'impression que tout s'achète chez vous.";
      }
      break;
    }
    case "terrain": {
      const cible = rng.pick(["periurbain", "ruraux", "independants"]);
      const chahut = rng.chance(s.power.popularite < 38 ? 0.45 : 0.2);
      if (chahut) {
        seg(cible, { soutien: rate(6), participation: 4 });
        dyn(rang === "critique" ? 3 : -1);
        s.power.presse = clamp(s.power.presse + 3);
        res = "On vous prend à partie devant les caméras, longuement, et vous restez. Vingt minutes de face-à-face avec quelqu'un qui n'a rien à perdre. La séquence tourne partout : la moitié du pays trouve que vous avez tenu, l'autre que vous n'auriez jamais dû y aller.";
      } else {
        seg(cible, { soutien: rate(10), participation: rate(7) });
        dyn(1);
        res = "Des mains serrées, un café offert, une gueulante saine sur les charges. Rien de spectaculaire, rien de reprenable en trente secondes — et pourtant c'est là que se décide le vote de ceux qui ne regardent aucun plateau.";
      }
      break;
    }
    case "numerique": {
      const bad = rng.chance(0.25);
      if (bad) {
        seg("jeunes", { participation: 5, soutien: -4 });
        dyn(-3);
        res = "La séquence est détournée dans l'heure. Elle atteint quinze millions de vues, ce dont votre équipe se félicite avant de la regarder. Vous êtes devenu un format. On ne redevient jamais un candidat après ça.";
      } else {
        seg("jeunes", { participation: rate(14), soutien: rate(9) });
        seg("urbains", { participation: 5 });
        dyn(2);
        res = "Trois formats courts, un direct d'une heure sans cravate, et une réponse à une question que personne n'ose poser en plateau. Le segment le plus abstentionniste du pays commence à envisager de se déplacer — c'est douze pour cent du corps électoral qui sort du décor.";
      }
      break;
    }
    case "focus_group": {
      // L'information est un avantage réel : le sondage cesse de mentir.
      c.sondageFiable = true;
      const faible = Object.values(s.segments).sort((a, b) => a.soutien - b.soutien)[0];
      seg(faible.id, { soutien: 4 });
      dyn(1);
      res = `Six indécis, deux heures, une glace sans tain. Ils ne parlent pas de vos mesures : ils parlent de votre voix, d'une phrase entendue il y a trois ans, de leur facture d'électricité. Vous ressortez avec deux formules que vous n'auriez jamais trouvées seul et avec la certitude que vos sondages mentaient d'environ trois points. À partir de maintenant, vous savez lire les vôtres.`;
      break;
    }
    case "repos": {
      s.hidden.sante = clamp(s.hidden.sante + 3);
      dyn(-1);
      res = "Vingt-quatre heures sans caméra. La presse écrit que vous « disparaissez ». Vous dormez, et c'est la décision la plus rationnelle de la semaine : les six derniers jours d'une campagne se jouent sur ce qu'il vous reste.";
      break;
    }
  }

  // Le menu de la semaine suivante se tire maintenant : deux semaines ne se
  // ressemblent jamais, et une occasion manquée l'est vraiment.
  c.actionsFaites = { ...(c.actionsFaites ?? {}), [actionId]: c.week };
  return res;
}

/** Ce qu'on lâche en direct quand la semaine tourne mal. */
const ANNONCES_CHOC: Record<string, string> = {
  retraites: "Aucune pension ne passera sous le seuil de pauvreté, dès la première année",
  periurbain: "Je bloquerai le prix des carburants, et je le ferai par décret s'il le faut",
  jeunes: "Le premier logement sera garanti par l'État pour tous les moins de trente ans",
  public: "Il n'y aura pas une seule suppression de poste à l'hôpital pendant ce mandat",
  pavillonnaires: "Je supprimerai cet impôt, en totalité, la première année",
};

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
