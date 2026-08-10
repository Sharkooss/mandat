import type { EndingResult, GameEvent, GameState } from "../../engine/types";
import type { Rng } from "../../engine/rng";
import { PRESIDENTS, REGIONS } from "./data";
import { bordMeta } from "../../engine/bord";
import { clamp } from "../../engine/ctx";
import { nomCompletDe } from "../../engine/noms";
import { epilogue, indicateursCritiques } from "./epilogues";

// ---------------------------------------------------------------------------
// Les causes de sortie détectées par le moteur
// ---------------------------------------------------------------------------

export type EndingCause =
  | "jamais_elu"
  | "battu"
  | "censure"
  | "poignards"
  | "coup"
  | "assassinat"
  | "mort_epuisement"
  | "fin_mandats"
  | "statues"
  | "memoires"
  | "geneve"
  | "retrait_volontaire"
  | "consulat"
  | "consulat_perdu"
  | "cincinnatus"
  | "hiver"
  | "republique_populaire"
  | "etat_national"
  | "chute_regime"
  | "insurrection"
  | "prison"
  | "referendum_demission";

/**
 * Le pays tient-il encore debout ? Un régime ne tombe pas sur un mauvais
 * chiffre : il tombe quand plusieurs cèdent en même temps et qu'il ne reste
 * personne pour amortir.
 */
function effondrement(s: GameState): boolean {
  return indicateursCritiques(s).length >= 4;
}

/** Vérifie les fins « dures » en fin de semestre. Retourne une cause ou null. */
export function checkEndings(s: GameState, rng: Rng): EndingCause | null {
  if (s.flags["hiver_declenche"]) return "hiver";
  // Les bascules autoritaires closent la partie — mais un régime installé sur
  // un pays en ruine ne dure pas : il se fait renverser. C'est la même dérive
  // qui produit le règne tranquille et la fin dans la cour d'honneur ; ce qui
  // les sépare, c'est l'état dans lequel on a laissé le pays.
  if (s.flags["republique_populaire"] || s.flags["etat_national"]) {
    if (effondrement(s) && (s.power.armee < 50 || s.hidden.agitation > 60)) return "chute_regime";
    return s.flags["republique_populaire"] ? "republique_populaire" : "etat_national";
  }
  // La justice finit par rattraper les présidences les plus abîmées.
  if (s.flags["chute_judiciaire"]) return "prison";

  // L'insurrection : jamais sans avertissement. Le premier semestre où le pays
  // décroche, le joueur reçoit une alerte et un événement pour réagir. C'est
  // seulement s'il laisse filer que la rue prend la main.
  if (effondrement(s) && s.hidden.agitation > 62 && !s.flags["insurrection_ecrasee"]) {
    const alerte = s.flags["insurrection_alerte"] as number | undefined;
    if (alerte === undefined) {
      s.flags["insurrection_alerte"] = s.turnCount;
      s.delayed.push({ eventId: "insurrection_montee", minTurn: s.turnCount + 1, maxTurn: s.turnCount + 2, chance: 1 });
      // La une est confiée au briefing du semestre suivant : `genBriefing`
      // repart d'une presse vide, tout ce qu'on pousserait ici serait perdu.
      s.flags["une_speciale"] = "« LE PAYS DÉCROCHE » — six préfectures signalent des blocages qu'elles ne savent plus lever";
      s.flags["une_speciale_ton"] = "hostile";
      s.log.push({ turn: s.turnCount, text: "Le pays a commencé à décrocher : blocages, préfectures débordées." });
    } else if (s.turnCount > alerte && rng.chance(0.55)) {
      if (s.power.armee >= 55) {
        // L'armée tient la rue. Le pouvoir survit — et change de nature.
        s.hidden.agitation = clamp(s.hidden.agitation - 30);
        s.country.cohesion = clamp(s.country.cohesion - 10);
        s.derive = clamp(s.derive + 2, 0, 12);
        s.flags["insurrection_ecrasee"] = true;
        s.flags["une_speciale"] = "« L'ORDRE RÉTABLI » — bilan officiel : onze morts. Bilan des hôpitaux : davantage.";
        s.flags["une_speciale_ton"] = "servile";
        s.log.push({ turn: s.turnCount, text: "Un soulèvement populaire a été écrasé par l'armée." });
      } else {
        return "insurrection";
      }
    }
  }

  if (s.flags["censure_votee"] && !s.flags["censure_geree"]) {
    // Une censure ne tue pas toujours : elle tue quand tout le reste vacille.
    s.flags["censure_geree"] = true;
    if (s.power.popularite < 38 || s.power.sieges < 260) return "censure";
    s.power.popularite -= 5;
  }
  if (s.hidden.coup > 70 && rng.chance((s.hidden.coup - 70) / 50)) {
    if (s.power.armee >= 58 && s.flags["verdier_limoge"]) {
      // Le coup échoue : l'armée loyale n'a pas suivi les conjurés.
      s.hidden.coup = 25;
      s.flags["coup_echoue"] = true;
      s.press.push({ kind: "une", text: "« LA NUIT OÙ LA RÉPUBLIQUE A TENU » — trois colonels arrêtés à l'aube", tone: "neutre" });
      s.log.push({ turn: s.turnCount, text: "Une tentative de coup d'État a échoué — l'armée loyale n'a pas suivi." });
    } else {
      return "coup";
    }
  }
  if (s.hidden.assassinat > 65 && rng.chance((s.hidden.assassinat - 65) / 70)) return "assassinat";
  if (s.hidden.sante <= 5) return "mort_epuisement";
  if (s.power.popularite < 16 && s.power.parti < 22 && rng.chance(0.4)) return "poignards";
  return null;
}

// ---------------------------------------------------------------------------
// Construction de l'écran final
// ---------------------------------------------------------------------------

function n(v: number): string {
  return v.toFixed(1).replace(".", ",");
}

function moyennes(s: GameState) {
  const nT = Math.max(1, (s.flags["cum_n"] as number) ?? 1);
  const croissance = ((s.flags["cum_croissance"] as number) ?? s.country.croissance * nT) / nT;
  const chomage = ((s.flags["cum_chomage"] as number) ?? s.country.chomage * nT) / nT;
  const detteDelta = s.country.dette - ((s.flags["dette_debut"] as number) ?? 114);
  const annees = Math.max(1, Math.round(s.turnCount / 2));
  return { croissance, chomage, detteDelta, annees };
}

