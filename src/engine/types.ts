import type { Rng } from "./rng";

// ---------------------------------------------------------------------------
// Les quatre couches de jauges. La quatrième (hidden) n'est JAMAIS affichée :
// le joueur ne la perçoit que par des symptômes dans le briefing.
// ---------------------------------------------------------------------------

export interface PlayerStats {
  charisme: number;
  rhetorique: number;
  strategie: number;
  integrite: number;
  cynisme: number;
  endurance: number;
  reseau: number;
}

export interface CountryStats {
  croissance: number; // % annuel
  chomage: number; // %
  inflation: number; // %
  dette: number; // % PIB
  marge: number; // marge budgétaire 0-100
  services: number; // services publics 0-100
  securite: number; // 0-100
  environnement: number; // 0-100
  cohesion: number; // cohésion sociale 0-100
  prestige: number; // prestige international 0-100
  /** Le poids réel de la France dans les décisions européennes 0-100. */
  influence: number;
}

export interface PowerStats {
  popularite: number; // 0-100
  sieges: number; // sur 577
  parti: number; // loyauté du parti 0-100
  presse: number; // bienveillance de la presse 0-100
  armee: number; // 0-100
  patronat: number; // 0-100
  syndicats: number; // 0-100
  justice: number; // indépendance perçue comme hostile/neutre 0-100 = sérénité judiciaire
}

export interface HiddenStats {
  fatigue: number; // 0-100
  sante: number; // 100 = parfaite
  paranoia: number; // 0-100
  coup: number; // risque de coup d'État 0-100
  assassinat: number; // 0-100
  agitation: number; // agitation sociale RÉELLE 0-100 (les rapports mentent)
  /** Ce que les enquêteurs, les services étrangers et Bruxelles ont sur vous. */
  soupcons: number; // 0-100
}

// ---------------------------------------------------------------------------
// Personnages
// ---------------------------------------------------------------------------

export interface CharacterDef {
  id: string;
  /**
   * Le nom de référence, celui qu'emploient les textes du contenu. Il sert de
   * gabarit : chaque partie le remplace par un nom tiré au sort, et la
   * substitution se fait à l'affichage.
   */
  nom: string;
  role: string;
  camp: "gouvernement" | "parti" | "opposition" | "presse" | "corps" | "institutions" | "intime" | "etranger";
  /**
   * Le genre ne change jamais : les rôles et les accords sont écrits en dur
   * dans le contenu (« la Première ministre », « elle s'est inclinée »).
   */
  genre: "f" | "m";
  /** Le vivier de noms dans lequel on tire — tout le monde n'est pas d'ici. */
  registre?: "france" | "allemagne" | "maghreb" | "italie" | "hongrie" | "nordique" | "balkans" | "benelux";
  /** Titre accolé au nom dans les textes (« général », « Dr », « chancelier »). */
  titre?: string;
  /** Formes supplémentaires employées dans les textes (prénom seul, surnom). */
  alias?: string[];
  biais?: string; // description du biais d'information
  loyaute: number;
  ambition: number;
  rancune: number;
}

export interface CharacterState {
  id: string;
  loyaute: number;
  ambition: number;
  rancune: number;
  vivant: boolean;
  enPoste: boolean;
}

// ---------------------------------------------------------------------------
// Électorat
// ---------------------------------------------------------------------------

export interface SegmentDef {
  id: string;
  nom: string;
  poids: number; // somme = 100
  soutien: number; // 0-100 au départ
  participation: number; // 0-100 au départ
  description: string;
}

export interface SegmentState {
  id: string;
  soutien: number;
  participation: number;
}

// ---------------------------------------------------------------------------
// Promesses
// ---------------------------------------------------------------------------

export type PromiseStatus = "en_cours" | "tenue" | "trahie" | "partielle";

/** Le rayon du programme — sert à garantir un éventail varié au tirage. */
export type PromiseTheme =
  | "budget"
  | "social"
  | "securite"
  | "environnement"
  | "institutions"
  | "societe"
  | "monde"
  | "insolite";

