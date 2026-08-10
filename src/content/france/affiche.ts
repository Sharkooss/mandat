import type { GameState } from "../../engine/types";
import type { Rng } from "../../engine/rng";
import { bordMeta } from "../../engine/bord";
import { nomCompletDe } from "../../engine/noms";
import { duTheme, intentions } from "../../engine/campaign";
import { CAST, REGIONS, MILIEUX, FORMATIONS, MENTORS, CONVICTIONS, EVENEMENTS_FONDATEURS } from "./data";

// ---------------------------------------------------------------------------
// L'affiche : le face-à-face, avant la première semaine.
//
// Une campagne qui s'ouvre sur un tableau de boutons ne ressemble à rien. On
// commence donc par les deux visages, comme le font les chaînes le soir de
// l'annonce des candidatures : d'où vous venez, d'où il vient, ce que chacun
// promet, et pourquoi ça va se jouer là.
//
// Le parcours de l'adversaire est tiré à chaque partie et accordé à son genre :
// c'est ce qui fait qu'on ne rejoue jamais tout à fait le même duel.
// ---------------------------------------------------------------------------

/** Accord en genre — les textes d'ici sont les seuls du jeu à en avoir besoin. */
function acc(genre: "f" | "m", masculin: string, feminin: string): string {
  return genre === "f" ? feminin : masculin;
}

/** Minuscule sur la première lettre seulement : le reste est déjà ponctué. */
function minuscule(t: string): string {
  return t.charAt(0).toLowerCase() + t.slice(1);
}


export interface ParcoursAdverse {
  id: string;
  /** Ce dont la presse le crédite en une ligne — accordé, comme le reste. */
  etiquette: (genre: "f" | "m") => string;
  recit: (genre: "f" | "m") => string;
  atout: string | ((genre: "f" | "m") => string);
  faille: string;
  /** Le parcours n'est pas décoratif : il pèse sur la force de l'adversaire. */
  score?: number;
  /** Les segments que ce parcours lui apporte d'emblée. */
  segments?: string[];
}

