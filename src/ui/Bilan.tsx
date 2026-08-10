import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { bilanMandat } from "../content/france/bilan";
import { Tag } from "./components";
import { RichText } from "./RichText";

// ---------------------------------------------------------------------------
// L'encadré de fin de mandat : la seule fois où quelqu'un vous dit franchement
// où vous en êtes, avant que la campagne ne recouvre tout de slogans.
// ---------------------------------------------------------------------------

function Chiffre({ label, valeur, depart, progres }: { label: string; valeur: string; depart: string; progres: number }) {
  const tone = Math.abs(progres) < 0.5 ? "var(--color-faint)" : progres > 0 ? "var(--color-good)" : "var(--color-bad)";
  return (
    <div className="card-flat px-3 py-2" style={{ borderLeft: `3px solid ${tone}` }}>
      <div className="label mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[16px] font-bold tabular-nums">{valeur}</span>
        <span className="text-[10px]" style={{ color: tone }}>
          {Math.abs(progres) < 0.5 ? "stable" : progres > 0 ? "▲ mieux" : "▼ moins bien"}
        </span>
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)" }}>
        à votre arrivée : {depart}
      </div>
    </div>
  );
}

export default function Bilan({ s }: { s: GameState }) {
  const closeBilan = useGame((g) => g.closeBilan);
  const b = bilanMandat(s);

  return (
    <div className="max-w-3xl mx-auto pt-10 px-5 pb-16 fade-in">
      <Tag tone="var(--color-pouvoir)">Fin du mandat {s.mandat} — la note de synthèse</Tag>
      <h1 className="press-une text-3xl mt-3 mb-1">{b.titre}</h1>
      <p className="text-[13px] mb-5 leading-relaxed" style={{ color: "var(--color-muted)" }}>
        {b.chapeau}
      </p>

      {/* L'opinion, d'abord : c'est la seule chose qu'on vous demandera. */}
      <div className="card p-5 mb-4">
        <div className="label mb-3">L'opinion, ce matin</div>
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="flex-1 min-w-[140px]">
            <div className="flex justify-between text-[11px] mb-1">
              <span style={{ color: "var(--color-muted)" }}>Opinions favorables</span>
              <span className="tabular-nums font-bold" style={{ color: b.popularite >= 45 ? "var(--color-good)" : b.popularite >= 32 ? "var(--color-warn)" : "var(--color-bad)" }}>
                {b.popularite} %
              </span>
            </div>
            <div className="gauge-track" style={{ "--tone": b.popularite >= 45 ? "var(--color-good)" : b.popularite >= 32 ? "var(--color-warn)" : "var(--color-bad)" } as React.CSSProperties}>
              <div className="gauge-fill" style={{ width: `${b.popularite}%` }} />
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="flex justify-between text-[11px] mb-1">
              <span style={{ color: "var(--color-muted)" }}>Socle électoral mobilisable</span>
              <span className="tabular-nums font-bold" style={{ color: "var(--accent)" }}>
                {b.intentions} pts
              </span>
            </div>
            <div className="gauge-track" style={{ "--tone": "var(--accent)" } as React.CSSProperties}>
              <div className="gauge-fill" style={{ width: `${Math.min(100, b.intentions * 2)}%` }} />
            </div>
          </div>
        </div>
        <p className="text-[12.5px] leading-relaxed pl-3 border-l-2" style={{ color: "var(--color-muted)", borderColor: "var(--color-perso)" }}>
          {b.climatPresse}
        </p>
      </div>

      {/* Ce que le pays est devenu entre vos mains. */}
      <div className="card p-5 mb-4">
        <div className="label mb-3">Le pays qu'on vous a remis, le pays que vous rendez</div>
        <div className="grid sm:grid-cols-4 gap-2">
          {b.chiffres.map((ch) => (
            <Chiffre key={ch.label} {...ch} />
          ))}
        </div>
      </div>

      {/* Les axes d'amélioration : le cœur de la note. */}
      <div className="card p-5 mb-4">
        <div className="label mb-1">Ce que les sondages vous demandent de corriger</div>
        <p className="text-[11.5px] mb-3" style={{ color: "var(--color-faint)" }}>
          Question ouverte : « Qu'est-ce qui doit changer en priorité ? » — réponses spontanées, classées par occurrence.
        </p>
        <div className="space-y-2">
          {b.attentes.map((a, i) => {
            const tone = a.urgence >= 65 ? "var(--color-bad)" : a.urgence >= 40 ? "var(--color-warn)" : "var(--color-monde)";
            return (
              <div key={a.titre} className="card-flat px-3 py-2.5" style={{ borderLeft: `3px solid ${tone}` }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold">
                    {i + 1}. {a.titre}
                  </span>
                  <Tag tone={tone}>{a.urgence >= 65 ? "priorité absolue" : a.urgence >= 40 ? "attente forte" : "sujet secondaire"}</Tag>
                </div>
                <div className="gauge-track mb-1.5" style={{ "--tone": tone } as React.CSSProperties}>
                  <div className="gauge-fill" style={{ width: `${a.urgence}%` }} />
                </div>
                <div className="text-[11.5px] leading-snug" style={{ color: "var(--color-muted)" }}>
                  {a.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ce qu'on vous reconnaît — une note qui ne dirait que le mauvais serait fausse. */}
      <div className="card p-5 mb-4">
        <div className="label mb-2">Ce qu'on vous reconnaît</div>
        <div className="space-y-1.5">
          {b.acquis.map((a, i) => (
            <div key={i} className="flex gap-2 text-[12.5px] leading-snug">
              <span style={{ color: "var(--color-good)" }}>✓</span>
              <span style={{ color: "var(--color-muted)" }}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* La confrontation : qui est en face, et ce qu'il compte faire de tout ça. */}
      <div className="card p-5 mb-4" style={{ borderColor: "color-mix(in srgb, var(--color-bad) 35%, transparent)" }}>
        <div className="label mb-3" style={{ color: "var(--color-bad)" }}>
          En face
        </div>
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
          <span className="press-une text-xl">{b.adversaire.nom}</span>
          <Tag tone={b.adversaire.force >= 55 ? "var(--color-bad)" : b.adversaire.force >= 48 ? "var(--color-warn)" : "var(--color-monde)"}>
            {b.adversaire.force >= 55 ? "adversaire redoutable" : b.adversaire.force >= 48 ? "adversaire sérieux" : "adversaire abordable"}
          </Tag>
        </div>
        <div className="text-[11.5px] mb-3" style={{ color: "var(--color-faint)" }}>
          {b.adversaire.role}
        </div>
        <RichText className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--color-muted)" }}>
          {b.adversaire.ligne}
        </RichText>
        <div className="label mb-1.5">
          {b.adversaire.angles.length > 1 ? `Les ${b.adversaire.angles.length} angles qu'il travaille` : "L'angle qu'il travaille"}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {b.adversaire.angles.map((a) => (
            <Tag key={a} tone="var(--color-bad)">
              ⚔ {a}
            </Tag>
          ))}
        </div>
        <p className="text-[12.5px] leading-relaxed pl-3 border-l-2" style={{ color: "var(--color-muted)", borderColor: "var(--accent)" }}>
          {b.adversaire.votreAngle}
        </p>
      </div>

      {/* L'électorat, segment par segment. */}
      <div className="card p-5 mb-4">
        <div className="label mb-3">Votre électorat, cinq ans plus tard</div>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {b.segments.map((seg) => {
            const tone = seg.soutien >= 58 ? "var(--color-good)" : seg.soutien >= 45 ? "var(--color-warn)" : "var(--color-bad)";
            return (
              <div key={seg.id} className="card-flat px-2.5 py-2" style={{ borderLeft: `3px solid ${tone}` }}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold truncate">{seg.nom}</span>
                  <span className="tabular-nums text-[12px] font-bold shrink-0 flex items-baseline gap-1" style={{ color: tone }}>
                    <span>{seg.soutien}</span>
                    {seg.delta !== 0 && (
                      <span className="text-[10px]" style={{ color: seg.delta > 0 ? "var(--color-good)" : "var(--color-bad)" }}>
                        {seg.delta > 0 ? "▲+" : "▼"}
                        {seg.delta}
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-[10.5px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                  {seg.verdict}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[13px] italic leading-relaxed mb-5 pl-3 border-l-2" style={{ color: "var(--color-muted)", borderColor: "var(--color-pouvoir)" }}>
        {b.conseil}
      </p>

      <button className="btn-primary" onClick={closeBilan}>
        Entrer en campagne
      </button>
    </div>
  );
}