export interface PromiseDef {
  id: string;
  label: string;
  tenir: string; // ce que ça coûte de la tenir
  trahir: string; // qui ça fâche de la trahir
  miroir?: string; // id de la promesse incompatible
  segments: string[]; // segments séduits
  theme: PromiseTheme;
  /** Plus c'est rare, moins ça sort — et plus c'est mémorable. */
  rarete?: Rarete;
  /** Déplacement de la ligne politique qu'implique l'inscrire au programme. */
  bord?: number;
}

export interface PromiseState {
  id: string;
  status: PromiseStatus;
}

// ---------------------------------------------------------------------------
// Le registre des paroles. Un président parle beaucoup ; le pays retient peu
// de choses, mais il les retient longtemps. Chaque déclaration publique est
// consignée avec sa formulation exacte, pour pouvoir être citée telle quelle
// le jour où l'on fait le contraire.
// ---------------------------------------------------------------------------

export interface Propos {
  id: string;
  /** Le sujet — c'est lui qui détecte la contradiction, pas l'identifiant. */
  sujet: string;
  /** La phrase, citable entre guillemets. */
  citation: string;
  /** Où et quand elle a été prononcée. */
  contexte: string;
  turn: number;
  /** Devient faux le jour où l'on fait l'inverse. */
  tenu: boolean;
  /** Semestre du reniement, s'il a eu lieu. */
  reniéAu?: number;
}

// ---------------------------------------------------------------------------
// La vendetta. Une rancune qu'on laisse mûrir ne reste pas un chiffre : elle
// se met en marche, recrute, prépare, puis frappe — et chaque étape peut être
// interceptée par qui la voit venir.
// ---------------------------------------------------------------------------

export type VendettaEtape = 1 | 2 | 3 | 4;

export interface Vendetta {
  /** Le personnage qui vous en veut. */
  id: string;
  etape: VendettaEtape;
  /** Semestre de la dernière progression — sert à cadencer la montée. */
  depuis: number;
  /** Le joueur a-t-il vu passer au moins un signe ? */
  reperee: boolean;
  /** Étouffée, achetée ou réconciliée : le fil est clos sans dénouement. */
  desamorcee?: boolean;
}

// ---------------------------------------------------------------------------
// Événements et choix. Les effets mutent l'état via un contexte d'aide (Ctx).
// Toute décision significative doit armer une conséquence différée (sched).
// ---------------------------------------------------------------------------

