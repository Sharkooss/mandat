// Banc d'essai hors navigateur : on rejoue des mandats entiers, événements
// compris, pour voir ce que le contenu produit vraiment. Rejouable à volonté :
//   npx esbuild scripts/sim.ts --bundle --platform=node --format=esm --outfile=.sim.mjs && node .sim.mjs
import { applyBio, makeInitialState, rngOf } from "../src/engine/init";
import { makeCtx } from "../src/engine/ctx";
import { murirOpportunites, tirerActionsSemestre, tirerOpportunite, tirerReformes } from "../src/engine/menu";
import { endOfTurn, genBriefing, selectTurnEvents, updateTrends } from "../src/engine/turn";
import { ACTIONS, REFORMES, reformesOuvertes } from "../src/content/france/actions";
import { CONVICTIONS, EVENEMENTS_FONDATEURS, FORMATIONS, MENTORS, MILIEUX, REGIONS, tirerProgramme } from "../src/content/france/data";
import { ALL, getCrise, getEvent } from "../src/engine/registry";
import type { GameState } from "../src/engine/types";

const PARTIES = 300;

const stat = {
  semestres: 0,
  poolIncomplet: 0,
  avecPromesse: 0,
  promessesSoldees: 0,
  promessesTotal: 0,
  sansChantier: 0,
  erreurs: [] as string[],
};
const occasionsParMandat: number[] = [];
const occasionsVues: Record<string, number> = {};
const premierTour: Record<string, number> = {};
const chantiersEngages: Record<string, number> = {};
const armee: Record<string, number> = {};
const prete: Record<string, number> = {};
const suitesVues: Record<string, number> = {};

function demarrer(seed: number): GameState {
  const s = makeInitialState(seed);
  const rng = rngOf(s);
  applyBio(s, {
    prenom: "Test", nom: "Sujet", genre: rng.chance(0.5) ? "f" : "m", age: rng.int(42, 58),
    regionId: rng.pick(REGIONS).id, milieuId: rng.pick(MILIEUX).id, formationId: rng.pick(FORMATIONS).id,
    evenementId: rng.pick(EVENEMENTS_FONDATEURS).id, mentorId: rng.pick(MENTORS).id,
    convictionId: rng.pick(CONVICTIONS).id, conjointPrenom: "X", conjointCarriere: "avocature",
  });
  const programme = tirerProgramme(rng).slice(0, 6);
  s.promises = programme.map((id) => ({ id, status: "en_cours" as const }));
  stat.promessesTotal += programme.length;
  for (const id of programme) if (!REFORMES.some((r) => r.promesse === id)) stat.sansChantier++;
  s.act = "mandat";
  s.turn = 0;
  s.turnCount = 0;
  s.rngCalls = rng.state();
  return s;
}

/** Copie fidèle de store.startTurn. */
function startTurn(s: GameState): void {
  const rng = rngOf(s);
  s.turn += 1;
  s.turnCount += 1;
  s.actionsUsed = [];
  let pc = s.cohabitation ? 2 : 3;
  if (s.hidden.fatigue > 70) pc -= 1;
  if (s.hidden.sante < 40) pc -= 1;
  s.pc = Math.max(1, pc);
  const signaux = murirOpportunites(s, rng);
  s.actionPool = [...tirerActionsSemestre(s, rng), ...tirerOpportunite(s, rng)];
  s.reformePool = tirerReformes(s, rng);
  updateTrends(s);
  genBriefing(s, rng);
  for (const item of signaux) s.press.push(item);
  selectTurnEvents(s, rng);
  s.rngCalls = rng.state();
}

