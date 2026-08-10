import { useEffect, useRef, useState } from "react";
import type { CheckResult, Choice, GameEvent, GameState, PressItem, Rarete } from "../engine/types";
import type { Delta } from "../engine/deltas";
import { CAST, CAST_TAGS, NATIONS, SEGMENTS, PROMESSES } from "../content/france/data";
import { ETAPES_ENQUETE, majorite, SEUIL_ALLIE, SEUIL_HOSTILE } from "../engine/europe";
import { bordMeta } from "../engine/bord";
import { rangMeta } from "../engine/check";
import { nomCompletDe, nomDe, substituerNoms } from "../engine/noms";
import { armeDe, ETAPES } from "../engine/vendetta";
import { faveursPresse, FAVEURS_MAX, relationsPresse, type NiveauPresse } from "../engine/presse";
import { getEvent } from "../engine/registry";
import { useGame } from "../store";
import { RichText } from "./RichText";

// ---------------------------------------------------------------------------
// Couleurs sémantiques
// ---------------------------------------------------------------------------

export const TONE: Record<string, string> = {
  eco: "var(--color-eco)",
  social: "var(--color-social)",
  securite: "var(--color-secu)",
  environnement: "var(--color-env)",
  monde: "var(--color-monde)",
  pouvoir: "var(--color-pouvoir)",
  perso: "var(--color-perso)",
  good: "var(--color-good)",
  bad: "var(--color-bad)",
  muted: "var(--color-faint)",
};

const CAMP_TONE: Record<string, string> = {
  gouvernement: "var(--color-secu)",
  parti: "var(--color-pouvoir)",
  opposition: "var(--color-bad)",
  presse: "var(--color-perso)",
  corps: "var(--color-social)",
  institutions: "var(--color-monde)",
  intime: "var(--color-env)",
  etranger: "var(--color-eco)",
};

const RARETE_META: Record<Rarete, { label: string; tone: string }> = {
  commune: { label: "Commune", tone: "var(--color-r-commune)" },
  peu_commune: { label: "Peu commune", tone: "var(--color-r-peu)" },
  rare: { label: "Rare", tone: "var(--color-r-rare)" },
  legendaire: { label: "Légendaire", tone: "var(--color-r-legend)" },
};

/** La rareté d'un événement : explicite, ou déduite de sa nature. */
export function rareteOf(ev: GameEvent): Rarete {
  if (ev.rarete) return ev.rarete;
  if (ev.kind === "crise") return "legendaire";
  if (ev.kind === "intrigue") return "rare";
  if (ev.kind === "monde" || ev.kind === "perso") return "peu_commune";
  return "commune";
}

export function Tag({ tone, children, aide }: { tone: string; children: React.ReactNode; aide?: string }) {
  return (
    <span className="tag" style={{ "--tone": tone } as React.CSSProperties} data-aide={aide || undefined}>
      {children}
    </span>
  );
}

/** Textes d'aide au survol — le jeu doit s'expliquer sans manuel. */
export const AIDE: Record<string, string> = {
  biaise:
    "Cette personne vous rapporte des chiffres déformés : elle minimise ou exagère selon son intérêt. Demandez une seconde source pour connaître la réalité.",
  ambitieux:
    "Elle vise votre place ou une plus grande. Une popularité en baisse la rend plus dangereuse ; un poste prestigieux la calme un temps.",
  rancune:
    "Vous lui avez fait du tort et elle ne l'a pas digéré. Une rancune élevée finit par se payer : fuite, trahison, témoignage à charge.",
  devoue: "Vous suivra même contre son intérêt.",
  loyal: "Fidèle tant que vous tenez debout.",
  distant: "Ni avec vous, ni contre vous. Attend de voir.",
  froid: "Ne vous défendra pas publiquement.",
  hostile: "Cherche activement à vous nuire.",
  critique: "Cet indicateur est dans le rouge : il déclenche des événements négatifs et pèse sur votre bilan final.",
  commune: "Événement fréquent.",
  peu_commune: "Événement peu fréquent.",
  rare: "Événement rare — souvent lié à une intrigue au long cours.",
  legendaire: "Séquence exceptionnelle. Peu de parties la voient.",
  promesse: "Mesure promise pendant la campagne. La presse et les électeurs vérifient si vous la tenez.",
  capital: "Votre temps et votre énergie politique du semestre. Il n'y en a jamais assez : choisir, c'est renoncer.",
};