export interface Ctx {
  s: GameState;
  rng: Rng;
  /** Ajuste des jauges (clamp automatique). */
  adj: (d: {
    player?: Partial<PlayerStats>;
    country?: Partial<CountryStats>;
    power?: Partial<PowerStats>;
    hidden?: Partial<HiddenStats>;
  }) => void;
  /** Arme un événement différé : fenêtre en tours relatifs, proba par tour. */
  sched: (eventId: string, minIn: number, maxIn: number, chance?: number) => void;
  /** Modifie la relation d'un personnage. */
  rel: (id: string, d: { loyaute?: number; ambition?: number; rancune?: number }) => void;
  /** Pose un drapeau persistant (la mémoire du jeu). */
  flag: (key: string, value?: number | string | boolean) => void;
  /** Lit un drapeau. */
  getFlag: (key: string) => number | string | boolean | undefined;
  /** Ajoute un titre de presse pour la résolution du tour. */
  press: (text: string, tone?: PressTone) => void;
  /** Journal de bord (mémoire longue, ressort dans la notice finale). */
  log: (text: string) => void;
  /** Change le statut d'une promesse si elle a été prise. */
  promesse: (id: string, status: PromiseStatus) => void;
  /** Ajuste un segment d'électorat. */
  seg: (id: string, d: { soutien?: number; participation?: number }) => void;
  /** Monte la dérive autoritaire (ou la descend — c'est rare et cher). */
  derive: (n: number) => void;
  /** Déplace la ligne politique : négatif vers la gauche, positif vers la droite. */
  bord: (n: number) => void;
  /** Déclenche une crise (bascule en mode jour par jour). */
  crise: (id: string) => void;
  /** Empile un événement à jouer immédiatement après celui-ci. */
  chain: (eventId: string) => void;
  /**
   * Consigne une parole publique. Elle pourra être citée mot pour mot le jour
   * où l'on fera le contraire — c'est la mémoire longue du pays.
   */
  dire: (sujet: string, citation: string, contexte?: string) => void;
  /** Cette parole a-t-elle été tenue jusqu'ici ? */
  aDit: (sujet: string) => Propos | undefined;
  /**
   * On vient de faire l'inverse de ce qu'on avait dit. Applique le coût, arme
   * la confrontation et retourne la citation à ressortir dans le texte.
   */
  contredire: (sujet: string) => string | null;
  /** Modifie ce qu'une capitale pense de vous, et ce qu'elle vous doit. */
  nation: (id: string, d: { relation?: number; faveurs?: number; savoir?: number; bord?: number }) => void;
  /** Même chose pour tout le monde d'un coup — c'est le propre d'un éclat. */
  toutesNations: (d: { relation?: number; savoir?: number }, sauf?: string[]) => void;
  /**
   * Ouvre un dossier : quelque chose a été fait qui ne devrait pas l'être. Il
   * vivra sa vie, alimentera les soupçons et finira par trouver quelqu'un.
   */
  dossier: (id: string, titre: string, gravite: number) => void;
  /** Ce dossier existe-t-il déjà ? */
  aDossier: (id: string) => Dossier | undefined;
  /**
   * Dépense un renvoi d'ascenseur : un journaliste acquis enterre le sujet.
   * Rend la phrase à insérer dans le récit, ou null si personne ne vous doit
   * rien — une faveur ne se garantit jamais, le contenu doit prévoir le vide.
   */
  faveurPresse: (motif: string) => string | null;
  /** Un service rendu à une rédaction se stocke : il servira un jour. */
  gagnerFaveur: (n?: number) => void;
}

export type PressTone = "hostile" | "neutre" | "favorable" | "servile" | "satirique";

export interface Choice {
  id: string;
  label: string;
  detail?: string;
  cond?: (s: GameState) => boolean;
  /**
   * Déclare un choix comme exposé : plus le risque est élevé, plus le moment
   * de vérité est probable et sa fenêtre étroite. Sans valeur, le moteur le
   * déduit de la nature de l'événement.
   */
  risque?: 1 | 2 | 3;
  /** L'aptitude mise à l'épreuve, si ce n'est pas celle par défaut. */
  aptitude?: keyof PlayerStats;
  /** Retourne le texte de résolution affiché au joueur. */
  effects: (ctx: Ctx) => string;
}

// ---------------------------------------------------------------------------
// Les moments de vérité : un mini-jeu de tempo greffé sur une décision.
// ---------------------------------------------------------------------------

export type CheckRang = "critique" | "reussite" | "echec" | "desastre";

export type CheckCible =
  | { kind: "choix"; choiceId: string }
  | { kind: "action"; actionId: string; param?: string; cout: number }
  | { kind: "campagne"; actionId: string; segmentId?: string }
  | { kind: "debat"; beats: string[] };

export interface CheckPlan {
  /** Ce qu'on reprendra une fois le mini-jeu terminé. */
  cible: CheckCible;
  titre: string;
  consigne: string;
  aptitude: keyof PlayerStats;
  aptitudeLabel: string;
  difficulte: 1 | 2 | 3;
  difficulteLabel: string;
  /** Largeur de la fenêtre de réussite, en % de la barre. */
  zone: number;
  /** Largeur de la fenêtre critique, centrée dans la précédente. */
  zoneCrit: number;
  /** Position du bord gauche de la fenêtre, en % de la barre. */
  depart: number;
  /** Durée d'un aller simple du curseur, en millisecondes. */
  vitesse: number;
  /** Nombre d'allers avant que le silence ne devienne une réponse. */
  passes: number;
}

export interface CheckResult {
  rang: CheckRang;
  titre: string;
}

