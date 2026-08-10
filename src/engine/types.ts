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
  nom: string;
  role: string;
  camp: "gouvernement" | "parti" | "opposition" | "presse" | "corps" | "institutions" | "intime" | "etranger";
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

export interface PromiseDef {
  id: string;
  label: string;
  tenir: string; // ce que ça coûte de la tenir
  trahir: string; // qui ça fâche de la trahir
  miroir?: string; // id de la promesse incompatible
  segments: string[]; // segments séduits
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
  /** Retourne le texte de résolution affiché au joueur. */
  effects: (ctx: Ctx) => string;
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
  turn: number; // trimestre du mandat en cours (1-20)
  mandat: number; // 1 ou 2
  year: number;
  trimestre: number; // 1-4 pour l'affichage
  bio: Bio;
  player: PlayerStats;
  country: CountryStats;
  power: PowerStats;
  hidden: HiddenStats;
  derive: number; // 0-12 : la Tentation
  pc: number; // capital politique du tour
  pcMax: number;
  characters: Record<string, CharacterState>;
  segments: Record<string, SegmentState>;
  promises: PromiseState[];
  flags: Record<string, number | string | boolean>;
  delayed: DelayedTrigger[];
  fired: string[]; // événements « once » déjà joués
  queue: string[]; // événements du tour en attente
  currentEvent: string | null;
  resolution: string | null; // texte de résolution du dernier choix
  lastDeltas: import("./deltas").Delta[];
  lastSignals: string[];
  /** Variation de chaque indicateur sur le trimestre écoulé (flèches de tendance). */
  trends: Record<string, number>;
  trendBase: Record<string, number>;
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
