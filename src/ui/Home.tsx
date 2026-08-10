import { useGame } from "../store";
import { Tag } from "./components";

const RARETE_TONE: Record<string, string> = {
  "très commune": "var(--color-r-commune)",
  commune: "var(--color-r-commune)",
  "peu commune": "var(--color-r-peu)",
  rare: "var(--color-r-rare)",
  exceptionnelle: "var(--color-r-legend)",
};

export default function Home() {
  const newGame = useGame((g) => g.newGame);
  const pantheon = useGame((g) => g.pantheon);

  return (
    <div className="max-w-2xl mx-auto pt-16 px-5 pb-16 fade-in">
      <div className="text-center mb-10">
        <h1 className="press-une text-6xl tracking-[0.3em] mb-5">MANDAT</h1>
        <p className="text-[17px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
          De militant local à statue sur une place publique —<br />
          ou à cadavre dans une limousine.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        <Tag tone="var(--color-eco)">France</Tag>
        <Tag tone="var(--color-social)">45 à 90 minutes</Tag>
        <Tag tone="var(--color-monde)">16 fins</Tag>
        <Tag tone="var(--color-perso)">Gratuit, sans compte</Tag>
      </div>

      <div className="flex justify-center mb-12">
        <button className="btn-primary text-[16px] px-9 py-3.5" onClick={newGame}>
          Commencer une carrière
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 mb-10">
        {[
          { t: "Décider dans le brouillard", d: "Vos conseillers ont un agenda. Leurs chiffres aussi.", tone: "var(--color-secu)" },
          { t: "Tout revient", d: "Le pot-de-vin du 4e semestre ressort au 38e.", tone: "var(--color-monde)" },
          { t: "On se souvient de vous", d: "Trente personnages, et chacun tient ses comptes.", tone: "var(--color-pouvoir)" },
        ].map((c) => (
          <div key={c.t} className="card-flat p-3" style={{ borderLeft: `3px solid ${c.tone}` }}>
            <div className="text-[13px] font-semibold mb-1" style={{ color: c.tone }}>
              {c.t}
            </div>
            <div className="text-[11.5px] leading-snug" style={{ color: "var(--color-faint)" }}>
              {c.d}
            </div>
          </div>
        ))}
      </div>

      {pantheon.length > 0 && (
        <div className="card p-5">
          <div className="label mb-3">Votre panthéon</div>
          <div className="space-y-1.5">
            {[...pantheon].reverse().slice(0, 10).map((p, i) => (
              <div key={i} className="flex justify-between items-center gap-2 card-flat px-3 py-2">
                <div>
                  <div className="text-[13px] font-semibold">{p.nom}</div>
                  <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>
                    {p.ending} · {p.annees} an{p.annees > 1 ? "s" : ""}
                  </div>
                </div>
                <Tag tone={RARETE_TONE[p.rarete] ?? "var(--color-r-commune)"}>{p.rarete}</Tag>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-[11px] mt-8" style={{ color: "var(--color-faint)" }}>
        Pays réels, institutions réelles. Tous les personnages sont fictifs.
      </div>
    </div>
  );
}