function comparatif(s: GameState): EndingResult["comparatif"] {
  const m = moyennes(s);
  const rangDe = (val: number, key: "croissance" | "chomage" | "detteDelta", asc: boolean) => {
    const all = [...PRESIDENTS.map((p) => p[key]), val].sort((a, b) => (asc ? a - b : b - a));
    return all.indexOf(val) + 1;
  };
  const total = PRESIDENTS.length + 1;
  return [
    { critere: "Croissance moyenne", valeur: `${n(m.croissance)} % par an`, rang: `${rangDe(m.croissance, "croissance", false)}e sur ${total} présidents de la Ve République` },
    { critere: "Chômage moyen", valeur: `${n(m.chomage)} %`, rang: `${rangDe(m.chomage, "chomage", true)}e sur ${total}` },
    { critere: "Évolution de la dette", valeur: `${m.detteDelta >= 0 ? "+" : ""}${n(m.detteDelta)} points de PIB`, rang: `${rangDe(m.detteDelta, "detteDelta", true)}e sur ${total}` },
    { critere: "Années au pouvoir", valeur: `${m.annees} an${m.annees > 1 ? "s" : ""}`, rang: m.annees >= 10 ? "parmi les plus longs règnes" : m.annees >= 7 ? "dans la moyenne haute" : "parmi les mandats courts" },
  ];
}

function note(v: number): number {
  return Math.round(Math.max(0, Math.min(20, v)));
}

function verdict(s: GameState, cause: EndingCause): EndingResult["verdict"] {
  const m = moyennes(s);
  const conj = s.characters["conjoint"];
  const axesNationaux = [
    { nom: "Prospérité", note: note(10 + m.croissance * 3 - Math.max(0, s.country.chomage - 7) * 1.2 - Math.max(0, m.detteDelta) * 0.15) },
    // Une ligne extrême rogne les libertés même sans dérive autoritaire formelle.
    { nom: "Libertés", note: note(19 - s.derive * 1.7 + (s.power.presse - 50) * 0.04 - Math.max(0, Math.abs(s.bord) - 5) * 1.4) },
    { nom: "Sécurité", note: note(s.country.securite / 5) },
    { nom: "Cohésion", note: note(s.country.cohesion / 5) },
    { nom: "Environnement", note: note(s.country.environnement / 5) },
    { nom: "Rang international", note: note(s.country.prestige / 5) },
  ];
  const axesPersonnels = [
    { nom: "Intégrité", note: note(s.player.integrite / 5 - (s.flags["carnets_proces"] ? 4 : 0)) },
    { nom: "Famille", note: note(s.flags["divorce"] ? 5 : conj.loyaute / 5) },
    { nom: "Santé", note: note(s.hidden.sante / 5) },
  ];
  const totalNat = axesNationaux.reduce((a, b) => a + b.note, 0) / 6;
  let jugement: string;
  if (cause === "hiver") jugement = "Il n'y a plus d'historiens pour juger.";
  else if (cause === "republique_populaire" || cause === "etat_national")
    jugement =
      "Les manuels scolaires du pays consacrent onze pages élogieuses à cette période. Ils ont été réécrits sous votre autorité. Les manuels des pays voisins, eux, consacrent au même mandat un encadré de quatre lignes et un seul adjectif.";
  else if (cause === "cincinnatus") jugement = "Les historiens hésitent encore entre « miracle civique » et « accident heureux ». Ils s'accordent sur un point : personne n'a fait ça avant.";
  else if (s.derive >= 8) jugement = "Les historiens de votre pays écrivent sous surveillance. Ceux de l'étranger ont déjà rendu leur verdict, et il est sans appel.";
  else if (totalNat >= 13) jugement = "Le recul aidant, les historiens parlent d'un mandat majeur — de ceux qui laissent le pays différent de celui qu'ils ont trouvé.";
  else if (totalNat >= 9) jugement = "Un mandat contrasté, disent les historiens : des réformes réelles, des blessures réelles, et le sentiment tenace d'un rendez-vous à moitié honoré.";
  else jugement = "Les historiens sont cruels avec les mandats qui subissent leur époque au lieu de la saisir. Le vôtre est rangé dans cette étagère-là.";
  return { axesNationaux, axesPersonnels, jugement };
}

/**
 * Les compléments de la phrase d'ouverture de la notice. Le nom d'une option
 * ne se glisse pas tel quel dans une phrase française : « issu d'un famille
 * communiste » ou « né dans la Bretagne » ne passent pas. On écrit donc le
 * complément à la main partout où la règle générique se casse.
 */
const NOTICE_ORIGINE: Record<string, string> = {
  bretagne: "en Bretagne",
  marseille: "à Marseille",
  outremer: "en outre-mer",
  exil: "à l'étranger, au gré des affectations paternelles",
  corse: "sur l'île",
};

const NOTICE_MILIEU: Record<string, string> = {
  ouvrier: "d'un milieu ouvrier",
  fonctionnaire: "d'une famille de fonctionnaires",
  commercant: "d'une famille de petits commerçants",
  bourgeois: "de la grande bourgeoisie",
  agricole: "d'une exploitation agricole",
  enseignant: "d'une famille d'enseignants",
  immigre: "de parents immigrés",
  militaire_famille: "d'une famille de militaires",
  artisan: "d'un atelier d'artisan",
  medical: "d'un cabinet médical de campagne",
  monoparental: "d'une famille élevée par une mère seule",
  patronal: "d'une PME familiale",
  clerical: "d'une famille catholique pratiquante",
  communiste: "d'une famille communiste",
};

const NOTICE_FORMATION: Record<string, string> = {
  ena: "l'école du pouvoir",
  droit: "la faculté de droit",
  eco: "une thèse d'économie",
  militaire: "quinze ans sous l'uniforme",
  autodidacte: "aucune école, seulement le terrain",
  medecin: "la médecine hospitalière",
  syndicale: "l'école du syndicat",
  ingenieur: "une grande école d'ingénieurs",
  journalisme: "le journalisme",
  prof: "l'enseignement de l'histoire",
  affaires: "la finance",
  humanitaire: "quinze ans d'humanitaire",
  police: "la police nationale",
  sportif: "le sport de haut niveau",
};

const NOTICE_MENTOR: Record<string, string> = {
  baron: "d'un baron local",
  professeure: "d'une professeure de droit",
  syndicaliste: "d'un vieux syndicaliste",
  industriel: "d'un industriel philanthrope",
  prefet: "d'un ancien préfet",
  resistante: "de la dernière résistante de son département",
  personne: "de personne",
  cure: "du curé de sa paroisse",
  patronne: "d'une patronne de presse",
  avocat: "d'un avocat pénaliste",
  generale: "d'une générale à la retraite",
  militante: "d'une militante de quartier",
  banquier: "d'un banquier d'affaires",
  ennemi: "de son propre adversaire",
};

