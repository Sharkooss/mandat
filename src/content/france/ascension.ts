import type { GameEvent, GameState } from "../../engine/types";
import type { Rng } from "../../engine/rng";
import { POIDS_RARETE } from "./data";

// ---------------------------------------------------------------------------
// Acte II — L'ascension. Sept étapes, tirées chacune dans son propre vivier :
// deux carrières ne commencent jamais de la même façon. Chaque choix laisse
// des traces qu'on retrouvera au pouvoir — alliés, ennemis, dettes, casseroles,
// et surtout une ligne politique qui se dessine sans qu'on l'ait décidé.
// ---------------------------------------------------------------------------

export interface AscensionEtape {
  id: string;
  titre: string;
  pool: string[];
}

export const ASCENSION_ETAPES: AscensionEtape[] = [
  {
    id: "debuts",
    titre: "Les débuts",
    pool: ["asc_deb_tract", "asc_deb_piquet", "asc_deb_cabinet", "asc_deb_asso", "asc_deb_jeunesses", "asc_deb_entreprise", "asc_deb_plateau", "asc_deb_place"],
  },
  {
    id: "local",
    titre: "Le premier mandat",
    pool: ["asc_mairie", "asc_loc_ecole", "asc_loc_usine", "asc_loc_video", "asc_loc_cantine", "asc_loc_sru", "asc_loc_crue", "asc_loc_aire"],
  },
  {
    id: "tentation",
    titre: "La tentation",
    pool: ["asc_zone", "asc_ten_emploi", "asc_ten_logement", "asc_ten_sondage", "asc_ten_journaliste", "asc_ten_audit", "asc_ten_legs"],
  },
  {
    id: "ligne",
    titre: "Ce qui vous définit",
    pool: ["asc_lig_licenciements", "asc_lig_faitdivers", "asc_lig_quotas", "asc_lig_autoroute", "asc_lig_europe", "asc_lig_laicite", "asc_lig_patrimoine", "asc_lig_retraites"],
  },
  {
    id: "parti",
    titre: "Le parti",
    pool: ["asc_congres", "asc_par_scission", "asc_par_investiture", "asc_par_comptes", "asc_par_vague", "asc_par_fusion"],
  },
  {
    id: "primaire",
    titre: "La consécration",
    pool: ["asc_primaire", "asc_pri_ouverte", "asc_pri_designe", "asc_pri_outsider"],
  },
  {
    id: "investiture",
    titre: "L'investiture",
    pool: ["asc_investiture", "asc_inv_discours", "asc_inv_alliance", "asc_inv_conjoint"],
  },
];

// Les cinq scénarios de la version précédente (asc_mairie, asc_zone,
// asc_congres, asc_primaire, asc_investiture) existent toujours et figurent
// dans les viviers : une partie commencée avant la refonte garde sa file
// d'attente et retrouve ses événements.

/** Tire un scénario par étape, pondéré par la rareté et filtré par la biographie. */
export function buildAscension(rng: Rng, s: GameState): string[] {
  const out: string[] = [];
  for (const etape of ASCENSION_ETAPES) {
    const candidats = etape.pool
      .map((id) => EVENTS_ASCENSION.find((e) => e.id === id))
      .filter((e): e is GameEvent => !!e && (!e.cond || e.cond(s)));
    if (candidats.length === 0) continue;
    const choisi = rng.weighted(candidats.map((e) => ({ item: e, weight: POIDS_RARETE[e.rarete ?? "commune"] })));
    out.push(choisi.id);
  }
  return out;
}

