import type { GameState } from "../engine/types";
import { useGame } from "../store";
import { Tag } from "./components";

const RARETE_TONE: Record<string, string> = {
  "très commune": "var(--color-r-commune)",
  commune: "var(--color-r-commune)",
  "peu commune": "var(--color-r-peu)",
  rare: "var(--color-r-rare)",
  exceptionnelle: "var(--color-r-legend)",
};

function NoteBar({ nom, note }: { nom: string; note: number }) {
  const tone = note >= 14 ? "var(--color-good)" : note >= 9 ? "var(--color-warn)" : "var(--color-bad)";
  return (
    <div className="mb-2" style={{ "--tone": tone } as React.CSSProperties}>
      <div className="flex justify-between text-[11px] mb-1">
        <span style={{ color: "var(--color-muted)" }}>{nom}</span>
        <span className="tabular-nums font-bold" style={{ color: tone }}>
          {note}
          <span style={{ color: "var(--color-faint)", fontWeight: 400 }}>/20</span>
        </span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${(note / 20) * 100}%` }} />
      </div>
    </div>
  );
}

export default function Final({ s }: { s: GameState }) {
  const abandon = useGame((g) => g.abandon);
  const e = s.ending!;
  const tone = RARETE_TONE[e.rarete] ?? "var(--color-r-commune)";

  const downloadCard = () => {
    const cv = document.createElement("canvas");
    cv.width = 800;
    cv.height = 460;
    const ctx = cv.getContext("2d")!;
    const grd = ctx.createLinearGradient(0, 0, 800, 460);
    grd.addColorStop(0, "#1c1e2c");
    grd.addColorStop(1, "#14151f");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 800, 460);
    ctx.strokeStyle = "#363b52";
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, 756, 416);
    ctx.textAlign = "center";
    ctx.fillStyle = "#a5a3c0";
    ctx.font = "26px Georgia";
    ctx.fillText("M A N D A T", 400, 74);
    ctx.fillStyle = "#eceafa";
    ctx.font = "bold 40px Georgia";
    ctx.fillText(`${s.bio.prenom} ${s.bio.nom}`, 400, 152);
    const annees = Math.max(0, Math.round(s.turnCount / 4));
    ctx.font = "20px Georgia";
    ctx.fillStyle = "#a5a3c0";
    ctx.fillText(`${annees} an${annees > 1 ? "s" : ""} au pouvoir · ${s.year - annees}–${s.year}`, 400, 190);
    ctx.fillStyle = "#bda8ee";
    ctx.font = "bold 32px Georgia";
    ctx.fillText(`« ${e.nom} »`, 400, 262);
    ctx.fillStyle = "#f2cd7d";
    ctx.font = "17px Georgia";
    ctx.fillText(`${e.famille} — fin ${e.rarete}`, 400, 296);
    ctx.fillStyle = "#a5a3c0";
    ctx.font = "15px Georgia";
    const compar = e.comparatif[0];
    if (compar) ctx.fillText(`${compar.critere} : ${compar.valeur} — ${compar.rang}`, 400, 352);
    ctx.fillStyle = "#7d7b96";
    ctx.fillText("mandat.louis-nectoux.fr", 400, 414);
    const a = document.createElement("a");
    a.download = `mandat-${s.bio.nom.toLowerCase()}.png`;
    a.href = cv.toDataURL("image/png");
    a.click();
  };

  if (e.id === "hiver") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ background: "#000" }}>
        <div className="fade-in max-w-md">
          <div className="press-une text-5xl mb-8">L'Hiver</div>
          {e.notice.map((p, i) => (
            <p key={i} className="text-[13px] mb-4 leading-relaxed" style={{ color: "var(--color-faint)" }}>
              {p}
            </p>
          ))}
          <div className="mb-8">
            <Tag tone="var(--color-r-legend)">Fin exceptionnelle</Tag>
          </div>
          <button className="btn-primary" onClick={abandon}>
            Recommencer le monde
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-8 px-5 pb-16 fade-in">
      {/* 1. La une du lendemain */}
      <div className="p-7 mb-4 text-center rounded-2xl" style={{ background: "#ece7db", color: "#14151f" }}>
        <div className="text-[10px] uppercase tracking-[0.35em] mb-3 opacity-55">Le lendemain — édition spéciale</div>
        <div className="press-une text-[26px] leading-tight">{e.une}</div>
      </div>

      {/* La carte de fin */}
      <div className="card p-6 mb-4 text-center" style={{ borderColor: `color-mix(in srgb, ${tone} 40%, transparent)` }}>
        <div className="press-une text-lg" style={{ color: "var(--color-muted)" }}>
          {s.bio.prenom} {s.bio.nom}
        </div>
        <div className="press-une text-3xl my-1.5" style={{ color: tone }}>
          « {e.nom} »
        </div>
        <div className="flex justify-center gap-1.5 mb-3 flex-wrap">
          <Tag tone={tone}>{e.famille}</Tag>
          <Tag tone={tone}>Fin {e.rarete}</Tag>
          <Tag tone="var(--color-perso)">{Math.max(0, Math.round(s.turnCount / 4))} ans au pouvoir</Tag>
        </div>
        <p className="text-[14px] italic mb-5 max-w-lg mx-auto" style={{ color: "var(--color-muted)" }}>
          {e.epitaphe}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button className="btn-primary" onClick={downloadCard}>
            Télécharger la carte
          </button>
          <button className="btn-ghost" onClick={abandon}>
            Une autre carrière
          </button>
        </div>
      </div>

      {/* 3. Le verdict */}
      <div className="card p-6 mb-4">
        <div className="label mb-4">Le verdict</div>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <div className="label mb-2" style={{ color: "var(--color-eco)" }}>
              Le legs national
            </div>
            {e.verdict.axesNationaux.map((a) => (
              <NoteBar key={a.nom} nom={a.nom} note={a.note} />
            ))}
          </div>
          <div>
            <div className="label mb-2" style={{ color: "var(--color-env)" }}>
              Le bilan personnel
            </div>
            {e.verdict.axesPersonnels.map((a) => (
              <NoteBar key={a.nom} nom={a.nom} note={a.note} />
            ))}
          </div>
        </div>
        <p className="text-[13px] italic mt-4 pt-4 border-t" style={{ color: "var(--color-muted)", borderColor: "var(--color-line-soft)" }}>
          {e.verdict.jugement}
        </p>
      </div>

      {/* 4. Le comparatif */}
      {e.comparatif.length > 0 && (
        <div className="card p-6 mb-4">
          <div className="label mb-3">Face aux présidents de la Ve République</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {e.comparatif.map((c) => (
              <div key={c.critere} className="card-flat p-3" style={{ borderLeft: "3px solid var(--color-monde)" }}>
                <div className="label mb-1">{c.critere}</div>
                <div className="text-lg font-bold tabular-nums" style={{ color: "var(--color-monde)" }}>
                  {c.valeur}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                  {c.rang}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. La notice biographique */}
      <div className="card p-6">
        <div className="label mb-3">La notice — ce que l'encyclopédie retiendra</div>
        {e.notice.map((p, i) => (
          <p key={i} className="text-[14px] leading-relaxed mb-3" style={{ color: "color-mix(in srgb, var(--color-text) 85%, transparent)" }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
