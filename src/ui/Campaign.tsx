import { useState } from "react";
import type { GameState } from "../engine/types";
import { useGame, DEBATE_OFFSET } from "../store";
import { PROMESSES, CAST, SEGMENTS } from "../content/france/data";
import { CAMPAIGN_ACTIONS, DEBATE_BEATS, sondageAffiche } from "../engine/campaign";
import { makeRng } from "../engine/rng";
import { EventView } from "./components";

function Programme({ s }: { s: GameState }) {
  const chooseProgram = useGame((g) => g.chooseProgram);
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => {
    const def = PROMESSES.find((p) => p.id === id)!;
    if (sel.includes(id)) return setSel(sel.filter((x) => x !== id));
    if (sel.length >= 6) return;
    if (def.miroir && sel.includes(def.miroir)) return;
    setSel([...sel, id]);
  };
  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 fade-in">
      <div className="text-xs uppercase tracking-widest text-paper-500 mb-2">Acte III — La campagne</div>
      <h1 className="press-une text-3xl mb-2">Le programme</h1>
      <p className="text-sm text-paper-500 mb-6 max-w-xl">
        Choisissez six mesures. Elles deviendront vos promesses — suivies pendant tout le mandat, vérifiées par la presse et par
        les électeurs. Tenir coûte cher. Trahir aussi. C'est le principe.
      </p>
      <div className="grid md:grid-cols-2 gap-2 mb-6">
        {PROMESSES.map((p) => {
          const active = sel.includes(p.id);
          const blocked = (p.miroir && sel.includes(p.miroir)) || (!active && sel.length >= 6);
          return (
            <button
              key={p.id}
              className="btn-choice"
              disabled={!!blocked && !active}
              style={active ? { borderColor: "var(--color-accent-warm)", background: "var(--color-ink-700)" } : {}}
              onClick={() => toggle(p.id)}
            >
              <div className="font-semibold text-sm flex justify-between">
                <span>{p.label}</span>
                {active && <span style={{ color: "var(--color-accent-warm)" }}>✓</span>}
              </div>
              <div className="text-[11px] text-paper-500 mt-1">
                Tenir : {p.tenir} · Trahir : {p.trahir}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pb-10">
        <button className="btn-primary" disabled={sel.length !== 6} onClick={() => chooseProgram(sel)}>
          Partir en campagne ({sel.length}/6)
        </button>
      </div>
    </div>
  );
}

function Debat({ s }: { s: GameState }) {
  const doDebate = useGame((g) => g.doDebate);
  const continueAfter = useGame((g) => g.continueAfter);
  const [beats, setBeats] = useState<string[]>([]);
  const opposant = CAST.find((c) => c.id === s.campaign!.opposantId)?.nom ?? "Maryse Cottin";

  if (s.resolution) {
    return (
      <div className="dossier p-6 fade-in">
        <h2 className="press-une text-2xl mb-4">Le débat — verdict</h2>
        <p className="text-[15px] leading-relaxed mb-5 border-l-2 pl-4" style={{ borderColor: "var(--color-accent-warm)" }}>
          {s.resolution}
        </p>
        <button className="btn-primary" onClick={continueAfter}>
          Continuer la campagne
        </button>
      </div>
    );
  }

  return (
    <div className="dossier p-6 fade-in">
      <div className="text-xs uppercase tracking-widest text-paper-500 mb-1">Le grand débat</div>
      <h2 className="press-une text-2xl mb-3">Face à {opposant}</h2>
      <p className="text-sm text-paper-500 mb-4">
        Composez votre prise de parole en trois temps rhétoriques, dans l'ordre. Votre dossier sur l'adversaire :{" "}
        {s.campaign!.dossierAdversaire}/3.
      </p>
      <div className="mb-4 flex gap-2 flex-wrap min-h-8">
        {beats.map((b, i) => (
          <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--accent)" }}>
            {i + 1}. {DEBATE_BEATS.find((d) => d.id === b)?.nom}
          </span>
        ))}
      </div>
      <div className="space-y-2 mb-5">
        {DEBATE_BEATS.filter((d) => !beats.includes(d.id)).map((d) => (
          <button key={d.id} className="btn-choice" disabled={beats.length >= 3} onClick={() => setBeats([...beats, d.id])}>
            <div className="font-semibold text-sm">{d.nom}</div>
            <div className="text-xs text-paper-500">{d.detail}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="btn-primary" disabled={beats.length !== 3} onClick={() => doDebate(beats)}>
          Monter sur le plateau
        </button>
        {beats.length > 0 && (
          <button className="text-xs text-paper-500 underline" onClick={() => setBeats([])}>
            Recomposer
          </button>
        )}
      </div>
    </div>
  );
}

export default function Campaign({ s }: { s: GameState }) {
  const campaignWeek = useGame((g) => g.campaignWeek);
  const continueAfter = useGame((g) => g.continueAfter);
  const finishElection = useGame((g) => g.finishElection);
  const [segChoice, setSegChoice] = useState("pavillonnaires");

  if (!s.campaign) return <Programme s={s} />;
  const c = s.campaign;
  const opposant = CAST.find((x) => x.id === c.opposantId)?.nom ?? "Maryse Cottin";
  const sondage = sondageAffiche(s, makeRng(s.seed + 999, s.rngCalls));
  const debateWeek = c.totalWeeks - DEBATE_OFFSET;
  const enDebat = c.week === debateWeek && !c.debatFait;
  const fini = c.week > c.totalWeeks;

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-16">
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-xs uppercase tracking-widest text-paper-500">
          {c.kind === "reelection" ? "La réélection" : "Acte III — La campagne"} · semaine {Math.min(c.week, c.totalWeeks)}/{c.totalWeeks}
        </div>
        <div className="text-xs text-paper-500">Face à {opposant}</div>
      </div>

      <div className="dossier p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-paper-500 mb-1">Sondage de la semaine (±3 pts — les sondages mentent un peu)</div>
          <div className="press-une text-2xl">
            Vous {sondage.joueur} % <span className="text-paper-500 text-lg">· {opposant.split(" ").pop()} {sondage.opposant} %</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-paper-500 mb-1">Dynamique (selon la presse)</div>
          <div className="text-xl tabular-nums" style={{ color: c.dynamique >= 0 ? "#7fb890" : "#c98282" }}>
            {c.dynamique >= 0 ? "↗" : "↘"} {c.dynamique > 0 ? "+" : ""}
            {c.dynamique}
          </div>
        </div>
      </div>

      {s.currentEvent ? (
        <EventView s={s} />
      ) : enDebat ? (
        <Debat s={s} />
      ) : fini ? (
        <div className="dossier p-6 fade-in text-center">
          <h2 className="press-une text-3xl mb-3">Le jour du vote</h2>
          <p className="text-sm text-paper-500 mb-6">
            Les bureaux ferment à 20h. Plus rien ne dépend de vous — c'est la sensation la plus étrange de la démocratie.
          </p>
          <button className="btn-primary text-lg px-8" onClick={finishElection}>
            20 heures.
          </button>
        </div>
      ) : s.resolution ? (
        <div className="dossier p-6 fade-in">
          <p className="text-[15px] leading-relaxed mb-5 border-l-2 pl-4" style={{ borderColor: "var(--color-accent-warm)" }}>
            {s.resolution}
          </p>
          <button className="btn-primary" onClick={continueAfter}>
            Semaine suivante
          </button>
        </div>
      ) : (
        <div className="fade-in">
          <h2 className="press-une text-xl mb-3">L'action de la semaine</h2>
          <div className="space-y-2">
            {CAMPAIGN_ACTIONS.map((a) => (
              <div key={a.id}>
                <button className="btn-choice" onClick={() => campaignWeek(a.id, a.needSegment ? segChoice : undefined)}>
                  <div className="font-semibold text-sm flex justify-between">
                    <span>{a.nom}</span>
                    <span className="text-[10px] text-paper-500">{a.fatigue > 0 ? `fatigue +${a.fatigue}` : `repos ${a.fatigue}`}</span>
                  </div>
                  <div className="text-xs text-paper-500">{a.detail}</div>
                </button>
                {a.needSegment && (
                  <select
                    className="mt-1 mb-1 w-full bg-ink-800 border border-ink-600 rounded px-2 py-1.5 text-xs text-paper-300"
                    value={segChoice}
                    onChange={(e) => setSegChoice(e.target.value)}
                  >
                    {SEGMENTS.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        Cible : {seg.nom} — soutien {Math.round(s.segments[seg.id].soutien)} %, participation {Math.round(s.segments[seg.id].participation)} %
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
