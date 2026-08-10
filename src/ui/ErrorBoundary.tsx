import { Component, type ErrorInfo, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Une exception pendant le rendu démonte tout l'arbre React : le joueur se
// retrouve devant une page noire, sans un mot, sans un bouton. C'est le pire
// écran possible — il ne dit ni ce qui s'est passé, ni comment en sortir.
//
// Le filet du store ne suffit pas : il n'attrape que les actions. Celui-ci
// attrape le rendu, et laisse toujours deux portes ouvertes — recharger, ou
// repartir de zéro en sachant ce que ça coûte.
// ---------------------------------------------------------------------------

interface Props {
  children: ReactNode;
}

interface State {
  erreur: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo): void {
    console.error("[MANDAT] rendu interrompu", erreur, info.componentStack);
  }

  render() {
    const { erreur } = this.state;
    if (!erreur) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="press-une text-2xl tracking-[0.3em] mb-6" style={{ color: "var(--color-muted)" }}>
            M A N D A T
          </div>
          <h1 className="press-une text-xl mb-3">L'écran n'a pas pu s'afficher</h1>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--color-muted)" }}>
            Quelque chose s'est cassé pendant l'affichage. Votre partie est toujours enregistrée : rechargez d'abord,
            c'est presque toujours suffisant.
          </p>
          <pre
            className="text-[11px] text-left p-3 rounded-lg mb-5 overflow-auto max-h-32"
            style={{ background: "var(--color-surface-2)", color: "var(--color-faint)" }}
          >
            {erreur.message}
          </pre>
          <div className="flex gap-2 justify-center flex-wrap">
            <button className="btn-primary" onClick={() => location.reload()}>
              Recharger
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                if (!confirm("Effacer la partie en cours et le panthéon ? C'est définitif.")) return;
                localStorage.removeItem("mandat-save");
                location.reload();
              }}
            >
              Repartir de zéro
            </button>
          </div>
          <p className="text-[11px] mt-5" style={{ color: "var(--color-faint)" }}>
            « Repartir de zéro » efface la sauvegarde. À n'employer que si recharger ne suffit pas.
          </p>
        </div>
      </div>
    );
  }
}
