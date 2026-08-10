import { useState } from "react";
import type { GameState, PromiseTheme } from "../engine/types";
import { useGame, DEBATE_OFFSET } from "../store";
import { PROMESSES, CAST, SEGMENTS } from "../content/france/data";
import { CAMPAIGN_ACTIONS, DEBATE_BEATS, sondageAffiche } from "../engine/campaign";
import { makeRng } from "../engine/rng";
import { nomCompletDe } from "../engine/noms";
import { DeltaChips, EventView, RareteBadge, Tag } from "./components";
import { RichText } from "./RichText";

const ACTION_META: Record<string, { icone: string; tone: string }> = {
  meeting: { icone: "◎", tone: "var(--color-social)" },
  plateau: { icone: "▣", tone: "var(--color-secu)" },
  fonds: { icone: "◈", tone: "var(--color-eco)" },
  attaque: { icone: "⚔", tone: "var(--color-bad)" },
  annonce: { icone: "★", tone: "var(--color-perso)" },
  dossier: { icone: "◐", tone: "var(--color-monde)" },
  repos: { icone: "☾", tone: "var(--color-env)" },
};

const THEME_META: Record<PromiseTheme, { label: string; tone: string }> = {
  budget: { label: "Budget", tone: "var(--color-eco)" },
  social: { label: "Social", tone: "var(--color-social)" },
  securite: { label: "Sécurité", tone: "var(--color-secu)" },
  environnement: { label: "Écologie", tone: "var(--color-env)" },
  institutions: { label: "Institutions", tone: "var(--color-pouvoir)" },
  societe: { label: "Société", tone: "var(--color-monde)" },
  monde: { label: "International", tone: "var(--color-monde)" },
  insolite: { label: "Insolite", tone: "var(--color-perso)" },
};

const PROGRAMME_TAILLE = 6;

