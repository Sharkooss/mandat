import { useGame } from "./store";
import Home from "./ui/Home";
import Creation from "./ui/Creation";
import Campaign from "./ui/Campaign";
import Mandate from "./ui/Mandate";
import Final from "./ui/Final";
import { EventView, Tag } from "./ui/components";

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
      {game.act === "ascension" && (
        <div className="max-w-2xl mx-auto pt-10 px-5 pb-16">
          <div className="mb-4">
            <Tag tone="var(--color-pouvoir)">Acte II — L'ascension</Tag>
          </div>
          <EventView s={game} />
        </div>
      )}
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
      <ErrorBanner />
    </div>
  );
}