/** Joue tous les événements du semestre, crises comprises, au hasard. */
function jouerEvenements(s: GameState, n: number): void {
  let garde = 0;
  const suivant = (): string | null => {
    const criseId = s.flags["crise_a_lancer"];
    if (typeof criseId === "string") {
      delete s.flags["crise_a_lancer"];
      const def = getCrise(criseId);
      if (def) {
        s.crisis = { id: def.id, titre: def.titre, jour: 1, queue: [...def.events] };
        return s.crisis.queue.shift() ?? null;
      }
    }
    if (s.crisis) {
      const next = s.crisis.queue.shift();
      if (next) return next;
      s.crisis = null;
    }
    return s.queue.shift() ?? null;
  };
  for (let id = suivant(); id && garde++ < 60; id = suivant()) {
    const ev = getEvent(id);
    if (!ev) continue;
    s.currentEvent = id;
    const tous = [...ev.choices, ...(ev.dynamicChoices?.(s) ?? [])];
    if (tous.length === 0) continue;
    const rng = rngOf(s);
    const choix = rng.pick(tous);
    try {
      choix.effects(makeCtx(s, rng));
      if (id === "chantier_secousse" || id === "chantier_dividende") suitesVues[id] = (suitesVues[id] ?? 0) + 1;
    } catch (e) {
      stat.erreurs.push(`${id}/${choix.id} @T${n} : ${(e as Error).message}`);
    }
    s.rngCalls = rng.state();
  }
  s.currentEvent = null;
}

for (let n = 0; n < PARTIES; n++) {
  const s = demarrer(2000 + n);
  let occasions = 0;

  for (let t = 1; t <= 10 && !s.gameOver; t++) {
    startTurn(s);
    stat.semestres++;

    const ouvertes = reformesOuvertes(s);
    if (s.reformePool.length !== Math.min(4, ouvertes.length)) stat.poolIncomplet++;
    const promisesOuvertes = ouvertes.filter((r) => s.promises.some((p) => p.id === r.promesse && p.status === "en_cours"));
    if (promisesOuvertes.length > 0 && s.reformePool.some((id) => promisesOuvertes.some((r) => r.id === id))) stat.avecPromesse++;

    for (const id of s.actionPool) {
      const a = ACTIONS.find((x) => x.id === id);
      if (!a?.opportunite) continue;
      occasions++;
      occasionsVues[id] = (occasionsVues[id] ?? 0) + 1;
      premierTour[id] = Math.min(premierTour[id] ?? 99, s.turnCount);
    }
    // Où ça coince : le drapeau n'est jamais posé, ou bien il l'est mais la
    // jauge ne suit pas ?
    for (const a of ACTIONS) {
      if (!a.opportunite || !a.declencheur || s.actionCooldown[a.id] !== undefined) continue;
      const arme = (Array.isArray(a.declencheur) ? a.declencheur : [a.declencheur]).some((f) => !!s.flags[f]);
      if (!arme) continue;
      armee[a.id] = (armee[a.id] ?? 0) + 1;
      if (!a.cond || a.cond(s)) prete[a.id] = (prete[a.id] ?? 0) + 1;
    }

    jouerEvenements(s, t);

    // Le joueur dépense ses points : une occasion s'il y en a une, sinon un
    // chantier un semestre sur deux, sinon une action ordinaire.
    const rng = rngOf(s);
    const occ = s.actionPool.map((id) => ACTIONS.find((a) => a.id === id)).find((a) => a?.opportunite);
    const jouer = (a: (typeof ACTIONS)[number], param?: string) => {
      try {
        a.effects(makeCtx(s, rng), param);
      } catch (e) {
        stat.erreurs.push(`action ${a.id}${param ? `/${param}` : ""} : ${(e as Error).message}`);
      }
      s.pc -= a.cout;
      s.actionCooldown[a.id] = s.turnCount;
      if (a.opportunite) s.opportuniteCooldown = rng.int(2, 4);
    };
    if (occ && occ.cout <= s.pc) jouer(occ);
    if (s.reformePool.length > 0 && rng.chance(0.55)) {
      const r = REFORMES.find((x) => x.id === rng.pick(s.reformePool));
      if (r && r.cout <= s.pc && (!r.cond || r.cond(s))) {
        try {
          r.effects(makeCtx(s, rng));
        } catch (e) {
          stat.erreurs.push(`chantier ${r.id} : ${(e as Error).message}`);
        }
        s.pc -= r.cout;
        s.reformesFaites.push(r.id);
        chantiersEngages[r.id] = (chantiersEngages[r.id] ?? 0) + 1;
      }
    }
    s.rngCalls = rng.state();

    const fin = rngOf(s);
    endOfTurn(s, fin);
    s.rngCalls = fin.state();
    jouerEvenements(s, t);
  }
  occasionsParMandat.push(occasions);
  stat.promessesSoldees += s.promises.filter((p) => p.status !== "en_cours").length;
}

