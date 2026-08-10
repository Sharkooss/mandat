import { useState } from "react";
import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { ACTIONS, REFORMES, type ActionDef, type OpportuniteRarete } from "../content/france/actions";
import { CAST, CAST_TAGS, NATIONS } from "../content/france/data";
import { nomCompletDe, substituerNoms } from "../engine/noms";
import { DeltaChips, etiquetteRelation, EventView, Ledger, PressList, StatsTabs, Tag, TopBar } from "./components";
import { RichText } from "./RichText";

const REFORME_TONE: Record<string, string> = {
  ref_retraites: "var(--color-bad)",
  ref_hopital: "var(--color-social)",
  ref_impots: "var(--color-eco)",
  ref_police: "var(--color-secu)",
  ref_nucleaire: "var(--color-perso)",
  ref_rail: "var(--color-env)",
  ref_regularisation: "var(--color-monde)",
  ref_quotas: "var(--color-monde)",
  ref_proportionnelle: "var(--color-pouvoir)",
  ref_usines: "var(--color-eco)",
};

/** L'intitulé dit d'emblée à quel point l'occasion est improbable. */
const TITRE_OPPORTUNITE: Record<OpportuniteRarete, string> = {
  rare: "L'opportunité du moment",
  exceptionnelle: "Une occasion exceptionnelle",
  historique: "Une occasion historique",
};

function CostPips({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="rounded-full" style={{ width: 6, height: 6, background: "var(--color-perso)" }} />
      ))}
    </span>
  );
}

