import { useRef } from "react";
import type { GameState } from "../engine/types";
import { useGame } from "../store";

function NoteBar({ nom, note }: { nom: string; note: number }) {
  const color = note >= 13 ? "#4a8a5c" : note >= 8 ? "var(--color-accent-warm)" : "#a03c3c";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span>{nom}</span>
        <span className="tabular-nums text-paper-300">{note}/20</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${(note / 20) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Final({ s }: { s: GameState }) {
  const abandon = useGame((g) => g.abandon);
  const e = s.ending!;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadCard = () => {
    const cv = document.createElement("canvas");
    cv.width = 800;
    cv.height = 460;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(0, 0, 800, 460);
    ctx.strokeStyle = "#a49b86";
    ctx.strokeRect(20, 20, 760, 420);
    ctx.fillStyle = "#cfc8b8";
    ctx.font = "28px Georgia";
    ctx.textAlign = "center";
    ctx.letterSpacing = "12px";
    ctx.fillText("M A N D A T", 400, 70);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#ece7db";
    ctx.font = "bold 40px Georgia";
    ctx.fillText(`${s.bio.prenom} ${s.bio.nom}`, 400, 150);
    ctx.font = "22px Georgia";
    ctx.fillStyle = "#a49b86";
    const annees = Math.max(0, Math.round(s.turnCount / 4));
    ctx.fillText(`${annees} an${annees > 1 ? "s" : ""} au pouvoir · ${s.year - annees}–${s.year}`, 400, 190);
    ctx.fillStyle = "#b08d3f";
    ctx.font = "bold 30px Georgia";
    ctx.fillText(`« ${e.nom} »`, 400, 260);
    ctx.fillStyle = "#cfc8b8";
    ctx.font = "18px Georgia";
    ctx.fillText(`${e.famille} — fin ${e.rarete}`, 400, 295);
    ctx.font = "15px Georgia";
    ctx.fillStyle = "#a49b86";
    const compar = e.comparatif[0];
    if (compar) ctx.fillText(`${compar.critere} : ${compar.valeur} — ${compar.rang}`, 400, 350);
    ctx.fillText("mandat.louis-nectoux.fr", 400, 420);
    const a = document.createElement("a");
    a.download = `mandat-${s.bio.nom.toLowerCase()}.png`;
    a.href = cv.toDataURL("image/png");
    a.click();
  };

  if (e.id === "hiver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-center px-6">
        <div className="fade-in max-w-md">
          <div className="press-une text-4xl mb-8 text-paper-100">L'Hiver</div>
          {e.notice.map((p, i) => (
            <p key={i} className="text-sm text-paper-500 mb-4 leading-relaxed">
              {p}
            </p>
          ))}
          <div className="text-xs text-paper-500 italic mb-10">Fin {e.rarete}.</div>
          <button className="btn-primary" onClick={abandon}>
            Recommencer le monde
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-10 px-6 pb-16 fade-in">
      {/* 1. La une du lendemain */}
      <div className="dossier p-8 mb-6 text-center" style={{ background: "var(--color-paper-100)", color: "var(--color-ink-950)" }}>
        <div className="text-[10px] uppercase tracking-[0.4em] mb-3 opacity-60">Le lendemain — édition spéciale</div>
        <div className="press-une text-3xl leading-tight">{e.une}</div>
      </div>

      {/* 2. La notice biographique */}
      <div className="dossier p-6 mb-6">
        <div className="text-xs uppercase tracking-widest text-paper-500 mb-3">La notice — ce que l'encyclopédie retiendra</div>
        {e.notice.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-paper-100/90 mb-3">
            {p}
          </p>
        ))}
      </div>

      {/* 3. Le verdict */}
      <div className="dossier p-6 mb-6">
        <div className="text-xs uppercase tracking-widest text-paper-500 mb-4">Le verdict</div>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <div className="text-xs text-paper-500 mb-2">Le legs national</div>
            {e.verdict.axesNationaux.map((a) => (
              <NoteBar key={a.nom} nom={a.nom} note={a.note} />
            ))}
          </div>
          <div>
            <div className="text-xs text-paper-500 mb-2">Le bilan personnel</div>
            {e.verdict.axesPersonnels.map((a) => (
              <NoteBar key={a.nom} nom={a.nom} note={a.note} />
            ))}
          </div>
        </div>
        <p className="text-sm italic text-paper-300 mt-4 border-t border-ink-700 pt-4">{e.verdict.jugement}</p>
      </div>

      {/* 4. Le comparatif */}
      {e.comparatif.length > 0 && (
        <div className="dossier p-6 mb-6">
          <div className="text-xs uppercase tracking-widest text-paper-500 mb-3">Face aux présidents de la Ve République</div>
          <div className="space-y-2">
            {e.comparatif.map((c) => (
              <div key={c.critere} className="flex justify-between items-baseline text-sm border-b border-ink-700 pb-2">
                <span className="text-paper-300">{c.critere}</span>
                <span className="text-right">
                  <span className="tabular-nums">{c.valeur}</span>
                  <span className="text-xs text-paper-500 block">{c.rang}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* La carte de fin */}
      <div className="dossier p-6 mb-8 text-center" style={{ borderColor: "var(--color-accent-warm)" }}>
        <div className="press-une text-xl mb-1">
          {s.bio.prenom} {s.bio.nom}
        </div>
        <div className="text-2xl press-une mb-1" style={{ color: "var(--color-accent-warm)" }}>
          « {e.nom} »
        </div>
        <div className="text-xs text-paper-500 mb-1">
          {e.famille} · fin <span className="italic">{e.rarete}</span>
        </div>
        <p className="text-sm text-paper-300 italic mb-4">{e.epitaphe}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={downloadCard}>
            Télécharger la carte
          </button>
          <button
            className="btn-primary"
            style={{ background: "var(--color-ink-700)" }}
            onClick={abandon}
          >
            Une autre carrière
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