export const PARCOURS_ADVERSES: ParcoursAdverse[] = [
  {
    id: "prefet",
    etiquette: (g) => acc(g, "Le haut fonctionnaire", "La haute fonctionnaire"),
    recit: (g) =>
      `Trente ans de préfectures et deux cabinets ministériels. ${acc(g, "Il n'a jamais été élu", "Elle n'a jamais été élue")} avant cette campagne, et ${acc(g, "il en fait", "elle en fait")} un argument : « Je n'ai jamais eu besoin d'un mandat pour faire fonctionner l'État. »`,
    atout: "Une maîtrise des dossiers qui rend tout débat technique dangereux pour vous.",
    faille: "Personne ne s'est jamais déplacé pour applaudir un préfet.",
    score: 3,
    segments: ["csp", "retraites"],
  },
  {
    id: "maire",
    etiquette: (g) => acc(g, "Le maire de terrain", "La maire de terrain"),
    recit: (g) =>
      `Dix-huit ans à la tête d'une ville de cent mille habitants, réélu${acc(g, "", "e")} trois fois dont une au premier tour. ${acc(g, "Il connaît", "Elle connaît")} le prénom de ses agents de propreté et le dit à chaque plateau, parce que ça marche.`,
    atout: "Un ancrage concret : chaque promesse est illustrée par quelque chose qui existe déjà.",
    faille: "Le pays n'est pas une commune, et un contradicteur le lui rappellera.",
    score: 2,
    segments: ["periurbain", "pavillonnaires", "ruraux"],
  },
  {
    id: "avocat",
    etiquette: () => "La robe et le prétoire",
    recit: (g) =>
      `Pénaliste, vingt ans de cours d'assises, une réputation ${acc(g, "d'orateur redoutable", "d'oratrice redoutable")} et de client difficile. ${acc(g, "Il a défendu", "Elle a défendu")} des causes indéfendables et gagné assez souvent pour qu'on ne l'oublie pas.`,
    atout: "En débat, la rhétorique est un métier — et c'est le sien.",
    faille: "Une liste de clients que vos équipes peuvent exhumer en trois jours.",
    score: 4,
    segments: ["urbains", "csp"],
  },
  {
    id: "syndicaliste",
    etiquette: (g) => acc(g, "Sorti du rang", "Sortie du rang"),
    recit: (g) =>
      `${acc(g, "Ouvrier", "Ouvrière")} à dix-huit ans, délégué${acc(g, "", "e")} à vingt-quatre, secrétaire général${acc(g, "", "e")} à quarante. ${acc(g, "Il a mené", "Elle a mené")} trois conflits que le pays a suivis au journal de 20 heures, et ${acc(g, "il en a gagné", "elle en a gagné")} deux.`,
    atout: "Une légitimité populaire que ni l'argent ni les instituts ne fabriquent.",
    faille: "Le patronat et les marchés le font savoir dès qu'il monte dans les sondages.",
    score: 3,
    segments: ["periurbain", "public", "quartiers"],
  },
  {
    id: "patron",
    etiquette: (g) => acc(g, "Venu de l'entreprise", "Venue de l'entreprise"),
    recit: (g) =>
      `${acc(g, "Fondateur", "Fondatrice")} d'un groupe industriel de quatre mille salariés, ${acc(g, "revendu", "revendue")} au bon moment. ${acc(g, "Il répète", "Elle répète")} qu'un pays se gère comme une entreprise, ce qui est faux et rassure énormément de gens.`,
    atout: "Une caisse de campagne que vous n'égalerez pas, et l'image de qui a « réussi ailleurs ».",
    faille: "Un montage fiscal en Irlande dont il faudra bien parler un jour.",
    score: 5,
    segments: ["csp", "independants", "pavillonnaires"],
  },
  {
    id: "medecin",
    etiquette: () => "La blouse blanche",
    recit: (g) =>
      `Chef${acc(g, "", "fe")} de service en réanimation, ${acc(g, "connu", "connue")} du pays depuis la dernière crise sanitaire, où ${acc(g, "il disait", "elle disait")} la vérité pendant que les ministres l'aménageaient.`,
    atout: "Une crédibilité morale intacte. On ne soupçonne pas quelqu'un qui a passé sa vie à sauver des gens.",
    faille: "Aucune expérience du rapport de force, et ça se verra au premier arbitrage.",
    score: 4,
    segments: ["public", "retraites", "urbains"],
  },
  {
    id: "militaire",
    etiquette: () => "L'uniforme",
    recit: (g) =>
      `Général${acc(g, "", "e")} de corps d'armée, quatre théâtres d'opérations, ${acc(g, "démissionnaire", "démissionnaire")} avec fracas après un désaccord public sur le budget. Le pays a retenu la lettre de démission, publiée en une.`,
    atout: "L'autorité incarnée, dans un pays qui doute de la sienne.",
    faille: "Chaque phrase sur les libertés lui coûte les urbains d'un bloc.",
    score: 4,
    segments: ["pavillonnaires", "retraites", "ruraux"],
  },
  {
    id: "tribun",
    etiquette: (g) => acc(g, "Le tribun", "La voix des meetings"),
    recit: (g) =>
      `Vingt ans de meetings, aucune fonction exécutive, une voix que tout le monde reconnaît en trois mots. ${acc(g, "Il n'a jamais gouverné", "Elle n'a jamais gouverné")} et le revendique : « On ne m'a jamais laissé${acc(g, "", "e")} essayer. »`,
    atout: "Une base qui se déplacera par tous les temps, et une capacité de meeting qui écrase la vôtre.",
    faille: "Le plafond de verre du second tour : on l'écoute, on ne l'élit pas. Sauf une fois.",
    score: 6,
    segments: ["periurbain", "jeunes"],
  },
  {
    id: "journaliste",
    etiquette: (g) => acc(g, "Passé par les médias", "Passée par les médias"),
    recit: (g) =>
      `Quinze ans de matinale, deux millions d'auditeurs chaque jour, une notoriété que personne n'a eu à construire. ${acc(g, "Il connaît", "Elle connaît")} les mécaniques de l'autre côté — la question piège, l'angle, le moment où l'on coupe.`,
    atout: "Un temps d'antenne naturel et l'art de ne jamais paraître pris en défaut.",
    faille: "Aucun appareil, aucun militant, personne pour coller les affiches.",
    score: 3,
    segments: ["retraites", "urbains", "pavillonnaires"],
  },
  {
    id: "heritier",
    etiquette: () => "Le nom de famille",
    recit: (g) =>
      `Petit-${acc(g, "fils", "fille")} d'un ancien Premier ministre, ${acc(g, "élevé", "élevée")} dans les couloirs où l'on décide. ${acc(g, "Il porte", "Elle porte")} un nom que la moitié du pays respecte et que l'autre moitié déteste, ce qui est une position de départ enviable.`,
    atout: "Un réseau, un carnet, et des soutiens qui se déclarent sans qu'on les sollicite.",
    faille: "L'accusation d'héritage colle à chaque phrase sur le mérite.",
    score: 2,
    segments: ["csp", "retraites"],
  },
  {
    id: "europe",
    etiquette: () => "Bruxelles",
    recit: (g) =>
      `${acc(g, "Commissaire européen", "Commissaire européenne")} pendant cinq ans, ${acc(g, "rentré", "rentrée")} avec un bilan que personne ne lit et une réputation de sérieux que tout le monde cite. ${acc(g, "Il parle", "Elle parle")} quatre langues et le fait savoir.`,
    atout: "Une stature internationale qui vous prive de votre meilleur terrain.",
    faille: "« Bruxelles » est une insulte dans trois quarts du pays.",
    score: 3,
    segments: ["urbains", "csp"],
  },
  {
    id: "outsider",
    etiquette: () => "Personne, il y a deux ans",
    recit: (g) =>
      `Inconnu${acc(g, "", "e")} il y a vingt-quatre mois. Un mouvement né en ligne, quatre cent mille adhérents revendiqués, aucun élu, et une ascension dans les sondages que trois instituts ont d'abord prise pour une erreur d'échantillon.`,
    atout: "La nouveauté absolue, dans un pays qui n'en peut plus des mêmes visages.",
    faille: "Rien ne tient : ni l'appareil, ni le programme, ni les cadres. Six semaines, c'est long.",
    score: 5,
    segments: ["jeunes", "quartiers", "periurbain"],
  },
  {
    id: "ministre",
    etiquette: (g) => acc(g, "L'ancien du gouvernement", "L'ancienne du gouvernement"),
    recit: (g) =>
      `Trois ministères, dont un régalien, et une sortie du gouvernement en claquant la porte sur une question de principe — ${acc(g, "il a choisi", "elle a choisi")} le moment, ce qui est la seule chose qui compte dans une démission.`,
    atout: (g) => `L'expérience sans l'usure : ${acc(g, "il a", "elle a")} gouverné assez pour être crédible, pas assez pour être comptable.`,
    faille: "Une partie de son propre camp ne lui a jamais pardonné le départ.",
    score: 4,
    segments: ["pavillonnaires", "retraites", "csp"],
  },
  {
    id: "sportive",
    etiquette: () => "La gloire nationale",
    recit: (g) =>
      `Deux titres mondiaux, un porte-drapeau olympique, une reconversion en fondation puis en mouvement. Le pays entier ${acc(g, "l'appelle par son prénom", "l'appelle par son prénom")}, ce qu'aucune campagne ne peut acheter.`,
    atout: "Une popularité brute, transpartisane, indifférente aux programmes.",
    faille: "La première question technique sera un massacre, et tout le monde l'attend.",
    score: 3,
    segments: ["jeunes", "quartiers", "periurbain"],
  },
];

