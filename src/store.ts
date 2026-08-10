import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bio, CheckRang, GameState } from "./engine/types";
import { makeInitialState, applyBio, rngOf, normalizeState } from "./engine/init";
import { randomSeed, type Rng } from "./engine/rng";
import { makeCtx } from "./engine/ctx";
import { getEvent, getCrise } from "./engine/registry";
import { genBriefing, selectTurnEvents, endOfTurn, updateTrends } from "./engine/turn";
import {
  applyCampaignAction,
  ligneAdverse,
  makeCampaign,
  resolveElection,
  riposter,
  runDebate,
  tirerActionsSemaine,
} from "./engine/campaign";
import { parcoursDe, tirerPortraitAdverse } from "./content/france/affiche";
import { buildAscension } from "./content/france/ascension";
import { EVENTS_CAMPAGNE } from "./content/france/campagne";
import { ACTIONS, CHANCE_OPPORTUNITE, REFORMES, type ActionDef } from "./content/france/actions";
import { buildEnding, checkEndings, type EndingCause } from "./content/france/fins";
import { computeDeltas, computeSignals, pushLedger, snapshot } from "./engine/deltas";
import { appliquerCheck, planActionCheck, planCampagneCheck, planChoixCheck, planDebatCheck } from "./engine/check";
import { nomDe } from "./engine/noms";
import {
  PRENOMS_F,
  PRENOMS_M,
  NOMS as NOMS_FAMILLE,
  REGIONS,
  MILIEUX,
  FORMATIONS,
  EVENEMENTS_FONDATEURS,
  MENTORS,
  CONVICTIONS,
  SEGMENTS,
  CAST,
  PROMESSES,
  tirerProgramme,
} from "./content/france/data";

const SEG_NOMS: Record<string, string> = Object.fromEntries(SEGMENTS.map((s) => [s.id, s.nom]));
const NOMS_PROMESSES = Object.fromEntries(PROMESSES.map((p) => [p.id, p.label]));

/** Calcule les variations d'une décision et les inscrit au journal des impacts. */
function recordImpacts(s: GameState, avant: ReturnType<typeof snapshot>): void {
  s.lastDeltas = computeDeltas(avant, s, SEG_NOMS);
  s.lastSignals = computeSignals(avant, s);
  // Les noms du casting sont propres à la partie : on les relit à chaque fois
  // plutôt que de figer ceux du contenu au chargement du module.
  pushLedger(avant, s, s.lastDeltas, s.lastSignals, {
    segments: SEG_NOMS,
    personnages: Object.fromEntries(CAST.map((c) => [c.id, nomDe(s, c.id)])),
    promesses: NOMS_PROMESSES,
  });
}

/**
 * Les tournures d'un engagement de campagne. Une promesse n'entre pas dans la
 * mémoire du pays sous la forme d'une ligne de programme : elle y entre sous
 * la forme d'une phrase, dite un soir, dans un endroit précis.
 */
const ENGAGEMENTS: [(label: string) => string, string][] = [
  [(l) => `${l} : ce n'est pas une option, c'est un engagement.`, "en meeting, devant six mille personnes"],
  [(l) => `Je le dis ici, et vous pourrez me le rappeler : ${l.charAt(0).toLowerCase()}${l.slice(1)}.`, "au meeting de clôture"],
  [(l) => `${l}. Pas dans dix ans. Pendant ce mandat.`, "sur le plateau du débat"],
  [(l) => `Si je suis élu, ce sera ${l.charAt(0).toLowerCase()}${l.slice(1)}. Sinon, ce n'était pas la peine.`, "dans la profession de foi"],
  [(l) => `On m'a dit que c'était impossible. ${l} : je le ferai.`, "au journal de 20 heures"],
];

/**
 * Une décision vient d'être prise : on rapproche d'autant le prochain moment
 * de vérité, et on efface le précédent de l'écran.
 */
function tickCheck(s: GameState): void {
  if (s.checkCooldown > 0) s.checkCooldown -= 1;
  s.lastCheck = null;
}

