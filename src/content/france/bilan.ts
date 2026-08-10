import type { GameState } from "../../engine/types";
import { arsenalContre, ligneAdverse, scoreBrut } from "../../engine/campaign";
import { nomCompletDe } from "../../engine/noms";
import { relationsPresse } from "../../engine/presse";
import { bordMeta } from "../../engine/bord";
import { CAST, SEGMENTS } from "./data";

// ---------------------------------------------------------------------------
// Le bilan de fin de mandat.
//
// Cinq ans passent semestre par semestre, et le joueur n'a jamais vu la somme.
// Avant d'entrer en campagne, on lui remet ce que remettrait un directeur
// d'études : d'où l'on part, où l'on en est, ce que les Français reprochent,
// ce qu'ils reconnaissent — et ce que le camp d'en face compte en faire.
//
// Rien n'est inventé ici : chaque ligne est lue dans l'état réel de la partie.
// ---------------------------------------------------------------------------

export interface BilanChiffre {
  label: string;
  valeur: string;
  depart: string;
  /** Positif = le pays va mieux qu'au premier jour, quel que soit le sens de la jauge. */
  progres: number;
}

export interface BilanAxe {
  titre: string;
  detail: string;
  /** 0-100 : à quel point les sondés le placent en tête de leurs griefs. */
  urgence: number;
}

export interface BilanSegment {
  id: string;
  nom: string;
  soutien: number;
  delta: number;
  verdict: string;
}

export interface BilanAdversaire {
  id: string;
  nom: string;
  role: string;
  force: number;
  ligne: string;
  angles: string[];
  votreAngle: string;
}

export interface Bilan {
  titre: string;
  chapeau: string;
  popularite: number;
  intentions: number;
  chiffres: BilanChiffre[];
  attentes: BilanAxe[];
  acquis: string[];
  segments: BilanSegment[];
  adversaire: BilanAdversaire;
  climatPresse: string;
  conseil: string;
}

/** Le sens de lecture : pour le chômage ou la dette, baisser est un progrès. */
const INVERSES = new Set(["chomage", "inflation", "dette"]);

function chiffre(
  label: string,
  valeur: number,
  depart: number,
  suffixe: string,
  decimales = 0,
  cle = ""
): BilanChiffre {
  const fmt = (n: number) => `${n.toFixed(decimales).replace(".", ",")}${suffixe}`;
  const brut = valeur - depart;
  return {
    label,
    valeur: fmt(valeur),
    depart: fmt(depart),
    progres: INVERSES.has(cle) ? -brut : brut,
  };
}

/**
 * Ce que les sondés mettent en tête quand on leur demande « qu'est-ce qui doit
 * changer ? ». On réutilise l'arsenal de l'adversaire : ses griefs et les
 * attentes de l'opinion sont la même liste, lue depuis deux fauteuils.
 */
const REMEDES: Record<string, string> = {
  chomage: "L'emploi arrive en tête dans huit sondages sur dix. Rien d'autre ne compte tant que ce chiffre monte.",
  vie_chere: "Le pouvoir d'achat écrase tous les autres sujets. On ne vous demande pas une réforme, on vous demande un prix.",
  dette: "Les sondés ne lisent pas les tableaux de Bercy, mais ils entendent « dette » et comprennent « impôts demain ».",
  services: "Hôpital, école, guichets : le sentiment d'abandon progresse partout où l'État a fermé une porte.",
  insecurite: "Le sentiment d'insécurité progresse plus vite que les faits. Cela ne le rend pas moins électoral.",
  fracture: "Une majorité déclare que le pays « se déchire ». C'est le grief le plus difficile à réparer en un semestre.",
  parole: "La question de la parole tenue revient en boucle dans les entretiens qualitatifs. Elle abîme tout le reste.",
  promesses: "Vos propres promesses de campagne sont citées contre vous. Les électeurs ont gardé le document.",
  affaires: "Les affaires ne font pas changer de vote, elles font renoncer à voter. C'est pire.",
  derive: "Une part croissante des sondés emploie spontanément le mot « autoritaire ». Il ne s'efface plus d'un discours.",
  usure: "Le mot qui revient le plus dans les groupes qualitatifs est « fatigué ». Il vous désigne, pas le pays.",
  rang: "Le rang de la France est un sujet minoritaire mais très mobilisateur chez ceux qui vous ont élu.",
};

