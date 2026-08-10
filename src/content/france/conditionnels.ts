import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les événements que votre situation déclenche. Une force très haute ouvre des
// portes ; un secteur dans le rouge en ouvre d'autres, beaucoup moins plaisantes.
// C'est ce qui fait que deux parties ne racontent pas la même histoire.
// ---------------------------------------------------------------------------

export const EVENTS_CONDITIONNELS: GameEvent[] = [
  // =========================================================================
  // Vos forces ouvrent des portes
  // =========================================================================
  {
    id: "cond_idole",
    kind: "standard",
    titre: "La foule",
    rarete: "rare",
    once: true,
    cond: (s) => s.player.charisme >= 72,
    weight: 3,
    texte:
      "Un déplacement ordinaire tourne au bain de foule incontrôlable : huit mille personnes dans une préfecture de vingt mille habitants. Le service de protection est livide, les images sont extraordinaires. Il y a dans ce pays une réserve d'adhésion que personne n'avait su capter depuis longtemps, et elle est à vous.",
    choices: [
      {
        id: "capitaliser",
        label: "Capitaliser : une tournée nationale",
        effects: (c) => {
          c.adj({ power: { popularite: 8 }, hidden: { fatigue: 14, assassinat: 6 } });
          for (const id of ["periurbain", "jeunes", "ruraux"]) c.seg(id, { soutien: 4, participation: 4 });
          return "Trente villes en deux mois. Les salles débordent, les images font le tour du monde, votre cote décolle. Vous rentrez épuisé, et votre chef de la sécurité a vieilli de dix ans — un président aimé est aussi un président accessible, et l'accessibilité a un prix qu'on ne calcule qu'après.";
        },
      },
      {
        id: "convertir",
        label: "Convertir l'élan en réforme difficile",
        effects: (c) => {
          c.adj({ country: { marge: 6, cohesion: 3 }, power: { popularite: -2 }, hidden: { fatigue: 6 } });
          c.log("Vous avez dépensé un capital de popularité rare pour faire passer l'impossible.");
          return "Vous décidez de brûler ce capital plutôt que de le contempler : une réforme réputée intenable passe en six semaines, portée par une adhésion que personne n'ose contredire. C'est exactement l'usage qu'on devrait faire de la popularité, et presque personne ne le fait.";
        },
      },
    ],
  },
  {
    id: "cond_incorruptible",
    kind: "standard",
    titre: "L'enveloppe",
    rarete: "rare",
    once: true,
    cond: (s) => s.player.integrite >= 72,
    weight: 2.5,
    texte:
      "Un intermédiaire d'un fonds souverain propose un financement massif pour votre fondation post-mandat. La somme est indécente, le montage impeccablement légal, et la contrepartie tient en une phrase murmurée au dessert : « une bienveillance sur les dossiers énergétiques ».",
    choices: [
      {
        id: "refus_public",
        label: "Refuser et le rendre public",
        effects: (c) => {
          c.adj({ player: { integrite: 6 }, power: { popularite: 6, presse: 6 }, country: { prestige: -2 } });
          c.log("Vous avez rendu publique une tentative de corruption étrangère.");
          return "Vous racontez la scène en conférence de presse, en nommant le fonds et le montant. L'effet est considérable : dans un pays qui soupçonne tout le monde, un dirigeant qui expose ce qu'on lui a proposé devient momentanément incontestable. Deux chancelleries font savoir qu'elles trouvent le procédé « peu diplomatique ». C'était le but.";
        },
      },
      {
        id: "refus_discret",
        label: "Refuser discrètement",
        effects: (c) => {
          c.adj({ player: { integrite: 3 } });
          return "Un refus poli, aucune trace, aucun bénéfice politique. L'intermédiaire ira voir ailleurs et trouvera preneur — c'est bien ça, le problème, et vous n'y pouvez rien depuis votre bureau.";
        },
      },
      {
        id: "accepter_fonds",
        label: "Accepter pour la fondation",
        detail: "« Ce n'est pas pour moi. » C'est ce qu'ils disent tous.",
        effects: (c) => {
          c.adj({ player: { integrite: -14, cynisme: 6 } });
          c.flag("fonds_etranger");
          c.sched("carnets_1", 4, 10, 0.45);
          return "Le montage passe par trois juridictions et une fondation de droit suisse. Vous n'avez pas touché un euro personnellement, ce qui vous permet de vous regarder dans la glace pendant environ six mois — c'est la durée moyenne de ce genre d'arrangement avec soi-même.";
        },
      },
    ],
  },
  {
    id: "cond_reseau",
    kind: "standard",
    titre: "Le carnet d'adresses",
    once: true,
    cond: (s) => s.player.reseau >= 70,
    weight: 2,
    texte:
      "Un industriel étranger hésite entre trois pays pour une usine de composants : quatre mille emplois directs. Vous connaissez personnellement son président depuis quinze ans. Un appel suffirait à obtenir un rendez-vous que les autres n'auront pas.",
    choices: [
      {
        id: "appeler",
        label: "Passer l'appel",
        effects: (c) => {
          const ok = c.rng.chance(0.65);
          if (ok) {
            c.adj({ country: { croissance: 0.5, chomage: -0.3, marge: -3 }, power: { popularite: 5, patronat: 6 } });
            c.seg("periurbain", { soutien: 6 });
            c.log("Vous avez arraché personnellement une usine de quatre mille emplois.");
            return "Trois appels, un dîner, une visite de site en hélicoptère un dimanche. L'usine se fera en France. Ce genre de dossier ne se gagne jamais sur les fondamentaux économiques — il se gagne parce que quelqu'un décroche son téléphone et que l'autre le prend.";
          }
          c.adj({ country: { marge: -3 }, power: { patronat: 2 } });
          return "Vous décrochez le rendez-vous, les concessions fiscales, la promesse d'une décision rapide. L'usine ira ailleurs : un concurrent offrait le double d'aides publiques. Vous avez payé pour perdre, ce qui est le sort ordinaire de la course aux subventions.";
        },
      },
      {
        id: "procedure",
        label: "Laisser l'agence d'attractivité faire",
        effects: (c) => {
          c.adj({ player: { integrite: 2 } });
          return "Le dossier suit son cours administratif normal. L'usine ira dans un pays dont le chef d'État a, lui, décroché son téléphone. La procédure a été irréprochable et le résultat nul : c'est une combinaison très française.";
        },
      },
    ],
  },
  {
    id: "cond_grace_prolongee",
    kind: "standard",
    titre: "L'état de grâce",
    once: true,
    cond: (s) => s.power.popularite >= 66,
    weight: 2.5,
    texte:
      "Soixante-six pour cent d'opinions favorables au-delà de la première année : du jamais-vu sous cette République. Votre entourage est unanime — il faut « en profiter ». Le problème des états de grâce, c'est qu'ils ne préviennent jamais du jour où ils s'arrêtent.",
    choices: [
      {
        id: "dissoudre",
        label: "Dissoudre l'Assemblée",
        detail: "Transformer la popularité en majorité. Quitte ou double.",
        effects: (c) => {
          const gain = c.rng.int(-30, 90);
          c.adj({ power: { sieges: gain } });
          if (gain > 30) {
            c.log("Une dissolution offensive vous a offert une majorité massive.");
            return "Le pari est gagné : la vague vous donne une majorité comme on n'en avait plus vu. Vous gouvernerez sans négocier pendant des années. Les dissolutions réussies sont rarissimes — et celle-ci restera comme un coup de maître, ce qui n'était pas garanti à l'ouverture des urnes.";
          }
          c.log("Votre dissolution a mal tourné : l'Assemblée est plus dure qu'avant.");
          return "Le pari est perdu. L'abstention a été massive, votre vague s'est arrêtée sur les rivages habituels, et vous vous retrouvez avec une Assemblée plus rétive qu'avant. Personne ne vous obligeait à dissoudre. C'est ce que l'Histoire retiendra.";
        },
      },
      {
        id: "reforme_dure",
        label: "Faire passer la réforme la plus impopulaire",
        effects: (c) => {
          c.adj({ country: { marge: 8 }, power: { popularite: -12 }, hidden: { agitation: 6 } });
          c.log("Vous avez dépensé votre état de grâce dans une réforme impopulaire.");
          return "Vous dépensez le capital au lieu de le contempler. La réforme passe, la cote s'effondre de douze points en un semestre, et le pays est durablement mieux tenu. Les états de grâce ne servent qu'à ça — mais ils font de si jolies photos qu'on préfère souvent les conserver intacts, et ne rien faire.";
        },
      },
      {
        id: "profiter",
        label: "Ne rien risquer",
        effects: (c) => {
          c.adj({ power: { popularite: 2 } });
          return "Vous savourez. Les sondages restent bons deux semestres de plus, puis redescendent comme ils étaient montés, sans que rien n'ait été accompli entre-temps. C'est la façon la plus douce de perdre un mandat.";
        },
      },
    ],
  },

  // =========================================================================
  // Vos faiblesses ouvrent d'autres portes
  // =========================================================================
  {
    id: "cond_desert",
    kind: "standard",
    titre: "La traversée du désert",
    once: true,
    cond: (s) => s.power.popularite <= 27,
    weight: 3,
    texte:
      "Vingt-sept pour cent. Les députés de votre camp ne répondent plus aux SMS, les préfets anticipent l'alternance, et un ministre a été filmé en train de lever les yeux au ciel pendant votre intervention. Le pouvoir s'évapore bien avant l'élection : il s'évapore le jour où plus personne ne craint de vous déplaire.",
    choices: [
      {
        id: "mea_culpa",
        label: "Le mea culpa télévisé",
        effects: (c) => {
          const ok = c.s.player.rhetorique + c.rng.int(-10, 25) > 50;
          if (ok) {
            c.adj({ power: { popularite: 9, presse: 5 } });
            return "« J'ai été trop rapide, trop seul, trop sûr. » Vingt minutes de reconnaissance d'erreurs, sans excuse rhétorique. Le pays, qui n'entend jamais ça, écoute. Neuf points remontent en trois semaines. L'humilité est l'arme la plus sous-employée du répertoire politique.";
          }
          c.adj({ power: { popularite: -3 } });
          return "L'exercice sonne calculé — parce qu'il l'était. « Contrition tardive », titre Le Matin. On ne pardonne qu'aux mea culpa sincères, et la sincérité ne se joue pas, c'est bien là le problème du métier.";
        },
      },
      {
        id: "cap_maintenu",
        label: "Tenir le cap sans rien changer",
        effects: (c) => {
          c.adj({ power: { popularite: -3, parti: -6 }, player: { endurance: 3 } });
          return "« Je n'ai pas été élu pour lire les sondages. » La formule est noble et vous isole un peu plus. Certains présidents ont eu raison contre tous et sont réhabilités trente ans après. La plupart avaient simplement tort.";
        },
      },
      {
        id: "diversion",
        label: "Créer une diversion",
        detail: "Un grand sujet régalien pour changer de conversation.",
        effects: (c) => {
          c.adj({ power: { popularite: 4 }, country: { cohesion: -4 } });
          c.derive(1);
          return "Un thème régalien lancé au bon moment occupe l'espace trois semaines. Ça marche — les diversions marchent toujours une fois. Le pays, lui, apprend qu'on peut agiter ses peurs quand les chiffres sont mauvais, et cette leçon-là ne se désapprend pas.";
        },
      },
    ],
  },
  {
    id: "cond_marches",
    kind: "standard",
    titre: "Les marchés attaquent",
    once: true,
    cond: (s) => s.country.dette >= 132 || s.country.marge <= 12,
    weight: 3,
    source: "danglade",
    texte:
      "L'écart de taux avec l'Allemagne a doublé en trois semaines. Une adjudication s'est mal passée hier — pour la première fois, l'État a payé plus cher que prévu pour emprunter. Cyril Danglade a la voix de quelqu'un qui n'a pas dormi : « Il nous faut un signal. Un vrai. Cette semaine. »",
    choices: [
      {
        id: "plan_choc",
        label: "Plan d'économies choc",
        effects: (c) => {
          c.adj({ country: { marge: 12, services: -7, cohesion: -6 }, power: { popularite: -9 }, hidden: { agitation: 10 } });
          c.log("Un plan d'économies brutal a été imposé sous la pression des marchés.");
          return "Gel des recrutements, rabot général, deux dispositifs supprimés. Les taux se détendent en huit jours — les marchés ne demandent jamais que des signaux. Le pays, lui, paiera pendant des années un ajustement décidé en une nuit par des gens qui ne l'habitent pas.";
        },
      },
      {
        id: "impot_fortune",
        label: "Taxer le capital",
        effects: (c) => {
          c.adj({ country: { marge: 7 }, power: { patronat: -14, popularite: 5 } });
          c.rel("charvet", { rancune: 15 });
          c.seg("csp", { soutien: -12 });
          return "Une contribution exceptionnelle sur les hauts patrimoines. La rue applaudit, le patronat parle d'« exil fiscal massif » — il y en aura un peu, moins qu'annoncé, et personne ne comparera jamais honnêtement les chiffres. La marge budgétaire, elle, existe vraiment.";
        },
      },
      {
        id: "tenir_marches",
        label: "Ne rien céder aux marchés",
        effects: (c) => {
          const grave = c.rng.chance(0.45);
          if (grave) {
            c.adj({ country: { dette: 5, marge: -6, croissance: -0.4 } });
            c.sched("agences_notation", 1, 3, 0.8);
            return "« La politique de la France ne se décide pas sur un écran de Francfort. » La phrase est belle. Trois semaines plus tard, la dégradation tombe et chaque euro emprunté coûte plus cher — durablement. Vous aviez raison sur le principe et tort sur le calendrier.";
          }
          c.adj({ power: { popularite: 4 } });
          return "Vous ne cédez rien et la tension retombe d'elle-même : les marchés avaient testé, pas décidé. Cette fois, le bras de fer a payé. Personne ne saura jamais à quel point c'était serré.";
        },
      },
    ],
  },
  {
    id: "cond_canicule",
    kind: "standard",
    titre: "Quarante-trois degrés",
    once: true,
    cond: (s) => s.country.environnement <= 34 || s.semestre === 2,
    weight: (s) => (s.country.environnement <= 34 ? 2.5 : 0.8),
    texte:
      "Record national battu de deux degrés. Les urgences débordent de personnes âgées, deux réacteurs ont réduit leur production faute d'eau de refroidissement, et une forêt de dix mille hectares brûle depuis quatre jours. La surmortalité sera connue en septembre, quand plus personne ne regardera.",
    choices: [
      {
        id: "urgence_climat",
        label: "Plan d'adaptation d'urgence",
        effects: (c) => {
          c.adj({ country: { environnement: 6, services: 3, marge: -6 }, power: { popularite: 4 } });
          c.seg("urbains", { soutien: 5 });
          return "Climatisation des Ehpad, plan eau, moyens aériens doublés, végétalisation des villes. C'est cher, tardif, et la seule réponse sérieuse. Chaque été qui vient rendra cette dépense un peu moins discutable et un peu plus insuffisante.";
        },
      },
      {
        id: "gestion_crise_ete",
        label: "Gérer l'urgence, rien de plus",
        effects: (c) => {
          c.adj({ country: { environnement: -2, services: -2 }, power: { popularite: -2 } });
          return "Numéro vert, plan canicule, visite d'un centre de secours. La vague passe, les chiffres de surmortalité sortent en septembre dans l'indifférence. On recommencera l'été prochain, un peu plus chaud, avec les mêmes moyens.";
        },
      },
    ],
  },
  {
    id: "cond_lettre_generaux",
    kind: "intrigue",
    titre: "La lettre",
    rarete: "rare",
    once: true,
    cond: (s) => s.power.armee <= 38,
    weight: 3,
    texte:
      "Une tribune signée par vingt généraux de réserve — et, dit-on, relue par des officiers d'active — paraît dans la presse de Antoine Rives. Elle parle de « délitement », de « devoir », et se garde soigneusement de tout appel explicite. C'est le genre de texte qu'on écrit pour voir qui applaudit.",
    choices: [
      {
        id: "sanctionner",
        label: "Sanctionner les signataires",
        effects: (c) => {
          c.adj({ power: { armee: -8 }, hidden: { coup: 6 } });
          c.rel("verdier", { rancune: 10 });
          return "Radiations, retraits de grade, procédures disciplinaires. La fermeté est constitutionnellement irréprochable et militairement coûteuse : dans les mess, on considère désormais que la sanction visait des idées, pas des fautes. Le ressentiment descend d'un cran dans la hiérarchie.";
        },
      },
      {
        id: "recevoir_militaires",
        label: "Recevoir l'état-major et écouter",
        effects: (c) => {
          c.adj({ power: { armee: 10 }, hidden: { coup: -10 }, country: { marge: -3 } });
          c.rel("verdier", { loyaute: 8 });
          c.log("Vous avez désamorcé la fronde militaire en écoutant l'état-major.");
          return "Quatre heures à huis clos. Ce qui remonte est prosaïque : matériel indisponible, effectifs sous tension, familles logées dans des baraquements. Vous lâchez un plan d'équipement et une revalorisation. Les frondes militaires naissent rarement d'idées ; elles naissent presque toujours de conditions de travail.";
        },
      },
      {
        id: "ignorer_generaux",
        label: "Ignorer une tribune de retraités",
        effects: (c) => {
          c.adj({ hidden: { coup: 8 } });
          return "« Vingt hommes à la retraite ont écrit un texte. » Le mépris affiché est confortable et faux : la tribune a été lue dans toutes les casernes, et le silence de l'Élysée y a été reçu comme un aveu de faiblesse plutôt que comme de la hauteur.";
        },
      },
    ],
  },
  {
    id: "cond_greve_sauvage",
    kind: "standard",
    titre: "Une grève sans interlocuteur",
    once: true,
    cond: (s) => s.power.syndicats <= 26,
    weight: 2.8,
    texte:
      "Les raffineries sont bloquées par des comités d'employés qui refusent tout mandat syndical. Bruno Kervella lui-même admet ne rien contrôler. Vous découvrez la seule chose pire qu'un syndicat puissant : plus de syndicat du tout, et personne avec qui signer quoi que ce soit.",
    choices: [
      {
        id: "reconstruire_dialogue",
        label: "Reconstruire un interlocuteur",
        effects: (c) => {
          c.adj({ power: { syndicats: 12 }, hidden: { agitation: -8 }, country: { marge: -3 } });
          c.rel("belkacem", { loyaute: 12 });
          c.rel("kervella", { loyaute: 6 });
          c.log("Vous avez rétabli le dialogue social après l'avoir laissé se déliter.");
          return "Vous rouvrez une vraie négociation de branche, avec des moyens et un calendrier. C'est humiliant après des mois de mépris affiché, et c'est la seule sortie : un pays sans corps intermédiaires ne devient pas plus gouvernable, il devient ingouvernable par intermittence.";
        },
      },
      {
        id: "requisition_raffineries",
        label: "Réquisitionner",
        effects: (c) => {
          c.adj({ hidden: { agitation: 12 }, power: { syndicats: -8 }, country: { cohesion: -4 } });
          c.derive(1);
          return "Les préfets réquisitionnent, les dépôts rouvrent sous escorte. La pénurie s'arrête en six jours. Le conflit, lui, ne s'arrête pas : il devient souterrain, sans porte-parole, sans revendication chiffrée — donc sans possibilité d'accord.";
        },
      },
    ],
  },
  {
    id: "cond_fronde_magistrats",
    kind: "standard",
    titre: "Les robes noires sur les marches",
    once: true,
    cond: (s) => s.power.justice <= 32,
    weight: 2.5,
    texte:
      "Pour la première fois depuis des décennies, des magistrats manifestent en robe devant les palais de justice. Ils dénoncent les pressions, les nominations, et « une justice traitée comme une administration docile ». Denise Alberti a fait savoir qu'elle « suit la situation avec attention » — dans sa bouche, c'est une déclaration de guerre.",
    choices: [
      {
        id: "reculer_justice",
        label: "Reculer, garantir l'indépendance",
        effects: (c) => {
          c.adj({ power: { justice: 14, popularite: -2 } });
          c.derive(-1);
          c.rel("alberti", { loyaute: 10, rancune: -10 });
          c.log("Vous avez reculé publiquement sur l'indépendance de la justice.");
          return "Vous annoncez la fin des nominations discrétionnaires au parquet et un budget pluriannuel. C'est un recul assumé, et le seul geste qui remette la magistrature dans son rôle. Une partie de votre camp parle de capitulation — ceux-là confondent depuis toujours l'autorité et le contrôle.";
        },
      },
      {
        id: "durcir_justice",
        label: "Durcir : la justice n'est pas un contre-pouvoir",
        effects: (c) => {
          c.adj({ power: { justice: -10, presse: -4 } });
          c.derive(2);
          c.rel("alberti", { rancune: 18 });
          return "« Les juges appliquent la loi, ils ne la font pas, et ils ne gouvernent pas. » La phrase est théoriquement défendable et pratiquement explosive. Le Conseil constitutionnel censurera votre prochain texte — pas parce qu'il est mauvais, mais parce que vous venez de transformer une institution en adversaire.";
        },
      },
    ],
  },
  {
    id: "cond_greve_investissement",
    kind: "standard",
    titre: "La grève des investissements",
    once: true,
    cond: (s) => s.power.patronat <= 28,
    weight: 2.5,
    texte:
      "Trois grands groupes annoncent le même mois le gel de leurs investissements en France. Édouard Charvet, patelin devant les caméras : « Les entreprises ont besoin de visibilité. » Traduction : nous attendons que vous cédiez, ou que vous partiez.",
    choices: [
      {
        id: "ceder_patronat",
        label: "Donner des gages",
        effects: (c) => {
          c.adj({ power: { patronat: 14 }, country: { croissance: 0.4, marge: -5 } });
          c.seg("public", { soutien: -4 });
          c.rel("charvet", { loyaute: 12 });
          return "Crédit d'impôt élargi, simplification, moratoire sur deux normes. Les investissements repartent le trimestre suivant — la visibilité était donc bien le sujet, ou bien le chantage a fonctionné, et personne ne saura jamais démêler les deux.";
        },
      },
      {
        id: "etat_investisseur",
        label: "L'État investit à leur place",
        effects: (c) => {
          c.adj({ country: { marge: -9, croissance: 0.3 }, power: { patronat: -6, popularite: 4 } });
          c.log("Face à la grève des investissements, l'État a pris le relais.");
          return "Fonds souverain national, prises de participation, commandes publiques anticipées. C'est cher et cela fonctionne à court terme. Surtout, cela change le rapport de force : un patronat qui découvre qu'il n'est pas indispensable devient beaucoup moins bavard.";
        },
      },
    ],
  },
  {
    id: "cond_ecole",
    kind: "standard",
    titre: "L'école décroche",
    once: true,
    cond: (s) => s.country.services <= 34,
    weight: 2.8,
    texte:
      "Le classement international tombe : la France perd huit places en mathématiques, et l'écart entre les meilleurs et les plus faibles est désormais le plus large d'Europe. Deux mille postes n'ont pas été pourvus à la rentrée. On remplace des professeurs par des contractuels recrutés en trente minutes d'entretien.",
    choices: [
      {
        id: "revalorisation",
        label: "Revaloriser massivement le métier",
        effects: (c) => {
          c.adj({ country: { services: 8, marge: -8 }, power: { popularite: 3 } });
          c.seg("public", { soutien: 8 });
          c.sched("ecole_bilan", 6, 12, 0.6);
          c.log("Vous avez engagé une revalorisation massive du métier d'enseignant.");
          return "Salaires de début de carrière relevés d'un tiers, formation refondue. Les effets sur les classements se verront dans dix ans, c'est-à-dire jamais du point de vue politique. C'est probablement la décision la plus utile de votre mandat et personne ne vous en créditera.";
        },
      },
      {
        id: "reforme_methodes",
        label: "Réformer les méthodes, à moyens constants",
        effects: (c) => {
          c.adj({ country: { services: 2 }, power: { popularite: -1 } });
          c.seg("public", { soutien: -4 });
          return "Nouveaux programmes, évaluations nationales, « retour aux fondamentaux ». Les syndicats enseignants dénoncent une réforme de plus sans moyens ; ils ont largement raison, et le classement suivant le confirmera.";
        },
      },
    ],
  },
  {
    id: "ecole_bilan",
    kind: "standard",
    titre: "Le classement, dix ans après",
    once: true,
    weight: 0,
    texte:
      "Le nouveau classement international paraît : la France remonte de cinq places, et l'écart entre élèves se resserre pour la première fois depuis vingt ans. L'effet est directement attribué à la revalorisation engagée sous votre mandat. Vous n'êtes plus là pour couper le ruban, mais les statisticiens, eux, savent compter.",
    choices: [
      {
        id: "acter_ecole",
        label: "Prendre acte",
        effects: (c) => {
          c.adj({ country: { services: 6 }, power: { popularite: 2 } });
          c.log("La revalorisation du métier d'enseignant a produit ses effets mesurables.");
          return "Vous rangez le rapport dans le tiroir des victoires sans témoins, à côté des autres. Il commence à être bien rempli — c'est peut-être ça, un bilan : ce que personne ne vous attribue et qui existe quand même.";
        },
      },
    ],
  },
  {
    id: "cond_fracture",
    kind: "standard",
    titre: "Deux pays",
    once: true,
    cond: (s) => s.country.cohesion <= 30,
    weight: 3,
    texte:
      "Une étude fait la une : sur presque chaque question, les Français ne divergent plus, ils vivent dans deux réalités séparées — deux informations, deux vocabulaires, deux ensembles de faits. Les sociologues parlent de « sécession réciproque ». Aucune politique publique ne répare ça, et personne ne sait par quoi commencer.",
    choices: [
      {
        id: "conference_citoyenne",
        label: "Convention citoyenne tirée au sort",
        effects: (c) => {
          c.adj({ country: { cohesion: 7 }, power: { popularite: 2 }, hidden: { agitation: -5 } });
          c.seg("jeunes", { participation: 5 });
          c.log("Vous avez convoqué une convention citoyenne pour recoudre le pays.");
          return "Cent cinquante citoyens tirés au sort, neuf mois de travaux, des propositions inattendues et parfois excellentes. Le dispositif ne recoud rien à lui seul — mais des gens qui ne se parlaient plus ont passé neuf mois dans la même salle, et personne n'en est sorti identique.";
        },
      },
      {
        id: "service_national",
        label: "Service national obligatoire",
        effects: (c) => {
          c.adj({ country: { cohesion: 5, marge: -8 }, power: { armee: 4 } });
          c.seg("jeunes", { soutien: -8 });
          return "Six mois obligatoires pour toute une classe d'âge : c'est massif, coûteux, et les jeunes concernés n'ont rien demandé. Le brassage social est réel. Le ressentiment de ceux qu'on mobilise sans les consulter aussi.";
        },
      },
      {
        id: "rien_fracture",
        label: "Ce n'est pas le rôle de l'État",
        effects: (c) => {
          c.adj({ country: { cohesion: -3 }, hidden: { agitation: 4 } });
          return "Vous refusez l'ingénierie sociale, au nom d'une certaine idée de la liberté. L'argument se tient. Les deux pays continuent de s'éloigner, et le prochain scrutin ressemblera un peu plus à un référendum sur l'existence de l'autre camp.";
        },
      },
    ],
  },
  {
    id: "cond_annee_noire",
    kind: "standard",
    titre: "L'année noire",
    once: true,
    cond: (s) => s.country.securite <= 36,
    weight: 2.8,
    source: "mazeau",
    texte:
      "Les chiffres annuels sont mauvais sur toutes les lignes, y compris celles qu'on ne truque pas — homicides, refus d'obtempérer, agressions de dépositaires de l'autorité. Franck Mazeau propose de « changer la présentation des statistiques ». C'est dit sans ironie, en conseil des ministres.",
    choices: [
      {
        id: "publier_brut",
        label: "Publier les chiffres bruts",
        effects: (c) => {
          c.adj({ power: { popularite: -5, presse: 5 }, player: { integrite: 5 } });
          c.rel("mazeau", { rancune: 8 });
          return "Les chiffres sortent tels quels, avec la méthodologie en annexe. La séquence est désastreuse pendant huit jours et assainissante pour longtemps : à partir de maintenant, quand vos statistiques s'amélioreront, quelqu'un pourra y croire.";
        },
      },
      {
        id: "moyens_securite",
        label: "Répondre par un plan massif",
        effects: (c) => {
          c.adj({ country: { securite: 7, marge: -7 }, power: { popularite: 3 } });
          c.seg("pavillonnaires", { soutien: 5 });
          return "Effectifs, équipements, greffiers, places de prison. Les résultats mettront trois ans, ce qui dépasse l'horizon de patience du pays — mais la courbe finira par plier, et c'est la seule réponse qui ait jamais fonctionné nulle part.";
        },
      },
      {
        id: "changer_presentation",
        label: "Suivre Mazeau",
        detail: "Changer la méthode de comptage.",
        effects: (c) => {
          c.adj({ player: { integrite: -8 }, power: { popularite: 3 } });
          c.derive(1);
          c.sched("stats_truquees", 3, 8, 0.5);
          return "Le périmètre de deux indicateurs change discrètement en annexe d'un décret. Les chiffres s'améliorent de 12 % sans qu'un seul fait ait disparu. Les statisticiens de l'institut public, eux, ont remarqué — et l'un d'eux garde une copie de l'ancienne méthode.";
        },
      },
    ],
  },
  {
    id: "stats_truquees",
    kind: "intrigue",
    titre: "Le statisticien",
    once: true,
    weight: 0,
    texte:
      "Un statisticien de l'institut public a démissionné avec fracas et publié une note de quinze pages comparant les deux méthodes de comptage. La démonstration est technique, imparable, et reprise par toutes les rédactions en trois heures. Le mot employé partout est « manipulation ».",
    choices: [
      {
        id: "retablir_stats",
        label: "Rétablir l'ancienne méthode",
        effects: (c) => {
          c.adj({ power: { popularite: -6, presse: 3 }, player: { integrite: 3 } });
          return "Vous rétablissez la méthode d'origine et l'assumez comme une erreur d'appréciation. La reculade est humiliante et coupe court. Il restera que votre gouvernement a essayé, une fois, de tricher avec les chiffres du pays.";
        },
      },
      {
        id: "defendre_methode",
        label: "Défendre la nouvelle méthode",
        effects: (c) => {
          c.adj({ power: { presse: -8, popularite: -5 }, player: { integrite: -4 } });
          c.derive(1);
          return "Vous défendez une « harmonisation européenne des définitions » — l'argument existe et personne n'y croit. À partir de ce jour, chaque chiffre publié par votre gouvernement sera précédé d'un conditionnel dans la presse. C'est très cher payé pour douze pour cent d'affichage.";
        },
      },
    ],
  },

  // =========================================================================
  // Diversité : de nouveaux dossiers, quelle que soit la situation
  // =========================================================================
  {
    id: "cyberattaque",
    kind: "standard",
    titre: "L'hôpital paralysé",
    once: true,
    weight: 1.4,
    texte:
      "Un rançongiciel a mis à l'arrêt les systèmes de quarante hôpitaux : blocs déprogrammés, dossiers patients inaccessibles, transferts en urgence. Les attaquants demandent une rançon en cryptomonnaie. L'attribution technique pointe vers un groupe toléré par un État que la France ménage.",
    choices: [
      {
        id: "payer_rancon_cyber",
        label: "Laisser payer discrètement",
        effects: (c) => {
          c.adj({ country: { services: 2 }, player: { integrite: -5 } });
          c.flag("rancon_cyber");
          return "Les systèmes redémarrent en quatre jours au lieu de six semaines. Officiellement, la France ne paie pas. Officieusement, un assureur a payé, et l'écosystème criminel vient d'apprendre que les hôpitaux français sont solvables.";
        },
      },
      {
        id: "refuser_cyber",
        label: "Refuser et reconstruire",
        effects: (c) => {
          c.adj({ country: { services: -5, marge: -5 }, power: { popularite: -3 } });
          c.log("Vous avez refusé de payer une rançon cyber, au prix de six semaines de chaos hospitalier.");
          return "Six semaines de reconstruction, des opérations reportées, une surmortalité que personne ne mesurera jamais précisément. Le refus est juste : payer finance l'attaque suivante. Il se paie en vies, et vous ne pourrez jamais le dire ainsi.";
        },
      },
      {
        id: "riposte_cyber",
        label: "Riposter dans le cyberespace",
        effects: (c) => {
          c.adj({ country: { prestige: 3, securite: 2 } });
          c.rel("verdier", { loyaute: 5 });
          c.sched("cyber_retour", 4, 10, 0.4);
          return "Les capacités offensives françaises neutralisent l'infrastructure du groupe en dix jours. Aucune communication officielle, un message très clair. Ce genre d'échange n'a pas de fin : il a des tours, et vous venez de jouer le vôtre.";
        },
      },
    ],
  },
  {
    id: "cyber_retour",
    kind: "monde",
    titre: "Le tour suivant",
    once: true,
    weight: 0,
    texte:
      "Représailles : le réseau électrique d'une région entière tombe pendant onze heures, en février. Aucune revendication, une signature technique familière. Les autorités parlent d'« incident majeur d'exploitation ». Personne n'est dupe dans les cercles concernés — et personne n'en parlera publiquement.",
    choices: [
      {
        id: "escalade_cyber",
        label: "Monter d'un cran",
        effects: (c) => {
          c.adj({ country: { securite: -3 }, hidden: { agitation: 3 } });
          c.sched("monde_escalade", 3, 9, 0.3);
          return "Vous autorisez une riposte plus dure. L'échange devient une guerre silencieuse dont aucun citoyen ne connaîtra les termes, et dont chacun subira les coupures. Les conflits invisibles ont ceci de commode qu'ils ne demandent jamais l'accord du Parlement.";
        },
      },
      {
        id: "canal_discret",
        label: "Ouvrir un canal de désescalade",
        effects: (c) => {
          c.adj({ country: { prestige: 2, securite: 2 } });
          return "Un contact discret via un pays tiers aboutit à une trêve tacite : pas d'accord, pas de texte, juste l'arrêt des coups. C'est ainsi que se règlent la plupart des affaires sérieuses — loin des tribunes, entre gens qui ne se font aucune illusion.";
        },
      },
    ],
  },
  {
    id: "logement",
    kind: "standard",
    titre: "La génération qui ne se loge plus",
    once: true,
    weight: 1.6,
    texte:
      "Les mises en chantier sont au plus bas depuis cinquante ans, les loyers ont pris 30 % en cinq ans dans les métropoles, et l'âge moyen d'accession à la propriété vient de passer les quarante ans. Les maires refusent de construire — leurs électeurs actuels y sont hostiles, leurs électeurs futurs ne votent pas encore chez eux.",
    choices: [
      {
        id: "construire_force",
        label: "Contraindre les communes à construire",
        effects: (c) => {
          c.adj({ country: { marge: -4, cohesion: 3 } });
          c.seg("jeunes", { soutien: 9, participation: 4 });
          c.seg("pavillonnaires", { soutien: -6 });
          c.log("Vous avez imposé aux communes des obligations de construction.");
          return "Permis délivrés par le préfet en cas de blocage, pénalités renforcées, foncier public libéré. Les maires hurlent à l'atteinte à la libre administration. Les grues réapparaissent. C'est l'une des rares politiques dont les bénéficiaires ne peuvent pas encore voter pour vous.";
        },
      },
      {
        id: "aider_demande",
        label: "Aider les acheteurs",
        effects: (c) => {
          c.adj({ country: { marge: -6 } });
          c.seg("jeunes", { soutien: 4 });
          c.seg("csp", { soutien: 3 });
          return "Prêt à taux zéro élargi, aides à l'accession. L'effet est immédiat et pervers : sans construction nouvelle, subventionner la demande fait monter les prix. Les économistes le disent depuis vingt ans, tous les gouvernements le font quand même — c'est visible, et ça ne fâche aucun maire.";
        },
      },
      {
        id: "encadrer_loyers",
        label: "Encadrer les loyers partout",
        effects: (c) => {
          c.seg("jeunes", { soutien: 7 });
          c.seg("urbains", { soutien: 4 });
          c.seg("csp", { soutien: -8 });
          c.adj({ power: { patronat: -4 } });
          return "L'encadrement soulage immédiatement les locataires en place et décourage un peu plus l'investissement locatif. Vous avez choisi ceux qui sont déjà logés contre ceux qui cherchent : c'est un arbitrage défendable, rarement présenté comme tel.";
        },
      },
    ],
  },
  {
    id: "jo_sport",
    kind: "standard",
    titre: "La quinzaine",
    once: true,
    weight: 1.2,
    texte:
      "La France accueille une compétition mondiale. Trois semaines d'exposition planétaire, un budget qui a doublé depuis le dossier de candidature, et une question posée chaque jour : est-ce que ça vaut le coup ? La réponse dépendra entièrement du tableau des médailles et d'un éventuel incident.",
    choices: [
      {
        id: "investir_jo",
        label: "Mettre les moyens de la réussite",
        effects: (c) => {
          const succes = c.rng.chance(0.7);
          c.adj({ country: { marge: -6 } });
          if (succes) {
            c.adj({ country: { prestige: 8, cohesion: 6 }, power: { popularite: 7 } });
            c.log("La compétition mondiale organisée en France a été un succès national.");
            return "Organisation impeccable, sécurité sans faille, moisson de médailles inespérée. Le pays se surprend à être fier de lui pendant trois semaines — un état rare, dont l'effet politique dure environ deux mois et l'effet symbolique une génération.";
          }
          c.adj({ country: { prestige: -5 }, power: { popularite: -6 } });
          return "Un fiasco d'organisation le premier week-end, des images de foules bloquées reprises dans le monde entier, et des résultats sportifs médiocres. Trois semaines d'exposition mondiale à ce que la France fait de pire : l'organisation improvisée d'un événement préparé depuis sept ans.";
        },
      },
      {
        id: "economiser_jo",
        label: "Contenir la dépense",
        effects: (c) => {
          c.adj({ country: { marge: 2, prestige: -3 }, power: { popularite: -2 } });
          return "Budget tenu, sobriété affichée, cérémonies modestes. La Cour des comptes vous félicitera dans trois ans. Les images, elles, font pâle figure à côté de celles des hôtes précédents, et c'est ce dont on se souviendra.";
        },
      },
    ],
  },
  {
    id: "ia_emploi",
    kind: "standard",
    titre: "Les machines qui écrivent",
    once: true,
    weight: 1.4,
    texte:
      "Un grand groupe annonce la suppression de 3 000 postes administratifs remplacés par des systèmes automatiques, et deux autres préparent la même chose. Ce ne sont pas des ouvriers : ce sont des cadres, des juristes, des comptables — des gens qui votent et qui ont des relais. Personne n'avait prévu que ça commencerait par eux.",
    choices: [
      {
        id: "taxer_automatisation",
        label: "Taxer les gains d'automatisation",
        effects: (c) => {
          c.adj({ country: { marge: 6, croissance: -0.3 }, power: { patronat: -10 } });
          c.seg("pavillonnaires", { soutien: 5 });
          return "Une contribution assise sur les gains de productivité automatisés, fléchée vers la formation. Le patronat parle de « taxe sur le progrès » et menace de délocaliser les serveurs — ce qui est très facile, contrairement aux usines. Le débat est ouvert pour vingt ans.";
        },
      },
      {
        id: "former_reconversion",
        label: "Plan national de reconversion",
        effects: (c) => {
          c.adj({ country: { marge: -6, chomage: -0.2 }, power: { popularite: 3 } });
          c.seg("pavillonnaires", { soutien: 4 });
          return "Un plan de formation massif vers les métiers en tension. Les taux de retour à l'emploi seront corrects sans être spectaculaires, comme toujours. C'est la réponse la moins mauvaise à une transformation qu'aucun gouvernement au monde ne sait ralentir.";
        },
      },
      {
        id: "laisser_marche",
        label: "Laisser le marché s'ajuster",
        effects: (c) => {
          c.adj({ country: { croissance: 0.3, chomage: 0.4, cohesion: -4 }, power: { patronat: 8 } });
          return "Vous refusez d'entraver la transformation. La productivité française s'améliore réellement. Une classe moyenne diplômée découvre en même temps la précarité et la colère — deux ingrédients qui ont déjà fait basculer des Républiques.";
        },
      },
    ],
  },
  {
    id: "penurie_medicaments",
    kind: "standard",
    titre: "La rupture de stock",
    once: true,
    weight: 1.5,
    texte:
      "Trois cents médicaments essentiels sont en tension, dont des antibiotiques pédiatriques et un traitement anticancéreux. La cause est connue depuis quinze ans : la production des molécules de base est concentrée dans deux pays d'Asie, parce qu'elles ne rapportent presque rien.",
    choices: [
      {
        id: "relocaliser_medicaments",
        label: "Relocaliser la production",
        effects: (c) => {
          c.adj({ country: { marge: -7, services: 5 }, power: { popularite: 4 } });
          c.seg("periurbain", { soutien: 4 });
          c.log("Vous avez lancé la relocalisation de la production de médicaments essentiels.");
          return "Financement public d'usines de principes actifs, prix garantis, commandes pluriannuelles. C'est de la politique industrielle assumée et coûteuse, pour produire des molécules sans valeur ajoutée. C'est exactement pour ce genre de choses que les États existent.";
        },
      },
      {
        id: "acheter_urgence",
        label: "Acheter en urgence à l'étranger",
        effects: (c) => {
          c.adj({ country: { marge: -3, services: 2 } });
          return "Achats groupés au prix fort, importations dérogatoires, contingentement en pharmacie. La tension retombe en quelques mois. On recommencera l'hiver prochain, avec d'autres molécules, et on rachètera au prix fort.";
        },
      },
    ],
  },
  {
    id: "corse_autonomie",
    kind: "standard",
    titre: "La question insulaire",
    once: true,
    weight: 1.3,
    texte:
      "Après des mois de tension et une nuit d'émeutes, l'assemblée territoriale vote une demande d'autonomie fiscale et linguistique. Le texte est modéré, la menace implicite ne l'est pas. Le Conseil constitutionnel a déjà censuré deux fois des dispositions voisines.",
    choices: [
      {
        id: "negocier_autonomie",
        label: "Ouvrir un processus constitutionnel",
        effects: (c) => {
          c.adj({ country: { cohesion: 4, prestige: 1 }, hidden: { agitation: -6 } });
          c.seg("ruraux", { soutien: -3 });
          c.log("Vous avez ouvert un processus d'autonomie pour un territoire insulaire.");
          return "Un cycle de discussions, une révision constitutionnelle à la clé, des mois de négociation ligne à ligne. Les jacobins de tous les camps crient à la dissolution de la République. La violence, elle, s'arrête — ce qui n'était plus arrivé depuis trente ans.";
        },
      },
      {
        id: "refus_autonomie",
        label: "Refuser : la République est une et indivisible",
        effects: (c) => {
          c.adj({ hidden: { agitation: 8 }, country: { cohesion: -3 } });
          c.seg("pavillonnaires", { soutien: 3 });
          return "Le refus est net et constitutionnellement solide. L'île bascule dans une agitation chronique, avec ses nuits d'incendies et ses funérailles politiques. On appellera ça « le problème », comme on l'appelle depuis cinquante ans.";
        },
      },
    ],
  },
  {
    id: "eau_partage",
    kind: "standard",
    titre: "La guerre de l'eau",
    once: true,
    weight: 1.4,
    texte:
      "Quatrième été de restriction. Un projet de réserve d'irrigation agricole tourne à l'affrontement : sept mille manifestants, des gendarmes blessés, des militants éborgnés. Les deux camps ont des rapports scientifiques opposés, également sérieux, et la nappe phréatique continue de baisser pendant qu'on se bat.",
    choices: [
      {
        id: "moratoire_eau",
        label: "Moratoire et conférence de l'eau",
        effects: (c) => {
          c.adj({ country: { environnement: 4, cohesion: 2 }, hidden: { agitation: -5 } });
          c.seg("ruraux", { soutien: -4 });
          c.seg("urbains", { soutien: 4 });
          return "Chantiers suspendus, expertise indépendante, conférence réunissant irrigants et écologues. Les agriculteurs y voient une capitulation devant les militants. Personne n'est content, la nappe est mesurée sérieusement pour la première fois, et le conflit redevient un dossier.";
        },
      },
      {
        id: "construire_reserves",
        label: "Construire les réserves",
        effects: (c) => {
          c.adj({ country: { environnement: -5 }, hidden: { agitation: 7 } });
          c.seg("ruraux", { soutien: 8 });
          c.seg("urbains", { soutien: -6 });
          return "Les chantiers reprennent sous protection policière. L'agriculture irriguée est sauvée pour dix ans, la ressource souterraine engagée pour cinquante. Les zones à défendre deviennent un mode d'action permanent, avec ses blessés à chaque saison.";
        },
      },
    ],
  },
  {
    id: "presse_lune_miel",
    kind: "standard",
    titre: "Trop d'amis dans les rédactions",
    once: true,
    cond: (s) => s.power.presse >= 70,
    weight: 2,
    texte:
      "Une enquête universitaire montre que 78 % des sujets qui vous concernent sont favorables. Ce serait une bonne nouvelle si la même étude ne relevait pas la cause : douze rédactions en chef sur quinze ont été renouvelées en deux ans, souvent par des proches de votre entourage. Louise Ferrand prépare un papier là-dessus.",
    choices: [
      {
        id: "assumer_presse",
        label: "Assumer : la presse est libre de m'aimer",
        effects: (c) => {
          c.derive(1);
          c.adj({ power: { presse: 3 } });
          c.seg("urbains", { soutien: -4 });
          return "« Je ne nomme aucun rédacteur en chef. » C'est exact, littéralement. Ce sont vos amis actionnaires qui les nomment, et la nuance échappe à peu de monde. Le pluralisme ne meurt jamais d'un décret : il meurt d'une accumulation de bonnes relations.";
        },
      },
      {
        id: "garantir_pluralisme",
        label: "Garantir l'indépendance des rédactions",
        effects: (c) => {
          c.adj({ power: { presse: -10, popularite: 2 }, player: { integrite: 6 } });
          c.derive(-1);
          c.rel("rives", { rancune: 12 });
          c.log("Vous avez fait voter l'indépendance juridique des rédactions — contre votre propre intérêt.");
          return "Vous faites voter un droit d'agrément des rédactions sur leur direction. Votre couverture médiatique se dégrade en six mois, mécaniquement. C'est l'une des rares décisions d'un exécutif qui affaiblit délibérément l'exécutif — les manuels retiendront celle-là.";
        },
      },
    ],
  },
  {
    id: "prestige_mediation",
    kind: "monde",
    titre: "On vous appelle",
    once: true,
    cond: (s) => s.country.prestige >= 78,
    weight: 2.2,
    texte:
      "Deux puissances au bord de l'affrontement acceptent le principe d'une médiation — et demandent la France, parce que vous êtes le seul dirigeant que les deux camps consentent à écouter. Six semaines de navette, sans garantie, avec une exposition mondiale en cas d'échec.",
    choices: [
      {
        id: "mediation_accepter",
        label: "Y aller",
        effects: (c) => {
          const ok = c.rng.chance(0.55);
          c.adj({ hidden: { fatigue: 14 } });
          if (ok) {
            c.adj({ country: { prestige: 12 }, power: { popularite: 6 } });
            c.log("Votre médiation a évité une guerre entre deux puissances.");
            return "Onze déplacements, deux nuits blanches par semaine, un accord signé dans une ville dont personne ne savait prononcer le nom. La guerre n'aura pas lieu. C'est le genre de réussite dont on ne mesure jamais l'ampleur, précisément parce qu'elle empêche l'événement qui l'aurait rendue mesurable.";
          }
          c.adj({ country: { prestige: -6 }, power: { popularite: -4 } });
          return "Six semaines d'efforts, un échec public et un communiqué gêné. La guerre éclate trois jours après votre départ, et les images de votre poignée de main avec les deux camps tournent en boucle avec un commentaire cruel. On ne vous reprochera pas d'avoir essayé — on vous le rappellera, ce qui revient au même.";
        },
      },
      {
        id: "mediation_refuser",
        label: "Décliner",
        effects: (c) => {
          c.adj({ country: { prestige: -3 } });
          return "La France « soutient toute initiative de dialogue » : le communiqué de ceux qui restent chez eux. Un autre pays s'en chargera et récoltera ce qu'il y avait à récolter. Vous aurez au moins gouverné votre pays pendant ce temps-là, ce qui est aussi un métier.";
        },
      },
    ],
  },
  {
    id: "prestige_humiliation",
    kind: "monde",
    titre: "La chaise vide",
    once: true,
    cond: (s) => s.country.prestige <= 42,
    weight: 2.2,
    texte:
      "Un sommet régional majeur se tient sans la France : non pas qu'on vous ait exclu, mais personne n'a jugé utile d'insister quand votre agenda a posé problème. Les décisions prises vous concernent directement. La presse étrangère parle d'un « effacement français » avec une compassion humiliante.",
    choices: [
      {
        id: "reconquete_diplo",
        label: "Reconquête diplomatique méthodique",
        effects: (c) => {
          c.adj({ country: { prestige: 7, marge: -3 }, hidden: { fatigue: 10 } });
          c.rel("weiss", { loyaute: 6 });
          return "Tournée des capitales, réouverture de trois postes fermés par économie, initiative concrète sur un dossier technique dont personne ne veut. C'est ingrat et ça marche : l'influence se reconstruit par les dossiers ennuyeux, jamais par les discours.";
        },
      },
      {
        id: "coup_eclat",
        label: "Un coup d'éclat unilatéral",
        effects: (c) => {
          const ok = c.rng.chance(0.4);
          if (ok) {
            c.adj({ country: { prestige: 8 }, power: { popularite: 4 } });
            return "L'initiative surprend tout le monde et fonctionne : on redécouvre que la France peut décider seule et vite. Le coup d'éclat réussi est la drogue la plus dangereuse de la diplomatie — il donne envie de recommencer.";
          }
          c.adj({ country: { prestige: -6 } });
          c.rel("weiss", { loyaute: -8 });
          return "L'initiative tombe à plat : les partenaires, prévenus par la presse, la prennent pour ce qu'elle est — une opération de communication intérieure. Berlin fait savoir sèchement qu'il « aurait apprécié d'être consulté ». Vous êtes désormais effacé ET agaçant.";
        },
      },
    ],
  },
  {
    id: "peche_zones",
    kind: "standard",
    titre: "Les chalutiers",
    once: true,
    weight: 1.1,
    texte:
      "Bruxelles impose une réduction de 40 % des quotas dans une zone où pêchent six cents bateaux français. Les scientifiques du Muséum confirment l'effondrement du stock ; les patrons pêcheurs répondent qu'on les condamne à mort pour sauver des poissons que d'autres flottes pilleront quand même.",
    choices: [
      {
        id: "accepter_quotas",
        label: "Appliquer et indemniser",
        effects: (c) => {
          c.adj({ country: { environnement: 5, marge: -4 } });
          c.seg("ruraux", { soutien: -5 });
          return "Plan de sortie de flotte, indemnisations, reconversion. Les ports se vident un peu plus, le stock se reconstituera en une décennie. C'est la bonne décision et elle détruit des villes entières que personne n'ira consoler.";
        },
      },
      {
        id: "bloquer_quotas",
        label: "Bloquer au Conseil européen",
        effects: (c) => {
          c.adj({ country: { environnement: -4, prestige: -2 } });
          c.seg("ruraux", { soutien: 6 });
          c.rel("weiss", { loyaute: -4 });
          return "Vous obtenez un report de deux ans en échange d'une concession sur un autre dossier. Les pêcheurs vous portent en triomphe à Lorient. Le stock, lui, ne lit pas les compromis politiques et continue de s'effondrer.";
        },
      },
    ],
  },
  {
    id: "culture_polemique",
    kind: "standard",
    titre: "L'œuvre qui dérange",
    once: true,
    weight: 1,
    texte:
      "Une œuvre exposée dans un musée national provoque un tollé, des manifestations devant l'entrée, et deux dégradations. Le ministre suggère de « déplacer l'œuvre pour raisons de sécurité ». Le directeur du musée menace de démissionner si on y touche.",
    choices: [
      {
        id: "maintenir_oeuvre",
        label: "Maintenir l'exposition",
        effects: (c) => {
          c.adj({ country: { cohesion: -2 }, power: { presse: 5 } });
          c.seg("urbains", { soutien: 5 });
          c.seg("ruraux", { soutien: -3 });
          return "L'œuvre reste, la protection est renforcée, la fréquentation triple. « Un État qui déplace une œuvre parce qu'elle dérange n'a plus de musées, il a des vitrines. » La phrase est de vous et fera date dans les écoles d'art.";
        },
      },
      {
        id: "deplacer_oeuvre",
        label: "La déplacer discrètement",
        effects: (c) => {
          c.adj({ power: { presse: -6 }, player: { integrite: -3 } });
          c.seg("urbains", { soutien: -5 });
          c.derive(1);
          return "L'œuvre part en réserve « pour restauration ». Le directeur démissionne avec une lettre reprise partout. C'est un tout petit renoncement, indolore et daté — le genre dont on fait plus tard des chronologies.";
        },
      },
    ],
  },
  {
    id: "natalite",
    kind: "standard",
    titre: "Le chiffre des naissances",
    once: true,
    weight: 1.2,
    texte:
      "La natalité atteint son plus bas niveau depuis la Seconde Guerre mondiale. Les démographes expliquent : logement, précarité, garde d'enfants introuvable, et un pessimisme profond sur l'avenir. Les éditorialistes, eux, ont chacun leur explication et ce ne sont pas les mêmes.",
    choices: [
      {
        id: "creches",
        label: "Un plan massif pour la garde d'enfants",
        effects: (c) => {
          c.adj({ country: { marge: -7, services: 5, cohesion: 3 } });
          c.seg("jeunes", { soutien: 6 });
          c.seg("pavillonnaires", { soutien: 4 });
          return "Deux cent mille places de crèche, congé parental mieux payé, horaires élargis. Les effets démographiques sont incertains ; les effets sur l'emploi des femmes et sur la vie quotidienne des familles, eux, sont documentés et immédiats. C'est déjà beaucoup pour une politique publique.";
        },
      },
      {
        id: "prime_naissance",
        label: "Une prime à la naissance",
        effects: (c) => {
          c.adj({ country: { marge: -5 } });
          c.seg("ruraux", { soutien: 4 });
          c.seg("urbains", { soutien: -2 });
          return "Une prime substantielle, versée en une fois, très visible. Toutes les études internationales montrent que les primes ne font pas naître d'enfants — elles avancent seulement de quelques mois des naissances déjà prévues. Le geste est populaire, c'est sa seule qualité mesurable.";
        },
      },
    ],
  },
  {
    id: "mediterranee",
    kind: "monde",
    titre: "Le naufrage",
    once: true,
    weight: 1.3,
    texte:
      "Un naufrage fait quatre-vingts morts au large, dont des enfants, et un navire humanitaire demande à débarquer les rescapés dans un port français après trois refus successifs. Les images sont insoutenables, la question juridique est complexe, et chacun connaît déjà votre réponse selon le camp où il se range.",
    choices: [
      {
        id: "accueillir_navire",
        label: "Ouvrir un port",
        effects: (c) => {
          c.seg("urbains", { soutien: 5 });
          c.seg("quartiers", { soutien: 4 });
          c.seg("pavillonnaires", { soutien: -6 });
          c.seg("ruraux", { soutien: -4 });
          c.adj({ country: { prestige: 3 } });
          return "Le navire accoste, les rescapés sont pris en charge, la droite parle d'appel d'air et la gauche d'humanité minimale. Les deux discours sont récités depuis dix ans sans qu'aucun n'ait jamais changé un seul chiffre migratoire.";
        },
      },
      {
        id: "refuser_navire",
        label: "Refuser et négocier une répartition européenne",
        effects: (c) => {
          c.seg("pavillonnaires", { soutien: 4 });
          c.seg("urbains", { soutien: -5 });
          c.adj({ country: { prestige: -3 }, player: { integrite: -3 } });
          return "Le navire erre huit jours de plus pendant que les chancelleries négocient une répartition de quatre-vingt-dix personnes entre vingt-sept pays. L'accord finit par arriver. Ces huit jours resteront comme une des expressions les plus exactes de ce qu'est devenue l'Europe.";
        },
      },
    ],
  },
  {
    id: "drogue_ville",
    kind: "standard",
    titre: "Le point de deal",
    once: true,
    weight: 1.4,
    texte:
      "Une fusillade au fusil d'assaut fait deux morts, dont une adolescente qui rentrait de cours, dans une ville moyenne qui se croyait à l'abri. Le trafic s'est déplacé des métropoles vers des villes de trente mille habitants où il n'y a ni brigade spécialisée, ni juge d'instruction dédié.",
    choices: [
      {
        id: "operation_coup_poing",
        label: "Opérations massives et médiatisées",
        effects: (c) => {
          c.adj({ country: { securite: 4 }, power: { popularite: 5 } });
          c.seg("quartiers", { soutien: -4 });
          c.sched("drogue_retour", 4, 9, 0.5);
          return "Cinq cents policiers, hélicoptères, journalistes embarqués. Les saisies sont réelles, les images excellentes, et le trafic reprend trois semaines après le départ des caméras, ailleurs. Les habitants du quartier concerné le savent avant vous.";
        },
      },
      {
        id: "moyens_judiciaires",
        label: "Renforcer discrètement enquêteurs et magistrats",
        effects: (c) => {
          c.adj({ country: { securite: 5, marge: -4 }, power: { justice: 5, popularite: -1 } });
          c.sched("drogue_reseau", 5, 10, 0.55);
          return "Des juges d'instruction spécialisés, des enquêteurs financiers, des moyens d'interception. Zéro image, aucun bénéfice politique immédiat, et la seule méthode qui ait jamais démantelé un réseau plutôt que de le déplacer.";
        },
      },
      {
        id: "legaliser_debat",
        label: "Ouvrir le débat sur la légalisation",
        effects: (c) => {
          c.seg("jeunes", { soutien: 7 });
          c.seg("retraites", { soutien: -6 });
          c.adj({ country: { securite: -1 } });
          c.promesse("cannabis", "partielle");
          return "Vous ouvrez le débat — pas la légalisation, le débat, ce qui est déjà considérable dans ce pays. Les policiers de terrain, interrogés anonymement, sont beaucoup plus partagés que leurs syndicats. Les retraités, eux, ne sont pas partagés du tout.";
        },
      },
    ],
  },
  {
    id: "drogue_retour",
    kind: "standard",
    titre: "Ils sont revenus",
    once: true,
    weight: 0,
    texte:
      "Six mois après l'opération médiatisée, le point de deal a rouvert à trois cents mètres de son emplacement d'origine, avec des guetteurs plus jeunes et des armes plus lourdes. Le maire, qui avait applaudi l'opération, écrit une lettre ouverte au ton nettement moins reconnaissant.",
    choices: [
      {
        id: "insister",
        label: "Recommencer, plus fort",
        effects: (c) => {
          c.adj({ country: { securite: 2, marge: -3 } });
          c.seg("quartiers", { soutien: -3 });
          return "Nouvelle opération, mêmes images, même résultat à six mois. On appelle ça « le pilonnage » dans les services, avec le fatalisme de gens qui savent que la décision ne leur appartient pas.";
        },
      },
      {
        id: "changer_methode",
        label: "Changer de méthode",
        effects: (c) => {
          c.adj({ country: { securite: 4, marge: -4 }, power: { justice: 4 }, player: { strategie: 3 } });
          return "Vous basculez vers l'enquête longue et le renseignement financier, en assumant l'absence d'images. Reconnaître qu'une méthode ne marche pas est l'acte politique le plus coûteux qui soit : il faut admettre qu'on avait tort devant ceux qui avaient applaudi.";
        },
      },
    ],
  },
  {
    id: "drogue_reseau",
    kind: "standard",
    titre: "Le réseau tombe",
    once: true,
    weight: 0,
    texte:
      "Après deux ans d'enquête, une opération judiciaire simultanée dans six pays démantèle toute la chaîne : logistique, blanchiment, donneurs d'ordre installés à l'étranger. Quatre cents millions d'avoirs saisis. C'est le résultat des moyens que vous aviez accordés sans caméras.",
    choices: [
      {
        id: "acter_reseau",
        label: "Laisser la justice communiquer",
        effects: (c) => {
          c.adj({ country: { securite: 8 }, power: { justice: 6, popularite: 4 } });
          c.log("Un réseau international a été démantelé grâce aux moyens judiciaires que vous aviez accordés.");
          return "Vous laissez la procureure annoncer elle-même, sans ministre à côté d'elle sur l'estrade. Le geste est remarqué par toute la magistrature. Il arrive qu'un renoncement à la communication soit la meilleure communication possible.";
        },
      },
    ],
  },
];
