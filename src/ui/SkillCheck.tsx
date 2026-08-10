import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckPlan, CheckRang } from "../engine/types";
import { rangMeta } from "../engine/check";
import { useGame } from "../store";

// ---------------------------------------------------------------------------
// Le moment de vérité. Un curseur balaie la barre, une fenêtre attend au bon
// endroit : c'est le direct, la salle, la seconde où il faut parler.
//
// La fenêtre est large quand vous êtes bon et reposé, étroite quand le choix
// est risqué ou que vous n'avez pas dormi depuis trois jours.
//
// Le balayage est une animation CSS et non une boucle JavaScript : on lit la
// position réellement affichée au moment du clic, et un garde-fou en temps
// mural referme la séquence même si l'onglet est passé en arrière-plan — un
// mini-jeu ne doit jamais pouvoir bloquer une partie.
// ---------------------------------------------------------------------------

/** Marge, en % de la barre, au-delà de laquelle un raté devient un naufrage. */
const MARGE_DESASTRE = 9;

function evaluer(plan: CheckPlan, p: number): CheckRang {
  const zDebut = plan.depart;
  const zFin = plan.depart + plan.zone;
  const cDebut = plan.depart + (plan.zone - plan.zoneCrit) / 2;
  const cFin = cDebut + plan.zoneCrit;
  if (p >= cDebut && p <= cFin) return "critique";
  if (p >= zDebut && p <= zFin) return "reussite";
  const ecart = p < zDebut ? zDebut - p : p - zFin;
  return ecart <= MARGE_DESASTRE ? "echec" : "desastre";
}

export default function SkillCheckOverlay({ plan }: { plan: CheckPlan }) {
  const resolveCheck = useGame((g) => g.resolveCheck);
  const [rang, setRang] = useState<CheckRang | null>(null);
  const [impact, setImpact] = useState<number | null>(null);

  const piste = useRef<HTMLDivElement>(null);
  const curseur = useRef<HTMLDivElement>(null);
  const clos = useRef(false);

  const duree = plan.vitesse * plan.passes;
  const critDebut = plan.depart + (plan.zone - plan.zoneCrit) / 2;

  /** La position du curseur telle qu'elle est affichée, en % de la piste. */
  const positionAffichee = useCallback((): number | null => {
    if (!piste.current || !curseur.current) return null;
    const largeur = piste.current.getBoundingClientRect().width;
    if (largeur <= 0) return null;
    const gauche = parseFloat(getComputedStyle(curseur.current).left);
    if (!Number.isFinite(gauche)) return null;
    return Math.max(0, Math.min(100, (gauche / largeur) * 100));
  }, []);

  const terminer = useCallback(
    (viseur: boolean) => {
      if (clos.current) return;
      clos.current = true;
      // Rester muet n'est pas un désastre — c'est seulement un mauvais moment.
      const p = viseur ? positionAffichee() : null;
      const r: CheckRang = p === null ? "echec" : evaluer(plan, p);
      setImpact(p);
      setRang(r);
      window.setTimeout(() => resolveCheck(r), 1250);
    },
    [plan, positionAffichee, resolveCheck]
  );

  // Garde-fou : passé le dernier balayage, le silence vaut réponse.
  useEffect(() => {
    const t = window.setTimeout(() => terminer(false), duree + 150);
    return () => window.clearTimeout(t);
  }, [duree, terminer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      terminer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terminer]);

  const meta = rang ? rangMeta(rang) : null;
  const fige = rang ? ("paused" as const) : ("running" as const);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-5"
      style={{ background: "color-mix(in srgb, #0b0c13 78%, transparent)", backdropFilter: "blur(3px)" }}
      onMouseDown={() => terminer(true)}
    >
      <div className="card p-6 w-full max-w-lg pop-in" style={{ cursor: rang ? "default" : "pointer" }}>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="tag" style={{ "--tone": "var(--color-perso)" } as React.CSSProperties}>
            ◈ Moment de vérité
          </span>
          <div className="flex gap-1.5">
            <span className="tag" style={{ "--tone": "var(--color-monde)" } as React.CSSProperties}>
              {plan.aptitudeLabel}
            </span>
            <span
              className="tag"
              style={
                {
                  "--tone": plan.difficulte === 3 ? "var(--color-bad)" : plan.difficulte === 2 ? "var(--color-warn)" : "var(--color-env)",
                } as React.CSSProperties
              }
            >
              {plan.difficulteLabel}
            </span>
          </div>
        </div>

        <h3 className="press-une text-xl leading-tight mb-1">{plan.titre}</h3>
        <p className="text-[12.5px] mb-5" style={{ color: "var(--color-faint)" }}>
          {plan.consigne} — arrêtez le curseur dans la zone claire, au cœur si vous pouvez.
        </p>

        <div ref={piste} className="check-piste">
          <div className="check-zone" style={{ left: `${plan.depart}%`, width: `${plan.zone}%` }} />
          <div className="check-crit" style={{ left: `${critDebut}%`, width: `${plan.zoneCrit}%` }} />
          {impact !== null && <div className="check-impact" style={{ left: `${impact}%` }} />}
          <div
            ref={curseur}
            className="check-curseur"
            style={{
              animationDuration: `${plan.vitesse}ms`,
              animationIterationCount: plan.passes,
              animationPlayState: fige,
              opacity: rang ? 0.3 : 1,
            }}
          />
        </div>

        {/* Le temps qui reste : trois balayages, pas un de plus. */}
        <div className="check-temps mt-2.5">
          <div className="check-temps-fill" style={{ animationDuration: `${duree}ms`, animationPlayState: fige }} />
        </div>

        <div className="mt-4 min-h-8 flex items-center">
          {meta ? (
            <span className="chip pop-in text-[13px] px-3 py-1.5" style={{ "--tone": meta.tone } as React.CSSProperties}>
              {rang === "critique" ? "★" : rang === "reussite" ? "✓" : rang === "echec" ? "◇" : "✕"} {meta.label}
            </span>
          ) : (
            <span className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>
              Cliquez, ou appuyez sur <b style={{ color: "var(--color-muted)" }}>Espace</b>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