export const EVENTS_ASCENSION: GameEvent[] = [
  // =========================================================================
  // ÉTAPE 1 — LES DÉBUTS. Vingt-cinq ans, aucun mandat, beaucoup de temps.
  // =========================================================================
  {
    id: "asc_deb_tract",
    kind: "ascension",
    titre: "Le premier tract",
    texte:
      "Vingt-trois ans, un marché le dimanche matin, quatre cents tracts à distribuer. Sur trois heures, on vous en a pris douze, jeté sept, et une dame vous a expliqué pendant quarante minutes pourquoi elle ne votera plus jamais. Le responsable de section vous observe.",
    choices: [
      {
        id: "finir",
        label: "Finir les quatre cents",
        detail: "Jusqu'au dernier, même après la fermeture.",
        effects: (c) => {
          c.adj({ player: { endurance: 5, charisme: 2 } });
          c.flag("militant_terrain");
          return "Vous terminez à quatorze heures, seul, devant des étals qu'on démonte. Le responsable de section ne dit rien — mais c'est ce dimanche-là, et pas un discours, qui vous vaudra son soutien pendant vingt ans.";
        },
      },
      {
        id: "ecouter",
        label: "Écouter la dame quarante minutes",
        detail: "Tant pis pour les tracts.",
        effects: (c) => {
          c.adj({ player: { charisme: 5, rhetorique: 3 } });
          c.seg("retraites", { soutien: 3 });
          c.flag("ecoute_terrain");
          return "Elle parle de son mari, de sa pension, d'une pharmacie qui a fermé. Vous ne la convainquez pas. Mais vous repartez avec la seule chose qu'aucune note de synthèse ne vous donnera jamais : la façon dont les gens racontent leur propre vie.";
        },
      },
      {
        id: "organiser",
        label: "Réorganiser la distribution",
        detail: "Le problème n'est pas le tract. C'est la méthode.",
        effects: (c) => {
          c.adj({ player: { strategie: 6 }, power: { parti: 4 } });
          c.flag("organisateur");
          return "Vous rentrez avec un plan : découpage par bureaux de vote, binômes, fichier de suivi. La section double son rendement en six mois. On vous trouve un peu froid et parfaitement indispensable — c'est le début d'une carrière d'appareil.";
        },
      },
    ],
  },
  {
    id: "asc_deb_piquet",
    kind: "ascension",
    titre: "Le piquet de grève",
    rarete: "peu_commune",
    texte:
      "Une usine de deux cent quarante salariés, un plan social, six semaines d'occupation. Vous avez vingt-six ans et vous dormez sur place depuis onze jours. Ce soir, la direction propose un accord : quarante départs volontaires au lieu de cent, à condition que l'occupation cesse avant minuit.",
    choices: [
      {
        id: "accepter_accord",
        label: "Faire voter l'accord",
        detail: "Soixante emplois sauvés valent mieux qu'un principe.",
        effects: (c) => {
          c.adj({ player: { strategie: 5, cynisme: 3 }, power: { syndicats: 5 } });
          c.seg("periurbain", { soutien: 5 });
          c.flag("negociateur");
          return "L'accord passe à cinquante-quatre pour cent. Quarante familles encaissent, soixante respirent, et personne ne vous remercie — les compromis n'ont pas de cortège. Vous venez d'apprendre le métier réel : arbitrer entre des gens qui ont tous raison.";
        },
      },
      {
        id: "tenir_piquet",
        label: "Tenir. Refuser tout départ.",
        detail: "On ne négocie pas le nombre de nos morts.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { charisme: 6, endurance: 4 }, power: { syndicats: 10, patronat: -8 } });
          c.flag("intransigeant");
          return "Trois semaines de plus, une évacuation à six heures du matin, et finalement quatre-vingt-dix départs au lieu de cent. Vous avez perdu. Mais votre discours devant les grilles circule encore dix ans plus tard, et il a fait de vous quelqu'un.";
        },
      },
      {
        id: "mediatiser",
        label: "Appeler les télés",
        detail: "Transformer un conflit local en affaire nationale.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 5, cynisme: 4 }, power: { presse: 6 } });
          c.rel("ferrand", { loyaute: 5 });
          c.flag("bete_mediatique");
          return "Trois chaînes, un reportage de vingt minutes, le ministre obligé de recevoir une délégation. L'usine ferme quand même — mais vous, vous existez désormais à l'échelle du pays. Les grévistes l'ont remarqué aussi, et pas tous avec bienveillance.";
        },
      },
    ],
  },
  {
    id: "asc_deb_cabinet",
    kind: "ascension",
    titre: "Le stage en cabinet",
    texte:
      "Conseiller technique, dernier échelon, dans un ministère de second rang. Votre travail : produire des notes que personne ne lit. Un matin, votre note sur un dossier sensible remonte jusqu'au ministre — et il s'avère qu'elle contredit frontalement la position officielle qu'il défendra l'après-midi même.",
    choices: [
      {
        id: "retirer_note",
        label: "Retirer la note",
        detail: "Un stagiaire ne contredit pas un ministre.",
        effects: (c) => {
          c.adj({ player: { cynisme: 5, strategie: 4 }, power: { parti: 5 } });
          c.flag("discipline_cabinet");
          return "Vous la retirez avant midi, avec des excuses. Le directeur de cabinet vous garde — il garde toujours ceux qui comprennent vite. Vous avez appris ce jour-là que dans un cabinet, avoir raison au mauvais moment est une faute professionnelle.";
        },
      },
      {
        id: "maintenir_note",
        label: "Maintenir la note",
        detail: "Elle est juste. C'est le seul argument dont vous disposez.",
        effects: (c) => {
          c.adj({ player: { integrite: 7, strategie: 3 }, power: { parti: -5 } });
          c.flag("note_maintenue");
          return "Le ministre défend sa position, se plante trois mois plus tard, exactement comme vous l'aviez écrit. On ne vous en félicite pas ; on vous éloigne poliment. Mais la note existe, datée, signée — et vingt ans plus tard elle vous servira de brevet de lucidité.";
        },
      },
      {
        id: "fuiter_note",
        label: "La faire fuiter",
        detail: "Une enveloppe, une rédaction, aucune empreinte.",
        effects: (c) => {
          c.adj({ player: { cynisme: 8, reseau: 4 }, power: { presse: 8 } });
          c.rel("ferrand", { loyaute: 8 });
          c.flag("premiere_fuite");
          return "L'article sort le surlendemain. Le ministre cherche la fuite pendant six semaines et ne la trouve jamais. Vous venez de découvrir l'arme la plus efficace et la plus lâche de la vie politique française — et vous avez découvert que vous saviez vous en servir.";
        },
      },
    ],
  },
  {
    id: "asc_deb_asso",
    kind: "ascension",
    titre: "L'association",
    rarete: "peu_commune",
    texte:
      "Vous avez monté une association d'aide aux devoirs dans un quartier que personne ne visite. Trois ans, quatre-vingts gamins, zéro subvention. La mairie propose enfin de financer — à condition que l'association change de nom et que le maire figure sur toutes les affiches.",
    choices: [
      {
        id: "accepter_sub",
        label: "Accepter la subvention",
        detail: "Quatre-vingts gamins valent bien une affiche.",
        effects: (c) => {
          c.adj({ player: { strategie: 4, cynisme: 3 }, country: { services: 2 } });
          c.seg("quartiers", { soutien: 6 });
          c.flag("asso_financee");
          return "L'association double de taille en un an. Le maire coupe le ruban, sourit, repart. Vous gardez la structure, les clés, et les gamins — et vous notez que le nom sur l'affiche n'a jamais fait apprendre à lire personne.";
        },
      },
      {
        id: "refuser_sub",
        label: "Refuser",
        detail: "Le nom, c'est le seul capital des gens d'ici.",
        effects: (c) => {
          c.adj({ player: { integrite: 7, charisme: 4 } });
          c.seg("quartiers", { soutien: 9, participation: 4 });
          c.flag("asso_independante");
          return "L'association reste pauvre et libre. Le maire vous prend en grippe, ce qui vous coûtera six ans. Mais dans ce quartier, votre nom devient une garantie — et une garantie de quartier, ça ne s'achète avec aucun budget de communication.";
        },
      },
      {
        id: "candidater",
        label: "Se présenter contre lui",
        detail: "Puisqu'il faut un nom sur l'affiche, autant que ce soit le vôtre.",
        effects: (c) => {
          c.adj({ player: { charisme: 6, rhetorique: 4 }, power: { popularite: 3 } });
          c.seg("quartiers", { soutien: 7, participation: 6 });
          c.seg("jeunes", { participation: 5 });
          c.flag("candidat_precoce");
          return "Vous montez une liste avec des gens qui n'avaient jamais voté. Vous perdez de six cents voix. Le maire, lui, a compris qu'il avait affaire à quelqu'un : il vous proposera un poste dans les trois mois, ce qui est la forme la plus sincère du respect en politique.";
        },
      },
    ],
  },
  {
    id: "asc_deb_jeunesses",
    kind: "ascension",
    titre: "Le congrès des jeunes",
    texte:
      "Congrès des jeunes du parti, quatre cents délégués, une motion à défendre et sept minutes de tribune. C'est la première fois qu'on vous écoute dans une salle de cette taille. Vos notes sont sur le pupitre. Vous savez déjà que vous n'allez pas les lire.",
    choices: [
      {
        id: "discours_flamme",
        label: "Parler sans notes",
        detail: "Tout miser sur l'émotion.",
        effects: (c) => {
          c.adj({ player: { charisme: 8, rhetorique: 5 } });
          c.rel("delval", { rancune: 4 });
          c.flag("orateur_ne");
          return "Sept minutes, aucune note, une salle debout à la fin. Une vidéo de trente secondes tournera pendant des années. Au fond de la salle, un garçon de votre âge nommé Sacha Delval applaudit lentement en calculant déjà combien de temps il lui faudra pour faire mieux.";
        },
      },
      {
        id: "discours_dossier",
        label: "Défendre la motion ligne par ligne",
        detail: "Ennuyeux. Imparable.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, rhetorique: 3 }, power: { parti: 8 } });
          c.flag("technicien_motion");
          return "Sept minutes de fond, aucune envolée, et une motion adoptée à soixante-douze pour cent. Personne ne se souvient du discours ; tout le monde se souvient du vote. Les cadres du parti, eux, retiennent votre nom — ils cherchent en permanence des gens capables de faire gagner un texte.";
        },
      },
      {
        id: "attaquer_direction",
        label: "Attaquer la direction depuis la tribune",
        detail: "Se faire un nom en se faisant des ennemis.",
        effects: (c) => {
          c.adj({ player: { charisme: 5, cynisme: 4 }, power: { parti: -8, presse: 6 } });
          c.rel("espitalier", { rancune: 10 });
          c.flag("frondeur_precoce");
          return "Vous descendez la direction sortante en six phrases. La salle explose, la tribune se ferme, et le trésorier du parti note quelque chose dans un carnet qu'il n'ouvre que pour ça. Vous existez. Vous coûtez déjà cher.";
        },
      },
    ],
  },
  {
    id: "asc_deb_entreprise",
    kind: "ascension",
    titre: "Le vrai métier",
    rarete: "peu_commune",
    texte:
      "Avant la politique, huit ans de salariat ordinaire : réunions, objectifs, un chef médiocre, un plan de restructuration. On vous propose une promotion qui vous mettrait à l'abri pour vingt ans. La section locale, elle, cherche quelqu'un pour porter une candidature perdue d'avance.",
    choices: [
      {
        id: "prendre_poste",
        label: "Prendre la promotion",
        detail: "La politique attendra. Elle attend toujours.",
        effects: (c) => {
          c.adj({ player: { strategie: 5, endurance: 4 }, power: { patronat: 6 } });
          c.bord(1);
          c.flag("carriere_privee");
          return "Trois ans de management, un budget, quarante personnes. Vous entrerez en politique plus tard et plus solide, avec la seule chose que la classe politique française ne possède presque jamais : l'expérience d'avoir eu un patron et d'avoir dû licencier quelqu'un.";
        },
      },
      {
        id: "candidature_perdue",
        label: "Porter la candidature perdue",
        detail: "Onze pour cent. Et une place dans le paysage.",
        effects: (c) => {
          c.adj({ player: { charisme: 5, endurance: 5, reseau: 4 } });
          c.flag("bapteme_du_feu");
          return "Onze pour cent, six mois de porte-à-porte, un compte de campagne à l'euro près. Vous perdez comme prévu et vous gagnez ce que personne ne peut vous retirer : le fichier, les militants, et la réputation d'avoir accepté quand tout le monde refusait.";
        },
      },
      {
        id: "les_deux",
        label: "Faire les deux",
        detail: "Dormir cinq heures pendant six ans.",
        effects: (c) => {
          c.adj({ player: { endurance: 7, strategie: 3 }, hidden: { fatigue: 10, sante: -6 } });
          c.rel("conjoint", { rancune: 8 });
          c.flag("double_vie");
          return "Six ans de semaines de quatre-vingts heures. Vous montez plus vite que tout le monde et vous entrez dans la vie publique avec un corps déjà entamé et un couple qui a pris l'habitude de vous attendre. Les deux factures arriveront, l'une après l'autre.";
        },
      },
    ],
  },
  {
    id: "asc_deb_plateau",
    kind: "ascension",
    titre: "Le plateau",
    rarete: "rare",
    texte:
      "Un débat régional en direct, un invité qui se décommande, et vous à vingt-quatre ans dans le fauteuil libre. Face à vous : un député de trente ans d'expérience, condescendant dès la poignée de main. Vingt-deux minutes d'antenne.",
    choices: [
      {
        id: "respect",
        label: "Jouer le respect dû à l'aîné",
        detail: "Se montrer sérieux plutôt que brillant.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 4, strategie: 4 }, power: { parti: 6 } });
          c.flag("jeune_serieux");
          return "Vous ne marquez aucun point et vous n'en perdez aucun. Le lendemain, trois cadres du parti disent la même phrase : « il est prêt ». C'est exactement ce que vous vouliez qu'ils disent — le talent, en politique, est moins utile que la respectabilité.";
        },
      },
      {
        id: "humilier",
        label: "L'humilier en direct",
        detail: "Il vous a tendu la perche. Deux fois.",
        effects: (c) => {
          c.adj({ player: { charisme: 9, rhetorique: 7, cynisme: 4 }, power: { popularite: 6, parti: -6 } });
          c.flag("tueur_de_plateau");
          c.press("« Le gamin qui a fait taire un député » — la séquence tourne en boucle", "favorable");
          return "Dix-huit secondes qui feront le tour du pays. Le député ne s'en remettra pas ; le parti non plus ne vous le pardonnera pas tout à fait. Vous venez de choisir la carrière rapide — celle où l'on doit tout à l'opinion et rien à l'appareil.";
        },
      },
      {
        id: "sincerite",
        label: "Avouer que vous découvrez",
        detail: "« Je n'ai pas la réponse. Je vais me renseigner. »",
        effects: (c) => {
          c.adj({ player: { integrite: 8, charisme: 5 }, power: { presse: 6 } });
          c.seg("jeunes", { soutien: 6, participation: 4 });
          c.flag("sincerite_plateau");
          return "Une phrase qu'aucun professionnel ne prononce jamais. Le plateau se fige, l'animateur enchaîne, et le standard de la chaîne sature. Ce sera la marque de fabrique dont vous ne pourrez plus jamais vous départir : le jour où vous mentirez, tout le monde le verra.";
        },
      },
    ],
  },
  {
    id: "asc_deb_place",
    kind: "ascension",
    titre: "La place réservée",
    rarete: "rare",
    cond: (s) => !!s.flags["heritier"] || !!s.flags["dette_baron"] || !!s.flags["dette_industriel"],
    texte:
      "On ne vous a rien demandé. La circonscription est simplement là, offerte, arrangée entre deux dîners par des gens qui connaissent votre famille. Vous avez vingt-neuf ans et une élection déjà gagnée. Votre mentor vous glisse : « Ne fais pas cette tête. Tout le monde commence avec ce qu'il a. »",
    choices: [
      {
        id: "prendre_place",
        label: "Prendre la circonscription",
        detail: "Refuser un cadeau ne le rend pas à ceux qui n'en ont pas.",
        effects: (c) => {
          c.adj({ player: { reseau: 8, cynisme: 5 }, power: { parti: 8 } });
          c.seg("periurbain", { soutien: -4 });
          c.flag("place_offerte");
          return "Élu au premier tour avec cinquante-huit pour cent. Personne ne le dira jamais en face, mais tout le monde le sait, et on vous le ressortira à chaque difficulté pendant trente ans. Vous entrez au Parlement avec un mandat et une dette.";
        },
      },
      {
        id: "autre_circo",
        label: "Demander une circonscription imprenable",
        detail: "Se battre là où votre nom ne vaut rien.",
        effects: (c) => {
          c.adj({ player: { endurance: 7, charisme: 6, integrite: 5 }, power: { popularite: 5 } });
          c.seg("periurbain", { soutien: 6 });
          c.flag("circo_gagnee");
          return "Deux cent quarante réunions d'appartement dans un territoire qui déteste ce que vous représentez. Vous l'emportez de neuf cents voix. C'est le titre de propriété le plus solide de la vie politique : une victoire que personne ne peut vous attribuer.";
        },
      },
      {
        id: "refuser_place",
        label: "Refuser et partir",
        detail: "Ne rien devoir. Y compris à sa propre famille.",
        effects: (c) => {
          c.adj({ player: { integrite: 10 }, power: { parti: -10 } });
          c.rel("espitalier", { rancune: 8 });
          c.flag("refus_fondateur");
          c.log("Vous avez refusé une circonscription offerte. Personne n'a compris.");
          return "Vous partez, sans un mot, et vous mettez huit ans de plus à revenir. Le milieu vous classe parmi les orgueilleux, ce qui est à peu près exact. Mais quand on vous accusera de tout, plus tard, cette histoire-là sera votre seule défense — et elle tiendra.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 2 — LE PREMIER MANDAT. Une écharpe, un budget, des arbitrages.
  // =========================================================================
  {
    id: "asc_mairie",
    kind: "ascension",
    titre: "La mairie",
    texte:
      "Vous avez trente-deux ans et une écharpe tricolore. La ville n'est pas grande, mais elle est à vous. Premier dossier sur le bureau : le gymnase municipal menace ruine, et le budget ne permet de financer qu'une seule chose cette année.",
    choices: [
      {
        id: "gymnase",
        label: "Rénover le gymnase",
        detail: "Ce que les gens voient. Ce dont ils parlent au marché.",
        effects: (c) => {
          c.adj({ player: { charisme: 3 } });
          c.flag("maire_proximite");
          return "Le gymnase rouvre en fanfare, quatre cents mains serrées. « Au moins, il fait des choses. » Vous venez d'apprendre comment se fabrique une réputation.";
        },
      },
      {
        id: "zone",
        label: "Financer la zone d'activité",
        detail: "Invisible pendant deux ans. Des emplois ensuite.",
        effects: (c) => {
          c.adj({ player: { strategie: 3 } });
          c.flag("maire_gestionnaire");
          return "Deux ans de terrassement et de sarcasmes. Puis trois entreprises, quatre-vingts emplois. La leçon la plus dure du métier : le temps politique et le temps réel ne battent pas à la même vitesse.";
        },
      },
      {
        id: "subvention",
        label: "Appeler le mentor",
        detail: "Il connaît quelqu'un au conseil régional. Tout s'arrange. Tout se paie.",
        effects: (c) => {
          c.adj({ player: { reseau: 4, cynisme: 3 } });
          c.flag("dette_ascension");
          return "Un coup de fil, un déjeuner, une subvention exceptionnelle. Le gymnase ET la zone d'activité. Votre mentor ne demande rien. C'est précisément ce qui devrait vous inquiéter.";
        },
      },
    ],
  },
  {
    id: "asc_loc_ecole",
    kind: "ascension",
    titre: "La classe qui ferme",
    texte:
      "L'académie ferme la dernière classe de l'école du village : onze élèves, seuil non atteint. Les parents occupent le bâtiment depuis six jours. Le préfet vous demande de « faire preuve de pédagogie ». Le mot est mal choisi.",
    choices: [
      {
        id: "occuper_avec",
        label: "Dormir dans l'école avec les parents",
        detail: "Choisir son camp, publiquement, contre l'État.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ player: { charisme: 6, endurance: 4 }, country: { services: 2 } });
          c.seg("ruraux", { soutien: 9, participation: 5 });
          c.flag("maire_rebelle");
          return "Quatre nuits sur un tapis de gym, une photo dans la presse nationale, et une classe maintenue deux ans de plus. Le préfet ne vous le pardonnera pas. Les onze familles, elles, voteront pour vous jusqu'à la fin de votre vie.";
        },
      },
      {
        id: "negocier_ecole",
        label: "Négocier un regroupement intercommunal",
        detail: "Un car scolaire, une école neuve à douze kilomètres.",
        effects: (c) => {
          c.adj({ player: { strategie: 7 }, country: { services: 3 } });
          c.seg("ruraux", { soutien: 3 });
          c.flag("maire_gestionnaire");
          return "Six mois de réunions avec quatre communes qui se détestent depuis 1892. L'école neuve ouvrira, meilleure que l'ancienne, et les enfants passeront quarante minutes par jour dans un car. C'est la bonne solution, et elle ne rend personne heureux.";
        },
      },
      {
        id: "assumer_fermeture",
        label: "Assumer la fermeture devant les parents",
        detail: "Onze élèves. Le calcul est le calcul.",
        effects: (c) => {
          c.bord(1);
          c.adj({ player: { integrite: 5, strategie: 4 }, power: { popularite: -3 } });
          c.seg("ruraux", { soutien: -5 });
          c.flag("maire_comptable");
          return "Vous vous présentez seul dans le préau, sans le préfet, et vous expliquez pendant une heure une décision que vous n'avez pas prise et que vous ne combattrez pas. On vous siffle. Vous venez de découvrir le prix exact du courage administratif : environ trois cents voix.";
        },
      },
    ],
  },
  {
    id: "asc_loc_usine",
    kind: "ascension",
    titre: "Le dernier employeur",
    texte:
      "L'usine qui fait vivre un tiers de votre commune annonce sa fermeture : cent quatre-vingts emplois. Le groupe propose de rester si la commune finance la mise aux normes — deux millions, soit quatre ans d'investissement municipal.",
    choices: [
      {
        id: "payer_usine",
        label: "Payer les deux millions",
        detail: "Tout le budget, sur un seul chantage.",
        effects: (c) => {
          c.adj({ player: { strategie: -2, endurance: 4 }, country: { marge: -2 } });
          c.seg("periurbain", { soutien: 8 });
          c.flag("usine_sauvee");
          return "Les emplois restent. Quatre ans plus tard, le groupe part quand même, deux millions plus riche. Vous aurez gagné quatre ans, une réélection, et une leçon définitive sur la valeur d'une promesse d'actionnaire.";
        },
      },
      {
        id: "refuser_chantage",
        label: "Refuser le chantage",
        detail: "Et affronter cent quatre-vingts familles.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ player: { integrite: 7, endurance: 5 }, power: { patronat: -6, syndicats: 6 } });
          c.seg("periurbain", { soutien: -4 });
          c.flag("refus_chantage");
          return "« Je ne paierai pas une entreprise pour qu'elle daigne rester. » La phrase fait le tour des salles de rédaction. L'usine ferme, vous êtes réélu de justesse, et vous devenez pour dix ans la référence de tous les maires soumis au même chantage.";
        },
      },
      {
        id: "reprise_salaries",
        label: "Monter une reprise par les salariés",
        detail: "Improbable, long, et déjà tenté ailleurs.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { strategie: 5, charisme: 5 }, power: { syndicats: 10, patronat: -5 } });
          c.seg("periurbain", { soutien: 6 });
          c.seg("public", { soutien: 4 });
          c.flag("scop_montee");
          c.log("Vous avez fait reprendre une usine par ses salariés — l'affaire a marqué votre région.");
          return "Dix-huit mois de montage, une banque coopérative, quatre-vingt-dix salariés actionnaires. La coopérative existe toujours. C'est peu à l'échelle du pays, et c'est la seule chose de votre carrière que vous raconterez sans jamais forcer le trait.";
        },
      },
    ],
  },
  {
    id: "asc_loc_video",
    kind: "ascension",
    titre: "Les caméras",
    texte:
      "Deux cambriolages par semaine dans le centre, une pétition de commerçants, et un devis : quarante caméras pour six cent mille euros. Le conseil municipal est partagé, la presse locale attend, et votre adjoint à la sécurité a déjà commandé les panneaux.",
    choices: [
      {
        id: "installer_cameras",
        label: "Installer les quarante caméras",
        detail: "Ce que les gens demandent. Efficacité discutée.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { securite: 3 }, player: { strategie: 2 } });
          c.seg("independants", { soutien: 8 });
          c.seg("pavillonnaires", { soutien: 6 });
          c.seg("jeunes", { soutien: -4 });
          c.flag("maire_securitaire");
          return "Les caméras sont posées en quatre mois. Les cambriolages baissent de douze pour cent — et de vingt pour cent dans la commune d'à côté, qui n'a rien installé. Personne ne relèvera jamais ce détail, et vous serez réélu sur ce bilan.";
        },
      },
      {
        id: "police_proximite",
        label: "Recruter six policiers municipaux à pied",
        detail: "Plus cher, plus lent, plus utile.",
        effects: (c) => {
          c.adj({ country: { securite: 4, cohesion: 3 }, player: { strategie: 5 } });
          c.seg("independants", { soutien: 4 });
          c.seg("quartiers", { soutien: 5 });
          c.flag("maire_proximite");
          return "Six agents qui connaissent les prénoms, les horaires, les familles compliquées. Les chiffres baissent lentement et durablement. Les commerçants réclament quand même des caméras — on ne photographie pas un policier qui n'a pas eu besoin d'intervenir.";
        },
      },
      {
        id: "refuser_cameras",
        label: "Refuser tout dispositif",
        detail: "Assumer que la sécurité n'est pas une compétence municipale.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ player: { integrite: 4 }, power: { popularite: -4 } });
          c.seg("independants", { soutien: -7 });
          c.seg("urbains", { soutien: 5 });
          c.flag("refus_video");
          return "Vous expliquez en conseil que l'État a des gendarmes et que la commune a des écoles. C'est juridiquement irréprochable et politiquement suicidaire : les commerçants monteront une liste contre vous, et elle fera onze pour cent de trop.";
        },
      },
    ],
  },
  {
    id: "asc_loc_cantine",
    kind: "ascension",
    titre: "La cantine",
    rarete: "peu_commune",
    texte:
      "Une association de parents demande un menu de substitution à la cantine ; une autre association exige qu'on n'en fasse rien. Deux cents lettres, trois plateaux télé, et un sujet qui n'a jamais concerné plus de quarante repas par jour.",
    choices: [
      {
        id: "menu_substitution",
        label: "Instaurer le menu de substitution",
        detail: "Un plat sans viande, tous les jours, pour tout le monde.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { cohesion: 3 }, player: { strategie: 3 } });
          c.seg("quartiers", { soutien: 7 });
          c.seg("urbains", { soutien: 4 });
          c.seg("ruraux", { soutien: -4 });
          c.flag("cantine_substitution");
          return "Un plat végétarien quotidien, ouvert à tous, sans mention d'aucune religion. La solution est élégante, elle règle le problème, et elle ne calme personne : la controverse ne portait pas sur les repas.";
        },
      },
      {
        id: "menu_unique",
        label: "Menu unique pour tous",
        detail: "La République ne fait pas de cas particuliers.",
        effects: (c) => {
          c.bord(2);
          c.adj({ player: { rhetorique: 4 }, country: { cohesion: -3 } });
          c.seg("pavillonnaires", { soutien: 7 });
          c.seg("ruraux", { soutien: 5 });
          c.seg("quartiers", { soutien: -8 });
          c.flag("cantine_unique");
          return "« Un seul menu, une seule République. » La formule est bonne, elle vous vaut deux passages en plateau national et une notoriété instantanée. Quarante familles retirent leurs enfants de la cantine. Vous ne les recompterez jamais.";
        },
      },
      {
        id: "cantine_esquive",
        label: "Confier la décision au conseil d'école",
        detail: "Faire porter le sujet par ceux qui vivent avec.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, cynisme: 3 } });
          c.flag("cantine_deleguee");
          return "Le conseil d'école tranche en trois semaines, sans caméra, par un compromis que personne n'aurait accepté venant de vous. Vous avez appris la manœuvre la plus sous-estimée du métier : rendre une décision à ceux qui en supportent les conséquences.";
        },
      },
    ],
  },
  {
    id: "asc_loc_sru",
    kind: "ascension",
    titre: "Les vingt-cinq pour cent",
    texte:
      "Votre commune est à onze pour cent de logements sociaux, la loi en exige vingt-cinq. L'amende annuelle est de quatre cent mille euros — deux fois moins cher que de construire. Vos administrés vous ont élu, entre autres, pour que rien ne change.",
    choices: [
      {
        id: "construire_sru",
        label: "Lancer les constructions",
        detail: "Trois cents logements. Et une élection compromise.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { integrite: 7 }, country: { services: 3, cohesion: 4 } });
          c.seg("quartiers", { soutien: 8 });
          c.seg("jeunes", { soutien: 5 });
          c.seg("pavillonnaires", { soutien: -9 });
          c.flag("maire_sru");
          return "Trois cents logements, deux réunions publiques houleuses, une pétition de mille signatures. Vous êtes réélu à cent quatre-vingts voix. Les logements sont sortis de terre et ils portent une plaque à votre nom, ce qui, dans ce dossier-là, relève presque de la provocation.";
        },
      },
      {
        id: "payer_amende",
        label: "Payer l'amende chaque année",
        detail: "C'est légal. C'est même prévu.",
        effects: (c) => {
          c.bord(2);
          c.adj({ player: { cynisme: 6, strategie: 3 } });
          c.seg("pavillonnaires", { soutien: 8 });
          c.seg("quartiers", { soutien: -6 });
          c.flag("amende_sru");
          return "Le budget absorbe l'amende sans broncher, année après année. Vos électeurs comprennent parfaitement, et vous êtes réélu confortablement. Un adversaire ressortira le chiffre cumulé un jour de campagne nationale : deux millions huit cent mille euros pour ne pas loger de pauvres.";
        },
      },
      {
        id: "contourner_sru",
        label: "Négocier une dérogation préfectorale",
        detail: "Ni construire ni payer. Manœuvrer.",
        effects: (c) => {
          c.adj({ player: { strategie: 8, reseau: 5, cynisme: 3 } });
          c.flag("derogation_sru");
          return "Trois déjeuners, un dossier sur les contraintes de zonage, et une dérogation de six ans. Personne n'a construit, personne n'a payé, personne n'a menti. C'est la première fois que vous mesurez à quel point l'État se négocie — et à quel point vous êtes doué pour ça.";
        },
      },
    ],
  },
  {
    id: "asc_loc_crue",
    kind: "ascension",
    titre: "La crue",
    rarete: "rare",
    texte:
      "Quatre-vingts millimètres en trois heures. À vingt-trois heures, la rivière passe au-dessus des quais, deux quartiers sont sous un mètre d'eau et les secours annoncent quarante minutes de délai. Vous êtes maire depuis onze mois.",
    choices: [
      {
        id: "terrain_crue",
        label: "Y aller vous-même, en bottes, toute la nuit",
        detail: "Sans casque, sans conseiller, sans photographe.",
        effects: (c) => {
          c.adj({ player: { charisme: 9, endurance: 7 }, power: { popularite: 8 }, hidden: { fatigue: 8 } });
          c.seg("periurbain", { soutien: 8 });
          c.seg("retraites", { soutien: 6 });
          c.flag("nuit_de_la_crue");
          c.log("La nuit de la crue a fondé votre légitimité locale — on en parle encore.");
          return "Quatorze heures dans l'eau, deux personnes âgées portées hors de leur maison, aucune victime. Une photo prise par un habitant fera le tour du pays. Vous ne l'avez pas cherchée, et c'est exactement pour ça qu'elle vaut trente ans de communication.";
        },
      },
      {
        id: "cellule_crue",
        label: "Tenir la cellule de crise",
        detail: "Coordonner. C'est moins beau et c'est le métier.",
        effects: (c) => {
          c.adj({ player: { strategie: 8, endurance: 4 }, country: { securite: 3 } });
          c.seg("periurbain", { soutien: 4 });
          c.flag("gestionnaire_crise");
          return "Vous restez douze heures devant une carte, à répartir des moyens que vous n'avez pas. Bilan : aucun mort, deux blessés légers, une gestion citée en exemple par la préfecture. Personne ne vous verra jamais dans l'eau, et personne ne saura que c'est vous qui avez tout tenu.";
        },
      },
      {
        id: "accuser_etat",
        label: "Mettre l'État en cause dès le lendemain",
        detail: "Les digues relevaient de lui. Depuis douze ans.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ player: { rhetorique: 7, cynisme: 4 }, power: { presse: 8, popularite: 5 } });
          c.seg("periurbain", { soutien: 7 });
          c.flag("proces_etat");
          return "Conférence de presse à sept heures, dossier des digues sous le bras, dates et courriers à l'appui. C'est fondé, c'est spectaculaire, et c'est un peu obscène le lendemain d'une catastrophe. Vous devenez une figure nationale en quarante-huit heures.";
        },
      },
    ],
  },
  {
    id: "asc_loc_aire",
    kind: "ascension",
    titre: "L'aire d'accueil",
    rarete: "peu_commune",
    texte:
      "La loi vous impose une aire d'accueil pour les gens du voyage. Deux cents riverains ont signé une pétition contre l'emplacement retenu, un conseiller municipal a démissionné, et un tract anonyme circule avec votre photo et le mot « traître ».",
    choices: [
      {
        id: "aire_construite",
        label: "Construire l'aire comme prévu",
        detail: "La loi, l'emplacement, le calendrier. Sans reculer.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ player: { integrite: 7, endurance: 4 }, country: { cohesion: 3 } });
          c.seg("pavillonnaires", { soutien: -7 });
          c.seg("urbains", { soutien: 5 });
          c.flag("aire_construite");
          return "L'aire ouvre avec neuf mois de retard et trois recours perdus par les riverains. Deux ans plus tard, plus personne n'en parle — c'est le sort ordinaire de ces dossiers, et personne ne vous en tiendra jamais compte au moment du vote.";
        },
      },
      {
        id: "aire_deplacee",
        label: "Déplacer le projet à la limite de la commune",
        detail: "Aussi loin que la loi le permet.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, cynisme: 4 } });
          c.seg("pavillonnaires", { soutien: 3 });
          c.flag("aire_deplacee");
          return "Le nouveau terrain est légal, desservi par une route à sens unique, et à quatre kilomètres de la première boulangerie. Tout le monde s'en satisfait. C'est la première fois que vous signez quelque chose dont vous savez que c'est lâche et défendable à la fois.";
        },
      },
      {
        id: "aire_refus",
        label: "Refuser et payer les pénalités",
        detail: "Contre l'État, avec vos riverains.",
        effects: (c) => {
          c.bord(3);
          c.adj({ player: { charisme: 5, integrite: -4 }, power: { popularite: 5 }, country: { cohesion: -5 } });
          c.seg("pavillonnaires", { soutien: 9 });
          c.seg("ruraux", { soutien: 5 });
          c.seg("quartiers", { soutien: -6 });
          c.flag("maire_insoumis_loi");
          return "Vous annoncez en conseil que la commune n'appliquera pas la loi. Le préfet engage une procédure, la presse nationale débarque, et vous devenez en une semaine le porte-drapeau de deux cents maires qui pensaient la même chose sans oser le dire.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 3 — LA TENTATION. Ce qui ressortira un jour, ou pas.
  // =========================================================================
  {
    id: "asc_zone",
    kind: "ascension",
    titre: "L'entrepreneur",
    texte:
      "Un entrepreneur de travaux publics vous invite à dîner. Au dessert, il évoque « une participation aux frais de votre prochaine campagne » si l'appel d'offres était « bien rédigé ». Il sourit. Le café arrive.",
    choices: [
      {
        id: "refus",
        label: "Refuser net",
        detail: "Et payer l'addition vous-même.",
        effects: (c) => {
          c.adj({ player: { integrite: 5 } });
          c.rel("espitalier", { loyaute: -5 });
          return "Vous posez trente euros sur la table et partez avant le café. L'entrepreneur ne vous en voudra même pas — il en trouvera un autre. Mais dans le petit monde du BTP local, on retiendra que vous n'êtes « pas arrangeant ».";
        },
      },
      {
        id: "flou",
        label: "Rester vague",
        detail: "Ne rien promettre. Ne rien refuser.",
        effects: (c) => {
          c.adj({ player: { cynisme: 3, strategie: 2 } });
          c.flag("zone_flou");
          return "Vous souriez, vous parlez d'autre chose. L'appel d'offres suivra la procédure — à peu près. Rien signé, rien promis, rien refusé : exactement le genre de zone grise que les juges d'instruction adorent éclairer, des années plus tard.";
        },
      },
      {
        id: "accepte",
        label: "Accepter",
        detail: "Une campagne, ça coûte cher. Tout le monde le fait.",
        effects: (c) => {
          c.adj({ player: { integrite: -8, cynisme: 5, reseau: 3 } });
          c.flag("pot_de_vin_ascension");
          return "L'enveloppe transite par une association dont vous préférez ignorer les statuts. Quelque part, dans un carnet que vous ne verrez jamais, une ligne vient de s'écrire à votre nom.";
        },
      },
    ],
  },
  {
    id: "asc_ten_emploi",
    kind: "ascension",
    titre: "L'attachée parlementaire",
    texte:
      "Votre conjoint(e) a quitté son emploi pour suivre votre carrière. L'enveloppe parlementaire permet légalement de l'embaucher comme collaborateur. Tout le monde le fait, c'est déclaré, c'est publié, et personne n'y voit rien à redire — pour l'instant.",
    choices: [
      {
        id: "embaucher_conjoint",
        label: "L'embaucher",
        detail: "Légal aujourd'hui. Jugé demain.",
        effects: (c) => {
          c.adj({ player: { integrite: -6, cynisme: 3 } });
          c.rel("conjoint", { loyaute: 10 });
          c.flag("emploi_familial");
          c.sched("carnets_1", 8, 18, 0.3);
          return "Le contrat est déclaré, le travail est réel, la rémunération est dans la moyenne. Rien de tout cela ne comptera le jour où la loi changera et où un journaliste ressortira les fiches de paie : le mot « emploi familial » ne s'accompagne d'aucun adjectif.";
        },
      },
      {
        id: "refuser_emploi",
        label: "Refuser",
        detail: "Et laisser votre couple encaisser.",
        effects: (c) => {
          c.adj({ player: { integrite: 7 } });
          c.rel("conjoint", { rancune: 8, loyaute: -5 });
          c.flag("refus_emploi_familial");
          return "Vous embauchez une inconnue compétente. À la maison, la conversation dure trois mois et se termine mal. Vous avez fait le bon choix pour votre carrière et le mauvais pour votre couple, et vous ne saurez jamais si le calcul en valait la peine.";
        },
      },
      {
        id: "temps_partiel",
        label: "Un mi-temps, déclaré, encadré",
        detail: "La demi-mesure. Elle protège à moitié.",
        effects: (c) => {
          c.adj({ player: { strategie: 4, integrite: -2 } });
          c.rel("conjoint", { loyaute: 4 });
          c.flag("emploi_familial_partiel");
          return "Un mi-temps, un vrai bureau, des relevés d'activité archivés au cas où. Vous avez pris la précaution que quatre-vingt-dix pour cent de vos collègues n'ont pas prise. Elle ne vous sauvera pas du soupçon — les précautions ne sauvent jamais du soupçon, elles sauvent du tribunal.";
        },
      },
    ],
  },
  {
    id: "asc_ten_logement",
    kind: "ascension",
    titre: "L'appartement",
    rarete: "peu_commune",
    texte:
      "L'office HLM de l'agglomération, que vous présidez, dispose d'un T4 dans un immeuble récent. Votre fils vient d'être muté dans la ville et cherche depuis quatre mois. Le directeur de l'office vous dit, sans qu'on lui demande rien : « C'est faisable. »",
    choices: [
      {
        id: "refuser_hlm",
        label: "Refuser catégoriquement",
        detail: "Et le dire au directeur devant témoin.",
        effects: (c) => {
          c.adj({ player: { integrite: 8 } });
          c.flag("refus_hlm");
          return "Vous le refusez en réunion, à voix haute, avec quatre personnes dans la pièce — parce que c'est là que ça compte. Votre fils trouvera un studio hors de prix. Le directeur, lui, comprendra que vous n'êtes pas de ceux dont on peut se rendre indispensable.";
        },
      },
      {
        id: "accepter_hlm",
        label: "Accepter discrètement",
        detail: "Il est dans les plafonds. C'est légal. Presque.",
        effects: (c) => {
          c.adj({ player: { integrite: -9, cynisme: 4 } });
          c.flag("hlm_famille");
          c.sched("carnets_1", 6, 16, 0.35);
          return "Le dossier passe en commission comme les autres, ou presque. Trois cents familles étaient devant. Vous n'y penserez plus pendant huit ans, jusqu'au jour où une élue d'opposition demandera la liste des attributions de cette année-là.";
        },
      },
      {
        id: "demission_office",
        label: "Démissionner de la présidence de l'office",
        detail: "Retirer la tentation plutôt que d'y résister.",
        effects: (c) => {
          c.adj({ player: { integrite: 6, strategie: 5 }, power: { parti: -3 } });
          c.flag("retrait_office");
          return "Vous quittez la présidence en trois lignes, sans expliquer pourquoi. Votre fils dépose un dossier ordinaire et attend quatorze mois comme tout le monde. C'est la seule méthode qui fonctionne vraiment contre les conflits d'intérêts, et c'est pour ça que presque personne ne l'emploie.";
        },
      },
    ],
  },
  {
    id: "asc_ten_sondage",
    kind: "ascension",
    titre: "Le sondage municipal",
    texte:
      "Votre directeur de cabinet propose de commander, sur budget communal, une « étude d'opinion sur les attentes des habitants ». Les deux tiers des questions portent en réalité sur votre image personnelle et sur vos adversaires. Coût : trente-deux mille euros d'argent public.",
    choices: [
      {
        id: "commander_sondage",
        label: "Commander l'étude",
        detail: "Tout le monde fait ça. Presque tout le monde.",
        effects: (c) => {
          c.adj({ player: { strategie: 5, cynisme: 5, integrite: -5 } });
          c.flag("sondage_public");
          return "L'étude est remise en six semaines, elle est excellente, et elle vous fait gagner deux ans d'avance sur vos adversaires. Elle figurera aussi, ligne 6217, dans un rapport de chambre régionale des comptes que quelqu'un lira un jour.";
        },
      },
      {
        id: "payer_soi",
        label: "La payer sur les fonds du parti",
        detail: "Même sondage, autre caisse.",
        effects: (c) => {
          c.adj({ player: { strategie: 5, reseau: 3 }, power: { parti: -4 } });
          c.rel("espitalier", { loyaute: 6 });
          c.flag("sondage_parti");
          return "Espitalier râle, sort les trente-deux mille euros, et vous les fait payer autrement — en loyauté. C'était la bonne décision juridique et la mauvaise décision d'indépendance : à partir de ce jour, le trésorier sait que vous avez besoin de lui.";
        },
      },
      {
        id: "refuser_sondage",
        label: "Refuser et faire du porte-à-porte",
        detail: "Trois cents portes valent un sondage. Elles prennent quatre mois.",
        effects: (c) => {
          c.adj({ player: { integrite: 6, endurance: 5, charisme: 4 }, hidden: { fatigue: 6 } });
          c.seg("pavillonnaires", { soutien: 5 });
          c.flag("porte_a_porte");
          return "Quatre mois, trois cents portes, un carnet à spirale. Vous obtenez à peu près les mêmes informations qu'un institut, avec six mois de retard et une précision inférieure. Vous obtenez aussi trois cents personnes qui vous ont vu chez elles, et ça, aucun institut ne le vend.";
        },
      },
    ],
  },
  {
    id: "asc_ten_journaliste",
    kind: "ascension",
    titre: "Le correspondant local",
    rarete: "peu_commune",
    texte:
      "Le correspondant du quotidien régional prépare un article sur la gestion de votre communauté de communes. Il est méticuleux, il a raison sur deux points sur trois, et il est aussi pigiste — le journal lui paie soixante euros l'article. Votre adjoint suggère de « lui trouver une prestation de communication ».",
    choices: [
      {
        id: "acheter_journaliste",
        label: "Lui proposer la prestation",
        detail: "Douze mille euros. Il ne dira pas non.",
        effects: (c) => {
          c.adj({ player: { integrite: -8, cynisme: 6 }, power: { presse: 5 } });
          c.flag("presse_achetee");
          c.sched("carnets_1", 8, 20, 0.3);
          return "Il accepte, l'article ne paraît jamais, et il écrira sur vous pendant six ans avec une bienveillance qui finira par se remarquer. Vous n'avez pas acheté un silence : vous avez acheté un homme, et les hommes se retournent.";
        },
      },
      {
        id: "repondre_journaliste",
        label: "Lui ouvrir tous les dossiers",
        detail: "Y compris celui où il a raison.",
        effects: (c) => {
          c.adj({ player: { integrite: 7, rhetorique: 3 }, power: { presse: 8 } });
          c.rel("ferrand", { loyaute: 5 });
          c.flag("transparence_locale");
          return "Trois heures d'entretien, les délibérations, les marchés, tout. L'article sort, sévère sur un point, précis sur le reste. Il vous coûte une semaine désagréable et vous rapporte quelque chose de rare : un journaliste qui, désormais, vérifiera avant de vous taper dessus.";
        },
      },
      {
        id: "menacer_journal",
        label: "Appeler la direction du journal",
        detail: "La mairie est un gros annonceur.",
        effects: (c) => {
          c.adj({ player: { cynisme: 7, integrite: -6 }, power: { presse: -8 } });
          c.rel("ferrand", { rancune: 12 });
          c.flag("pression_presse");
          return "L'article est raccourci de moitié. Le correspondant comprend pourquoi, le dit à ses confrères, et votre nom entre dans une catégorie dont on ne sort pas : celle des élus qui appellent la direction. Ils sont peu nombreux à savoir ce que ça coûte, à terme.";
        },
      },
    ],
  },
  {
    id: "asc_ten_audit",
    kind: "ascension",
    titre: "Le rapport à charge",
    rarete: "rare",
    texte:
      "La chambre régionale des comptes publie un rapport sévère sur la gestion de votre prédécesseur — et vous y êtes cité, à tort, dans deux paragraphes rédigés à la va-vite. La presse locale a titré sur votre nom. Le rapport définitif peut encore être amendé.",
    choices: [
      {
        id: "corriger_officiel",
        label: "Répondre point par point, publiquement",
        detail: "Trente pages, quatre semaines, aucun raccourci.",
        effects: (c) => {
          c.adj({ player: { integrite: 8, strategie: 5, endurance: 4 }, hidden: { fatigue: 6 } });
          c.flag("blanchi_publiquement");
          return "Trente pages de réponse annexées au rapport définitif, qui retire les deux paragraphes. Personne ne titrera sur le rectificatif. Mais le document existe, il est public, et il vous sauvera exactement une fois — le jour où quelqu'un ressortira l'accusation initiale en pleine campagne.";
        },
      },
      {
        id: "etouffer_rapport",
        label: "Faire jouer vos relations",
        detail: "Un magistrat de la chambre a été votre condisciple.",
        effects: (c) => {
          c.adj({ player: { reseau: 6, cynisme: 6, integrite: -6 } });
          c.flag("rapport_etouffe");
          c.sched("carnets_1", 10, 20, 0.25);
          return "Les deux paragraphes disparaissent sans réponse écrite de votre part. C'est plus rapide, plus propre, et parfaitement invisible — sauf pour les trois personnes qui savent. Trois personnes, c'est déjà deux de trop.";
        },
      },
      {
        id: "attaquer_prede",
        label: "Charger votre prédécesseur",
        detail: "Il est mort politiquement. Autant s'en servir.",
        effects: (c) => {
          c.adj({ player: { cynisme: 7, rhetorique: 5 }, power: { popularite: 5, parti: -5 } });
          c.flag("charge_predecesseur");
          return "Conférence de presse, chiffres accablants, distinction nette entre l'ancien monde et le vôtre. Ça fonctionne parfaitement. Son fils vous croisera dans dix ans, dans un couloir de l'Assemblée, et vous vous souviendrez de ce jour avec un inconfort que rien n'aura effacé.";
        },
      },
    ],
  },
  {
    id: "asc_ten_legs",
    kind: "ascension",
    titre: "Le legs",
    rarete: "rare",
    texte:
      "Une administrée de quatre-vingt-onze ans, sans héritier, que vous visitiez deux fois par an depuis dix ans, vous a couché sur son testament : une maison, quatre cent mille euros. Le notaire vous prévient que c'est légal, que la famille éloignée contestera, et que la presse adorerait ça.",
    choices: [
      {
        id: "renoncer_legs",
        label: "Renoncer au legs",
        detail: "Quatre cent mille euros. Et pas une hésitation.",
        effects: (c) => {
          c.adj({ player: { integrite: 10 } });
          c.flag("legs_refuse");
          c.log("Vous avez renoncé à un héritage de quatre cent mille euros d'une administrée.");
          return "Vous renoncez devant notaire, sans communiqué. L'histoire sortira quand même, six ans plus tard, racontée par le notaire lui-même à un journaliste — et elle vaudra plus que n'importe quelle campagne de communication, précisément parce que vous ne l'aviez pas racontée.";
        },
      },
      {
        id: "accepter_legs",
        label: "Accepter",
        detail: "C'était sa volonté. Elle était lucide.",
        effects: (c) => {
          c.adj({ player: { integrite: -7, cynisme: 4 } });
          c.flag("legs_accepte");
          c.sched("carnets_1", 6, 16, 0.4);
          return "Le legs est validé après dix-huit mois de procédure contre un cousin de Perpignan. Vous avez une maison, un compte confortable, et une phrase que vous devrez prononcer un jour devant une caméra : « Cette dame était mon amie. » Elle sera vraie et elle sonnera faux.";
        },
      },
      {
        id: "legs_association",
        label: "Accepter et le donner à une fondation locale",
        detail: "Respecter sa volonté sans en profiter.",
        effects: (c) => {
          c.adj({ player: { integrite: 7, strategie: 5 }, country: { services: 2 } });
          c.seg("retraites", { soutien: 6 });
          c.flag("legs_reverse");
          return "Vous acceptez, puis vous versez l'intégralité à une fondation d'aide aux personnes isolées qui porte désormais son nom. C'est irréprochable, c'est utile, et c'est aussi remarquablement bien joué — ce qui n'enlève rien, mais ne s'oublie pas non plus.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 4 — CE QUI VOUS DÉFINIT. Le vote dont on vous parlera toute votre vie.
  // =========================================================================
  {
    id: "asc_lig_licenciements",
    kind: "ascension",
    titre: "Le vote sur les licenciements",
    texte:
      "Députée depuis deux ans, vous devez voter une loi qui assouplit les licenciements économiques. Votre groupe est divisé, le gouvernement compte les voix, et un journaliste attend votre réponse dans le couloir. C'est le premier vote dont on vous reparlera pendant vingt ans.",
    choices: [
      {
        id: "contre_loi",
        label: "Voter contre, avec les frondeurs",
        detail: "Rompre la discipline. Exister à gauche.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { integrite: 6, charisme: 4 }, power: { syndicats: 10, patronat: -8, parti: -8 } });
          c.seg("public", { soutien: 6 });
          c.seg("periurbain", { soutien: 5 });
          c.flag("vote_frondeur");
          return "Vingt-trois voix contre, la vôtre dedans. Le groupe vous met en quarantaine six mois, les syndicats vous adoptent définitivement, et vous devenez identifiable — ce qui, dans une assemblée de cinq cent soixante-dix-sept personnes, est le seul enjeu réel.";
        },
      },
      {
        id: "pour_loi",
        label: "Voter pour, par réalisme économique",
        detail: "Assumer devant les siens.",
        effects: (c) => {
          c.bord(2);
          c.adj({ player: { strategie: 5 }, power: { patronat: 10, syndicats: -8, parti: 6 } });
          c.seg("csp", { soutien: 6 });
          c.seg("independants", { soutien: 5 });
          c.flag("vote_reformateur");
          return "Vous votez pour et vous l'expliquez, ce qui est plus rare que le vote lui-même. Le patronat vous repère, la gauche du parti vous classe, et vous héritez d'une étiquette dont vous ne vous débarrasserez plus : « sérieux ».";
        },
      },
      {
        id: "abstention_loi",
        label: "S'abstenir",
        detail: "Ne fâcher personne. N'exister pour personne.",
        effects: (c) => {
          c.adj({ player: { cynisme: 5, strategie: 3 }, power: { parti: 3 } });
          c.flag("vote_abstention");
          return "Abstention, avec une explication de vote de quatre lignes que personne ne lira. Vous ne perdez rien ce jour-là. Vous ne gagnez rien non plus, et en politique les deux se ressemblent moins qu'on ne croit : au bout de dix abstentions, on ne sait plus qui vous êtes.";
        },
      },
    ],
  },
  {
    id: "asc_lig_faitdivers",
    kind: "ascension",
    titre: "Le fait divers",
    texte:
      "Un adolescent de dix-sept ans, déjà connu des services, a tué un retraité pour un téléphone à quatre cents mètres de votre permanence. Trois chaînes d'info vous attendent devant. Ce que vous direz dans les quatre prochaines minutes vous suivra.",
    choices: [
      {
        id: "fermete_fd",
        label: "Exiger la fin de l'excuse de minorité",
        detail: "Nommer le coupable, pas les circonstances.",
        effects: (c) => {
          c.bord(3);
          c.adj({ player: { rhetorique: 6 }, country: { securite: 3 }, power: { popularite: 6 } });
          c.seg("retraites", { soutien: 8 });
          c.seg("pavillonnaires", { soutien: 7 });
          c.seg("quartiers", { soutien: -8 });
          c.flag("ligne_fermete");
          return "Quatre minutes de direct, une phrase reprise partout : « À dix-sept ans, on sait ce qu'est un couteau. » Vous devenez en une soirée une figure nationale de la fermeté. La gauche de votre parti ne vous regardera plus jamais de la même façon.";
        },
      },
      {
        id: "causes_fd",
        label: "Parler des causes",
        detail: "Le courage le moins récompensé qui soit.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { integrite: 6, rhetorique: 4 }, power: { popularite: -5 } });
          c.seg("quartiers", { soutien: 7 });
          c.seg("urbains", { soutien: 5 });
          c.seg("retraites", { soutien: -6 });
          c.flag("ligne_causes");
          return "Vous parlez de l'école, des services, d'un quartier abandonné depuis vingt ans. C'est exact, c'est documenté, et c'est perçu comme une excuse par la moitié du pays. On vous ressortira cette séquence à chaque fait divers, pendant des années.";
        },
      },
      {
        id: "silence_fd",
        label: "Refuser de commenter",
        detail: "« Il y a une famille en deuil. Je ne dirai rien. »",
        effects: (c) => {
          c.adj({ player: { integrite: 7, strategie: 4 }, power: { presse: -4 } });
          c.seg("retraites", { soutien: 3 });
          c.flag("refus_commentaire");
          return "Vous dites une phrase, une seule, et vous rentrez. Les chaînes trouvent quelqu'un d'autre en douze minutes. Vous avez perdu une occasion et gagné une réputation de dignité — la seule qui résiste au temps, et la moins utile à court terme.";
        },
      },
    ],
  },
  {
    id: "asc_lig_quotas",
    kind: "ascension",
    titre: "Le débat sur l'immigration",
    rarete: "peu_commune",
    texte:
      "Une proposition de loi instaure des quotas migratoires annuels votés par le Parlement. Votre circonscription est partagée, votre parti aussi, et l'hémicycle est retransmis en direct. Vous avez six minutes de temps de parole.",
    choices: [
      {
        id: "quotas_pour",
        label: "Défendre les quotas",
        detail: "« Accueillir, oui. Sans choisir, non. »",
        effects: (c) => {
          c.bord(3);
          c.adj({ player: { rhetorique: 5 }, country: { cohesion: -4 }, power: { popularite: 5 } });
          c.seg("periurbain", { soutien: 7 });
          c.seg("ruraux", { soutien: 6 });
          c.seg("quartiers", { soutien: -9 });
          c.seg("urbains", { soutien: -5 });
          c.flag("ligne_quotas");
          return "Six minutes maîtrisées, aucun dérapage, et une position claire qui vous vaut trois invitations en plateau dans la semaine. Vous venez de franchir la ligne que la moitié de votre camp s'interdit de franchir. Il n'y a pas de retour.";
        },
      },
      {
        id: "quotas_contre",
        label: "Défendre l'accueil",
        detail: "« On ne met pas de quota à une convention internationale. »",
        effects: (c) => {
          c.bord(-3);
          c.adj({ player: { integrite: 6, rhetorique: 5 }, country: { cohesion: 3, prestige: 3 } });
          c.seg("urbains", { soutien: 8 });
          c.seg("quartiers", { soutien: 8 });
          c.seg("ruraux", { soutien: -7 });
          c.seg("pavillonnaires", { soutien: -5 });
          c.flag("ligne_accueil");
          return "Vous citez le droit, les chiffres réels, et un nom de bateau. La tribune de gauche vous applaudit debout, le reste de l'hémicycle vous regarde comme un curieux spécimen. Vous serez désormais l'élue qu'on invite quand il faut « le point de vue humaniste ».";
        },
      },
      {
        id: "quotas_technique",
        label: "Renvoyer au droit européen",
        detail: "Techniquement imparable. Politiquement inaudible.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, rhetorique: 3 }, country: { prestige: 2 } });
          c.flag("ligne_juridique");
          return "Vous démontrez en six minutes que la proposition est inapplicable sans révision des traités. Vous avez raison, la loi sera effectivement retoquée, et personne ne s'en souviendra : dans ce débat-là, avoir raison sur la procédure équivaut à n'avoir rien dit.";
        },
      },
    ],
  },
  {
    id: "asc_lig_autoroute",
    kind: "ascension",
    titre: "L'autoroute et la zone humide",
    texte:
      "Un contournement autoroutier de deux cent quarante millions traverse une zone humide protégée. Quatre-vingts opposants occupent le terrain depuis onze semaines, la chambre de commerce menace de retirer son soutien, et le préfet attend votre position écrite.",
    choices: [
      {
        id: "autoroute_pour",
        label: "Soutenir le chantier",
        detail: "Des emplois, du désenclavement, un compromis écologique.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { croissance: 0.2, environnement: -5 }, power: { patronat: 8 } });
          c.seg("periurbain", { soutien: 6 });
          c.seg("independants", { soutien: 5 });
          c.seg("urbains", { soutien: -6 });
          c.flag("ligne_amenagement");
          return "Le chantier démarre après évacuation, avec cinq millions de « compensation environnementale » sur une zone qu'aucun batracien ne rejoindra jamais. La route est utile, elle sera saturée en douze ans, et vous aurez été du côté de ceux qui construisent.";
        },
      },
      {
        id: "autoroute_contre",
        label: "Soutenir les occupants",
        detail: "Aller sur la zone. En parler à visage découvert.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ country: { environnement: 6 }, player: { charisme: 5 }, power: { patronat: -8 } });
          c.seg("urbains", { soutien: 8 });
          c.seg("jeunes", { soutien: 7 });
          c.seg("periurbain", { soutien: -5 });
          c.flag("ligne_ecolo");
          c.log("Vous vous êtes rendu sur une zone occupée pour soutenir des opposants à un chantier.");
          return "Vous passez une journée sur la zone, sans service d'ordre, avec des gens dont vous ne partagez pas la moitié des idées. Le projet sera abandonné trois ans plus tard. La photo, elle, ressortira à chaque fois qu'on voudra vous peindre en radicale.";
        },
      },
      {
        id: "autoroute_referendum",
        label: "Exiger un référendum local",
        detail: "Rendre la décision. Et se protéger derrière elle.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, integrite: 3 }, country: { cohesion: 3 } });
          c.seg("ruraux", { participation: 6 });
          c.flag("referendum_local");
          return "Le référendum a lieu, participation quarante-huit pour cent, cinquante-trois pour cent pour le chantier. Tout le monde se plaint du résultat et personne ne le conteste. Vous avez découvert le seul outil qui transforme une défaite politique en décision légitime.";
        },
      },
    ],
  },
  {
    id: "asc_lig_europe",
    kind: "ascension",
    titre: "Le traité",
    rarete: "peu_commune",
    texte:
      "Un nouveau traité européen élargit les pouvoirs budgétaires de la Commission. Votre parti appelle à voter oui, votre circonscription a voté non à tous les référendums depuis vingt-cinq ans, et un militant vous a dit hier soir : « Si tu votes oui, on ne te reverra plus. »",
    choices: [
      {
        id: "europe_oui",
        label: "Voter oui et l'assumer en réunion publique",
        detail: "Aller expliquer, dans la salle la plus hostile.",
        effects: (c) => {
          c.bord(1);
          c.adj({ player: { integrite: 6, endurance: 4 }, country: { prestige: 6 }, power: { parti: 6 } });
          c.seg("csp", { soutien: 6 });
          c.seg("urbains", { soutien: 5 });
          c.seg("periurbain", { soutien: -6 });
          c.rel("weiss", { loyaute: 8 });
          c.flag("ligne_europeenne");
          return "Trois heures dans une salle des fêtes qui vous siffle, sans quitter la tribune. Vous ne convainquez personne et vous gagnez le respect de tout le monde. Berlin retient votre nom — ce qui vous servira beaucoup plus tard, et beaucoup plus haut.";
        },
      },
      {
        id: "europe_non",
        label: "Voter non contre votre parti",
        detail: "La souveraineté avant la discipline.",
        effects: (c) => {
          c.bord(1);
          c.adj({ player: { charisme: 6 }, country: { prestige: -5 }, power: { parti: -10, popularite: 6 } });
          c.seg("periurbain", { soutien: 9 });
          c.seg("ruraux", { soutien: 6 });
          c.seg("csp", { soutien: -6 });
          c.flag("ligne_souverainiste");
          return "Vous votez non, seul de votre groupe, et vous passez trois soirs à l'expliquer sur des plateaux. Le parti vous sanctionne, la circonscription vous sacralise, et vous découvrez qu'un député sanctionné par son parti est un député qu'on ne peut plus battre chez lui.";
        },
      },
      {
        id: "europe_reforme",
        label: "Voter oui contre un protocole social additionnel",
        detail: "Monnayer sa voix pour du contenu.",
        effects: (c) => {
          c.adj({ player: { strategie: 8, reseau: 5 }, country: { prestige: 3 } });
          c.seg("public", { soutien: 4 });
          c.flag("ligne_negociatrice");
          return "Vous négociez pendant six semaines et obtenez un protocole social de quatre pages, contraignant sur deux points. C'est peu, c'est réel, et personne ne vous en félicitera — les gains obtenus par négociation n'ont jamais fourni un seul slogan.";
        },
      },
    ],
  },
  {
    id: "asc_lig_laicite",
    kind: "ascension",
    titre: "L'affaire du collège",
    texte:
      "Un principal de collège de votre circonscription refuse l'entrée à trois élèves pour tenue religieuse. Les familles saisissent le tribunal, deux syndicats s'affrontent, et les chaînes d'information ont installé leurs camions devant l'établissement.",
    choices: [
      {
        id: "laicite_ferme",
        label: "Soutenir le principal sans réserve",
        detail: "La loi de 2004 ne se négocie pas.",
        effects: (c) => {
          c.bord(2);
          c.adj({ player: { rhetorique: 5 }, country: { cohesion: -3 } });
          c.seg("pavillonnaires", { soutien: 6 });
          c.seg("ruraux", { soutien: 5 });
          c.seg("public", { soutien: 4 });
          c.seg("quartiers", { soutien: -8 });
          c.flag("ligne_laicite_stricte");
          return "Vous vous rendez au collège, vous serrez la main du principal devant les caméras, et vous prononcez le mot « République » onze fois en six minutes. Le tribunal vous donnera raison. Trois familles déménageront. Les deux faits sont vrais et n'ont jamais été mis dans le même article.";
        },
      },
      {
        id: "laicite_dialogue",
        label: "Recevoir les familles et le principal ensemble",
        detail: "Une heure, sans caméra, sans communiqué.",
        effects: (c) => {
          c.adj({ player: { charisme: 5, strategie: 5 }, country: { cohesion: 5 } });
          c.seg("quartiers", { soutien: 5 });
          c.seg("public", { soutien: 3 });
          c.flag("ligne_mediation");
          return "Une heure quarante dans votre permanence, portes fermées. Deux élèves reviennent en classe le lundi, la troisième change d'établissement. Aucune chaîne n'en parlera parce qu'il n'y a rien à filmer — c'est la définition même d'un problème résolu.";
        },
      },
      {
        id: "laicite_famille",
        label: "Soutenir les familles",
        detail: "« Un collège n'est pas un poste de contrôle. »",
        effects: (c) => {
          c.bord(-3);
          c.adj({ player: { integrite: 5, charisme: 3 }, power: { popularite: -6 } });
          c.seg("quartiers", { soutien: 9 });
          c.seg("urbains", { soutien: 4 });
          c.seg("public", { soutien: -6 });
          c.seg("pavillonnaires", { soutien: -7 });
          c.flag("ligne_communautaire_accusee");
          return "Vous prenez position pour les familles et vous êtes traitée de complaisante avant la fin de la journée. Le terme restera accroché à votre nom pendant toute votre carrière, y compris chez ceux qui, en privé, pensaient exactement comme vous.";
        },
      },
    ],
  },
  {
    id: "asc_lig_patrimoine",
    kind: "ascension",
    titre: "La taxe sur les grandes fortunes",
    texte:
      "Un amendement rétablit un impôt sur les patrimoines supérieurs à trois millions d'euros. Bercy annonce huit milliards de recettes, les banques annoncent l'apocalypse, et deux mille foyers ont déjà consulté leur fiscaliste avant même le vote.",
    choices: [
      {
        id: "patrimoine_pour",
        label: "Voter pour, et défendre l'amendement",
        detail: "Huit milliards. Et un symbole qui vaut davantage.",
        effects: (c) => {
          c.bord(-3);
          c.adj({ country: { marge: 5 }, power: { syndicats: 8, patronat: -12 }, player: { rhetorique: 5 } });
          c.seg("public", { soutien: 7 });
          c.seg("periurbain", { soutien: 6 });
          c.seg("csp", { soutien: -12 });
          c.flag("ligne_fiscale_dure");
          return "L'amendement passe de quatre voix. Vous devenez pour la finance française un nom qu'on prononce en soupirant, et pour la gauche du pays quelqu'un qui a fait ce qu'il disait. Les deux réputations sont durables et strictement incompatibles.";
        },
      },
      {
        id: "patrimoine_contre",
        label: "Voter contre : l'assiette fuira",
        detail: "L'argument est technique. Il est aussi exact.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { croissance: 0.2 }, power: { patronat: 10, syndicats: -8 }, player: { strategie: 5 } });
          c.seg("csp", { soutien: 9 });
          c.seg("public", { soutien: -6 });
          c.flag("ligne_fiscale_souple");
          return "Vous démontrez chiffres en main que le rendement réel sera de deux milliards, pas de huit. Vous avez probablement raison. Vous passez néanmoins la soirée à être présentée comme la députée qui défend les riches, ce qui est le prix normal de l'exactitude en matière fiscale.";
        },
      },
      {
        id: "patrimoine_alternative",
        label: "Proposer une taxe sur les rachats d'actions",
        detail: "Même cible, autre angle, aucun exil possible.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { marge: 3 }, player: { strategie: 8 }, power: { patronat: -5 } });
          c.seg("public", { soutien: 4 });
          c.flag("ligne_fiscale_maligne");
          return "Votre sous-amendement est adopté à la surprise générale et rapporte trois milliards sans provoquer un seul départ. C'est le genre de coup qui fait une réputation d'intelligence à Bercy et absolument aucun titre de presse.";
        },
      },
    ],
  },
  {
    id: "asc_lig_retraites",
    kind: "ascension",
    titre: "Soixante-quatre ans",
    texte:
      "Le gouvernement recule l'âge légal de deux ans. Trois millions de personnes dans la rue, votre boîte mail sature, et votre groupe vous laisse libre de votre vote — ce qui, en langage parlementaire, signifie qu'on vous laisse porter le chapeau tout seul.",
    choices: [
      {
        id: "retraites_contre",
        label: "Voter contre et manifester",
        detail: "Dans le cortège, avec une écharpe.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ player: { charisme: 6 }, power: { syndicats: 12, patronat: -8, parti: -6 } });
          c.seg("public", { soutien: 8 });
          c.seg("periurbain", { soutien: 7 });
          c.seg("csp", { soutien: -6 });
          c.flag("ligne_retraites_contre");
          return "Écharpe tricolore dans le cortège, en tête, à côté de gens qui ne votent pas pour vous. La photo est parfaite. Elle vous interdit aussi, pour toujours, de toucher au dossier des retraites une fois au pouvoir — et vous y toucherez, ou vous ne ferez rien du tout.";
        },
      },
      {
        id: "retraites_pour",
        label: "Voter pour, par arithmétique",
        detail: "Trois actifs pour un retraité en 1990. Un virgule sept aujourd'hui.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { marge: 5 }, power: { patronat: 8, syndicats: -12, parti: 5 }, player: { integrite: 4 } });
          c.seg("csp", { soutien: 6 });
          c.seg("public", { soutien: -8 });
          c.flag("ligne_retraites_pour");
          return "Vous votez pour et vous publiez une note de six pages avec les projections démographiques. Personne ne la lit. Votre permanence est taguée deux fois. Vous avez acquis ce jour-là la seule crédibilité qui compte devant un directeur du Trésor, et perdu celle qui compte devant une salle.";
        },
      },
      {
        id: "retraites_penibilite",
        label: "Conditionner votre voix à la pénibilité",
        detail: "Six critères, un compte, des départs anticipés réels.",
        effects: (c) => {
          c.adj({ player: { strategie: 7, rhetorique: 4 }, power: { syndicats: 5, parti: 3 } });
          c.seg("periurbain", { soutien: 5 });
          c.seg("public", { soutien: 3 });
          c.flag("ligne_penibilite");
          return "Vous obtenez quatre critères sur six et vous votez pour. Les syndicats vous traitent de traître à moitié, le gouvernement de gêneuse à moitié. Deux cent mille personnes partiront plus tôt grâce à cet amendement, et aucune ne saura jamais qu'il porte votre nom.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 5 — LE PARTI. L'appareil ne fait pas gagner. Il peut faire perdre.
  // =========================================================================
  {
    id: "asc_congres",
    kind: "ascension",
    titre: "Le congrès du parti",
    texte:
      "Dix ans ont passé. Député, puis figure montante. Au congrès du parti, deux motions s'affrontent, et votre signature fera la différence. Jean-Marc Espitalier, le trésorier, vous glisse : « Choisis bien. On a de la mémoire, ici. »",
    choices: [
      {
        id: "appareil",
        label: "Signer avec l'appareil",
        detail: "La direction gagnera. Les fidèles sont récompensés.",
        effects: (c) => {
          c.adj({ power: { parti: 10 } });
          c.rel("espitalier", { loyaute: 10 });
          c.rel("delval", { rancune: 5 });
          return "Victoire large. L'appareil vous ouvre ses fichiers et ses fédérations. Sacha Delval, qui portait la motion adverse, vient vous serrer la main avec un sourire qui ne monte pas jusqu'aux yeux.";
        },
      },
      {
        id: "frondeurs",
        label: "Signer avec les frondeurs",
        detail: "Perdre avec panache. Exister.",
        effects: (c) => {
          c.adj({ player: { charisme: 4 }, power: { parti: -5 } });
          c.rel("delval", { loyaute: 10 });
          c.rel("espitalier", { rancune: 8 });
          return "Votre motion perd, 43 contre 57. Mais votre discours à la tribune est le seul dont on parle. Delval vous rejoint au bar du congrès : « On la refera, et on la gagnera. » Espitalier, lui, note quelque chose dans son carnet.";
        },
      },
      {
        id: "synthese",
        label: "Proposer la synthèse",
        detail: "Ni vainqueur ni vaincu. Un texte que personne n'aime et que tout le monde vote.",
        effects: (c) => {
          c.adj({ player: { strategie: 5, cynisme: 2 } });
          return "Votre texte est d'une platitude remarquable. Adopté à 91 %. On ne gagne pas un congrès avec des idées : on le gagne avec un texte que personne ne peut refuser.";
        },
      },
    ],
  },
  {
    id: "asc_par_scission",
    kind: "ascension",
    titre: "La scission",
    rarete: "peu_commune",
    texte:
      "Un tiers du parti claque la porte pour fonder un mouvement. Ils vous veulent : vous seriez le visage, ils apportent quatre cents cadres et zéro appareil. Espitalier, lui, vous a fait porter un mot d'une ligne : « Ceux qui partent ne reviennent jamais. »",
    choices: [
      {
        id: "partir_scission",
        label: "Partir avec eux",
        detail: "Tout reconstruire. À quarante-cinq ans.",
        effects: (c) => {
          c.adj({ player: { charisme: 7, endurance: 5 }, power: { parti: -18, popularite: 6 } });
          c.rel("espitalier", { rancune: 20, loyaute: -20 });
          c.rel("delval", { loyaute: 10 });
          c.seg("jeunes", { soutien: 6, participation: 5 });
          c.flag("fondateur_mouvement");
          c.log("Vous avez quitté votre parti pour fonder un mouvement — pari fondateur de votre carrière.");
          return "Six mois de salles louées et de virements personnels. Le mouvement existe, il est à vous, et il ne vous doit rien qu'à vous — ce qui signifie aussi qu'il n'y a personne derrière vous le jour où ça tourne mal.";
        },
      },
      {
        id: "rester_scission",
        label: "Rester et hériter de l'appareil",
        detail: "Ils partent, la machine reste. Elle vous revient.",
        effects: (c) => {
          c.adj({ player: { strategie: 5 }, power: { parti: 14 } });
          c.rel("espitalier", { loyaute: 14 });
          c.rel("delval", { rancune: 10 });
          c.flag("heritier_appareil");
          return "Vous restez, et en dix-huit mois vous héritez d'un parti amputé du tiers de ses idées et intact de la totalité de ses fichiers. C'est un échange que tous les professionnels acceptent, et qu'aucun ne raconte de cette façon.";
        },
      },
      {
        id: "mediation_scission",
        label: "Tenter la médiation",
        detail: "Empêcher la rupture. Personne n'a jamais réussi.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 6, endurance: 4 }, power: { parti: 5 } });
          c.rel("delval", { loyaute: 6 });
          c.rel("espitalier", { loyaute: 6 });
          c.flag("mediateur_parti");
          return "Onze réunions, deux nuits blanches, et une scission réduite de moitié. Les deux camps vous doivent quelque chose et aucun ne vous aime tout à fait. C'est la position la plus inconfortable du parti, et statistiquement la meilleure pour finir candidat.";
        },
      },
    ],
  },
  {
    id: "asc_par_investiture",
    kind: "ascension",
    titre: "L'investiture disputée",
    texte:
      "La fédération doit investir un candidat pour une législative gagnable. Vous êtes face à une militante de trente ans, meilleure oratrice que vous, sans réseau. Le vote des adhérents a lieu jeudi et vous savez précisément comment le gagner.",
    choices: [
      {
        id: "gagner_sale",
        label: "Faire adhérer deux cents personnes",
        detail: "Légal. Massif. Décisif.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, cynisme: 6, integrite: -5 }, power: { parti: 6 } });
          c.flag("adhesions_massives");
          return "Deux cent douze adhésions en onze jours, cotisations réglées par trois chèques. Vous l'emportez par cent quatre-vingts voix. La militante quitte le parti le mois suivant et deviendra, dans sept ans, l'une des voix les plus écoutées du camp d'en face.";
        },
      },
      {
        id: "debattre_investiture",
        label: "Exiger un débat public devant les adhérents",
        detail: "Prendre le risque de perdre.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 6, integrite: 6, charisme: 4 } });
          c.flag("investiture_loyale");
          return "Deux heures de débat, salle comble, et une victoire à soixante-deux pour cent. Elle vous rejoint le lendemain comme suppléante et devient l'une des rares personnes de votre entourage qui vous dira non — vous ne mesurerez la valeur de cette recrue que bien plus tard.";
        },
      },
      {
        id: "ceder_investiture",
        label: "Lui laisser la circonscription",
        detail: "Et viser directement plus haut.",
        effects: (c) => {
          c.adj({ player: { strategie: 7, integrite: 5 }, power: { parti: 4 } });
          c.seg("jeunes", { soutien: 5 });
          c.flag("investiture_cedee");
          return "Vous vous retirez en trois lignes et vous soutenez publiquement sa campagne. Elle gagne. Vous venez de vous constituer, pour le prix d'un mandat local, une alliée absolue à l'Assemblée — c'est le meilleur investissement de votre carrière et personne ne l'a vu passer.";
        },
      },
    ],
  },
  {
    id: "asc_par_comptes",
    kind: "ascension",
    titre: "Les comptes du parti",
    rarete: "peu_commune",
    texte:
      "Devenu numéro deux du parti, vous découvrez le vrai budget : une dette de onze millions, un prêt d'une banque étrangère et des « prestations de conseil » facturées à une société dont Espitalier est l'unique client. Il vous a montré tout cela lui-même, ce qui est une façon de vous impliquer.",
    choices: [
      {
        id: "assainir_comptes",
        label: "Tout assainir, quitte à couler le parti",
        detail: "Rembourser, résilier, publier.",
        effects: (c) => {
          c.adj({ player: { integrite: 9 }, power: { parti: -12 } });
          c.rel("espitalier", { rancune: 22, loyaute: -20 });
          c.flag("comptes_assainis");
          return "Vous résiliez les contrats, renégociez le prêt et publiez les comptes certifiés. Le parti frôle la cessation de paiement pendant huit mois. Espitalier ne vous adressera plus la parole en privé — et vous serez le seul dirigeant du pays à ne rien craindre d'un contrôle de la commission des comptes.";
        },
      },
      {
        id: "gerer_comptes",
        label: "Régulariser en silence",
        detail: "Sans publier. Sans rompre.",
        effects: (c) => {
          c.adj({ player: { strategie: 6, cynisme: 4, integrite: -3 } });
          c.rel("espitalier", { loyaute: 8 });
          c.flag("comptes_regularises");
          return "Les contrats s'éteignent d'eux-mêmes en dix-huit mois, sans communiqué ni rupture. C'est efficace, c'est indolore, et ça laisse dix-huit mois d'archives dont vous êtes désormais comptable. Espitalier vous considère maintenant comme un associé.";
        },
      },
      {
        id: "profiter_comptes",
        label: "Utiliser le système pour votre campagne",
        detail: "Il existe déjà. Autant qu'il serve.",
        effects: (c) => {
          c.adj({ player: { cynisme: 8, integrite: -10, reseau: 6 } });
          c.rel("espitalier", { loyaute: 14 });
          c.flag("carnets_armes");
          c.sched("carnets_1", 5, 14, 0.45);
          return "La société de conseil facture désormais votre communication personnelle. C'est confortable, c'est invisible, et c'est une bombe dont vous venez de vous rendre propriétaire. Espitalier, lui, tient les carnets — et un homme qui tient les carnets ne travaille jamais gratuitement.";
        },
      },
    ],
  },
  {
    id: "asc_par_vague",
    kind: "ascension",
    titre: "La vague",
    texte:
      "Élections intermédiaires : votre camp perd deux cents villes en une nuit. À vingt-trois heures, les caméras cherchent quelqu'un pour commenter la déroute. Le premier secrétaire s'est fait porter pâle. Le plateau est libre.",
    choices: [
      {
        id: "assumer_defaite",
        label: "Y aller et assumer la défaite",
        detail: "Personne d'autre ne le fera.",
        effects: (c) => {
          c.adj({ player: { charisme: 6, integrite: 6 }, power: { parti: 8, presse: 5 } });
          c.flag("visage_defaite");
          return "Vous assumez pendant vingt minutes, sans chercher de coupable ni d'excuse météorologique. C'est un exercice que personne ne veut faire et dont tout le monde se souvient : dans les six mois, la moitié de la fédération vous considère comme le prochain patron.";
        },
      },
      {
        id: "charger_direction",
        label: "Charger la direction en direct",
        detail: "La séquence est parfaite. Elle laisse des traces.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 6, cynisme: 5 }, power: { parti: -10, popularite: 6 } });
          c.rel("espitalier", { rancune: 14 });
          c.flag("regicide");
          return "« Cette défaite a des responsables, et ils ne sont pas dans les bureaux de vote. » La direction tombe en trois semaines. On vous appelle désormais le régicide, dans le parti — un titre qui ouvre toutes les portes et qu'aucun successeur n'oublie jamais.";
        },
      },
      {
        id: "eviter_plateau",
        label: "Rentrer chez vous",
        detail: "Un soir de déroute, on ne gagne rien.",
        effects: (c) => {
          c.adj({ player: { strategie: 5 } });
          c.flag("absent_defaite");
          return "Vous éteignez votre téléphone à vingt-deux heures. Un autre y va, se brûle, et disparaît du paysage en dix-huit mois. Vous avez fait le calcul juste — et il vous restera longtemps un léger arrière-goût, parce que vous saviez qu'il se brûlerait.";
        },
      },
    ],
  },
  {
    id: "asc_par_fusion",
    kind: "ascension",
    titre: "L'alliance impossible",
    rarete: "rare",
    texte:
      "Un mouvement bien plus radical que le vôtre propose une alliance électorale : leurs quinze pour cent contre huit circonscriptions et deux points de programme. Sans eux, votre camp ne passe pas le premier tour. Avec eux, la moitié de vos électeurs modérés s'en va.",
    choices: [
      {
        id: "alliance_radicale",
        label: "Signer l'alliance",
        detail: "Gagner d'abord. Trier ensuite.",
        effects: (c) => {
          c.bord(c.s.bord <= 0 ? -2 : 2);
          c.adj({ player: { strategie: 5, cynisme: 5 }, power: { parti: 6 } });
          c.seg("periurbain", { soutien: 6, participation: 6 });
          c.seg("csp", { soutien: -7 });
          c.flag("alliance_radicale");
          return "L'accord est signé un dimanche soir, en huit lignes, avec deux points de programme que vous n'assumez qu'à moitié. Vous gagnez treize circonscriptions supplémentaires. Vous héritez aussi de quinze députés dont les sorties feront votre actualité pendant cinq ans.";
        },
      },
      {
        id: "refus_alliance",
        label: "Refuser publiquement",
        detail: "Perdre proprement plutôt que gagner sali.",
        effects: (c) => {
          c.adj({ player: { integrite: 9 }, power: { parti: -8, presse: 8 } });
          c.seg("csp", { soutien: 6 });
          c.seg("urbains", { soutien: 6 });
          c.seg("periurbain", { soutien: -5 });
          c.flag("refus_alliance");
          c.log("Vous avez refusé une alliance électorale avec un mouvement radical, au prix de vos scores.");
          return "Vous refusez dans un communiqué de neuf lignes que vous relirez souvent. Le camp perd quarante sièges et vous en tient rigueur pendant trois ans. Puis un jour, dans une campagne présidentielle, quelqu'un ressortira ce communiqué — et il vaudra tous les meetings du monde.";
        },
      },
      {
        id: "alliance_technique",
        label: "Un accord de désistement, sans programme",
        detail: "Des sièges, aucune signature commune.",
        effects: (c) => {
          c.adj({ player: { strategie: 8, cynisme: 3 } });
          c.seg("periurbain", { soutien: 3 });
          c.flag("accord_technique");
          return "Pas d'accord programmatique : un simple engagement de désistement au second tour, publié par les deux états-majors sans photo commune. Vous récupérez neuf sièges et aucune casserole. C'est le genre de montage que seuls trois ou quatre professionnels savent faire, et vous venez d'entrer dans la liste.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 6 — LA CONSÉCRATION. Le parti doit choisir un visage.
  // =========================================================================
  {
    id: "asc_primaire",
    kind: "ascension",
    titre: "La primaire",
    texte: (s) =>
      `La présidentielle approche et le parti doit choisir. Face à vous : Sacha Delval, trente-huit ans, brillant, pressé${s.flags["dette_ascension"] ? ", et qui a ressorti en réunion fermée l'histoire de votre « subvention exceptionnelle » d'il y a quinze ans" : ""}. Le débat de la primaire est ce soir. Sa faiblesse : il n'a jamais rien géré. La vôtre : vous êtes là depuis vingt ans.`,
    choices: [
      {
        id: "experience",
        label: "Jouer l'expérience",
        detail: "Face au monde qui vient, pas d'apprenti.",
        effects: (c) => {
          c.adj({ power: { parti: 5 } });
          c.rel("delval", { rancune: 5, ambition: 5 });
          c.flag("primaire_gagnee", "experience");
          return "« Gouverner, ça s'apprend — et pas en gouvernant. » 58-42. Delval reconnaît sa défaite avec une élégance parfaite : toujours mauvais signe chez un ambitieux.";
        },
      },
      {
        id: "dur",
        label: "Frapper là où ça fait mal",
        detail: "Son inexpérience, ses réseaux, son impatience. Tout y passe.",
        effects: (c) => {
          c.adj({ player: { cynisme: 3 } });
          c.rel("delval", { rancune: 20, loyaute: -15 });
          c.flag("primaire_gagnee", "brutale");
          return "Vous le démontez méthodiquement pendant une heure dix. 63-37, le parti est à vous. Mais ce soir-là quelque chose s'est cassé chez Delval — et les choses cassées finissent toujours par ressortir.";
        },
      },
      {
        id: "rassembler",
        label: "Lui tendre la main en direct",
        detail: "« Gagne ou perds, je veux Sacha à mes côtés. »",
        effects: (c) => {
          c.adj({ player: { charisme: 3 } });
          c.rel("delval", { loyaute: 15, ambition: 5 });
          c.flag("primaire_gagnee", "rassemblement");
          return "Le geste surprend tout le monde, lui le premier. Victoire 55-45, et une accolade sincère — enfin, télégénique. Delval sera de la campagne. Son ambition aussi.";
        },
      },
    ],
  },
  {
    id: "asc_pri_ouverte",
    kind: "ascension",
    titre: "La primaire ouverte",
    texte:
      "Le parti a ouvert sa primaire à tous les sympathisants : deux millions de votants attendus, cinq candidats, et une dynamique qui n'a plus rien à voir avec les fédérations. Votre directeur de campagne pose la question qui décide de tout : à qui parlez-vous pendant trois semaines ?",
    choices: [
      {
        id: "parler_militants",
        label: "Aux militants historiques",
        detail: "Ils votent toujours. Ils décident souvent.",
        effects: (c) => {
          c.adj({ power: { parti: 10 }, player: { strategie: 4 } });
          c.flag("primaire_gagnee", "appareil");
          return "Trois semaines de fédérations, de salles de quarante personnes et de cafés froids. Vous gagnez avec cinquante-trois pour cent d'un corps électoral vieillissant. Vous arrivez en campagne présidentielle avec un parti soudé et une image de candidat d'appareil dont vous mettrez six mois à vous défaire.";
        },
      },
      {
        id: "parler_pays",
        label: "Au pays, par-dessus le parti",
        detail: "Meetings ouverts, plateaux, réseaux. Le parti suivra.",
        effects: (c) => {
          c.adj({ player: { charisme: 7, rhetorique: 4 }, power: { popularite: 8, parti: -8 } });
          for (const id of ["jeunes", "urbains", "periurbain"]) c.seg(id, { participation: 6 });
          c.flag("primaire_gagnee", "populaire");
          return "Deux millions de votants, une participation record, et une victoire à soixante et un pour cent portée par des gens qui n'ont jamais mis les pieds dans une section. Vous êtes candidat contre l'avis de la moitié de votre appareil — c'est-à-dire seul, et très fort.";
        },
      },
      {
        id: "parler_adversaire",
        label: "Ne parler que de l'adversaire de la présidentielle",
        detail: "Ignorer la primaire. Se comporter déjà en finaliste.",
        effects: (c) => {
          c.adj({ player: { strategie: 7, charisme: 3 }, power: { presse: 6 } });
          c.rel("delval", { rancune: 8 });
          c.flag("primaire_gagnee", "presidentielle");
          return "Vous ne citez jamais vos concurrents de primaire, pas une fois en trois semaines. Le procédé est arrogant et terriblement efficace : à la fin, les électeurs choisissent celui qui se comportait déjà en président. Vos concurrents ne l'oublieront pas.";
        },
      },
    ],
  },
  {
    id: "asc_pri_designe",
    kind: "ascension",
    titre: "Le champion désigné",
    rarete: "peu_commune",
    texte:
      "Pas de primaire : le bureau politique vous désigne à l'unanimité en quarante minutes. C'est confortable, c'est net, et c'est exactement ce qu'on reprochera à votre candidature pendant six mois — une investiture décidée par trente et une personnes dans une salle sans fenêtre.",
    choices: [
      {
        id: "accepter_designation",
        label: "Accepter la désignation",
        detail: "Six mois d'avance sur tout le monde.",
        effects: (c) => {
          c.adj({ power: { parti: 12 }, player: { strategie: 3 } });
          c.seg("jeunes", { soutien: -4 });
          c.flag("designe_bureau");
          return "Vous êtes candidat à onze heures du matin, sans une voix contre. Vos équipes travaillent six mois de plus que celles des autres. Et pendant six mois, chaque intervieweur ouvrira par la même question : « Qui vous a choisi, au juste ? »";
        },
      },
      {
        id: "exiger_vote",
        label: "Exiger un vote des adhérents malgré tout",
        detail: "Une légitimité coûte moins cher qu'une suspicion.",
        effects: (c) => {
          c.adj({ player: { integrite: 7, charisme: 4 }, power: { popularite: 5, parti: -3 } });
          c.seg("jeunes", { participation: 5 });
          c.flag("legitimite_adherents");
          return "Vous refusez la désignation et exigez un vote : quatre-vingt-onze pour cent, quatre-vingt-douze mille votants. C'était joué d'avance, ça vous a coûté cinq semaines, et ça vous fournit la seule réponse qui coupe court à la question : un chiffre.";
        },
      },
      {
        id: "designation_conditions",
        label: "Accepter, contre le programme et les têtes de liste",
        detail: "S'ils désignent sans vote, ils paient le prix fort.",
        effects: (c) => {
          c.adj({ player: { strategie: 8, cynisme: 4 }, power: { parti: 6 } });
          c.rel("espitalier", { rancune: 8 });
          c.rel("delval", { rancune: 6 });
          c.flag("candidat_conditions");
          return "Vous acceptez à condition d'écrire seul le programme et d'arbitrer les investitures. Le bureau accepte, faute d'alternative. Vous entrez en campagne avec un pouvoir interne qu'aucun candidat n'avait obtenu depuis trente ans — et une quinzaine de rancunes bien identifiées.";
        },
      },
    ],
  },
  {
    id: "asc_pri_outsider",
    kind: "ascension",
    titre: "La primaire imperdable de l'autre",
    rarete: "rare",
    texte:
      "Vous êtes à onze pour cent dans les sondages de primaire, contre soixante-deux pour le favori. Il reste dix jours, un débat, et un dossier que vos équipes ont sorti sur son financement. Votre directrice de campagne pose le dossier sur la table sans le commenter.",
    choices: [
      {
        id: "sortir_dossier",
        label: "Sortir le dossier au débat",
        detail: "Gagner en détruisant. C'est une méthode.",
        effects: (c) => {
          c.adj({ player: { cynisme: 8, rhetorique: 6, integrite: -8 }, power: { parti: -10 } });
          c.rel("delval", { rancune: 25 });
          c.rel("espitalier", { rancune: 12 });
          c.flag("primaire_gagnee", "dossier");
          c.flag("primaire_sale");
          return "Vous sortez le dossier à la trente-huitième minute, en direct, et le favori s'effondre en quatre jours. Vous gagnez la primaire avec cinquante et un pour cent d'un parti qui vous en veut. Toute votre présidence se jouera avec ces gens-là autour de la table.";
        },
      },
      {
        id: "gagner_terrain",
        label: "Brûler dix jours sur le terrain",
        detail: "Quarante-deux villes. Aucune chance. On y va.",
        effects: (c) => {
          c.adj({ player: { charisme: 9, endurance: 6 }, hidden: { fatigue: 12 }, power: { popularite: 8 } });
          for (const id of ["periurbain", "ruraux", "jeunes"]) c.seg(id, { soutien: 5, participation: 6 });
          c.flag("primaire_gagnee", "remontada");
          c.log("Vous avez remonté cinquante points en dix jours de primaire — l'exploit est resté dans les mémoires.");
          return "Quarante-deux villes, six heures de sommeil par nuit, aucune attaque personnelle. Vous l'emportez à cinquante-quatre pour cent le dimanche soir, et le pays entier a vu la remontée en direct. Personne ne pourra plus jamais dire que vous n'êtes pas un animal de campagne.";
        },
      },
      {
        id: "negocier_retrait",
        label: "Négocier votre retrait contre Matignon",
        detail: "Perdre volontairement, très cher.",
        effects: (c) => {
          c.adj({ player: { strategie: 9, cynisme: 6 }, power: { parti: 10 } });
          c.rel("delval", { loyaute: 10 });
          c.flag("retrait_negocie");
          return "Vous vous retirez au profit du favori contre un engagement écrit sur Matignon. Il perd la présidentielle six mois plus tard, et vous héritez d'un parti, d'un accord public et d'aucune défaite personnelle — vous serez candidat la fois suivante, en position de force.";
        },
      },
    ],
  },

  // =========================================================================
  // ÉTAPE 7 — L'INVESTITURE. Dernier choix avant la campagne.
  // =========================================================================
  {
    id: "asc_investiture",
    kind: "ascension",
    titre: "L'investiture",
    texte:
      "La salle est pleine, les drapeaux sont neufs, et le pupitre porte votre nom. Dans quelques minutes, vous serez officiellement candidat(e) à la présidence de la République. Il reste une décision — la première de la campagne. Jean-Marc Espitalier vous attend dans le couloir, avec un classeur et une question sur le financement.",
    choices: [
      {
        id: "regles",
        label: "« Tout dans les règles, Jean-Marc. »",
        detail: "La campagne sera plus pauvre. Les comptes seront propres.",
        effects: (c) => {
          c.adj({ player: { integrite: 5 } });
          c.flag("financement_propre");
          return "Espitalier soupire, range le classeur. « Alors ce sera trains de nuit et salles des fêtes. » Va pour les salles des fêtes. Vous dormirez mal, mais vous dormirez.";
        },
      },
      {
        id: "arrange",
        label: "« Débrouille-toi. Je ne veux pas savoir. »",
        detail: "Un intermédiaire, des versements, une campagne confortable. Et une bombe, armée.",
        effects: (c) => {
          c.adj({ player: { integrite: -10, cynisme: 5 } });
          c.flag("carnets_armes");
          c.rel("espitalier", { loyaute: 10 });
          c.sched("carnets_1", 6, 14, 0.4);
          return "« Tu ne sauras rien. » Le classeur disparaît. La campagne sera large, fluide, financée. Un intermédiaire ouvre un compte, un carnet s'épaissit. Vous n'y penserez plus. Lui, si.";
        },
      },
    ],
  },
  {
    id: "asc_inv_discours",
    kind: "ascension",
    titre: "Le discours d'investiture",
    texte:
      "Six mille personnes, quarante caméras, et trois versions du discours sur la table. Camille Roze vous laisse choisir seul : « Celui que vous prononcerez, vous le porterez cinq ans. Si vous êtes élu, il deviendra votre bilan avant même d'avoir commencé. »",
    choices: [
      {
        id: "discours_colere",
        label: "Le discours de la colère",
        detail: "Nommer les responsables. La salle attend ça.",
        effects: (c) => {
          c.bord(c.s.bord <= 0 ? -2 : 2);
          c.adj({ player: { charisme: 7, rhetorique: 5 }, power: { popularite: 7, presse: -6 } });
          for (const id of ["periurbain", "jeunes", "quartiers"]) c.seg(id, { participation: 7 });
          c.seg("csp", { soutien: -5 });
          c.flag("discours_rupture");
          return "Quarante minutes de colère organisée, une salle debout six fois, et une phrase que les chaînes repasseront jusqu'au soir. Vous entrez en campagne comme candidat de rupture. Il faudra tenir ce niveau de promesse pendant cinq ans, ou l'expliquer.";
        },
      },
      {
        id: "discours_rassemblement",
        label: "Le discours du rassemblement",
        detail: "Parler à ceux qui ne voteront pas pour vous.",
        effects: (c) => {
          c.bord(c.s.bord > 0 ? -1 : 1);
          c.adj({ player: { rhetorique: 6, integrite: 4 }, country: { cohesion: 5 }, power: { presse: 8 } });
          for (const id of ["retraites", "pavillonnaires"]) c.seg(id, { soutien: 5 });
          c.flag("discours_rassemblement");
          return "Un discours qui ne fait applaudir sa propre salle que trois fois — les autres passages s'adressaient à ceux qui n'y étaient pas. Les éditorialistes parlent de « hauteur ». Vos militants rentrent chez eux un peu déçus, et légèrement fiers.";
        },
      },
      {
        id: "discours_verite",
        label: "Le discours de la vérité budgétaire",
        detail: "Annoncer ce que ça va coûter. Personne ne fait ça.",
        effects: (c) => {
          c.adj({ player: { integrite: 9, strategie: 5 }, power: { popularite: -6, presse: 10, patronat: 6 } });
          c.seg("csp", { soutien: 6 });
          c.seg("public", { soutien: -4 });
          c.flag("discours_verite");
          c.log("Votre discours d'investiture annonçait les sacrifices avant les promesses. On s'en souviendra.");
          return "Vous annoncez les efforts avant les cadeaux, chiffres à l'appui, devant six mille militants qui n'étaient pas venus pour ça. La salle applaudit poliment. Les marchés, Bruxelles et trois éditorialistes vous prennent au sérieux — c'est un capital rare, et il ne se dépense qu'une fois.";
        },
      },
    ],
  },
  {
    id: "asc_inv_alliance",
    kind: "ascension",
    titre: "Le ralliement de la dernière heure",
    rarete: "peu_commune",
    texte:
      "À trois jours du dépôt des candidatures, une figure de votre camp qui pesait neuf pour cent propose de se retirer et de vous soutenir. Son prix : Matignon, écrit, signé, daté. Elle a apporté le document et un stylo.",
    choices: [
      {
        id: "signer_matignon",
        label: "Signer",
        detail: "Neuf points aujourd'hui, un Premier ministre imposé demain.",
        effects: (c) => {
          c.adj({ player: { strategie: 4, cynisme: 5 }, power: { parti: 6 } });
          for (const id of ["periurbain", "public", "ruraux"]) c.seg(id, { soutien: 5 });
          c.flag("matignon_promis");
          return "Vous signez, elle se retire le lendemain, et vous gagnez sept points en une semaine. Le document existe en deux exemplaires. Le jour où vous voudrez changer de Premier ministre, l'un des deux réapparaîtra dans un journal du dimanche.";
        },
      },
      {
        id: "refuser_matignon",
        label: "Refuser le papier, accepter le soutien",
        detail: "« Je ne signe pas de contrat sur un poste qui n'existe pas encore. »",
        effects: (c) => {
          c.adj({ player: { integrite: 7, strategie: 4 } });
          for (const id of ["periurbain", "public"]) c.seg(id, { soutien: 2 });
          c.flag("refus_contrat_matignon");
          return "Vous refusez le papier et vous lui proposez la parole à votre meeting de clôture. Elle se rallie quand même, en gardant sa fierté et sa liberté. Vous gagnez trois points au lieu de sept, et vous garderez votre gouvernement à vous.";
        },
      },
      {
        id: "laisser_candidat",
        label: "La laisser se présenter",
        detail: "Neuf pour cent en moins. Une ligne claire en plus.",
        effects: (c) => {
          c.adj({ player: { integrite: 5, charisme: 3 } });
          c.seg("urbains", { soutien: 4 });
          c.seg("periurbain", { soutien: -5 });
          c.flag("campagne_sans_alliance");
          return "Vous déclinez, poliment, définitivement. Elle fera six pour cent et vous manquerez peut-être le second tour à cause de ça. Mais votre campagne aura eu une seule ligne du premier au dernier jour, ce qui, statistiquement, ne se produit presque jamais.";
        },
      },
    ],
  },
  {
    id: "asc_inv_conjoint",
    kind: "ascension",
    titre: "La conversation de la cuisine",
    rarete: "peu_commune",
    texte: (s) =>
      `La veille de l'investiture, ${s.bio.conjointPrenom} pose une question qu'on ne vous avait jamais posée : « Est-ce que tu as pensé à ce que ça nous fait, à nous ? » Ce n'est pas un reproche. C'est pire : c'est une question sincère, et vous n'avez pas la réponse.`,
    choices: [
      {
        id: "promettre_cadre",
        label: "Poser des règles : jamais les enfants, jamais la maison",
        detail: "Un pacte familial. Il tiendra ou pas.",
        effects: (c) => {
          c.rel("conjoint", { loyaute: 12, rancune: -5 });
          c.adj({ player: { endurance: 4 }, hidden: { fatigue: -5 } });
          c.flag("pacte_familial");
          return "Vous convenez de trois règles à deux heures du matin. Elles tiendront trois ans, ce qui est au-dessus de la moyenne nationale. Et le jour où elles céderont, vous aurez au moins su exactement ce que vous étiez en train de sacrifier.";
        },
      },
      {
        id: "associer_conjoint",
        label: "Lui proposer un rôle dans la campagne",
        detail: "Faire de la question un poste.",
        effects: (c) => {
          c.rel("conjoint", { loyaute: 8, ambition: 12 });
          c.adj({ player: { charisme: 4, reseau: 4 }, power: { popularite: 4 } });
          c.flag("conjoint_engage");
          return "Elle accepte, elle est excellente, et elle devient en six mois l'une des voix les plus écoutées de votre entourage. Vous avez résolu la question de la distance en la supprimant — ce qui règle un problème et en arme un autre, plus tard, sur les rôles non élus.";
        },
      },
      {
        id: "eluder_conjoint",
        label: "Botter en touche",
        detail: "« On en reparle après l'élection. »",
        effects: (c) => {
          c.rel("conjoint", { rancune: 12, loyaute: -8 });
          c.adj({ player: { cynisme: 4 } });
          c.flag("conversation_reportee");
          return "Vous dites qu'on en reparlera après. Vous ne mentez pas : vous ne savez simplement pas quoi répondre. La conversation reviendra, à un moment nettement moins commode, et elle commencera exactement par cette phrase-là, citée mot pour mot.";
        },
      },
    ],
  },
];
