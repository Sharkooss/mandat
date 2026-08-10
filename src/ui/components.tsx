import { useState } from "react";
import type { GameState, PressItem } from "../engine/types";
import { CAST, SEGMENTS, PROMESSES } from "../content/france/data";
import { getEvent } from "../engine/registry";
import { useGame } from "../store";

// ---------------------------------------------------------------------------

export function Gauge({ label, value, max = 100, color, suffix }: { label: string; value: number; max?: number; color?: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-paper-300 mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums">{suffix ? `${value.toFixed(1)}${suffix}` : Math.round(value)}</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: color ?? "var(--accent)" }} />
      </div>
    </div>
  );
}

export function Pips({ n, max }: { n: number; max: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-3.5 h-3.5 rounded-full border"
          style={{
            background: i < n ? "var(--color-accent-warm)" : "transparent",
            borderColor: "var(--color-paper-500)",
          }}
        />
      ))}
      <span className="text-xs text-paper-500 ml-1">capital politique</span>
    </div>
  );
}

// ---------------------------------------------------------------------------

const TONE_STYLE: Record<PressItem["tone"], string> = {
  hostile: "text-red-300",
  neutre: "text-paper-100",
  favorable: "text-emerald-200",
  servile: "text-paper-500 italic",
  satirique: "text-amber-200",
};

