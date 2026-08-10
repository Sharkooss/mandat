import type { Ctx, GameState } from "../../engine/types";
import { NATIONS } from "./data";
import { chantiersDuProgramme } from "./programme";
import { alliees, defDe, hostiles, majorite } from "../../engine/europe";

// ---------------------------------------------------------------------------
// Les actions de capital politique (3 points par semestre — jamais assez).
// ---------------------------------------------------------------------------

export interface ActionDef {
  id: string;
  nom: string;
  cout: number;
  detail: string;
  cond?: (s: GameState) => boolean;
  effects: (c: Ctx, param?: string) => string;
  needParam?: "reforme" | "personnage" | "region" | "nation";
  /** Candidats proposés quand l'action porte sur quelqu'un. */
  candidats?: (s: GameState) => string[];
  /** Toujours proposée (socle) plutôt que soumise au tirage. */
  socle?: boolean;
  /** Nombre de semestres avant de pouvoir la reprendre. */
  cooldown?: number;
  /**
   * Opportunité : une fenêtre que la situation ouvre, jamais deux fois. Elle ne
   * se présente que si sa `cond` est remplie **plusieurs semestres d'affilée**
   * (ou si un événement l'a déclenchée), une seule à la fois, et elle disparaît
   * définitivement du jeu dès qu'on l'a saisie — c'est ce qui rend le choix de
   * la saisir ou non intéressant.
   */
  opportunite?: boolean;
  /** Pour une opportunité : à quel point elle se fait attendre. */
  rarete?: OpportuniteRarete;
  /**
   * Le ou les drapeaux qui l'arment. Quand le champ est présent, l'occasion naît
   * d'un événement précis et non d'une conjonction de jauges : elle est mûre
   * immédiatement, et peut donc tomber n'importe quand. Tant qu'aucun des
   * drapeaux n'est posé, elle n'existe pas — on ne la verra jamais.
   *
   * Plusieurs drapeaux valent « l'un ou l'autre » : une même fenêtre peut
   * s'ouvrir par plusieurs chemins, et c'est ce qui fait qu'elle reste
   * atteignable sans devenir automatique.
   */
  declencheur?: string | string[];
  /**
   * Le signe avant-coureur, glissé au briefing le semestre où la situation
   * commence à s'installer. Une occasion doit s'annoncer avant de se présenter.
   */
  signal?: string;
  /** Ce qui l'a ouverte, affiché sur la carte : le joueur doit savoir pourquoi. */
  pourquoi?: string;
  icone: string;
  tone: string;
}

/**
 * Trois degrés de rareté. Le nombre sert à la fois de poids dans le tirage et
 * de probabilité que l'opportunité tirée se présente vraiment : une occasion
 * historique reste rare même quand toutes ses conditions sont réunies.
 */
export type OpportuniteRarete = "rare" | "exceptionnelle" | "historique";

export const CHANCE_OPPORTUNITE: Record<OpportuniteRarete, number> = {
  rare: 0.6,
  exceptionnelle: 0.42,
  historique: 0.24,
};

export interface ReformeDef {
  id: string;
  nom: string;
  cout: number;
  promesse?: string;
  detail: string;
  /**
   * Ce qui doit être vrai pour que le chantier existe. Les chantiers écrits à la
   * main sont toujours ouverts ; ceux que le programme engendre n'existent que
   * parce qu'on les a promis.
   */
  cond?: (s: GameState) => boolean;
  /** Couleur de la carte — les chantiers écrits la tiennent de l'interface. */
  tone?: string;
  effects: (c: Ctx) => string;
}

/**
 * Les chantiers écrits un par un : ceux qui ont leur propre mécanique, leurs
 * conséquences différées et leur texte. Ils sont engageables même sans les avoir
 * promis — on peut très bien lancer un plan hôpital dont on n'avait rien dit.
 */
const REFORMES_ECRITS: ReformeDef[] = [
  {
    id: "ref_retraites",
    nom: "La réforme des retraites",
    cout: 3,
    promesse: "retraite_oui",
    detail: "Le dossier maudit. Tous vos conseillers sont pour, tous les segments contre.",
    effects: (c) => {
      c.flag("retraites_lancee");
      c.sched("retraites_1", 1, 1, 1);
      return "Le compte à rebours est lancé : le projet part en concertation, c'est-à-dire au front. Rendez-vous au prochain semestre pour la table des négociations — apportez votre casque.";
    },
  },
  {
    id: "ref_hopital",
    nom: "Le plan hôpital",
    cout: 2,
    promesse: "hopital",
    detail: "Cher, lent, nécessaire.",
    effects: (c) => {
      c.adj({ country: { marge: -5, services: 3 } });
      c.promesse("hopital", "partielle");
      c.sched("hopital_fruits", 8, 14, 0.6);
      return "Salaires, lits, gouvernance : le plan est complet et coûteux. Ses effets réels arriveront dans deux à trois ans — vos ennuis de trésorerie, eux, commencent ce semestre.";
    },
  },
  {
    id: "ref_impots",
    nom: "La baisse d'impôts des classes moyennes",
    cout: 2,
    promesse: "impots",
    detail: "Populaire, coûteux, immédiat.",
    effects: (c) => {
      c.adj({ country: { marge: -6 }, power: { popularite: 4 } });
      c.seg("pavillonnaires", { soutien: 6 });
      c.seg("independants", { soutien: 4 });
      c.promesse("impots", "tenue");
      return "La baisse est visible dès la prochaine feuille d'impôt — c'est sa grande qualité politique. Bruxelles fronce un sourcil ; les pavillonnaires vous rendent des points de sondage. L'échange est daté, signé, non remboursable.";
    },
  },
  {
    id: "ref_police",
    nom: "La police de proximité",
    cout: 2,
    promesse: "police",
    detail: "Recoudre, îlot par îlot.",
    effects: (c) => {
      c.adj({ country: { marge: -3, securite: 3, cohesion: 2 } });
      c.seg("quartiers", { soutien: 4 });
      c.promesse("police", "tenue");
      return "Le retour des îlotiers, la connaissance des terrains, les statistiques qui baissent lentement — rien de spectaculaire, tout d'utile. Le syndicat de police le plus dur parle de « police sociale ». C'était l'idée, oui.";
    },
  },
  {
    id: "ref_nucleaire",
    nom: "Le programme nucléaire",
    cout: 3,
    promesse: "nucleaire",
    detail: "Six réacteurs. Trente ans d'engagement.",
    effects: (c) => {
      c.adj({ country: { marge: -6, dette: 2 } });
      c.promesse("nucleaire", "tenue");
      c.seg("urbains", { soutien: -3 });
      c.seg("periurbain", { soutien: 3 });
      return "Le programme est lancé — six réacteurs, des décennies de chantier, une filière qui embauche. La première électricité arrivera sous un autre président. C'est la définition d'une politique énergétique : un cadeau à quelqu'un qu'on ne connaît pas.";
    },
  },
  {
    id: "ref_rail",
    nom: "Le rail du quotidien",
    cout: 2,
    promesse: "rail",
    detail: "Les trains de la vraie vie.",
    effects: (c) => {
      c.adj({ country: { marge: -4, environnement: 3 } });
      c.promesse("rail", "tenue");
      c.seg("urbains", { soutien: 4 });
      c.seg("periurbain", { soutien: 2 });
      return "Pas de ligne à grande vitesse en fanfare : des petites lignes rouvertes, des rames neuves, des horaires tenus. C'est peu télégénique et profondément politique — le rail du quotidien est la seule promesse qui passe deux fois par jour devant ses électeurs.";
    },
  },
  {
    id: "ref_regularisation",
    nom: "La régularisation des travailleurs",
    cout: 2,
    promesse: "regularisation",
    detail: "Assumer une position. Toute la polémique avec.",
    effects: (c) => {
      c.promesse("regularisation", "tenue");
      c.seg("urbains", { soutien: 4 });
      c.seg("quartiers", { soutien: 5 });
      c.seg("pavillonnaires", { soutien: -5 });
      c.seg("ruraux", { soutien: -4 });
      c.adj({ country: { cohesion: -2 } });
      return "Les critères sont publiés, les préfectures instruisent. Sallenave tient son thème pour dix-huit mois. Les secteurs en tension — bâtiment, restauration, soin — embauchent enfin légalement ceux qui y travaillaient déjà. Les deux phrases précédentes sont vraies en même temps ; c'est tout le dossier.";
    },
  },
  {
    id: "ref_quotas",
    nom: "Les quotas migratoires",
    cout: 2,
    promesse: "quotas",
    detail: "Un vote annuel au Parlement. Assumé.",
    effects: (c) => {
      c.promesse("quotas", "tenue");
      c.seg("pavillonnaires", { soutien: 5 });
      c.seg("ruraux", { soutien: 4 });
      c.seg("urbains", { soutien: -5 });
      c.seg("quartiers", { soutien: -6 });
      c.adj({ country: { cohesion: -2 } });
      return "Le Parlement votera chaque année des plafonds par catégorie. Le débat annuel sera un rituel de déchirement national — c'est le coût du dispositif, et pour ses partisans, sa fonction.";
    },
  },
  {
    id: "ref_proportionnelle",
    nom: "La proportionnelle",
    cout: 2,
    promesse: "proportionnelle",
    detail: "Changer les règles du jeu — y compris pour vous.",
    effects: (c) => {
      c.promesse("proportionnelle", "tenue");
      c.flag("proportionnelle_active");
      c.seg("jeunes", { soutien: 4 });
      c.seg("urbains", { soutien: 3 });
      return "La loi électorale est promulguée : les prochaines législatives seront à la proportionnelle. Chaque courant aura ses députés — y compris ceux que le scrutin majoritaire étouffait, dans tous les sens du mot. Vous venez de rendre votre propre majorité future presque impossible. C'était le principe. Vous l'avez fait quand même.";
    },
  },
  {
    id: "ref_usines",
    nom: "Le plan 100 usines",
    cout: 2,
    promesse: "usines",
    detail: "Subventions, guichets, terrains. Bruxelles surveille.",
    effects: (c) => {
      c.adj({ country: { marge: -5 } });
      c.promesse("usines", "partielle");
      c.sched("usines_bilan", 8, 14, 0.6);
      c.seg("periurbain", { soutien: 4 });
      return "Les aides sont ouvertes, les préfets mobilisés, les terrains viabilisés. Les usines mettront des années à sortir de terre — les inaugurations, si elles arrivent, tomberont pile pendant la campagne de quelqu'un. Peut-être la vôtre.";
    },
  },
  {
    id: "ref_smic",
    nom: "Le coup de pouce au SMIC",
    cout: 2,
    promesse: "smic",
    detail: "Deux millions de fiches de paie. Et le patronat en face.",
    effects: (c) => {
      c.adj({ country: { inflation: 0.4, croissance: -0.2 }, power: { patronat: -12, syndicats: 8 } });
      c.promesse("smic", "tenue");
      c.seg("periurbain", { soutien: 7 });
      c.seg("quartiers", { soutien: 5 });
      c.rel("charvet", { rancune: 12, loyaute: -8 });
      return "Le décret paraît un 1er juillet, comme tous les décrets qui font plaisir. Deux millions de bulletins de salaire changent de ligne, ce qui se voit tout de suite ; les embauches différées dans les petites entreprises, elles, ne se voient jamais. Édouard Charvet parle de « décision politique » — dans sa bouche, ce n'est pas un compliment.";
    },
  },
  {
    id: "ref_isf",
    nom: "Le retour de l'impôt sur la fortune",
    cout: 3,
    promesse: "isf",
    detail: "Le symbole le plus cher de la vie politique française.",
    effects: (c) => {
      c.adj({ country: { marge: 6 }, power: { patronat: -18, presse: -6, popularite: 5 } });
      c.promesse("isf", "tenue");
      c.seg("public", { soutien: 6 });
      c.seg("jeunes", { soutien: 4 });
      c.seg("csp", { soutien: -7 });
      c.rel("charvet", { rancune: 18, loyaute: -12 });
      c.sched("isf_exil", 4, 10, 0.5);
      return "Le texte passe en trois lectures et une nuit d'obstruction. Il rapportera moins que ce qu'on annonce et coûtera plus que ce qu'on croit — tout le monde le sait, personne ne le dit, parce que ce n'est pas la question. La question était de savoir de quel côté vous étiez, et le pays vient d'avoir sa réponse.";
    },
  },
  {
    id: "ref_ecole",
    nom: "Les classes à douze élèves",
    cout: 3,
    promesse: "ecole_douze",
    detail: "Quarante mille postes. Douze ans pour voir le résultat.",
    effects: (c) => {
      c.adj({ country: { services: 8, marge: -9 } });
      c.promesse("ecole_douze", "partielle");
      c.seg("public", { soutien: 8 });
      c.seg("pavillonnaires", { soutien: 4 });
      c.sched("ecole_bilan", 10, 16, 0.55);
      return "Le dédoublement commence par les réseaux d'éducation prioritaire, faute de bâtiments ailleurs. Les premières cohortes passeront le bac sous un successeur qui en récoltera les chiffres. C'est la définition d'une politique scolaire : personne ne peut la mener et l'inaugurer.";
    },
  },
  {
    id: "ref_grand_age",
    nom: "La loi grand âge",
    cout: 3,
    promesse: "grand_age",
    detail: "Un point de PIB. Chaque année. Pour toujours.",
    effects: (c) => {
      c.adj({ country: { services: 7, marge: -10, cohesion: 3 } });
      c.promesse("grand_age", "tenue");
      c.seg("retraites", { soutien: 9, participation: 3 });
      c.seg("public", { soutien: 4 });
      return "Ratios d'encadrement, revalorisation des aides à domicile, contrôle des groupes privés : la loi que six gouvernements avaient annoncée sort enfin. Elle engage un point de PIB par an, indéfiniment, pour une population qui ne fera que croître. C'est la dépense la plus honnête de votre mandat, et celle dont vos successeurs vous en voudront le plus.";
    },
  },
  {
    id: "ref_sante_rurale",
    nom: "Les maisons de santé",
    cout: 2,
    promesse: "sante_rurale",
    detail: "Des murs, oui. Des médecins, c'est autre chose.",
    effects: (c) => {
      c.adj({ country: { services: 4, marge: -3 } });
      c.promesse("sante_rurale", "partielle");
      c.seg("ruraux", { soutien: 7 });
      c.seg("retraites", { soutien: 4 });
      return "Trois cents maisons de santé financées, inaugurées, photographiées. Deux ans plus tard, un tiers d'entre elles cherchera encore son deuxième praticien : on peut construire un bâtiment en dix-huit mois, pas un médecin en dix-huit mois. Les cantons concernés vous savent quand même gré d'avoir essayé — c'est déjà plus que ce qu'ils accordent d'ordinaire.";
    },
  },
  {
    id: "ref_prisons",
    nom: "Les vingt mille places de prison",
    cout: 3,
    promesse: "prisons",
    detail: "Six milliards, douze ans de chantiers, zéro maire volontaire.",
    effects: (c) => {
      c.adj({ country: { securite: 6, marge: -8, dette: 2 }, power: { justice: 5 } });
      c.promesse("prisons", "partielle");
      c.seg("pavillonnaires", { soutien: 6 });
      c.seg("retraites", { soutien: 4 });
      c.seg("quartiers", { soutien: -4 });
      return "Le programme est annoncé avec une carte, ce qui est une erreur : dès le lendemain, quatorze maires découvrent qu'ils étaient volontaires. Les premières places ouvriront dans huit ans. D'ici là, la surpopulation restera ce qu'elle est, et le mot « fermeté » aura servi trois fois.";
    },
  },
  {
    id: "ref_cannabis",
    nom: "La légalisation du cannabis",
    cout: 2,
    promesse: "cannabis",
    detail: "Une recette fiscale, un débat de société, deux ministères contre.",
    effects: (c) => {
      c.adj({ country: { marge: 5, securite: -2, cohesion: -2 } });
      c.promesse("cannabis", "tenue");
      c.seg("jeunes", { soutien: 8, participation: 4 });
      c.seg("urbains", { soutien: 5 });
      c.seg("retraites", { soutien: -6 });
      c.seg("ruraux", { soutien: -4 });
      c.rel("mazeau", { rancune: 10 });
      return "Filière encadrée, monopole de distribution, taxation à 30 %. Bercy applaudit, l'Intérieur enrage, les plateaux se remplissent de médecins qui ne sont pas d'accord entre eux. Le trafic ne disparaît pas — il se déplace vers ce qui reste interdit, ce que personne n'avait promis mais que tout le monde savait.";
    },
  },
  {
    id: "ref_service_national",
    nom: "Le service national obligatoire",
    cout: 3,
    promesse: "service_national",
    detail: "Neuf mois pour huit cent mille jeunes. Dans quelles casernes ?",
    effects: (c) => {
      c.adj({ country: { cohesion: 6, marge: -11 }, power: { armee: 10 }, hidden: { coup: -4 } });
      c.promesse("service_national", "partielle");
      c.seg("retraites", { soutien: 7 });
      c.seg("ruraux", { soutien: 5 });
      c.seg("jeunes", { soutien: -8 });
      return "La montée en charge est étalée sur six ans, ce qui est la façon polie de dire que la promesse ne sera pas tenue sous vous. L'état-major, à qui personne n'a demandé son avis, hérite d'une mission d'éducation civique avec des casernes vendues en 2003. Les retraités trouvent l'idée excellente ; les intéressés sont la seule classe d'âge qu'on n'a pas consultée.";
    },
  },
  {
    id: "ref_ric",
    nom: "Le référendum d'initiative citoyenne",
    cout: 2,
    promesse: "ric",
    detail: "Rendre la parole. Y compris à ceux qui vous en veulent.",
    effects: (c) => {
      c.promesse("ric", "tenue");
      c.flag("ric_actif");
      c.adj({ hidden: { agitation: -8 }, power: { popularite: 4, parti: -6 } });
      c.seg("jeunes", { soutien: 6 });
      c.seg("periurbain", { soutien: 7 });
      c.dire("ric", "Le peuple n'a pas besoin d'une autorisation pour se prononcer", "à la tribune de l'Assemblée");
      c.sched("ric_premier", 6, 12, 0.6);
      return "Sept cent mille signatures, un contrôle de constitutionnalité, un vote. Les ronds-points saluent, les préfectures s'inquiètent, votre propre majorité fait la moue : ils ont compris avant vous que le premier référendum d'initiative citoyenne portera sur quelque chose que vous aurez fait.";
    },
  },
  {
    id: "ref_energie",
    nom: "La renationalisation de l'énergie",
    cout: 3,
    promesse: "energie_publique",
    detail: "Cent milliards et un contentieux européen.",
    effects: (c) => {
      c.adj({ country: { dette: 8, marge: -8, services: 5, prestige: -2 } });
      c.promesse("energie_publique", "tenue");
      c.seg("public", { soutien: 7 });
      c.seg("periurbain", { soutien: 5 });
      c.nation("commission", { relation: -12 });
      c.dossier("energie_rachat", "Le prix payé aux actionnaires sortants", 18);
      return "L'offre publique de rachat est lancée un dimanche soir pour éviter l'ouverture des marchés. L'État redevient propriétaire de ce qu'il avait vendu, et le repaie au prix d'aujourd'hui — c'est le principe même de la privatisation, découvert avec vingt ans de retard. Bruxelles ouvre une procédure dans la semaine.";
    },
  },
  {
    id: "ref_autoroutes",
    nom: "La renationalisation des autoroutes",
    cout: 3,
    promesse: "autoroutes",
    detail: "Quarante milliards d'indemnités. Ou une bataille de dix ans.",
    effects: (c) => {
      c.adj({ country: { dette: 6, marge: -7 }, power: { patronat: -10, popularite: 8 } });
      c.promesse("autoroutes", "tenue");
      c.seg("periurbain", { soutien: 8 });
      c.seg("ruraux", { soutien: 6 });
      c.sched("autoroutes_arbitrage", 6, 14, 0.55);
      return "Les concessions sont résiliées par anticipation, ce qui déclenche mécaniquement les clauses indemnitaires négociées par vos prédécesseurs. Le péage baisse de 30 % au 1er janvier — la seule mesure de votre mandat que les Français constateront eux-mêmes, en liquide, en rentrant de vacances. Les arbitres internationaux, eux, se réunissent à Genève.";
    },
  },
  {
    id: "ref_defense",
    nom: "Les trois pour cent pour la défense",
    cout: 3,
    promesse: "defense_trois",
    detail: "Trente milliards. Pris quelque part.",
    effects: (c) => {
      c.adj({ country: { securite: 6, prestige: 6, marge: -12 }, power: { armee: 16 }, hidden: { coup: -8 } });
      c.promesse("defense_trois", "tenue");
      c.seg("ruraux", { soutien: 4 });
      c.seg("pavillonnaires", { soutien: 4 });
      c.seg("public", { soutien: -4 });
      c.rel("verdier", { loyaute: 16, rancune: -8 });
      c.toutesNations({ relation: 5 }, ["commission"]);
      return "La loi de programmation militaire passe à trois points de PIB : munitions, drones, deuxième porte-avions, et des salaires qui retiendront enfin les techniciens. L'état-major ne vous demandera plus rien pendant cinq ans, ce qui vaut tous les conseils de défense du monde. Les trente milliards viennent d'ailleurs, et « ailleurs » a un nom dans chaque ministère.";
    },
  },
  {
    id: "ref_fin_vie",
    nom: "L'aide active à mourir",
    cout: 2,
    promesse: "fin_de_vie",
    detail: "Une fracture morale, et elle traverse votre propre camp.",
    effects: (c) => {
      c.adj({ country: { cohesion: -4, services: 2 }, power: { presse: 5, popularite: 4 } });
      c.promesse("fin_de_vie", "tenue");
      c.seg("urbains", { soutien: 6 });
      c.seg("jeunes", { soutien: 4 });
      c.seg("retraites", { soutien: -3 });
      c.sched("fin_vie_debat", 3, 8, 0.6);
      return "Le texte passe après cent quarante heures de débat, sans consigne de vote, et douze députés de votre majorité pleurent en séance — dans les deux sens. C'est le seul moment du mandat où l'Assemblée aura ressemblé à ce qu'elle prétend être. Les évêques publient une lettre ; les soignants demandent surtout des lits.";
    },
  },
  {
    id: "ref_uniforme",
    nom: "L'uniforme à l'école",
    cout: 1,
    promesse: "uniforme",
    detail: "Presque rien — et c'est bien le problème.",
    effects: (c) => {
      c.adj({ country: { cohesion: 2, marge: -1 }, power: { popularite: 3 } });
      c.promesse("uniforme", "tenue");
      c.seg("pavillonnaires", { soutien: 6 });
      c.seg("retraites", { soutien: 5 });
      c.seg("urbains", { soutien: -4 });
      return "Généralisation à la rentrée, financée à moitié par les collectivités qui ne l'ont pas demandé. Trois semaines de débat national sur une polo bleu marine, pendant lesquelles personne n'a parlé du niveau en mathématiques. C'est exactement ce que la mesure sait faire, et vous le saviez en la signant.";
    },
  },
];

