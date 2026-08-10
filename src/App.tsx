import { useGame } from "./store";
import Home from "./ui/Home";
import Creation from "./ui/Creation";
import Campaign from "./ui/Campaign";
import Mandate from "./ui/Mandate";
import Final from "./ui/Final";
import { EventView, Tag } from "./ui/components";

export default function App() {
  const game = useGame((g) => g.game);

  if (!game) return <Home />;

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
    </div>
  );
}
