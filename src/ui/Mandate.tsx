import { useState } from "react";
import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { ACTIONS, REFORMES } from "../content/france/actions";
import { EventView, PressList, StatsTabs, TopBar } from "./components";

export default function Mandate({ s }: { s: GameState }) {
  const beginEvents = useGame((g) => g.beginEvents);
  const continueAfter = useGame((g) => g.continueAfter);
  const doAction = useGame((g) => g.doAction);
  const finishTurn = useGame((g) => g.finishTurn);
  const [reformesOuvertes, setReformesOuvertes] = useState(false);
  const enCrise = s.act === "crise";

  return (
    <div className="max-w-5xl mx-auto pt-6 px-6 pb-16">
      <TopBar s={s} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div>
          {enCrise && s.crisis ? (
            <div className="fade-in">
              <div
                className="mb-4 px-4 py-2 rounded text-sm uppercase tracking-widest text-center"
                style={{ background: "var(--color-danger)", color: "#fff" }}
              >
                Crise en cours — {s.crisis.titre} · le temps passe au jour près
              </div>
              <EventView s={s} />
            </div>
          ) : s.phase === "briefing" ? (
            <div className="dossier p-6 fade-in">
              <div className="text-xs uppercase tracking-widest text-paper-500 mb-3">
                Le briefing du matin — T{s.trimestre} {s.year}
              </div>
              {typeof s.flags["election_recit"] === "string" && !s.flags["recit_vu"] && (
                <div className="mb-5 border-b border-ink-600 pb-4">
                  <div className="press-une text-2xl mb-2">
                    {s.mandat === 1 ? "Élu(e)." : "Réélu(e)."} {s.flags["election_t2"]} % au second tour.
                  </div>
                  <p className="text-sm text-paper-300">{s.flags["election_recit"]}</p>
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
            <div className="dossier p-6 fade-in">
              <div className="flex justify-between items-baseline mb-4">
                <h2 className="press-une text-2xl">Vos décisions du trimestre</h2>
                <span className="text-xs text-paper-500">{s.pc} point{s.pc > 1 ? "s" : ""} restant{s.pc > 1 ? "s" : ""}</span>
              </div>

              {s.resolution ? (
                <div className="fade-in">
                  <p className="text-[15px] leading-relaxed mb-5 border-l-2 pl-4 whitespace-pre-line" style={{ borderColor: "var(--color-accent-warm)" }}>
                    {s.resolution}
                  </p>
                  <button className="btn-primary" onClick={continueAfter}>
                    Continuer
                  </button>
                </div>
              ) : reformesOuvertes ? (
                <div className="space-y-2 fade-in">
                  <div className="text-xs text-paper-500 mb-2">Quel chantier ? (le trimestre n'y suffira pas — c'est le principe)</div>
                  {REFORMES.map((r) => {
                    const promiseLiee = s.promises.find((p) => p.id === r.promesse);
                    const dejaFaite = s.actionsUsed.some((a) => a === `reforme:${r.id}`) || (promiseLiee && promiseLiee.status !== "en_cours");
                    return (
                      <button
                        key={r.id}
                        className="btn-choice"
                        disabled={r.cout > s.pc || !!dejaFaite}
                        onClick={() => {
                          doAction("reforme", r.id);
                          setReformesOuvertes(false);
                        }}
                      >
                        <div className="font-semibold text-sm flex justify-between">
                          <span>
                            {r.nom}
                            {promiseLiee && <span className="text-[10px] ml-2" style={{ color: "var(--color-accent-warm)" }}>PROMESSE</span>}
                          </span>
                          <span className="text-xs text-paper-500">{r.cout} pts</span>
                        </div>
                        <div className="text-xs text-paper-500">{r.detail}</div>
                      </button>
                    );
                  })}
                  <button className="text-xs text-paper-500 underline" onClick={() => setReformesOuvertes(false)}>
                    ← Revenir
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {ACTIONS.filter((a) => !a.cond || a.cond(s)).map((a) => {
                    const cout = a.id === "reforme" ? 2 : a.cout;
                    return (
                      <button
                        key={a.id}
                        className="btn-choice"
                        disabled={cout > s.pc}
                        onClick={() => (a.id === "reforme" ? setReformesOuvertes(true) : doAction(a.id))}
                      >
                        <div className="font-semibold text-sm flex justify-between">
                          <span>{a.nom}</span>
                          <span className="text-xs text-paper-500">{a.id === "reforme" ? "2-3 pts" : `${a.cout} pt${a.cout > 1 ? "s" : ""}`}</span>
                        </div>
                        <div className="text-xs text-paper-500">{a.detail}</div>
                      </button>
                    );
                  })}
                  <div className="pt-3">
                    <button className="btn-primary" onClick={finishTurn}>
                      Terminer le trimestre {s.pc > 0 ? `(${s.pc} pt${s.pc > 1 ? "s" : ""} perdu${s.pc > 1 ? "s" : ""})` : ""}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <StatsTabs s={s} />
          {s.log.length > 0 && (
            <div className="dossier p-4">
              <div className="text-xs uppercase tracking-widest text-paper-500 mb-2">Ce que l'Histoire retiendra</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs text-paper-300">
                {[...s.log].reverse().slice(0, 12).map((l, i) => (
                  <div key={i}>· {l.text}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