const SLOGANS: string[] = [
  "« Le courage, maintenant »",
  "« Remettre le pays à l'endroit »",
  "« La France qui se lève tôt mérite mieux »",
  "« Reprendre la main »",
  "« Ni promesses, ni excuses »",
  "« L'ordre et la justice »",
  "« Un pays qui tient debout »",
  "« Ça suffit »",
  "« Le temps du sérieux »",
  "« Vous d'abord »",
  "« Réparer »",
  "« Rien ne se fera sans vous »",
];

/** Tire le parcours de l'adversaire pour cette partie. */
export function tirerPortraitAdverse(rng: Rng): { parcours: string; slogan: string } {
  return { parcours: rng.pick(PARCOURS_ADVERSES).id, slogan: rng.pick(SLOGANS) };
}

export function parcoursDe(id: string | undefined): ParcoursAdverse {
  return PARCOURS_ADVERSES.find((p) => p.id === id) ?? PARCOURS_ADVERSES[0];
}

// ---------------------------------------------------------------------------
// Les deux portraits
// ---------------------------------------------------------------------------

export interface Portrait {
  nom: string;
  etiquette: string;
  ligne: string;
  ligneTone: string;
  recit: string[];
  atout: string;
  faille: string;
  slogan: string;
}

export interface Affiche {
  titre: string;
  chapeau: string;
  vous: Portrait;
  adversaire: Portrait;
  /** Là où l'élection se jouera vraiment, calculé sur l'électorat réel. */
  champDeBataille: { nom: string; detail: string };
  sondage: { joueur: number; opposant: number; tiers: number };
}

