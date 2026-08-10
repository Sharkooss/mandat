import { useMemo, useState } from "react";
import type { Bio, Rarete } from "../engine/types";
import { useGame } from "../store";
import {
  REGIONS,
  MILIEUX,
  FORMATIONS,
  EVENEMENTS_FONDATEURS,
  MENTORS,
  CONVICTIONS,
  POIDS_RARETE,
  type CreationOption,
} from "../content/france/data";
import { makeRng } from "../engine/rng";
import { bordMeta } from "../engine/bord";
import { BordAxis, RareteBadge, Tag } from "./components";

const STEPS = [
  { key: "identite", titre: "Qui êtes-vous ?", sous: "", options: [] as CreationOption[] },
  { key: "regionId", titre: "D'où venez-vous ?", sous: "Quatre origines vous sont proposées. Chacune donne et chacune coûte.", options: REGIONS },
  { key: "milieuId", titre: "Quel monde vous a élevé ?", sous: "", options: MILIEUX },
  { key: "formationId", titre: "Qu'avez-vous appris ?", sous: "", options: FORMATIONS },
  { key: "evenementId", titre: "Qu'est-ce qui vous a forgé ?", sous: "", options: EVENEMENTS_FONDATEURS },
  { key: "mentorId", titre: "Qui vous a ouvert les portes ?", sous: "", options: MENTORS },
  {
    key: "convictionId",
    titre: "Pourquoi faites-vous de la politique ?",
    sous: "Le seul choix qui décide d'emblée de votre ligne — et de la moitié des événements que vous verrez.",
    options: CONVICTIONS,
  },
] as const;

/** Combien d'options proposer à chaque écran. */
const PROPOSITIONS = 4;

const RARETE_TONE: Record<Rarete, string> = {
  commune: "var(--color-r-commune)",
  peu_commune: "var(--color-r-peu)",
  rare: "var(--color-r-rare)",
  legendaire: "var(--color-r-legend)",
};

/** Tire N options sans remise, pondérées par la rareté. */
function tirage(options: CreationOption[], seed: number): CreationOption[] {
  const rng = makeRng(seed);
  const pool = [...options];
  const out: CreationOption[] = [];
  for (let i = 0; i < PROPOSITIONS && pool.length > 0; i++) {
    const choisi = rng.weighted(pool.map((o) => ({ item: o, weight: POIDS_RARETE[o.rarete] })));
    out.push(choisi);
    pool.splice(pool.indexOf(choisi), 1);
  }
  return out;
}

/** Le signe est porté par la pastille, pas par le texte : on évite « ＋ + réseau ». */
function sansSigne(texte: string): string {
  return texte.replace(/^[+−-]\s*/, "");
}

/** L'étiquette de ligne politique portée par une option. */
function BordTag({ bord }: { bord: number }) {
  const meta = bordMeta(bord * 3);
  return (
    <Tag tone={meta.tone} aide="Cette origine incline votre ligne politique de départ. Les inclinaisons de vos six choix s'additionnent.">
      {bord < 0 ? "◀" : "▶"} {meta.court} {bord > 0 ? "+" : ""}
      {bord}
    </Tag>
  );
}