/** Applique un choix d'événement, précédé s'il y a lieu du récit du mini-jeu. */
function appliquerChoix(s: GameState, choiceId: string, rang?: CheckRang): void {
  const ev = s.currentEvent ? getEvent(s.currentEvent) : null;
  if (!ev) return;
  const tous = [...ev.choices, ...(ev.dynamicChoices?.(s) ?? [])];
  const choice = tous.find((c) => c.id === choiceId);
  if (!choice) return;
  const rng = rngOf(s);
  const ctx = makeCtx(s, rng);
  const avant = snapshot(s);
  const recit = rang ? appliquerCheck(s, rng, rang) : null;
  const texte = choice.effects(ctx);
  s.resolution = recit ? `${recit} ${texte}` : texte;
  recordImpacts(s, avant);
  s.rngCalls = rng.state();
}

/** Applique une action du semestre : coût en capital, effets, journal. */
function appliquerAction(s: GameState, actionId: string, param: string | undefined, cout: number, rang?: CheckRang): void {
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action) return;
  const rng = rngOf(s);
  const ctx = makeCtx(s, rng);
  const avant = snapshot(s);
  const recit = rang ? appliquerCheck(s, rng, rang) : null;
  const texte = action.effects(ctx, param);
  s.resolution = recit ? `${recit} ${texte}` : texte;
  recordImpacts(s, avant);
  s.pc -= cout;
  s.actionsUsed.push(actionId === "reforme" ? `reforme:${param}` : actionId);
  s.actionCooldown[actionId] = s.turnCount;
  // Saisir une occasion referme la fenêtre : celle-ci ne reviendra jamais, et
  // il faudra quelques semestres avant qu'une autre s'ouvre.
  if (action.opportunite) s.opportuniteCooldown = rng.int(2, 4);
  s.rngCalls = rng.state();
}

/** Applique la semaine de campagne, puis fait avancer le calendrier. */
function appliquerSemaine(s: GameState, actionId: string, segmentId: string | undefined, rang?: CheckRang): void {
  const c = s.campaign!;
  const rng = rngOf(s);
  const avant = snapshot(s);
  const recit = rang ? appliquerCheck(s, rng, rang) : null;
  const texte = applyCampaignAction(s, rng, actionId, segmentId, rang);
  s.resolution = recit ? `${recit} ${texte}` : texte;

  // L'adversaire joue aussi sa semaine. Sa riposte est comptée dans les mêmes
  // impacts : le joueur doit voir que la perte de terrain vient d'en face, et
  // pas d'une dérive anonyme des sondages.
  riposter(s, rng);
  recordImpacts(s, avant);

  // Un événement de campagne peut surgir — la campagne est courte,
  // il faut qu'il s'y passe quelque chose presque chaque semaine.
  if (rng.chance(0.5)) {
    const pool = EVENTS_CAMPAGNE.filter((e) => !s.fired.includes(e.id) && (!e.cond || e.cond(s)));
    if (pool.length > 0) {
      const ev = rng.pick(pool);
      s.fired.push(ev.id);
      s.queue.unshift(ev.id);
    }
  }
  c.week += 1;
  // Le menu de la semaine suivante est tiré tout de suite : ce qu'on n'a pas
  // saisi cette semaine n'est pas garanti de revenir.
  c.actionPool = tirerActionsSemaine(s, rng);
  s.rngCalls = rng.state();
}

function appliquerDebat(s: GameState, beats: string[], rang?: CheckRang): void {
  const rng = rngOf(s);
  const avant = snapshot(s);
  const recit = rang ? appliquerCheck(s, rng, rang) : null;
  const texte = runDebate(s, rng, beats, rang);
  s.resolution = recit ? `${recit} ${texte}` : texte;
  recordImpacts(s, avant);
  s.rngCalls = rng.state();
}

/**
 * Ouvre une campagne : l'adversaire, son parcours tiré pour cette partie-ci,
 * ce que ce parcours lui apporte d'emblée, et le menu de la première semaine.
 * On passe par l'affiche avant la première action — une campagne doit d'abord
 * ressembler à un duel entre deux personnes.
 */