function acquisDe(s: GameState, base: GameState["mandatBase"]): string[] {
  const out: string[] = [];
  const b = base?.country;
  const c = s.country;
  if (b && c.chomage <= b.chomage - 0.6) out.push(`Le chômage a reculé de ${(b.chomage - c.chomage).toFixed(1)} point pendant votre mandat — c'est le seul chiffre que les électeurs vérifient eux-mêmes.`);
  if (b && c.croissance >= 1.6) out.push(`Une croissance à ${c.croissance.toFixed(1)} % : au-dessus de la moyenne de la zone, et l'argument que vos équipes répètent partout.`);
  if (b && c.services >= b.services + 5) out.push("Les services publics sont mieux notés qu'à votre arrivée. Les usagers le disent avant les syndicats.");
  if (b && c.securite >= b.securite + 5) out.push("Le sentiment de sécurité s'est amélioré. Le sujet a quitté les trois premières préoccupations.");
  if (b && c.environnement >= b.environnement + 5) out.push("Votre bilan écologique est jugé sérieux, y compris par des gens qui ne voteront jamais pour vous.");
  if (b && c.cohesion >= b.cohesion + 4) out.push("Le pays se juge un peu moins divisé qu'il y a cinq ans. C'est rare, et cela ne se remarque pas.");
  if (c.prestige >= 70) out.push("Votre stature internationale est un actif net : elle rassure les modérés et fait taire les procès en amateurisme.");
  if (c.influence >= 62) out.push("La France pèse au Conseil. Ce n'est pas un sujet de campagne, mais cela évite d'avoir à s'excuser en débat.");
  const tenues = s.promises.filter((p) => p.status === "tenue").length;
  if (tenues >= 3) out.push(`${tenues} promesses de campagne tenues sur six. Vos équipes en ont fait une affiche, et elle fonctionne.`);
  if (s.player.integrite >= 65) out.push("Personne n'a rien trouvé sur vous. Dans une campagne, c'est une arme défensive considérable.");
  if (s.power.popularite >= 50) out.push("Vous quittez le mandat au-dessus de 50 % d'opinions favorables — deux présidents seulement y sont parvenus.");
  if (out.length === 0) out.push("Les sondés peinent à citer spontanément une réussite du quinquennat. Vos équipes préfèrent que vous le sachiez maintenant.");
  return out.slice(0, 4);
}

