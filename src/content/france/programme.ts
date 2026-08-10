import type { Ctx, PromiseDef, PromiseTheme, Rarete } from "../../engine/types";
import type { ReformeDef } from "./actions";
import { PROMESSES } from "./data";

// ---------------------------------------------------------------------------
// Les chantiers que le programme engendre.
//
// Vingt-quatre promesses avaient leur chantier écrit à la main ; les trente-huit
// autres n'avaient rien. On pouvait donc les jurer en campagne et n'avoir, cinq
// ans durant, aucune décision pour les tenir — pendant que l'adversaire faisait
// campagne sur chacune d'elles restée « en attente ». Une promesse qu'aucun acte
// ne peut solder n'est pas une promesse : c'est un décor.
//
// D'où ces chantiers-là, déduits de la promesse elle-même. Ils n'existent que si
// on l'a inscrite au programme — c'est la différence avec les chantiers écrits,
// qui sont ouverts à tout le monde. Ce sont des versions de série : honnêtes,
// chiffrées, et volontairement moins mémorables que celles qu'on a écrites une
// par une. Un chantier qui compte finit par mériter son propre texte.
// ---------------------------------------------------------------------------

/**
 * La forme que prend la mesure. Elle ne change rien aux effets : elle décide de
 * la manière dont on raconte le moment où la chose se fait, et une révision
 * constitutionnelle ne se raconte pas comme un décret.
 */
type Forme = "loi" | "referendum" | "constitution" | "renoncement" | "chantier";

/** Seules les exceptions sont listées : tout le reste passe par une loi. */
const FORME: Record<string, Forme> = {
  peine_mort: "referendum",
  frexit: "referendum",
  senat: "constitution",
  constituante: "constitution",
  assemblee_tiree: "constitution",
  moins_elus: "constitution",
  droit_du_sol: "constitution",
  retraite_non: "renoncement",
  mandat_unique: "renoncement",
  otan: "renoncement",
  capitale: "chantier",
  banques: "chantier",
  revenu_universel: "chantier",
  logement_requis: "chantier",
};

const OUVERTURES: Record<Forme, string[]> = {
  loi: [
    "Le texte part en Conseil des ministres un mercredi matin et ressort du Parlement quatre mois plus tard, amendé aux trois quarts mais debout.",
    "Trois lectures, deux nuits de séance, une commission mixte paritaire qui s'achève à quatre heures : la loi est promulguée un samedi, sans cérémonie.",
    "Vous avez mis le poids de l'Élysée dans la balance dès la première lecture. C'est ce qui a fait la différence, et c'est ce qu'on vous reprochera.",
  ],
  referendum: [
    "Le décret de convocation paraît un jeudi. Six semaines de campagne, un pays qui se parle enfin, et une réponse qui n'appartiendra plus à personne.",
    "Vous posez la question au pays et vous vous engagez publiquement à en tenir le résultat. C'est la seule façon de faire passer une chose pareille ; c'est aussi la plus chère.",
    "Le référendum est fixé. Dans les préfectures on ressort les procédures, dans les rédactions on ressort les archives : tout le monde sait ce qu'un scrutin de ce genre peut faire à un pouvoir.",
  ],
  constitution: [
    "La révision part au Congrès. Les trois cinquièmes se comptent à l'unité, et vous les comptez vous-même, deux fois par jour, pendant six semaines.",
    "Vingt-deux mois, un Sénat qu'on ne contourne pas, et des concessions dont personne ne parlera jamais : le texte fondamental change.",
    "On ne touche pas à la Constitution sans que le pays entier ait un avis sur la question. Vous l'avez fait quand même, et vous l'avez fait passer.",
  ],
  renoncement: [
    "L'engagement est pris solennellement, devant les caméras, sans échappatoire rédactionnelle. Vos conseillers ont supplié qu'on laisse une porte ; il n'y en a pas.",
    "Ce n'est pas un texte, c'est une parole — publique, datée, enregistrée. En politique, ça pèse parfois plus lourd qu'une loi.",
    "Vous verrouillez, et vous le dites : plus personne dans votre camp ne pourra revenir dessus sans vous passer sur le corps.",
  ],
  chantier: [
    "Le chantier est lancé pour de bon : crédits engagés, préfet de mission nommé, calendrier affiché sur un mur. Il vous survivra — dans les deux sens du terme.",
    "Ce n'est plus une annonce : des marchés publics, des lettres de mission, des camions. Le pays le verra bien avant de le comprendre.",
    "L'État se met en marche avec sa lenteur de mammouth et sa puissance de mammouth. Vous n'en verrez qu'un tiers avant la fin du mandat.",
  ],
};

