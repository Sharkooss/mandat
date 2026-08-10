import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bio, GameState } from "./engine/types";
import { makeInitialState, applyBio, rngOf, normalizeState } from "./engine/init";
import { randomSeed } from "./engine/rng";
import { makeCtx } from "./engine/ctx";
import { getEvent, getCrise } from "./engine/registry";
import { genBriefing, selectTurnEvents, endOfTurn, updateTrends } from "./engine/turn";
import { applyCampaignAction, makeCampaign, resolveElection, runDebate } from "./engine/campaign";
import { ASCENSION_SEQUENCE } from "./content/france/ascension";
import { EVENTS_CAMPAGNE } from "./content/france/campagne";
import { ACTIONS, REFORMES } from "./content/france/actions";
import { buildEnding, checkEndings, type EndingCause } from "./content/france/fins";
import { computeDeltas, computeSignals, snapshot } from "./engine/deltas";
import { PRENOMS_F, PRENOMS_M, NOMS, REGIONS, MILIEUX, FORMATIONS, EVENEMENTS_FONDATEURS, MENTORS, SEGMENTS } from "./content/france/data";

const SEG_NOMS: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.id, s.nom]));

export interface PantheonEntry {
  nom: string;
  ending: string;
  famille: string;
  rarete: string;
  annees: number;
  date: string;
}

interface Store {
  game: GameState | null;
  pantheon: PantheonEntry[];
  /** Dernière erreur d'action — affichée au joueur plutôt que subie en silence. */
  lastError: string | null;
  clearError: () => void;
  newGame: () => void;
  abandon: () => void;
  submitBio: (bio: Bio) => void;
  randomBio: () => void;
  chooseOption: (choiceId: string) => void;
  continueAfter: () => void;
  startBriefing: () => void;
  beginEvents: () => void;
  doAction: (actionId: string, param?: string) => void;
  finishTurn: () => void;
  chooseProgram: (promiseIds: string[]) => void;
  campaignWeek: (actionId: string, segmentId?: string) => void;
  doDebate: (beats: string[]) => void;
  finishElection: () => void;
}

const DEBATE_OFFSET = 4; // le débat a lieu à totalWeeks - 4

function clone(s: GameState): GameState {
  return structuredClone(s);
}

function endGame(s: GameState, cause: EndingCause): void {
  s.ending = buildEnding(s, cause);
  s.act = "fin";
  s.gameOver = true;
}

function pantheonFrom(s: GameState): PantheonEntry {
  return {
    nom: `${s.bio.prenom} ${s.bio.nom}`,
    ending: s.ending?.nom ?? "?",
    famille: s.ending?.famille ?? "?",
    rarete: s.ending?.rarete ?? "?",
    annees: Math.max(0, Math.round(s.turnCount / 4)),
    date: new Date().toISOString().slice(0, 10),
  };
}

/** Démarre un trimestre : briefing, symptômes, sélection des événements. */
function startTurn(s: GameState): void {
  const rng = rngOf(s);
  s.turn += 1;
  s.turnCount += 1;
  s.actionsUsed = [];
  s.resolution = null;
  let pc = s.cohabitation ? 2 : 3;
  if (s.hidden.fatigue > 70) pc -= 1;
  if (s.hidden.sante < 40) pc -= 1;
  s.pc = Math.max(1, pc);
  s.pcMax = s.pc;
  updateTrends(s);
  genBriefing(s, rng);
  selectTurnEvents(s, rng);
  s.phase = "briefing";
  s.currentEvent = null;
  s.rngCalls = rng.state();
}