export type EventKind = "standard" | "intrigue" | "crise" | "monde" | "perso" | "ascension" | "campagne";

// ---------------------------------------------------------------------------
// L'Europe : un second plateau, avec ses alliances et ses arrière-cuisines.
// ---------------------------------------------------------------------------

/** Ce qui fait qu'une capitale vous suit ou vous bloque, au-delà des sondages. */
export type NationTrait =
  | "frugale" // compte les euros des autres
  | "atlantiste" // regarde d'abord vers l'ouest
  | "souverainiste" // n'aime pas qu'on décide pour elle
  | "federaliste" // veut plus d'Europe, tout de suite
  | "industrielle" // défend ses usines avant ses principes
  | "opaque"; // là où l'argent transite sans qu'on le suive

export interface NationDef {
  id: string;
  nom: string;
  /** « le chancelier allemand », « la présidente du Conseil italien ». */
  dirigeant: string;
  /** Le personnage du casting qui l'incarne, quand elle en a un. */
  dirigeantId?: string;
  capitale: string;
  /** Poids au Conseil : ce que vaut son oui, et ce que coûte son non. */
  poids: number;
  /** Sa ligne politique de départ, sur la même échelle que la vôtre. */
  bord: number;
  traits: NationTrait[];
  /** L'institution n'est pas un pays : elle ne vote pas, elle contrôle. */
  institution?: boolean;
  /** Hors de l'Union : n'entre pas dans les majorités, mais joue quand même. */
  horsUnion?: boolean;
}

export interface NationState {
  id: string;
  /** −100 hostile, +100 alliée. */
  relation: number;
  /** Leur ligne du moment. Leurs électeurs la font bouger sans vous demander. */
  bord: number;
  /** Les faveurs : positif, elles vous en doivent ; négatif, vous leur devez. */
  faveurs: number;
  /** Ce qu'elles savent de vos arrière-cuisines. */
  savoir: number;
}

/** Ce qu'on a fait et qui ne s'efface pas — seulement s'enterre, un temps. */
export interface Dossier {
  id: string;
  /** Le titre que la presse lui donnera le jour où il sortira. */
  titre: string;
  turn: number;
  /** Ce qu'il coûte s'il éclate au grand jour. */
  gravite: number;
  /** Enterré à prix d'or. Un dossier enterré n'est jamais détruit. */
  etouffe?: boolean;
  /** Déjà sorti : on ne peut plus l'enterrer, seulement le porter. */
  public?: boolean;
}

/**
 * L'enquête européenne : le pendant institutionnel de la vendetta. Elle ne naît
 * pas d'une rancune mais d'une trace, et elle avance toute seule.
 */
export interface Enquete {
  /** 1 signalement, 2 saisine, 3 perquisition, 4 réquisitions. */
  etape: 1 | 2 | 3 | 4;
  depuis: number;
  /** Le dossier sur lequel elle mord. */
  dossier: string;
  /** Étouffée — la procureure a été dessaisie, ou pire. */
  enterree?: boolean;
}

export interface EuropeState {
  nations: Record<string, NationState>;
  dossiers: Dossier[];
  enquete: Enquete | null;
  /** Semestre de la prochaine élection à l'étranger. */
  prochaineElection: number;
}

/** La rareté d'un événement — affichée au joueur, pour le plaisir de la trouvaille. */
export type Rarete = "commune" | "peu_commune" | "rare" | "legendaire";

export interface GameEvent {
  id: string;
  kind: EventKind;
  titre: string;
  rarete?: Rarete;
  /** Personnage qui rapporte — son biais colore le texte. */
  source?: string;
  texte: string | ((s: GameState) => string);
  cond?: (s: GameState) => boolean;
  weight?: number | ((s: GameState) => number);
  once?: boolean;
  choices: Choice[];
  /** Choix construits à la volée — sert aux décisions qui portent sur des personnes. */
  dynamicChoices?: (s: GameState) => Choice[];
}

export interface DelayedTrigger {
  eventId: string;
  minTurn: number;
  maxTurn: number;
  chance: number;
}