function ouvrirCampagne(
  s: GameState,
  rng: Rng,
  kind: "presidentielle" | "reelection",
  opposantId: string,
  score: number,
  ligne?: string
): void {
  const portrait = tirerPortraitAdverse(rng);
  const parcours = parcoursDe(portrait.parcours);
  s.campaign = makeCampaign(kind, opposantId, score + (parcours.score ?? 0), ligne);
  s.campaign.portraitAdversaire = portrait;
  // Un parcours n'est pas un décor : celui d'en face arrive avec un électorat.
  for (const id of parcours.segments ?? []) {
    const seg = s.segments[id];
    if (seg) seg.soutien = Math.max(0, seg.soutien - 3);
  }
  s.campaign.actionPool = tirerActionsSemaine(s, rng);
  s.flags["affiche_a_voir"] = true;
}

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
  /** Met un personnage en avant dans le panneau Entourage (clic dans un texte). */
  setFocus: (id: string | null) => void;
  newGame: () => void;
  abandon: () => void;
  submitBio: (bio: Bio) => void;
  randomBio: () => void;
  chooseOption: (choiceId: string) => void;
  /** Conclut le mini-jeu en cours et applique enfin la décision. */
  resolveCheck: (rang: CheckRang) => void;
  continueAfter: () => void;
  startBriefing: () => void;
  beginEvents: () => void;
  doAction: (actionId: string, param?: string) => void;
  finishTurn: () => void;
  chooseProgram: (promiseIds: string[]) => void;
  /** Referme le bilan de mandat et laisse l'affiche s'ouvrir. */
  closeBilan: () => void;
  /** Referme le face-à-face et lance la première semaine. */
  closeAffiche: () => void;
  campaignWeek: (actionId: string, segmentId?: string) => void;
  doDebate: (beats: string[]) => void;
  finishElection: () => void;
}

const DEBATE_OFFSET = 2; // le débat a lieu à totalWeeks - 2

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
    annees: Math.max(0, Math.round(s.turnCount / 2)),
    date: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Tire l'opportunité du semestre — une au plus, et jamais deux fois la même de
 * toute la partie. Trois garde-fous font qu'elle reste une occasion et non une
 * rubrique du menu : elle disparaît définitivement une fois saisie, un temps
 * mort la suit, et même quand la situation s'y prête elle ne se présente que
 * selon sa rareté. Une fenêtre qu'on est sûr de revoir n'oblige à rien.
 */
function tirerOpportunite(s: GameState, rng: Rng, dispo: (a: ActionDef) => boolean): string[] {
  if (s.opportuniteCooldown > 0) {
    s.opportuniteCooldown -= 1;
    return [];
  }
  const poids = (a: ActionDef) => CHANCE_OPPORTUNITE[a.rarete ?? "exceptionnelle"];
  const ouvertes = ACTIONS.filter((a) => a.opportunite && s.actionCooldown[a.id] === undefined && dispo(a));
  if (ouvertes.length === 0) return [];
  const choisie = rng.weighted(ouvertes.map((a) => ({ item: a, weight: poids(a) })));
  return rng.chance(poids(choisie)) ? [choisie.id] : [];
}

/** Démarre un semestre : briefing, symptômes, sélection des événements. */
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

  // Le menu du semestre : le socle, quatre actions tirées, et les opportunités
  // que la situation ouvre. Deux semestres ne se ressemblent jamais tout à fait.
  const dispo = (a: (typeof ACTIONS)[number]) => {
    if (a.cond && !a.cond(s)) return false;
    const utilise = s.actionCooldown[a.id];
    if (utilise !== undefined && a.cooldown && s.turnCount - utilise < a.cooldown) return false;
    return true;
  };
  const tirables = ACTIONS.filter((a) => !a.socle && !a.opportunite && dispo(a));
  const tires: string[] = [];
  while (tires.length < 4 && tirables.length > 0) {
    const choisi = rng.pick(tirables);
    tirables.splice(tirables.indexOf(choisi), 1);
    tires.push(choisi.id);
  }
  s.actionPool = [
    ...ACTIONS.filter((a) => a.socle).map((a) => a.id),
    ...tires,
    ...tirerOpportunite(s, rng, dispo),
  ];

  updateTrends(s);
  genBriefing(s, rng);
  selectTurnEvents(s, rng);
  s.phase = "briefing";
  s.currentEvent = null;
  s.rngCalls = rng.state();
}

