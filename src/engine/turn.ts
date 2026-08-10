import type { GameState, PressItem } from "./types";
import type { Rng } from "./rng";
import { clamp, agitationRapportee, croissanceAnnoncee } from "./ctx";
import { getEvent, standardEvents } from "./registry";

// ---------------------------------------------------------------------------
// Symptômes : la seule fenêtre du joueur sur les jauges cachées.
// Jamais de chiffres. Des signes, avec du bruit.
// ---------------------------------------------------------------------------

interface Symptome {
  cond: (s: GameState) => boolean;
  textes: string[];
}

const SYMPTOMES: Symptome[] = [
  { cond: (s) => s.hidden.coup > 30 && s.hidden.coup <= 55, textes: [
    "Le général Verdier a décliné le dîner de l'Élysée. Deuxième fois ce mois-ci.",
    "L'état-major a réservé ses créneaux de transmission sans passer par le protocole habituel.",
  ]},
  { cond: (s) => s.hidden.coup > 55, textes: [
    "Deux régiments ont mené des manœuvres non planifiées à quarante kilomètres de la capitale.",
    "Le chiffre du GIC signale des communications inhabituelles entre trois généraux de corps d'armée.",
  ]},
  { cond: (s) => s.hidden.assassinat > 30 && s.hidden.assassinat <= 55, textes: [
    "Un garde du corps a démissionné hier. Sans explication.",
    "Le service de protection a modifié vos itinéraires trois fois cette semaine. On ne vous a pas dit pourquoi.",
  ]},
  { cond: (s) => s.hidden.assassinat > 55, textes: [
    "La voiture de tête a changé de blindage. Personne ne vous en a parlé.",
    "Votre chef de la sécurité a demandé un entretien « personnel ». Puis l'a annulé.",
  ]},
  { cond: (s) => s.hidden.fatigue > 60 && s.hidden.fatigue <= 80, textes: [
    "Un hebdomadaire titre sur votre « mine des mauvais jours ».",
    "Vous avez relu trois fois la même note hier soir sans la comprendre.",
  ]},
  { cond: (s) => s.hidden.fatigue > 80, textes: [
    "Vous vous êtes endormi douze secondes en conseil. Roze jure que personne n'a filmé.",
    "Votre main tremblait sur les photos de la visite d'hier. Les agences les ont retirées, sauf une.",
  ]},
  { cond: (s) => s.hidden.sante < 55 && s.hidden.sante >= 35, textes: [
    "Le Dr Manin a demandé un second prélèvement. « Simple vérification. »",
    "Vous avez doublé la dose sans en parler à personne.",
  ]},
  { cond: (s) => s.hidden.sante < 35, textes: [
    "Le protocole a discrètement raccourci toutes vos apparitions debout.",
    "Une ambulance banalisée suit désormais le cortège. Elle est là depuis mardi.",
  ]},
  { cond: (s) => s.hidden.agitation > 45 && s.hidden.agitation <= 65, textes: [
    "Les préfets signalent des achats inhabituels de carburant en bidons dans trois départements.",
    "Un rond-point occupé près de Guéret. Un autre près de Valence. Personne ne revendique.",
  ]},
  { cond: (s) => s.hidden.agitation > 65, textes: [
    "Les renseignements territoriaux parlent d'un « frémissement général ». Mazeau a barré la mention au feutre.",
    "Trois permanences parlementaires ont été murées dans la nuit. Au parpaing.",
  ]},
  { cond: (s) => s.hidden.paranoia > 50, textes: [
    "Vous avez fait vérifier deux fois la liste des invités du dîner d'État.",
    "Vous avez demandé qui avait laissé cette fenêtre ouverte. C'était vous.",
  ]},
];

