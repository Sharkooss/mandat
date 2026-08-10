import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { affiche, type Portrait } from "../content/france/affiche";
import { Tag } from "./components";
import { RichText } from "./RichText";

// ---------------------------------------------------------------------------
// Le face-à-face, avant la première semaine. Deux colonnes, deux visages :
// c'est la seule manière de faire comprendre en un écran que ce qui va suivre
// oppose quelqu'un à quelqu'un, et pas un joueur à un tableau de boutons.
// ---------------------------------------------------------------------------

function Initiales({ nom, tone }: { nom: string; tone: string }) {
  const lettres = nom
    .split(" ")
    .filter(Boolean)
    .map((m) => m[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center font-serif text-[20px] shrink-0"
      style={{ background: `color-mix(in srgb, ${tone} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`, color: tone }}
    >
      {lettres}
    </div>
  );
}

function Fiche({ p, accent, cote }: { p: Portrait; accent: string; cote: string }) {
  return (
    <div className="card p-5 flex flex-col" style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}>
      <div className="label mb-3" style={{ color: accent }}>
        {cote}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <Initiales nom={p.nom} tone={accent} />
        <div className="min-w-0">
          <div className="press-une text-xl leading-tight">{p.nom}</div>
          <div className="text-[11.5px] mt-0.5" style={{ color: "var(--color-faint)" }}>
            {p.etiquette}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <Tag tone={p.ligneTone}>{p.ligne}</Tag>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {p.recit.map((par, i) => (
          <RichText key={i} className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
            {par}
          </RichText>
        ))}
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex gap-2 text-[11.5px] leading-snug">
          <span style={{ color: "var(--color-good)" }}>▲</span>
          <span style={{ color: "var(--color-muted)" }}>{p.atout}</span>
        </div>
        <div className="flex gap-2 text-[11.5px] leading-snug">
          <span style={{ color: "var(--color-bad)" }}>▼</span>
          <span style={{ color: "var(--color-muted)" }}>{p.faille}</span>
        </div>
      </div>

      <div
        className="text-center py-2 rounded-lg press-une text-[15px]"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent }}
      >
        {p.slogan}
      </div>
    </div>
  );
}

export default function Affiche({ s }: { s: GameState }) {
  const closeAffiche = useGame((g) => g.closeAffiche);
  const a = affiche(s);
  const total = a.sondage.joueur + a.sondage.opposant + a.sondage.tiers;

  return (
    <div className="max-w-4xl mx-auto pt-10 px-5 pb-16 fade-in">
      <Tag tone="var(--color-social)">{s.campaign!.kind === "reelection" ? "Réélection" : "Acte III — La campagne"}</Tag>
      <h1 className="press-une text-3xl mt-3 mb-2">{a.titre}</h1>
      <p className="text-[13px] mb-6 leading-relaxed max-w-2xl" style={{ color: "var(--color-muted)" }}>
        {a.chapeau}
      </p>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <Fiche p={a.vous} accent="var(--accent)" cote="Vous" />
        <Fiche p={a.adversaire} accent="var(--color-bad)" cote="Contre vous" />
      </div>

      <div className="card p-5 mb-4">
        <div className="label mb-3">Première vague — intentions de vote au premier tour</div>
        <div className="flex h-9 rounded-lg overflow-hidden mb-2" style={{ border: "1px solid var(--color-line)" }}>
          <div
            className="flex items-center justify-center text-[12px] font-bold"
            style={{ width: `${(a.sondage.joueur / total) * 100}%`, background: "color-mix(in srgb, var(--accent) 40%, transparent)" }}
          >
            {a.sondage.joueur} %
          </div>
          <div
            className="flex items-center justify-center text-[12px] font-bold"
            style={{ width: `${(a.sondage.opposant / total) * 100}%`, background: "color-mix(in srgb, var(--color-bad) 32%, transparent)" }}
          >
            {a.sondage.opposant} %
          </div>
          <div
            className="flex items-center justify-center text-[11px]"
            style={{ width: `${(a.sondage.tiers / total) * 100}%`, background: "var(--color-surface-2)", color: "var(--color-faint)" }}
          >
            {a.sondage.tiers} %
          </div>
        </div>
        <div className="flex justify-between text-[11px]" style={{ color: "var(--color-faint)" }}>
          <span>Vous</span>
          <span>{a.adversaire.nom}</span>
          <span>Autres candidatures</span>
        </div>
      </div>

      <div className="card p-5 mb-6" style={{ borderColor: "color-mix(in srgb, var(--color-warn) 32%, transparent)" }}>
        <div className="label mb-1.5" style={{ color: "var(--color-warn)" }}>
          ◎ Là où ça se jouera
        </div>
        <div className="press-une text-lg mb-1">{a.champDeBataille.nom}</div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {a.champDeBataille.detail}
        </p>
      </div>

      <button className="btn-primary text-[15px] px-7 py-2.5" onClick={closeAffiche}>
        Première semaine de campagne
      </button>
    </div>
  );
}