/** La facture, telle qu'elle était annoncée dès la campagne. */
const FACTURES = [
  (prix: string) => `Le prix était sur l'étiquette, et personne ne l'a lu à voix haute pendant la campagne. ${prix}.`,
  (prix: string) => `On savait ce que ça coûterait. ${prix}. Savoir n'a jamais rendu une facture plus légère.`,
  (prix: string) => `Reste ce qui était annoncé et qu'on espérait vaguement éviter. ${prix}.`,
];

const CLOTURES: Record<Rarete, string[]> = {
  commune: [
    "Une promesse tenue, sans fanfare et sans miracle. C'est plus rare qu'on ne croit, et ça ne se voit dans aucun sondage la semaine suivante.",
    "Le pays enregistre, hausse une épaule, passe à autre chose. Les promesses tenues font de mauvais titres : c'est leur seul défaut.",
    "Vous l'aviez dit, vous l'avez fait. On vous le rappellera surtout le jour où vous ne le ferez plus.",
  ],
  peu_commune: [
    "Ceux qui y avaient cru le disent à peine ; ceux qui n'y croyaient pas cherchent le vice caché. Il n'y en a pas, et ça les met mal à l'aise.",
    "L'opposition passe une semaine à expliquer que ce n'est pas exactement ce qui avait été promis. Une semaine, c'est le temps qu'il faut pour reconnaître une défaite.",
    "Ce n'était pas la mesure la plus facile de votre programme. C'est désormais celle qu'on citera dans dix ans quand on citera votre nom.",
  ],
  rare: [
    "Personne ne pensait que vous iriez au bout — vos adversaires moins que tout le monde, vos amis à peine plus. Le pays vient de changer de forme sur un point précis, et ça ne se défait pas.",
    "Il y aura un avant et un après ; les manuels trancheront. En attendant, le pays met plusieurs semaines à mesurer ce qui vient de lui arriver.",
    "Vous venez de faire ce que trois de vos prédécesseurs avaient promis puis remis. Ça vous vaut une ligne dans l'Histoire et un ennemi durable dans chaque camp.",
  ],
  legendaire: [
    "Le pays se réveille dans un autre régime que celui où il s'était couché. Certains applaudissent, certains font leurs valises, et personne — vous compris — ne sait comment cela finit.",
    "C'était la mesure dont on jurait qu'aucun pouvoir n'oserait la prendre. Vous l'avez prise. Tout le reste du mandat s'écrira à partir de là.",
    "L'irréversible a ceci de commode qu'il dispense de se demander si l'on a eu raison. Vous le saurez dans dix ans ; le pays le saura avant vous.",
  ],
};

/** Ce que le chantier coûte en capital politique, selon l'ampleur promise. */
const COUT: Record<Rarete, number> = { commune: 2, peu_commune: 2, rare: 3, legendaire: 3 };

/** Le facteur qui dit à quel point la mesure remue le pays. */
const AMPLEUR: Record<Rarete, number> = { commune: 1, peu_commune: 1.35, rare: 1.8, legendaire: 2.4 };

/** La probabilité que la mesure ait une suite, deux ou trois semestres plus tard. */
const SUITE: Record<Rarete, number> = { commune: 0.3, peu_commune: 0.45, rare: 0.65, legendaire: 0.85 };