function Programme({ s }: { s: GameState }) {
  const chooseProgram = useGame((g) => g.chooseProgram);
  const [sel, setSel] = useState<string[]>([]);

  // Le tirage de la partie. Une sauvegarde d'avant la refonte n'en a pas :
  // on lui remet le vivier complet plutôt que de la laisser sans programme.
  const proposees = (s.programmePool.length > 0 ? s.programmePool : PROMESSES.map((p) => p.id))
    .map((id) => PROMESSES.find((p) => p.id === id))
    .filter((p): p is (typeof PROMESSES)[number] => !!p);

  const toggle = (id: string) => {
    const def = PROMESSES.find((p) => p.id === id)!;
    if (sel.includes(id)) return setSel(sel.filter((x) => x !== id));
    if (sel.length >= PROGRAMME_TAILLE) return;
    if (def.miroir && sel.includes(def.miroir)) return;
    setSel([...sel, id]);
  };

  // Ce que le programme dit de vous avant même le premier meeting.
  const inclinaison = sel.reduce((n, id) => n + (PROMESSES.find((p) => p.id === id)?.bord ?? 0), 0);
  const glissement = Math.max(-4, Math.min(4, Math.round(inclinaison / 2)));

  return (
    <div className="max-w-3xl mx-auto pt-10 px-5 pb-16 fade-in">
      <Tag tone="var(--color-social)">Acte III — La campagne</Tag>
      <h1 className="press-une text-3xl mt-3 mb-1">Votre programme</h1>
      <p className="text-[13px] mb-4 max-w-xl" style={{ color: "var(--color-faint)" }}>
        Six mesures parmi les {proposees.length} que vos équipes ont mises sur la table. Elles deviendront des promesses
        suivies tout le mandat — tenir coûte cher, trahir aussi. Une autre campagne vous en aurait proposé d'autres.
      </p>

      {glissement !== 0 && (
        <div className="mb-4">
          <Tag tone={glissement < 0 ? "var(--color-pouvoir)" : "var(--color-secu)"}>
            {glissement < 0 ? "◀ Ce programme vous tire à gauche" : "Ce programme vous tire à droite ▶"} ({glissement > 0 ? "+" : ""}
            {glissement})
          </Tag>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-2 mb-5">
        {proposees.map((p) => {
          const active = sel.includes(p.id);
          const rarete = p.rarete ?? "commune";
          const theme = THEME_META[p.theme];
          const bloque = (p.miroir && sel.includes(p.miroir)) || (!active && sel.length >= PROGRAMME_TAILLE);
          return (
            <button
              key={p.id}
              className="btn-choice"
              data-selected={active}
              disabled={!!bloque && !active}
              style={{ "--tone": active ? "var(--color-social)" : theme.tone } as React.CSSProperties}
              onClick={() => toggle(p.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[13px] leading-snug">{p.label}</span>
                {active && <span style={{ color: "var(--color-social)" }}>✓</span>}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <Tag tone={theme.tone}>{theme.label}</Tag>
                {rarete !== "commune" && <RareteBadge rarete={rarete} />}
                {p.bord !== undefined && p.bord !== 0 && (
                  <Tag tone={p.bord < 0 ? "var(--color-pouvoir)" : "var(--color-secu)"}>
                    {p.bord < 0 ? "◀".repeat(Math.min(3, Math.abs(p.bord))) : "▶".repeat(Math.min(3, p.bord))}
                  </Tag>
                )}
                {p.miroir && sel.includes(p.miroir) && <Tag tone="var(--color-bad)">incompatible</Tag>}
              </div>
              <div className="text-[11.5px] mt-1.5 leading-snug" style={{ color: "var(--color-faint)" }}>
                Coûte : {p.tenir}
              </div>
            </button>
          );
        })}
      </div>

      <button className="btn-primary" disabled={sel.length !== PROGRAMME_TAILLE} onClick={() => chooseProgram(sel)}>
        Partir en campagne · {sel.length}/{PROGRAMME_TAILLE}
      </button>
    </div>
  );
}

function Debat({ s }: { s: GameState }) {
  const doDebate = useGame((g) => g.doDebate);
  const continueAfter = useGame((g) => g.continueAfter);
  const [beats, setBeats] = useState<string[]>([]);
  const opposant = CAST.some((c) => c.id === s.campaign!.opposantId) ? nomCompletDe(s, s.campaign!.opposantId) : "Maryse Cottin";

  if (s.resolution) {
    return (
      <div className="card p-6 fade-in">
        <Tag tone="var(--color-secu)">Le débat</Tag>
        <h2 className="press-une text-2xl mt-3 mb-4">Verdict des rédactions</h2>
        <RichText className="text-[15px] leading-relaxed pl-4 border-l-2" style={{ borderColor: "var(--accent)" }}>
          {s.resolution}
        </RichText>
        <DeltaChips deltas={s.lastDeltas} signals={s.lastSignals} check={s.lastCheck} />
        <button className="btn-primary mt-5" onClick={continueAfter}>
          Reprendre la campagne
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Tag tone="var(--color-secu)">Le grand débat</Tag>
        <Tag tone="var(--color-monde)">Dossier {s.campaign!.dossierAdversaire}/3</Tag>
      </div>
      <h2 className="press-une text-2xl mb-4">Face à {opposant}</h2>

      <div className="flex gap-1.5 flex-wrap mb-4 min-h-9 items-center">
        {beats.length === 0 && (
          <span className="text-[12px]" style={{ color: "var(--color-faint)" }}>
            Composez votre intervention en trois temps.
          </span>
        )}
        {beats.map((b, i) => (
          <span key={i} className="chip" style={{ "--tone": "var(--accent)" } as React.CSSProperties}>
            {i + 1}. {DEBATE_BEATS.find((d) => d.id === b)?.nom}
          </span>
        ))}
      </div>

      <div className="space-y-2 mb-5 stagger">
        {DEBATE_BEATS.filter((d) => !beats.includes(d.id)).map((d, i) => (
          <button
            key={d.id}
            className="btn-choice"
            style={{ "--tone": ["var(--color-bad)", "var(--color-eco)", "var(--color-social)", "var(--color-perso)"][i % 4] } as React.CSSProperties}
            disabled={beats.length >= 3}
            onClick={() => setBeats([...beats, d.id])}
          >
            <div className="font-semibold text-[13px]">{d.nom}</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: "var(--color-faint)" }}>
              {d.detail}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button className="btn-primary" disabled={beats.length !== 3} onClick={() => doDebate(beats)}>
          Monter sur le plateau
        </button>
        {beats.length > 0 && (
          <button className="text-[11px] underline" style={{ color: "var(--color-faint)" }} onClick={() => setBeats([])}>
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
  const opposant = CAST.some((x) => x.id === c.opposantId) ? nomCompletDe(s, c.opposantId) : "Maryse Cottin";
  const sondage = sondageAffiche(s, makeRng(s.seed + 999, s.rngCalls));
  const enDebat = c.week === c.totalWeeks - DEBATE_OFFSET && !c.debatFait;
  const fini = c.week > c.totalWeeks;
  const total = sondage.joueur + sondage.opposant;

  return (
    <div className="max-w-3xl mx-auto pt-8 px-5 pb-16">
      <div className="flex justify-between items-center mb-3">
        <Tag tone="var(--color-social)">{c.kind === "reelection" ? "Réélection" : "Acte III — Campagne"}</Tag>
        <div className="flex gap-1 items-center">
          {Array.from({ length: c.totalWeeks }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === c.week - 1 ? 14 : 5,
                height: 5,
                background: i < c.week - 1 ? "var(--accent)" : i === c.week - 1 ? "var(--color-perso)" : "var(--color-line)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="label">Sondage · marge ±3</span>
          <span className="text-[11px]" style={{ color: c.dynamique >= 0 ? "var(--color-good)" : "var(--color-bad)" }}>
            {c.dynamique >= 0 ? "↗ dynamique" : "↘ dynamique"} {c.dynamique > 0 ? "+" : ""}
            {c.dynamique}
          </span>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden mb-2" style={{ border: "1px solid var(--color-line)" }}>
          <div
            className="flex items-center justify-center text-[12px] font-bold transition-all duration-700"
            style={{ width: `${(sondage.joueur / total) * 100}%`, background: "color-mix(in srgb, var(--accent) 40%, transparent)", color: "var(--color-text)" }}
          >
            {sondage.joueur} %
          </div>
          <div
            className="flex items-center justify-center text-[12px] font-bold transition-all duration-700"
            style={{ width: `${(sondage.opposant / total) * 100}%`, background: "color-mix(in srgb, var(--color-bad) 32%, transparent)", color: "var(--color-text)" }}
          >
            {sondage.opposant} %
          </div>
        </div>
        <div className="flex justify-between text-[11px] mb-2" style={{ color: "var(--color-faint)" }}>
          <span>Vous</span>
          <span>{opposant}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap pt-2 border-t" style={{ borderColor: "var(--color-line-soft)" }}>
          <Tag
            tone={s.hidden.fatigue > 70 ? "var(--color-bad)" : s.hidden.fatigue > 45 ? "var(--color-warn)" : "var(--color-good)"}
            aide="Un candidat épuisé rate ses interventions — et paiera sa santé pendant tout le mandat."
          >
            Forme : {s.hidden.fatigue > 70 ? "épuisé" : s.hidden.fatigue > 45 ? "fatigué" : "en forme"}
          </Tag>
          <Tag tone="var(--color-monde)" aide="Ce que vos équipes ont trouvé sur l'adversaire. Utilisable au débat.">
            Dossier {c.dossierAdversaire}/3
          </Tag>
          {c.debatFait && <Tag tone="var(--color-faint)">Débat passé</Tag>}
        </div>
      </div>

      {s.currentEvent ? (
        <EventView s={s} />
      ) : enDebat ? (
        <Debat s={s} />
      ) : fini ? (
        <div className="card p-8 fade-in text-center">
          <h2 className="press-une text-3xl mb-2">Le jour du vote</h2>
          <p className="text-[13px] mb-6" style={{ color: "var(--color-faint)" }}>
            Les bureaux ferment à 20h. Plus rien ne dépend de vous.
          </p>
          <button className="btn-primary text-[16px] px-8 py-3" onClick={finishElection}>
            20 heures.
          </button>
        </div>
      ) : s.resolution ? (
        <div className="card p-6 fade-in">
          <p className="text-[15px] leading-relaxed pl-4 border-l-2" style={{ borderColor: "var(--accent)" }}>
            {s.resolution}
          </p>
          <DeltaChips deltas={s.lastDeltas} signals={s.lastSignals} check={s.lastCheck} />
          <button className="btn-primary mt-5" onClick={continueAfter}>
            Semaine suivante
          </button>
        </div>
      ) : (
        <div className="card p-6 fade-in">
          <h2 className="press-une text-xl mb-3">L'action de la semaine</h2>
          <div className="grid sm:grid-cols-2 gap-2 stagger">
            {CAMPAIGN_ACTIONS.map((a) => {
              const meta = ACTION_META[a.id] ?? { icone: "◆", tone: "var(--color-monde)" };
              return (
                <button
                  key={a.id}
                  className="btn-choice"
                  style={{ "--tone": meta.tone } as React.CSSProperties}
                  onClick={() => campaignWeek(a.id, a.needSegment ? segChoice : undefined)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none mt-0.5" style={{ color: meta.tone }}>
                      {meta.icone}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13px]">{a.nom}</span>
                        <span className="text-[10px]" style={{ color: a.fatigue > 0 ? "var(--color-bad)" : "var(--color-good)" }}>
                          {a.fatigue > 0 ? `+${a.fatigue} fatigue` : "repos"}
                        </span>
                      </div>
                      <div className="text-[11.5px] mt-0.5 leading-snug" style={{ color: "var(--color-faint)" }}>
                        {a.detail}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="label mb-1.5">Cible du meeting</div>
            <div className="flex flex-wrap gap-1">
              {SEGMENTS.map((seg) => {
                const st = s.segments[seg.id];
                const actif = segChoice === seg.id;
                const tone = st.soutien >= 55 ? "var(--color-good)" : st.soutien >= 40 ? "var(--color-warn)" : "var(--color-bad)";
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSegChoice(seg.id)}
                    className="chip"
                    style={{ "--tone": actif ? "var(--accent)" : tone, cursor: "pointer", opacity: actif ? 1 : 0.75 } as React.CSSProperties}
                    title={`Soutien ${Math.round(st.soutien)} % · participation ${Math.round(st.participation)} %`}
                  >
                    {seg.nom.split(" ")[0]} <b>{Math.round(st.soutien)}</b>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