const OPTION = (pool: { id: string; nom: string; detail: string }[], id: string) => pool.find((o) => o.id === id);

function portraitJoueur(s: GameState): Portrait {
  const g = s.bio.genre;
  const m = bordMeta(s.bord);
  const region = OPTION(REGIONS, s.bio.regionId);
  const milieu = OPTION(MILIEUX, s.bio.milieuId);
  const formation = OPTION(FORMATIONS, s.bio.formationId);
  const mentor = OPTION(MENTORS, s.bio.mentorId);
  const fondateur = OPTION(EVENEMENTS_FONDATEURS, s.bio.evenementId);
  const conviction = CONVICTIONS.find((c) => c.id === s.bio.convictionId);

  const recit: string[] = [];
  recit.push(
    `${s.bio.age} ans. ${region?.nom ?? "Origines discrètes"}, ${minuscule(milieu?.nom ?? "milieu modeste")}. ` +
      `${formation ? `${formation.nom} : ${minuscule(formation.detail)}` : "Un parcours qu'on résume mal."}`
  );
  // On cite les intitulés de l'Acte I, jamais leurs descriptions : celles-ci
  // sont écrites au masculin dans le contenu (« Battu à 21 ans »), et une
  // présidente ne doit pas lire sa propre biographie mal accordée.
  if (fondateur) {
    recit.push(`Ce qui vous a fait entrer en politique : ${minuscule(fondateur.nom)}. Les portraits de campagne y reviendront tous.`);
  }
  if (mentor) {
    recit.push(
      `${mentor.nom} vous a formé${acc(g, "", "e")}. ` +
        `On vous le rappellera à chaque fois que vous prétendrez ne rien devoir à personne.`
    );
  }

  // Les deux aptitudes qui vous distinguent, et celle qui vous manque.
  const aptitudes: [string, number][] = [
    ["le charisme", s.player.charisme],
    ["la rhétorique", s.player.rhetorique],
    ["la stratégie", s.player.strategie],
    ["l'intégrité", s.player.integrite],
    ["l'endurance", s.player.endurance],
    ["le réseau", s.player.reseau],
  ];
  const tri = [...aptitudes].sort((a, b) => b[1] - a[1]);

  return {
    nom: `${s.bio.prenom} ${s.bio.nom}`,
    etiquette:
      s.campaign?.kind === "reelection"
        ? `${acc(g, "Président sortant", "Présidente sortante")}`
        : `${acc(g, "Candidat", "Candidate")} à la présidence de la République`,
    ligne: m.label,
    ligneTone: m.tone,
    recit,
    atout: `Ce sur quoi vous pouvez compter : ${tri[0][0]}, puis ${tri[1][0]}. Toute votre campagne devrait passer par là.`,
    faille: `Ce qui vous manquera : ${tri[tri.length - 1][0]}. Vos adversaires le savent avant vous.`,
    slogan: conviction ? conviction.nom : "« Un cap »",
  };
}

function portraitAdverse(s: GameState): Portrait {
  const c = s.campaign!;
  const def = CAST.find((x) => x.id === c.opposantId);
  const g = def?.genre ?? "f";
  const p = parcoursDe(c.portraitAdversaire?.parcours);
  const nom = def ? nomCompletDe(s, c.opposantId) : "Maryse Cottin";
  // Sa ligne se place à l'opposé de la vôtre — c'est ce qui en fait un duel.
  const bordAdverse = Math.max(-10, Math.min(10, s.bord > 0 ? s.bord - 7 : s.bord + 7));
  const m = bordMeta(bordAdverse);

  const recit: string[] = [p.recit(g)];
  recit.push(
    `Les instituts ${acc(g, "le créditent", "la créditent")} d'un socle solide et d'une réserve de voix au second tour que vos équipes jugent « préoccupante ». ` +
      `${acc(g, "Il a fait", "Elle a fait")} ${duTheme(c.ligneAdverse ?? "votre bilan")} son sujet, et ${acc(g, "il n'en changera pas", "elle n'en changera pas")}.`
  );

  return {
    nom,
    etiquette: p.etiquette(g),
    ligne: m.label,
    ligneTone: m.tone,
    recit,
    atout: typeof p.atout === "function" ? p.atout(g) : p.atout,
    faille: p.faille,
    slogan: c.portraitAdversaire?.slogan ?? SLOGANS[0],
  };
}