/** Ne minuscule que l'article de tête : « Le Rhône » ne devient pas « le rhône ». */
function articleMinuscule(nom: string): string {
  return nom.replace(/^(Les|Le|La|L'|Un|Une|Des)/, (m) => m.toLowerCase());
}

function noticeBio(s: GameState, cause: EndingCause, une: string): string[] {
  const b = s.bio;
  const m = moyennes(s);
  const e = b.genre === "f" ? "e" : "";
  const regionNom = REGIONS.find((r) => r.id === b.regionId)?.nom;
  const origine = NOTICE_ORIGINE[b.regionId] ?? (regionNom ? `dans ${articleMinuscule(regionNom)}` : "en province");
  const milieu = NOTICE_MILIEU[b.milieuId] ?? "d'un milieu modeste";
  const formation = NOTICE_FORMATION[b.formationId] ?? "des études sans relief";
  const mentor = NOTICE_MENTOR[b.mentorId] ?? "d'un mentor";
  const p: string[] = [];

  p.push(
    `${b.prenom} ${b.nom}, né${e} ${origine}, issu${e} ${milieu}, passé${e} par ${formation} et formé${e} auprès ${mentor}, accéda à la présidence de la République après une ascension ${s.flags["pot_de_vin_ascension"] ? "dont certains financements firent l'objet de procédures ultérieures" : "conduite avec méthode"}.`
  );

  p.push(
    `Sur le plan économique, son mandat afficha une croissance moyenne de ${n(m.croissance)} % et un chômage moyen de ${n(m.chomage)} %, la dette publique évoluant de ${m.detteDelta >= 0 ? "+" : ""}${n(m.detteDelta)} points de PIB.${s.flags["retraites_faite"] ? " La réforme des retraites, adoptée dans la douleur, resta la marque économique de la période." : ""}${s.flags["referendum_perdu"] ? " Le référendum perdu sur les retraites brisa durablement son autorité." : ""}`
  );

  // La ligne politique : ce que les manuels retiendront comme « la période ».
  const ligne = bordMeta(s.bord);
  if (Math.abs(s.bord) >= 8) {
    p.push(
      s.bord <= -8
        ? `La présidence bascula dans une économie entièrement dirigée : nationalisations en chaîne, contrôle des capitaux, presse placée sous administration. Les historiens classent la période sous le terme, contesté, de « ${ligne.label.toLowerCase()} ».`
        : `La présidence installa un régime de préférence nationale et d'exception permanente : registres administratifs, dissolutions par décret, juridiction constitutionnelle suspendue. Les historiens classent la période sous le terme, contesté, de « ${ligne.label.toLowerCase()} ».`
    );
  } else if (Math.abs(s.bord) >= 5) {
    p.push(
      `Sur le plan idéologique, le mandat fut celui d'une ${ligne.label.toLowerCase()} assumée — ligne que ses partisans jugèrent courageuse et ses adversaires irresponsable, sans que les faits n'aient jamais tout à fait tranché.`
    );
  } else if (Math.abs(s.bord) <= 1) {
    p.push(
      "Aucune école de pensée ne revendique aujourd'hui son héritage : le mandat fut celui d'un arbitrage permanent, que les uns nomment sens de l'État et les autres absence de convictions."
    );
  }

  const lib: string[] = [];
  if (s.derive >= 8) lib.push("Les institutions furent profondément altérées : état d'exception installé, presse domestiquée, contre-pouvoirs neutralisés. Les juristes parlent d'une « présidence hors du cadre ».");
  else if (s.derive >= 4) lib.push("Le mandat fut marqué par un durcissement contesté de l'appareil d'État — pouvoirs d'exception, pressions sur la presse — que ses défenseurs justifièrent par les circonstances.");
  else lib.push("Les libertés publiques sortirent du mandat pour l'essentiel intactes — fait suffisamment rare en temps de crise pour être relevé par les chroniqueurs.");
  if (s.flags["rp_survenu"]) lib.push("La crise des Ronds-Points fit descendre dans la rue une France périphérique que la capitale avait cessé de voir.");
  if (s.flags["etat_urgence"]) lib.push("L'état d'urgence, jamais complètement refermé, resta en héritage.");
  p.push(lib.join(" "));

  const monde: string[] = [];
  if (s.flags["sahel_retrait"]) monde.push("Le retrait du Sahel referma soixante ans de présence militaire française — décision douloureuse dont l'évaluation divise encore.");
  if (s.flags["sahel_enlisement"]) monde.push("L'enlisement sahélien coûta des vies et des milliards sans qu'aucun « état final » n'ait jamais été défini.");
  if (s.log.some((l) => l.text.includes("médiation"))) monde.push("Sa médiation dans la guerre des Deux Fleuves valut à la diplomatie française l'un de ses derniers grands succès.");
  if (monde.length === 0) monde.push(`À l'international, la France maintint son rang (prestige évalué à ${s.country.prestige}/100 par les chancelleries) sans initiative majeure.`);
  p.push(monde.join(" "));

  const scandales: string[] = [];
  if (s.flags["carnets_proces"]) scandales.push("L'affaire dite « des carnets », née du financement de sa campagne, poursuivit la présidence jusqu'après son terme et s'acheva devant les tribunaux.");
  if (s.flags["watergate_public"]) scandales.push("Le scandale des écoutes visant une journaliste — « l'affaire Ferrand » — entacha durablement la fonction.");
  if (s.flags["carnets_confession"]) scandales.push("Sa confession télévisée sur les irrégularités de campagne, sans précédent, est étudiée comme un cas limite de transparence politique.");
  if (scandales.length > 0) p.push(scandales.join(" "));

  const prive: string[] = [];
  if (s.flags["divorce"]) prive.push("Sa vie privée ne résista pas à la charge : la séparation du couple présidentiel, en cours de mandat, fut un événement politique en soi.");
  if (s.flags["maladie_publique"]) prive.push("La révélation de sa maladie fit entrer la santé des dirigeants dans le débat démocratique français.");
  if (s.flags["maladie_cachee"] && !s.flags["maladie_publique"]) prive.push("On apprit plus tard qu'une maladie grave avait été dissimulée au pays pendant l'exercice du pouvoir.");
  if (s.flags["frere_condamne"] && s.log.some((l) => l.text.includes("frère"))) prive.push("La question de son frère condamné traversa le mandat comme une blessure familiale exposée en place publique.");
  if (prive.length > 0) p.push(prive.join(" "));

  p.push(`La presse du lendemain de sa sortie titrait : ${une}`);
  return p;
}

interface EndingMeta {
  id: string;
  nom: string;
  famille: string;
  rarete: EndingResult["rarete"];
  une: (s: GameState) => string;
  epitaphe: (s: GameState) => string;
}

const ENDINGS: Record<string, EndingMeta> = {
  jamais_elu: {
    id: "jamais_elu", nom: "L'Histoire ne retiendra pas votre nom", famille: "Sortie politique", rarete: "commune",
    une: () => "« LE PAYS A CHOISI » — votre défaite en page 1, votre avenir en page 12.",
    epitaphe: () => "Battu(e) au seuil du pouvoir. Il y a des carrières entières dans ce seuil.",
  },
  battu: {
    id: "battu", nom: "Battu au second tour", famille: "Sortie politique", rarete: "très commune",
    une: (s) => s.campaign?.opposantId === "delval"
      ? "« LE DAUPHIN DÉVORE SON ROI » — Sacha Delval élu ; votre portrait, déjà, en noir et blanc."
      : s.campaign?.opposantId === "figure_rp"
        ? "« LA REVANCHE DES RONDS-POINTS » — Maryse Cottin présidente. Le pays qui survivait vous a remplacé."
        : "« L'ALTERNANCE » — la République a tourné votre page avec la politesse des institutions.",
    epitaphe: (s) => s.campaign?.opposantId === "delval" ? "Trahi par celui que vous aviez fait." : "Le suffrage a parlé. Il n'a pas remercié.",
  },
  censure: {
    id: "censure", nom: "La censure", famille: "Sortie politique", rarete: "commune",
    une: () => "« LE RÉGIME EN CRISE » — gouvernement renversé, président démissionnaire : la Ve vacille.",
    epitaphe: () => "Un 49.3 de trop. L'Assemblée a fini par compter jusqu'à 289.",
  },
  poignards: {
    id: "poignards", nom: "Les poignards", famille: "Sortie politique", rarete: "peu commune",
    une: () => "« LÂCHÉ PAR LES SIENS » — personne ne vous a battu ; tout le monde vous a quitté.",
    epitaphe: () => "On meurt rarement de ses ennemis, en politique. On meurt de ses amis, à l'heure des poignards.",
  },
  coup: {
    id: "coup", nom: "Le 18 Brumaire", famille: "Sortie violente", rarete: "rare",
    une: () => "« L'ARMÉE PREND LE POUVOIR » — communiqué n°1 du Comité de salut national. Votre nom n'y figure qu'au passé.",
    epitaphe: (s) => s.flags["verdier_limoge"] ? "Le général que vous aviez limogé est revenu par la caserne." : "Vous avez vu les symptômes. Vous n'avez pas voulu lire la maladie.",
  },
  assassinat: {
    id: "assassinat", nom: "Le fanatique", famille: "Sortie violente", rarete: "rare",
    une: (s) => s.derive >= 6
      ? "« LE PRÉSIDENT ABATTU » — l'enquête est confiée aux services. Personne n'attend la vérité."
      : "« LA RÉPUBLIQUE EN DEUIL » — un déséquilibré, trois secondes, l'Histoire qui bascule.",
    epitaphe: (s) => s.derive >= 6 ? "Quand on règne par la peur, on meurt de la peur des autres." : "Mort(e) en fonction, aimé(e) trop tard — c'est l'usage.",
  },
  mort_epuisement: {
    id: "mort_epuisement", nom: "Mort au travail", famille: "Sortie violente", rarete: "rare",
    une: () => "« LE PRÉSIDENT EST MORT » — l'Élysée annonce un décès « dans l'exercice de ses fonctions ». Le mot « épuisement » ne sera jamais officiel.",
    epitaphe: () => "Le corps a présenté sa motion de censure. Elle était sans appel.",
  },
  fin_mandats: {
    id: "fin_mandats", nom: "Père / Mère de la Nation", famille: "Sortie honorable", rarete: "rare",
    une: () => "« MERCI » — un seul mot en une, et votre photo de dos, quittant l'Élysée à pied.",
    epitaphe: () => "Deux mandats, un pays debout, des libertés intactes. Une place portera votre nom — elles sont rares, les places gagnées ainsi.",
  },
  memoires: {
    id: "memoires", nom: "Les Mémoires", famille: "Sortie honorable", rarete: "commune",
    une: () => "« UNE PAGE SE TOURNE » — bilan contrasté, sortie digne : la République sait faire ces adieux-là.",
    epitaphe: () => "Votre livre s'appellera « Le Prix des choses ». Il se vendra très bien. Vous n'y direz pas tout.",
  },
  geneve: {
    id: "geneve", nom: "Genève", famille: "Sortie honorable", rarete: "peu commune",
    une: () => "« UN FRANÇAIS À LA TÊTE DU MONDE » — votre élection à la tête de l'organisation internationale salue une stature que le pays, lui, n'a pas reconduite.",
    epitaphe: () => "La France perd un président. Le monde gagne un fonctionnaire. L'Histoire hésite sur le sens de l'échange.",
  },
  retrait_volontaire: {
    id: "retrait_volontaire", nom: "La parole tenue", famille: "Sortie honorable", rarete: "rare",
    une: () => "« IL PART, COMME PROMIS » — le mandat unique, tenu. La classe politique n'en revient toujours pas.",
    epitaphe: () => "Vous aviez dit une chose. Vous l'avez faite. C'est si rare que ça ressemble à une fin heureuse.",
  },
  consulat: {
    id: "consulat", nom: "Le Consulat", famille: "Sortie autoritaire", rarete: "peu commune",
    une: () => "« LE PRÉSIDENT DE LA STABILITÉ » — page 1 du Journal de la Nation, seul quotidien paraissant ce matin.",
    epitaphe: () => "Vous mourrez au pouvoir, de vieillesse, dans un pays silencieux. Votre épilogue est rédigé par votre propre ministère de l'Information.",
  },
  consulat_perdu: {
    id: "consulat_perdu", nom: "Le référendum de trop", famille: "Sortie politique", rarete: "peu commune",
    une: () => "« NON » — 61 %. Le pays vous a répondu. Le pays entier.",
    epitaphe: () => "Vous avez demandé au peuple la permission de rester. Il a saisi l'occasion de tout dire.",
  },
  cincinnatus: {
    id: "cincinnatus", nom: "Cincinnatus", famille: "Fin rare", rarete: "exceptionnelle",
    une: () => "« L'HOMME QUI A RENDU LES CLÉS » — Le Fil, sous la plume de Louise Ferrand. C'est son premier article élogieux en vingt ans.",
    epitaphe: () => "Vous aviez tout le pouvoir. Vous l'avez rendu. Les manuels de droit constitutionnel ont dû créer une note de bas de page pour vous.",
  },
  republique_populaire: {
    id: "republique_populaire", nom: "La République populaire", famille: "Sortie autoritaire", rarete: "exceptionnelle",
    une: () => "« LE COMITÉ ANNONCE LA FIN DE LA PÉRIODE DE TRANSITION » — L'Écho du Peuple, quotidien unique, page 1, quatorzième année.",
    epitaphe: () => "Vous vouliez que tout appartienne à tous. À la fin, tout vous appartenait — et personne n'osait le formuler ainsi.",
  },
  etat_national: {
    id: "etat_national", nom: "L'État national", famille: "Sortie autoritaire", rarete: "exceptionnelle",
    une: () => "« LA NATION RASSEMBLÉE, LE PRÉSIDENT RECONDUIT » — Le Journal de la Nation, tirage obligatoire dans les administrations.",
    epitaphe: () => "Vous vouliez rendre le pays à ceux qui y étaient nés. Il ne reste qu'un registre, un drapeau, et beaucoup de silence.",
  },
  hiver: {
    id: "hiver", nom: "L'Hiver", famille: "Catastrophe", rarete: "exceptionnelle",
    une: () => "—",
    epitaphe: () => "Il n'y a plus personne pour écrire l'histoire.",
  },
  insurrection: {
    id: "insurrection", nom: "Le soulèvement", famille: "Sortie violente", rarete: "peu commune",
    une: () => "« LE PAYS A REPRIS SES CLÉS » — dix-sept préfectures occupées, un palais vide, une page blanche.",
    epitaphe: () => "Vous avez gouverné un pays qui ne répondait plus. Il a fini par répondre.",
  },
  chute_regime: {
    id: "chute_regime", nom: "La chute", famille: "Sortie violente", rarete: "rare",
    une: (s) => s.bord <= -5
      ? "« LE COMITÉ N'EXISTE PLUS » — édition libre, première depuis onze ans, imprimée dans la nuit."
      : "« LE RÉGIME EST TOMBÉ » — édition libre, première depuis des années, tirée à un million d'exemplaires.",
    epitaphe: (s) => s.bord <= -5
      ? "Vous vouliez tout donner au peuple. Il est venu chercher le reste lui-même."
      : "Vous aviez fait du pays une forteresse. Elle n'avait de murs que vers l'intérieur.",
  },
  prison: {
    id: "prison", nom: "L'instruction", famille: "Sortie judiciaire", rarete: "rare",
    une: () => "« MIS EN EXAMEN, PUIS CONDAMNÉ » — Le Fil publie les trois cents pages. Le reste de la presse suit à midi.",
    epitaphe: () => "Ce n'est pas le pouvoir qui vous a perdu. C'est une pièce jointe, et quelqu'un d'assez patient pour l'attendre.",
  },
  statues: {
    id: "statues", nom: "Les statues", famille: "Sortie honorable", rarete: "exceptionnelle",
    une: () => "« LA DÉCENNIE » — et, sous le titre, rien d'autre qu'une photo de la cour d'honneur, vide.",
    epitaphe: () => "Un pays rendu en meilleur état qu'on ne l'a reçu, sans avoir rien pris au passage. Vos prédécesseurs, presque tous, ont dû aménager cette phrase.",
  },
};

export function buildEnding(s: GameState, cause: EndingCause): EndingResult {
  let meta: EndingMeta;
  if (cause === "fin_mandats") {
    // La sortie de fin de mandats se décline selon l'état du pays et du joueur.
    const m = moyennes(s);
    const honorable = s.derive <= 2 && !s.flags["carnets_proces"];
    // Les statues ne s'obtiennent pas en évitant les catastrophes : il faut
    // rendre le pays meilleur qu'on l'a trouvé, sur tous les tableaux à la fois.
    const exemplaire =
      honorable &&
      s.mandat >= 2 &&
      s.derive === 0 &&
      s.power.popularite >= 55 &&
      m.croissance >= 1.6 &&
      s.country.cohesion >= 58 &&
      s.country.services >= 55 &&
      s.country.prestige >= 75 &&
      m.detteDelta <= 0 &&
      s.player.integrite >= 60;
    // La justice peut rattraper une sortie même arrivée à son terme.
    const rattrape = (s.flags["carnets_proces"] || s.flags["watergate_public"]) && s.power.justice < 32 && s.player.integrite < 30;
    if (rattrape) meta = ENDINGS.prison;
    else if (exemplaire) meta = ENDINGS.statues;
    else if (honorable && s.mandat >= 2 && s.power.popularite >= 45 && m.croissance >= 1.1 && s.country.cohesion >= 45) meta = ENDINGS.fin_mandats;
    else if (honorable && s.country.prestige >= 78) meta = ENDINGS.geneve;
    else meta = ENDINGS.memoires;
  } else if (cause === "retrait_volontaire") {
    meta = ENDINGS.retrait_volontaire;
  } else {
    meta = ENDINGS[cause] ?? ENDINGS.memoires;
  }
  const une = meta.une(s);
  if (cause === "hiver") {
    return {
      id: meta.id, nom: meta.nom, famille: meta.famille, rarete: meta.rarete,
      une: "",
      epitaphe: meta.epitaphe(s),
      epilogue: [],
      notice: [
        "L'escalade a atteint le dernier cran une nuit d'hiver. Les archives s'arrêtent à 23h41.",
        "Il n'y a pas de une du lendemain. Il n'y a pas de lendemain, pas de notice, pas de comparatif.",
        "Ce jeu ne connaît qu'une seule règle absolue : la dernière marche n'est jamais une option stratégique. Vous l'avez vérifiée.",
      ],
      verdict: verdict(s, cause),
      comparatif: [],
    };
  }
  // L'épilogue suit la fin réellement obtenue, pas la cause brute : « fin de
  // mandats » peut aussi bien mener aux statues qu'à la cellule.
  const finale = meta.id as EndingCause;
  return {
    id: meta.id,
    nom: meta.nom,
    famille: meta.famille,
    rarete: meta.rarete,
    une,
    epitaphe: meta.epitaphe(s),
    epilogue: epilogue(s, finale),
    notice: noticeBio(s, cause, une),
    verdict: verdict(s, cause),
    comparatif: comparatif(s),
  };
}

// ---------------------------------------------------------------------------
// Événements de bascule de fin (Consulat, Cincinnatus, escalade, mandat unique)
// ---------------------------------------------------------------------------

/**
 * Les casseroles accumulées. Une seule ne fait jamais tomber personne ; c'est
 * la pile qui devient un dossier, et le dossier qui devient une instruction.
 */
const CASSEROLES: { flag: string; texte: string }[] = [
  { flag: "pot_de_vin_ascension", texte: "une enveloppe encaissée du temps de la mairie" },
  { flag: "these_arrangee", texte: "trois chapitres de thèse empruntés" },
  { flag: "carnets_proces", texte: "les carnets du trésorier" },
  { flag: "watergate_public", texte: "les écoutes d'une journaliste" },
  { flag: "amities_marseille", texte: "des amitiés du littoral qu'on aurait préféré oublier" },
  { flag: "dette_baron", texte: "les services rendus au baron local" },
  { flag: "dette_industriel", texte: "un décret taillé pour un industriel" },
  { flag: "dette_banquier", texte: "un carnet d'adresses qui engage" },
  { flag: "repression_dure", texte: "onze morts que le bilan officiel n'a jamais reconnus" },
  { flag: "ferrand_surveillee", texte: "la surveillance d'une journaliste" },
  { flag: "emploi_familial", texte: "un emploi familial jamais occupé" },
  { flag: "don_libanais", texte: "un don étranger passé par trois comptes" },
  { flag: "rives_marche_truque", texte: "un appel d'offres cousu main" },
  { flag: "rapport_etouffe", texte: "un rapport d'inspection disparu" },
];

function casseroles(s: GameState): string[] {
  return CASSEROLES.filter((c) => s.flags[c.flag]).map((c) => c.texte);
}

export const EVENTS_FINS: GameEvent[] = [
  {
    id: "ferrand_dossier_final",
    kind: "intrigue",
    titre: "Le dossier",
    rarete: "rare",
    once: true,
    weight: (s) => {
      const f = s.characters["ferrand"];
      if (!f?.vivant) return 0;
      const n = casseroles(s).length;
      if (n < 2 || s.turnCount < 4) return 0;
      // Plus la pile est haute et l'intégrité basse, plus la publication approche.
      return Math.min(8, n * 1.5 + (s.player.integrite < 35 ? 2 : 0) + f.rancune * 0.03);
    },
    texte: (s) => {
      const liste = casseroles(s);
      const trois = liste.slice(0, 3).join(" ; ");
      return `${nomCompletDe(s, "ferrand")} demande un droit de réponse sous quarante-huit heures. La lettre fait deux pages et cite, pièces à l'appui : ${trois}${liste.length > 3 ? ` — et ${liste.length - 3} autre${liste.length > 4 ? "s" : ""} point${liste.length > 4 ? "s" : ""}` : ""}. Ce n'est pas un article : c'est une instruction judiciaire écrite d'avance, à laquelle il ne manque qu'un procureur. Votre avocat a lu la lettre deux fois, puis a demandé si vous étiez assis.`;
    },
    choices: [
      {
        id: "tout_reconnaitre",
        label: "Tout reconnaître, avant publication",
        detail: "Prendre les devants. La chute sera dure — mais ce sera une chute politique, pas judiciaire.",
        risque: 2,
        aptitude: "integrite",
        effects: (c) => {
          c.adj({ power: { popularite: -18, parti: -14, presse: 10 }, player: { integrite: 12 } });
          c.rel("ferrand", { rancune: -20, loyaute: 10 });
          c.flag("confession_publique");
          c.log("Vous avez tout reconnu publiquement avant la parution du dossier.");
          return "Vous prenez la parole avant elle, sans notes, pendant vingt-deux minutes. Vous ne minimisez rien — c'est précisément ce qui désarme le dispositif : il n'y a plus de révélation à faire, seulement un homme qui raconte ce qu'il a fait. Votre popularité s'effondre. Les juges, eux, héritent d'un dossier sans dissimulation, ce qui change tout pour la suite. L'article paraît quand même. Il est moins lu.";
        },
      },
      {
        id: "etouffer_dossier",
        label: "Étouffer",
        detail: "Actionner ce qui reste : le propriétaire du titre, les services, la pression.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const leviers = c.s.power.presse > 55 || c.s.derive >= 5;
          if (leviers && c.rng.chance(0.55)) {
            c.derive(2);
            c.adj({ power: { presse: -10 }, player: { integrite: -10 } });
            c.rel("ferrand", { rancune: 35 });
            c.flag("dossier_etouffe");
            c.log("Le dossier a été étouffé avant parution.");
            return "Le titre ne paraît pas. Officiellement, « un problème de sourçage ». La rédaction sait, la profession sait, et une note de six lignes circule dans tous les journaux du pays sans qu'aucun ne l'imprime. Vous avez gagné six mois et une ennemie définitive — elle a désormais deux sujets : le dossier, et ce que vous avez fait pour l'enterrer.";
          }
          c.adj({ power: { presse: -20, popularite: -14, justice: -12 }, player: { integrite: -12 } });
          c.rel("ferrand", { rancune: 40 });
          c.flag("chute_judiciaire");
          c.log("La tentative d'étouffer le dossier a déclenché la chute judiciaire.");
          return "La manœuvre fuite avant le dossier lui-même. C'est toujours ce qui arrive : on n'étouffe pas une enquête, on lui ajoute un chapitre. Le parquet s'autosaisit du chapitre, puis du reste. À midi, votre avocat vous conseille de ne plus utiliser votre téléphone.";
        },
      },
      {
        id: "attaquer_justice",
        label: "Attaquer en diffamation",
        detail: "Le terrain judiciaire. Il faut que les pièces soient fausses.",
        risque: 3,
        aptitude: "strategie",
        effects: (c) => {
          if (c.s.player.integrite >= 50 && casseroles(c.s).length <= 2) {
            c.adj({ power: { presse: -6, popularite: 3 }, player: { integrite: 3 } });
            c.rel("ferrand", { rancune: 15 });
            return "Vous attaquez, et vous avez raison d'attaquer : deux des trois pièces sont des reconstitutions, et la troisième ne prouve pas ce qu'elle prétend. Le tribunal tranchera dans dix-huit mois, en votre faveur, dans l'indifférence générale — mais le doute, lui, est mort le jour où vous avez assigné plutôt que dénié.";
          }
          c.adj({ power: { presse: -14, popularite: -10, justice: -8 }, player: { integrite: -6 } });
          c.flag("chute_judiciaire");
          c.log("La procédure en diffamation s'est retournée : les pièces étaient authentiques.");
          return "L'audience est publique. C'était l'idée : montrer qu'on n'a rien à cacher. Pendant quatre heures, l'avocat de la défense fait entrer les pièces une par une au dossier — authentifiées, datées, contradictoires avec vos déclarations. Vous avez fourni vous-même à la justice le cadre qui lui manquait. Le parquet ouvre son information le lendemain matin.";
        },
      },
      {
        id: "ne_rien_faire_dossier",
        label: "Ne pas répondre",
        detail: "Laisser passer. Parfois, ça passe.",
        effects: (c) => {
          const grave = casseroles(c.s).length >= 4;
          c.adj({ power: { popularite: -10, presse: -6 } });
          if (grave) {
            c.flag("chute_judiciaire");
            c.log("Le dossier est paru sans réponse. L'instruction a suivi.");
            return "Le silence est une réponse et tout le monde la lit correctement. Le dossier paraît sur six pages, avec les fac-similés. Le parquet national financier s'autosaisit à 14h. Votre communicante vous explique qu'il n'y a plus de séquence à construire — il y a un calendrier judiciaire, et il ne vous appartient pas.";
          }
          c.flag("dossier_paru");
          return "Le dossier paraît. Il est solide, il est grave, et il ne suffit pas : il manque la pièce qui transforme une accusation en infraction. Vous perdez dix points et la moitié de votre crédit. Vous gardez la main. Ce sera à refaire — les journalistes qui ont trouvé la moitié d'un dossier reviennent toujours chercher l'autre.";
        },
      },
    ],
  },
  {
    id: "insurrection_montee",
    kind: "crise",
    titre: "Le pays ne répond plus",
    weight: 0,
    texte: (s) => {
      const maux = indicateursCritiques(s).slice(0, 3).join(", ");
      return `Ce n'est plus une manifestation, c'est une carte. Dix-neuf départements signalent des blocages que les préfets ne savent plus lever ; deux hôtels de région sont occupés depuis six jours. Les renseignements ne parlent plus de « frémissement » mais de « bascule ». Ce qui tient encore le pays tient par habitude, et vous laissez derrière vous ${maux}. ${nomCompletDe(s, "verdier")} attend une réponse sur la réquisition. ${nomCompletDe(s, "rochefort")} attend une réponse sur le budget. Les deux savent que vous ne pouvez pas faire les deux.`;
    },
    choices: [
      {
        id: "concessions",
        label: "Céder. Beaucoup, tout de suite.",
        detail: "Gel des prix, moratoire, milliards non financés. Ça calme, et ça coûte pour longtemps.",
        risque: 2,
        aptitude: "charisme",
        effects: (c) => {
          c.adj({ hidden: { agitation: -30 }, country: { marge: -18, dette: 6, cohesion: 6 }, power: { popularite: 6 } });
          c.flag("insurrection_alerte", false);
          c.flag("concessions_insurrection");
          c.log("Face au soulèvement, vous avez cédé sur tout — et financé le calme à crédit.");
          return "Le paquet est annoncé un dimanche soir, chiffré nulle part, promis partout. Les blocages se lèvent en quatre jours. Bercy vous remet une note d'une page qui ne contient qu'un tableau et aucune phrase — vous venez d'acheter la paix sociale avec l'argent des dix prochaines années. La rue est rentrée. Elle sait maintenant comment on vous fait plier.";
        },
      },
      {
        id: "reformer_vite",
        label: "Traiter la cause, pas la fièvre",
        detail: "Un plan de fond sur les services publics. Lent — s'il vous reste du temps.",
        risque: 3,
        aptitude: "strategie",
        effects: (c) => {
          const tenable = c.s.country.marge > 25 && c.s.power.sieges >= 260;
          c.adj({ country: { services: 12, cohesion: 5, marge: -10 }, hidden: { agitation: tenable ? -22 : -8 } });
          if (tenable) {
            c.flag("insurrection_alerte", false);
            c.log("Vous avez répondu au soulèvement par un plan de fond sur les services publics.");
            return "Réouverture de lignes, de guichets, de maternités : des choses concrètes, visibles, que les gens peuvent aller vérifier à pied. Ça met six semaines à se voir et ça se voit. Les blocages se défont un par un, sans négociation spectaculaire — c'est la seule sortie de crise dont personne ne fera un film.";
          }
          return "Le plan est annoncé. Il est bon. Il est aussi impossible à financer et impossible à faire voter, et tout le monde s'en aperçoit en quarante-huit heures. Vous avez répondu à la colère par un document. Les blocages, eux, tiennent.";
        },
      },
      {
        id: "reprimer",
        label: "Réquisitionner. Faire dégager.",
        detail: "L'armée dans la rue. Si elle vous suit.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          if (c.s.power.armee < 45) {
            c.adj({ power: { armee: -8, popularite: -8 }, hidden: { agitation: 12, coup: 8 } });
            c.log("L'état-major a refusé de faire dégager les blocages.");
            return `L'ordre est donné. L'état-major demande une instruction écrite, puis un cadre juridique, puis un délai. C'est un refus en trois actes, poli, et parfaitement lisible par tout le monde — y compris par les blocages, qui doublent dans la semaine. Vous venez d'apprendre en public que vous ne commandez pas l'armée.`;
          }
          c.adj({ hidden: { agitation: -26, coup: 5 }, country: { cohesion: -12, securite: 6 }, power: { popularite: -6, presse: -8 } });
          c.derive(2);
          c.flag("insurrection_alerte", false);
          c.flag("repression_dure");
          c.log("Vous avez fait dégager les blocages par la force. Il y a eu des morts.");
          return "Les blindés légers arrivent à l'aube sur trois ronds-points. Ça dure quarante minutes et ça marche. Le bilan officiel parle de onze morts ; les hôpitaux comptent autrement, et un interne poste le décompte réel à 3h du matin. Le pays est calme le lundi. Il ne vous le pardonnera pas.";
        },
      },
      {
        id: "ignorer_montee",
        label: "Tenir. Ça retombera.",
        detail: "Ça retombe, parfois.",
        effects: (c) => {
          c.adj({ hidden: { agitation: 8 }, power: { popularite: -4 } });
          return "Vous maintenez l'agenda, les déplacements, les inaugurations. Le pouvoir consiste aussi à décider que quelque chose n'existe pas — la méthode a déjà fonctionné, deux fois, et elle a l'avantage de ne rien coûter tout de suite. Les cartes des préfets, elles, continuent de se remplir.";
        },
      },
    ],
  },
  {
    id: "consulat_referendum",
    kind: "intrigue",
    titre: "La révision",
    once: true,
    weight: (s) => (s.derive >= 8 && s.mandat === 2 && s.turn >= 6 ? 4 : 0),
    texte:
      "Vos conseillers les plus dévoués — il ne reste plus que ceux-là — présentent le projet : révision constitutionnelle par référendum, mandat porté à dix ans, renouvelable. « Pour la stabilité. » La presse qui reste approuvera. L'opposition qui reste protestera. Le peuple, lui, votera — c'est le dernier organe qui vote encore vraiment.",
    choices: [
      {
        id: "referendum_consulat",
        label: "Convoquer le référendum",
        effects: (c) => {
          const gagne = c.s.power.popularite > 40 || c.s.derive >= 10;
          if (gagne) {
            c.flag("consulat_valide");
            return "58 % de oui — les urnes ont parlé, dans un pays où plus grand-chose d'autre ne parle. Le mandat est prolongé. Les chancelleries occidentales publient des communiqués « préoccupés ». Ils s'y habitueront. Tout le monde s'habitue : c'est le principe que vous avez méthodiquement démontré.";
          }
          c.flag("consulat_rejete");
          return "61 % de non. Même les urnes que vous pensiez tenir vous ont échappé — le peuple a saisi la seule porte qui restait pour tout dire. La suite ne vous appartient plus.";
        },
      },
      {
        id: "renoncer_consulat",
        label: "Renoncer au projet",
        effects: (c) => {
          c.derive(-1);
          return "Le projet retourne au tiroir. Vos dévots sont déçus — la déception des dévots est un signal que vous avez appris à surveiller. Le mandat s'achèvera à sa date. C'est peut-être la première limite que vous acceptez depuis longtemps.";
        },
      },
    ],
  },
  {
    id: "cincinnatus_choix",
    kind: "intrigue",
    titre: "Ce que vous êtes devenu",
    once: true,
    weight: (s) => (!!s.flags["derive_haut"] && s.derive >= 5 && s.mandat === 2 && s.turn >= 5 ? 2 : 0),
    texte:
      "C'est une photo qui vous arrête — la vôtre, officielle, au mur derrière votre bureau. Vous ne vous souvenez pas d'avoir demandé ce format. Vous ne vous souvenez pas non plus de la dernière une critique, du dernier contre-pouvoir qui a dit non, de la dernière fois qu'un conseiller vous a contredit. Vingt tours de décisions défendables, chacune. Et ce mur. Il existe un chemin inverse. Il est très difficile, très long, et personne ne l'a jamais pris.",
    choices: [
      {
        id: "rendre",
        label: "Commencer à rendre le pouvoir",
        detail: "Lever l'exception, libérer la presse, organiser des élections que vous pouvez perdre.",
        effects: (c) => {
          c.flag("cincinnatus_engage");
          c.derive(-3);
          c.flag("etat_urgence", false);
          c.adj({ power: { presse: 15, justice: 10 } });
          c.log("Vous avez entamé la restitution des pouvoirs concentrés — le chemin inverse.");
          return "La levée de l'état d'exception. La restitution des fréquences. Le calendrier électoral, publié, avec des scrutins que rien ne garantit. Vos fidèles parlent de folie, vos ennemis de piège — personne ne croit à la troisième hypothèse, la vraie : vous avez vu le mur, et le portrait dessus.";
        },
      },
      {
        id: "garder",
        label: "Reposer la photo. Se remettre au travail.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 3 } });
          return "Le moment passe — les moments passent, c'est leur métier. Le portrait reste au mur. Il y en aura d'autres, plus grands : les murs ne manquent pas, dans les palais.";
        },
      },
    ],
  },
  {
    id: "cincinnatus_elections",
    kind: "intrigue",
    titre: "Les élections libres",
    once: true,
    weight: (s) => (!!s.flags["cincinnatus_engage"] && s.turn >= 8 ? 5 : 0),
    texte:
      "Les élections que vous avez organisées auront lieu dimanche. Les observateurs internationaux sont là — vous les avez invités. Les sondages, à nouveau indépendants, vous donnent perdant. Votre entourage propose « des ajustements » de dernière minute : il y a toujours, jusqu'au bout, quelqu'un pour proposer des ajustements.",
    choices: [
      {
        id: "laisser_perdre",
        label: "Laisser le scrutin se tenir",
        effects: (c) => {
          c.flag("cincinnatus_final");
          return "Dimanche, 20h : vous avez perdu, largement, proprement. Le pouvoir que vous aviez concentré se dissout dans une soirée électorale ordinaire — c'était le but, et c'est quand même vertigineux. Votre successeur, sur le perron, semble chercher ses mots. Vous connaissez la sensation.";
        },
      },
      {
        id: "ajustements",
        label: "« Des ajustements »",
        effects: (c) => {
          c.derive(3);
          c.flag("cincinnatus_engage", false);
          return "Les ajustements ont lieu. Vous gagnez — évidemment, c'est le propre des scrutins ajustés. Les observateurs internationaux publient leur rapport et repartent. Le chemin inverse est refermé, définitivement : on ne fait pas deux fois semblant de rendre les clés.";
        },
      },
    ],
  },
  {
    id: "mandat_unique_choix",
    kind: "intrigue",
    titre: "La promesse du mandat unique",
    once: true,
    weight: (s) => (s.mandat === 1 && s.turn >= 9 && s.promises.some((p) => p.id === "mandat_unique" && p.status === "en_cours") ? 6 : 0),
    texte:
      "Vous l'aviez dit, un soir de campagne, et le pays l'a noté : « Je ne me représenterai pas. » L'échéance approche. Votre entourage a préparé les deux discours — celui du départ, et celui qui explique pourquoi « le contexte a changé ». Les deux sont bien écrits. Un seul est vrai.",
    choices: [
      {
        id: "tenir_unique",
        label: "Tenir la promesse. Partir.",
        effects: (c) => {
          c.promesse("mandat_unique", "tenue");
          c.flag("retrait_annonce");
          c.log("Vous avez tenu la promesse du mandat unique : un seul mandat, comme annoncé.");
          return "L'annonce sidère la classe politique, qui cherche le piège — il n'y en a pas, c'est ça le piège. Votre cote remonte de dix points chez les gens qui ne votent plus pour personne. Trop tard pour en profiter : c'était précisément la condition de leur estime.";
        },
      },
      {
        id: "trahir_unique",
        label: "« Le contexte a changé »",
        effects: (c) => {
          c.promesse("mandat_unique", "trahie");
          c.adj({ power: { popularite: -12 }, player: { integrite: -10 } });
          for (const seg of Object.values(c.s.segments)) seg.soutien = Math.max(0, seg.soutien - 5);
          c.log("Vous avez trahi la promesse du mandat unique pour vous représenter.");
          return "Le discours du « contexte » est prononcé avec conviction. Il est reçu comme ce qu'il est. Cette promesse-là était la seule que tout le monde avait retenue — c'est le problème des promesses simples : leur trahison aussi est simple, et elle se raconte en une phrase sur tous les marchés de France.";
        },
      },
    ],
  },
  {
    id: "monde_escalade",
    kind: "monde",
    titre: "L'engrenage",
    once: true,
    weight: 0,
    texte:
      "La guerre des Deux Fleuves a débordé : un incident a touché un allié de l'OTAN, l'article 5 est invoqué à demi-mot, et une puissance nucléaire adverse vient de placer ses forces en alerte. La France est dans la chaîne de décision. Chaque cran offre encore une porte de sortie. Chaque porte coûte plus cher que la précédente.",
    choices: [
      {
        id: "desescalade",
        label: "Forcer la désescalade",
        detail: "Payer le prix diplomatique. Descendre l'échelle.",
        effects: (c) => {
          c.adj({ country: { prestige: -3 } });
          c.log("Au bord de l'engrenage nucléaire, la France a forcé la désescalade.");
          return "Quarante-huit heures de navette entre trois capitales, des concessions qui feront hurler les éditorialistes — et l'alerte qui redescend, cran par cran. Personne ne saura jamais à quoi le monde a échappé. C'est le lot des désescalades : elles n'ont pas d'images.";
        },
      },
      {
        id: "fermete_escalade",
        label: "Tenir la ligne de fermeté alliée",
        effects: (c) => {
          const derape = c.rng.chance(0.25);
          if (derape) {
            c.flag("hiver_declenche");
            return "La fermeté répond à la fermeté, l'alerte à l'alerte. Quelque part dans la chaîne, un radar interprète, un protocole s'exécute. La dernière marche n'était pas une option stratégique. Elle n'a jamais été une option du tout.";
          }
          c.adj({ country: { prestige: 4 } });
          return "Le bras de fer tient — l'adversaire recule le premier, l'alliance en sort soudée. On appellera ça de la fermeté visionnaire. C'était aussi un coup de dés avec l'espèce humaine pour mise. Les deux descriptions sont exactes.";
        },
      },
    ],
  },
];
