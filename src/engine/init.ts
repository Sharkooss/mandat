import type { Bio, GameState } from "./types";
import {
  CAST,
  SEGMENTS,
  REGIONS,
  MILIEUX,
  FORMATIONS,
  EVENEMENTS_FONDATEURS,
  MENTORS,
  CONVICTIONS,
} from "../content/france/data";
import { makeRng, type Rng } from "./rng";
import { genererNoms } from "./noms";
import { etatInitial } from "./europe";

export function makeInitialState(seed: number): GameState {
  const characters: GameState["characters"] = {};
  for (const c of CAST) {
    characters[c.id] = { id: c.id, loyaute: c.loyaute, ambition: c.ambition, rancune: c.rancune, vivant: true, enPoste: true };
  }
  const segments: GameState["segments"] = {};
  for (const seg of SEGMENTS) {
    segments[seg.id] = { id: seg.id, soutien: seg.soutien, participation: seg.participation };
  }
  // Le casting est rebaptisé avant tout le reste : le premier écran de
  // l'ascension peut déjà citer un ministre par son nom.
  const rng = makeRng(seed);
  const castNames = genererNoms(rng);
  return {
    seed,
    rngCalls: rng.state(),
    act: "creation",
    phase: "briefing",
    turn: 0,
    mandat: 0,
    year: new Date().getFullYear(),
    semestre: 1,
    bio: {
      prenom: "",
      nom: "",
      genre: "m",
      age: 44,
      regionId: "",
      milieuId: "",
      formationId: "",
      evenementId: "",
      mentorId: "",
      convictionId: "",
      conjointPrenom: "",
      conjointCarriere: "avocature",
    },
    player: { charisme: 45, rhetorique: 45, strategie: 45, integrite: 55, cynisme: 30, endurance: 55, reseau: 35 },
    country: { croissance: 0.9, chomage: 7.4, inflation: 1.9, dette: 114, marge: 30, services: 42, securite: 55, environnement: 48, cohesion: 38, prestige: 72, influence: 58 },
    power: { popularite: 50, sieges: 0, parti: 55, presse: 50, armee: 55, patronat: 50, syndicats: 40, justice: 60 },
    hidden: { fatigue: 10, sante: 90, paranoia: 5, coup: 2, assassinat: 3, agitation: 25, soupcons: 0 },
    derive: 0,
    bord: 0,
    pc: 3,
    pcMax: 3,
    characters,
    castNames,
    segments,
    promises: [],
    programmePool: [],
    propos: [],
    vendetta: null,
    faveursPresse: 0,
    mandatBase: null,
    europe: etatInitial(),
    pendingCheck: null,
    lastCheck: null,
    checkCooldown: 1,
    flags: {},
    delayed: [],
    fired: [],
    queue: [],
    currentEvent: null,
    resolution: null,
    lastDeltas: [],
    lastSignals: [],
    trends: {},
    trendBase: {},
    lastSeen: {},
    ledger: [],
    actionPool: [],
    actionCooldown: {},
    opportuniteCooldown: 0,
    focusCharacter: null,
    press: [],
    pressArchive: [],
    log: [],
    campaign: null,
    crisis: null,
    ending: null,
    cohabitation: false,
    actionsUsed: [],
    turnCount: 0,
    gameOver: false,
  };
}

/**
 * Complète une sauvegarde ancienne avec les champs ajoutés depuis.
 * Une partie en cours ne doit jamais casser parce que le jeu a évolué.
 */