export function PressList({ items }: { items: PressItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) =>
        it.kind === "une" ? (
          <div key={i} className={`press-une text-xl leading-snug border-b border-ink-600 pb-3 ${TONE_STYLE[it.tone]}`}>
            {it.text}
          </div>
        ) : it.kind === "symptome" ? (
          <div key={i} className="text-sm italic text-paper-500 pl-3 border-l-2" style={{ borderColor: "var(--color-danger)" }}>
            {it.text}
          </div>
        ) : (
          <div key={i} className={`text-sm ${TONE_STYLE[it.tone]}`}>
            {it.text}
          </div>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function EventView({ s }: { s: GameState }) {
  const chooseOption = useGame((g) => g.chooseOption);
  const continueAfter = useGame((g) => g.continueAfter);
  const ev = s.currentEvent ? getEvent(s.currentEvent) : null;
  if (!ev) return null;
  const source = ev.source ? CAST.find((c) => c.id === ev.source) : null;
  const texte = typeof ev.texte === "function" ? ev.texte(s) : ev.texte;

  return (
    <div className="dossier p-6 fade-in" key={ev.id + (s.resolution ? "-r" : "")}>
      <div className="text-xs uppercase tracking-widest text-paper-500 mb-1">
        {ev.kind === "crise" ? "Cellule de crise" : ev.kind === "intrigue" ? "Dossier sensible" : ev.kind === "monde" ? "Le monde" : ev.kind === "perso" ? "Vie privée" : "Le trimestre"}
      </div>
      <h2 className="press-une text-2xl mb-3">{ev.titre}</h2>
      {source && (
        <div className="text-xs text-paper-500 mb-3">
          Rapporté par {source.nom}, {source.role.toLowerCase()}
          {source.biais ? <span className="italic"> — on dit de lui/elle : {source.biais}</span> : null}
        </div>
      )}
      {!s.resolution ? (
        <>
          <p className="text-[15px] leading-relaxed text-paper-100/90 mb-5 whitespace-pre-line">{texte}</p>
          <div className="space-y-2">
            {ev.choices
              .filter((c) => !c.cond || c.cond(s))
              .map((c) => (
                <button key={c.id} className="btn-choice" onClick={() => chooseOption(c.id)}>
                  <div className="font-semibold text-sm">{c.label}</div>
                  {c.detail && <div className="text-xs text-paper-500 mt-0.5">{c.detail}</div>}
                </button>
              ))}
          </div>
        </>
      ) : (
        <div className="fade-in">
          <p className="text-[15px] leading-relaxed text-paper-100/90 mb-5 whitespace-pre-line border-l-2 pl-4" style={{ borderColor: "var(--color-accent-warm)" }}>
            {s.resolution}
          </p>
          <button className="btn-primary" onClick={continueAfter}>
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function loyLabel(l: number): string {
  if (l >= 75) return "dévoué";
  if (l >= 55) return "loyal";
  if (l >= 35) return "distant";
  if (l >= 15) return "froid";
  return "hostile";
}
function ambLabel(a: number): string {
  if (a >= 75) return "dévorante";
  if (a >= 55) return "affirmée";
  if (a >= 30) return "contenue";
  return "modeste";
}

export function StatsTabs({ s }: { s: GameState }) {
  const [tab, setTab] = useState<"vous" | "pays" | "pouvoir" | "promesses" | "entourage">("pays");
  const tabs = [
    ["pays", "Le pays"],
    ["pouvoir", "Le pouvoir"],
    ["vous", "Vous"],
    ["promesses", "Promesses"],
    ["entourage", "Entourage"],
  ] as const;

  return (
    <div className="dossier p-4">
      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              background: tab === id ? "var(--accent)" : "var(--color-ink-700)",
              color: tab === id ? "#fff" : "var(--color-paper-300)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pays" && (
        <div>
          <Gauge label="Croissance" value={s.country.croissance} max={5} suffix=" %" color="#4a8a5c" />
          <Gauge label="Chômage" value={s.country.chomage} max={15} suffix=" %" color="#a05c3c" />
          <Gauge label="Inflation" value={s.country.inflation} max={8} suffix=" %" color="#a05c3c" />
          <Gauge label="Dette (% PIB)" value={s.country.dette} max={200} suffix=" %" color="#a03c3c" />
          <Gauge label="Marge budgétaire" value={s.country.marge} />
          <Gauge label="Services publics" value={s.country.services} />
          <Gauge label="Sécurité" value={s.country.securite} />
          <Gauge label="Environnement" value={s.country.environnement} color="#4a8a5c" />
          <Gauge label="Cohésion sociale" value={s.country.cohesion} />
          <Gauge label="Prestige international" value={s.country.prestige} color="var(--color-accent-warm)" />
        </div>
      )}

      {tab === "pouvoir" && (
        <div>
          <Gauge label="Popularité" value={s.power.popularite} color="var(--color-accent-warm)" />
          <Gauge label="Sièges à l'Assemblée" value={s.power.sieges} max={577} />
          <div className="text-[10px] text-paper-500 -mt-1 mb-2">majorité absolue : 289{s.cohabitation ? " — COHABITATION" : s.power.sieges > 0 && s.power.sieges < 289 ? " — majorité relative" : ""}</div>
          <Gauge label="Loyauté du parti" value={s.power.parti} />
          <Gauge label="Presse" value={s.power.presse} />
          <Gauge label="Armée" value={s.power.armee} />
          <Gauge label="Patronat" value={s.power.patronat} />
          <Gauge label="Syndicats" value={s.power.syndicats} />
          <Gauge label="Sérénité judiciaire" value={s.power.justice} />
        </div>
      )}

      {tab === "vous" && (
        <div>
          <Gauge label="Charisme" value={s.player.charisme} />
          <Gauge label="Rhétorique" value={s.player.rhetorique} />
          <Gauge label="Stratégie" value={s.player.strategie} />
          <Gauge label="Intégrité" value={s.player.integrite} color="#4a8a5c" />
          <Gauge label="Cynisme" value={s.player.cynisme} color="#a05c3c" />
          <Gauge label="Endurance" value={s.player.endurance} />
          <Gauge label="Réseau" value={s.player.reseau} />
          <div className="text-[11px] text-paper-500 mt-3 italic">
            Le reste — la fatigue, la santé, ce qui monte en silence — ne s'affiche nulle part. Lisez les journaux. Écoutez les silences.
          </div>
        </div>
      )}

      {tab === "promesses" && (
        <div className="space-y-2">
          {s.promises.length === 0 && <div className="text-sm text-paper-500 italic">Aucune promesse — la campagne n'a pas commencé.</div>}
          {s.promises.map((p) => {
            const def = PROMESSES.find((d) => d.id === p.id);
            const badge =
              p.status === "tenue" ? ["Tenue", "#4a8a5c"] : p.status === "trahie" ? ["Trahie", "#a03c3c"] : p.status === "partielle" ? ["Engagée", "var(--color-accent-warm)"] : ["En attente", "var(--color-ink-600)"];
            return (
              <div key={p.id} className="flex items-start justify-between gap-2 text-sm border-b border-ink-700 pb-2">
                <span className="text-paper-100/90">{def?.label ?? p.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: badge[1] }}>
                  {badge[0]}
                </span>
              </div>
            );
          })}
          <div className="text-[11px] text-paper-500 italic pt-1">La presse et les électeurs tiennent le même dossier. À jour.</div>
        </div>
      )}

      {tab === "entourage" && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {CAST.filter((c) => s.characters[c.id]?.vivant).map((c) => {
            const st = s.characters[c.id];
            const nom = c.id === "conjoint" ? s.bio.conjointPrenom : c.nom;
            return (
              <div key={c.id} className="text-sm border-b border-ink-700 pb-1.5">
                <div className="flex justify-between">
                  <span className={st.enPoste ? "" : "line-through text-paper-500"}>{nom}</span>
                  <span className="text-xs text-paper-500">{loyLabel(st.loyaute)}</span>
                </div>
                <div className="text-[11px] text-paper-500">
                  {c.role}
                  {st.ambition >= 55 ? ` · ambition ${ambLabel(st.ambition)}` : ""}
                  {st.rancune >= 25 ? " · rancunier" : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function TopBar({ s }: { s: GameState }) {
  const deriveTier = s.derive >= 8 ? 3 : s.derive >= 5 ? 2 : s.derive >= 3 ? 1 : 0;
  return (
    <div className="flex items-center justify-between gap-4 mb-5 border-b border-ink-700 pb-4">
      <div className="flex items-center gap-4">
        <div className="portrait-officiel" title="Le portrait officiel">
          <span style={{ fontSize: `calc(var(--portrait-size) * 0.45)` }}>{s.bio.prenom ? s.bio.prenom[0] + s.bio.nom[0] : "RF"}</span>
        </div>
        <div>
          <div className="font-serif text-lg tracking-wide">
            {s.bio.prenom} {s.bio.nom}
          </div>
          <div className="text-xs text-paper-500">
            {s.act === "mandat" || s.act === "crise" ? `Mandat ${s.mandat} · T${s.trimestre} ${s.year} · ${s.bio.age} ans` : `${s.bio.age} ans`}
          </div>
        </div>
        {deriveTier < 2 && (
          <div className="w-8 h-8 rounded-sm border border-ink-600 flex items-center justify-center text-xs opacity-60" title="La photo de famille, sur le bureau">
            ❦
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="press-une text-2xl tracking-[0.3em] text-paper-300">MANDAT</div>
        {(s.act === "mandat" || s.act === "crise") && <Pips n={s.pc} max={s.pcMax} />}
      </div>
    </div>
  );
}

export { SEGMENTS };
