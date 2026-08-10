import { Fragment, useMemo } from "react";
import { CAST } from "../content/france/data";
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

/**
 * Alias par personnage. On évite volontairement les patronymes ambigus :
 * « Rives » apparaît dans « la guerre des Deux Rives », « Bec » est un mot
 * courant — ceux-là ne se reconnaissent qu'au nom complet.
 */
const ALIAS: Record<string, string[]> = {
  rochefort: ["Hélène Rochefort", "Rochefort"],
  mazeau: ["Franck Mazeau", "Mazeau"],
  danglade: ["Cyril Danglade", "Danglade"],
  verdier: ["général Paul Verdier", "Général Paul Verdier", "Paul Verdier", "Verdier"],
  ternay: ["Yves Ternay", "Ternay"],
  roze: ["Camille Roze", "Roze"],
  espitalier: ["Jean-Marc Espitalier", "Espitalier"],
  delval: ["Sacha Delval", "Delval"],
  sallenave: ["Victor Sallenave", "Sallenave"],
  andrieu: ["Claire Andrieu", "Andrieu"],
  rives: ["Antoine Rives"],
  ferrand: ["Louise Ferrand", "Ferrand"],
  bec: ["Philippe Bec"],
  kervella: ["Bruno Kervella", "Kervella"],
  belkacem: ["Nadia Belkacem", "Belkacem"],
  charvet: ["Édouard Charvet", "Charvet"],
  quesnel: ["Robert Quesnel", "Quesnel"],
  alberti: ["Denise Alberti", "Alberti"],
  bensalah: ["Karim Bensalah", "Bensalah", "Karim"],
  manin: ["Dr Estelle Manin", "Estelle Manin", "Manin"],
  weiss: ["chancelier Weiss", "Chancelier Weiss", "Weiss"],
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

export function tokenize(texte: string, conjointPrenom: string): Token[] {
  const entrees: { alias: string; id: string }[] = [];
  for (const c of CAST) {
    for (const a of ALIAS[c.id] ?? [c.nom]) entrees.push({ alias: a, id: c.id });
  }
  if (conjointPrenom) entrees.push({ alias: conjointPrenom, id: "conjoint" });
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

export function RichText({ children, className, style }: { children: string; className?: string; style?: React.CSSProperties }) {
  const conjointPrenom = useGame((g) => g.game?.bio.conjointPrenom ?? "");
  const setFocus = useGame((g) => g.setFocus);
  const tokens = useMemo(() => tokenize(children, conjointPrenom), [children, conjointPrenom]);

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