function genSymptomes(s: GameState, rng: Rng): PressItem[] {
  const eligibles = SYMPTOMES.filter((sy) => sy.cond(s));
  const items: PressItem[] = [];
  for (const sy of eligibles) {
    if (rng.chance(0.55) && items.length < 2) {
      items.push({ kind: "symptome", text: rng.pick(sy.textes), tone: "neutre" });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// La simulation semestrielle du pays
// ---------------------------------------------------------------------------

function simulateEconomy(s: GameState, rng: Rng): void {
  const c = s.country;
  const potentiel =
    1.3 +
    (c.services - 50) * 0.008 +
    (c.environnement - 50) * 0.003 -
    Math.max(0, s.hidden.agitation - 35) * 0.012 -
    Math.max(0, c.dette - 110) * 0.004 -
    s.derive * 0.05;
  c.croissance = clamp(c.croissance + (potentiel - c.croissance) * 0.25 + (rng.next() - 0.5) * 0.5, -8, 12);
  c.chomage = clamp(c.chomage + (1.1 - c.croissance) * 0.12 + (rng.next() - 0.5) * 0.2, 2, 30);
  c.inflation = clamp(c.inflation + (2.0 - c.inflation) * 0.2 + (rng.next() - 0.5) * 0.4, -2, 15);
  const deficit = Math.max(0, 4.8 - c.croissance - (c.marge - 30) * 0.04);
  c.dette = clamp(c.dette + deficit * 0.22, 20, 250);
  c.marge = clamp(c.marge + 1);
}

function driftGauges(s: GameState, rng: Rng): void {
  const h = s.hidden;
  // Un tour couvre six mois : tout s'accumule d'autant plus vite.
  h.fatigue = clamp(h.fatigue + 9 - Math.floor(s.player.endurance / 22));
  if (h.fatigue > 72) h.sante = clamp(h.sante - 4);
  else if (h.fatigue < 38) h.sante = clamp(h.sante + 1);
  if (s.bio.age > 60) h.sante = clamp(h.sante - 2);

  // L'agitation réelle suit la cohésion, le chômage, l'inflation.
  const pression =
    (50 - s.country.cohesion) * 0.06 +
    Math.max(0, s.country.chomage - 7) * 0.5 +
    Math.max(0, s.country.inflation - 2.5) * 0.8 +
    s.derive * 0.4;
  h.agitation = clamp(h.agitation + (pression > 0 ? pression * 0.7 : -2.5) + (rng.next() - 0.5) * 4);

  // Le risque de coup : armée mécontente + agitation + dérive + un général ambitieux.
  const verdier = s.characters["verdier"];
  const coupPression =
    Math.max(0, 45 - s.power.armee) * 0.08 +
    Math.max(0, h.agitation - 50) * 0.05 +
    s.derive * 0.3 +
    (verdier?.vivant && verdier.enPoste ? Math.max(0, verdier.ambition - 60) * 0.1 : 0);
  h.coup = clamp(h.coup + (coupPression > 0.5 ? coupPression * 0.9 : -1.5));

  // Le risque d'assassinat : dérive, cohésion, purges.
  const assPression = s.derive * 0.25 + Math.max(0, 35 - s.country.cohesion) * 0.05 + h.paranoia * 0.02;
  h.assassinat = clamp(h.assassinat + (assPression > 0.4 ? assPression * 0.7 : -0.8));

  h.paranoia = clamp(h.paranoia + s.derive * 0.35 - 0.8);

  // Popularité : lentement tirée par l'économie et la cohésion.
  const cible =
    38 +
    s.country.croissance * 4 -
    Math.max(0, s.country.chomage - 7) * 2 +
    (s.country.cohesion - 40) * 0.15 +
    (s.power.presse - 50) * 0.1;
  s.power.popularite = clamp(s.power.popularite + (cible - s.power.popularite) * 0.12);

  // Les ambitieux sentent la faiblesse.
  for (const c of Object.values(s.characters)) {
    if (!c.vivant) continue;
    if (s.power.popularite < 35 && c.ambition > 40) c.ambition = clamp(c.ambition + 2);
    if (c.rancune > 0 && rng.chance(0.3)) c.rancune = clamp(c.rancune - 1);
  }
}

// ---------------------------------------------------------------------------
// Le briefing du matin
// ---------------------------------------------------------------------------

const UNES_HOSTILES = [
  "« OÙ EST LE CAP ? » — Le Quotidien National",
  "« L'Élysée à contretemps » — L'Observateur",
  "« La panne » — Le Matin",
];
const UNES_NEUTRES = [
  "« semestre d'attente à l'Élysée » — Le Quotidien National",
  "« L'exécutif face à ses dossiers » — L'Écho Républicain",
];
const UNES_FAVORABLES = [
  "« Le pari tient — pour l'instant » — L'Écho Républicain",
  "« Un cap, enfin » — Le Matin",
];
const UNES_SERVILES = [
  "« LA FRANCE AVANCE, SEREINE » — communiqué repris par six quotidiens",
  "« Le Président au travail » — page 1, photo officielle fournie par l'Élysée",
];

/** Fige les indicateurs en début de semestre et calcule les tendances du précédent. */
export function updateTrends(s: GameState): void {
  const courant: Record<string, number> = { ...s.country, ...s.power };
  if (!s.trendBase) s.trendBase = {};
  if (!s.trends) s.trends = {};
  if (Object.keys(s.trendBase).length > 0) {
    const t: Record<string, number> = {};
    for (const [k, v] of Object.entries(courant)) t[k] = v - (s.trendBase[k] ?? v);
    s.trends = t;
  }
  s.trendBase = courant;
}

export function genBriefing(s: GameState, rng: Rng): void {
  s.press = [];
  // La une : dépend de la presse, de la popularité, et de la dérive.
  let une: string;
  let tone: PressItem["tone"];
  if (s.derive >= 8) {
    une = rng.pick(UNES_SERVILES);
    tone = "servile";
  } else if (s.power.presse < 35 || s.power.popularite < 32) {
    une = rng.pick(UNES_HOSTILES);
    tone = "hostile";
  } else if (s.power.presse > 62 && s.power.popularite > 48) {
    une = rng.pick(UNES_FAVORABLES);
    tone = "favorable";
  } else {
    une = rng.pick(UNES_NEUTRES);
    tone = "neutre";
  }
  s.press.push({ kind: "une", text: une, tone });

  // L'état du pays, tel qu'on vous le rapporte (biaisé).
  s.press.push({
    kind: "echo",
    text: `Note de Bercy : croissance estimée à ${croissanceAnnoncee(s).toFixed(1)} % (M. Danglade se dit « confiant »). Chômage : ${s.country.chomage.toFixed(1)} %. Dette : ${Math.round(s.country.dette)} % du PIB.`,
    tone: "neutre",
  });
  s.press.push({
    kind: "echo",
    text: `Note de l'Intérieur : climat social « ${agitationRapportee(s) < 35 ? "maîtrisé" : agitationRapportee(s) < 55 ? "sous surveillance" : "préoccupant"} » (indice Mazeau : ${agitationRapportee(s)}).`,
    tone: "neutre",
  });

  for (const item of genSymptomes(s, rng)) s.press.push(item);
}

// ---------------------------------------------------------------------------
// Sélection des événements du semestre
// ---------------------------------------------------------------------------

export function selectTurnEvents(s: GameState, rng: Rng): void {
  s.queue = [];

  // 1. Les conséquences différées arrivées à échéance.
  const still: typeof s.delayed = [];
  for (const d of s.delayed) {
    if (s.turnCount > d.maxTurn) continue; // fenêtre expirée, la bombe se désamorce
    if (s.turnCount >= d.minTurn && s.queue.length < 2 && rng.chance(d.chance)) {
      const ev = getEvent(d.eventId);
      if (ev && (!ev.cond || ev.cond(s)) && !(ev.once && s.fired.includes(ev.id))) {
        s.queue.push(d.eventId);
        continue;
      }
    }
    still.push(d);
  }
  s.delayed = still;

  // 2. Compléter avec des événements du pool (1 à 3 au total).
  //    Un événement déjà vu récemment est écarté ; un inédit est très favorisé.
  //    C'est ce qui empêche « la même proposition de loi » de tourner en boucle.
  const COOLDOWN = 10;
  const cible = s.queue.length >= 2 ? s.queue.length : rng.int(1, 2) + (rng.chance(0.35) ? 1 : 0);
  const pool = standardEvents().filter((e) => {
    if (s.queue.includes(e.id)) return false;
    if (e.once && s.fired.includes(e.id)) return false;
    const vu = s.lastSeen[e.id];
    if (vu !== undefined && s.turnCount - vu < COOLDOWN) return false;
    return !e.cond || e.cond(s);
  });

  while (s.queue.length < Math.min(cible, 3) && pool.length > 0) {
    const weights = pool.map((e) => {
      const base = typeof e.weight === "function" ? e.weight(s) : (e.weight ?? 1);
      const jamaisVu = s.lastSeen[e.id] === undefined;
      return { item: e, weight: base * (jamaisVu ? 4 : 1) };
    });
    const chosen = rng.weighted(weights);
    pool.splice(pool.indexOf(chosen), 1);
    s.queue.push(chosen.id);
  }

  for (const id of s.queue) {
    const ev = getEvent(id);
    if (ev?.once) s.fired.push(id);
    s.lastSeen[id] = s.turnCount;
  }
}

// ---------------------------------------------------------------------------
// Fin de semestre
// ---------------------------------------------------------------------------

export function endOfTurn(s: GameState, rng: Rng): void {
  simulateEconomy(s, rng);
  driftGauges(s, rng);

  // Suivi cumulé pour le comparatif final avec les présidents réels.
  s.flags["cum_croissance"] = (((s.flags["cum_croissance"] as number) ?? 0) + s.country.croissance);
  s.flags["cum_chomage"] = (((s.flags["cum_chomage"] as number) ?? 0) + s.country.chomage);
  s.flags["cum_n"] = (((s.flags["cum_n"] as number) ?? 0) + 1);

  s.pressArchive.push({ turn: s.turnCount, items: s.press });
  if (s.pressArchive.length > 8) s.pressArchive.shift();

  // Un tour = un semestre : deux par an, dix par mandat.
  s.semestre++;
  if (s.semestre > 2) {
    s.semestre = 1;
    s.year++;
    s.bio.age++;
  }
}