export function RareteBadge({ rarete }: { rarete: Rarete }) {
  const m = RARETE_META[rarete];
  return (
    <Tag tone={m.tone} aide={AIDE[rarete]}>
      {rarete === "legendaire" ? "✦" : rarete === "rare" ? "◆" : rarete === "peu_commune" ? "◈" : "◇"} {m.label}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Jauges et métriques
// ---------------------------------------------------------------------------

export function Gauge({ label, value, max = 100, tone = "monde", suffix }: { label: string; value: number; max?: number; tone?: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2.5" style={{ "--tone": TONE[tone] ?? tone } as React.CSSProperties}>
      <div className="flex justify-between text-[11px] mb-1">
        <span style={{ color: "var(--color-muted)" }}>{label}</span>
        <span className="tabular-nums font-semibold" style={{ color: TONE[tone] ?? tone }}>
          {suffix ? `${value.toFixed(1)}${suffix}` : Math.round(value)}
        </span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * L'axe gauche-droite. Contrairement aux autres jauges, il n'a pas de « bon »
 * côté : il a deux extrémités, et chacune a ses monstres.
 */
export function BordAxis({ bord, compact }: { bord: number; compact?: boolean }) {
  const meta = bordMeta(bord);
  const pct = ((bord + 10) / 20) * 100;
  const extreme = Math.abs(bord) >= 8;
  return (
    <div style={{ "--tone": meta.tone } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
          Ligne politique
        </span>
        <span className="flex items-center gap-1.5">
          {extreme && <Tag tone="var(--color-bad)">⚑ Extrême</Tag>}
          <span className="text-[12px] font-bold" style={{ color: meta.tone }}>
            {meta.label}
          </span>
        </span>
      </div>
      <div
        className="relative rounded-full"
        style={{
          height: 8,
          background:
            "linear-gradient(90deg, var(--color-bad) 0%, var(--color-pouvoir) 22%, var(--color-r-commune) 50%, var(--color-secu) 78%, var(--color-bad) 100%)",
          opacity: 0.55,
          border: "1px solid var(--color-line-soft)",
        }}
      >
        {/* Le repère du centre : on voit tout de suite de combien on s'en écarte. */}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: "50%", background: "var(--color-text)", opacity: 0.5 }} />
        <div
          className="absolute rounded-full"
          style={{
            left: `calc(${pct}% - 7px)`,
            top: -3,
            width: 14,
            height: 14,
            background: meta.tone,
            border: "2px solid var(--color-base)",
            boxShadow: `0 0 10px -1px ${meta.tone}`,
            transition: "left 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] mt-1" style={{ color: "var(--color-faint)" }}>
        <span>Révolution</span>
        <span className="tabular-nums" style={{ color: meta.tone }}>
          {bord > 0 ? "+" : ""}
          {bord}
        </span>
        <span>Identitaire</span>
      </div>
      {!compact && (
        <div className="text-[11px] mt-1.5 italic leading-snug" style={{ color: "var(--color-faint)" }}>
          {meta.resume}
        </div>
      )}
    </div>
  );
}

function Trend({ v, inverse }: { v: number | undefined; inverse?: boolean }) {
  if (v === undefined || Math.abs(v) < 0.4) return <span style={{ color: "var(--color-faint)" }}>→</span>;
  const bon = inverse ? v < 0 : v > 0;
  return (
    <span style={{ color: bon ? "var(--color-good)" : "var(--color-bad)" }} title={`${v > 0 ? "+" : ""}${Math.round(v * 10) / 10} ce semestre`}>
      {v > 0 ? "↗" : "↘"}
    </span>
  );
}

interface MetricSpec {
  key: string;
  label: string;
  value: number;
  tone: string;
  suffix?: string;
  inverse?: boolean;
  critique?: boolean;
  max?: number;
}

function MetricCard({ m, trend }: { m: MetricSpec; trend?: number }) {
  return (
    <div className="metric" data-critical={m.critique} style={{ "--tone": TONE[m.tone] ?? m.tone } as React.CSSProperties}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>
          {m.label}
        </span>
        <Trend v={trend} inverse={m.inverse} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold tabular-nums" style={{ color: m.critique ? "var(--color-bad)" : TONE[m.tone] ?? m.tone }}>
          {m.suffix ? m.value.toFixed(1) : Math.round(m.value)}
        </span>
        {m.suffix && <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>{m.suffix}</span>}
      </div>
      {m.max !== undefined && (
        <div className="gauge-track mt-1.5" style={{ height: 4 }}>
          <div className="gauge-fill" style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Le retour visuel après une décision
// ---------------------------------------------------------------------------

const RANG_ICONE: Record<string, string> = { critique: "★", reussite: "✓", echec: "◇", desastre: "✕" };

export function DeltaChips({
  deltas = [],
  signals = [],
  check,
}: {
  deltas?: Delta[];
  signals?: string[];
  check?: CheckResult | null;
}) {
  if (deltas.length === 0 && signals.length === 0 && !check) return null;
  const rang = check ? rangMeta(check.rang) : null;
  return (
    <div className="mt-4 space-y-2">
      {check && rang && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="chip pop-in" style={{ "--tone": rang.tone } as React.CSSProperties}>
            {RANG_ICONE[check.rang]} {rang.label}
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
            {check.titre}
          </span>
        </div>
      )}
      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 stagger">
          {deltas.map((d, i) => {
            const bon = d.inverse ? d.value < 0 : d.value > 0;
            return (
              <span key={i} className="chip" style={{ "--tone": bon ? "var(--color-good)" : "var(--color-bad)" } as React.CSSProperties}>
                <span style={{ opacity: 0.75 }}>{d.label}</span>
                <b className="tabular-nums">
                  {d.value > 0 ? "+" : ""}
                  {d.value}
                  {d.suffix ?? ""}
                </b>
              </span>
            );
          })}
        </div>
      )}
      {signals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {signals.map((sig, i) => (
            <span key={i} className="chip" style={{ "--tone": "var(--color-warn)" } as React.CSSProperties}>
              ◐ {sig}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presse
// ---------------------------------------------------------------------------

const TONE_PRESSE: Record<PressItem["tone"], string> = {
  hostile: "var(--color-bad)",
  neutre: "var(--color-text)",
  favorable: "var(--color-good)",
  servile: "var(--color-faint)",
  satirique: "var(--color-warn)",
};

export function PressList({ items }: { items: PressItem[] }) {
  const game = useGame((g) => g.game);
  const N = (t: string) => substituerNoms(t, game);
  return (
    <div className="space-y-2.5">
      {items.map((it, i) =>
        it.kind === "une" ? (
          <div
            key={i}
            className="press-une text-[19px] leading-snug pb-3 mb-1 border-b"
            style={{ color: TONE_PRESSE[it.tone], borderColor: "var(--color-line-soft)" }}
          >
            {N(it.text)}
          </div>
        ) : it.kind === "symptome" ? (
          <div
            className="text-[13px] italic px-3 py-2 rounded-lg"
            key={i}
            style={{ color: "var(--color-warn)", background: "color-mix(in srgb, var(--color-warn) 9%, transparent)" }}
          >
            ◐ {N(it.text)}
          </div>
        ) : (
          <RichText key={i} className="text-[13px] leading-relaxed" style={{ color: TONE_PRESSE[it.tone] === "var(--color-text)" ? "var(--color-muted)" : TONE_PRESSE[it.tone] }}>
            {it.text}
          </RichText>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// L'événement
// ---------------------------------------------------------------------------

const KIND_META: Record<string, { label: string; tone: string }> = {
  crise: { label: "Cellule de crise", tone: "var(--color-bad)" },
  intrigue: { label: "Dossier sensible", tone: "var(--color-monde)" },
  monde: { label: "Le monde", tone: "var(--color-eco)" },
  perso: { label: "Vie privée", tone: "var(--color-env)" },
  standard: { label: "Le semestre", tone: "var(--color-secu)" },
  ascension: { label: "L'ascension", tone: "var(--color-pouvoir)" },
  campagne: { label: "Campagne", tone: "var(--color-social)" },
};

export function EventView({ s }: { s: GameState }) {
  const chooseOption = useGame((g) => g.chooseOption);
  const continueAfter = useGame((g) => g.continueAfter);
  const ev = s.currentEvent ? getEvent(s.currentEvent) : null;
  if (!ev) return null;
  const source = ev.source ? CAST.find((c) => c.id === ev.source) : null;
  // Beaucoup de textes d'événements supposent leur contexte (`s.vendetta!`,
  // `s.europe.enquete!`). Si la situation s'est défaite entre le moment où
  // l'événement a été mis en file et celui où il s'affiche, la fonction lève —
  // et emportait tout l'écran. On préfère un événement muet à une page noire.
  let texte: string;
  try {
    const rendu = typeof ev.texte === "function" ? ev.texte(s) : ev.texte;
    texte = typeof rendu === "string" ? rendu : "";
  } catch (e) {
    console.error("[MANDAT] texte d'événement illisible", ev.id, e);
    texte = "";
  }
  // Même prudence sur les choix : `dynamicChoices` et les `cond` lisent le même
  // contexte, et échouent donc dans les mêmes circonstances.
  let choix: Choice[] = [];
  try {
    choix = [...ev.choices, ...(ev.dynamicChoices?.(s) ?? [])].filter((c) => {
      try {
        return !c.cond || c.cond(s);
      } catch {
        return false;
      }
    });
  } catch (e) {
    console.error("[MANDAT] choix d'événement illisibles", ev.id, e);
  }
  const meta = KIND_META[ev.kind] ?? KIND_META.standard;
  const rarete = rareteOf(ev);
  // Les titres et les intitulés de choix citent eux aussi des noms.
  const N = (t: string) => substituerNoms(t, s);

  return (
    <div className="card p-6 fade-in" key={ev.id + (s.resolution ? "-r" : "")}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Tag tone={meta.tone}>{meta.label}</Tag>
        {rarete !== "commune" && <RareteBadge rarete={rarete} />}
      </div>
      <h2 className="press-une text-2xl mb-3 leading-tight">{N(ev.titre)}</h2>

      {source && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Tag tone={CAMP_TONE[source.camp]}>{CAST_TAGS[source.id] ?? source.role}</Tag>
          <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
            {source.biais ? `⚠ ${source.biais}` : nomCompletDe(s, source.id)}
          </span>
        </div>
      )}

      {!s.resolution ? (
        <>
          <RichText className="text-[15px] leading-relaxed mb-5" style={{ color: "color-mix(in srgb, var(--color-text) 88%, transparent)" }}>
            {texte}
          </RichText>
          <div className="space-y-2 stagger">
            {choix.map((c, i) => (
              <button
                key={c.id}
                className="btn-choice"
                style={{ "--tone": [TONE.eco, TONE.social, TONE.monde, TONE.perso][i % 4] } as React.CSSProperties}
                onClick={() => chooseOption(c.id)}
              >
                <div className="font-semibold text-[14px]">{N(c.label)}</div>
                {c.detail && (
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                    {N(c.detail)}
                  </div>
                )}
              </button>
            ))}
          </div>
          {/* Un événement sans issue est une partie bloquée : on laisse
              toujours une porte, même quand le contenu n'en propose plus. */}
          {choix.length === 0 && (
            <div>
              <p className="text-[13px] italic mb-4" style={{ color: "var(--color-faint)" }}>
                La situation s'est dénouée d'elle-même avant que vous ayez eu à trancher.
              </p>
              <button className="btn-primary" onClick={continueAfter}>
                Continuer
              </button>
            </div>
          )}
        </>
      ) : (
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
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entourage : tags de fonction + relation visuelle
// ---------------------------------------------------------------------------

function relationMeta(l: number): { label: string; tone: string; niveau: number; aide: string } {
  if (l >= 75) return { label: "Dévoué", tone: "var(--color-good)", niveau: 5, aide: AIDE.devoue };
  if (l >= 55) return { label: "Loyal", tone: "var(--color-env)", niveau: 4, aide: AIDE.loyal };
  if (l >= 35) return { label: "Distant", tone: "var(--color-warn)", niveau: 3, aide: AIDE.distant };
  if (l >= 15) return { label: "Froid", tone: "var(--color-social)", niveau: 2, aide: AIDE.froid };
  return { label: "Hostile", tone: "var(--color-bad)", niveau: 1, aide: AIDE.hostile };
}

function RelationBars({ niveau, tone }: { niveau: number; tone: string }) {
  return (
    <div className="flex gap-[3px] items-end h-3.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 3.5,
            height: 4 + i * 2,
            borderRadius: 2,
            background: i <= niveau ? tone : "var(--color-line)",
            opacity: i <= niveau ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

function Entourage({ s }: { s: GameState }) {
  const [filtre, setFiltre] = useState<string | null>(null);
  const setFocus = useGame((g) => g.setFocus);
  const focus = s.focusCharacter;
  const cible = useRef<HTMLDivElement>(null);

  // Cliquer sur un nom dans un texte doit amener la fiche sous les yeux : on
  // lève d'abord le filtre s'il la masque, puis on fait défiler jusqu'à elle.
  useEffect(() => {
    if (!focus) return;
    const perso = CAST.find((c) => c.id === focus);
    setFiltre((f) => (f && perso && perso.camp !== f ? null : f));
  }, [focus]);

  useEffect(() => {
    if (!focus) return;
    cible.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, filtre]);

  const camps = [
    ["gouvernement", "Gouvernement"],
    ["parti", "Parti"],
    ["opposition", "Opposition"],
    ["presse", "Presse"],
    ["corps", "Corps interm."],
    ["institutions", "Institutions"],
    ["intime", "Intimes"],
  ] as const;

  // L'ordre reste celui du casting : on va chercher la fiche là où elle est
  // plutôt que de réarranger la liste sous les yeux du joueur.
  const liste = CAST.filter((c) => s.characters[c.id]?.vivant && (!filtre || c.camp === filtre));

  return (
    <div>
      {focus && (
        <button
          className="chip mb-2"
          style={{ "--tone": "var(--accent)", cursor: "pointer" } as React.CSSProperties}
          onClick={() => setFocus(null)}
        >
          ✕ Ne plus suivre {nomDe(s, focus)}
        </button>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        <button onClick={() => setFiltre(null)} className="tag" style={{ "--tone": filtre === null ? "var(--color-text)" : "var(--color-faint)" } as React.CSSProperties}>
          Tous
        </button>
        {camps.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltre(filtre === id ? null : id)}
            className="tag"
            style={{ "--tone": filtre === id ? CAMP_TONE[id] : "var(--color-faint)", cursor: "pointer" } as React.CSSProperties}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-[420px] panneau-scroll">
        {liste.map((c) => {
          const st = s.characters[c.id];
          const nom = nomCompletDe(s, c.id);
          const rel = relationMeta(st.loyaute);
          const suivi = focus === c.id;
          return (
            <div
              key={c.id}
              ref={suivi ? cible : undefined}
              className={`card-flat px-2.5 py-2 ${suivi ? "pop-in" : ""}`}
              style={{
                borderLeft: `3px solid ${CAMP_TONE[c.camp]}`,
                boxShadow: suivi ? `0 0 0 2px ${CAMP_TONE[c.camp]}` : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[13px] font-semibold ${st.enPoste ? "" : "line-through opacity-50"}`}>{nom}</span>
                <RelationBars niveau={rel.niveau} tone={rel.tone} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Tag tone={CAMP_TONE[c.camp]} aide={c.role}>
                  {CAST_TAGS[c.id] ?? c.role}
                </Tag>
                <Tag tone={rel.tone} aide={rel.aide}>
                  {rel.label}
                </Tag>
                {st.ambition >= 65 && (
                  <Tag tone="var(--color-warn)" aide={AIDE.ambitieux}>
                    ⚑ Ambitieux
                  </Tag>
                )}
                {st.rancune >= 30 && (
                  <Tag tone="var(--color-bad)" aide={AIDE.rancune}>
                    ⚔ Rancune
                  </Tag>
                )}
                {c.biais && (
                  <Tag tone="var(--color-faint)" aide={`${AIDE.biaise} Ici : ${c.biais}.`}>
                    ⚠ Biaisé
                  </Tag>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les rédactions : qui vous tient, qui vous doit quelque chose
// ---------------------------------------------------------------------------

const NIVEAU_PRESSE_META: Record<NiveauPresse, { label: string; tone: string }> = {
  acquis: { label: "Acquis", tone: "var(--color-good)" },
  bienveillant: { label: "Bienveillant", tone: "var(--color-env)" },
  neutre: { label: "Neutre", tone: "var(--color-monde)" },
  hostile: { label: "Hostile", tone: "var(--color-bad)" },
};

function Presse({ s }: { s: GameState }) {
  const relations = relationsPresse(s);
  const faveurs = faveursPresse(s);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label" data-aide="Un journaliste acquis traite autrement, prévient avant, et peut enterrer un sujet.">
          Les rédactions
        </span>
        <span
          className="flex gap-1 items-center text-[10px]"
          style={{ color: "var(--color-faint)" }}
          title="Renvois d'ascenseur en réserve : un journaliste acquis peut étouffer un sujet, une fois par faveur."
        >
          {Array.from({ length: FAVEURS_MAX }).map((_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{ width: 6, height: 6, background: i < faveurs ? "var(--color-perso)" : "var(--color-line)" }}
            />
          ))}
          faveurs
        </span>
      </div>
      <div className="space-y-1.5">
        {relations.map((r) => {
          const meta = NIVEAU_PRESSE_META[r.niveau];
          return (
            <div key={r.id} className="card-flat px-2.5 py-1.5 flex items-center justify-between gap-2" style={{ borderLeft: `3px solid ${meta.tone}` }}>
              <span className="text-[12px] font-semibold truncate">{nomCompletDe(s, r.id)}</span>
              <Tag tone={meta.tone}>{meta.label}</Tag>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Le panneau
// ---------------------------------------------------------------------------

export function StatsTabs({ s }: { s: GameState }) {
  const [tab, setTab] = useState<"pays" | "pouvoir" | "europe" | "vous" | "promesses" | "entourage" | "fils">("pays");

  // Cliquer sur un nom dans un texte ouvre directement l'entourage.
  useEffect(() => {
    if (s.focusCharacter) setTab("entourage");
  }, [s.focusCharacter]);
  const tabs = [
    ["pays", "Pays", "var(--color-eco)"],
    ["pouvoir", "Pouvoir", "var(--color-pouvoir)"],
    ["europe", "Europe", "var(--color-monde)"],
    ["vous", "Vous", "var(--color-perso)"],
    ["promesses", "Promesses", "var(--color-social)"],
    ["entourage", "Entourage", "var(--color-secu)"],
    ["fils", "Fils", "var(--color-warn)"],
  ] as const;

  const c = s.country;
  const eco: MetricSpec[] = [
    { key: "croissance", label: "Croissance", value: c.croissance, tone: "eco", suffix: " %", critique: c.croissance < 0 },
    { key: "chomage", label: "Chômage", value: c.chomage, tone: "eco", suffix: " %", inverse: true, critique: c.chomage > 10 },
    { key: "inflation", label: "Inflation", value: c.inflation, tone: "eco", suffix: " %", inverse: true, critique: c.inflation > 4 },
    { key: "dette", label: "Dette / PIB", value: c.dette, tone: "eco", suffix: " %", inverse: true, critique: c.dette > 130 },
    { key: "marge", label: "Marge budgét.", value: c.marge, tone: "eco", max: 100, critique: c.marge < 15 },
  ];
  const societe: MetricSpec[] = [
    { key: "services", label: "Services publics", value: c.services, tone: "social", max: 100, critique: c.services < 30 },
    { key: "cohesion", label: "Cohésion", value: c.cohesion, tone: "social", max: 100, critique: c.cohesion < 30 },
    { key: "securite", label: "Sécurité", value: c.securite, tone: "securite", max: 100, critique: c.securite < 35 },
    { key: "environnement", label: "Environnement", value: c.environnement, tone: "environnement", max: 100, critique: c.environnement < 30 },
  ];
  const monde: MetricSpec[] = [
    { key: "prestige", label: "Prestige", value: c.prestige, tone: "monde", max: 100, critique: c.prestige < 40 },
    { key: "influence", label: "Influence en Europe", value: c.influence, tone: "monde", max: 100, critique: c.influence < 35 },
  ];

  const p = s.power;
  const pouvoir: MetricSpec[] = [
    { key: "popularite", label: "Popularité", value: p.popularite, tone: "pouvoir", max: 100, critique: p.popularite < 30 },
    { key: "parti", label: "Parti", value: p.parti, tone: "pouvoir", max: 100, critique: p.parti < 30 },
    { key: "presse", label: "Presse", value: p.presse, tone: "perso", max: 100, critique: p.presse < 30 },
    { key: "justice", label: "Justice", value: p.justice, tone: "monde", max: 100, critique: p.justice < 30 },
  ];
  const forces: MetricSpec[] = [
    { key: "armee", label: "Armée", value: p.armee, tone: "securite", max: 100, critique: p.armee < 35 },
    { key: "patronat", label: "Patronat", value: p.patronat, tone: "eco", max: 100, critique: p.patronat < 30 },
    { key: "syndicats", label: "Syndicats", value: p.syndicats, tone: "social", max: 100, critique: p.syndicats < 25 },
  ];

  const critiques = [...eco, ...societe, ...monde, ...pouvoir, ...forces].filter((m) => m.critique);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map(([id, label, tone]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              background: tab === id ? `color-mix(in srgb, ${tone} 22%, transparent)` : "var(--color-surface-2)",
              color: tab === id ? tone : "var(--color-faint)",
              border: `1px solid ${tab === id ? `color-mix(in srgb, ${tone} 45%, transparent)` : "transparent"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pays" && (
        <div className="space-y-3">
          {critiques.length > 0 && (
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: "color-mix(in srgb, var(--color-bad) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-bad) 30%, transparent)" }}
            >
              <div className="label mb-1.5" style={{ color: "var(--color-bad)" }}>
                ⚠ {critiques.length} secteur{critiques.length > 1 ? "s" : ""} critique{critiques.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-wrap gap-1">
                {critiques.map((m) => (
                  <Tag key={m.key} tone="var(--color-bad)">
                    {m.label}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="label mb-1.5">Économie</div>
            <div className="grid grid-cols-2 gap-1.5">
              {eco.map((m) => (
                <MetricCard key={m.key} m={m} trend={s.trends[m.key]} />
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">Société</div>
            <div className="grid grid-cols-2 gap-1.5">
              {societe.map((m) => (
                <MetricCard key={m.key} m={m} trend={s.trends[m.key]} />
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">International</div>
            <div className="grid grid-cols-2 gap-1.5">
              {monde.map((m) => (
                <MetricCard key={m.key} m={m} trend={s.trends[m.key]} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "pouvoir" && (
        <div className="space-y-3">
          <div>
            <div className="label mb-1.5">Votre ligne</div>
            <div className="card-flat p-3">
              <BordAxis bord={s.bord} />
            </div>
          </div>
          <div>
            <div className="label mb-1.5">Assemblée nationale</div>
            <SeatBar s={s} />
          </div>
          <div>
            <div className="label mb-1.5">Votre assise</div>
            <div className="grid grid-cols-2 gap-1.5">
              {pouvoir.map((m) => (
                <MetricCard key={m.key} m={m} trend={s.trends[m.key]} />
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">Les forces du pays</div>
            <div className="grid grid-cols-2 gap-1.5">
              {forces.map((m) => (
                <MetricCard key={m.key} m={m} trend={s.trends[m.key]} />
              ))}
            </div>
          </div>
          <Presse s={s} />
        </div>
      )}

      {tab === "vous" && (
        <div>
          <Gauge label="Charisme" value={s.player.charisme} tone="perso" />
          <Gauge label="Rhétorique" value={s.player.rhetorique} tone="perso" />
          <Gauge label="Stratégie" value={s.player.strategie} tone="securite" />
          <Gauge label="Intégrité" value={s.player.integrite} tone="eco" />
          <Gauge label="Cynisme" value={s.player.cynisme} tone="bad" />
          <Gauge label="Endurance" value={s.player.endurance} tone="env" />
          <Gauge label="Réseau" value={s.player.reseau} tone="monde" />
          <div className="text-[11px] mt-3 italic leading-relaxed" style={{ color: "var(--color-faint)" }}>
            La fatigue, la santé, ce qui monte en silence : rien de tout cela ne s'affiche. Lisez les journaux. Écoutez les
            silences.
          </div>
        </div>
      )}

      {tab === "europe" && <Europe s={s} />}
      {tab === "promesses" && <Promesses s={s} />}
      {tab === "entourage" && <Entourage s={s} />}
      {tab === "fils" && <Fils s={s} />}
    </div>
  );
}

/** Le vocabulaire des chancelleries : on n'y dit jamais « ennemi ». */
export function etiquetteRelation(r: number): [string, string] {
  if (r >= 60) return ["Alliée", "var(--color-good)"];
  if (r >= SEUIL_ALLIE) return ["Proche", "var(--color-env)"];
  if (r > 0) return ["Correcte", "var(--color-monde)"];
  if (r > SEUIL_HOSTILE) return ["Fraîche", "var(--color-warn)"];
  if (r > -60) return ["Hostile", "var(--color-bad)"];
  return ["Rupture", "var(--color-bad)"];
}

function Europe({ s }: { s: GameState }) {
  const maj = majorite(s);
  const rangs = NATIONS.map((def) => ({ def, st: s.europe.nations[def.id] })).filter((x) => !!x.st);
  rangs.sort((a, b) => b.st.relation - a.st.relation);
  const dossiers = s.europe.dossiers;
  const enq = s.europe.enquete;

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-1.5">Au Conseil</div>
        <div className="card-flat p-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[12px]" style={{ color: "var(--color-muted)" }}>
              Une initiative française réunirait
            </span>
            <span className="text-[17px] font-bold" style={{ color: maj >= 60 ? "var(--color-good)" : maj >= 40 ? "var(--color-monde)" : "var(--color-bad)" }}>
              {maj} %
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--color-line)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${maj}%`, background: maj >= 60 ? "var(--color-good)" : maj >= 40 ? "var(--color-monde)" : "var(--color-bad)" }}
            />
          </div>
          <div className="text-[11px] mt-1.5 italic" style={{ color: "var(--color-faint)" }}>
            Il en faut 60 pour qu'un texte passe sans marchandage.
          </div>
        </div>
      </div>

      <div>
        <div className="label mb-1.5">Les capitales</div>
        <div className="space-y-1.5">
          {rangs.map(({ def, st }) => {
            const [libelle, ton] = etiquetteRelation(st.relation);
            const ecart = Math.abs(s.bord - st.bord);
            return (
              <div key={def.id} className="card-flat p-2.5" style={{ borderLeft: `3px solid ${ton}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold">{def.nom}</span>
                  <div className="flex gap-1 items-center">
                    {st.savoir >= 35 && <Tag tone="var(--color-bad)">◐ En sait trop</Tag>}
                    <Tag tone={ton}>{libelle}</Tag>
                  </div>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                  {def.capitale}
                  {def.institution ? " · l'institution, pas un vote" : def.horsUnion ? " · hors de l'Union" : ` · poids ${def.poids}`}
                  {" · "}
                  {ecart <= 3 ? "ligne proche" : ecart <= 6 ? "ligne différente" : "à l'opposé"}
                  {st.faveurs >= 10 ? " · vous doit une faveur" : st.faveurs <= -10 ? " · vous lui devez" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label mb-1.5">Ce qui traîne</div>
        {dossiers.length === 0 ? (
          <div className="text-[12.5px] italic" style={{ color: "var(--color-faint)" }}>
            Rien qui puisse vous être reproché. Pour l'instant, personne ne cherche.
          </div>
        ) : (
          <div className="space-y-1.5">
            {dossiers.map((d) => (
              <div
                key={d.id}
                className="card-flat p-2.5"
                style={{ borderLeft: `3px solid ${d.public ? "var(--color-bad)" : d.etouffe ? "var(--color-warn)" : "var(--color-muted)"}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] leading-snug">{d.titre}</span>
                  <Tag tone={d.public ? "var(--color-bad)" : d.etouffe ? "var(--color-warn)" : "var(--color-muted)"}>
                    {d.public ? "Public" : d.etouffe ? "Enterré" : "Discret"}
                  </Tag>
                </div>
              </div>
            ))}
            <div className="text-[11px] italic" style={{ color: "var(--color-faint)" }}>
              Un dossier enterré n'est pas un dossier détruit.
            </div>
          </div>
        )}
      </div>

      {enq && (
        <div>
          <div className="label mb-1.5" style={{ color: "var(--color-bad)" }}>
            Le parquet européen
          </div>
          <div className="card-flat p-3" style={{ borderLeft: `3px solid ${enq.enterree ? "var(--color-warn)" : "var(--color-bad)"}` }}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-semibold">{ETAPES_ENQUETE[enq.etape]?.titre}</span>
              <Tag tone={enq.enterree ? "var(--color-warn)" : "var(--color-bad)"}>
                {enq.enterree ? "Suspendue" : `Étape ${enq.etape}/4`}
              </Tag>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex-1 rounded-full"
                  style={{ height: 4, background: n <= enq.etape ? (enq.enterree ? "var(--color-warn)" : "var(--color-bad)") : "var(--color-line)" }}
                />
              ))}
            </div>
            <div className="text-[11.5px] leading-snug" style={{ color: "var(--color-muted)" }}>
              {ETAPES_ENQUETE[enq.etape]?.resume}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatBar({ s }: { s: GameState }) {
  const total = 577;
  const pct = (s.power.sieges / total) * 100;
  const majoritePct = (289 / total) * 100;
  const statut = s.cohabitation
    ? { label: "Cohabitation", tone: "var(--color-bad)" }
    : s.power.sieges >= 289
      ? { label: "Majorité absolue", tone: "var(--color-good)" }
      : { label: "Majorité relative", tone: "var(--color-warn)" };
  return (
    <div className="card-flat p-3">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-lg font-bold tabular-nums" style={{ color: statut.tone }}>
          {s.power.sieges}
          <span className="text-[11px] font-normal" style={{ color: "var(--color-faint)" }}>
            {" "}
            / 577
          </span>
        </span>
        <Tag tone={statut.tone}>{statut.label}</Tag>
      </div>
      <div className="relative">
        <div className="gauge-track" style={{ height: 10, "--tone": statut.tone } as React.CSSProperties}>
          <div className="gauge-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="absolute top-0 bottom-0 w-px" style={{ left: `${majoritePct}%`, background: "var(--color-text)", opacity: 0.65 }} />
      </div>
      <div className="text-[10px] mt-1" style={{ color: "var(--color-faint)" }}>
        Le trait marque la majorité absolue (289)
      </div>
    </div>
  );
}

function Promesses({ s }: { s: GameState }) {
  if (s.promises.length === 0)
    return (
      <div className="text-[13px] italic" style={{ color: "var(--color-faint)" }}>
        Aucune promesse — la campagne n'a pas commencé.
      </div>
    );
  const meta: Record<string, { label: string; tone: string }> = {
    tenue: { label: "Tenue", tone: "var(--color-good)" },
    trahie: { label: "Trahie", tone: "var(--color-bad)" },
    partielle: { label: "Engagée", tone: "var(--color-warn)" },
    en_cours: { label: "En attente", tone: "var(--color-faint)" },
  };
  const tenues = s.promises.filter((p) => p.status === "tenue").length;
  const trahies = s.promises.filter((p) => p.status === "trahie").length;
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 mb-1">
        <Tag tone="var(--color-good)">{tenues} tenue{tenues > 1 ? "s" : ""}</Tag>
        <Tag tone="var(--color-bad)">{trahies} trahie{trahies > 1 ? "s" : ""}</Tag>
        <Tag tone="var(--color-faint)">{s.promises.length - tenues - trahies} en cours</Tag>
      </div>
      {s.promises.map((p) => {
        const def = PROMESSES.find((d) => d.id === p.id);
        const m = meta[p.status];
        return (
          <div key={p.id} className="card-flat px-2.5 py-2" style={{ borderLeft: `3px solid ${m.tone}` }}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px]">{def?.label ?? p.id}</span>
              <Tag tone={m.tone}>{m.label}</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Les fils en cours : ce qu'on a dit, et qui ne l'a pas oublié
// ---------------------------------------------------------------------------

const ARME_LABEL: Record<string, string> = {
  publication: "Un livre, un dossier, une publication",
  motion: "Une motion, des signatures dans votre camp",
  putsch: "L'état-major, et ce qu'il peut faire",
  censure: "Une censure transpartisane",
  greve: "Le blocage du pays",
  revelation: "Ce qu'on sait de vous, de près",
};

function Fils({ s }: { s: GameState }) {
  const v = s.vendetta;
  const perso = v ? CAST.find((c) => c.id === v.id) : null;
  const dits = [...s.propos].sort((a, b) => Number(a.tenu) - Number(b.tenu) || b.turn - a.turn);

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-1.5">Ce qui se prépare</div>
        {v && perso && !v.desamorcee ? (
          <div
            className="card-flat p-3"
            style={{ borderLeft: `3px solid ${v.etape >= 3 ? "var(--color-bad)" : "var(--color-warn)"}` }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-semibold">{nomCompletDe(s, v.id)}</span>
              <Tag tone={v.etape >= 3 ? "var(--color-bad)" : "var(--color-warn)"}>Étape {v.etape}/4</Tag>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex-1 rounded-full"
                  style={{ height: 4, background: n <= v.etape ? (v.etape >= 3 ? "var(--color-bad)" : "var(--color-warn)") : "var(--color-line)" }}
                />
              ))}
            </div>
            <div className="text-[11.5px] leading-snug" style={{ color: "var(--color-muted)" }}>
              {ETAPES[v.etape]?.resume}
            </div>
            <div className="text-[11px] mt-1.5 italic" style={{ color: "var(--color-faint)" }}>
              {v.etape >= 2 ? ARME_LABEL[armeDe(v.id)] : "On ne sait pas encore de quoi il est capable."}
            </div>
          </div>
        ) : (
          <div className="text-[12.5px] italic" style={{ color: "var(--color-faint)" }}>
            Personne, pour l'instant, ne prépare rien contre vous. Surveillez les rancunes dans l'entourage.
          </div>
        )}
      </div>

      <div>
        <div className="label mb-1.5">Ce que vous avez dit</div>
        {dits.length === 0 ? (
          <div className="text-[12.5px] italic" style={{ color: "var(--color-faint)" }}>
            Rien d'engageant n'a encore été prononcé en public.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[300px] panneau-scroll">
            {dits.map((p) => (
              <div
                key={p.id}
                className="card-flat px-2.5 py-2"
                style={{ borderLeft: `3px solid ${p.tenu ? "var(--color-good)" : "var(--color-bad)"}` }}
              >
                <div className="text-[12px] leading-snug" style={{ color: "var(--color-muted)" }}>
                  « {p.citation} »
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[10px]" style={{ color: "var(--color-faint)" }}>
                    {p.contexte}
                  </span>
                  <Tag tone={p.tenu ? "var(--color-good)" : "var(--color-bad)"}>{p.tenu ? "Tenue" : "Reniée"}</Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Le journal des impacts — le suivi permanent de ce que vos choix produisent
// ---------------------------------------------------------------------------

const KIND_ICONE: Record<string, string> = {
  stat: "◆",
  relation: "◈",
  promesse: "★",
  signal: "◐",
};

export function Ledger({ s }: { s: GameState }) {
  const [ouvert, setOuvert] = useState(true);
  if (s.ledger.length === 0) return null;

  // Regroupé par semestre, du plus récent au plus ancien.
  const groupes: { turn: number; entries: typeof s.ledger }[] = [];
  for (const e of s.ledger) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.turn === e.turn) dernier.entries.push(e);
    else groupes.push({ turn: e.turn, entries: [e] });
  }

  return (
    <div className="card p-3">
      <button className="flex items-center justify-between w-full mb-2" onClick={() => setOuvert(!ouvert)}>
        <span className="label" data-aide="Chaque conséquence chiffrée de vos décisions, semestre par semestre.">
          Journal des impacts
        </span>
        <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
          {ouvert ? "▾" : "▸"}
        </span>
      </button>
      {ouvert && (
        <div className="space-y-2.5 max-h-[420px] panneau-scroll">
          {groupes.slice(0, 8).map((gr, gi) => (
            <div key={gi}>
              <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--color-faint)" }}>
                Semestre {gr.turn}
              </div>
              <div className="space-y-0.5">
                {gr.entries.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-2 text-[11px] px-1.5 py-1 rounded"
                    style={{ background: "color-mix(in srgb, var(--color-surface-2) 60%, transparent)" }}
                  >
                    <span className="flex items-baseline gap-1.5 min-w-0">
                      <span style={{ color: e.bon ? "var(--color-good)" : "var(--color-bad)", fontSize: 8 }}>
                        {KIND_ICONE[e.kind]}
                      </span>
                      <span className="truncate" style={{ color: "var(--color-muted)" }}>
                        {e.label}
                      </span>
                    </span>
                    {e.value !== undefined && (
                      <b className="tabular-nums shrink-0" style={{ color: e.bon ? "var(--color-good)" : "var(--color-bad)" }}>
                        {e.value > 0 ? "+" : ""}
                        {e.value}
                        {e.suffix ?? ""}
                      </b>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barre du haut
// ---------------------------------------------------------------------------

export function TopBar({ s }: { s: GameState }) {
  const deriveTier = s.derive >= 8 ? 3 : s.derive >= 5 ? 2 : s.derive >= 3 ? 1 : 0;
  return (
    <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
      <div className="flex items-center gap-3">
        <div className="portrait-officiel">
          <span style={{ fontSize: `calc(var(--portrait-size) * 0.4)` }}>{s.bio.prenom ? s.bio.prenom[0] + s.bio.nom[0] : "RF"}</span>
        </div>
        <div>
          <div className="font-serif text-[17px] leading-tight">
            {s.bio.prenom} {s.bio.nom}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px]" style={{ color: "var(--color-faint)" }}>
              {s.act === "mandat" || s.act === "crise" ? `Mandat ${s.mandat} · T${s.semestre} ${s.year} · ${s.bio.age} ans` : `${s.bio.age} ans`}
            </span>
            <Tag tone={bordMeta(s.bord).tone} aide={bordMeta(s.bord).resume}>
              {bordMeta(s.bord).court}
            </Tag>
          </div>
        </div>
        {deriveTier < 2 && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px]"
            title="La photo de famille, sur le bureau"
            style={{ border: "1px solid var(--color-line)", color: "var(--color-env)" }}
          >
            ❦
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="press-une text-xl tracking-[0.3em]" style={{ color: "var(--color-muted)" }}>
          MANDAT
        </div>
        {(s.act === "mandat" || s.act === "crise") && (
          <div className="flex gap-1.5 items-center justify-end mt-1.5">
            {Array.from({ length: s.pcMax }).map((_, i) => (
              <div key={i} className="pip" data-on={i < s.pc} />
            ))}
            <span className="text-[10px] ml-1" style={{ color: "var(--color-faint)" }}>
              capital
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { SEGMENTS, CAMP_TONE };
