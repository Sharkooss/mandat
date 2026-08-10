import type { Ctx, GameState, PressTone, PromiseStatus } from "./types";
import type { Rng } from "./rng";
import { SEGMENTS_DROITE, SEGMENTS_GAUCHE } from "./bord";

export function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

/** Construit le contexte d'effets passé à tous les choix d'événements. */
export function makeCtx(s: GameState, rng: Rng): Ctx {
  const ctx: Ctx = {
    s,
    rng,
    adj(d) {
      if (d.player)
        for (const [k, v] of Object.entries(d.player)) {
          const key = k as keyof typeof s.player;
          s.player[key] = clamp(s.player[key] + (v ?? 0));
        }
      if (d.country)
        for (const [k, v] of Object.entries(d.country)) {
          const key = k as keyof typeof s.country;
          if (key === "croissance" || key === "inflation") {
            s.country[key] = clamp(s.country[key] + (v ?? 0), -8, 12);
          } else if (key === "chomage") {
            s.country[key] = clamp(s.country[key] + (v ?? 0), 2, 30);
          } else if (key === "dette") {
            s.country[key] = clamp(s.country[key] + (v ?? 0), 20, 250);
          } else {
            s.country[key] = clamp(s.country[key] + (v ?? 0));
          }
        }
      if (d.power)
        for (const [k, v] of Object.entries(d.power)) {
          const key = k as keyof typeof s.power;
          if (key === "sieges") {
            s.power.sieges = clamp(s.power.sieges + (v ?? 0), 0, 577);
          } else {
            s.power[key] = clamp(s.power[key] + (v ?? 0));
          }
        }
      if (d.hidden)
        for (const [k, v] of Object.entries(d.hidden)) {
          const key = k as keyof typeof s.hidden;
          s.hidden[key] = clamp(s.hidden[key] + (v ?? 0));
        }
    },
    sched(eventId, minIn, maxIn, chance = 0.35) {
      // Les délais sont écrits en semestres dans le contenu ; un tour couvre
      // désormais un semestre, on les ramène donc à l'échelle du tour.
      const ech = (n: number) => Math.max(1, Math.round(n * 0.55));
      s.delayed.push({
        eventId,
        minTurn: s.turnCount + ech(minIn),
        maxTurn: s.turnCount + ech(maxIn),
        chance,
      });
    },
    rel(id, d) {
      const c = s.characters[id];
      if (!c || !c.vivant) return;
      if (d.loyaute) c.loyaute = clamp(c.loyaute + d.loyaute);
      if (d.ambition) c.ambition = clamp(c.ambition + d.ambition);
      if (d.rancune) c.rancune = clamp(c.rancune + d.rancune);
    },
    flag(key, value = true) {
      s.flags[key] = value;
    },
    getFlag(key) {
      return s.flags[key];
    },
    press(text, tone: PressTone = "neutre") {
      s.press.push({ kind: "echo", text, tone });
    },
    log(text) {
      s.log.push({ turn: s.turnCount, text });
    },
    promesse(id, status: PromiseStatus) {
      const p = s.promises.find((p) => p.id === id);
      if (p && p.status === "en_cours") p.status = status;
    },
    seg(id, d) {
      const seg = s.segments[id];
      if (!seg) return;
      if (d.soutien) seg.soutien = clamp(seg.soutien + d.soutien);
      if (d.participation) seg.participation = clamp(seg.participation + d.participation);
    },
    derive(n) {
      s.derive = clamp(s.derive + n, 0, 12);
      if (s.derive >= 8) s.flags["derive_haut"] = true;
      if (n > 0) {
        // Les urbains diplômés sont le thermomètre de la Tentation.
        ctx.seg("urbains", { soutien: -2 * n });
        ctx.adj({ hidden: { paranoia: n } });
      }
    },
    bord(n) {
      const avant = s.bord;
      s.bord = clamp(s.bord + n, -10, 10);
      const d = s.bord - avant;
      if (d === 0) return;
      // Se déplacer, c'est choisir son camp : on gagne les siens et on perd
      // les autres, à peu près dans les mêmes proportions.
      const gagnes = d < 0 ? SEGMENTS_GAUCHE : SEGMENTS_DROITE;
      const perdus = d < 0 ? SEGMENTS_DROITE : SEGMENTS_GAUCHE;
      const ampleur = Math.abs(d);
      for (const id of gagnes) ctx.seg(id, { soutien: ampleur * 1.6, participation: ampleur });
      for (const id of perdus) ctx.seg(id, { soutien: -ampleur * 1.3 });
      // Les corps intermédiaires n'attendent pas les sondages pour se ranger.
      ctx.adj({ power: { syndicats: -d * 2, patronat: d * 2 } });
      if (Math.abs(s.bord) >= 8) s.flags["bord_extreme"] = true;
      if (Math.abs(s.bord) >= 5) s.flags["bord_radical"] = true;
    },
    crise(id) {
      s.flags["crise_a_lancer"] = id;
    },
    chain(eventId) {
      s.queue.unshift(eventId);
    },
  };
  return ctx;
}

/** Le rapport officiel sur l'agitation — toujours biaisé par l'Intérieur. */
export function agitationRapportee(s: GameState): number {
  const biais = s.characters["mazeau"]?.vivant && s.characters["mazeau"]?.enPoste ? 0.75 : 0.95;
  return Math.round(s.hidden.agitation * biais);
}

/** La croissance annoncée par Bercy — toujours un peu optimiste. */
export function croissanceAnnoncee(s: GameState): number {
  const biais = s.characters["danglade"]?.enPoste ? 0.4 : 0.1;
  return Math.round((s.country.croissance + biais) * 10) / 10;
}