function ActionButton({
  a,
  s,
  onPick,
  surbrillance,
}: {
  a: ActionDef;
  s: GameState;
  onPick: (a: ActionDef) => void;
  surbrillance?: boolean;
}) {
  const cout = a.id === "reforme" ? 2 : a.cout;
  return (
    <button
      className="btn-choice"
      style={{
        "--tone": a.tone,
        background: surbrillance ? `color-mix(in srgb, ${a.tone} 12%, var(--color-surface-2))` : undefined,
      } as React.CSSProperties}
      disabled={cout > s.pc}
      onClick={() => onPick(a)}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none mt-0.5" style={{ color: a.tone }}>
          {a.icone}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[13px]">{a.nom}</span>
            <CostPips n={cout} />
          </div>
          <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--color-faint)" }}>
            {a.detail}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Mandate({ s }: { s: GameState }) {
  const beginEvents = useGame((g) => g.beginEvents);
  const continueAfter = useGame((g) => g.continueAfter);
  const doAction = useGame((g) => g.doAction);
  const finishTurn = useGame((g) => g.finishTurn);
  const [reformesOuvertes, setReformesOuvertes] = useState(false);
  const [personnagesPour, setPersonnagesPour] = useState<ActionDef | null>(null);
  const [nationsPour, setNationsPour] = useState<ActionDef | null>(null);
  const enCrise = s.act === "crise";

  // Le menu du semestre a été tiré au début du tour par le moteur.
  const proposees = (s.actionPool.length ? s.actionPool : ACTIONS.filter((a) => a.socle).map((a) => a.id))
    .map((id) => ACTIONS.find((a) => a.id === id))
    .filter((a): a is ActionDef => !!a && (!a.cond || a.cond(s)));
  const opportunites = proposees.filter((a) => a.opportunite);
  const ordinaires = proposees.filter((a) => !a.opportunite);

  const lancer = (a: ActionDef) => {
    if (a.needParam === "reforme") setReformesOuvertes(true);
    else if (a.needParam === "personnage") setPersonnagesPour(a);
    else if (a.needParam === "nation") setNationsPour(a);
    else doAction(a.id);
  };

  return (
    <div className="max-w-[1400px] mx-auto pt-6 px-5 pb-16">
      <TopBar s={s} />
      <div className="grid xl:grid-cols-[240px_minmax(0,1fr)_330px] lg:grid-cols-[minmax(0,1fr)_330px] gap-4">
        <div className="hidden xl:block">
          <Ledger s={s} />
        </div>
        <div className="min-w-0">
          {enCrise && s.crisis ? (
            <div className="fade-in">
              <div
                className="mb-4 px-4 py-2.5 rounded-xl text-[12px] uppercase tracking-[0.15em] text-center font-bold"
                style={{
                  background: "color-mix(in srgb, var(--color-bad) 18%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-bad) 45%, transparent)",
                  color: "var(--color-bad)",
                }}
              >
                ⚠ Crise — {substituerNoms(s.crisis.titre, s)} · jour {s.crisis.jour}
              </div>
              <EventView s={s} />
            </div>
          ) : s.phase === "briefing" ? (
            <div className="card p-6 fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Tag tone="var(--color-secu)">Briefing du matin</Tag>
                <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
                  T{s.semestre} {s.year}
                </span>
              </div>

              {typeof s.flags["election_recit"] === "string" && !s.flags["recit_vu"] && (
                <div className="mb-5 pb-4 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
                  <div className="press-une text-2xl mb-2" style={{ color: "var(--color-good)" }}>
                    {s.mandat === 1 ? "Élu(e)" : "Réélu(e)"} · {s.flags["election_t2"]} %
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--color-muted)" }}>
                    {s.flags["election_recit"]}
                  </p>
                </div>
              )}

              <PressList items={s.press} />
              <button className="btn-primary mt-6" onClick={beginEvents}>
                Ouvrir le conseil
              </button>
            </div>
          ) : s.phase === "evenements" && s.currentEvent ? (
            <EventView s={s} />
          ) : (
            <div className="card p-6 fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="press-une text-2xl">Vos décisions</h2>
                <div className="flex items-center gap-1.5">
                  <CostPips n={s.pc} />
                  <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
                    {s.pc} restant{s.pc > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {s.resolution ? (
                <div className="fade-in">
                  <RichText
                    className="text-[15px] leading-relaxed pl-4 border-l-2"
                    style={{ borderColor: "var(--accent)", color: "color-mix(in srgb, var(--color-text) 88%, transparent)" }}
                  >
                    {s.resolution}
                  </RichText>
                  <DeltaChips deltas={s.lastDeltas} signals={s.lastSignals} check={s.lastCheck} />
                  <button className="btn-primary mt-5" onClick={continueAfter}>
                    Continuer
                  </button>
                </div>
              ) : reformesOuvertes ? (
                <div className="space-y-2 fade-in">
                  <div className="label mb-2">Quel chantier ?</div>
                  {REFORMES.map((r) => {
                    const promiseLiee = s.promises.find((p) => p.id === r.promesse);
                    const dejaFaite = s.actionsUsed.some((a) => a === `reforme:${r.id}`) || (promiseLiee && promiseLiee.status !== "en_cours");
                    return (
                      <button
                        key={r.id}
                        className="btn-choice"
                        style={{ "--tone": REFORME_TONE[r.id] ?? "var(--color-monde)" } as React.CSSProperties}
                        disabled={r.cout > s.pc || !!dejaFaite}
                        onClick={() => {
                          doAction("reforme", r.id);
                          setReformesOuvertes(false);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[14px]">{r.nom}</span>
                          <CostPips n={r.cout} />
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                          {r.detail}
                        </div>
                        {promiseLiee && (
                          <div className="mt-1.5">
                            <Tag tone="var(--color-social)">★ Promesse de campagne</Tag>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={() => setReformesOuvertes(false)}>
                    ← Revenir
                  </button>
                </div>
              ) : personnagesPour ? (
                <div className="space-y-2 fade-in">
                  <div className="label mb-2">Qui ?</div>
                  {(personnagesPour.candidats?.(s) ?? []).map((id) => {
                    const c = CAST.find((x) => x.id === id);
                    if (!c) return null;
                    const st = s.characters[id];
                    const rel = st.loyaute >= 70 ? ["Dévoué", "var(--color-good)"] : st.loyaute >= 50 ? ["Loyal", "var(--color-env)"] : st.loyaute >= 30 ? ["Distant", "var(--color-warn)"] : ["Froid", "var(--color-bad)"];
                    return (
                      <button
                        key={id}
                        className="btn-choice"
                        style={{ "--tone": rel[1] } as React.CSSProperties}
                        onClick={() => {
                          doAction(personnagesPour.id, id);
                          setPersonnagesPour(null);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[13px]">{nomCompletDe(s, id)}</span>
                          <div className="flex gap-1">
                            <Tag tone={rel[1]}>{rel[0]}</Tag>
                            {st.ambition >= 65 && <Tag tone="var(--color-warn)">⚑ Ambitieux</Tag>}
                          </div>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                          {CAST_TAGS[id] ?? c.role}
                        </div>
                      </button>
                    );
                  })}
                  <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={() => setPersonnagesPour(null)}>
                    ← Revenir
                  </button>
                </div>
              ) : nationsPour ? (
                <div className="space-y-2 fade-in">
                  <div className="label mb-2">Quelle capitale ?</div>
                  {(nationsPour.candidats?.(s) ?? []).map((id) => {
                    const def = NATIONS.find((x) => x.id === id);
                    const st = s.europe.nations[id];
                    if (!def || !st) return null;
                    const [libelle, ton] = etiquetteRelation(st.relation);
                    const ecart = Math.abs(s.bord - st.bord);
                    return (
                      <button
                        key={id}
                        className="btn-choice"
                        style={{ "--tone": ton } as React.CSSProperties}
                        onClick={() => {
                          doAction(nationsPour.id, id);
                          setNationsPour(null);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[13px]">{def.nom}</span>
                          <div className="flex gap-1">
                            <Tag tone={ton}>{libelle}</Tag>
                            {def.poids >= 60 && <Tag tone="var(--color-monde)">Poids lourd</Tag>}
                          </div>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                          {def.capitale} · {ecart <= 3 ? "ligne proche de la vôtre" : ecart <= 6 ? "ligne différente" : "à l'opposé de vous"}
                        </div>
                      </button>
                    );
                  })}
                  <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={() => setNationsPour(null)}>
                    ← Revenir
                  </button>
                </div>
              ) : (
                <>
                  {opportunites.length > 0 && (
                    <div className="mb-3">
                      <div className="label mb-1.5" style={{ color: "var(--color-warn)" }}>
                        ✦ {TITRE_OPPORTUNITE[opportunites[0].rarete ?? "exceptionnelle"]}
                      </div>
                      <div className="text-[11px] mb-1.5" style={{ color: "var(--color-faint)" }}>
                        Une fenêtre que la situation vient d'ouvrir. Une fois saisie, elle ne se représentera pas.
                      </div>
                      <div className="space-y-2 stagger">
                        {opportunites.map((a) => (
                          <ActionButton key={a.id} a={a} s={s} onPick={lancer} surbrillance />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="label mb-1.5">Ce que vous pouvez faire</div>
                  <div className="grid sm:grid-cols-2 gap-2 stagger">
                    {ordinaires.map((a) => (
                      <ActionButton key={a.id} a={a} s={s} onPick={lancer} />
                    ))}
                  </div>
                  <div className="pt-4">
                    <button className="btn-primary" onClick={finishTurn}>
                      Terminer le semestre{s.pc > 0 ? ` · ${s.pc} pt${s.pc > 1 ? "s" : ""} perdu${s.pc > 1 ? "s" : ""}` : ""}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <StatsTabs s={s} />
          {s.log.length > 0 && (
            <div className="card p-4">
              <div className="label mb-2">Ce que l'Histoire retiendra</div>
              <div className="space-y-2 max-h-52 panneau-scroll text-[12px] leading-snug">
                {[...s.log].reverse().slice(0, 12).map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span style={{ color: "var(--accent)" }}>◆</span>
                    <span style={{ color: "var(--color-muted)" }}>{substituerNoms(l.text, s)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
