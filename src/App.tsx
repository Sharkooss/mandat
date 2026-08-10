import { useGame } from "./store";
import type { GameState } from "./engine/types";
import Home from "./ui/Home";
import Creation from "./ui/Creation";
import Campaign from "./ui/Campaign";
import Mandate from "./ui/Mandate";
import Final from "./ui/Final";
import SkillCheckOverlay from "./ui/SkillCheck";
import { EventView, Tag } from "./ui/components";

/**
 * L'Acte II tient en quelques scènes : on affiche où l'on en est, pour que le
 * joueur voie l'investiture approcher au lieu de subir un couloir sans fin.
 */
function Ascension({ s }: { s: GameState }) {
  const total = Math.max(1, Number(s.flags["ascension_total"]) || s.queue.length + 1);
  const etape = Math.min(total, total - s.queue.length);
  return (
    <div className="max-w-2xl mx-auto pt-10 px-5 pb-16">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tag tone="var(--color-pouvoir)">Acte II — L'ascension</Tag>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === etape - 1 ? 14 : 5,
                  height: 5,
                  background: i < etape - 1 ? "var(--accent)" : i === etape - 1 ? "var(--color-pouvoir)" : "var(--color-line)",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--color-faint)" }}>
            {etape}/{total}
          </span>
        </div>
      </div>
      <EventView s={s} />
    </div>
  );
}

function ErrorBanner() {
  const lastError = useGame((g) => g.lastError);
  const clearError = useGame((g) => g.clearError);
  if (!lastError) return null;
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl max-w-md fade-in"
      style={{
        background: "color-mix(in srgb, var(--color-bad) 20%, var(--color-surface))",
        border: "1px solid color-mix(in srgb, var(--color-bad) 50%, transparent)",
      }}
    >
      <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--color-bad)" }}>
        Une action a échoué
      </div>
      <div className="text-[11px] mb-2" style={{ color: "var(--color-muted)" }}>
        {lastError}
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost text-[11px] py-1" onClick={clearError}>
          Réessayer
        </button>
        <button
          className="btn-ghost text-[11px] py-1"
          onClick={() => {
            localStorage.removeItem("mandat-save");
            location.reload();
          }}
        >
          Repartir de zéro
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const game = useGame((g) => g.game);

  if (!game)
    return (
      <>
        <Home />
        <ErrorBanner />
      </>
    );

  const deriveTier = game.derive >= 8 ? 3 : game.derive >= 5 ? 2 : game.derive >= 3 ? 1 : 0;

  return (
    <div data-derive={deriveTier} className="min-h-screen">
      {game.act === "creation" && <Creation />}
      {game.act === "ascension" && <Ascension s={game} />}
      {game.act === "campagne" && <Campaign s={game} />}
      {(game.act === "mandat" || game.act === "crise") && <Mandate s={game} />}
      {game.act === "fin" && game.ending && <Final s={game} />}
      {game.act !== "fin" && game.act !== "creation" && (
        <div className="fixed bottom-2 right-3 text-[10px] opacity-40" style={{ color: "var(--color-faint)" }}>
          <button className="underline" onClick={() => { if (confirm("Abandonner cette carrière ?")) useGame.getState().abandon(); }}>
            abandonner
          </button>
        </div>
      )}
      {game.pendingCheck && (
        <SkillCheckOverlay key={`${game.pendingCheck.titre}-${game.pendingCheck.depart}-${game.turnCount}`} plan={game.pendingCheck} />
      )}
      <ErrorBanner />
    </div>
  );
}
