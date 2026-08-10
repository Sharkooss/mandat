import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les événements que votre ligne politique ouvre.
//
// Chaque camp a ses maux propres, et ils ne sont pas symétriques : la gauche
// radicale affronte la fuite des capitaux et la violence politique, la droite
// nationale paie en environnement, en rang international et en paix civile.
// Aux deux extrémités, la même porte finit par apparaître — celle qu'on ne
// franchit qu'une fois.
// ---------------------------------------------------------------------------

export const EVENTS_BORDS: GameEvent[] = [
  // =========================================================================
  // GAUCHE — la ligne sociale assumée
  // =========================================================================
  {
    id: "brd_g_nationalisation",
    kind: "standard",
    titre: "Le groupe qui vacille",
    rarete: "peu_commune",
    once: true,
    cond: (s) => s.bord <= -3,
    weight: 3,
    texte:
      "Un groupe industriel de neuf mille salariés dépose son bilan. Les repreneurs annoncent quatre mille suppressions. Votre majorité vous demande de nationaliser ; Bercy chiffre l'opération à six milliards et vous rappelle qu'aucune nationalisation n'a jamais été temporaire.",
    choices: [
      {
        id: "nationaliser_total",
        label: "Nationaliser à cent pour cent",
        detail: "Six milliards. Neuf mille emplois. Un symbole.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ country: { marge: -12, dette: 3, chomage: -0.3 }, power: { syndicats: 14, patronat: -14 } });
          c.seg("periurbain", { soutien: 9 });
          c.seg("public", { soutien: 7 });
          c.log("Vous avez nationalisé un groupe industriel de neuf mille salariés.");
          c.sched("brd_g_fuite_capitaux", 2, 6, 0.6);
          return "L'État détient cent pour cent du capital en onze semaines. Les emplois sont sauvés, la photo devant l'usine est historique, et six milliards viennent de quitter un budget qui n'en avait pas trois. Les agences de notation ont déjà convoqué leurs comités.";
        },
      },
      {
        id: "nationaliser_partiel",
        label: "Entrer au capital à 34 %",
        detail: "Une minorité de blocage. Moins cher, moins beau.",
        effects: (c) => {
          c.adj({ country: { marge: -5, dette: 1 }, power: { syndicats: 6, patronat: -4 } });
          c.seg("periurbain", { soutien: 4 });
          return "Deux milliards pour une minorité de blocage et deux sièges au conseil. Vous empêchez les six pires décisions et vous n'obtenez aucune photo. Les syndicats parlent de « demi-mesure », le patronat de « nationalisation rampante » — c'est en général le signe d'un arbitrage correct.";
        },
      },
      {
        id: "laisser_marche",
        label: "Laisser le repreneur faire",
        detail: "Quatre mille suppressions, zéro milliard.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { chomage: 0.3, marge: 3 }, power: { syndicats: -12, patronat: 8 } });
          c.seg("periurbain", { soutien: -9 });
          c.flag("renoncement_social");
          return "Le repreneur signe, quatre mille lettres partent en mars. Votre propre majorité vous accuse de trahison dans les vingt-quatre heures — et elle a raison sur un point : c'est exactement la décision que vous reprochiez à vos prédécesseurs.";
        },
      },
    ],
  },
  {
    id: "brd_g_fuite_capitaux",
    kind: "standard",
    titre: "Les capitaux s'en vont",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord <= -5,
    weight: 3,
    texte:
      "Onze milliards d'euros ont quitté le pays en six semaines. Deux grandes fortunes ont transféré leur résidence fiscale en direct sur un plateau, le CAC perd quatorze pour cent, et une agence de notation place la France sous perspective négative. Bercy propose le contrôle des changes ; le Trésor est livide.",
    choices: [
      {
        id: "controle_changes",
        label: "Instaurer un contrôle des mouvements de capitaux",
        detail: "Illégal au regard des traités. Efficace à court terme.",
        effects: (c) => {
          c.bord(-3);
          c.derive(2);
          c.adj({ country: { prestige: -12, croissance: -0.5, marge: 4 }, power: { patronat: -18, syndicats: 10 } });
          c.flag("controle_changes");
          c.log("Vous avez instauré un contrôle des capitaux, en rupture avec les traités européens.");
          return "Les mouvements sont gelés en quarante-huit heures par décret. L'hémorragie s'arrête net. La Commission ouvre une procédure d'infraction dans la semaine, deux États membres parlent de suspension des droits de vote, et vous venez de faire un pas dont personne ne revient à moitié.";
        },
      },
      {
        id: "taxe_exit",
        label: "Alourdir l'exit tax et tenir",
        detail: "Dans le cadre. Plus lent. Défendable partout.",
        effects: (c) => {
          c.adj({ country: { marge: 3, prestige: -3, croissance: -0.2 }, power: { patronat: -8 } });
          c.seg("public", { soutien: 5 });
          c.seg("csp", { soutien: -8 });
          return "L'exit tax passe à trente ans de détention, la mesure est validée par le Conseil constitutionnel de justesse. L'hémorragie se réduit sans s'arrêter. Vous avez choisi la seule option qui ne vous coûte pas l'Europe, et elle ne règle qu'à moitié le problème.";
        },
      },
      {
        id: "rassurer_marches",
        label: "Rassurer : recevoir les investisseurs à l'Élysée",
        detail: "Reculer sur deux mesures. Le dire soi-même.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { croissance: 0.4, prestige: 5 }, power: { patronat: 12, syndicats: -12, popularite: -6 } });
          c.seg("public", { soutien: -7 });
          c.flag("recul_marches");
          return "Quarante investisseurs dans la salle des fêtes, deux mesures retirées, un communiqué en anglais. Les capitaux reviennent en trois semaines. Votre base militante a regardé la scène en direct, et l'expression employée dans les cortèges suivants sera « le tournant de la rigueur ».";
        },
      },
    ],
  },
  {
    id: "brd_g_greve_patrons",
    kind: "standard",
    titre: "La grève des patrons",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord <= -5 && s.power.patronat < 35,
    weight: 3,
    texte:
      "Le patronat appelle à une « journée de fermeture » : quatre-vingt mille entreprises baissent le rideau le même jeudi, en signe de protestation. C'est inédit sous la Ve République. Édouard Charvet, en costume, s'installe sur le trottoir devant son propre siège avec une pancarte.",
    choices: [
      {
        id: "requisition",
        label: "Réquisitionner les secteurs vitaux",
        detail: "Énergie, transport, alimentaire. Par décret.",
        effects: (c) => {
          c.derive(2);
          c.bord(-2);
          c.adj({ country: { securite: -3 }, power: { patronat: -20, syndicats: 12 }, hidden: { agitation: 8 } });
          c.rel("charvet", { rancune: 30, loyaute: -20 });
          c.flag("requisition_patronale");
          return "Les réquisitions tombent à six heures du matin, sous escorte de gendarmerie. Le pays tourne. Les images de préfets ouvrant des entrepôts feront le tour du monde et fourniront à vos adversaires, pour dix ans, le mot dont ils avaient besoin.";
        },
      },
      {
        id: "negocier_patrons",
        label: "Recevoir Charvet et lâcher du lest",
        detail: "Un allègement de charges contre la fin du mouvement.",
        effects: (c) => {
          c.bord(1);
          c.adj({ country: { marge: -6 }, power: { patronat: 12, syndicats: -8 } });
          c.rel("charvet", { loyaute: 12 });
          return "Trois heures de tête-à-tête, un allègement ciblé, un communiqué commun. Le mouvement s'arrête le vendredi. Vous avez payé six milliards pour une journée de rideaux baissés — et vous avez appris que le patronat aussi sait faire grève, ce qui change durablement le rapport de forces.";
        },
      },
      {
        id: "ignorer_patrons",
        label: "Ne rien faire et le dire",
        detail: "« Le pays a survécu à un jeudi. »",
        effects: (c) => {
          c.adj({ power: { popularite: 5, patronat: -8 }, country: { croissance: -0.2 } });
          c.seg("periurbain", { soutien: 6 });
          c.seg("public", { soutien: 5 });
          c.press("« LE JEUDI OÙ RIEN N'EST ARRIVÉ » — la journée patronale tourne court", "favorable");
          return "Vous laissez passer la journée sans un mot, puis vous en faites une phrase le soir : « Le pays a survécu à un jeudi. » Le mouvement s'effondre de ridicule. Charvet ne recommencera pas — et il ne vous le pardonnera pas non plus.";
        },
      },
    ],
  },
  {
    id: "brd_g_attentat_milice",
    kind: "standard",
    titre: "Le groupe armé",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord <= -6,
    weight: 4,
    texte:
      "Ternay pose un dossier fin sur la table : un groupe se réclamant de la « résistance nationale » a fait sauter un transformateur électrique et deux permanences. Quatre-vingt-dix mille foyers privés de courant, aucun mort — pour l'instant. Le groupe compte d'anciens militaires, et sa liste de cibles vous inclut.",
    choices: [
      {
        id: "dissolution_groupe",
        label: "Dissoudre et interpeller en masse",
        detail: "Deux cents perquisitions à l'aube.",
        effects: (c) => {
          c.derive(1);
          c.adj({ country: { securite: 4 }, hidden: { agitation: 6, assassinat: -8 }, power: { armee: -6 } });
          c.log("Vous avez fait démanteler un groupe armé d'extrême droite par une vague d'interpellations.");
          return "Deux cent quatorze perquisitions, trente-huit gardes à vue, quatre caches d'armes. Le noyau est brisé. Une partie de l'armée digère mal la méthode, et vingt militants relâchés faute de preuves deviendront la génération suivante — c'est le mécanisme, et il est connu.";
        },
      },
      {
        id: "infiltration_groupe",
        label: "Laisser Ternay infiltrer",
        detail: "Ne rien faire pendant des mois. Remonter tout le réseau.",
        effects: (c) => {
          c.adj({ hidden: { assassinat: 5, paranoia: 6 }, country: { securite: 2 } });
          c.rel("ternay", { loyaute: 8 });
          c.sched("brd_g_attentat_suite", 2, 5, 0.55);
          c.flag("reseau_infiltre");
          return "Ternay obtient six mois et deux sources à l'intérieur. C'est la bonne décision policière et une décision politique intenable : pendant six mois, chaque attentat qui surviendra sera un attentat que vous aviez choisi de laisser arriver.";
        },
      },
      {
        id: "apaiser_groupe",
        label: "Baisser d'un ton dans les discours",
        detail: "La violence répond à quelque chose. Le reconnaître.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { cohesion: 4 }, hidden: { agitation: -6, assassinat: -4 }, power: { popularite: -5 } });
          c.seg("public", { soutien: -6 });
          c.flag("ton_baisse");
          return "Vous retirez trois mots de votre vocabulaire et vous recevez deux syndicats agricoles à l'Élysée. La tension baisse réellement. Votre camp parle de capitulation, et vous n'avez aucun moyen de prouver ce que vous avez évité — c'est le sort de toutes les désescalades.";
        },
      },
    ],
  },
  {
    id: "brd_g_attentat_suite",
    kind: "standard",
    titre: "Le rapport qu'on vous avait remis",
    rarete: "rare",
    once: true,
    weight: 0,
    texte:
      "Le groupe infiltré a frappé : une voiture piégée devant une préfecture, deux morts, dont un agent d'accueil de vingt-six ans. Ternay avait la source. Ternay avait la date, à quarante-huit heures près. Il est dans votre bureau et il ne se défend pas.",
    choices: [
      {
        id: "assumer_infiltration",
        label: "Assumer publiquement la décision",
        detail: "Dire qu'on savait, dire pourquoi on a attendu.",
        effects: (c) => {
          c.adj({ player: { integrite: 8 }, power: { popularite: -10, presse: 6 }, hidden: { fatigue: 8 } });
          c.log("Vous avez reconnu publiquement avoir laissé une infiltration se poursuivre avant un attentat meurtrier.");
          return "Vous expliquez tout, en direct, y compris l'arbitrage et sa date. Le pays encaisse mal et respecte à contrecœur. Vous serez le président qui a dit la vérité sur un attentat — et la famille de l'agent d'accueil refusera de vous serrer la main aux obsèques, devant les caméras.";
        },
      },
      {
        id: "sacrifier_ternay",
        label: "Limoger Ternay",
        detail: "Il ne se défendra pas. C'est bien le problème.",
        effects: (c) => {
          c.adj({ power: { popularite: 4 }, player: { cynisme: 7, integrite: -6 } });
          c.rel("ternay", { rancune: 25, loyaute: -30 });
          if (c.s.characters["ternay"]) c.s.characters["ternay"].enPoste = false;
          c.flag("ternay_limoge");
          return "Le communiqué sort à vingt-deux heures : « défaillance des services ». Ternay part sans un mot, ce qu'il fera toujours. Il connaît l'intégralité de vos dossiers, il ne travaille plus pour vous, et il n'a désormais plus aucune raison de vous protéger.";
        },
      },
      {
        id: "silence_attentat",
        label: "Ne rien dire de l'infiltration",
        detail: "Deux morts, un secret, un service qui sait.",
        effects: (c) => {
          c.derive(1);
          c.adj({ player: { integrite: -10 }, hidden: { paranoia: 10 }, power: { presse: -4 } });
          c.flag("secret_attentat");
          c.sched("brd_g_fuite_attentat", 4, 12, 0.4);
          return "L'enquête suit son cours, la source n'apparaît nulle part, et le dossier d'infiltration est classé sous un intitulé sans rapport. Onze personnes savent. C'est neuf de trop, et la seule question désormais est de savoir laquelle parlera, et quand.";
        },
      },
    ],
  },
  {
    id: "brd_g_fuite_attentat",
    kind: "intrigue",
    titre: "La source parle",
    rarete: "legendaire",
    once: true,
    weight: 0,
    texte:
      "Louise Ferrand publie à six heures : la note d'infiltration, la date, l'arbitrage, votre paraphe en bas à droite. Elle a tout. La famille de l'agent d'accueil a déposé plainte pour homicide involontaire contre X à onze heures. L'Assemblée demande une commission d'enquête à midi.",
    choices: [
      {
        id: "commission_attentat",
        label: "Accepter la commission d'enquête",
        detail: "Tout ouvrir. Y compris ce qui vous accable.",
        effects: (c) => {
          c.adj({ player: { integrite: 6 }, power: { popularite: -12, presse: 8, justice: 6 } });
          c.log("Une commission d'enquête parlementaire a été ouverte sur votre arbitrage avant l'attentat.");
          return "Vous ouvrez les archives et vous vous présentez vous-même devant la commission, six heures d'audition retransmises. Le rapport sera dur, nuancé, et publié. C'est la seule sortie qui vous laisse une présidence, et elle coûte à peu près tout le reste.";
        },
      },
      {
        id: "secret_defense",
        label: "Opposer le secret défense",
        detail: "C'est légal. C'est aussi un aveu.",
        effects: (c) => {
          c.derive(3);
          c.adj({ power: { presse: -14, justice: -10, popularite: -8 }, hidden: { paranoia: 10 } });
          c.rel("ferrand", { rancune: 20 });
          c.flag("secret_defense_attentat");
          return "Le secret défense est opposé sur onze pièces, dont celle qui porte votre paraphe. Juridiquement, l'affaire s'arrête. Politiquement, elle commence : un président qui classifie sa propre signature vient d'expliquer au pays ce qu'il y avait dessus.";
        },
      },
    ],
  },
  {
    id: "brd_g_revolution_fiscale",
    kind: "standard",
    titre: "L'impôt de rupture",
    rarete: "peu_commune",
    once: true,
    cond: (s) => s.bord <= -4,
    weight: 2.5,
    texte:
      "Votre majorité dépose un impôt exceptionnel de quinze pour cent sur les patrimoines au-dessus de dix millions. Rendement estimé : vingt-deux milliards, à condition que personne ne parte. Le Conseil constitutionnel a fait savoir, par une voie qui n'existe officiellement pas, qu'il regarderait le texte « avec attention ».",
    choices: [
      {
        id: "passer_impot",
        label: "Faire voter le texte tel quel",
        detail: "Vingt-deux milliards, si tout se passe bien.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ country: { marge: 10, croissance: -0.3 }, power: { patronat: -16, syndicats: 10 } });
          c.seg("public", { soutien: 8 });
          c.seg("periurbain", { soutien: 6 });
          c.seg("csp", { soutien: -14 });
          c.sched("brd_g_fuite_capitaux", 1, 4, 0.7);
          c.log("Vous avez fait voter un impôt exceptionnel de quinze pour cent sur les grands patrimoines.");
          return "Le texte passe en décembre. Onze milliards rentrent la première année au lieu de vingt-deux — l'écart s'appelle la Belgique, la Suisse et le Portugal. C'est la mesure la plus populaire et la moins rentable de votre mandat, et les deux faits sont liés.";
        },
      },
      {
        id: "amender_impot",
        label: "Le sécuriser juridiquement d'abord",
        detail: "Plafonnement, étalement, exonérations d'outil de travail.",
        effects: (c) => {
          c.adj({ country: { marge: 6 }, power: { patronat: -6, syndicats: -3 }, player: { strategie: 6 } });
          c.seg("csp", { soutien: -6 });
          return "Six semaines de travail avec le Conseil d'État, un texte plus étroit et incontestable. Neuf milliards annuels, durables, jamais censurés. Votre aile gauche parle de « texte dénaturé » — elle a raison sur la forme et tort sur l'encaissement.";
        },
      },
      {
        id: "retirer_impot",
        label: "Retirer le texte",
        detail: "Le rendement ne justifie pas la panique.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { croissance: 0.3 }, power: { patronat: 10, syndicats: -10, popularite: -8 } });
          c.seg("public", { soutien: -8 });
          c.flag("recul_fiscal");
          return "Vous retirez le texte trois jours avant le vote, en invoquant un « calendrier » que personne ne croit. Les marchés respirent, votre majorité étouffe, et le mot « renoncement » entre dans le vocabulaire de vos propres députés.";
        },
      },
    ],
  },

  // =========================================================================
  // DROITE — l'ordre, la frontière, et leurs factures
  // =========================================================================
  {
    id: "brd_d_normes",
    kind: "standard",
    titre: "Le choc de simplification",
    rarete: "peu_commune",
    once: true,
    cond: (s) => s.bord >= 3,
    weight: 3,
    texte:
      "Le patronat réclame la suppression de quatre cents normes « qui étranglent l'activité ». La liste est prête. Vos services signalent que soixante-dix d'entre elles sont environnementales et onze relèvent de la sécurité industrielle.",
    choices: [
      {
        id: "tout_supprimer",
        label: "Supprimer les quatre cents",
        detail: "Un décret, une signature, un choc de compétitivité.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { croissance: 0.5, environnement: -10, securite: -3 }, power: { patronat: 16, syndicats: -10 } });
          c.seg("independants", { soutien: 8 });
          c.seg("urbains", { soutien: -6 });
          c.sched("brd_d_accident_industriel", 3, 9, 0.45);
          c.log("Vous avez supprimé quatre cents normes d'un seul décret.");
          return "Le décret paraît au Journal officiel un 27 décembre. La croissance gagne un demi-point, les créations d'entreprises bondissent, et onze normes de sécurité industrielle ont disparu dans le lot sans que personne ne les ait relues.";
        },
      },
      {
        id: "trier_normes",
        label: "En supprimer trois cent vingt, garder les autres",
        detail: "Le tri prend six mois. Il évite les catastrophes.",
        effects: (c) => {
          c.adj({ country: { croissance: 0.3, environnement: -3 }, power: { patronat: 8 }, player: { strategie: 6 } });
          c.seg("independants", { soutien: 5 });
          return "Six mois d'expertise, trois cent vingt suppressions, quatre-vingts maintiens motivés un par un. Le patronat parle de « demi-choc », ce qui est exact. Aucun préfet ne vous appellera jamais un dimanche pour vous parler d'une usine, et vous ne saurez pas pourquoi.";
        },
      },
      {
        id: "refuser_normes",
        label: "Refuser la liste en bloc",
        detail: "Contre votre propre camp.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { environnement: 4 }, power: { patronat: -12, popularite: -4 } });
          c.rel("charvet", { rancune: 12 });
          return "Vous renvoyez la liste avec une note de trois lignes. Charvet fait savoir dans quatre interviews que « ce gouvernement ne comprend rien à l'entreprise ». Vos électeurs ne comprennent pas non plus. Vous avez peut-être évité quelque chose ; vous ne le saurez jamais.";
        },
      },
    ],
  },
  {
    id: "brd_d_accident_industriel",
    kind: "standard",
    titre: "L'usine de Villebrun",
    rarete: "rare",
    once: true,
    weight: 0,
    texte:
      "Un réservoir de solvants a cédé à quatre heures du matin : sept morts, quarante blessés, un nuage sur douze kilomètres et trois écoles évacuées. La norme d'inspection décennale de ce type de cuve figurait dans la liste supprimée l'an dernier. Un journaliste a déjà le numéro de décret.",
    choices: [
      {
        id: "reconnaitre_lien",
        label: "Reconnaître le lien avec le décret",
        detail: "Et rétablir les normes dans la semaine.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { environnement: 6, securite: 3 }, power: { popularite: -10, presse: 6 }, player: { integrite: 8 } });
          c.log("Vous avez reconnu publiquement le lien entre une déréglementation et une catastrophe industrielle.");
          return "Vous reconnaissez le lien devant les familles, en Conseil des ministres, puis à la télévision. Les normes sont rétablies en huit jours. Le pays vous en veut et vous croit — c'est la combinaison la plus douloureuse et la seule qui laisse une présidence debout.";
        },
      },
      {
        id: "nier_lien",
        label: "Contester tout lien de causalité",
        detail: "L'expertise prendra deux ans. Vous en avez trois.",
        effects: (c) => {
          c.derive(1);
          c.adj({ player: { integrite: -10, cynisme: 6 }, power: { presse: -10, justice: -5 }, country: { cohesion: -4 } });
          c.rel("ferrand", { rancune: 15 });
          c.flag("villebrun_nie");
          return "« Aucun élément ne permet d'établir un lien. » La phrase est juridiquement prudente et humainement insoutenable. L'expertise judiciaire l'établira dans trente mois, quand plus personne ne regardera — sauf ceux qui font des documentaires.";
        },
      },
      {
        id: "responsable_industriel",
        label: "Charger l'industriel",
        detail: "Il a fermé les yeux aussi. C'est vrai. Ça n'est pas suffisant.",
        effects: (c) => {
          c.adj({ power: { patronat: -14, popularite: -3 }, player: { cynisme: 5 }, country: { securite: 2 } });
          c.rel("charvet", { rancune: 16 });
          return "Perquisition au siège, mise en examen du directeur de site, discours très dur sur « les industriels qui trichent ». Tout cela est fondé. Rien de tout cela n'explique pourquoi l'inspection décennale n'existait plus, et un journaliste posera la question à la conférence suivante.";
        },
      },
    ],
  },
  {
    id: "brd_d_secheresse",
    kind: "monde",
    titre: "La quatrième année sans eau",
    rarete: "peu_commune",
    once: true,
    cond: (s) => s.bord >= 4 || s.country.environnement < 32,
    weight: 3,
    texte:
      "Quarante-huit départements en restriction, deux cents communes livrées par citernes, et une récolte de maïs amputée de moitié. Les agriculteurs demandent des méga-bassines, les écologistes bloquent les chantiers, et deux mille gendarmes séparent les deux depuis samedi.",
    choices: [
      {
        id: "bassines_force",
        label: "Construire les bassines sous protection policière",
        detail: "Les agriculteurs d'abord. Le reste ensuite.",
        effects: (c) => {
          c.bord(2);
          c.derive(1);
          c.adj({ country: { environnement: -8, securite: -3 }, hidden: { agitation: 10 }, power: { popularite: 3 } });
          c.seg("ruraux", { soutien: 10 });
          c.seg("urbains", { soutien: -8 });
          c.seg("jeunes", { soutien: -6 });
          c.flag("bassines_forcees");
          return "Les chantiers reprennent sous escorte, avec deux cents blessés en trois week-ends et une image de gendarme mobile face à un champ qui fera le tour de l'Europe. Les bassines seront pleines l'an prochain. La nappe, elle, aura encore baissé.";
        },
      },
      {
        id: "plan_eau",
        label: "Un plan de partage de l'eau, contraignant pour tous",
        detail: "Quotas par bassin. Personne ne sera content.",
        effects: (c) => {
          c.adj({ country: { environnement: 6, marge: -5, cohesion: 3 }, player: { strategie: 7 } });
          c.seg("ruraux", { soutien: -4 });
          c.seg("urbains", { soutien: 5 });
          c.log("Vous avez imposé un partage contraignant de l'eau par bassin versant.");
          return "Des quotas par bassin, des compteurs obligatoires, une conversion financée sur six ans. Les syndicats agricoles bloquent trois préfectures pendant dix jours. C'est la seule décision qui règle quelque chose, et elle coûtera exactement ce qu'elle vaut.";
        },
      },
      {
        id: "indemniser_secheresse",
        label: "Indemniser et ne rien changer",
        detail: "Un milliard. Chaque année, désormais.",
        effects: (c) => {
          c.adj({ country: { marge: -8, environnement: -3 }, power: { popularite: 4 } });
          c.seg("ruraux", { soutien: 7 });
          c.flag("indemnisation_reflexe");
          return "Un milliard de calamité agricole versé en six semaines, sans une ligne sur les pratiques. Tout le monde vous remercie. Vous venez d'instaurer une dépense annuelle permanente et croissante que votre successeur découvrira dans une annexe budgétaire.";
        },
      },
    ],
  },
  {
    id: "brd_d_boycott",
    kind: "monde",
    titre: "Le boycott",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord >= 6,
    weight: 3,
    texte:
      "Onze pays ont rappelé leur ambassadeur après votre dernière loi. Deux d'entre eux appellent au boycott des produits français, un troisième suspend un contrat d'armement de quatre milliards. Le Quai d'Orsay parle d'une « séquence sans précédent depuis 1962 ».",
    choices: [
      {
        id: "tenir_boycott",
        label: "Tenir. Répondre par la réciprocité.",
        detail: "Rappeler nos ambassadeurs aussi. Assumer l'isolement.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { prestige: -14, croissance: -0.5, chomage: 0.3 }, power: { popularite: 6, armee: 5 } });
          c.seg("periurbain", { soutien: 7 });
          c.seg("csp", { soutien: -8 });
          c.flag("isolement_diplomatique");
          c.log("La France s'est retrouvée diplomatiquement isolée après une escalade de rétorsions.");
          return "Onze rappels d'ambassadeurs en réciprocité, un discours de fierté nationale, quatre-vingt-deux pour cent d'adhésion dans votre électorat. Les exportations agroalimentaires perdent neuf pour cent en un trimestre, et personne ne fera le lien à voix haute.";
        },
      },
      {
        id: "amender_loi",
        label: "Amender la loi sur deux points",
        detail: "Garder le principe, retirer ce qui est indéfendable.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { prestige: 6, croissance: 0.2 }, power: { popularite: -6 } });
          c.seg("periurbain", { soutien: -5 });
          return "Deux articles retirés, la loi reste. Sept ambassadeurs reviennent, le contrat d'armement est débloqué. Votre camp parle de recul, l'étranger de « geste insuffisant », et vous obtenez le pire des deux mondes avec quatre milliards en plus.";
        },
      },
      {
        id: "pivot_alliances",
        label: "Changer d'alliés",
        detail: "Trois capitales qui, elles, ne critiquent jamais rien.",
        effects: (c) => {
          c.bord(2);
          c.derive(1);
          c.adj({ country: { prestige: -8, croissance: 0.2 }, power: { armee: 6 } });
          c.rel("weiss", { loyaute: -20, rancune: 15 });
          c.flag("pivot_alliances");
          return "Trois voyages en cinq semaines, des contrats signés vite et des conférences de presse sans questions. Les nouveaux partenaires ne vous font aucun reproche sur l'état de droit — c'est précisément leur intérêt commercial, et c'est ce qui devrait vous inquiéter.";
        },
      },
    ],
  },
  {
    id: "brd_d_cerveaux",
    kind: "standard",
    titre: "La fuite des cerveaux",
    rarete: "peu_commune",
    once: true,
    cond: (s) => s.bord >= 5,
    weight: 2.5,
    texte:
      "Trois cent quarante chercheurs ont signé une tribune annonçant leur départ. Deux prix internationaux ont refusé une chaire à Paris. Un classement universitaire fait sortir la France de son top cinquante, et le mot employé par les recruteurs étrangers est « climat ».",
    choices: [
      {
        id: "retenir_chercheurs",
        label: "Un plan de trois milliards pour la recherche",
        detail: "Salaires, laboratoires, et un discours de réparation.",
        effects: (c) => {
          c.bord(-1);
          c.adj({ country: { marge: -8, prestige: 6, croissance: 0.2 }, power: { popularite: -3 } });
          c.seg("urbains", { soutien: 6 });
          c.seg("public", { soutien: 5 });
          return "Trois milliards, deux cents chaires, un discours à la Sorbonne où vous employez le mot « erreur ». Cent quatre-vingts départs sont annulés. Votre aile droite considère l'opération comme une reddition à des gens qui vous détestent — ce qu'elle est aussi.";
        },
      },
      {
        id: "mepriser_chercheurs",
        label: "« Qu'ils partent »",
        detail: "Une phrase. Elle fera le tour du monde.",
        effects: (c) => {
          c.bord(2);
          c.adj({ country: { prestige: -10, croissance: -0.3 }, power: { popularite: 4 } });
          c.seg("urbains", { soutien: -10 });
          c.seg("jeunes", { soutien: -8 });
          c.seg("periurbain", { soutien: 5 });
          c.flag("mepris_recherche");
          return "« La France ne retiendra personne. » La formule est reprise par votre électorat avec enthousiasme et par quarante rédactions étrangères avec effroi. Le nombre de départs triple en six mois. Les effets se verront dans quinze ans, sous un autre nom que le vôtre.";
        },
      },
      {
        id: "recruter_ailleurs",
        label: "Recruter massivement à l'étranger",
        detail: "Ils partent, d'autres viennent. Contradiction assumée.",
        effects: (c) => {
          c.adj({ country: { prestige: 3, croissance: 0.2, cohesion: -3 }, player: { strategie: 5 } });
          c.seg("periurbain", { soutien: -5 });
          c.flag("visas_talents");
          return "Un visa « talents » ouvert en quatre mois, deux mille chercheurs recrutés, dont beaucoup viennent de pays que vos discours désignent chaque semaine. La contradiction est totale, la mesure fonctionne, et un député de votre majorité la dénoncera en séance dans six semaines.";
        },
      },
    ],
  },
  {
    id: "brd_d_quartiers",
    kind: "standard",
    titre: "La nuit de trop",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord >= 6,
    weight: 3.5,
    texte:
      "Un contrôle qui tourne mal, un adolescent mort, et quatre nuits d'émeutes dans deux cent dix communes. Mazeau demande l'état d'urgence et le couvre-feu pour les mineurs. Ternay signale que les réseaux appellent à « monter à l'Élysée » samedi.",
    choices: [
      {
        id: "urgence_quartiers",
        label: "État d'urgence et couvre-feu",
        detail: "Rétablir l'ordre. Par tous les moyens prévus par la loi.",
        effects: (c) => {
          c.bord(2);
          c.derive(2);
          c.adj({ country: { securite: 6, cohesion: -10 }, hidden: { agitation: -8, assassinat: 5 }, power: { popularite: 6 } });
          c.seg("quartiers", { soutien: -14, participation: -8 });
          c.seg("pavillonnaires", { soutien: 8 });
          c.flag("etat_urgence");
          c.log("Vous avez décrété l'état d'urgence après quatre nuits d'émeutes.");
          return "Onze mille interpellations en six jours, trois mille comparutions immédiates, le calme en une semaine. Votre cote monte de six points. Dans deux cent dix communes, une génération entière vient d'apprendre de quel côté se tient l'État, et elle ne l'oubliera pas.";
        },
      },
      {
        id: "reconnaitre_quartiers",
        label: "Reconnaître la faute du contrôle",
        detail: "Nommer les choses avant d'exiger le calme.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ country: { cohesion: 6, securite: -2 }, hidden: { agitation: -10 }, power: { popularite: -8, armee: -5 } });
          c.seg("quartiers", { soutien: 10 });
          c.seg("pavillonnaires", { soutien: -8 });
          c.rel("mazeau", { rancune: 12 });
          return "Vous employez le mot « faute » à vingt heures, avant toute demande de calme. Les nuits s'arrêtent en trois jours sans un blindé. Les syndicats de police appellent à la « grève des interpellations », et Mazeau vous laisse entendre qu'il pourrait ne pas rester.";
        },
      },
      {
        id: "double_quartiers",
        label: "Fermeté immédiate, justice ensuite",
        detail: "Rétablir l'ordre cette nuit, sanctionner le policier lundi.",
        effects: (c) => {
          c.adj({ country: { securite: 3, cohesion: 2 }, hidden: { agitation: -7 }, player: { strategie: 6 } });
          c.seg("quartiers", { soutien: 3 });
          c.seg("pavillonnaires", { soutien: 3 });
          return "Couvre-feu de trois nuits, puis mise en examen du policier annoncée depuis le perron. Les deux camps vous accusent d'avoir cédé à l'autre, ce qui est le seul indicateur fiable qu'on a tenu les deux bouts. Le calme revient sans qu'aucune photo n'entre dans l'Histoire.";
        },
      },
    ],
  },
  {
    id: "brd_d_preference",
    kind: "intrigue",
    titre: "La préférence nationale",
    rarete: "rare",
    once: true,
    cond: (s) => s.bord >= 7,
    weight: 3,
    texte:
      "Votre majorité dépose un texte réservant les prestations sociales non contributives aux nationaux. Le Conseil d'État rend un avis défavorable en onze pages, le Conseil constitutionnel censurera « à quatre-vingt-quinze pour cent » selon Denise Alberti. Vos électeurs, eux, en font le test de votre sincérité.",
    choices: [
      {
        id: "passer_preference",
        label: "Faire voter le texte et affronter la censure",
        detail: "Perdre devant le Conseil, gagner devant le pays.",
        effects: (c) => {
          c.bord(2);
          c.derive(2);
          c.adj({ country: { cohesion: -10, prestige: -8 }, power: { popularite: 8, justice: -10 } });
          c.rel("alberti", { rancune: 20 });
          c.seg("periurbain", { soutien: 9 });
          c.seg("quartiers", { soutien: -12 });
          c.flag("preference_censuree");
          c.log("Vous avez fait voter un texte de préférence nationale, censuré par le Conseil constitutionnel.");
          return "Le texte est voté, censuré en six semaines, et vous en faites un meeting : « Ce sont neuf juges qui ont décidé contre soixante-sept millions de Français. » C'est la première fois que vous attaquez le Conseil constitutionnel par son nom. Ce ne sera pas la dernière.";
        },
      },
      {
        id: "referendum_preference",
        label: "Passer par référendum",
        detail: "Contourner le Conseil par le peuple. C'est l'arme lourde.",
        effects: (c) => {
          c.bord(3);
          c.derive(3);
          c.adj({ country: { cohesion: -12, prestige: -10 }, hidden: { agitation: 12 }, power: { justice: -14 } });
          c.seg("periurbain", { soutien: 10 });
          c.seg("urbains", { soutien: -10 });
          c.flag("referendum_preference");
          c.sched("brd_bascule_droite", 2, 6, 0.5);
          return "Vous convoquez un référendum sur un texte que le juge constitutionnel a déclaré contraire au bloc de constitutionnalité. Quatre professeurs de droit démissionnent de leurs commissions, deux ministres partent, et vous découvrez que la seule limite qui vous reste est le résultat du vote.";
        },
      },
      {
        id: "renoncer_preference",
        label: "Enterrer le texte",
        detail: "Décevoir votre base plutôt que casser un contre-pouvoir.",
        effects: (c) => {
          c.bord(-2);
          c.adj({ power: { popularite: -10, justice: 8 }, country: { cohesion: 4 } });
          c.seg("periurbain", { soutien: -9 });
          c.flag("renoncement_preference");
          return "Le texte n'est jamais inscrit à l'ordre du jour, sans explication publique. Votre base comprend parfaitement et vous le fait payer pendant deux ans. Vous avez sauvé quelque chose d'abstrait au prix de quelque chose de très concret : votre majorité.";
        },
      },
    ],
  },

  // =========================================================================
  // LE CENTRE — le marais a lui aussi ses épreuves
  // =========================================================================
  {
    id: "brd_c_marais",
    kind: "standard",
    titre: "Le président de personne",
    rarete: "peu_commune",
    once: true,
    cond: (s) => Math.abs(s.bord) <= 1 && s.turnCount >= 4,
    weight: 2.5,
    texte:
      "Une enquête d'opinion pose une question inhabituelle : « Ce président est-il de gauche ou de droite ? » Quarante-quatre pour cent répondent « ni l'un ni l'autre », et parmi eux, les trois quarts ajoutent « et il ne sait pas non plus ». Camille Roze pose le tableau sur votre bureau sans commentaire.",
    choices: [
      {
        id: "assumer_centre",
        label: "Assumer le centre comme une doctrine",
        detail: "En faire une méthode plutôt qu'une absence.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 6, strategie: 4 }, power: { presse: 8, popularite: 3 } });
          c.seg("pavillonnaires", { soutien: 5 });
          c.seg("csp", { soutien: 4 });
          c.flag("doctrine_centre");
          return "Un discours de cinquante minutes sur l'arbitrage comme forme supérieure du gouvernement. Les éditorialistes adorent, les militants baîllent, et la question ne reviendra plus pendant dix-huit mois. C'est tout ce qu'on peut demander à un discours.";
        },
      },
      {
        id: "virer_gauche",
        label: "Trancher enfin : à gauche",
        detail: "Un budget, un symbole, une base.",
        effects: (c) => {
          c.bord(-3);
          c.adj({ country: { marge: -6, services: 4 }, power: { syndicats: 10, patronat: -8 } });
          c.seg("public", { soutien: 8 });
          c.seg("csp", { soutien: -6 });
          c.log("Vous avez rompu avec le centrisme pour une ligne clairement sociale.");
          return "Un collectif budgétaire de neuf milliards pour l'hôpital et l'école, annoncé sans amortisseur. La gauche du pays découvre qu'elle a peut-être un président ; la droite découvre qu'elle n'en a plus. Vous existez enfin, ce qui coûte immédiatement la moitié de vos soutiens.";
        },
      },
      {
        id: "virer_droite",
        label: "Trancher enfin : à droite",
        detail: "L'ordre et le travail, sans guillemets.",
        effects: (c) => {
          c.bord(3);
          c.adj({ country: { securite: 5, croissance: 0.3, services: -3 }, power: { patronat: 10, syndicats: -10 } });
          c.seg("pavillonnaires", { soutien: 8 });
          c.seg("retraites", { soutien: 5 });
          c.seg("jeunes", { soutien: -6 });
          c.log("Vous avez rompu avec le centrisme pour une ligne d'autorité et de compétitivité.");
          return "Deux lois en six semaines : allègements ciblés et peines planchers. Le pays comprend enfin qui vous êtes, et la moitié qui vous avait élu par défaut se sent trompée. Vous ne serez plus jamais accusé de flou — ce qui était le but, et le seul bénéfice.";
        },
      },
    ],
  },

  // =========================================================================
  // LES BASCULES — la même porte, aux deux extrémités
  // =========================================================================
  {
    id: "brd_bascule_gauche",
    kind: "intrigue",
    titre: "Le Comité de salut public",
    rarete: "legendaire",
    once: true,
    weight: (s) => (s.bord <= -8 && s.derive >= 6 ? 5 : 0),
    texte:
      "Tout est prêt et personne ne l'a vraiment décidé. Les décrets de réquisition sont rédigés, les préfets remplacés par des « commissaires du peuple », la Bourse fermée depuis onze jours et les six derniers quotidiens indépendants placés sous administration provisoire. Il ne manque qu'une signature pour instituer un Comité de salut public doté des pleins pouvoirs économiques — « le temps de la transition », précise le texte, sans dire de quoi vers quoi.",
    choices: [
      {
        id: "signer_comite",
        label: "Signer les pleins pouvoirs",
        detail: "L'économie dirigée, la presse encadrée, l'opposition suspendue.",
        effects: (c) => {
          c.derive(4);
          c.bord(-2);
          c.adj({
            country: { croissance: -1.2, prestige: -20, cohesion: -10 },
            power: { presse: -30, justice: -25, patronat: -30, syndicats: 15 },
            hidden: { assassinat: 15, coup: 12, agitation: 10 },
          });
          c.flag("republique_populaire");
          c.log("Vous avez institué un Comité de salut public doté des pleins pouvoirs.");
          return "Vous signez à 23h10, seul, avec un stylo qu'on vous tend. Le lendemain, le pays fonctionne — mal, mais il fonctionne, et c'est l'argument que vous emploierez chaque jour désormais. Il n'y a plus de calendrier électoral, seulement une transition, et les transitions n'ont pas de terme écrit.";
        },
      },
      {
        id: "refuser_comite",
        label: "Refuser et rouvrir la Bourse",
        detail: "Rendre ce qu'on a pris. Sans rien obtenir en échange.",
        effects: (c) => {
          c.derive(-3);
          c.bord(2);
          c.adj({ country: { prestige: 8, croissance: 0.4 }, power: { presse: 15, justice: 12, patronat: 12, syndicats: -14, popularite: -10 } });
          c.flag("bascule_refusee");
          c.log("Au bord de l'économie dirigée, vous avez rendu les pouvoirs que vous aviez pris.");
          return "Vous refusez de signer, la Bourse rouvre le lundi, les administrations provisoires sont levées en trois semaines. Vos plus proches soutiens parlent de trahison et deux d'entre eux démissionnent en séance. Vous venez de faire la seule chose que personne n'attendait : vous arrêter.";
        },
      },
      {
        id: "referendum_comite",
        label: "Soumettre les pleins pouvoirs au peuple",
        detail: "Se faire donner ce qu'on allait prendre.",
        effects: (c) => {
          c.derive(2);
          const gagne = c.s.power.popularite > 42 || c.rng.chance(0.4);
          if (gagne) {
            c.flag("republique_populaire");
            c.adj({ country: { prestige: -14 }, power: { presse: -20, justice: -18 }, hidden: { assassinat: 10 } });
            c.log("Un référendum a accordé les pleins pouvoirs économiques au Comité de salut public.");
            return "Cinquante-sept pour cent de oui, participation record. Le Comité est institué par le suffrage universel, ce qui lui donne exactement ce dont il manquait : un argument imparable contre tous ceux qui le contesteront. Les urnes ont validé la fin des urnes, et personne n'a relevé la contradiction avant le lendemain.";
          }
          c.adj({ power: { popularite: -14, parti: -14 }, hidden: { agitation: 10 } });
          c.flag("bascule_rejetee");
          return "Soixante-trois pour cent de non. Le pays a compris ce qu'on lui demandait et il a répondu très précisément. Le Comité est enterré le soir même, votre majorité se fissure en trois blocs, et vous gouvernerez le reste du mandat avec un désaveu personnel affiché en permanence.";
        },
      },
    ],
  },
  {
    id: "brd_bascule_droite",
    kind: "intrigue",
    titre: "L'état national d'exception",
    rarete: "legendaire",
    once: true,
    weight: (s) => (s.bord >= 8 && s.derive >= 6 ? 5 : 0),
    texte:
      "Le projet tient en quatorze articles et il est déjà paraphé par tout le monde sauf vous. Article 3 : suspension de la juridiction constitutionnelle « pour la durée de l'état national ». Article 7 : registre administratif des ressortissants et des binationaux. Article 11 : dissolution par décret de toute association « portant atteinte à la cohésion nationale ». Denise Alberti a demandé à vous voir. Vous n'avez pas répondu.",
    choices: [
      {
        id: "signer_etat_national",
        label: "Promulguer les quatorze articles",
        detail: "Le registre, les dissolutions, la suspension du juge.",
        effects: (c) => {
          c.derive(4);
          c.bord(2);
          c.adj({
            country: { cohesion: -20, prestige: -25, securite: 8, environnement: -6 },
            power: { presse: -25, justice: -30, armee: 10 },
            hidden: { agitation: 14, assassinat: 12, coup: 8 },
          });
          c.rel("alberti", { rancune: 40, loyaute: -30 });
          c.flag("etat_national");
          c.flag("etat_urgence");
          c.log("Vous avez promulgué l'état national d'exception : registre, dissolutions, juge constitutionnel suspendu.");
          return "La promulgation a lieu un vendredi soir, sans conférence de presse. Denise Alberti démissionne dans la nuit par une lettre de quatre lignes que trois journaux publient en fac-similé. Le registre est opérationnel en huit semaines. Il fonctionne très bien : c'est toujours ce qui frappe le plus, après coup.";
        },
      },
      {
        id: "amender_etat_national",
        label: "Ne garder que la sécurité, retirer le registre",
        detail: "Les articles 3 et 7 sautent. Le reste passe.",
        effects: (c) => {
          c.derive(1);
          c.adj({ country: { securite: 5, cohesion: -4 }, power: { justice: -6, popularite: -5 } });
          c.seg("periurbain", { soutien: -5 });
          c.flag("exception_limitee");
          return "Vous retirez le registre et la suspension du juge, vous gardez les neuf articles sécuritaires. Le texte reste très dur et il reste dans le cadre — la différence entre les deux n'intéresse personne dans votre camp, et elle intéressera beaucoup les historiens.";
        },
      },
      {
        id: "refuser_etat_national",
        label: "Refuser en bloc et recevoir Alberti",
        detail: "S'arrêter, publiquement, devant la juge constitutionnelle.",
        effects: (c) => {
          c.derive(-3);
          c.bord(-2);
          c.adj({ country: { cohesion: 8, prestige: 10 }, power: { justice: 20, presse: 14, popularite: -12, armee: -6 } });
          c.rel("alberti", { loyaute: 20 });
          c.flag("bascule_refusee");
          c.log("Vous avez refusé l'état national d'exception et reçu publiquement la présidente du Conseil constitutionnel.");
          return "Vous recevez Denise Alberti devant les caméras et vous annoncez le retrait des quatorze articles en la regardant. Deux ministres démissionnent avant le journal du soir, votre majorité perd quarante députés en un mois. Vous avez sauvé une institution en sacrifiant la vôtre, et vous le saviez en entrant dans la pièce.";
        },
      },
    ],
  },
];