export function normalizeState(saved: Partial<GameState> | null | undefined): GameState | null {
  if (!saved || typeof saved !== "object") return null;
  const base = makeInitialState(saved.seed ?? 1);
  const out = { ...base, ...saved } as GameState;

  // Objets imbriqués : on complète clé par clé plutôt que de remplacer.
  out.player = { ...base.player, ...(saved.player ?? {}) };
  out.country = { ...base.country, ...(saved.country ?? {}) };
  out.power = { ...base.power, ...(saved.power ?? {}) };
  out.hidden = { ...base.hidden, ...(saved.hidden ?? {}) };
  out.bio = { ...base.bio, ...(saved.bio ?? {}) };
  out.characters = { ...base.characters, ...(saved.characters ?? {}) };
  // Une partie d'avant le tirage des noms recupère ceux que sa graine aurait
  // produits : les textes déjà archivés portent les noms de référence, et la
  // substitution les rattrape à l'affichage.
  // Les personnages ajoutés depuis récupèrent le nom que la graine leur aurait
  // donné : le tirage est déterministe et le casting ne s'allonge que par la
  // fin, donc les anciens noms sont inchangés.
  out.castNames = { ...base.castNames, ...(saved.castNames ?? {}) };
  out.segments = { ...base.segments, ...(saved.segments ?? {}) };
  out.flags = saved.flags ?? {};
  out.bord = saved.bord ?? 0;

  // Tableaux et registres ajoutés au fil des versions.
  out.promises = saved.promises ?? [];
  out.delayed = saved.delayed ?? [];
  out.fired = saved.fired ?? [];
  out.queue = saved.queue ?? [];
  out.press = saved.press ?? [];
  out.pressArchive = saved.pressArchive ?? [];
  out.log = saved.log ?? [];
  out.actionsUsed = saved.actionsUsed ?? [];
  out.lastDeltas = saved.lastDeltas ?? [];
  out.lastSignals = saved.lastSignals ?? [];
  out.trends = saved.trends ?? {};
  out.trendBase = saved.trendBase ?? {};
  out.lastSeen = saved.lastSeen ?? {};
  out.ledger = saved.ledger ?? [];
  out.actionPool = saved.actionPool ?? [];
  out.actionCooldown = saved.actionCooldown ?? {};
  out.opportuniteCooldown = saved.opportuniteCooldown ?? 0;
  out.focusCharacter = saved.focusCharacter ?? null;

  // Les moments de vérité et le tirage du programme sont arrivés après coup :
  // une partie en cours doit les récupérer sans se bloquer sur un mini-jeu
  // dont elle ne connaît pas la cible.
  out.programmePool = saved.programmePool ?? [];
  out.propos = saved.propos ?? [];
  out.vendetta = saved.vendetta ?? null;

  // Les relations de presse et le bilan de mandat sont arrivés après coup : une
  // partie en cours repart sans faveur en réserve, et sans point de départ —
  // son bilan comparera au pays d'aujourd'hui, faute de mieux.
  out.faveursPresse = saved.faveursPresse ?? 0;
  out.mandatBase = saved.mandatBase ?? null;
  out.pendingCheck = saved.pendingCheck ?? null;
  out.lastCheck = saved.lastCheck ?? null;
  out.checkCooldown = saved.checkCooldown ?? 1;

  // L'Europe est arrivée après coup : une partie en cours récupère un plateau
  // neuf, et les capitales ajoutées plus tard rejoignent celles déjà connues
  // sans effacer les relations gagnées ou perdues.
  const eu = saved.europe;
  out.europe = {
    nations: { ...base.europe.nations, ...(eu?.nations ?? {}) },
    dossiers: eu?.dossiers ?? [],
    enquete: eu?.enquete ?? null,
    prochaineElection: eu?.prochaineElection ?? (saved.turnCount ?? 0) + 2,
  };
  return out;
}