/** Fin de trimestre : simulation, vérification des fins, échéances électorales. */
function endTurnFlow(s: GameState): void {
  const rng = rngOf(s);
  endOfTurn(s, rng);

  // Fins immédiates par drapeau
  if (s.flags["consulat_valide"]) {
    s.rngCalls = rng.state();
    endGame(s, "consulat");
    return;
  }
  if (s.flags["consulat_rejete"]) {
    s.rngCalls = rng.state();
    endGame(s, "consulat_perdu");
    return;
  }
  if (s.flags["cincinnatus_final"]) {
    s.rngCalls = rng.state();
    endGame(s, "cincinnatus");
    return;
  }

  const cause = checkEndings(s, rng);
  s.rngCalls = rng.state();
  if (cause) {
    endGame(s, cause);
    return;
  }

  // Fin de mandat ?
  if (s.turn >= 20) {
    if (s.mandat === 1) {
      if (s.flags["retrait_annonce"]) {
        endGame(s, "retrait_volontaire");
        return;
      }
      // La réélection : l'adversaire dépend de votre partie.
      let opposantId = "sallenave";
      let score = 46;
      if (s.flags["delval_vainqueur"]) { opposantId = "delval"; score = 54; }
      else if (s.flags["verdier_opposant"]) { opposantId = "verdier"; score = 55; }
      else if (s.flags["figure_rp"] || s.flags["figure_territoires"]) { opposantId = "figure_rp"; score = 50; }
      else if (s.power.popularite > 48) { opposantId = "andrieu"; score = 48; }
      if (s.flags["rives_champion"]) score += 6;
      // Un président impopulaire attire un adversaire renforcé — et inversement.
      score += Math.round(Math.max(0, 48 - s.power.popularite) * 0.5);
      score -= Math.round(Math.max(0, s.power.popularite - 55) * 0.3);
      s.campaign = makeCampaign("reelection", opposantId, score);
      s.act = "campagne";
      s.phase = "briefing";
      s.press = [];
      s.log.push({ turn: s.turnCount, text: "La campagne de réélection commence." });
      return;
    }
    // Fin du second mandat
    endGame(s, "fin_mandats");
    return;
  }

  startTurn(s);
}

