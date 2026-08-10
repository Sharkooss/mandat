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
  registre?: "france" | "allemagne" | "maghreb";
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
