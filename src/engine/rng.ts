// RNG déterministe (mulberry32) — la graine est stockée dans l'état de partie,
// ce qui permettra plus tard le défi quotidien (même graine pour tout le monde).

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number; // inclus
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly { item: T; weight: number }[]): T;
  state(): number;
}

export function makeRng(seed: number, calls = 0): Rng {
  const f = mulberry32(seed);
  let n = 0;
  for (let i = 0; i < calls; i++) {
    f();
    n++;
  }
  const next = () => {
    n++;
    return f();
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(items) {
      const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
      if (total <= 0) return items[0].item;
      let r = next() * total;
      for (const i of items) {
        r -= Math.max(0, i.weight);
        if (r <= 0) return i.item;
      }
      return items[items.length - 1].item;
    },
    state: () => n,
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