/**
 * Le vivier complet : les chantiers écrits, plus un chantier de série pour
 * chacune des promesses qui n'en avait aucun. Aucune promesse du programme ne
 * doit rester sans acte pour la solder — sinon on la jure en campagne et on la
 * traîne cinq ans, ce qui est la meilleure façon de perdre une réélection sans
 * avoir jamais eu la main.
 */
export const REFORMES: ReformeDef[] = [
  ...REFORMES_ECRITS,
  ...chantiersDuProgramme(new Set(REFORMES_ECRITS.map((r) => r.promesse).filter((p): p is string => !!p))),
];

/**
 * Les chantiers encore engageables. Un chantier lancé ne revient jamais — on ne
 * réforme pas deux fois les retraites dans le même mandat — et une promesse
 * déjà soldée, tenue ailleurs ou trahie, ferme le sien.
 */
export function reformesOuvertes(s: GameState): ReformeDef[] {
  return REFORMES.filter((r) => {
    if ((s.reformesFaites ?? []).includes(r.id)) return false;
    if (r.cond && !r.cond(s)) return false;
    const p = s.promises.find((x) => x.id === r.promesse);
    return !p || p.status === "en_cours";
  });
}

// ---------------------------------------------------------------------------
// Les actions. Trois catégories :
//   · socle       — toujours disponibles (réformer, souffler, la famille)
//   · pool        — quatre tirées au sort chaque semestre, avec cooldown
//   · opportunité — n'apparaissent que si la situation s'y prête, et frappent fort
// ---------------------------------------------------------------------------

/** Personnages nommables à un grand poste, du plus loyal au moins. */
function nommables(s: GameState): string[] {
  return ["rochefort", "delval", "mazeau", "danglade", "roze", "verdier", "belkacem", "quesnel"].filter(
    (id) => s.characters[id]?.vivant && s.characters[id]?.enPoste !== false
  );
}