export const useGame = create<Store>()(
  persist(
    (set, get) => {
    const api: Store = {
      game: null,
      pantheon: [],
      lastError: null,

      clearError: () => set({ lastError: null }),

      newGame: () => {
        set({ game: makeInitialState(randomSeed()) });
      },

      abandon: () => set({ game: null }),

      submitBio: (bio) => {
        const s = clone(get().game!);
        const rng = rngOf(s);
        if (!bio.prenom) bio.prenom = rng.pick(bio.genre === "f" ? PRENOMS_F : PRENOMS_M);
        if (!bio.nom) bio.nom = rng.pick(NOMS);
        if (!bio.conjointPrenom) bio.conjointPrenom = rng.pick(bio.genre === "f" ? PRENOMS_M : PRENOMS_F);
        applyBio(s, bio);
        s.act = "ascension";
        s.queue = [...ASCENSION_SEQUENCE];
        s.currentEvent = s.queue.shift() ?? null;
        s.rngCalls = rng.state();
        set({ game: s });
      },

      randomBio: () => {
        const s = get().game!;
        const rng = rngOf(clone(s));
        const genre = rng.chance(0.5) ? "f" : "m";
        const bio: Bio = {
          prenom: "",
          nom: "",
          genre,
          age: rng.int(42, 58),
          regionId: rng.pick(REGIONS).id,
          milieuId: rng.pick(MILIEUX).id,
          formationId: rng.pick(FORMATIONS).id,
          evenementId: rng.pick(EVENEMENTS_FONDATEURS).id,
          mentorId: rng.pick(MENTORS).id,
          conjointPrenom: "",
          conjointCarriere: rng.pick(["avocature", "médecine", "entreprise", "enseignement"]),
        };
        get().submitBio(bio);
      },

      chooseOption: (choiceId) => {
        const s = clone(get().game!);
        const ev = s.currentEvent ? getEvent(s.currentEvent) : null;
        if (!ev) return;
        const choice = ev.choices.find((c) => c.id === choiceId);
        if (!choice) return;
        const rng = rngOf(s);
        const ctx = makeCtx(s, rng);
        const avant = snapshot(s);
        s.resolution = choice.effects(ctx);
        s.lastDeltas = computeDeltas(avant, s, SEG_NOMS);
        s.lastSignals = computeSignals(avant, s);
        s.rngCalls = rng.state();
        set({ game: s });
      },

      continueAfter: () => {
        const s = clone(get().game!);
        s.resolution = null;
        s.lastDeltas = [];
        s.lastSignals = [];

        // Une crise vient-elle d'être déclenchée ?
        const criseId = s.flags["crise_a_lancer"];
        if (typeof criseId === "string") {
          delete s.flags["crise_a_lancer"];
          const def = getCrise(criseId);
          if (def) {
            s.act = "crise";
            s.crisis = { id: def.id, titre: def.titre, jour: 1, queue: [...def.events] };
            s.currentEvent = s.crisis.queue.shift() ?? null;
            set({ game: s });
            return;
          }
        }

        if (s.act === "crise" && s.crisis) {
          const next = s.crisis.queue.shift();
          if (next) {
            s.crisis.jour += 1;
            s.currentEvent = next;
            set({ game: s });
            return;
          }
          // La crise est traversée : elle consume le reste du trimestre.
          s.crisis = null;
          s.act = "mandat";
          s.currentEvent = null;
          endTurnFlow(s);
          set({ game: s, ...(s.gameOver && s.ending ? { pantheon: [...get().pantheon, pantheonFrom(s)] } : {}) });
          return;
        }

        if (s.act === "ascension") {
          const next = s.queue.shift();
          if (next) {
            s.currentEvent = next;
          } else {
            s.act = "campagne";
            s.currentEvent = null;
            s.phase = "briefing"; // écran programme
          }
          set({ game: s });
          return;
        }

        if (s.act === "campagne") {
          // un événement de campagne en attente, sinon retour à la semaine
          s.currentEvent = s.queue.shift() ?? null;
          set({ game: s });
          return;
        }

        // Mandat : événement suivant ou phase actions
        const next = s.queue.shift();
        if (next) {
          s.currentEvent = next;
        } else {
          s.currentEvent = null;
          s.phase = "actions";
        }
        set({ game: s });
      },

      startBriefing: () => {
        const s = clone(get().game!);
        startTurn(s);
        set({ game: s });
      },

      beginEvents: () => {
        const s = clone(get().game!);
        s.flags["recit_vu"] = true;
        const next = s.queue.shift();
        if (next) {
          s.phase = "evenements";
          s.currentEvent = next;
        } else {
          s.phase = "actions";
        }
        set({ game: s });
      },

      doAction: (actionId, param) => {
        const s = clone(get().game!);
        const action = ACTIONS.find((a) => a.id === actionId);
        if (!action) return;
        let cout = action.cout;
        if (actionId === "reforme" && param) {
          cout = REFORMES.find((r) => r.id === param)?.cout ?? 2;
        }
        if (cout > s.pc) return;
        const rng = rngOf(s);
        const ctx = makeCtx(s, rng);
        const avant = snapshot(s);
        s.resolution = action.effects(ctx, param);
        s.lastDeltas = computeDeltas(avant, s, SEG_NOMS);
        s.lastSignals = computeSignals(avant, s);
        s.pc -= cout;
        s.actionsUsed.push(actionId === "reforme" ? `reforme:${param}` : actionId);
        s.rngCalls = rng.state();
        set({ game: s });
      },

      finishTurn: () => {
        const s = clone(get().game!);
        s.resolution = null;
        s.phase = "resolution";
        endTurnFlow(s);
        set({ game: s, ...(s.gameOver && s.ending ? { pantheon: [...get().pantheon, pantheonFrom(s)] } : {}) });
      },

      chooseProgram: (promiseIds) => {
        const s = clone(get().game!);
        s.promises = promiseIds.map((id) => ({ id, status: "en_cours" as const }));
        const rng = rngOf(s);
        const opposantId = rng.chance(0.6) ? "sallenave" : "andrieu";
        s.campaign = makeCampaign("presidentielle", opposantId, opposantId === "sallenave" ? 46 : 50);
        s.rngCalls = rng.state();
        set({ game: s });
      },

      campaignWeek: (actionId, segmentId) => {
        const s = clone(get().game!);
        const c = s.campaign!;
        const rng = rngOf(s);
        const avant = snapshot(s);
        s.resolution = applyCampaignAction(s, rng, actionId, segmentId);
        s.lastDeltas = computeDeltas(avant, s, SEG_NOMS);
        s.lastSignals = computeSignals(avant, s);

        // Un événement de campagne peut surgir.
        if (rng.chance(0.3)) {
          const pool = EVENTS_CAMPAGNE.filter(
            (e) => !s.fired.includes(e.id) && (!e.cond || e.cond(s))
          );
          if (pool.length > 0) {
            const ev = rng.pick(pool);
            s.fired.push(ev.id);
            s.queue.unshift(ev.id);
          }
        }
        c.week += 1;
        s.rngCalls = rng.state();
        set({ game: s });
      },

      doDebate: (beats) => {
        const s = clone(get().game!);
        const rng = rngOf(s);
        const avant = snapshot(s);
        s.resolution = runDebate(s, rng, beats);
        s.lastDeltas = computeDeltas(avant, s, SEG_NOMS);
        s.lastSignals = computeSignals(avant, s);
        s.rngCalls = rng.state();
        set({ game: s });
      },

      finishElection: () => {
        const s = clone(get().game!);
        const rng = rngOf(s);
        const outcome = resolveElection(s, rng);
        s.rngCalls = rng.state();
        s.flags["election_recit"] = outcome.recit.join(" ");
        s.flags["election_t2"] = Math.round(outcome.t2.joueur * 10) / 10;
        if (!outcome.gagne) {
          if (s.campaign?.kind === "presidentielle") {
            endGame(s, "jamais_elu");
          } else {
            endGame(s, "battu");
          }
          set({ game: s, pantheon: [...get().pantheon, pantheonFrom(s)] });
          return;
        }
        // Victoire : investiture (ou réinvestiture).
        s.mandat += 1;
        s.turn = 0;
        s.power.sieges = outcome.sieges;
        s.cohabitation = outcome.sieges < 240;
        if (s.mandat === 1) {
          s.flags["dette_debut"] = s.country.dette;
          s.log.push({ turn: 0, text: `Élu(e) président(e) de la République avec ${Math.round(outcome.t2.joueur * 10) / 10} % des voix.` });
        } else {
          s.log.push({ turn: s.turnCount, text: `Réélu(e) avec ${Math.round(outcome.t2.joueur * 10) / 10} % des voix.` });
        }
        s.campaign = null;
        s.act = "mandat";
        startTurn(s);
        set({ game: s });
      },
    };

    // Filet de sécurité : si une action échoue, le joueur doit le voir.
    // Un bouton qui ne fait rien est le pire des bugs.
    for (const cle of Object.keys(api) as (keyof Store)[]) {
      const valeur = api[cle];
      if (typeof valeur !== "function" || cle === "clearError") continue;
      const original = valeur as (...args: unknown[]) => unknown;
      (api[cle] as unknown) = (...args: unknown[]) => {
        try {
          return original(...args);
        } catch (e) {
          console.error("[MANDAT]", cle, e);
          set({ lastError: e instanceof Error ? e.message : String(e) });
        }
      };
    }
    return api;
    },
    {
      name: "mandat-save",
      version: 2,
      // Une partie commencée sur une version antérieure doit rester jouable :
      // on recomplète les champs apparus depuis plutôt que de la jeter.
      migrate: (persisted) => {
        const p = persisted as { game?: GameState | null; pantheon?: PantheonEntry[] } | undefined;
        return { game: normalizeState(p?.game), pantheon: p?.pantheon ?? [] };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.game) state.game = normalizeState(state.game);
      },
    }
  )
);

export { DEBATE_OFFSET };