const TON: Record<PromiseTheme, string> = {
  budget: "var(--color-eco)",
  social: "var(--color-social)",
  securite: "var(--color-secu)",
  environnement: "var(--color-env)",
  institutions: "var(--color-pouvoir)",
  societe: "var(--color-monde)",
  monde: "var(--color-monde)",
  insolite: "var(--color-perso)",
};

/** L'empreinte du thème sur le pays — c'est là que la mesure se paie vraiment. */
function empreinte(c: Ctx, theme: PromiseTheme, a: number): void {
  const n = (x: number) => Math.round(x * a);
  const d = (x: number) => Math.round(x * a * 10) / 10;
  switch (theme) {
    case "budget":
      return c.adj({ country: { marge: -n(8), dette: n(2), croissance: d(0.2) } });
    case "social":
      return c.adj({ country: { services: n(6), marge: -n(7) } });
    case "securite":
      return c.adj({ country: { securite: n(6), cohesion: -n(2), marge: -n(3) } });
    case "environnement":
      return c.adj({ country: { environnement: n(7), croissance: -d(0.3), marge: -n(3) } });
    case "institutions":
      return c.adj({ country: { cohesion: n(3) }, power: { parti: -n(4) } });
    case "societe":
      return c.adj({ country: { cohesion: -n(3) }, power: { popularite: n(2) } });
    case "monde":
      return c.adj({ country: { prestige: n(5), influence: n(3), marge: -n(4) } });
    case "insolite":
      return c.adj({ country: { cohesion: -n(2) }, power: { presse: -n(3), popularite: n(3) } });
  }
}

/** « Douze milliards par an. » → une phrase, ponctuée une seule fois. */
function phrase(texte: string): string {
  return texte.trim().replace(/\s*\.\s*$/, "");
}

function chantierDe(def: PromiseDef): ReformeDef {
  const rarete = def.rarete ?? "commune";
  const a = AMPLEUR[rarete];
  return {
    id: `prog_${def.id}`,
    nom: def.label,
    cout: COUT[rarete],
    promesse: def.id,
    detail: `${phrase(def.tenir)}.`,
    tone: TON[def.theme],
    // Le chantier n'existe que parce qu'on l'a promis : c'est ce qui le
    // distingue des chantiers écrits, qu'on peut engager sans les avoir jurés.
    cond: (s) => s.promises.some((p) => p.id === def.id && p.status === "en_cours"),
    effects: (c) => {
      empreinte(c, def.theme, a);
      c.adj({
        power: { popularite: 3 },
        player: { integrite: 2 },
        hidden: { fatigue: Math.round(3 * a) },
      });
      for (const seg of def.segments) c.seg(seg, { soutien: Math.round(5 + 3 * a), participation: 2 });
      if (def.bord) c.bord(Math.sign(def.bord) * (Math.abs(def.bord) >= 3 ? 2 : 1));
      c.promesse(def.id, "tenue");
      c.log(`Promesse tenue : ${def.label.toLowerCase()}.`);
      // Une mesure de cette taille a toujours une suite, et le pays ne la
      // découvre jamais le jour du vote.
      if (c.rng.chance(SUITE[rarete])) {
        c.flag("chantier_recent", def.id);
        c.sched(c.rng.chance(0.55) ? "chantier_secousse" : "chantier_dividende", 2, 5, 0.7);
      }
      return [
        c.rng.pick(OUVERTURES[FORME[def.id] ?? "loi"]),
        c.rng.pick(FACTURES)(phrase(def.tenir)),
        c.rng.pick(CLOTURES[rarete]),
      ].join(" ");
    },
  };
}

/**
 * Un chantier pour chaque promesse qui n'en avait pas. On ne double jamais un
 * chantier écrit à la main : sa version vaut mieux que celle-ci.
 */
export function chantiersDuProgramme(dejaEcrites: Set<string>): ReformeDef[] {
  return PROMESSES.filter((p) => !dejaEcrites.has(p.id)).map(chantierDe);
}

/** Le libellé d'une promesse, pour les événements qui parlent de ses suites. */
export function libellePromesse(id: unknown): string | null {
  return PROMESSES.find((p) => p.id === id)?.label ?? null;
}
