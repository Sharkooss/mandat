import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les suites des chantiers.
//
// Une réforme n'est pas un effet immédiat suivi de rien : elle revient. Ces
// épisodes ne sont jamais tirés au sort (`weight: 0`) — ils arrivent parce
// qu'un chantier a été lancé quelques semestres plus tôt et que `sched()` leur
// a donné rendez-vous.
// ---------------------------------------------------------------------------

export const EVENTS_CHANTIERS: GameEvent[] = [
  {
    id: "isf_exil",
    kind: "standard",
    titre: "La liste de Genève",
    once: true,
    weight: 0,
    texte:
      "Un hebdomadaire économique publie une enquête sur les départs fiscaux depuis le rétablissement de l'impôt sur la fortune. Le chiffre réel est modeste ; les noms, eux, sont ceux qu'on voit dans les jurys de concours, les conseils d'administration et les pages culture. L'un d'eux vous avait soutenu.",
    choices: [
      {
        id: "assumer",
        label: "Assumer publiquement",
        detail: "« La France n'est pas une option fiscale. »",
        effects: (c) => {
          c.adj({ power: { popularite: 5, patronat: -6 }, country: { cohesion: 2 } });
          c.seg("public", { soutien: 4 });
          c.seg("csp", { soutien: -4 });
          c.dire("exil_fiscal", "Un pays n'est pas un produit financier qu'on quitte quand le rendement baisse", "en conseil des ministres");
          return "Vous répondez en une phrase, en sortant du conseil, et elle tourne toute la journée. Vos adversaires y voient de la démagogie, ce qui est à moitié vrai ; le reste du pays y voit quelqu'un qui n'a pas peur de la page économie, ce qui est plus rare.";
        },
      },
      {
        id: "amenager",
        label: "Aménager discrètement le barème",
        detail: "Un plafonnement technique. Personne ne lira le décret.",
        effects: (c) => {
          c.adj({ country: { marge: -3 }, power: { patronat: 8, presse: -3 }, player: { integrite: -3 } });
          c.rel("charvet", { loyaute: 8, rancune: -6 });
          return "Le plafonnement global est relevé par décret un 14 août. Techniquement, l'impôt existe toujours ; concrètement, il rapporte un tiers de moins. Les deux affirmations sont vraies, et c'est précisément ce qui rend l'opération si commode — jusqu'à ce qu'un journaliste fasse la soustraction.";
        },
      },
      {
        id: "traquer",
        label: "Lancer une traque fiscale",
        detail: "Contrôles, exit tax, publication des noms.",
        effects: (c) => {
          c.derive(1);
          c.adj({ country: { marge: 4 }, power: { patronat: -12, popularite: 4, justice: -3 } });
          c.seg("periurbain", { soutien: 5 });
          c.dossier("traque_fiscale", "Les contrôles ciblés sur des opposants notoires", 20);
          return "Bercy met en place une brigade dédiée, et quelqu'un, quelque part, décide d'y ajouter deux noms qui n'ont rien à voir avec l'exil fiscal. Vous ne l'apprendrez que plus tard, ce qui ne vous protégera de rien : dans ce métier, on répond de ce qu'on a rendu possible.";
        },
      },
    ],
  },
  {
    id: "ecole_bilan",
    kind: "standard",
    titre: "La première cohorte",
    once: true,
    weight: 0,
    texte:
      "Les premiers élèves passés par les classes dédoublées arrivent en fin de cycle. L'évaluation nationale est nette : neuf points d'écart de moins entre l'éducation prioritaire et le reste. C'est le meilleur résultat scolaire depuis vingt ans, et il tient en un tableau que personne ne mettra en une.",
    choices: [
      {
        id: "sobre",
        label: "Laisser parler les chiffres",
        effects: (c) => {
          c.adj({ country: { services: 6, cohesion: 3 }, power: { popularite: 3 } });
          c.promesse("ecole_douze", "tenue");
          c.seg("public", { soutien: 6 });
          c.seg("quartiers", { soutien: 5 });
          c.log("Le dédoublement des classes a produit ses effets mesurables.");
          return "La note de la direction de l'évaluation est mise en ligne sans conférence de presse. Trois syndicats la contestent par principe, puis la citent six mois plus tard dans leurs revendications — la meilleure preuve qu'elle est solide. Vous n'en tirerez pas un point de sondage. Vous en tirerez une ligne dans les manuels.";
        },
      },
      {
        id: "campagne",
        label: "En faire une campagne nationale",
        detail: "Affiches, spots, tournée des écoles.",
        effects: (c) => {
          c.adj({ country: { services: 5, marge: -2 }, power: { popularite: 6, presse: -4 } });
          c.promesse("ecole_douze", "tenue");
          c.seg("pavillonnaires", { soutien: 5 });
          c.rel("ferrand", { rancune: 6 });
          return "Le plan de communication coûte moins cher qu'une école et se voit davantage. Louise Ferrand publie le lendemain une contre-enquête sur les départements laissés de côté — elle a raison, et elle a aussi choisi son moment. Les deux choses vous appartiennent désormais.";
        },
      },
    ],
  },
  {
    id: "ric_premier",
    kind: "standard",
    titre: "Le premier référendum d'initiative citoyenne",
    once: true,
    weight: 0,
    texte:
      "Sept cent quarante mille signatures validées. Le premier référendum d'initiative citoyenne de la Ve République portera sur l'abrogation d'une de vos propres mesures. Le Conseil constitutionnel a jugé la question recevable ce matin. Le scrutin aura lieu dans neuf semaines.",
    choices: [
      {
        id: "campagne",
        label: "Faire campagne pour le non",
        detail: "Y aller soi-même. Tout ou rien.",
        aptitude: "rhetorique",
        risque: 3,
        effects: (c) => {
          const gagne = c.s.player.rhetorique + c.s.power.popularite / 2 + c.rng.int(-25, 25) > 62;
          if (gagne) {
            c.adj({ power: { popularite: 9, parti: 6 }, country: { cohesion: 4 }, hidden: { fatigue: 12 } });
            c.log("Vous avez gagné le premier référendum d'initiative citoyenne.");
            return "Neuf semaines de meetings dans des salles de sport, sans hélicoptère et sans estrade. Vous gagnez à 54 % — un score étroit qui vaut mieux qu'un plébiscite : personne ne pourra dire que le pays n'avait pas le choix. L'outil que vous avez créé vient de vous adouber.";
          }
          c.adj({ power: { popularite: -10, parti: -8 }, hidden: { fatigue: 14, agitation: 6 } });
          c.log("Le pays a abrogé par référendum une mesure de votre mandat.");
          return "Le pays abroge votre mesure à 58 %, avec une participation supérieure à celle des législatives. Vous avez donné au peuple un instrument, et il s'en est servi contre vous au premier essai. C'est la définition d'une démocratie qui fonctionne, et ça n'a jamais consolé personne.";
        },
      },
      {
        id: "retrait",
        label: "Retirer la mesure avant le vote",
        detail: "Éviter la gifle. Reconnaître la défaite.",
        effects: (c) => {
          c.adj({ power: { popularite: -3, presse: -2 }, hidden: { agitation: -8 } });
          c.seg("periurbain", { soutien: 3 });
          return "Vous retirez le texte quinze jours avant le scrutin, ce qui vide le référendum de son objet et prive les initiateurs de leur victoire. Ils crient au déni ; l'opinion, elle, trouve ça plutôt sage. Vous venez d'établir la vraie règle du dispositif : sept cent mille signatures suffisent à faire reculer un président.";
        },
      },
      {
        id: "ignorer",
        label: "Ne rien dire et laisser passer",
        detail: "Le silence présidentiel. Il a déjà servi.",
        effects: (c) => {
          c.adj({ power: { popularite: -5, presse: -4 }, hidden: { agitation: 4 } });
          c.seg("jeunes", { soutien: -4 });
          return "Vous ne faites pas campagne, vous ne commentez pas, vous laissez la mesure tomber toute seule. L'abstention est massive, le résultat sans appel, et le lendemain votre porte-parole explique que « le président respecte le vote ». Personne n'y croit : on ne respecte pas ce qu'on n'a pas regardé.";
        },
      },
    ],
  },
  {
    id: "autoroutes_arbitrage",
    kind: "monde",
    titre: "Le tribunal de Genève",
    once: true,
    weight: 0,
    texte:
      "Le tribunal arbitral saisi par les anciens concessionnaires rend sa sentence : la France doit onze milliards d'euros. La procédure était prévue au contrat de 2006, signé par un gouvernement dont trois membres siègent encore. La sentence n'est pas susceptible d'appel.",
    choices: [
      {
        id: "payer",
        label: "Payer et solder",
        effects: (c) => {
          c.adj({ country: { dette: 5, marge: -8 }, power: { popularite: -3 } });
          return "Onze milliards inscrits en loi de finances rectificative, sur une ligne que personne ne commente au journal de 20h. Les péages restent à 30 % de moins, ce que les automobilistes constatent chaque semaine ; la facture, elle, ne se constate nulle part. C'est le meilleur échange politique qui soit, et le pire échange comptable.";
        },
      },
      {
        id: "refuser",
        label: "Refuser d'exécuter la sentence",
        detail: "La souveraineté contre l'arbitrage privé.",
        effects: (c) => {
          c.adj({ country: { prestige: -7 }, power: { popularite: 7, patronat: -14 } });
          c.toutesNations({ savoir: 4 }, []);
          c.dossier("arbitrage_refuse", "Le refus d'exécuter une sentence arbitrale internationale", 26);
          c.dire("arbitrage", "Aucun tribunal privé ne dictera le prix des routes de France", "depuis le perron de l'Élysée");
          return "Vous refusez d'exécuter, au motif que le contrat lui-même était léonin. La phrase est excellente et le pays applaudit. Puis les saisies commencent sur des actifs publics français à l'étranger : un immeuble à Londres, un compte à Singapour, un tableau prêté à un musée. Les créanciers ont plus de patience que les mandats.";
        },
      },
    ],
  },
  {
    id: "fin_vie_debat",
    kind: "standard",
    titre: "Le premier dossier",
    once: true,
    weight: 0,
    texte:
      "Six mois après la loi, un premier cas fait la une : une femme de quarante-trois ans, deux enfants, une maladie sans issue, et une commission médicale qui a refusé sa demande pour un motif de procédure. Elle a écrit une lettre ouverte. Elle vous y interpelle nommément.",
    choices: [
      {
        id: "recevoir",
        label: "La recevoir à l'Élysée",
        effects: (c) => {
          c.adj({ power: { popularite: 4, presse: 6 }, country: { cohesion: 2 }, hidden: { fatigue: 5 } });
          c.seg("urbains", { soutien: 4 });
          c.seg("retraites", { soutien: 3 });
          return "Une heure quarante, sans caméras, sans conseiller. Elle repart sans avoir obtenu ce qu'elle demandait — vous ne pouvez pas défaire une commission médicale — mais elle dit devant les journalistes que « quelqu'un a écouté ». La procédure sera corrigée par décret trois semaines plus tard, ce qui est la seule chose que vous pouviez réellement lui offrir.";
        },
      },
      {
        id: "decret",
        label: "Corriger la procédure sans la voir",
        detail: "Efficace. Froid. Personne ne saura que ça venait d'elle.",
        effects: (c) => {
          c.adj({ country: { services: 3 }, power: { presse: -3 } });
          return "Le décret paraît au Journal officiel un mardi, corrige exactement le point qu'elle avait soulevé, et ne la mentionne pas. Son avocat le remarque, l'écrit, et personne ne reprend. Vous avez réglé le problème et raté la scène — dans un pays qui juge sur les scènes, ce n'est pas un détail.";
        },
      },
      {
        id: "commission",
        label: "Renvoyer à la commission médicale",
        detail: "« La loi a prévu une instance. Elle est indépendante. »",
        effects: (c) => {
          c.adj({ power: { popularite: -5, presse: -5 } });
          c.seg("urbains", { soutien: -4 });
          return "La réponse est juridiquement irréprochable et humainement inaudible. Elle est lue en boucle, en voix off, sur des images de la femme dans son salon. Vous aviez fait voter cette loi contre votre propre camp ; vous venez de laisser croire, en trois lignes de communiqué, qu'elle ne vous engageait pas.";
        },
      },
    ],
  },
];
