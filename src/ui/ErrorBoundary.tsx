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
  /** Où en était la partie — en production, le message seul ne suffit pas. */
  contexte: string;
}

/**
 * Le strict nécessaire pour diagnostiquer sur une capture d'écran : l'écran en
 * cours et la pile des composants. En production le code est minifié, donc le
 * message d'erreur seul ne désigne jamais le coupable.
 */
function contexteDePartie(pile?: string | null): string {
  const lignes: string[] = [];
  try {
    const brut = localStorage.getItem("mandat-save");
    const jeu = brut ? JSON.parse(brut)?.state?.game : null;
    lignes.push(
      jeu
        ? `écran ${jeu.act}/${jeu.phase} · mandat ${jeu.mandat} · semestre ${jeu.turn}` +
            (jeu.campaign ? ` · campagne ${jeu.campaign.kind} s${jeu.campaign.week}` : "") +
            (jeu.currentEvent ? ` · événement ${jeu.currentEvent}` : "")
        : "aucune partie enregistrée"
    );
  } catch {
    lignes.push("sauvegarde illisible");
  }
  if (pile) {
    const premières = pile.split("\n").filter(Boolean).slice(0, 4).join("\n");
    lignes.push(premières);
  }
  return lignes.join("\n");
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null, contexte: "" };

  static getDerivedStateFromError(erreur: Error): Partial<State> {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo): void {
    console.error("[MANDAT] rendu interrompu", erreur, info.componentStack);
    this.setState({ contexte: contexteDePartie(info.componentStack) });
  }

  render() {
    const { erreur, contexte } = this.state;
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
            className="text-[11px] text-left p-3 rounded-lg mb-5 overflow-auto max-h-48 whitespace-pre-wrap"
            style={{ background: "var(--color-surface-2)", color: "var(--color-faint)" }}
          >
            {erreur.message}
            {contexte ? `\n${contexte}` : ""}
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