export default function Creation() {
  const submitBio = useGame((g) => g.submitBio);
  const randomBio = useGame((g) => g.randomBio);
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [relances, setRelances] = useState(3);
  const [bio, setBio] = useState<Bio>({
    prenom: "",
    nom: "",
    genre: "m",
    age: 47,
    regionId: "",
    milieuId: "",
    formationId: "",
    evenementId: "",
    mentorId: "",
    convictionId: "",
    conjointPrenom: "",
    conjointCarriere: "avocature",
  });

  const current = STEPS[step];
  const propositions = useMemo(
    () => (current.options.length ? tirage([...current.options], seed + step * 7919) : []),
    [current.options, seed, step]
  );

  // La ligne se construit choix après choix : on la montre en train de bouger.
  const bordCourant = useMemo(() => {
    const pools = [REGIONS, MILIEUX, FORMATIONS, EVENEMENTS_FONDATEURS, MENTORS, CONVICTIONS];
    const ids = [bio.regionId, bio.milieuId, bio.formationId, bio.evenementId, bio.mentorId, bio.convictionId];
    let total = 0;
    for (let i = 0; i < pools.length; i++) total += pools[i].find((o) => o.id === ids[i])?.bord ?? 0;
    return Math.max(-10, Math.min(10, total));
  }, [bio]);

  const pick = (key: string, id: string) => {
    const next = { ...bio, [key]: id };
    setBio(next);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submitBio(next);
  };

  const relancer = () => {
    if (relances <= 0) return;
    setRelances(relances - 1);
    setSeed(Math.floor(Math.random() * 1e9));
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 px-5 pb-16 fade-in" key={step}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <span className="label">Acte I — Origines</span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  background: i <= step ? "var(--accent)" : "var(--color-line)",
                }}
              />
            ))}
          </div>
        </div>
        <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={randomBio}>
          Tout aléatoire →
        </button>
      </div>

      <h1 className="press-une text-3xl mb-1">{current.titre}</h1>
      {current.sous && (
        <p className="text-[13px] mb-5" style={{ color: "var(--color-faint)" }}>
          {current.sous}
        </p>
      )}
      {!current.sous && <div className="mb-5" />}

      {current.key === "identite" ? (
        <div className="card p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Prénom</span>
              <input
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-line)", color: "var(--color-text)" }}
                value={bio.prenom}
                placeholder="aléatoire si vide"
                onChange={(e) => setBio({ ...bio, prenom: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">Nom</span>
              <input
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-line)", color: "var(--color-text)" }}
                value={bio.nom}
                placeholder="aléatoire si vide"
                onChange={(e) => setBio({ ...bio, nom: e.target.value })}
              />
            </label>
          </div>

          <div className="flex gap-6 items-center flex-wrap">
            <div className="flex gap-2">
              {(["f", "m"] as const).map((genre) => (
                <button
                  key={genre}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
                  style={{
                    background: bio.genre === genre ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "var(--color-surface-2)",
                    border: `1px solid ${bio.genre === genre ? "var(--accent)" : "var(--color-line)"}`,
                    color: bio.genre === genre ? "var(--accent)" : "var(--color-muted)",
                  }}
                  onClick={() => setBio({ ...bio, genre })}
                >
                  {genre === "f" ? "Une femme" : "Un homme"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-[12px] whitespace-nowrap" style={{ color: "var(--color-muted)" }}>
                {bio.age} ans
              </span>
              <input type="range" min={38} max={68} value={bio.age} className="flex-1 accent-[var(--accent)]" onChange={(e) => setBio({ ...bio, age: +e.target.value })} />
            </label>
          </div>

          <div>
            <span className="label">La carrière de votre conjoint(e)</span>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {["avocature", "médecine", "entreprise", "enseignement"].map((c) => (
                <button
                  key={c}
                  className="px-3 py-1.5 rounded-lg text-[12px] capitalize transition-colors"
                  style={{
                    background: bio.conjointCarriere === c ? "color-mix(in srgb, var(--color-env) 20%, transparent)" : "var(--color-surface-2)",
                    border: `1px solid ${bio.conjointCarriere === c ? "var(--color-env)" : "var(--color-line)"}`,
                    color: bio.conjointCarriere === c ? "var(--color-env)" : "var(--color-muted)",
                  }}
                  onClick={() => setBio({ ...bio, conjointCarriere: c })}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={() => setStep(1)}>
            Commencer
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 stagger">
            {propositions.map((opt) => (
              <button
                key={opt.id}
                className="btn-choice"
                style={{ "--tone": RARETE_TONE[opt.rarete] } as React.CSSProperties}
                onClick={() => pick(current.key, opt.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5" style={{ color: RARETE_TONE[opt.rarete] }}>
                    {opt.icone}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14px]">{opt.nom}</span>
                      {opt.rarete !== "commune" && <RareteBadge rarete={opt.rarete} />}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                      {opt.detail}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Tag tone="var(--color-good)">＋ {sansSigne(opt.effets)}</Tag>
                      {opt.cout && <Tag tone="var(--color-bad)">− {sansSigne(opt.cout)}</Tag>}
                      {!!opt.bord && <BordTag bord={opt.bord} />}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {step > 1 && (
            <div className="card-flat p-3 mt-4">
              <BordAxis bord={bordCourant} compact />
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button className="btn-ghost" disabled={relances <= 0} onClick={relancer}>
              ↻ Relancer le tirage {relances > 0 ? `(${relances})` : ""}
            </button>
            {step > 1 && (
              <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={() => setStep(step - 1)}>
                ← Revenir
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