export const ACTIONS: ActionDef[] = [
  // --- Socle ---------------------------------------------------------------
  {
    id: "reforme",
    nom: "Lancer une réforme",
    cout: 0,
    detail: "Engager un grand chantier.",
    needParam: "reforme",
    socle: true,
    // Quand tout a été engagé ou soldé, il n'y a plus rien à ouvrir : mieux
    // vaut retirer la porte que de la laisser sur une pièce vide.
    cond: (s) => reformesOuvertes(s).length > 0,
    icone: "▣",
    tone: "var(--color-monde)",
    effects: (c, param) => {
      const ref = REFORMES.find((r) => r.id === param);
      if (!ref) return "Aucune réforme choisie.";
      return ref.effects(c);
    },
  },
  {
    id: "repos",
    nom: "Souffler",
    cout: 1,
    detail: "Trois jours sans cortège. La presse ricanera.",
    socle: true,
    icone: "☾",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ hidden: { fatigue: -24, sante: 3 } });
      c.rel("conjoint", { loyaute: 5 });
      c.press("« Le Président au vert pendant que la France attend » — Philippe Bec, agacé de service", "satirique");
      return "Trois jours sans dossier rouge. Vous dormez neuf heures, marchez en forêt, réapprenez le prénom de vos gardes du corps. Philippe Bec s'indigne. Son indignation est le prix d'un service que personne d'autre ne vous rendra : durer.";
    },
  },
  {
    id: "famille",
    nom: "Du temps en famille",
    cout: 1,
    detail: "Ce que le pouvoir dévore en premier.",
    socle: true,
    icone: "❦",
    tone: "var(--color-env)",
    effects: (c) => {
      c.rel("conjoint", { loyaute: 8, rancune: -3 });
      c.rel("bensalah", { loyaute: 3 });
      c.adj({ hidden: { fatigue: -8, paranoia: -4 } });
      return "Un week-end entier, téléphones dans un tiroir. Rien de politique n'en sort, ce qui en fait le meilleur investissement du semestre : les jauges qui comptent vraiment ne s'affichent pas non plus.";
    },
  },

  // --- Pool tiré au sort ---------------------------------------------------
  {
    id: "remaniement",
    nom: "Changer de Premier ministre",
    cout: 1,
    detail: "Le fusible saute. Reste à choisir le suivant.",
    needParam: "personnage",
    candidats: (s) => nommables(s).filter((id) => id !== "rochefort" || !s.characters["rochefort"].enPoste),
    cond: (s) => s.characters["rochefort"].enPoste || !!s.flags["pm_actuel"],
    cooldown: 4,
    icone: "♟",
    tone: "var(--color-pouvoir)",
    effects: (c, param) => {
      const sortant = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
      const sortantSt = c.s.characters[sortant];
      if (sortantSt) {
        sortantSt.enPoste = false;
        c.rel(sortant, { rancune: 18, loyaute: -22 });
      }
      const id = param ?? "roze";
      c.flag("pm_actuel", id);
      c.rel(id, { loyaute: 10, ambition: 8 });
      c.adj({ power: { popularite: 6, parti: -4 } });
      c.log(`Vous avez remplacé votre Premier ministre par ${id}.`);

      const nouveau = c.s.characters[id];
      if (nouveau && nouveau.ambition > 60) {
        c.sched("pm_rival", 3, 7, 0.5);
        return "Le sortant remet sa démission « à votre demande », selon la formule qui ne trompe personne. Le successeur, lui, prend Matignon avec l'appétit de quelqu'un qui n'a jamais considéré ce poste comme une fin. L'opinion respire — les fusibles servent à ça. Vous venez d'en installer un qui conduit.";
      }
      c.sched("pm_terne", 4, 8, 0.4);
      return "Le sortant remet sa démission « à votre demande ». Le successeur est loyal, appliqué, et n'éclipsera jamais personne — c'est exactement ce qu'on demande à un Premier ministre, jusqu'au jour où il faudrait qu'il ait du charisme.";
    },
  },
  {
    id: "deplacement",
    nom: "Déplacement en région",
    cout: 1,
    detail: "Le terrain. Fatigant, utile, humain.",
    cooldown: 2,
    icone: "◎",
    tone: "var(--color-social)",
    effects: (c) => {
      const cibles = ["periurbain", "ruraux", "pavillonnaires", "quartiers"] as const;
      const cible = c.rng.pick(cibles);
      c.seg(cible, { soutien: 5, participation: 3 });
      c.adj({ hidden: { fatigue: 6, agitation: -3 }, country: { cohesion: 1 } });
      const noms: Record<string, string> = {
        periurbain: "une ville moyenne qui a perdu son usine et garde sa fierté",
        ruraux: "un canton où la sous-préfecture est le dernier guichet de la République",
        pavillonnaires: "un lotissement où l'on vous parle d'école et de giratoire",
        quartiers: "un quartier où personne n'attendait un président, ce qui rend la visite utile",
      };
      return `Une journée dans ${noms[cible]}. Des mains serrées, deux engueulades saines, un café offert par quelqu'un qui « ne vote plus ». Le pays réel recharge une batterie que l'Élysée décharge.`;
    },
  },
  {
    id: "renflouer",
    nom: "Renflouer un secteur",
    cout: 2,
    detail: "De l'argent tout de suite, là où ça saigne.",
    cooldown: 3,
    icone: "◈",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ country: { marge: -5, services: 5 }, hidden: { agitation: -5 } });
      return "Une enveloppe d'urgence part vers le secteur qui criait le plus fort. Le soulagement est réel et provisoire — c'est le propre des perfusions. Cyril Danglade a signé en fermant les yeux, littéralement.";
    },
  },
  {
    id: "sommet",
    nom: "Recevoir un chef d'État",
    cout: 1,
    detail: "Tapis rouge, garde républicaine, contrats.",
    cooldown: 3,
    icone: "⚑",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { prestige: 4 } });
      c.rel("weiss", { loyaute: 3 });
      c.press("« Paris au centre du jeu » — les images du sommet font le tour des chancelleries", "favorable");
      return "Deux jours de protocole millimétré, une déclaration commune, un contrat industriel. La diplomatie est le seul théâtre où la France joue au-dessus de son PIB — autant occuper la scène.";
    },
  },
  {
    id: "seconde_source",
    nom: "Demander une seconde source",
    cout: 1,
    detail: "Yves Ternay, en tête-à-tête. Les vrais chiffres.",
    cooldown: 2,
    icone: "◐",
    tone: "var(--color-secu)",
    effects: (c) => {
      const h = c.s.hidden;
      const lignes: string[] = [];
      lignes.push(`Agitation réelle : ${Math.round(h.agitation)}/100 — l'Intérieur vous annonçait ${Math.round(h.agitation * 0.75)}.`);
      lignes.push(`Votre fatigue : ${h.fatigue > 70 ? "critique" : h.fatigue > 45 ? "notable" : "maîtrisée"}. Votre santé : ${h.sante < 45 ? "préoccupante" : h.sante < 70 ? "moyenne" : "bonne"}.`);
      if (h.coup > 25) lignes.push(`« Certains cercles militaires parlent. Risque : ${h.coup > 55 ? "sérieux" : "à surveiller"}. »`);
      if (h.assassinat > 25) lignes.push(`« Nous avons renforcé votre protection. Ne demandez pas pourquoi. Niveau : ${h.assassinat > 55 ? "élevé" : "notable"}. »`);
      c.adj({ hidden: { paranoia: 2 } });
      return "Yves Ternay vous reçoit sans dossier — tout est dans sa tête, c'est son assurance-vie. " + lignes.join(" ");
    },
  },
  {
    id: "allocution",
    nom: "Allocution télévisée",
    cout: 1,
    detail: "20h, tous les écrans. Réussie ou ratée.",
    cooldown: 3,
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const perf = c.s.player.rhetorique - (c.s.hidden.fatigue > 65 ? 20 : 0) + c.rng.int(-18, 18);
      if (perf > 58) {
        c.adj({ power: { popularite: 6, presse: 3 }, hidden: { fatigue: 4 } });
        return "Douze minutes, sans prompteur, avec une formule qui restera. Les chaînes la repassent en boucle, et pour une fois sans ironie. On vous redécouvre.";
      }
      if (perf > 38) {
        c.adj({ power: { popularite: 1 }, hidden: { fatigue: 4 } });
        return "Une allocution correcte, oubliée avant le journal de 23h. L'audience était bonne, l'effet nul. C'est le sort de la plupart des paroles présidentielles.";
      }
      c.adj({ power: { popularite: -4, presse: -3 }, hidden: { fatigue: 5 } });
      return "Le ton sonne faux dès la deuxième phrase. Les réseaux découpent l'allocution en extraits moqueurs avant même la fin. Camille Roze ne dit rien, ce qui est pire que tout.";
    },
  },
  {
    id: "nomination",
    nom: "Nommer à un grand poste",
    cout: 1,
    detail: "Récompenser, neutraliser, ou s'attacher quelqu'un.",
    needParam: "personnage",
    candidats: nommables,
    cooldown: 3,
    icone: "♛",
    tone: "var(--color-pouvoir)",
    effects: (c, param) => {
      const id = param ?? "roze";
      const st = c.s.characters[id];
      if (!st) return "Personne à nommer.";
      c.rel(id, { loyaute: 12, ambition: 5 });
      c.adj({ power: { parti: -2 } });
      // Les ambitieux qu'on installe deviennent plus dangereux, pas moins.
      if (st.ambition > 60) {
        c.flag(`promu_${id}`);
        return "La nomination est saluée comme habile : vous placez un rival là où il devra vous être solidaire. Il accepte avec un empressement qui devrait vous alerter — un ambitieux ne dit jamais oui par gratitude, mais par calcul.";
      }
      return "La nomination récompense une fidélité. Ce sont les nominations les plus utiles et les moins commentées : personne ne fait la une avec un poste bien attribué.";
    },
  },
  {
    id: "decoration",
    nom: "Décorer quelqu'un",
    cout: 1,
    detail: "Une médaille coûte moins cher qu'un ministère.",
    needParam: "personnage",
    candidats: (s) => ["kervella", "belkacem", "charvet", "quesnel", "alberti", "rives", "bec", "verdier"].filter((id) => s.characters[id]?.vivant),
    cooldown: 4,
    icone: "✦",
    tone: "var(--color-perso)",
    effects: (c, param) => {
      const id = param ?? "quesnel";
      c.rel(id, { loyaute: 8, rancune: -8 });
      return "La cérémonie dure vingt minutes, le discours en fait dix. La personne décorée fait mine de trouver ça dérisoire et gardera la boîte toute sa vie. La vanité est le carburant le moins cher de la République.";
    },
  },
  {
    id: "commission",
    nom: "Installer une commission",
    cout: 1,
    detail: "Enterrer un problème sous des travaux sérieux.",
    cooldown: 4,
    icone: "◫",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.adj({ hidden: { agitation: -6 }, power: { presse: -2 } });
      c.flag("commission_en_cours");
      return "Une commission d'experts, une lettre de mission, dix-huit mois de travaux. Le sujet quitte l'actualité dès le lendemain. Son rapport, à sa remise, ne sera lu par personne — sauf par ceux qui voudront vous le jeter au visage.";
    },
  },
  {
    id: "negocier_syndicats",
    nom: "Négocier avec les syndicats",
    cout: 1,
    detail: "Choisir son interlocuteur, c'est choisir son camp.",
    cooldown: 3,
    icone: "✊",
    tone: "var(--color-social)",
    effects: (c) => {
      c.rel("belkacem", { loyaute: 10 });
      c.rel("kervella", { rancune: 6 });
      c.adj({ power: { syndicats: 6 }, hidden: { agitation: -7 }, country: { marge: -2 } });
      return "Quatre séances avec Nadia Belkacem, un relevé de conclusions, une concession budgétaire. Bruno Kervella dénonce « un syndicalisme de préfecture » et s'isole un peu plus. Vous avez acheté du calme et fabriqué un adversaire plus dur.";
    },
  },
  {
    id: "diner_patronat",
    nom: "Dîner avec le patronat",
    cout: 1,
    detail: "Ils investiront. Ils voudront quelque chose.",
    cooldown: 3,
    icone: "⬣",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.rel("charvet", { loyaute: 10 });
      c.adj({ power: { patronat: 8 }, country: { croissance: 0.2 } });
      c.seg("public", { soutien: -3 });
      return "Édouard Charvet lève son verre à « un exécutif enfin lucide ». Trois engagements d'investissement sont annoncés le lendemain, dont deux étaient déjà prévus. La photo, elle, tourne dans les syndicats avec une légende peu amène.";
    },
  },
  {
    id: "interview",
    nom: "Grand entretien à la presse",
    cout: 1,
    detail: "Une journaliste, une heure, aucun filet.",
    cooldown: 3,
    icone: "✎",
    tone: "var(--color-perso)",
    effects: (c) => {
      const ok = c.s.player.rhetorique + c.rng.int(-15, 15) > 50;
      if (ok) {
        c.adj({ power: { presse: 8, popularite: 2 } });
        c.rel("ferrand", { rancune: -4 });
        return "Une heure d'entretien sans questions transmises à l'avance. Vous encaissez trois questions dures et en retournez deux. Les rédactions saluent « un exercice courageux » — le compliment le plus rare de la profession.";
      }
      c.adj({ power: { presse: -6, popularite: -3 } });
      return "L'entretien dérape sur une question que tout le monde voyait venir sauf vous. La phrase malheureuse fera les titres pendant trois jours, et les compilations pendant trois ans.";
    },
  },
  {
    id: "off_presse",
    nom: "Déjeuner off avec la presse",
    cout: 1,
    detail: "Six éditorialistes, une salle à manger, rien d'enregistré.",
    cooldown: 3,
    icone: "☕",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { presse: 7 }, hidden: { fatigue: 3 } });
      c.rel("bec", { loyaute: 7, rancune: -4 });
      c.rel("ferrand", { loyaute: 2 });
      // Un off produit rarement un article ; il produit une dette, ce qui vaut mieux.
      if (c.rng.chance(0.4)) {
        c.gagnerFaveur();
        return "Deux heures sans notes, sans caméra, avec les six plumes qui font l'ambiance du pays. Vous racontez un arbitrage difficile en détail — ce que personne ne fait jamais. À la fin, Philippe Bec vous glisse : « Si un jour vous avez besoin de quarante-huit heures, appelez-moi. » On ne dit pas ça deux fois.";
      }
      return "Deux heures sans notes, sans caméra. Rien n'en sortira demain, et c'est le but : un off ne se lit pas dans les journaux, il se lit dans le ton des journaux du mois suivant. La profession préfère les présidents qui la fréquentent à ceux qui la craignent.";
    },
  },
  {
    id: "exclusivite",
    nom: "Offrir une exclusivité",
    cout: 1,
    detail: "Un scoop, à une seule signature. Les autres l'apprendront après.",
    needParam: "personnage",
    candidats: (s) => ["ferrand", "bec", "rives"].filter((id) => s.characters[id]?.vivant),
    cooldown: 3,
    icone: "✎",
    tone: "var(--color-perso)",
    effects: (c, param) => {
      const id = param ?? "bec";
      c.rel(id, { loyaute: 14, rancune: -8 });
      c.gagnerFaveur();
      c.adj({ power: { presse: 4 }, player: { integrite: -2 } });
      // Servir quelqu'un, c'est vexer les autres : la faveur a un versant public.
      for (const autre of ["ferrand", "bec", "rives"]) {
        if (autre !== id) c.rel(autre, { loyaute: -3, rancune: 3 });
      }
      if (id === "ferrand") {
        return "Vous donnez à Louise Ferrand ce qu'aucun conseiller ne voulait lâcher : l'arbitrage complet, les notes, les noms. Elle publie sans complaisance — mais elle publie ce qui s'est vraiment passé, et pour une fois ça vous sert. Elle vous doit désormais quelque chose qu'elle déteste devoir.";
      }
      if (id === "rives") {
        return "Antoine Rives repart avec l'annonce en primeur pour ses trois chaînes. Il ne remercie pas : il note. Dans son économie, une exclusivité présidentielle est une ligne au bilan, et vous venez de créditer le compte.";
      }
      return "Philippe Bec tient son papier avant tout le monde, avec les coulisses et une citation qu'il pourra signer. Les autres rédactions comprennent en le lisant qu'elles ont été doublées. Elles s'en souviendront — lui aussi.";
    },
  },
  {
    id: "conseil_defense",
    nom: "Conseil de défense",
    cout: 1,
    detail: "Le huis clos où se décide ce qui ne se dit pas.",
    cooldown: 3,
    icone: "★",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.adj({ country: { securite: 4 }, power: { armee: 5 } });
      c.rel("verdier", { loyaute: 5 });
      c.adj({ hidden: { coup: -4 } });
      return "Salle sécurisée, téléphones consignés. On y traite en deux heures ce que le Parlement mettrait un an à effleurer. L'état-major apprécie qu'on le consulte — c'est la façon la moins chère d'acheter la loyauté d'une armée.";
    },
  },
  {
    id: "inauguration",
    nom: "Inaugurer un chantier",
    cout: 1,
    detail: "Un ruban, une pelleteuse, un bon plan de coupe.",
    cooldown: 3,
    icone: "⚒",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ power: { popularite: 3 }, country: { croissance: 0.1 } });
      c.seg("periurbain", { soutien: 3 });
      return "Un ruban, un casque de chantier mal ajusté, quarante photographes. Le chantier était financé par votre prédécesseur, mais l'inauguration est à vous — c'est la règle la plus constante de la vie politique.";
    },
  },
  {
    id: "audit",
    nom: "Auditer un ministère",
    cout: 1,
    detail: "Découvrir ce qu'on vous cache dans votre propre maison.",
    cooldown: 4,
    icone: "◍",
    tone: "var(--color-monde)",
    effects: (c) => {
      const trouve = c.rng.chance(0.55);
      if (trouve) {
        c.adj({ country: { marge: 5 }, power: { popularite: -1 } });
        c.rel("mazeau", { rancune: 5 });
        return "L'audit exhume des crédits dormants, deux marchés surfacturés et une agence dont personne ne sait plus ce qu'elle fait. Vous récupérez de la marge budgétaire et un ministre furieux qu'on soit allé fouiller chez lui.";
      }
      c.adj({ country: { marge: 1 } });
      return "L'audit ne trouve rien de scandaleux — juste une administration lente et consciencieuse. Le rapport conclut à « des marges d'optimisation ». C'est ce qu'on écrit quand on n'a rien trouvé.";
    },
  },
  {
    id: "referendum_local",
    nom: "Consulter les Français",
    cout: 2,
    detail: "Une consultation nationale. Risquée, mémorable.",
    cooldown: 6,
    icone: "◈",
    tone: "var(--color-monde)",
    effects: (c) => {
      const adhesion = c.s.power.popularite + c.rng.int(-20, 20);
      if (adhesion > 52) {
        c.adj({ power: { popularite: 7 }, country: { cohesion: 5 } });
        c.seg("jeunes", { participation: 6 });
        return "La consultation mobilise au-delà des attentes et vous donne raison. Une légitimité fraîche, extraite directement du pays sans passer par les corps intermédiaires — ils l'ont remarqué, et ne l'ont pas aimé.";
      }
      c.adj({ power: { popularite: -6 }, country: { cohesion: -2 } });
      return "Participation faible, résultat ambigu, interprétations contradictoires dès 20h01. Vous avez donné au pays une occasion de vous dire non ; une partie s'en est saisie. On ne consulte jamais impunément.";
    },
  },

  // --- Opportunités --------------------------------------------------------
  {
    id: "discours_historique",
    nom: "Le discours d'une vie",
    cout: 2,
    detail: "Vous avez le charisme pour ça. Ça n'arrivera pas deux fois.",
    // Un grand discours ne se décrète pas : il faut savoir parler, et il faut
    // que le pays ait besoin d'entendre quelque chose.
    cond: (s) => (s.player.charisme >= 70 || s.player.rhetorique >= 75) && (s.country.cohesion < 42 || s.hidden.agitation > 48),
    opportunite: true,
    rarete: "historique",
    signal: "Le service des discours a ressorti un texte abandonné l'an dernier. Personne n'a demandé pourquoi maintenant.",
    pourquoi: "Le pays se fracture, et vous êtes de ceux qui savent encore parler.",
    icone: "✷",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { popularite: 10, presse: 6 }, country: { cohesion: 6 }, hidden: { fatigue: 8 } });
      c.log("Votre discours au Panthéon est entré dans les anthologies.");
      return "Vous parlez trente-cinq minutes sous la nef du Panthéon. Pas une annonce, pas une mesure : une idée de ce que le pays est. Les commentateurs cherchent l'arrière-pensée politique et n'en trouvent pas, ce qui les déstabilise. Le texte entrera dans les manuels.";
    },
  },
  {
    id: "plan_urgence",
    nom: "Plan d'urgence national",
    cout: 2,
    detail: "Un secteur s'effondre. Y aller massivement.",
    cond: (s) => s.country.services < 46 || s.country.securite < 46 || s.country.cohesion < 42,
    opportunite: true,
    rarete: "rare",
    declencheur: ["insurrection_alerte", "nuit_de_la_crue", "vigor_abandon", "hiver_declenche", "etat_urgence"],
    pourquoi: "Le pays vient de voir un service craquer en direct. Personne ne discutera le coût d'un plan, cette fois — mais la fenêtre se refermera avec l'émotion.",
    icone: "✚",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.adj({ country: { services: 9, securite: 5, cohesion: 4, marge: -9 }, power: { popularite: 4 }, hidden: { agitation: -8 } });
      c.log("Un plan d'urgence national a été déclenché pour un secteur au bord de la rupture.");
      return "Des milliards, un pilotage direct depuis l'Élysée, des préfets réquisitionnés. C'est cher, spectaculaire, et ça marche — les urgences absolues sont les seuls moments où l'État français retrouve sa vitesse d'exécution.";
    },
  },
  {
    id: "offensive_mediatique",
    nom: "Reprendre la main sur le récit",
    cout: 2,
    detail: "La presse vous massacre. Contre-attaquer.",
    cond: (s) => s.power.presse < 48,
    opportunite: true,
    rarete: "rare",
    declencheur: ["rives_guerre", "pacte_rives_rompu", "dossier_paru", "premiere_fuite", "loi_medias"],
    pourquoi: "La guerre est ouverte dans les rédactions. Ce genre de conflit ne s'éteint jamais tout seul : soit vous reprenez le récit maintenant, soit il s'installe.",
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const ok = c.s.player.rhetorique + c.rng.int(-12, 22) > 55;
      if (ok) {
        c.adj({ power: { presse: 14, popularite: 3 } });
        return "Trois semaines d'occupation méthodique du terrain : reportages en immersion, entretiens fleuves, portes ouvertes. Le récit change de main. Ça se joue toujours à l'usure, jamais au coup d'éclat.";
      }
      c.adj({ power: { presse: -5, popularite: -3 } });
      c.derive(1);
      return "L'offensive tourne au bras de fer, puis à la crispation. Un conseiller suggère de « revoir les accréditations » de deux rédactions. Vous ne dites pas non assez vite, et c'est déjà noté quelque part.";
    },
  },
  {
    id: "pacte_rives",
    nom: "L'offre du magnat",
    cout: 2,
    detail: "Antoine Rives propose de vous « accompagner ». Le mot est bien choisi.",
    cond: (s) => s.characters["rives"]?.vivant && s.characters["rives"].loyaute >= 40 && s.power.presse < 58,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Le directeur de cabinet d'Antoine Rives a demandé un créneau « sans objet précis ».",
    pourquoi: "Antoine Rives voit vos ennuis dans les rédactions, et il a le temps.",
    icone: "◈",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { presse: 20, popularite: 3 }, player: { integrite: -6 } });
      c.rel("rives", { loyaute: 22 });
      c.rel("ferrand", { rancune: 14, loyaute: -10 });
      c.gagnerFaveur(2);
      c.derive(1);
      c.dossier("pacte_rives", "Les contreparties du groupe Rives", 32);
      c.flag("pacte_rives_signe");
      // Ce qui s'achète se réclame : la note arrivera, et elle sera précise.
      c.sched("rives_addition", 4, 9, 0.65);
      c.log("Vous avez passé un accord avec Antoine Rives.");
      return "Le dîner dure quatre heures et personne ne prononce le mot « accord ». Trois chaînes, deux quotidiens et le premier portail d'information du pays changent de ton en dix jours — pas de propagande, juste des angles, des invités, des ordres de sujets. Louise Ferrand comprend la première et écrit un papier que plus personne ne reprend. Antoine Rives, lui, n'a rien demandé. C'est bien le problème : il demandera plus tard, et il choisira le moment.";
    },
  },
  {
    id: "sauver_journal",
    nom: "Sauver un titre de presse",
    cout: 2,
    detail: "Un quotidien historique dépose le bilan. L'État peut tout changer.",
    cond: (s) => s.country.marge >= 18 && s.power.presse < 60,
    opportunite: true,
    rarete: "rare",
    declencheur: ["rives_empire", "rives_guerre", "rives_marche_truque", "loi_medias"],
    pourquoi: "La concentration s'accélère dans la presse, un titre centenaire coule au milieu, et vous avez encore la marge pour le tenir.",
    icone: "✑",
    tone: "var(--color-social)",
    effects: (c) => {
      c.adj({ country: { marge: -7 }, power: { presse: 13 } });
      c.rel("ferrand", { loyaute: 16, rancune: -10 });
      c.rel("bec", { loyaute: 6 });
      c.rel("rives", { rancune: 10, loyaute: -8 });
      c.gagnerFaveur();
      c.seg("urbains", { soutien: 3 });
      c.dire(
        "independance_presse",
        "Une démocratie qui laisse mourir ses journaux ne meurt pas le même jour, mais elle meurt",
        "devant la rédaction sauvée"
      );
      c.log("Vous avez sauvé un quotidien de la liquidation.");
      return "Cent quatre-vingts salariés, cent trente ans d'archives, et un repreneur qui voulait le titre pour la marque. Vous montez un fonds de dotation adossé à l'État, sans droit de regard éditorial — la clause est publique, ce qui la rend crédible. Antoine Rives, qui comptait ramasser le titre à la casse, apprend la nouvelle par communiqué. La rédaction sauvée ne vous ménagera pas ; elle ne vous oubliera pas non plus.";
    },
  },
  {
    id: "apaiser_rue",
    nom: "Aller au-devant de la colère",
    cout: 2,
    detail: "Le pays gronde. Y aller sans service d'ordre.",
    cond: (s) => s.hidden.agitation > 40,
    opportunite: true,
    rarete: "rare",
    declencheur: ["rp_survenu", "retraites_faite", "insurrection_alerte", "repression_dure", "grand_debat"],
    pourquoi: "Le pays s'est soulevé, la fumée retombe — et personne n'est encore allé lui parler. Ça ne restera pas vrai longtemps.",
    icone: "◎",
    tone: "var(--color-social)",
    effects: (c) => {
      const courage = c.rng.chance(0.65);
      if (courage) {
        c.adj({ hidden: { agitation: -16, fatigue: 8 }, power: { popularite: 5 }, country: { cohesion: 4 } });
        c.log("Vous êtes allé(e) au contact d'un pays en colère, sans filtre.");
        return "Six heures dans une salle des fêtes hostile, sans notes, sans service d'ordre visible. On vous coupe la parole, on vous insulte, puis on vous écoute. Vous ne convainquez pas grand monde — mais vous êtes venu, et dans un pays qui se sent méprisé, c'est déjà la moitié du sujet.";
      }
      c.adj({ hidden: { agitation: 5 }, power: { popularite: -4 } });
      return "L'exercice tourne mal : une bousculade, une image de vous protégé par six gardes, reprise partout. La séquence prouve exactement le contraire de ce qu'elle devait montrer.";
    },
  },
  {
    id: "purge_administrative",
    nom: "Reprendre en main l'appareil d'État",
    cout: 2,
    detail: "Placer les vôtres partout. Efficace. Irréversible.",
    cond: (s) => s.derive >= 3,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Une liste de directions « à revoir » a été laissée sur votre bureau. Elle n'est signée de personne.",
    pourquoi: "Votre entourage a fini par comprendre que vous ne diriez plus non.",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.derive(2);
      c.adj({ power: { justice: -8, presse: -5 }, country: { securite: 3 } });
      c.rel("alberti", { rancune: 12 });
      c.log("Vous avez placé vos fidèles à la tête des administrations de contrôle.");
      return "Préfets, directions centrales, autorités de contrôle : une vague de nominations en trois conseils des ministres. Chacune est légale et défendable. Ensemble, elles font qu'aucun contre-pouvoir ne vous surprendra plus. C'est très confortable. C'est le problème.";
    },
  },
  {
    id: "virage_gauche",
    nom: "Infléchir à gauche",
    cout: 1,
    detail: "Un budget, un symbole, un camp. On saura enfin où vous êtes.",
    cond: (s) => s.bord > -10,
    cooldown: 3,
    icone: "◀",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      c.bord(-2);
      c.adj({ country: { services: 3, marge: -4 }, hidden: { agitation: -3 } });
      const extreme = c.s.bord <= -6;
      return extreme
        ? "Encore un cran. Les mesures s'enchaînent plus vite que les études d'impact, votre base exulte, et deux conseillers de Bercy demandent leur mutation le même jour. Il n'y a plus grand monde pour vous dire non, et c'est exactement ce que vous vouliez il y a deux ans."
        : "Un collectif budgétaire, deux symboles, un discours. La lecture est immédiate dans tout le pays : vous avez choisi un camp. On vous jugera désormais sur les résultats de ce camp-là, ce qui est plus exigeant que le flou.";
    },
  },
  {
    id: "virage_droite",
    nom: "Infléchir à droite",
    cout: 1,
    detail: "L'ordre, le travail, la frontière. La clarté a ses électeurs.",
    cond: (s) => s.bord < 10,
    cooldown: 3,
    icone: "▶",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.bord(2);
      c.adj({ country: { securite: 3, croissance: 0.2, environnement: -2 } });
      const extreme = c.s.bord >= 6;
      return extreme
        ? "Encore un cran. Le vocabulaire officiel change avant les lois — c'est toujours l'ordre des choses. Trois ambassadeurs demandent des « éclaircissements », votre électorat parle de courage, et personne au Conseil des ministres ne relève plus rien."
        : "Deux textes, un ton, une ligne. Le pays comprend enfin qui vous êtes, et une partie de ceux qui vous avaient élu par défaut commence à faire ses comptes. La clarté rapporte toujours plus qu'elle ne coûte, jusqu'au jour où c'est l'inverse.";
    },
  },
  {
    id: "purge_ideologique",
    nom: "Épurer l'appareil d'État",
    cout: 2,
    detail: "Ne garder que les vôtres. Les convictions avant les compétences.",
    cond: (s) => Math.abs(s.bord) >= 7 && s.derive >= 3,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Une note recensant les fonctionnaires « en désaccord de fond » circule dans les ministères. Elle est arrivée à vous en dernier.",
    pourquoi: "Votre ligne est assumée depuis assez longtemps pour que l'appareil d'État se divise.",
    icone: "⚑",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.derive(2);
      c.bord(c.s.bord < 0 ? -1 : 1);
      c.adj({ power: { justice: -10, presse: -8 }, country: { services: -4, cohesion: -6 } });
      c.rel("alberti", { rancune: 14 });
      c.log("Vous avez épuré l'administration selon un critère politique.");
      return "Quatre-vingt-dix hauts fonctionnaires écartés en trois vagues, remplacés par des fidèles dont la principale qualification est la fidélité. L'appareil vous obéit désormais au doigt et à l'œil, et il a perdu en six mois la seule chose qui le rendait utile : la capacité de vous dire que vous vous trompez.";
    },
  },
  {
    id: "grande_cause",
    nom: "Lancer la grande cause du mandat",
    cout: 2,
    detail: "Un sujet, cinq ans, votre nom dessus.",
    cond: (s) => s.turn <= 5 && !s.flags["grande_cause"],
    opportunite: true,
    rarete: "rare",
    signal: "Trois cabinets ministériels vous ont soumis la même idée de « grande cause du mandat ». Aucun ne s'est concerté.",
    pourquoi: "Un mandat qui commence peut encore choisir ce dont on se souviendra.",
    icone: "✶",
    tone: "var(--color-env)",
    effects: (c) => {
      c.flag("grande_cause");
      c.adj({ country: { cohesion: 5, environnement: 4, services: 3 }, power: { popularite: 3 }, hidden: { agitation: -3 } });
      c.sched("grande_cause_bilan", 6, 10, 0.7);
      c.log("Vous avez fait d'un seul sujet la grande cause de votre mandat.");
      return "Un sujet, une équipe dédiée, un budget sanctuarisé et votre nom associé pour toujours. Les grandes causes ne se jugent qu'à la fin — mais elles donnent à un mandat ce qui lui manque presque toujours : une direction lisible.";
    },
  },

  // --- Opportunités : l'économie -------------------------------------------
  {
    id: "conference_prix",
    nom: "Convoquer la conférence des prix",
    cout: 2,
    detail: "Les étiquettes brûlent. Réunir la distribution et taper du poing.",
    cond: (s) => s.country.inflation > 5.5,
    opportunite: true,
    rarete: "rare",
    signal: "Les relevés de la Répression des fraudes tiennent en une phrase : tout monte, partout, depuis six mois.",
    pourquoi: "L'inflation ne redescend pas, et ça se lit dans les rayons.",
    icone: "◈",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire(
        "prix",
        "Les prix vont baisser. Je m'y engage devant vous, et je reviendrai vous rendre des comptes",
        "à la sortie de la conférence des prix",
      );
      c.adj({ country: { inflation: -1.4, marge: -4 }, power: { popularite: 6, patronat: -8 } });
      c.rel("charvet", { rancune: 10 });
      c.press("« Trois cents produits bloqués » — la mesure fait la une de tous les journaux du soir", "favorable");
      return "Onze heures de réunion, une liste de trois cents produits, et une conférence de presse à minuit où vous annoncez des baisses que vous n'avez pas totalement obtenues. La distribution signe en serrant les dents. Ça calmera le caddie six mois ; personne dans la salle ne croit que ça règle quoi que ce soit.";
    },
  },
  {
    id: "grand_emprunt",
    nom: "Lancer le grand emprunt national",
    cout: 2,
    detail: "Les caisses sont vides. Aller chercher l'argent chez les Français.",
    cond: (s) => s.country.dette > 145 || s.country.marge < 18,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Le Trésor a placé sa dernière adjudication plus cher que prévu. Bercy parle de « conditions de marché ».",
    pourquoi: "L'État emprunte cher depuis plusieurs semestres, et tout le monde le sait.",
    icone: "▤",
    tone: "var(--color-eco)",
    effects: (c) => {
      const succes = c.s.power.popularite + c.rng.int(-15, 20) > 45;
      if (succes) {
        c.adj({ country: { marge: 16, dette: 6, cohesion: 4 }, power: { popularite: 4 } });
        c.log("Le grand emprunt national a été souscrit au-delà des objectifs.");
        return "Guichets ouverts six semaines, taux honnête, affiches partout. Les Français prêtent à leur propre État plus qu'on ne l'espérait — il y a dans ce geste quelque chose de très ancien, à mi-chemin entre la confiance et le placement. La dette monte, mais elle est désormais détenue par des gens qui votent.";
      }
      c.adj({ country: { marge: 5, dette: 4 }, power: { popularite: -5, patronat: -4 } });
      return "Guichets ouverts six semaines, et un résultat tiède que Bercy qualifie de « conforme aux prévisions révisées ». On ne prête pas à un État dont on doute, et c'est bien le problème : vous vouliez de l'argent, vous avez obtenu un sondage.";
    },
  },
  {
    id: "grands_travaux",
    nom: "Décréter les grands travaux",
    cout: 2,
    detail: "Le chômage explose. Sortir la truelle et le béton.",
    cond: (s) => s.country.chomage > 11.5,
    opportunite: true,
    rarete: "rare",
    signal: "L'opérateur de l'emploi a révisé sa série longue : la courbe ne redescend plus depuis dix-huit mois.",
    pourquoi: "Le chômage s'installe, et l'État sait encore commander des chantiers.",
    icone: "⚒",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire("emploi", "Personne ne restera au bord du chemin. Le chantier est ouvert, et il est ouvert à tous", "au lancement des grands travaux");
      c.adj({
        country: { chomage: -1.3, croissance: 0.5, marge: -10, dette: 5, environnement: -4 },
        power: { popularite: 6, syndicats: 8, patronat: 5 },
      });
      c.seg("periurbain", { soutien: 6 });
      c.log("Un plan de grands travaux a été décrété.");
      return "Lignes ferroviaires, réseaux d'eau, rénovation de trois mille écoles : de la commande publique brute, décidée en six semaines au lieu de six ans. Les carnets se remplissent, les chiffres du chômage tourneront dans un an, et les écologistes de votre majorité découvrent la quantité de béton qu'il faut pour faire baisser une courbe.";
    },
  },
  {
    id: "dividende_croissance",
    nom: "Rendre le dividende de la croissance",
    cout: 1,
    detail: "Ça va bien. Trop bien pour ne rien en faire.",
    cond: (s) => s.country.croissance > 2.4 && s.country.marge > 52,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Bercy révise ses recettes à la hausse pour le troisième trimestre d'affilée. Danglade n'en a parlé à personne.",
    pourquoi: "La croissance tient et les caisses sont pleines — ça n'arrive presque jamais.",
    icone: "✧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ country: { marge: -12, cohesion: 5, services: 3 }, power: { popularite: 11, presse: 4 } });
      c.seg("periurbain", { soutien: 5, participation: 3 });
      c.seg("csp", { soutien: 4 });
      c.press("« Le président rend l'argent » — la séquence tourne en boucle", "favorable");
      c.log("Vous avez redistribué l'excédent budgétaire aux ménages.");
      return "Un chèque, un vrai, envoyé avant l'été à quinze millions de foyers. Bercy plaide pour désendetter, vous plaidez pour qu'on se souvienne de vous. Les deux raisonnements sont bons ; un seul se voit sur un relevé bancaire.";
    },
  },

  // --- Opportunités : le monde ---------------------------------------------
  {
    id: "mediation_mondiale",
    nom: "Prendre la médiation",
    cout: 2,
    detail: "Deux puissances se parlent enfin. Elles cherchent une table.",
    // Personne ne médie une guerre qui n'a pas éclaté : l'occasion n'existe pas
    // tant que « la guerre des autres » n'a pas eu lieu dans cette partie-ci.
    declencheur: "guerre_ouverte",
    cond: (s) => s.country.prestige > 58,
    opportunite: true,
    rarete: "historique",
    pourquoi: "La guerre des Deux Fleuves s'enlise, et les deux camps cherchent une table.",
    icone: "☮",
    tone: "var(--color-monde)",
    effects: (c) => {
      const abouti = c.s.player.strategie + c.rng.int(-10, 25) > 60;
      if (abouti) {
        c.adj({ country: { prestige: 14, cohesion: 4 }, power: { popularite: 8, presse: 7 }, hidden: { fatigue: 12 } });
        c.rel("weiss", { loyaute: 8 });
        c.flag("mediation_reussie");
        c.press("« La paix signée à Paris » — les images de la poignée de main font le tour du monde", "favorable");
        c.log("Vous avez obtenu un accord entre deux puissances en guerre.");
        return "Neuf jours dans un château sous cloche, sans téléphone, à faire la navette entre deux ailes. Le texte final tient en quatre pages et ne satisfait personne, ce qui est la définition d'un accord. La photo de la poignée de main sera dans les manuels bien après que le pays aura oublié votre bilan intérieur.";
      }
      c.adj({ country: { prestige: -6 }, power: { popularite: -4 }, hidden: { fatigue: 14 } });
      return "Neuf jours dans un château sous cloche, et une délégation qui repart la nuit sans prévenir. Vous avez engagé la France dans un échec très visible. En diplomatie, celui qui convoque est celui qui perd si personne ne signe.";
    },
  },
  {
    id: "tournee_reconquete",
    nom: "La tournée de reconquête",
    cout: 2,
    detail: "La France ne pèse plus rien. Aller le corriger sur place.",
    cond: (s) => s.country.prestige < 46,
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["isolement_alerte", "isolement_diplomatique", "pivot_alliances"],
    pourquoi: "Une capitale de plus vient de vous tourner le dos. Le Quai a cessé d'appeler cela un incident.",
    icone: "✈",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { prestige: 12, marge: -3 }, power: { popularite: -3, patronat: 6 }, hidden: { fatigue: 16 } });
      c.rel("weiss", { loyaute: 5 });
      c.press("« Onze pays en dix-huit jours » — la presse compte les kilomètres plutôt que les résultats", "neutre");
      return "Onze capitales, dix-huit jours, quatre fuseaux horaires et deux contrats industriels qu'on vous disait perdus. Vous rentrez avec un prestige recousu et une opinion intérieure qui a compté vos absences une par une. Le rayonnement se paie toujours en présence.";
    },
  },

  // --- Opportunités : les corps et l'appareil -------------------------------
  {
    id: "grenelle",
    nom: "Ouvrir un Grenelle",
    cout: 2,
    detail: "Les syndicats sont partis, la rue est pleine. Tout remettre sur la table.",
    cond: (s) => s.power.syndicats < 42 || s.hidden.agitation > 40,
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["retraites_faite", "rp_survenu", "requisition_patronale", "repression_dure"],
    pourquoi: "Un bras de fer social vient de se terminer sans que rien ne soit réglé. C'est le seul moment où tout le monde accepte de revenir à la table.",
    icone: "⚖",
    tone: "var(--color-social)",
    effects: (c) => {
      c.adj({ power: { syndicats: 20, patronat: -7, popularite: 4 }, country: { marge: -7, cohesion: 5 }, hidden: { agitation: -14, fatigue: 10 } });
      c.rel("kervella", { rancune: -12, loyaute: 8 });
      c.rel("belkacem", { loyaute: 10 });
      c.rel("charvet", { rancune: 8 });
      c.log("Un Grenelle a été ouvert avec les partenaires sociaux.");
      return "Trois nuits blanches rue de Grenelle, des salaires, des grilles, un relevé de conclusions signé à 4 h 20 du matin par des gens qui ne se parlaient plus. Bruno Kervella signe le dernier et sans un mot. Ça coûte très cher et ça vous rachète une année de paix sociale — les deux à la fois, comme toujours.";
    },
  },
  {
    id: "pacte_productif",
    nom: "Sceller le pacte productif",
    cout: 2,
    detail: "Le patronat vous a lâché. Le récupérer coûtera quelque chose.",
    cond: (s) => s.power.patronat < 28,
    opportunite: true,
    rarete: "rare",
    signal: "Trois grands groupes ont annoncé leurs investissements depuis Francfort. Le lieu était le message.",
    pourquoi: "Le patronat vous a lâché, et il le fait savoir depuis des mois.",
    icone: "◧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ power: { patronat: 20, syndicats: -8, popularite: -3 }, country: { croissance: 0.6, chomage: -0.5, marge: -6 } });
      c.rel("charvet", { loyaute: 14, rancune: -8 });
      c.rel("kervella", { rancune: 10 });
      c.seg("csp", { soutien: 5 });
      return "Baisse de charges contre engagements d'embauche, signés devant caméras. Édouard Charvet vous serre la main comme on referme un contrat d'assurance. Les engagements ne sont pas contraignants ; la baisse de charges, elle, s'applique dès janvier. Vous savez très bien lequel des deux tiendra.";
    },
  },
  {
    id: "congres_extraordinaire",
    nom: "Convoquer un congrès extraordinaire",
    cout: 2,
    detail: "Le parti vous échappe. Le reprendre devant ses militants.",
    cond: (s) => s.power.parti < 46,
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["rival_interne", "frondeur_precoce", "delval_vainqueur", "censure_votee", "technicien_motion"],
    pourquoi: "Quelqu'un des vôtres a levé la main contre vous et n'a pas été puni. Le congrès est la dernière enceinte où l'on peut encore trancher ça devant les militants.",
    icone: "♟",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      const tenu = c.s.player.charisme + c.rng.int(-15, 22) > 55;
      if (tenu) {
        c.adj({ power: { parti: 24, popularite: 2 } });
        c.rel("delval", { loyaute: 10, ambition: -8 });
        c.log("Vous avez repris le parti en main lors d'un congrès extraordinaire.");
        return "Deux mille militants dans un parc des expositions surchauffé, et quarante minutes sans notes qui rappellent à tout le monde pourquoi c'est vous. Sacha Delval applaudit debout, au troisième rang, avec la tête de quelqu'un qui recompte ses appuis.";
      }
      c.adj({ power: { parti: -10, popularite: -4, presse: -4 } });
      c.rel("delval", { ambition: 12, loyaute: -10 });
      c.sched("pm_rival", 2, 5, 0.5);
      return "Deux mille militants, et une motion concurrente qui recueille 41 % — un score qu'on ne présente comme une victoire que quand on a perdu. Sacha Delval fait le tour des plateaux le lendemain pour expliquer qu'il n'est candidat à rien. Personne ne le croit, et il compte là-dessus.";
    },
  },
  {
    id: "loi_moralisation",
    nom: "La loi de moralisation",
    cout: 2,
    detail: "Votre réputation est intacte. C'est un capital qui se dépense.",
    cond: (s) => s.player.integrite > 58 && s.power.justice > 38,
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["blanchi_publiquement", "commission_en_cours", "carnets_confession", "emploi_familial", "watergate_public"],
    pourquoi: "Une affaire vient de traverser le pouvoir et vous en sortez debout. C'est le seul état dans lequel on peut faire voter un texte pareil — et il ne dure jamais.",
    icone: "§",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.dire("probite", "Aucun de mes proches, aucun de mes ministres, aucun de mes amis ne bénéficiera de la moindre exception", "en présentant la loi de moralisation");
      c.adj({ power: { justice: 14, presse: 9, popularite: 7, parti: -12 }, player: { integrite: 4 } });
      c.rel("espitalier", { rancune: 16 });
      c.rel("alberti", { loyaute: 10 });
      c.flag("moralisation");
      c.log("La loi de moralisation de la vie publique a été promulguée.");
      return "Emplois familiaux interdits, casier vierge exigé, réserve parlementaire supprimée, comptes de campagne ouverts. Le texte passe parce que personne ne peut voter contre à visage découvert. Jean-Marc Espitalier vous explique en petit comité que vous venez d'assécher le parti — il a raison, et il ne l'oubliera pas.";
    },
  },

  // --- Opportunités : l'homme ou la femme ----------------------------------
  {
    id: "adresse_solennelle",
    nom: "L'adresse au pays",
    cout: 2,
    detail: "Vous êtes au fond. Vingt minutes, en direct, sans filet.",
    cond: (s) => s.power.popularite < 24,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Un institut a renoncé à publier votre cote : « à ce niveau, la marge d'erreur n'a plus de sens ».",
    pourquoi: "Vous êtes au plancher depuis plusieurs semestres. Il n'y a plus rien à ménager.",
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const juste = c.s.player.rhetorique + c.s.player.integrite / 2 + c.rng.int(-18, 20) > 70;
      if (juste) {
        c.dire("cap", "J'ai entendu. Je ne changerai pas de cap, je changerai de manière", "dans l'adresse aux Français");
        c.adj({ power: { popularite: 13, presse: 5 }, country: { cohesion: 4 }, hidden: { agitation: -8 } });
        c.log("Votre adresse aux Français a inversé la courbe.");
        return "Vingt minutes seul face à une caméra, sans décor, sans prompteur visible. Vous reconnaissez deux erreurs par leur nom — ce que personne ne fait jamais — et vous ne demandez rien. Vingt-trois millions de téléspectateurs. Le lendemain, pour la première fois depuis un an, la courbe remonte.";
      }
      c.adj({ power: { popularite: -6, presse: -5 } });
      return "Vingt minutes seul face à une caméra, et un ton qui sonne faux dès la troisième phrase. Le pays entend un homme qui s'explique au lieu d'un président qui décide. Les réseaux découpent la séquence en trente extraits avant même la fin du direct. On ne se relève pas d'une adresse ratée : on l'ajoute au dossier.";
    },
  },
  {
    id: "verite_sante",
    nom: "Dire la vérité sur votre santé",
    cout: 1,
    detail: "Le Dr Manin insiste. Le pays finira par l'apprendre autrement.",
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["maladie_cachee"],
    // Le drapeau dit déjà tout : on ne révèle que ce qu'on a caché.
    pourquoi: "Vous avez quelque chose à cacher et une rumeur qui tourne. Ce n'est plus qu'une question de savoir qui le dira le premier.",
    icone: "✚",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { popularite: 8, presse: 10, parti: -8 }, player: { integrite: 6 }, hidden: { paranoia: -12 } });
      c.rel("manin", { loyaute: 12 });
      c.rel("conjoint", { loyaute: 8 });
      c.rel("delval", { ambition: 10 });
      c.flag("sante_publique");
      c.press("« Le président dit son mal » — le bulletin de santé est publié intégralement", "favorable");
      c.log("Vous avez rendu public votre état de santé.");
      return "Un communiqué de quatre lignes, un bulletin de santé complet, et une phrase en fin de conférence de presse : « Vous saurez tout, et vous le saurez de moi. » Le pays vous en sait gré immédiatement. Votre propre camp, lui, commence à compter les mois — c'est le prix, et il est déjà payé.";
    },
  },
  {
    id: "retraite_strategique",
    nom: "Disparaître quinze jours",
    cout: 1,
    detail: "Vous n'en pouvez plus. Personne ne sait où vous êtes.",
    cond: (s) => s.hidden.fatigue > 78,
    opportunite: true,
    rarete: "rare",
    signal: "Votre chef de cabinet a bloqué trois jours dans l'agenda, sans intitulé. Il ne vous l'a pas dit.",
    pourquoi: "Vous tenez debout à la seule volonté depuis trop longtemps.",
    icone: "☾",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ hidden: { fatigue: -42, sante: 10, paranoia: -10 }, power: { popularite: -5, presse: -6 } });
      c.rel("conjoint", { loyaute: 12, rancune: -8 });
      c.press("« Où est le président ? » — deux semaines d'absence et autant de spéculations", "hostile");
      return "Quinze jours dans une maison de fonction que personne ne connaît, sans agenda, sans note, sans conseiller. Vous dormez douze heures par nuit la première semaine. La presse parle de fuite, l'opposition d'abandon, et votre médecin de la seule décision sensée que vous ayez prise depuis deux ans.";
    },
  },
  {
    id: "devancer_generaux",
    nom: "Devancer les généraux",
    cout: 2,
    detail: "Ça se murmure dans les états-majors. Ne pas attendre.",
    // Un général qui fait de la politique en public est déjà le risque : on
    // n'attend pas que les rapports du renseignement le confirment.
    cond: (s) => s.hidden.coup > 12 || s.derive >= 3,
    opportunite: true,
    rarete: "exceptionnelle",
    declencheur: ["verdier_opposant", "verdier_plie", "regicide", "sahel_drame"],
    pourquoi: "Un uniforme a parlé politique en public et n'a pas été sanctionné. Dans les casernes, ce genre de silence s'interprète très vite.",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      const net = c.s.player.strategie + c.s.power.armee / 2 + c.rng.int(-20, 20) > 70;
      if (net) {
        c.adj({ hidden: { coup: -34, paranoia: 8 }, power: { armee: 6 } });
        c.rel("verdier", { loyaute: 8, ambition: -10 });
        c.log("Vous avez démantelé un noyau de conjurés dans l'armée.");
        return "Trois mutations, une mise à la retraite anticipée, un commandement dissous, tout cela un mardi matin et sans un mot à la presse. Le général Verdier vous remet lui-même la liste, ce qui répond à la seule question qui comptait vraiment. Le reste de l'état-major comprend le message en lisant le Journal officiel.";
      }
      c.adj({ hidden: { coup: 12, paranoia: 16 }, power: { armee: -12 } });
      c.rel("verdier", { rancune: 18, loyaute: -14 });
      c.derive(1);
      return "Vous frappez trop large et trop vite. Deux des officiers écartés n'avaient rien à se reprocher, et leurs camarades le savent. Vous vouliez décapiter une rumeur ; vous venez de lui donner des martyrs et une raison. L'armée ne pardonne pas l'injustice administrative — c'est la seule qu'elle subisse.";
    },
  },

  // --- Opportunités : le pays ----------------------------------------------
  {
    id: "loi_climat",
    nom: "La loi climat de rupture",
    cout: 2,
    detail: "L'environnement s'effondre. Un texte que personne n'ose écrire.",
    cond: (s) => s.country.environnement < 32,
    opportunite: true,
    rarete: "rare",
    signal: "L'agence de l'environnement a publié son rapport un vendredi soir. Il est accablant ; personne ne l'a lu.",
    pourquoi: "Les indicateurs environnementaux sont au rouge et y restent.",
    icone: "❧",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({
        country: { environnement: 16, croissance: -0.5, marge: -6 },
        power: { patronat: -12, presse: 6, popularite: -2 },
      });
      c.seg("urbains", { soutien: 8, participation: 4 });
      c.seg("ruraux", { soutien: -6 });
      c.rel("charvet", { rancune: 14 });
      c.log("Une loi climat de rupture a été promulguée.");
      return "Interdictions datées, trajectoires contraignantes, sanctions réelles : pour une fois le texte n'est pas un catalogue d'intentions. Les urbains diplômés vous redécouvrent, la ruralité comprend qu'elle paiera d'abord, et le patronat sort de la réunion sans faire de déclaration — ce qui est sa manière de déclarer la guerre.";
    },
  },
  {
    id: "leadership_climat",
    nom: "Prendre la tête du monde qui vient",
    cout: 2,
    detail: "Exemplaire chez vous, écouté partout. Une seule fois dans un mandat.",
    cond: (s) => s.country.environnement > 68 && s.country.prestige > 55,
    opportunite: true,
    rarete: "historique",
    signal: "Trois pays ont demandé la traduction de vos textes de loi. Ça ne s'était jamais vu dans ce sens-là.",
    pourquoi: "La France tient une avance qu'on lui reconnaît enfin, et depuis assez longtemps.",
    icone: "✦",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ country: { prestige: 15, environnement: 5, cohesion: 3 }, power: { popularite: 7, presse: 8 }, hidden: { fatigue: 10 } });
      c.flag("leadership_climat");
      c.seg("jeunes", { soutien: 10, participation: 6 });
      c.press("« L'accord de Paris, le vrai » — quarante chefs d'État signent le texte français", "favorable");
      c.log("La France a pris la tête d'une coalition climatique mondiale.");
      return "On ne vous a pas donné ce rôle : vous l'avez pris, parce que vous étiez le seul à pouvoir montrer vos propres chiffres sans rougir. Quarante chefs d'État signent un texte rédigé au Quai d'Orsay. Les jeunes, qui ne vous devaient rien, vous inscrivent au crédit de quelque chose qu'ils vérifieront dans trente ans.";
    },
  },
  {
    id: "union_nationale",
    nom: "Former l'union nationale",
    cout: 2,
    detail: "Le pays est derrière vous. Élargir tant que ça tient.",
    cond: (s) => s.country.cohesion > 48 && s.power.popularite > 42,
    opportunite: true,
    rarete: "historique",
    declencheur: ["nation_endeuillee", "guerre_ouverte", "cat_assaut_reussi", "mediation_reussie"],
    pourquoi: "Le pays vient de traverser quelque chose ensemble. Ce genre de fenêtre se referme en quelques semaines, et il n'y en aura pas deux.",
    icone: "⚭",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      c.adj({ power: { sieges: 42, parti: -10, popularite: 5, presse: 6 }, country: { cohesion: 6 } });
      c.rel("andrieu", { loyaute: 25, rancune: -15, ambition: -8 });
      c.rel("delval", { rancune: 12 });
      c.rel("sallenave", { rancune: 15 });
      c.flag("union_nationale");
      c.log("Un gouvernement d'union nationale a été formé.");
      return "Quatre portefeuilles à l'opposition de gouvernement, dont un régalien — ce qui est le seul geste que personne ne peut qualifier de cosmétique. Claire Andrieu accepte en quarante-huit heures ; son propre camp la traite de collaboratrice le soir même. Vous gouvernez désormais avec une majorité écrasante et sans plus aucune excuse.";
    },
  },
  {
    id: "dissolution_offensive",
    nom: "Dissoudre",
    cout: 2,
    detail: "Vous êtes haut, l'Assemblée est courte. Tout remettre en jeu.",
    cond: (s) => s.power.popularite > 50 && s.power.sieges < 289,
    opportunite: true,
    rarete: "historique",
    declencheur: ["censure_votee", "technicien_motion", "frondeur_precoce", "bascule_refusee"],
    pourquoi: "L'Assemblée vient de vous montrer qu'elle pouvait vous arrêter. Vous êtes haut dans l'opinion : c'est exactement l'écart qui rend la dissolution tentante, et dangereuse.",
    icone: "⚑",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      const marge = c.s.power.popularite - 50 + c.s.power.parti / 4 + c.rng.int(-22, 18);
      if (marge > 12) {
        c.adj({ power: { sieges: 96, parti: 10, popularite: 4 } });
        c.s.cohabitation = false;
        c.log("La dissolution vous a rendu une majorité absolue.");
        return "Vingt-quatre jours de campagne éclair sur un seul argument : laissez-moi finir. Le pays vous donne une majorité absolue et le sentiment très rare, à l'Élysée, d'avoir eu raison contre tous les conseillers. Vous n'aurez plus jamais cette fenêtre — les dissolutions gagnantes ne se reproduisent pas.";
      }
      c.adj({ power: { sieges: -54, parti: -14, popularite: -10 } });
      c.s.cohabitation = true;
      c.rel("andrieu", { ambition: 14 });
      c.log("La dissolution a tourné à la cohabitation.");
      return "Vingt-quatre jours de campagne éclair, et un dimanche soir où les cartes se remplissent d'une couleur qui n'est pas la vôtre. Vous aviez la popularité ; il vous manquait les circonscriptions, qui ne se sondent pas. Il faudra désormais partager le pouvoir avec quelqu'un qui vous doit sa fonction et rien d'autre.";
    },
  },

  // --- L'Europe : la diplomatie ordinaire ----------------------------------
  {
    id: "bilateral",
    nom: "Un tête-à-tête",
    cout: 1,
    detail: "Deux heures avec une capitale. Sans conseillers, sans communiqué.",
    needParam: "nation",
    candidats: (s) => NATIONS.filter((d) => s.europe.nations[d.id]).map((d) => d.id),
    cooldown: 2,
    icone: "⚑",
    tone: "var(--color-monde)",
    effects: (c, param) => {
      const def = defDe(param ?? "allemagne");
      if (!def) return "Aucune capitale choisie.";
      const st = c.s.europe.nations[def.id];
      const ecart = Math.abs(c.s.bord - st.bord);
      // On ne rattrape pas idéologiquement ce qui sépare deux lignes. On peut
      // seulement rendre le désaccord courtois — c'est déjà beaucoup.
      const gain = Math.round(16 - ecart * 1.1 + c.s.player.charisme * 0.06);
      c.nation(def.id, { relation: Math.max(3, gain), faveurs: 4 });
      c.adj({ hidden: { fatigue: 4 }, country: { prestige: 1 } });
      if (def.dirigeantId) c.rel(def.dirigeantId, { loyaute: 6 });
      if (ecart >= 8) {
        return `Deux heures à ${def.capitale}, dont quarante minutes sans interprète. Vous ne vous entendez sur rien et vous le dites franchement, ce qui vous rapproche davantage que six communiqués communs. On se quitte en sachant exactement où l'autre bloquera — dans ce métier, c'est le seul luxe.`;
      }
      return `Deux heures à ${def.capitale}, un déjeuner qui déborde, deux dossiers réglés dans le couloir. Rien qui se voie de Paris. Mais le jour où il faudra une voix de plus au Conseil, quelqu'un décrochera.`;
    },
  },
  {
    id: "conseil_europeen",
    nom: "Monter au Conseil",
    cout: 2,
    detail: "Porter une initiative française. Il faut compter ses voix avant.",
    cooldown: 3,
    icone: "★",
    tone: "var(--color-monde)",
    effects: (c) => {
      const maj = majorite(c.s);
      const passe = maj + c.s.player.strategie * 0.15 + c.rng.int(-14, 14) > 58;
      if (passe) {
        c.adj({ country: { influence: 9, prestige: 5, marge: 3 }, power: { popularite: 4, presse: 3 } });
        c.toutesNations({ relation: 2 }, hostiles(c.s).map((d) => d.id));
        c.log("Une initiative française a été adoptée par le Conseil européen.");
        return `Trente-neuf heures de sommet, deux nuits blanches, un texte réécrit six fois dans un couloir. Il sort avec votre nom dessus et deux tiers de ce que vous vouliez. À ${maj} % de voix acquises en entrant, c'était jouable ; ceux qui vous suivent aujourd'hui compteront la facture demain.`;
      }
      c.adj({ country: { influence: -7, prestige: -4 }, power: { popularite: -3, presse: -4 } });
      c.nation("allemagne", { relation: -5 });
      return `Trente-neuf heures de sommet pour un communiqué de onze lignes qui « prend note » de la proposition française. « Prendre note » est le mot que l'Europe emploie pour dire non sans humilier. À ${maj} % de voix acquises en entrant, il ne fallait pas y aller — ou il fallait y aller autrement.`;
    },
  },

  // --- L'Europe : les occasions --------------------------------------------
  {
    id: "sommet_paris",
    nom: "Convoquer un sommet à Paris",
    cout: 2,
    detail: "Vous pesez assez pour fixer l'ordre du jour de tout le monde.",
    cond: (s) => s.country.influence > 62,
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Trois chancelleries ont fait savoir qu'elles seraient « disponibles » si Paris convoquait quelque chose.",
    pourquoi: "Votre influence au Conseil est haute et le reste.",
    icone: "✦",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { influence: 11, prestige: 8 }, power: { popularite: 5, presse: 5 }, hidden: { fatigue: 10 } });
      c.toutesNations({ relation: 6 });
      c.press("« Vingt-sept à Paris » — les images du Grand Palais tournent sur toutes les chaînes du continent", "favorable");
      c.log("Vous avez convoqué et présidé un sommet européen à Paris.");
      return "Convoquer, c'est déjà décider : celui qui fixe l'ordre du jour a gagné la moitié du sommet avant qu'il commence. Deux jours de Grand Palais, un communiqué où la France est citée quatre fois, et la découverte que la plupart des chefs d'État viennent surtout pour les couloirs.";
    },
  },
  {
    id: "coalition_bloc",
    nom: "Former un bloc",
    cout: 2,
    detail: "Trois capitales qui votent ensemble, toujours. Ça change tout.",
    cond: (s) => alliees(s).filter((d) => !d.institution && !d.horsUnion).length >= 2 && !s.flags["bloc_forme"],
    opportunite: true,
    rarete: "historique",
    signal: "Deux capitales amies ont voté comme vous trois fois de suite. Le Quai commence à écrire le mot « famille ».",
    pourquoi: "Deux capitales au moins vous suivent durablement — assez pour bâtir quelque chose.",
    icone: "◈",
    tone: "var(--color-monde)",
    effects: (c) => {
      const amis = alliees(c.s).filter((d) => !d.institution && !d.horsUnion);
      c.flag("bloc_forme", amis.map((d) => d.id).join(","));
      c.adj({ country: { influence: 16, prestige: 6 } });
      for (const d of amis) c.nation(d.id, { relation: 10, faveurs: 8 });
      // Ceux qui restent dehors voient très bien ce qui se construit.
      c.toutesNations({ relation: -6 }, [...amis.map((d) => d.id), "commission"]);
      c.sched("bloc_traite", 3, 6, 0.6);
      c.log(`Vous avez formé un bloc avec ${amis.map((d) => d.capitale).join(" et ")}.`);
      return `Un format à ${amis.length + 1}, une réunion préparatoire avant chaque Conseil, une position commune arrêtée en amont. ${amis.map((d) => d.capitale).join(" et ")} acceptent — non par affection, mais parce qu'un bloc pèse plus que la somme de ses membres. Les autres capitales comprennent en une semaine, et commencent à en construire un autre.`;
    },
  },
  {
    id: "veto",
    nom: "Mettre le veto",
    cout: 1,
    detail: "Tout bloquer jusqu'à obtenir ce que vous voulez. Ça se paie longtemps.",
    cond: (s) => majorite(s) < 46,
    opportunite: true,
    rarete: "rare",
    signal: "Le secrétariat du Conseil a inscrit votre point en fin d'ordre du jour. Deux fois de suite.",
    pourquoi: "Vous êtes minoritaire au Conseil, et vous le restez.",
    icone: "⊘",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.adj({ country: { marge: 7, influence: -12, prestige: -5 }, power: { popularite: 6 } });
      c.toutesNations({ relation: -14 }, ["hongrie"]);
      c.nation("hongrie", { relation: 8 });
      c.press("« LA FRANCE BLOQUE TOUT » — la presse allemande emploie le mot « chantage », la presse française le mot « fermeté »", "neutre");
      c.log("Vous avez opposé votre veto au Conseil pour obtenir une contrepartie.");
      return "Vous bloquez le paquet entier pour une ligne budgétaire. Ça marche : à quatre heures du matin, on vous donne ce que vous demandiez pour que le sommet finisse. Vous rentrez avec votre enveloppe et avec vingt-six capitales qui savent désormais que la France se paie. On vous le fera sentir à chaque vote, pendant des années.";
    },
  },
  {
    id: "accord_commercial",
    nom: "Signer le grand accord",
    cout: 2,
    detail: "Des marchés ouverts contre des concessions. Les agriculteurs vont hurler.",
    cond: (s) => alliees(s).some((d) => d.traits.includes("industrielle")),
    opportunite: true,
    rarete: "rare",
    signal: "Un projet d'accord commercial est arrivé par voie non officielle. Il est déjà entièrement rédigé.",
    pourquoi: "Une capitale industrielle vous suit depuis assez longtemps pour vouloir signer.",
    icone: "◧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire("agriculture", "Aucun agriculteur français ne sera sacrifié à un traité. Aucun", "à la signature de l'accord");
      c.adj({
        country: { croissance: 0.9, chomage: -0.6, environnement: -6, influence: 5, prestige: 3 },
        power: { patronat: 12, syndicats: -6, popularite: 2 },
      });
      c.seg("ruraux", { soutien: -10 });
      c.seg("csp", { soutien: 6 });
      c.sched("accord_agriculteurs", 2, 5, 0.7);
      c.log("Un grand accord commercial a été signé.");
      return "Quatre cents pages, dix-neuf ans de négociation, et une signature qui prend douze secondes. Les carnets de commandes de l'industrie se remplissent avant même la ratification. Dans les campagnes, on lit la même page et on y voit exactement l'inverse — et on n'a pas tort.";
    },
  },
  {
    id: "guerre_commerciale",
    nom: "Passer aux représailles",
    cout: 2,
    detail: "Une capitale vous nuit. Répondre sur le terrain qui fait mal.",
    cond: (s) => hostiles(s).some((d) => !d.institution),
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Un poste douanier a retenu trois camions français « pour vérification ». Puis six. Puis onze.",
    pourquoi: "Une capitale hostile vous cherche depuis plusieurs semestres.",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      const cible = hostiles(c.s).filter((d) => !d.institution)[0];
      if (!cible) return "Plus personne à qui répondre.";
      c.nation(cible.id, { relation: -22 });
      c.toutesNations({ relation: -5 }, [cible.id]);
      c.adj({ country: { croissance: -0.4, inflation: 0.6, influence: -6 }, power: { popularite: 7, patronat: -8 } });
      c.press(`« PARIS RIPOSTE » — les mesures visant ${cible.nom} sont annoncées à 20 h, appliquées à minuit`, "neutre");
      c.log(`Vous avez engagé des représailles commerciales contre ${cible.nom}.`);
      return `Droits de douane ciblés, marchés publics fermés, deux licences d'exportation suspendues « pour vérification ». ${cible.capitale} répond en quarante-huit heures, sur vos produits les plus symboliques. L'opinion adore ; les industriels des deux pays paient ; et personne ne sait plus comment on s'arrête.`;
    },
  },

  // --- L'Europe : l'arrière-cuisine ----------------------------------------
  {
    id: "circuit_etranger",
    nom: "Ouvrir le circuit",
    cout: 1,
    detail: "Zeeman a un montage. Le parti respirerait enfin.",
    cond: (s) => (s.power.parti < 48 || s.derive >= 2) && !s.europe.dossiers.some((d) => d.id === "circuit"),
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Le trésorier du parti a demandé à vous voir. Il a précisé : seul.",
    pourquoi: "Le parti manque d'argent depuis des mois, et quelqu'un connaît un chemin.",
    icone: "◐",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("circuit", "Le financement du parti par un circuit étranger", 55);
      c.adj({ power: { parti: 22, popularite: 2 }, player: { integrite: -10, cynisme: 8 } });
      c.nation("paysbas", { savoir: 25 });
      c.nation("royaumeuni", { savoir: 15 });
      c.rel("zeeman", { loyaute: 15, ambition: 10 });
      c.rel("espitalier", { loyaute: 10 });
      c.sched("circuit_trace", 3, 7, 0.6);
      c.log("Le parti est désormais financé par un circuit passant par trois juridictions.");
      return "Une fondation à Amsterdam, une société de conseil à Jersey, une facture de « veille stratégique » de deux millions par trimestre. Joost Zeeman explique tout au tableau blanc, en trente minutes, et rien de ce qu'il décrit n'est illégal pris séparément. C'est l'assemblage qui l'est. Le trésorier respire pour la première fois depuis deux ans.";
    },
  },
  {
    id: "maquiller_deficit",
    nom: "Arranger les comptes",
    cout: 1,
    detail: "Bercy sait faire. Bruxelles ne regarde pas si près.",
    cond: (s) => (s.country.dette > 128 || s.country.marge < 26) && !s.europe.dossiers.some((d) => d.id === "comptes"),
    opportunite: true,
    rarete: "exceptionnelle",
    signal: "Un cabinet d'audit s'est présenté à Bercy sans qu'on sache très bien qui l'avait mandaté.",
    pourquoi: "Les comptes ne passeront pas Bruxelles, et ça n'arrive pas depuis hier.",
    icone: "▤",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("comptes", "La sincérité des comptes transmis à Bruxelles", 45);
      c.adj({ country: { marge: 14, dette: -6 }, power: { popularite: 4, patronat: 5 }, player: { integrite: -8 } });
      c.nation("commission", { savoir: 20, relation: 6 });
      c.nation("allemagne", { savoir: 12 });
      c.rel("danglade", { loyaute: -8, rancune: 10 });
      c.sched("comptes_eurostat", 3, 8, 0.6);
      c.log("Les comptes transmis à la Commission ont été « retraités ».");
      return "Trois recettes exceptionnelles anticipées, deux dettes d'hôpitaux sorties du périmètre, une soulte requalifiée. Danglade signe en demandant que sa réserve figure au procès-verbal — ce qui, le jour venu, sera la seule ligne qui comptera. Bruxelles valide en six semaines. Eurostat, lui, prend deux ans, et il n'oublie pas.";
    },
  },
  {
    id: "operation_speciale",
    nom: "Autoriser l'opération",
    cout: 2,
    detail: "Soubeyran, minuit, une chemise cartonnée. Il vaut mieux ne pas l'ouvrir.",
    cond: (s) => s.derive >= 5 && s.power.armee > 45 && !s.europe.dossiers.some((d) => d.id === "operation"),
    opportunite: true,
    rarete: "historique",
    signal: "Un colonel du service Action a demandé une audience par un canal qui n'existe pas officiellement.",
    pourquoi: "On ne vous propose ça que quand on est sûr que vous direz peut-être oui.",
    icone: "☠",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("operation", "L'opération conduite à l'étranger sans mandat", 85);
      c.derive(2);
      c.adj({ country: { securite: 10 }, power: { armee: 8 }, hidden: { paranoia: 18 }, player: { integrite: -14, cynisme: 12 } });
      c.rel("soubeyran", { loyaute: 12 });
      c.nation("royaumeuni", { savoir: 30 });
      c.toutesNations({ savoir: 8 }, ["royaumeuni"]);
      c.sched("operation_suite", 2, 5, 0.8);
      c.log("Vous avez autorisé une opération clandestine hors du territoire.");
      return "La chemise contient quatre pages et une photographie. Soubeyran ne dit pas le mot, il dit « neutralisation d'une capacité de nuisance », et il attend. Vous signez en bas à droite. Onze jours plus tard, un fait divers à l'étranger occupe deux colonnes puis disparaît. Vous êtes désormais quelqu'un que trois personnes peuvent détruire d'une phrase.";
    },
  },

  // --- Les occasions qu'une crise laisse derrière elle ----------------------
  // Aucune jauge ne les ouvre : il faut avoir traversé quelque chose. Une crise
  // ne fait pas que coûter des points — elle déverrouille, pendant quelques
  // semestres, des décisions que personne n'aurait acceptées avant.
  {
    id: "sortir_exception",
    nom: "Sortir de l'exception",
    cout: 2,
    detail: "L'état d'urgence dure depuis trop longtemps. Y mettre fin coûte plus que l'avoir décrété.",
    declencheur: ["etat_urgence"],
    cond: (s) => !!s.flags["etat_urgence"],
    opportunite: true,
    rarete: "exceptionnelle",
    pourquoi: "Le régime d'exception que vous avez signé est toujours en vigueur. Chaque prolongation le rend un peu plus normal — et un peu plus difficile à lever.",
    icone: "⎋",
    tone: "var(--color-env)",
    effects: (c) => {
      const risque = c.rng.chance(0.3);
      c.flag("etat_urgence", false);
      // Rendre le droit commun est la seule action du jeu qui fasse reculer la
      // dérive : on ne se défait d'un pouvoir qu'en le rendant.
      c.derive(-1);
      c.adj({ country: { cohesion: 6, securite: -6 }, power: { justice: 12, presse: 9, popularite: -4 } });
      c.seg("urbains", { soutien: 7 });
      c.seg("quartiers", { soutien: 6 });
      c.seg("pavillonnaires", { soutien: -5 });
      c.rel("alberti", { loyaute: 12 });
      c.rel("mazeau", { rancune: 10 });
      c.dire(
        "etat_exception",
        "Un régime d'exception qui dure n'est plus une exception : c'est un régime",
        "en annonçant la fin de l'état d'urgence"
      );
      c.log("Vous avez mis fin à l'état d'urgence.");
      if (risque) c.sched("attentat_alerte", 2, 6, 0.5);
      return "Le décret d'abrogation tient en une page et il vous a coûté quatre réunions à l'Intérieur, dont une où l'on vous a expliqué, chiffres à l'appui, que vous porteriez seul la responsabilité du prochain drame. C'est exact. Vous signez quand même, parce que l'autre option — laisser courir, prolonger de six mois en six mois jusqu'à ce que plus personne ne compte — est la manière dont les démocraties changent de nature sans qu'aucune date ne puisse être citée.";
    },
  },
  {
    id: "commission_verite",
    nom: "Ouvrir la commission qu'on a refusée",
    cout: 2,
    detail: "Rendre publics les documents qui vous accablent. Personne ne vous le demande plus.",
    declencheur: ["vigor_esquive", "vigor_abandon", "rapport_etouffe", "secret_defense_attentat", "dossier_etouffe"],
    opportunite: true,
    rarete: "exceptionnelle",
    pourquoi: "Il y a un dossier que vous avez refermé et que le pays a fini par cesser de réclamer. C'est précisément pour ça que le rouvrir vaudrait quelque chose.",
    icone: "▤",
    tone: "var(--color-social)",
    effects: (c) => {
      const dur = c.s.player.integrite + c.rng.int(-10, 25) > 55;
      c.adj({ power: { presse: 12, justice: 14, popularite: dur ? 3 : -8 }, player: { integrite: 9 } });
      c.rel("ferrand", { loyaute: 16, rancune: -14 });
      c.rel("alberti", { loyaute: 8 });
      c.gagnerFaveur(2);
      c.flag("commission_verite");
      c.log("Vous avez rouvert vous-même le dossier que vous aviez enterré.");
      return dur
        ? "Vous convoquez la commission d'enquête que vous aviez évitée, avec un mandat plus large que celui qu'on vous demandait, et vous levez le secret sur les pièces qui vous mettent en cause. Six mois de travaux, quatre cents auditions, un rapport qui vous égratigne sans vous abattre. Louise Ferrand écrit que « c'est la première fois qu'un pouvoir organise lui-même son procès ». Elle le pense, et c'est ce qui rend la phrase dangereuse : vous ne pourrez plus jamais refermer quoi que ce soit."
        : "Vous ouvrez, et ce qui sort est pire que ce dont vous vous souveniez. Deux notes que vous aviez oubliées avoir lues, une date qui ne colle pas avec votre version publique. Le rapport conclut à une « responsabilité politique pleine et entière ». Vous encaissez debout, ce qui est déjà quelque chose. Le pays retiendra surtout que c'est vous qui aviez ouvert la porte — et cela, personne ne pourra le retourner contre vous.";
    },
  },
  {
    id: "table_ronds_points",
    nom: "Écrire la loi avec eux",
    cout: 2,
    detail: "Le mouvement a une figure. Lui donner un stylo plutôt qu'un adversaire.",
    declencheur: ["figure_rp", "grand_debat", "cottin_rencontree", "rp_survenu"],
    opportunite: true,
    rarete: "exceptionnelle",
    pourquoi: "La colère a produit des porte-parole. Tant qu'ils n'ont pas de parti, on peut encore leur proposer une table ; après, ce sera une élection.",
    icone: "◎",
    tone: "var(--color-social)",
    effects: (c) => {
      const tenu = c.s.player.charisme + c.rng.int(-18, 22) > 52;
      if (tenu) {
        c.adj({ country: { cohesion: 8, marge: -6 }, power: { popularite: 8, parti: -8 }, hidden: { agitation: -18 } });
        c.seg("periurbain", { soutien: 9, participation: 5 });
        c.seg("ruraux", { soutien: 6 });
        c.flag("loi_ecrite_ensemble");
        c.log("Une loi a été co-écrite avec les porte-parole du mouvement social.");
        return "Neuf mois, une convention de trente-cinq membres tirés du mouvement et des corps intermédiaires, et un texte que le Parlement vote sans le défigurer — parce que le défigurer aurait été trop visible. Maryse Cottin signe l'exposé des motifs. Elle ne fondera pas son parti : elle vient d'obtenir mieux, et elle le sait. Votre propre majorité, elle, ne vous pardonnera jamais d'avoir fait écrire la loi par des gens qui n'ont été élus par personne.";
      }
      c.adj({ country: { cohesion: -3 }, power: { popularite: -5 }, hidden: { agitation: 6 } });
      c.flag("figure_rp");
      return "La convention se réunit trois fois et explose à la quatrième : deux courants, une accusation de récupération, un départ devant les caméras. Vous avez donné une tribune nationale à des gens qui n'en avaient qu'une locale, et rien en échange. Maryse Cottin sort du bâtiment en disant qu'elle a « vu comment ça marche de l'intérieur ». C'est la phrase d'une candidate.";
    },
  },
  {
    id: "desarmer_general",
    nom: "Envoyer le général au feu",
    cout: 2,
    detail: "Il vous conteste en uniforme. Lui donner un poste dont on ne revient pas grandi.",
    declencheur: ["verdier_opposant", "verdier_plie", "verdier_ministre", "regicide"],
    cond: (s) => !!s.characters["verdier"]?.vivant,
    opportunite: true,
    rarete: "exceptionnelle",
    pourquoi: "Un militaire populaire vous conteste sur le terrain politique. Tant qu'il est encore sous vos ordres, vous avez un coup d'avance ; après sa démission, plus aucun.",
    icone: "★",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      const propre = c.s.player.strategie + c.rng.int(-20, 20) > 58;
      if (propre) {
        c.adj({ hidden: { coup: -18, paranoia: 6 }, power: { armee: -5, popularite: 3 } });
        c.rel("verdier", { ambition: -20, loyaute: -6, rancune: 8 });
        c.log("Le général Verdier a été nommé à un commandement dont personne ne revient célèbre.");
        return "Commandement interalliés, quartier général à l'étranger, quatre étoiles et zéro caméra française. Le refuser, c'était avouer que ses ambitions n'étaient pas militaires ; l'accepter, c'est disparaître dix-huit mois des écrans. Le général Verdier accepte, salue, et vous regarde une seconde de trop. Vous avez gagné le tour. Vous n'avez pas gagné la partie — ce genre d'homme revient toujours, et il revient avec une rancune bien rangée.";
      }
      c.adj({ hidden: { coup: 10, paranoia: 12 }, power: { armee: -14, presse: -5 } });
      c.rel("verdier", { rancune: 22, loyaute: -18 });
      c.flag("verdier_opposant");
      c.log("Le général Verdier a démissionné plutôt que d'accepter sa nomination.");
      return "Il refuse en trois lignes, démissionne le lendemain, et donne son premier entretien de civil quarante-huit heures plus tard : « On ne m'a pas nommé, on m'a écarté. » La manœuvre était lisible et il l'a lue avant vous. L'état-major, qui déteste pourtant qu'on fasse de la politique en uniforme, déteste encore davantage qu'on traite un des siens comme un gêneur. Vous venez de lui offrir une carrière que vous ne pourrez plus interrompre.";
    },
  },
  {
    id: "refonder_filiere",
    nom: "Refonder la filière",
    cout: 3,
    detail: "L'accident a tout arrêté. Décider maintenant de quoi le pays vivra dans trente ans.",
    declencheur: ["vigor_fermee", "vigor_travaux", "vigor_indemnise", "vigor_revue"],
    opportunite: true,
    rarete: "historique",
    pourquoi: "L'accident a suspendu toute la politique énergétique du pays. Pendant quelques mois, tout est rediscutable — ensuite, les habitudes reprendront.",
    icone: "⬡",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({
        country: { environnement: 10, marge: -14, dette: 6, croissance: -0.4, prestige: 6 },
        power: { patronat: -6, presse: 7, popularite: 2 },
        hidden: { fatigue: 12 },
      });
      c.seg("urbains", { soutien: 7 });
      c.seg("periurbain", { soutien: 4 });
      c.seg("public", { soutien: 5 });
      c.flag("filiere_refondee");
      c.dire(
        "energie_nation",
        "L'énergie n'est pas un marché qu'on arbitre chaque trimestre : c'est une décision qu'on prend pour trente ans",
        "en présentant la loi de programmation énergétique"
      );
      c.sched("chantier_dividende", 4, 9, 0.6);
      c.log("Une loi de programmation énergétique a refondé la filière après l'accident.");
      return "Loi de programmation sur trente ans, autorité de sûreté détachée de l'exploitant et dotée d'un pouvoir d'arrêt, financement sanctuarisé hors budget annuel. C'est le genre de texte qu'aucun pouvoir ne fait passer en temps normal, parce qu'il coûte tout de suite et rapporte après votre départ. Il ne passe aujourd'hui que parce qu'un réacteur a fondu et que personne n'ose être celui qui dira non. Vous utilisez un désastre : c'est ce qu'on attend d'un chef d'État, et c'est aussi ce qui laisse un goût étrange le soir venu.";
    },
  },

  // --- Les occasions que seule la folie ouvre -------------------------------
  // Aucune conjonction de jauges ne les fait apparaître : il a fallu qu'un des
  // accidents de `folie.ts` survienne, et qu'on ait choisi d'y entrer. Ce sont
  // les seules portes du jeu qu'on ne peut pas viser — seulement saisir.
  {
    id: "employer_sosie",
    nom: "Faire travailler l'autre",
    cout: 1,
    detail: "Il inaugure mieux que vous. Autant que ce soit officiel.",
    declencheur: "sosie_rencontre",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Un homme fait le métier à votre place dans quatre départements, et il le fait bien.",
    icone: "☍",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.derive(1);
      c.adj({ power: { popularite: 9 }, hidden: { fatigue: -22, paranoia: 10 }, player: { integrite: -8 } });
      c.seg("ruraux", { soutien: 8 });
      c.seg("periurbain", { soutien: 6 });
      c.dossier("sosie_employe", "L'homme payé pour être le Président en province", 46);
      c.sched("sosie_revelation", 4, 12, 0.45);
      c.log("Vous avez employé votre sosie pour tenir une partie de vos déplacements.");
      return "Contrat de prestation avec une société écran, quarante-deux déplacements en dix-huit mois, et un agenda présidentiel enfin tenable. Marcel serre les mains mieux que vous, écoute plus longtemps, et personne ne s'aperçoit jamais de rien. Les remontées de terrain sont excellentes. Vous dormez pour la première fois depuis l'investiture, et vous savez très exactement ce que vous venez de faire à la fonction.";
    },
  },
  {
    id: "publier_manuscrit",
    nom: "Publier le livre",
    cout: 2,
    detail: "Quatre cent dix pages écrites la nuit. Roze vous a dit de ne pas.",
    declencheur: "manuscrit_nocturne",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Vous avez écrit quelque chose que personne n'attendait, et il dort dans un tiroir.",
    icone: "✎",
    tone: "var(--color-perso)",
    effects: (c) => {
      const chef = c.s.player.rhetorique + c.s.player.integrite / 2 + c.rng.int(-20, 25) > 78;
      c.dire("le_livre", "J'ai écrit ce que je pense, en entier, et je n'en retire rien", "à la parution");
      if (chef) {
        c.adj({ country: { prestige: 10, cohesion: 4 }, power: { presse: 12, popularite: 6 }, player: { integrite: 6 } });
        c.seg("urbains", { soutien: 8 });
        c.seg("jeunes", { soutien: 5 });
        c.log("Vous avez publié un livre qui a changé la façon dont le pays vous lit.");
        return "Deux cent mille exemplaires en trois semaines, traduit en onze langues avant Noël, et des passages appris par cœur par des gens qui n'ont pas voté pour vous. Ce n'est pas un livre de président : c'est un livre, et il se trouve qu'un président l'a écrit. Vos adversaires y cherchent des contradictions pendant six mois et finissent par en citer des phrases sans le dire.";
      }
      c.adj({ country: { prestige: -4 }, power: { presse: -10, popularite: -9, parti: -8 }, hidden: { paranoia: 8 } });
      c.seg("pavillonnaires", { soutien: -6 });
      c.press("« LES CENT DERNIÈRES PAGES » — les extraits les plus sombres publiés en fac-similé", "hostile");
      c.log("Votre livre a été retourné contre vous, page après page.");
      return "Les cent premières pages sont admirables et personne n'en parlera. Les cent dernières — celles que Camille Roze vous avait dit de brûler — sont épluchées ligne à ligne pendant trois semaines. Vous y écrivez ce que vous pensez vraiment du pays certains soirs de fatigue. On ne pardonne pas ça à un président, même quand c'est vrai. Surtout quand c'est vrai.";
    },
  },
  {
    id: "conseil_des_ombres",
    nom: "Gouverner avec les morts",
    cout: 2,
    detail: "La voix ne s'est pas trompée jusqu'ici. Lui laisser une chaise.",
    declencheur: "voix_gardees",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Vous entendez quelque chose depuis des mois, et ce quelque chose a raison.",
    icone: "☾",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.derive(3);
      c.adj({ hidden: { paranoia: 26, fatigue: -8 }, power: { popularite: 5 }, player: { strategie: 8, cynisme: 6 } });
      c.rel("roze", { loyaute: -12, rancune: 8 });
      c.rel("rochefort", { loyaute: -8 });
      c.flag("conseil_ombres");
      c.sched("ombres_suite", 3, 8, 0.6);
      c.log("Vous avez commencé à prendre vos décisions ailleurs qu'en conseil.");
      return "Vous décalez les arbitrages d'une heure, seul, dans la salle des cartes, où la voix vient plus facilement. Vos décisions de ce semestre sont les meilleures du mandat — tous vos conseillers le disent, aucun ne sait comment elles ont été prises. Camille Roze demande deux fois à assister à « ces réunions du soir ». Vous répondez deux fois que ce n'est pas une réunion, ce qui est parfaitement exact.";
    },
  },
  {
    id: "revelation_ciel",
    nom: "Tout déclassifier",
    cout: 2,
    detail: "Onze dossiers depuis 1954. Les rendre publics le même jour.",
    declencheur: "objet_ciel",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Vous savez ce que l'armée sait, et vous êtes seul à pouvoir en décider.",
    icone: "✦",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({
        country: { prestige: 8, cohesion: -6, influence: 6 },
        power: { armee: -12, presse: 10, popularite: 8 },
        hidden: { agitation: 8, paranoia: 6 },
      });
      c.rel("verdier", { rancune: 18, loyaute: -14 });
      c.seg("jeunes", { soutien: 10, participation: 6 });
      c.toutesNations({ savoir: 6, relation: -4 }, []);
      c.press("« LA FRANCE OUVRE SES ARCHIVES » — la conférence de presse la plus regardée de l'histoire de la Ve", "favorable");
      c.log("Vous avez déclassifié soixante-dix ans d'archives sur les phénomènes non identifiés.");
      return "Quatre mille pages en ligne à 14 h, sans tri, sans résumé, sans commentaire officiel. Aucune petite créature verte : onze cas honnêtement documentés, quatre survols de sites nucléaires, et l'aveu écrit qu'on n'a jamais su. Le monde entier lit du français pendant une semaine. L'état-major ne vous le pardonnera pas, trois alliés demandent des explications, et la jeunesse d'un pays entier découvre qu'un État peut dire « nous ne savons pas » sans s'effondrer.";
    },
  },
  {
    id: "mascotte_nationale",
    nom: "La tournée du chat",
    cout: 1,
    detail: "81 % d'opinions favorables. Ne pas s'en servir serait une faute.",
    declencheur: "chat_etat",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Le chat de l'Élysée est la seule chose du pays sur laquelle tout le monde est d'accord.",
    icone: "❦",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ power: { popularite: 11, presse: -6 }, country: { cohesion: 5 }, hidden: { agitation: -6 } });
      c.seg("jeunes", { soutien: 9, participation: 5 });
      c.seg("retraites", { soutien: 5 });
      c.seg("urbains", { soutien: -3 });
      c.rel("ferrand", { rancune: 10 });
      c.log("Le chat de l'Élysée est devenu le premier ambassadeur de la République.");
      return "Trente-deux écoles, quatre hôpitaux, une visite d'État où il figure au programme officiel entre le dépôt de gerbe et le déjeuner. Les images sont irrésistibles et parfaitement dépolitisées, ce qui est exactement leur fonction. Louise Ferrand ouvre son édito par « Nous avons un problème » et l'illustre avec la meilleure photo de la série. Le pays va mal et se sent bien : personne n'avait réussi ça depuis longtemps.";
    },
  },
  {
    id: "bureau_prospective",
    nom: "Le bureau du 7e étage",
    cout: 2,
    detail: "Sa méthode est vérifiable. La confier à l'État.",
    declencheur: "prophete_recu",
    opportunite: true,
    rarete: "historique",
    pourquoi: "Un homme prévoit ce que vos administrations n'ont jamais su prévoir.",
    icone: "◈",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.adj({ player: { strategie: 10 }, country: { marge: -2 }, power: { presse: -4 }, hidden: { paranoia: 8 } });
      c.flag("bureau_prospective");
      c.rel("ternay", { rancune: 10, loyaute: -6 });
      c.sched("prospective_premier_rapport", 3, 7, 0.7);
      c.log("Vous avez confié une cellule de prospective à un inconnu qui avait eu raison deux fois.");
      return "Quatre personnes, un budget minuscule, aucun statut, et un bureau sans plaque au septième étage d'un immeuble de la rue de Varenne. Ils croisent des rapports publics que personne ne lit et rendent une note de six pages par mois. La première annonce une faillite industrielle que Bercy jugeait impossible ; elle survient onze semaines plus tard. Yves Ternay, dont c'était le métier depuis trente ans, demande poliment à qui ces gens rendent compte. Vous n'avez pas de réponse.";
    },
  },
];

