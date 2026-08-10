import { Fragment, useMemo } from "react";
import { CAST } from "../content/france/data";
import { aliasAffiches, substituerNoms } from "../engine/noms";
import { useGame } from "../store";

// ---------------------------------------------------------------------------
// Met en couleur les textes narratifs : les personnages selon leur camp
// (cliquables — ils se braquent alors dans le panneau Entourage) et les
// valeurs chiffrées selon qu'elles sont bonnes ou mauvaises.
// ---------------------------------------------------------------------------

const CAMP_TONE: Record<string, string> = {
  gouvernement: "var(--color-secu)",
  parti: "var(--color-pouvoir)",
  opposition: "var(--color-bad)",
  presse: "var(--color-perso)",
  corps: "var(--color-social)",
  institutions: "var(--color-monde)",
  intime: "var(--color-env)",
  etranger: "var(--color-eco)",
};

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Token {
  type: "texte" | "perso" | "chiffre";
  contenu: string;
  id?: string;
  bon?: boolean;
}

/** Un alias doit être un vrai nom : au moins deux lettres, sinon la ponctuation se met à cliquer. */
function aliasValide(a: string): boolean {
  return (a.match(/\p{L}/gu)?.length ?? 0) >= 2;
}

/**
 * Découpe un texte **déjà substitué** : les noms qu'on y cherche sont ceux
 * tirés pour la partie, pas ceux écrits dans le contenu.
 */
export function tokenize(texte: string, alias: { alias: string; id: string }[]): Token[] {
  const entrees = alias.filter((e) => aliasValide(e.alias));
  if (entrees.length === 0) return [{ type: "texte", contenu: texte }];
  entrees.sort((a, b) => b.alias.length - a.alias.length);

  const motifPersos = entrees.map((e) => escape(e.alias)).join("|");
  // Valeurs signées (+3, −5, +0,4 point) et pourcentages.
  const motifChiffres = "[+−-]\\s?\\d+(?:[.,]\\d+)?\\s?(?:%|points?|pts?)?|\\d+(?:[.,]\\d+)?\\s?%";
  const regex = new RegExp(`(${motifPersos})|(${motifChiffres})`, "g");

  const tokens: Token[] = [];
  let dernier = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(texte)) !== null) {
    if (m.index > dernier) tokens.push({ type: "texte", contenu: texte.slice(dernier, m.index) });
    if (m[1]) {
      const trouve = entrees.find((e) => e.alias === m![1]);
      tokens.push({ type: "perso", contenu: m[1], id: trouve?.id });
    } else if (m[2]) {
      const brut = m[2];
      const negatif = /^[−-]/.test(brut.trim());
      const signe = /^[+−-]/.test(brut.trim());
      tokens.push({ type: "chiffre", contenu: brut, bon: signe ? !negatif : undefined });
    }
    dernier = m.index + m[0].length;
  }
  if (dernier < texte.length) tokens.push({ type: "texte", contenu: texte.slice(dernier) });
  return tokens;
}

/**
 * Le passage obligé de tout texte narratif : on remplace d'abord les noms de
 * référence du contenu par ceux tirés pour la partie, puis on colorise.
 */
export function useTexte(texte: string): string {
  const game = useGame((g) => g.game);
  return useMemo(() => substituerNoms(texte, game), [texte, game?.castNames]);
}

export function RichText({ children, className, style }: { children: string; className?: string; style?: React.CSSProperties }) {
  const game = useGame((g) => g.game);
  const setFocus = useGame((g) => g.setFocus);
  const texte = useTexte(children);
  const tokens = useMemo(() => (game ? tokenize(texte, aliasAffiches(game)) : [{ type: "texte" as const, contenu: texte }]), [texte, game?.castNames, game?.bio.conjointPrenom]);

  return (
    <p className={className} style={style}>
      {tokens.map((t, i) => {
        if (t.type === "perso" && t.id) {
          const perso = CAST.find((c) => c.id === t.id)!;
          return (
            <button
              key={i}
              onClick={() => setFocus(t.id!)}
              className="font-semibold underline decoration-dotted underline-offset-2 hover:brightness-125"
              style={{ color: CAMP_TONE[perso.camp], cursor: "pointer" }}
              title={`${perso.role} — cliquer pour l'afficher dans l'entourage`}
            >
              {t.contenu}
            </button>
          );
        }
        if (t.type === "chiffre") {
          const couleur = t.bon === undefined ? "var(--color-perso)" : t.bon ? "var(--color-good)" : "var(--color-bad)";
          return (
            <b key={i} className="tabular-nums" style={{ color: couleur }}>
              {t.contenu}
            </b>
          );
        }
        return <Fragment key={i}>{t.contenu}</Fragment>;
      })}
    </p>
  );
}