const moy = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);

console.log("--- chantiers ---");
console.log("promesses sans aucun chantier :", stat.sansChantier, "/", stat.promessesTotal);
console.log("semestres où le vivier n'est pas plein :", stat.poolIncomplet, "/", stat.semestres);
console.log("semestres proposant une promesse ouverte :", ((stat.avecPromesse / stat.semestres) * 100).toFixed(1), "%");
console.log("promesses soldées par mandat :", (stat.promessesSoldees / PARTIES).toFixed(2), "/ 6");
const generes = Object.entries(chantiersEngages).filter(([id]) => id.startsWith("prog_"));
console.log(
  "chantiers engagés : écrits",
  Object.entries(chantiersEngages).filter(([id]) => id.startsWith("ref_")).reduce((a, [, n]) => a + n, 0),
  "· engendrés",
  generes.reduce((a, [, n]) => a + n, 0),
  `(${generes.length} distincts)`
);
console.log("suites de chantier jouées :", JSON.stringify(suitesVues));

console.log("\n--- occasions ---");
console.log("occasions par mandat :", moy(occasionsParMandat));
console.log("mandats sans aucune occasion :", occasionsParMandat.filter((x) => x === 0).length, "/", PARTIES);
const parRarete: Record<string, number> = {};
const plusTot: Record<string, number> = {};
for (const [id, v] of Object.entries(occasionsVues)) {
  const r = ACTIONS.find((a) => a.id === id)?.rarete ?? "exceptionnelle";
  parRarete[r] = (parRarete[r] ?? 0) + v;
  plusTot[r] = Math.min(plusTot[r] ?? 99, premierTour[id]);
}
console.log("par rareté :", parRarete);
console.log("apparition la plus précoce, par rareté :", plusTot);
const armees = ACTIONS.filter((a) => a.opportunite && a.declencheur);
console.log(`occasions armées par un événement : ${armees.length} / ${ACTIONS.filter((a) => a.opportunite).length}`);
console.log(
  "occasions armées effectivement vues :",
  armees.filter((a) => occasionsVues[a.id]).length,
  "/",
  armees.length
);
console.log("\nsemestres armés / dont la jauge suit / fois tirée :");
for (const a of armees) {
  console.log(
    `  ${a.id.padEnd(24)} ${String(armee[a.id] ?? 0).padStart(5)} ${String(prete[a.id] ?? 0).padStart(5)} ${String(occasionsVues[a.id] ?? 0).padStart(4)}`
  );
}

console.log("\n--- intégrité du contenu ---");
const ids = new Set(ALL.map((e) => e.id));
const corps = [
  ...ALL.flatMap((e) => (e.choices ?? []).map((c) => c.effects?.toString() ?? "")),
  ...ACTIONS.map((a) => a.effects.toString()),
  ...REFORMES.map((r) => r.effects.toString()),
].join("\n");
const refs = new Set<string>();
for (const m of corps.matchAll(/\.(?:sched|chain)\(\s*"([a-z_0-9]+)"/g)) refs.add(m[1]);
const orphelins = [...refs].filter((r) => !ids.has(r));
console.log("événements référencés introuvables :", orphelins.length, orphelins.join(" "));

// Un déclencheur qui pointe vers un drapeau que personne ne pose est une
// occasion morte : elle n'apparaîtra jamais et rien ne le signalera.
const poses = new Set<string>(["insurrection_alerte", "isolement_alerte", "election_etrangere"]);
for (const m of corps.matchAll(/\.flag\(\s*"([a-z_0-9]+)"/g)) poses.add(m[1]);
for (const m of corps.matchAll(/flags\[\s*"([a-z_0-9]+)"\s*\]\s*=/g)) poses.add(m[1]);
const morts: string[] = [];
for (const a of armees) {
  for (const f of Array.isArray(a.declencheur) ? a.declencheur : [a.declencheur!]) {
    if (!poses.has(f)) morts.push(`${a.id} → ${f}`);
  }
}
console.log("déclencheurs pointant vers un drapeau jamais posé :", morts.length, morts.join(" · "));
console.log("erreurs levées pendant la simulation :", stat.erreurs.length);
for (const e of stat.erreurs.slice(0, 10)) console.log("  ·", e);