// ---------------------------------------------------------------------------
// Presse, journal
// ---------------------------------------------------------------------------

export interface PressItem {
  kind: "une" | "echo" | "symptome" | "monde";
  text: string;
  tone: PressTone;
}

export interface LogEntry {
  turn: number;
  text: string;
}

/** Une ligne du journal des impacts affiché en continu au joueur. */
export interface LedgerEntry {
  turn: number;
  label: string;
  value?: number;
  suffix?: string;
  /** Bon ou mauvais pour le joueur — décide de la couleur. */
  bon: boolean;
  kind: "stat" | "relation" | "promesse" | "signal";
}

// ---------------------------------------------------------------------------
// Biographie (Acte I)
// ---------------------------------------------------------------------------

export interface Bio {
  prenom: string;
  nom: string;
  genre: "f" | "m";
  age: number;
  regionId: string;
  milieuId: string;
  formationId: string;
  evenementId: string;
  mentorId: string;
  /** La conviction fondatrice — c'est elle qui place votre curseur de départ. */
  convictionId: string;
  conjointPrenom: string;
  conjointCarriere: string;
}

// ---------------------------------------------------------------------------
// Campagne (Acte III et réélection)
// ---------------------------------------------------------------------------

export interface CampaignState {
  kind: "presidentielle" | "reelection";
  week: number;
  totalWeeks: number;
  dynamique: number; // -10..+10, jauge « tenue par la presse »
  debatFait: boolean;
  opposantId: string; // personnage adverse
  opposantScore: number; // force de l'adversaire 0-100
  dossierAdversaire: number; // ce que les équipes ont trouvé (0-3)
  round: 1 | 2;
  scoreT1?: { joueur: number; opposant: number; tiers: number };
  lastAction?: string;
  /**
   * La campagne d'en face n'attend pas son tour. Chaque semaine, l'adversaire
   * frappe là où votre bilan est faible : le thème qu'il a choisi, les coups
   * déjà portés, et le dernier en date, affiché au joueur.
   */
  ligneAdverse?: string;
  ripostesJouees?: string[];
  derniereRiposte?: string;
  /**
   * Les quatre possibilités de la semaine. Une campagne où l'on dispose chaque
   * semaine de tout l'éventail n'est pas une campagne : c'est une liste.
   */
  actionPool?: string[];
  /** Semaine où chaque action a été employée — sert au tirage et aux cooldowns. */
  actionsFaites?: Record<string, number>;
  /** Le réservoir des voix qui ne sont à personne. Un ralliement l'entame. */
  tiers?: number;
  /** Après un focus group, vos instituts cessent de vous mentir. */
  sondageFiable?: boolean;
  /** Le parcours tiré pour l'adversaire — il change à chaque partie. */
  portraitAdversaire?: { parcours: string; slogan: string };
}

/**
 * L'état du pays au premier jour d'un mandat. Sert au bilan : sans point de
 * départ, « chômage 9,2 % » ne dit rien de ce qu'on a fait.
 */
export interface MandatBase {
  mandat: number;
  turnCount: number;
  country: CountryStats;
  power: PowerStats;
  segments: Record<string, number>;
  derive: number;
  bord: number;
}

// ---------------------------------------------------------------------------
// Crise (mode jour par jour)
// ---------------------------------------------------------------------------

export interface CrisisState {
  id: string;
  titre: string;
  jour: number;
  queue: string[]; // événements restants
}

// ---------------------------------------------------------------------------
// Fin de partie
// ---------------------------------------------------------------------------

export interface EndingResult {
  id: string;
  nom: string;
  famille: string;
  rarete: "très commune" | "commune" | "peu commune" | "rare" | "exceptionnelle";
  une: string; // la une du lendemain
  epitaphe: string; // sous-titre de la carte de fin
  /** La scène du dernier jour — comment ça s'est terminé, concrètement. */
  epilogue: string[];
  notice: string[]; // paragraphes de la notice biographique
  verdict: {
    axesNationaux: { nom: string; note: number }[]; // /20
    axesPersonnels: { nom: string; note: number }[];
    jugement: string; // le mot des historiens
  };
  comparatif: { critere: string; valeur: string; rang: string }[];
}

