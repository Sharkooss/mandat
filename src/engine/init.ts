import type { Bio, GameState } from "./types";
import { CAST, SEGMENTS } from "../content/france/data";
import { makeRng, type Rng } from "./rng";

export function makeInitialState(seed: number): GameState {
  const characters: GameState["characters"] = {};
  for (const c of CAST) {
    characters[c.id] = { id: c.id, loyaute: c.loyaute, ambition: c.ambition, rancune: c.rancune, vivant: true, enPoste: true };
  }
  const segments: GameState["segments"] = {};
  for (const seg of SEGMENTS) {
    segments[seg.id] = { id: seg.id, soutien: seg.soutien, participation: seg.participation };
  }
  return {
    seed,
    rngCalls: 0,
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
      conjointPrenom: "",
      conjointCarriere: "avocature",
    },
    player: { charisme: 45, rhetorique: 45, strategie: 45, integrite: 55, cynisme: 30, endurance: 55, reseau: 35 },
    country: { croissance: 0.9, chomage: 7.4, inflation: 1.9, dette: 114, marge: 30, services: 42, securite: 55, environnement: 48, cohesion: 38, prestige: 72 },
    power: { popularite: 50, sieges: 0, parti: 55, presse: 50, armee: 55, patronat: 50, syndicats: 40, justice: 60 },
    hidden: { fatigue: 10, sante: 90, paranoia: 5, coup: 2, assassinat: 3, agitation: 25 },
    derive: 0,
    pc: 3,
    pcMax: 3,
    characters,
    segments,
    promises: [],
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
  out.segments = { ...base.segments, ...(saved.segments ?? {}) };
  out.flags = saved.flags ?? {};

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
  out.focusCharacter = saved.focusCharacter ?? null;
  return out;
}

/** Applique les cinq choix de l'Acte I : stats, relations, et bombes biographiques. */
export function applyBio(s: GameState, bio: Bio): void {
  s.bio = bio;
  const p = s.player;
  const seg = (id: string, d: number) => {
    s.segments[id].soutien = Math.min(100, s.segments[id].soutien + d);
  };

  switch (bio.regionId) {
    case "nord": p.endurance += 10; seg("periurbain", 8); break;
    case "paris": p.reseau += 12; s.flags["heritier"] = true; seg("quartiers", -4); break;
    case "banlieue": p.charisme += 8; seg("jeunes", 8); seg("quartiers", 10); break;
    case "bretagne": p.strategie += 6; seg("ruraux", 8); s.flags["frere_pecheur"] = true; break;
    case "sudouest": p.reseau += 8; p.strategie += 4; seg("ruraux", 6); break;
    case "lyon": p.strategie += 8; s.power.patronat += 8; p.charisme -= 4; break;
    case "marseille": p.rhetorique += 8; s.flags["amities_marseille"] = true; break;
    case "est": s.country.prestige += 4; p.charisme -= 3; p.strategie += 5; break;
    case "outremer": s.country.cohesion += 6; s.flags["outremer"] = true; s.power.popularite += 4; break;
    case "exil": s.country.prestige += 8; p.reseau += 8; p.charisme -= 5; s.flags["enfance_etranger"] = true; break;
    case "montagne": p.endurance += 8; s.country.environnement += 4; seg("ruraux", 8); break;
  }

  switch (bio.milieuId) {
    case "ouvrier": p.endurance += 6; p.reseau -= 4; seg("periurbain", 6); break;
    case "fonctionnaire": p.integrite += 6; seg("public", 6); break;
    case "commercant": p.strategie += 4; seg("independants", 8); break;
    case "bourgeois": p.reseau += 8; p.cynisme += 6; seg("quartiers", -4); break;
    case "agricole": p.endurance += 8; seg("ruraux", 8); break;
    case "enseignant": p.rhetorique += 6; seg("public", 5); seg("urbains", 5); break;
    case "immigre": p.endurance += 6; seg("quartiers", 10); seg("jeunes", 5); seg("ruraux", -3); s.flags["parents_immigres"] = true; break;
  }

  switch (bio.formationId) {
    case "ena": p.strategie += 8; p.reseau += 8; seg("periurbain", -4); break;
    case "droit": p.rhetorique += 10; break;
    case "eco": p.strategie += 6; s.flags["credibilite_budget"] = true; break;
    case "militaire": p.endurance += 8; s.power.armee += 12; s.flags["passe_militaire"] = true; break;
    case "autodidacte": p.charisme += 8; p.endurance += 4; p.reseau -= 6; break;
    case "medecin": p.integrite += 8; s.country.services += 4; s.flags["credibilite_sante"] = true; seg("public", 6); break;
    case "syndicale": p.charisme += 6; s.power.syndicats += 12; s.power.patronat -= 8; break;
  }

  switch (bio.evenementId) {
    case "usine": seg("periurbain", 6); seg("public", 4); s.flags["cause_sociale"] = true; break;
    case "frere": p.endurance += 4; s.flags["frere_condamne"] = true; break;
    case "attentat": s.flags["survivant_attentat"] = true; s.player.endurance += 4; break;
    case "these": p.strategie += 4; p.reseau += 4; s.flags["these_arrangee"] = true; break;
    case "campagne_perdue": p.strategie += 6; p.cynisme += 4; break;
    case "greve_faim": p.charisme += 10; p.endurance += 6; s.hidden.sante -= 12; s.flags["cause_sociale"] = true; break;
    case "sauvetage": s.power.popularite += 8; p.charisme += 6; s.flags["heros_ordinaire"] = true; break;
  }

  switch (bio.mentorId) {
    case "baron": p.reseau += 8; p.cynisme += 6; s.flags["dette_baron"] = true; break;
    case "professeure": p.integrite += 8; p.rhetorique += 4; s.flags["mentor_juge"] = true; break;
    case "syndicaliste": p.charisme += 6; s.power.syndicats += 10; break;
    case "industriel": p.reseau += 6; s.power.patronat += 12; s.flags["dette_industriel"] = true; break;
    case "prefet": p.strategie += 8; s.flags["mentor_prefet"] = true; break;
    case "resistante": p.integrite += 12; s.country.cohesion += 4; s.flags["legitimite_morale"] = true; break;
    case "personne": p.integrite += 8; p.reseau -= 12; p.strategie -= 5; s.flags["sans_mentor"] = true; break;
  }

  for (const k of Object.keys(p) as (keyof typeof p)[]) {
    p[k] = Math.max(5, Math.min(95, p[k]));
  }
}

export function rngOf(s: GameState): Rng {
  return makeRng(s.seed, s.rngCalls);
}