/** Applique les six choix de l'Acte I : stats, relations, et bombes biographiques. */
export function applyBio(s: GameState, bio: Bio): void {
  s.bio = bio;
  const p = s.player;
  const seg = (id: string, d: number) => {
    s.segments[id].soutien = Math.min(100, Math.max(0, s.segments[id].soutien + d));
  };

  switch (bio.regionId) {
    case "nord": p.endurance += 10; p.reseau -= 3; seg("periurbain", 8); break;
    case "paris": p.reseau += 12; s.flags["heritier"] = true; seg("quartiers", -4); seg("csp", 6); break;
    case "banlieue": p.charisme += 8; seg("jeunes", 8); seg("quartiers", 10); seg("ruraux", -4); break;
    case "bretagne": p.strategie += 6; seg("ruraux", 8); s.country.prestige -= 2; s.flags["frere_pecheur"] = true; break;
    case "sudouest": p.reseau += 8; p.strategie += 4; seg("ruraux", 6); seg("urbains", -3); break;
    case "lyon": p.strategie += 8; s.power.patronat += 8; p.charisme -= 4; break;
    case "marseille": p.rhetorique += 8; p.charisme += 4; s.flags["amities_marseille"] = true; break;
    case "est": s.country.prestige += 4; p.charisme -= 3; p.strategie += 5; break;
    case "outremer": s.country.cohesion += 6; s.flags["outremer"] = true; s.power.popularite += 4; seg("quartiers", 5); break;
    case "exil": s.country.prestige += 8; p.reseau += 8; p.charisme -= 5; s.flags["enfance_etranger"] = true; break;
    case "montagne": p.endurance += 8; s.country.environnement += 4; seg("ruraux", 8); p.reseau -= 4; break;
    case "normandie": p.endurance += 6; seg("ruraux", 6); s.country.prestige += 3; p.rhetorique -= 3; break;
    case "corse": p.reseau += 10; s.country.prestige -= 4; s.flags["clan_insulaire"] = true; break;
    case "nord_pavillon": seg("pavillonnaires", 9); seg("periurbain", 6); seg("urbains", -4); s.country.prestige -= 2; break;
    case "ouvriere_usine": p.endurance += 7; s.power.syndicats += 10; seg("periurbain", 8); s.country.environnement -= 4; seg("csp", -4); break;
    case "vignoble": p.reseau += 8; s.power.patronat += 8; seg("csp", 8); seg("quartiers", -4); seg("jeunes", -3); break;
    case "guyane": p.endurance += 8; s.country.environnement += 6; s.country.cohesion += 4; p.reseau -= 6; s.flags["dossier_orpaillage"] = true; break;
    case "harkis": p.endurance += 8; s.country.cohesion += 5; p.reseau -= 5; s.flags["memoire_harkis"] = true; s.flags["legitimite_morale"] = true; break;
  }

  switch (bio.milieuId) {
    case "ouvrier": p.endurance += 6; p.reseau -= 4; seg("periurbain", 6); break;
    case "fonctionnaire": p.integrite += 6; seg("public", 6); s.power.patronat -= 4; break;
    case "commercant": p.strategie += 4; seg("independants", 8); seg("public", -3); break;
    case "bourgeois": p.reseau += 8; p.cynisme += 6; seg("quartiers", -4); seg("csp", 6); s.power.patronat += 5; break;
    case "agricole": p.endurance += 8; seg("ruraux", 8); seg("urbains", -3); break;
    case "enseignant": p.rhetorique += 6; seg("public", 5); seg("urbains", 5); break;
    case "immigre": p.endurance += 6; seg("quartiers", 10); seg("jeunes", 5); seg("ruraux", -3); s.flags["parents_immigres"] = true; break;
    case "militaire_famille": s.power.armee += 10; p.endurance += 5; s.country.securite += 3; seg("urbains", -3); break;
    case "artisan": seg("independants", 7); p.endurance += 5; p.integrite += 4; p.reseau -= 4; break;
    case "medical": p.integrite += 6; seg("ruraux", 5); s.country.services += 4; s.flags["credibilite_sante"] = true; break;
    case "monoparental": p.endurance += 7; p.charisme += 5; seg("quartiers", 6); seg("csp", -4); p.reseau -= 5; break;
    case "patronal": s.power.patronat += 12; p.strategie += 5; seg("independants", 5); s.power.syndicats -= 8; s.flags["conflit_social_familial"] = true; break;
    case "clerical": p.integrite += 5; seg("ruraux", 5); seg("pavillonnaires", 5); seg("urbains", -4); seg("jeunes", -3); break;
    case "communiste": s.power.syndicats += 12; p.rhetorique += 5; seg("public", 6); s.power.patronat -= 10; seg("csp", -5); s.flags["famille_communiste"] = true; break;
  }

  switch (bio.formationId) {
    case "ena": p.strategie += 8; p.reseau += 8; seg("periurbain", -4); s.power.popularite -= 3; break;
    case "droit": p.rhetorique += 10; s.power.justice += 4; break;
    case "eco": p.strategie += 6; p.charisme -= 3; s.flags["credibilite_budget"] = true; break;
    case "militaire": p.endurance += 8; s.power.armee += 12; s.country.securite += 3; seg("urbains", -4); s.flags["passe_militaire"] = true; break;
    case "autodidacte": p.charisme += 8; p.endurance += 4; p.reseau -= 6; p.strategie -= 4; break;
    case "medecin": p.integrite += 8; s.country.services += 4; s.flags["credibilite_sante"] = true; seg("public", 6); p.reseau -= 4; break;
    case "syndicale": p.charisme += 6; s.power.syndicats += 12; s.power.patronat -= 8; seg("csp", -4); break;
    case "ingenieur": p.strategie += 7; s.country.environnement += 4; p.rhetorique -= 4; s.flags["credibilite_industrie"] = true; break;
    case "journalisme": p.rhetorique += 7; s.power.presse += 10; p.integrite -= 4; s.flags["ancien_journaliste"] = true; break;
    case "prof": p.rhetorique += 7; p.endurance += 4; seg("public", 6); p.reseau -= 4; break;
    case "affaires": s.power.patronat += 12; seg("csp", 8); p.strategie += 5; p.integrite -= 6; seg("periurbain", -5); s.flags["passe_finance"] = true; break;
    case "humanitaire": p.integrite += 8; s.country.prestige += 6; s.country.cohesion += 4; p.strategie -= 5; s.flags["passe_humanitaire"] = true; break;
    case "police": s.country.securite += 6; p.endurance += 5; seg("pavillonnaires", 6); seg("quartiers", -6); seg("urbains", -3); s.flags["passe_police"] = true; break;
    case "sportif": p.charisme += 9; s.power.popularite += 6; seg("jeunes", 8); p.strategie -= 6; break;
  }

  switch (bio.evenementId) {
    case "usine": seg("periurbain", 6); seg("public", 4); s.flags["cause_sociale"] = true; break;
    case "frere": p.endurance += 4; s.flags["frere_condamne"] = true; break;
    case "attentat": s.flags["survivant_attentat"] = true; p.endurance += 4; s.hidden.sante -= 5; break;
    case "these": p.strategie += 4; p.reseau += 4; s.flags["these_arrangee"] = true; break;
    case "campagne_perdue": p.strategie += 6; p.cynisme += 4; break;
    case "greve_faim": p.charisme += 10; p.endurance += 6; s.hidden.sante -= 12; s.power.syndicats += 8; s.flags["cause_sociale"] = true; break;
    case "sauvetage": s.power.popularite += 8; p.charisme += 6; s.flags["heros_ordinaire"] = true; break;
    case "faillite": p.endurance += 6; seg("independants", 7); p.reseau -= 5; s.flags["rancune_banques"] = true; break;
    case "deuil": s.country.services += 5; p.integrite += 5; s.hidden.sante -= 6; s.flags["credibilite_sante"] = true; s.flags["deuil_hopital"] = true; break;
    case "emeute": seg("quartiers", 9); seg("jeunes", 6); seg("pavillonnaires", -6); p.endurance += 4; s.flags["garde_a_vue"] = true; break;
    case "opex": s.power.armee += 10; p.endurance += 5; s.hidden.sante -= 6; s.flags["passe_militaire"] = true; s.flags["embuscade"] = true; break;
    case "lanceur": p.integrite += 8; s.power.presse += 8; s.power.popularite += 5; p.reseau -= 8; s.flags["lanceur_alerte"] = true; break;
    case "prison": p.endurance += 8; s.power.justice += 6; s.country.prestige -= 4; s.flags["legitimite_morale"] = true; s.flags["detention_provisoire"] = true; break;
    case "canicule": s.country.services += 4; s.country.environnement += 6; seg("retraites", 6); s.hidden.sante -= 4; s.flags["obsession_climat"] = true; break;
    case "delocalisation": p.strategie += 6; p.cynisme += 6; s.power.patronat += 6; seg("periurbain", -5); s.flags["passe_drh"] = true; break;
    case "rencontre": p.charisme += 5; p.reseau += 6; p.integrite -= 5; s.flags["vocation_precoce"] = true; break;
    case "naufrage": s.country.cohesion += 5; s.country.prestige += 5; seg("urbains", 6); seg("ruraux", -5); seg("pavillonnaires", -4); s.flags["passe_humanitaire"] = true; break;
    case "braquage": s.country.securite += 5; seg("independants", 6); seg("pavillonnaires", 6); seg("quartiers", -7); s.flags["fermete_securite"] = true; break;
  }

  switch (bio.mentorId) {
    case "baron": p.reseau += 8; p.cynisme += 6; s.flags["dette_baron"] = true; break;
    case "professeure": p.integrite += 8; p.rhetorique += 4; s.power.justice += 4; s.flags["mentor_juge"] = true; break;
    case "syndicaliste": p.charisme += 6; s.power.syndicats += 10; s.power.patronat -= 5; break;
    case "industriel": p.reseau += 6; s.power.patronat += 12; s.flags["dette_industriel"] = true; break;
    case "prefet": p.strategie += 8; s.country.securite += 3; s.flags["mentor_prefet"] = true; break;
    case "resistante": p.integrite += 12; s.country.cohesion += 4; s.flags["legitimite_morale"] = true; break;
    case "personne": p.integrite += 8; p.reseau -= 12; p.strategie -= 5; s.flags["sans_mentor"] = true; break;
    case "cure": p.integrite += 6; seg("ruraux", 6); s.country.cohesion += 3; seg("urbains", -4); s.flags["mentor_cure"] = true; break;
    case "patronne": s.power.presse += 12; p.rhetorique += 5; s.power.popularite += 4; p.integrite -= 5; s.flags["dette_presse"] = true; break;
    case "avocat": p.rhetorique += 8; p.reseau += 6; p.integrite -= 5; s.flags["mentor_penaliste"] = true; break;
    case "generale": s.power.armee += 12; p.strategie += 5; p.endurance += 4; s.power.syndicats -= 6; s.flags["mentor_militaire"] = true; break;
    case "militante": seg("quartiers", 9); seg("jeunes", 6); p.charisme += 5; seg("csp", -5); s.flags["mentor_militante"] = true; break;
    case "banquier": seg("csp", 9); s.power.patronat += 10; p.cynisme += 6; p.integrite -= 6; s.flags["dette_banquier"] = true; break;
    case "ennemi": p.strategie += 8; p.rhetorique += 6; s.power.parti -= 8; s.flags["mentor_adversaire"] = true; break;
  }

  // La conviction fondatrice : elle place le curseur et arme le premier camp.
  switch (bio.convictionId) {
    case "conv_revolution": s.power.syndicats += 14; s.power.patronat -= 14; p.rhetorique += 6; seg("public", 6); seg("jeunes", 6); seg("csp", -8); break;
    case "conv_sociale": s.power.syndicats += 8; seg("public", 6); seg("quartiers", 5); s.power.patronat -= 6; s.country.marge -= 3; break;
    case "conv_ecolo": s.country.environnement += 10; seg("urbains", 7); seg("jeunes", 6); seg("periurbain", -5); s.power.patronat -= 6; s.flags["obsession_climat"] = true; break;
    case "conv_republicaine": p.integrite += 6; s.country.cohesion += 5; seg("public", 5); seg("quartiers", -4); break;
    case "conv_pragmatique": p.strategie += 7; s.power.patronat += 5; s.power.presse += 5; p.charisme -= 5; break;
    case "conv_europe": s.country.prestige += 8; seg("urbains", 5); seg("csp", 5); seg("periurbain", -5); seg("ruraux", -4); break;
    case "conv_liberale": s.power.patronat += 12; seg("csp", 7); seg("independants", 6); s.power.syndicats -= 10; s.country.services -= 4; break;
    case "conv_ordre": s.country.securite += 8; s.power.armee += 8; seg("pavillonnaires", 6); seg("retraites", 5); seg("quartiers", -7); seg("urbains", -4); break;
    case "conv_nation": seg("periurbain", 8); seg("ruraux", 6); s.country.securite += 5; s.power.popularite += 4; s.country.prestige -= 8; s.country.cohesion -= 6; seg("quartiers", -9); break;
    case "conv_souverainiste": seg("periurbain", 6); s.power.armee += 6; s.country.prestige -= 5; seg("csp", -5); break;
    case "conv_conservatrice": seg("retraites", 7); seg("ruraux", 5); seg("pavillonnaires", 5); s.country.cohesion += 3; seg("jeunes", -6); seg("urbains", -4); s.country.environnement -= 4; break;
    case "conv_populiste": p.charisme += 8; seg("periurbain", 7); seg("quartiers", 4); for (const sg of Object.values(s.segments)) sg.participation = Math.min(100, sg.participation + 4); s.power.presse -= 8; seg("csp", -6); break;
    case "conv_aucune": p.charisme -= 5; s.power.parti -= 6; s.flags["sans_ligne"] = true; break;
    case "conv_technocrate": p.strategie += 6; s.country.marge += 5; s.power.patronat += 5; p.charisme -= 5; s.country.cohesion -= 3; break;
  }

  // Le curseur de départ, somme des inclinaisons de chaque choix.
  const pools = [REGIONS, MILIEUX, FORMATIONS, EVENEMENTS_FONDATEURS, MENTORS, CONVICTIONS];
  const ids = [bio.regionId, bio.milieuId, bio.formationId, bio.evenementId, bio.mentorId, bio.convictionId];
  let bord = 0;
  for (let i = 0; i < pools.length; i++) {
    bord += pools[i].find((o) => o.id === ids[i])?.bord ?? 0;
  }
  s.bord = Math.max(-10, Math.min(10, bord));
  if (Math.abs(s.bord) >= 5) s.flags["bord_radical"] = true;

  // La conviction fondatrice est déjà une phrase entre guillemets : c'est la
  // première parole publique de la carrière, et la plus lourde à renier.
  const conviction = CONVICTIONS.find((c) => c.id === bio.convictionId);
  if (conviction) {
    s.flags["bord_initial"] = s.bord;
    s.propos.push({
      id: "conviction",
      sujet: "conviction",
      citation: conviction.nom.replace(/^«\s*/, "").replace(/\s*»$/, ""),
      contexte: "au premier meeting de votre carrière",
      turn: 0,
      tenu: true,
    });
  }

  for (const k of Object.keys(p) as (keyof typeof p)[]) {
    p[k] = Math.max(5, Math.min(95, p[k]));
  }
  for (const sg of Object.values(s.segments)) {
    sg.soutien = Math.max(0, Math.min(100, sg.soutien));
  }
}

export function rngOf(s: GameState): Rng {
  return makeRng(s.seed, s.rngCalls);
}