/** Fin de semestre : simulation, vérification des fins, échéances électorales. */
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

  // Fin de mandat ? Dix semestres = cinq ans.
  if (s.turn >= 10) {
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
      // Un sortant se juge sur son bilan, pas sur sa cote du moment : les
      // partis d'en face investissent leur meilleur candidat quand ils sentent
      // qu'il y a une place à prendre. C'est le grief le mieux fondé qui décide
      // à la fois de la force de l'adversaire et de sa ligne de campagne.
      const ligne = ligneAdverse(s);
      score += Math.round(Math.min(14, (ligne?.force(s) ?? 0) * 0.45));
      ouvrirCampagne(s, rng, "reelection", opposantId, score, ligne?.theme);
      s.act = "campagne";
      s.phase = "briefing";
      s.press = [];
      // Le bilan se lit avant d'entrer en campagne : c'est le seul moment où
      // l'on vous dit franchement où vous en êtes.
      s.flags["bilan_a_lire"] = true;
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

      setFocus: (id) => {
        const g = get().game;
        if (!g) return;
        set({ game: { ...g, focusCharacter: id } });
      },

      newGame: () => {
        set({ game: makeInitialState(randomSeed()) });
      },

      abandon: () => set({ game: null }),

      submitBio: (bio) => {
        const s = clone(get().game!);
        const rng = rngOf(s);
        // Le casting a déjà été baptisé : le président ne peut pas porter le
        // nom de son propre ministre de l'Intérieur.
        const prisParLeCasting = new Set(Object.values(s.castNames).map((n) => n.nom));
        const nomsLibres = NOMS_FAMILLE.filter((n) => !prisParLeCasting.has(n));
        // Même précaution sur les prénoms : un conjoint homonyme d'un ministre
        // rend la moitié des textes confuse.
        const prenomsPris = new Set(Object.values(s.castNames).map((n) => n.prenom));
        const libres = (pool: string[]) => {
          const l = pool.filter((p) => !prenomsPris.has(p));
          return l.length > 0 ? l : pool;
        };
        if (!bio.prenom) bio.prenom = rng.pick(libres(bio.genre === "f" ? PRENOMS_F : PRENOMS_M));
        if (!bio.nom) bio.nom = rng.pick(nomsLibres.length > 0 ? nomsLibres : NOMS_FAMILLE);
        if (!bio.conjointPrenom) bio.conjointPrenom = rng.pick(libres(bio.genre === "f" ? PRENOMS_M : PRENOMS_F));
        applyBio(s, bio);
        s.act = "ascension";
        // Sept étapes, chacune tirée dans son propre vivier : la carrière
        // ne recommence jamais deux fois par le même gymnase municipal.
        s.queue = buildAscension(rng, s);
        s.flags["ascension_total"] = s.queue.length;
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
          convictionId: rng.pick(CONVICTIONS).id,
          conjointPrenom: "",
          conjointCarriere: rng.pick(["avocature", "médecine", "entreprise", "enseignement"]),
        };
        get().submitBio(bio);
      },

      chooseOption: (choiceId) => {
        const s = clone(get().game!);
        const ev = s.currentEvent ? getEvent(s.currentEvent) : null;
        if (!ev) return;
        const tous = [...ev.choices, ...(ev.dynamicChoices?.(s) ?? [])];
        const choice = tous.find((c) => c.id === choiceId);
        if (!choice) return;
        tickCheck(s);
        const rng = rngOf(s);
        const plan = planChoixCheck(s, rng, ev, choice);
        s.rngCalls = rng.state();
        if (plan) {
          // La décision est prise ; reste à la tenir. Le mini-jeu prend la main.
          s.pendingCheck = plan;
          set({ game: s });
          return;
        }
        appliquerChoix(s, choiceId);
        set({ game: s });
      },

      resolveCheck: (rang) => {
        const s = clone(get().game!);
        const plan = s.pendingCheck;
        if (!plan) return;
        s.pendingCheck = null;
        s.lastCheck = { rang, titre: plan.titre };
        switch (plan.cible.kind) {
          case "choix":
            appliquerChoix(s, plan.cible.choiceId, rang);
            break;
          case "action":
            appliquerAction(s, plan.cible.actionId, plan.cible.param, plan.cible.cout, rang);
            break;
          case "campagne":
            appliquerSemaine(s, plan.cible.actionId, plan.cible.segmentId, rang);
            break;
          case "debat":
            appliquerDebat(s, plan.cible.beats, rang);
            break;
        }
        set({ game: s });
      },

      continueAfter: () => {
        const s = clone(get().game!);
        s.resolution = null;
        s.lastDeltas = [];
        s.lastSignals = [];
        s.lastCheck = null;

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
          // La crise est traversée : elle consume le reste du semestre.
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
            // Les mesures qu'on vous met sur la table : jamais le vivier entier.
            const rng = rngOf(s);
            s.programmePool = tirerProgramme(rng);
            s.rngCalls = rng.state();
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
        tickCheck(s);
        const rng = rngOf(s);
        const plan = planActionCheck(s, rng, actionId, cout, param, action.nom);
        s.rngCalls = rng.state();
        if (plan) {
          s.pendingCheck = plan;
          set({ game: s });
          return;
        }
        appliquerAction(s, actionId, param, cout);
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
        const ctx = makeCtx(s, rng);

        // Un programme n'est pas une liste de vœux : il séduit des segments,
        // déplace votre ligne, et — surtout — se prononce à voix haute devant
        // des gens qui s'en souviendront.
        let inclinaison = 0;
        for (const id of promiseIds) {
          const def = PROMESSES.find((p) => p.id === id);
          if (!def) continue;
          for (const seg of def.segments) ctx.seg(seg, { soutien: 5, participation: 2 });
          inclinaison += def.bord ?? 0;
          const [tournure, lieu] = rng.pick(ENGAGEMENTS);
          ctx.dire(`promesse_${id}`, tournure(def.label), lieu);
        }
        const glissement = Math.max(-4, Math.min(4, Math.round(inclinaison / 2)));
        if (glissement !== 0) ctx.bord(glissement);

        const opposantId = rng.chance(0.6) ? "sallenave" : "andrieu";
        // Face à un candidat, on n'attaque pas un bilan : on attaque ce qu'il
        // promet, ce qu'il vaut et jusqu'où il va.
        const ligne = ligneAdverse(s, false);
        ouvrirCampagne(s, rng, "presidentielle", opposantId, opposantId === "sallenave" ? 46 : 50, ligne?.theme);
        s.rngCalls = rng.state();
        set({ game: s });
      },

      closeBilan: () => {
        const s = clone(get().game!);
        delete s.flags["bilan_a_lire"];
        set({ game: s });
      },

      closeAffiche: () => {
        const s = clone(get().game!);
        delete s.flags["affiche_a_voir"];
        set({ game: s });
      },

      campaignWeek: (actionId, segmentId) => {
        const s = clone(get().game!);
        tickCheck(s);
        const rng = rngOf(s);
        const plan = planCampagneCheck(s, rng, actionId, segmentId);
        s.rngCalls = rng.state();
        if (plan) {
          s.pendingCheck = plan;
          set({ game: s });
          return;
        }
        appliquerSemaine(s, actionId, segmentId);
        set({ game: s });
      },

      doDebate: (beats) => {
        const s = clone(get().game!);
        tickCheck(s);
        // Le débat se joue toujours en direct : pas de tirage, pas d'échappatoire.
        const rng = rngOf(s);
        s.pendingCheck = planDebatCheck(s, rng, beats);
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
        // Le pays tel qu'on vous le remet. Sans ce point de départ, le bilan
        // de fin de mandat ne serait qu'un relevé de compteurs.
        s.mandatBase = {
          mandat: s.mandat,
          turnCount: s.turnCount,
          country: { ...s.country },
          power: { ...s.power },
          segments: Object.fromEntries(Object.entries(s.segments).map(([id, seg]) => [id, seg.soutien])),
          derive: s.derive,
          bord: s.bord,
        };
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
      version: 5,
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