export function bilanMandat(s: GameState): Bilan {
  const base = s.mandatBase;
  const c = s.country;
  const dep = base?.country ?? c;
  const popDepart = base?.power.popularite ?? s.power.popularite;

  const chiffres: BilanChiffre[] = [
    chiffre("Chômage", c.chomage, dep.chomage, " %", 1, "chomage"),
    chiffre("Croissance", c.croissance, dep.croissance, " %", 1),
    chiffre("Inflation", c.inflation, dep.inflation, " %", 1, "inflation"),
    chiffre("Dette / PIB", c.dette, dep.dette, " %", 0, "dette"),
    chiffre("Services publics", c.services, dep.services, "/100"),
    chiffre("Cohésion", c.cohesion, dep.cohesion, "/100"),
    chiffre("Sécurité", c.securite, dep.securite, "/100"),
    chiffre("Prestige", c.prestige, dep.prestige, "/100"),
  ];

  // Les attentes : les mêmes griefs que ceux de l'adversaire, mais formulés
  // comme un institut les formule — en axes de progression.
  const attentes: BilanAxe[] = arsenalContre(s, true)
    .map((r) => ({ r, f: r.force(s) }))
    .filter((x) => x.f > 3)
    .sort((a, b) => b.f - a.f)
    .slice(0, 4)
    .map((x) => ({
      titre: x.r.theme,
      detail: REMEDES[x.r.id] ?? "Le sujet revient dans les entretiens sans qu'on ait besoin de le suggérer.",
      urgence: Math.min(100, Math.round(x.f * 3.2)),
    }));
  if (attentes.length === 0) {
    attentes.push({
      titre: "Rien de saillant",
      detail: "Aucun grief ne domine : c'est confortable et dangereux. Une campagne sans sujet se gagne sur la personne, et la vôtre est connue.",
      urgence: 20,
    });
  }

  const segments: BilanSegment[] = SEGMENTS.map((def) => {
    const st = s.segments[def.id];
    const depart = base?.segments[def.id] ?? st.soutien;
    const delta = st.soutien - depart;
    return {
      id: def.id,
      nom: def.nom,
      soutien: Math.round(st.soutien),
      delta: Math.round(delta),
      verdict:
        st.soutien >= 58
          ? delta >= 4
            ? "socle, et il s'est élargi"
            : "socle"
          : st.soutien >= 45
            ? delta <= -6
              ? "vous glisse entre les doigts"
              : "à reconquérir"
            : delta <= -8
              ? "vous a lâché en route"
              : "hors d'atteinte",
    };
  }).sort((a, b) => b.soutien - a.soutien);

  // Le camp d'en face : qui, avec quelle ligne, et sur quoi il compte frapper.
  const c2 = s.campaign;
  const advId = c2?.opposantId ?? "sallenave";
  const def = CAST.find((x) => x.id === advId);
  const ligne = ligneAdverse(s);
  const angles = arsenalContre(s, true)
    .map((r) => ({ r, f: r.force(s) }))
    .filter((x) => x.f > 4)
    .sort((a, b) => b.f - a.f)
    .slice(0, 3)
    .map((x) => x.r.theme);

  const adversaire: BilanAdversaire = {
    id: advId,
    nom: def ? nomCompletDe(s, advId) : "Maryse Cottin",
    role: def?.role ?? "Chef de file de l'opposition",
    force: Math.round(c2?.opposantScore ?? 46),
    ligne: ligne
      ? `Sa campagne tiendra en un mot : ${ligne.theme.toLowerCase()}. Il l'a testé, ça marche, il ne changera pas.`
      : "Aucun grief ne se détache dans votre bilan : le camp d'en face devra faire campagne sur sa personne, ce qui est plus fragile.",
    angles: angles.length > 0 ? angles : ["Le renouvellement"],
    votreAngle:
      s.player.integrite >= 60 && (s.europe?.dossiers?.length ?? 0) === 0
        ? "Vos équipes n'ont rien sur lui, mais vous avez le dossier le plus rare : un mandat sans casserole. Assumez-le, il n'en a pas."
        : (s.europe?.dossiers?.some((d) => d.public) ?? false)
          ? "Il a des pièces publiques contre vous et le sait. Ne portez pas le débat sur la probité : vous le perdriez en direct."
          : "Faites travailler vos équipes tôt : sans dossier, un débat se joue à la rhétorique, et la rhétorique se fatigue.",
  };

  const presseAcquise = relationsPresse(s).filter((r) => r.niveau === "acquis");
  const presseHostile = relationsPresse(s).filter((r) => r.niveau === "hostile");
  const climatPresse =
    presseAcquise.length > 0
      ? `${presseAcquise.map((r) => nomCompletDe(s, r.id)).join(" et ")} ${presseAcquise.length > 1 ? "vous sont acquis" : "vous est acquis"} : la campagne partira avec un titre bienveillant, ce qui vaut trois meetings.`
      : presseHostile.length >= 2
        ? `${presseHostile.map((r) => nomCompletDe(s, r.id)).join(" et ")} vous attendent. Chaque déplacement sera commenté avant d'avoir eu lieu.`
        : "La presse vous traite sans faveur ni acharnement. C'est ce qu'on peut espérer de mieux quand on n'a cultivé personne.";

  const pop = Math.round(s.power.popularite);
  const intentions = Math.round(scoreBrut(s));
  const m = bordMeta(s.bord);

  const titre =
    pop >= 52 ? "Un mandat qu'on peut défendre" : pop >= 40 ? "Un mandat contesté" : pop >= 30 ? "Un mandat désavoué" : "Un mandat à reconquérir de zéro";

  const chapeau =
    `Cinq ans. ${pop} % d'opinions favorables, contre ${Math.round(popDepart)} % au premier jour. ` +
    `Le pays vous situe « ${m.label.toLowerCase()} » et ne s'en cache plus. ` +
    (pop >= 48
      ? "Vous partez en campagne en position de sortant crédible — la moitié du travail est faite, l'autre moitié sera la plus dure."
      : pop >= 35
        ? "Vous partez en campagne comme un sortant qu'on n'aime plus mais qu'on n'a pas encore remplacé. Tout se jouera sur l'alternative."
        : "Vous partez en campagne comme un sortant qu'on veut voir partir. Il faudra reconstruire un socle, pas défendre un bilan.");

  const conseil =
    attentes[0].urgence >= 60
      ? `Le directeur des études est formel : tant que « ${attentes[0].titre.toLowerCase()} » restera en tête, aucune autre annonce ne s'entendra. Videz ce sujet avant de parler d'autre chose.`
      : s.hidden.fatigue > 65
        ? "Le directeur des études ne parle pas des sondages mais de vous : « Il faudra six semaines de campagne. Dans l'état où il est, on n'en tiendra pas quatre. »"
        : "Le directeur des études conclut sans emphase : le socle tient, le pays hésite, et six semaines suffisent à tout défaire.";

  return {
    titre,
    chapeau,
    popularite: pop,
    intentions,
    chiffres,
    attentes,
    acquis: acquisDe(s, base),
    segments,
    adversaire,
    climatPresse,
    conseil,
  };
}