// ---------------------------------------------------------------------------
// L'état complet d'une partie
// ---------------------------------------------------------------------------

export type Act = "home" | "creation" | "ascension" | "campagne" | "mandat" | "crise" | "fin";

export type Phase = "briefing" | "evenements" | "actions" | "resolution";

export interface GameState {
  seed: number;
  rngCalls: number;
  act: Act;
  phase: Phase;
  turn: number; // semestre du mandat en cours (1-20)
  mandat: number; // 1 ou 2
  year: number;
  semestre: number; // 1-4 pour l'affichage
  bio: Bio;
  player: PlayerStats;
  country: CountryStats;
  power: PowerStats;
  hidden: HiddenStats;
  derive: number; // 0-12 : la Tentation
  /**
   * La ligne politique, de −10 (gauche révolutionnaire) à +10 (droite
   * identitaire). Visible, assumée, et lourde de conséquences : chaque camp
   * a ses fidèles, ses ennemis, et ses maux propres.
   */
  bord: number;
  pc: number; // capital politique du tour
  pcMax: number;
  characters: Record<string, CharacterState>;
  /** Les noms tirés pour cette partie — le casting change de visage à chaque fois. */
  castNames: Record<string, { prenom: string; nom: string }>;
  segments: Record<string, SegmentState>;
  promises: PromiseState[];
  /** Les mesures que la campagne vous propose — jamais le vivier entier. */
  programmePool: string[];
  /** Tout ce que vous avez dit en public et qu'on peut vous ressortir. */
  propos: Propos[];
  /** La rancune qui s'est mise en marche, s'il y en a une. */
  vendetta: Vendetta | null;
  /** Les renvois d'ascenseur qu'une rédaction acquise vous doit encore. */
  faveursPresse: number;
  /** Le pays tel qu'on vous l'a remis, pour pouvoir dire ce qu'il est devenu. */
  mandatBase: MandatBase | null;
  /** Le second plateau : les capitales, les dossiers, la procureure. */
  europe: EuropeState;
  /** Mini-jeu en attente : la décision est prise mais reste à être tenue. */
  pendingCheck: CheckPlan | null;
  /** Résultat du dernier moment de vérité, affiché avec la résolution. */
  lastCheck: CheckResult | null;
  /** Décisions restantes avant qu'un nouveau moment de vérité soit possible. */
  checkCooldown: number;
  flags: Record<string, number | string | boolean>;
  delayed: DelayedTrigger[];
  fired: string[]; // événements « once » déjà joués
  queue: string[]; // événements du tour en attente
  currentEvent: string | null;
  resolution: string | null; // texte de résolution du dernier choix
  lastDeltas: import("./deltas").Delta[];
  lastSignals: string[];
  /** Variation de chaque indicateur sur le semestre écoulé (flèches de tendance). */
  trends: Record<string, number>;
  trendBase: Record<string, number>;
  /** Dernier tour où chaque événement a été joué — sert au cooldown anti-répétition. */
  lastSeen: Record<string, number>;
  /** Journal chiffré des impacts, alimenté à chaque décision. */
  ledger: LedgerEntry[];
  /** Actions proposées ce tour-ci (tirage) et actions récemment utilisées. */
  actionPool: string[];
  actionCooldown: Record<string, number>;
  /** Semestres restants avant qu'une nouvelle opportunité puisse se présenter. */
  opportuniteCooldown: number;
  /** Personnage mis en avant par un clic dans un texte. */
  focusCharacter: string | null;
  press: PressItem[];
  pressArchive: { turn: number; items: PressItem[] }[];
  log: LogEntry[];
  campaign: CampaignState | null;
  crisis: CrisisState | null;
  ending: EndingResult | null;
  cohabitation: boolean;
  actionsUsed: string[];
  turnCount: number; // tours totaux depuis l'investiture (mandats cumulés)
  gameOver: boolean;
}
