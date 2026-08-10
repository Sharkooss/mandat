import { useState } from "react";
import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { ACTIONS, REFORMES } from "../content/france/actions";
import { DeltaChips, EventView, PressList, StatsTabs, Tag, TopBar } from "./components";

const ACTION_META: Record<string, { icone: string; tone: string }> = {
  reforme: { icone: "▣", tone: "var(--color-monde)" },
  remaniement: { icone: "♟", tone: "var(--color-pouvoir)" },
  deplacement: { icone: "◎", tone: "var(--color-social)" },
  renflouer: { icone: "◈", tone: "var(--color-eco)" },
  sommet: { icone: "⚑", tone: "var(--color-monde)" },
  seconde_source: { icone: "◐", tone: "var(--color-secu)" },
  repos: { icone: "☾", tone: "var(--color-env)" },
  famille: { icone: "❦", tone: "var(--color-env)" },
};

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

function CostPips({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 items-center">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="rounded-full" style={{ width: 6, height: 6, background: "var(--color-perso)" }} />
      ))}
    </span>
  );
}

export default function Mandate({ s }: { s: GameState }) {
  const beginEvents = useGame((g) => g.beginEvents);
  const continueAfter = useGame((g) => g.continueAfter);
  const doAction = useGame((g) => g.doAction);
  const finishTurn = useGame((g) => g.finishTurn);
  const [reformesOuvertes, setReformesOuvertes] = useState(false);
  const enCrise = s.act === "crise";

  return (
    <div className="max-w-5xl mx-auto pt-6 px-5 pb-16">
      <TopBar s={s} />
      <div className="grid lg:grid-cols-[1fr_330px] gap-5">
        <div>
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
                ⚠ Crise — {s.crisis.titre} · jour {s.crisis.jour}
              </div>
              <EventView s={s} />
            </div>
          ) : s.phase === "briefing" ? (
            <div className="card p-6 fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Tag tone="var(--color-secu)">Briefing du matin</Tag>
                <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
                  T{s.trimestre} {s.year}
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
                  <p
                    className="text-[15px] leading-relaxed pl-4 border-l-2"
                    style={{ borderColor: "var(--accent)", color: "color-mix(in srgb, var(--color-text) 88%, transparent)" }}
                  >
                    {s.resolution}
                  </p>
                  <DeltaChips deltas={s.lastDeltas} signals={s.lastSignals} />
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
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-2 stagger">
                    {ACTIONS.filter((a) => !a.cond || a.cond(s)).map((a) => {
                      const cout = a.id === "reforme" ? 2 : a.cout;
                      const meta = ACTION_META[a.id] ?? { icone: "◆", tone: "var(--color-monde)" };
                      return (
                        <button
                          key={a.id}
                          className="btn-choice"
                          style={{ "--tone": meta.tone } as React.CSSProperties}
                          disabled={cout > s.pc}
                          onClick={() => (a.id === "reforme" ? setReformesOuvertes(true) : doAction(a.id))}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-lg leading-none mt-0.5" style={{ color: meta.tone }}>
                              {meta.icone}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[13px]">{a.nom}</span>
                                <CostPips n={a.id === "reforme" ? 2 : a.cout} />
                              </div>
                              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--color-faint)" }}>
                                {a.detail}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-4">
                    <button className="btn-primary" onClick={finishTurn}>
                      Terminer le trimestre{s.pc > 0 ? ` · ${s.pc} pt${s.pc > 1 ? "s" : ""} perdu${s.pc > 1 ? "s" : ""}` : ""}
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
              <div className="space-y-2 max-h-52 overflow-y-auto text-[12px] leading-snug pr-1">
                {[...s.log].reverse().slice(0, 12).map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span style={{ color: "var(--accent)" }}>◆</span>
                    <span style={{ color: "var(--color-muted)" }}>{l.text}</span>
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
