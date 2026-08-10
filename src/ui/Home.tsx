import { useGame } from "../store";

export default function Home() {
  const newGame = useGame((g) => g.newGame);
  const pantheon = useGame((g) => g.pantheon);

  return (
    <div className="max-w-2xl mx-auto pt-20 px-6 fade-in">
      <div className="text-center mb-12">
        <h1 className="press-une text-6xl tracking-[0.35em] mb-6 text-paper-100">MANDAT</h1>
        <p className="text-paper-300 text-lg leading-relaxed max-w-lg mx-auto">
          De militant local à statue sur une place publique —<br />
          ou à cadavre dans une limousine.
        </p>
        <p className="text-paper-500 text-sm mt-4 max-w-md mx-auto">
          Un jeu narratif de gestion politique. La France, ses institutions réelles, ses colères réelles — et des personnages
          entièrement fictifs qui se souviennent de tout ce que vous leur faites.
        </p>
      </div>
      <div className="flex justify-center mb-16">
        <button className="btn-primary text-lg px-8 py-3" onClick={newGame}>
          Commencer une carrière
        </button>
      </div>

      {pantheon.length > 0 && (
        <div className="dossier p-5">
          <h2 className="text-xs uppercase tracking-widest text-paper-500 mb-3">Le panthéon de vos dirigeants</h2>
          <div className="space-y-2">
            {[...pantheon].reverse().slice(0, 10).map((p, i) => (
              <div key={i} className="flex justify-between items-baseline text-sm border-b border-ink-700 pb-1.5">
                <span>{p.nom}</span>
                <span className="text-paper-500 text-xs">
                  {p.ending} · {p.annees} an{p.annees > 1 ? "s" : ""} · <span className="italic">{p.rarete}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-paper-500 mt-10 pb-8">
        Gratuit, sans compte. La partie se sauvegarde toute seule dans votre navigateur.
      </div>
    </div>
  );
}