/** Là où l'élection se joue : le segment lourd où l'écart est le plus mince. */
function champDeBataille(s: GameState): { nom: string; detail: string } {
  const POIDS: Record<string, number> = {
    retraites: 20, periurbain: 15, urbains: 10, jeunes: 12, ruraux: 8,
    pavillonnaires: 12, quartiers: 7, public: 9, independants: 4, csp: 3,
  };
  // Le bloc le plus lourd parmi ceux qui n'ont choisi ni l'un ni l'autre :
  // un segment acquis ne se dispute pas, un segment perdu ne se reprend pas.
  const def = Object.values(s.segments)
    .map((seg) => ({ seg, enjeu: (POIDS[seg.id] ?? 0) * (1 - Math.abs(seg.soutien - 50) / 50) }))
    .sort((a, b) => b.enjeu - a.enjeu)[0]?.seg;
  if (!def) {
    return {
      nom: "Les indécis",
      detail: "Aucun bloc ne domine. L'élection se jouera sur la participation, c'est-à-dire sur la météo et sur la lassitude.",
    };
  }
  // Le commentaire doit dire ce que le chiffre dit, pas l'inverse : un bloc à
  // 68 % n'est pas « à prendre », il est à ne pas perdre.
  const etat =
    def.soutien >= 58
      ? "Il est à vous, et c'est précisément ce qui le rend dangereux : tout ce que vous y gagnerez sera marginal, tout ce que vous y perdrez sera décisif."
      : def.soutien >= 45
        ? "Ni l'un ni l'autre ne le tient. Il décidera de l'élection, et il ne le sait pas encore."
        : "Il penche contre vous sans être perdu. C'est le seul bloc lourd sur lequel six semaines peuvent encore tout changer.";
  return {
    nom: SEGMENT_NOMS[def.id] ?? def.id,
    detail: `${Math.round(def.soutien)} % de soutien, ${Math.round(def.participation)} % de participation attendue. ${etat}`,
  };
}

const SEGMENT_NOMS: Record<string, string> = {
  retraites: "Les retraités",
  periurbain: "Les ouvriers et employés du périurbain",
  urbains: "Les cadres urbains diplômés",
  jeunes: "Les 18-30 ans",
  ruraux: "Les ruraux et agriculteurs",
  pavillonnaires: "Les classes moyennes pavillonnaires",
  quartiers: "Les quartiers populaires",
  public: "Les fonctionnaires",
  independants: "Les indépendants et commerçants",
  csp: "Les CSP+",
};

export function affiche(s: GameState): Affiche {
  const c = s.campaign!;
  const i = intentions(s);
  const reelection = c.kind === "reelection";
  return {
    titre: reelection ? "Le duel de la réélection" : "Le duel",
    chapeau: reelection
      ? "Les candidatures sont closes. Les chaînes ont sorti les génériques, les instituts leurs premières vagues, et le pays découvre ce soir l'affiche qu'il aura pendant six semaines. Vous n'êtes plus président que la moitié du temps : l'autre moitié, vous êtes un candidat qui doit défendre cinq ans."
      : "Les candidatures sont closes. Ce soir, les chaînes diffusent le même sujet de trois minutes : deux parcours, deux visages, et une question qu'on posera cinq cents fois d'ici au vote — lequel des deux ressemble le plus à ce que le pays veut devenir.",
    vous: portraitJoueur(s),
    adversaire: portraitAdverse(s),
    champDeBataille: champDeBataille(s),
    sondage: {
      joueur: Math.round(i.joueur),
      opposant: Math.round(i.opposant),
      tiers: Math.round(i.tiers),
    },
  };
}
