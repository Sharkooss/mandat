import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// La part de folie.
//
// Six accidents que rien dans les jauges n'annonce et qu'aucune stratégie ne
// prépare. Ils sont volontairement très rares (`weight` minuscule) et jamais
// avant le troisième semestre : leur fonction n'est pas d'équilibrer une
// partie, c'est de la faire dérailler. Chacun peut armer une occasion
// historique que rien d'autre dans le jeu n'ouvre — c'est là que se trouve la
// vraie récompense, et c'est pour ça qu'ils ne sont pas que des blagues.
// ---------------------------------------------------------------------------

/** Assez rare pour qu'une partie sur trois environ en croise un seul. */
const FOLIE = 0.25;

const APRES_TROIS_SEMESTRES = (s: { turnCount: number }) => s.turnCount >= 3;

export const EVENTS_FOLIE: GameEvent[] = [
  {
    id: "folie_sosie",
    kind: "perso",
    titre: "L'autre",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "Le préfet de la Sarthe transmet une note embarrassée : depuis huit mois, un homme qui vous ressemble beaucoup inaugure des ronds-points, remet des médailles agricoles et serre des mains dans quatre départements. Personne n'a jamais rien vérifié. Les comptes rendus municipaux sont dithyrambiques. Il est, dans le Grand Ouest, nettement plus populaire que vous.",
    choices: [
      {
        id: "arreter",
        label: "Le faire interpeller",
        detail: "Usurpation. C'est un délit, et c'est net.",
        effects: (c) => {
          c.adj({ power: { presse: -6, popularite: -4 } });
          c.seg("ruraux", { soutien: -5 });
          return "Deux gendarmes l'attendent à la sortie d'une fête de la mirabelle. Il ne résiste pas, il pleure, il explique qu'il n'a jamais demandé d'argent — ce qui est exact. Les images de l'interpellation tournent trois jours. Dans quatre départements, on a désormais l'impression que la République a arrêté quelqu'un pour excès de gentillesse.";
        },
      },
      {
        id: "rencontrer",
        label: "Le rencontrer. Seul.",
        detail: "Il y a une question qu'on ne peut poser qu'en face.",
        effects: (c) => {
          c.flag("sosie_rencontre");
          c.adj({ hidden: { paranoia: 8, fatigue: -4 } });
          c.log("Vous avez rencontré l'homme qui se faisait passer pour vous.");
          return "Il s'appelle Marcel, il est retraité des Ponts, et il vous vouvoie avec une déférence qui met mal à l'aise. Vous parlez deux heures. Il connaît vos discours mieux que vous, il sait exactement quelle main tendre en premier dans une file, et il n'a jamais rien demandé à personne. En repartant, vous ne pensez pas à la plainte que vos services préparent. Vous pensez à son agenda du mois prochain.";
        },
      },
      {
        id: "silence",
        label: "Étouffer et ne rien dire",
        effects: (c) => {
          c.derive(1);
          c.adj({ hidden: { paranoia: 6 } });
          c.dossier("sosie", "L'homme qu'on a fait taire dans la Sarthe", 14);
          return "Une convocation, une lettre d'avocat, un engagement écrit de ne plus jamais reparaître en public. L'affaire s'éteint en quinze jours. Il reste un homme de soixante-huit ans à qui l'État a interdit d'être aimable, et un dossier quelque part avec son nom dessus.";
        },
      },
    ],
  },
  {
    id: "folie_manuscrit",
    kind: "perso",
    titre: "Le cahier de quatre heures du matin",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "Trois semaines que vous dormez deux heures par nuit. Le reste du temps, vous écrivez — pas des notes, pas des discours : un texte. Quatre cent dix pages en vingt et un jours, sur ce qu'est un peuple et ce qu'on lui doit. Ce matin, votre directeur de cabinet a trouvé le cahier ouvert sur la table du petit déjeuner et n'a pas su quoi en dire.",
    choices: [
      {
        id: "bruler",
        label: "Le brûler et dormir",
        effects: (c) => {
          c.adj({ hidden: { fatigue: -18, sante: 4, paranoia: -6 } });
          return "Vous le brûlez dans la cheminée du bureau d'angle, ce qui est ridicule et très efficace. Vous dormez onze heures. Le lendemain, en conseil, vous êtes meilleur que vous ne l'avez été depuis un an — et vous pensez déjà à une phrase de la page 212 que vous ne retrouverez jamais.";
        },
      },
      {
        id: "faire_lire",
        label: "Le faire lire à Camille Roze",
        detail: "Elle vous dira la vérité. C'est son seul défaut.",
        effects: (c) => {
          c.flag("manuscrit_nocturne");
          c.rel("roze", { loyaute: 8 });
          c.adj({ hidden: { fatigue: 6, paranoia: 4 } });
          c.log("Vous avez écrit un livre en trois semaines d'insomnie.");
          return "Elle le lit en une nuit et revient avec une tête que vous ne lui connaissiez pas. « Les cent premières pages sont ce que vous avez fait de mieux. Les cent dernières feraient tomber le gouvernement. » Elle repose le cahier sur la table sans le lâcher tout à fait, et ajoute : « Ne le donnez à personne d'autre. »";
        },
      },
      {
        id: "continuer",
        label: "Continuer d'écrire",
        detail: "Le pays attendra trois semaines de plus.",
        effects: (c) => {
          c.flag("manuscrit_nocturne");
          c.adj({ hidden: { fatigue: 16, sante: -6, paranoia: 10 }, power: { popularite: -4 } });
          c.press("« Le Président fantôme » — trois conseils annulés en quinze jours, personne ne sait pourquoi", "hostile");
          return "Vous écrivez encore cent quatre-vingts pages. Le pays gouverne à peu près sans vous pendant ce temps-là, ce qui n'inquiète personne parce que personne ne le remarque. À la fin, vous avez un livre et une mine que la presse commente avant votre bilan.";
        },
      },
    ],
  },
  {
    id: "folie_voix",
    kind: "perso",
    titre: "Ce que dit la statue",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "Dépôt de gerbe, cour d'honneur, dix-sept degrés, la musique de la Garde. Au moment où vous vous redressez devant la statue, une voix vous dit une phrase de sept mots. Distinctement. Personne autour de vous n'a réagi. La cérémonie continue. Vous avez terminé la journée normalement, et la phrase est toujours là ce soir.",
    choices: [
      {
        id: "manin",
        label: "Appeler le Dr Manin ce soir",
        effects: (c) => {
          c.adj({ hidden: { sante: 4, paranoia: -8, fatigue: -6 } });
          c.rel("manin", { loyaute: 8 });
          return "Il vient à 23 h avec sa sacoche et aucun commentaire. Tension, sommeil, doses, deux examens programmés sous un faux nom. Diagnostic provisoire : un homme épuisé qui a entendu ce qu'un homme épuisé entend. Il vous fait promettre trois nuits complètes. Vous en tiendrez deux, ce qui est déjà un record de ce mandat.";
        },
      },
      {
        id: "garder",
        label: "N'en parler à personne",
        detail: "Et l'écouter, si elle revient.",
        effects: (c) => {
          c.flag("voix_gardees");
          c.adj({ hidden: { paranoia: 14, fatigue: 4 } });
          c.derive(1);
          c.log("Vous avez commencé à entendre des choses, et vous n'en avez parlé à personne.");
          return "Vous ne dites rien, à personne, jamais. Elle revient trois fois en deux mois : toujours dans des lieux vides, toujours sept mots, toujours une phrase que vous ne pouviez pas inventer. Vos décisions de ce trimestre sont excellentes. C'est bien ce qui est troublant.";
        },
      },
      {
        id: "historien",
        label: "Faire venir un historien",
        detail: "Vérifier si la phrase existe.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 6 }, country: { prestige: 2 } });
          c.press("« Le Président et les archives » — une commande d'État à un historien intrigue les rédactions", "neutre");
          return "L'historien met onze jours et revient très pâle : la phrase figure dans une lettre non publiée de 1947, conservée à Colombey, que quatre personnes vivantes ont lue. Il vous demande où vous l'avez trouvée. Vous répondez que vous ne savez plus. Il n'insiste pas, et c'est la seule chose aimable qu'on vous ait faite ce mois-ci.";
        },
      },
    ],
  },
  {
    id: "folie_ciel",
    kind: "monde",
    titre: "L'objet du 14 juillet",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "14 h 07, défilé aérien. Un objet traverse le champ de trois caméras nationales, à contre-sens de la patrouille, sans bruit, sans traînée. L'armée de l'air parle d'un drone civil ; les radars n'ont rien vu ; quatre millions de vues en une heure. Le chef d'état-major demande à vous voir seul, ce qu'il n'a jamais fait pour un drone civil.",
    choices: [
      {
        id: "dementir",
        label: "Démentir fermement",
        effects: (c) => {
          c.adj({ power: { presse: -5, popularite: -3 }, hidden: { paranoia: 6 } });
          c.press("« CIRCULEZ » — le démenti de l'Élysée fait vingt fois plus de vues que l'objet", "satirique");
          return "Le communiqué emploie le mot « ballon météorologique », qui n'a jamais convaincu personne nulle part depuis 1947. Le pays passe six semaines à ne parler que de ça. Un tiers des Français déclare désormais que l'État leur cache quelque chose — ce qui, en l'occurrence, est rigoureusement exact.";
        },
      },
      {
        id: "ecouter",
        label: "Recevoir le chef d'état-major. Seul.",
        effects: (c) => {
          c.flag("objet_ciel");
          c.rel("verdier", { loyaute: 10 });
          c.adj({ hidden: { paranoia: 10 }, power: { armee: 4 } });
          c.log("Vous avez été informé(e) de ce que l'armée sait vraiment sur l'objet du 14 juillet.");
          return "Il pose un dossier de trente pages, attend que vous l'ouvriez, et ne dit rien pendant que vous lisez. Il y a onze cas depuis 1954, quatre survols de sites nucléaires, et une note de 1978 signée d'un nom que tout le monde connaît. À la fin, il dit une seule phrase : « Nous n'avons jamais su. Ce n'est pas la même chose que rien. »";
        },
      },
      {
        id: "commission",
        label: "Créer une commission d'enquête",
        effects: (c) => {
          c.adj({ hidden: { agitation: -3 }, power: { presse: 3, popularite: 2 } });
          c.flag("commission_en_cours");
          return "Six scientifiques, deux militaires, dix-huit mois. La commission conclura à « un phénomène non identifié d'origine probablement technologique », phrase magnifique qui ne veut rien dire et que tout le monde citera. Vous avez transformé un mystère national en rapport administratif — c'est ce que la République sait faire de mieux.";
        },
      },
    ],
  },
  {
    id: "folie_chat",
    kind: "perso",
    titre: "Le chat de l'Élysée",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "Un institut a testé, pour rire, la cote de popularité du chat de l'Élysée. Il obtient 81 % d'opinions favorables, tous électorats confondus, y compris chez ceux qui ne votent jamais. C'est le score le plus élevé jamais mesuré pour une entité domiciliée au 55 rue du Faubourg-Saint-Honoré. Votre service de communication vous soumet une note de quatre pages sur le sujet, sans ironie.",
    choices: [
      {
        id: "exploiter",
        label: "Signer la note",
        detail: "Compte officiel, tournée d'écoles, peluche.",
        effects: (c) => {
          c.flag("chat_etat");
          c.adj({ power: { popularite: 6, presse: -3 } });
          c.seg("jeunes", { soutien: 5 });
          c.seg("urbains", { soutien: 3 });
          c.log("Le chat de l'Élysée est devenu un instrument de communication d'État.");
          return "Compte officiel en quatre langues, six cent mille abonnés en dix jours, une peluche dont les recettes vont aux orphelins de la police. Les éditorialistes s'étranglent, les taux d'engagement explosent, et votre porte-parole doit répondre à une question sur l'alimentation du chat lors d'un point sur la dette. Vous avez gagné six points et perdu quelque chose d'autre.";
        },
      },
      {
        id: "eloigner",
        label: "Le faire discrètement partir",
        detail: "On ne partage pas l'affiche.",
        effects: (c) => {
          c.adj({ power: { presse: -8, popularite: -6 }, hidden: { paranoia: 8 } });
          c.press("« OÙ EST LE CHAT ? » — la question posée seize fois en trois jours au porte-parole", "satirique");
          return "Il part chez un cousin de votre chef de cabinet, dans le Loiret, avec un jardin. La rumeur sort en quarante-huit heures. Pendant onze jours, le pays parle exclusivement de ça, avec un mélange d'hilarité et d'inquiétude sincère pour votre santé mentale. Aucune de vos réformes n'a jamais obtenu ce niveau d'attention.";
        },
      },
      {
        id: "rien",
        label: "Laisser le chat tranquille",
        effects: (c) => {
          c.adj({ power: { popularite: 2 }, hidden: { fatigue: -4 } });
          c.rel("conjoint", { loyaute: 5 });
          return "Vous rendez la note sans la signer, avec une seule mention manuscrite : « non ». Le chat continue de dormir sur le fauteuil du salon vert pendant les réunions d'arbitrage budgétaire, ce qui reste, tout compte fait, la seule chose parfaitement raisonnable de cette maison.";
        },
      },
    ],
  },
  {
    id: "folie_prophete",
    kind: "standard",
    titre: "Le prophète de Béziers",
    rarete: "legendaire",
    once: true,
    weight: FOLIE,
    cond: APRES_TROIS_SEMESTRES,
    texte:
      "Un homme de trente-quatre ans, ancien commercial en fenêtres, publie depuis deux ans des vidéos où il annonce des dates. Il avait donné, à la semaine près, la démission d'un ministre et le chiffre du chômage de l'automne. Hier soir, il a annoncé la date exacte de la fin de votre mandat. Onze millions de vues avant midi. Les services vous demandent des instructions.",
    choices: [
      {
        id: "ridiculiser",
        label: "Le tourner en dérision publiquement",
        effects: (c) => {
          c.adj({ power: { popularite: -4, presse: 2 }, hidden: { agitation: 4 } });
          c.seg("jeunes", { soutien: -4 });
          return "Vous placez une pique en fin d'interview, très réussie, reprise partout. Elle fait de lui quelqu'un dont le président a parlé — le seul cadeau qu'il ne pouvait pas s'offrir. Ses vues doublent dans la nuit. Il ne répond pas, ce qui est très supérieur à ce que vous avez fait.";
        },
      },
      {
        id: "surveiller",
        label: "Le faire surveiller discrètement",
        effects: (c) => {
          c.derive(2);
          c.adj({ hidden: { paranoia: 12 }, power: { justice: -4 } });
          c.dossier("prophete", "La surveillance d'un citoyen pour ses opinions", 22);
          c.rel("ternay", { loyaute: 4 });
          return "Yves Ternay accepte sans un mot, ce qui est sa façon de désapprouver. Le rapport arrive six semaines plus tard : rien. Pas de réseau, pas d'argent, pas d'étranger derrière. Un homme seul dans un F2 avec un anneau lumineux et une intuition. Vous avez fait surveiller un citoyen parce qu'il avait eu raison deux fois.";
        },
      },
      {
        id: "recevoir",
        label: "Le faire venir. Voir de quoi il s'agit.",
        detail: "Personne ne doit savoir. Personne ne saura.",
        effects: (c) => {
          c.flag("prophete_recu");
          c.adj({ hidden: { paranoia: 10, fatigue: 4 } });
          c.log("Vous avez reçu en secret l'homme qui annonce la date de votre chute.");
          return "Il entre par la rue de l'Élysée, à 22 h 40, sans téléphone. Il n'est ni fou ni exalté : il est timide, il lit énormément, et il vous explique en quarante minutes une méthode faite de rapports publics, de bilans d'entreprises et de calendriers administratifs. Rien de surnaturel. C'est bien pire : c'est vérifiable. En partant, il vous dit qu'il espère se tromper cette fois-ci.";
        },
      },
    ],
  },

  // --- Ce que la folie coûte, quelques semestres plus tard ------------------
  {
    id: "sosie_revelation",
    kind: "perso",
    titre: "Le trente-neuvième déplacement",
    once: true,
    weight: 0,
    texte:
      "Une photographe locale a comparé deux clichés pris à six jours d'intervalle : la cicatrice n'est pas du même côté. Elle a vendu son enquête à un hebdomadaire, qui a retrouvé la société de prestation, le contrat, et Marcel. Le titre de couverture tient en trois mots : « QUI SERRAIT LES MAINS ? »",
    choices: [
      {
        id: "assumer",
        label: "Tout reconnaître le jour même",
        detail: "Le dire soi-même, avant qu'on ne le prouve.",
        effects: (c) => {
          c.adj({ power: { popularite: -12, presse: -6 }, player: { integrite: -4 } });
          c.seg("ruraux", { soutien: -10 });
          c.log("L'affaire du sosie a éclaté, et vous l'avez reconnue.");
          return "Vous reconnaissez tout en huit minutes, sans conseiller à côté, en expliquant l'agenda, la fatigue et l'idée absurde qui a suivi. C'est ce qu'on pouvait faire de moins pire. Le pays trouve l'histoire fascinante et vous, considérablement plus petit. Marcel, lui, reçoit trois propositions de télévision et n'en accepte aucune — jusqu'au bout, il aura eu plus de tenue que l'État.";
        },
      },
      {
        id: "nier",
        label: "Nier en bloc",
        detail: "Le contrat est passé par une société écran. Prouvez-le.",
        effects: (c) => {
          c.derive(2);
          c.adj({ power: { popularite: -6, presse: -12, justice: -5 }, player: { integrite: -10 }, hidden: { paranoia: 14 } });
          c.dossier("sosie_mensonge", "Le démenti officiel sur l'affaire du sosie", 55);
          return "Le démenti est catégorique, écrit, et faux. Il tient onze jours, jusqu'à la publication du contrat de prestation avec un paraphe qui n'est pas de Marcel. Vous n'avez pas seulement fait faire votre métier par un autre : vous avez menti à ce sujet, sous votre signature, et ça, ça se garde au chaud pour plus tard.";
        },
      },
    ],
  },
  {
    id: "ombres_suite",
    kind: "perso",
    titre: "La salle des cartes",
    once: true,
    weight: 0,
    texte:
      "Camille Roze est entrée sans frapper à 23 h 10, ce qu'elle n'avait jamais fait. Vous étiez seul, debout devant la carte, en train de répondre à quelqu'un. Elle est restée sur le seuil quatre secondes, puis a refermé la porte. Ce matin, elle a demandé un entretien et un témoin.",
    choices: [
      {
        id: "avouer",
        label: "Lui dire la vérité",
        effects: (c) => {
          c.adj({ hidden: { paranoia: -12, sante: 3 }, power: { popularite: -3 } });
          c.rel("roze", { loyaute: 14, rancune: -8 });
          c.rel("manin", { loyaute: 6 });
          return "Vous lui dites tout, dans l'ordre, y compris les sept mots. Elle ne recule pas, ne prend aucune note, et vous répond une seule chose : « Alors on va dormir, et on continuera à quatre mains. » Le Dr Manin passe le soir même. Vous perdez quelque chose ce jour-là — une clairvoyance, ou une illusion, et vous ne saurez jamais laquelle.";
        },
      },
      {
        id: "ecarter",
        label: "L'écarter du cabinet",
        detail: "Elle a vu. C'est déjà trop.",
        effects: (c) => {
          c.derive(2);
          c.adj({ hidden: { paranoia: 18 }, power: { presse: -10, popularite: -6 } });
          c.rel("roze", { rancune: 30, loyaute: -30 });
          c.log("Vous avez écarté Camille Roze après ce qu'elle avait vu.");
          return "Mutation dans un cabinet ministériel, avec une lettre de remerciements très chaleureuse. Elle part sans un mot à la presse, ce qui est bien plus inquiétant qu'une tribune : elle sait, elle est seule à savoir, et vous venez de lui donner une raison. Le poste reste vacant six semaines parce que personne ne veut l'occuper.";
        },
      },
    ],
  },
  {
    id: "prospective_premier_rapport",
    kind: "standard",
    titre: "La note de six pages",
    once: true,
    weight: 0,
    texte:
      "Le bureau du septième étage rend sa quatrième note. Elle annonce, à trois semaines près, un événement social majeur dans une région précise, avec la liste des sites concernés et le mécanisme complet. Elle est datée, signée, et déposée en trois exemplaires. Si elle a raison, vous saurez avant tout le monde. Si vous agissez dessus, tout le monde saura que vous saviez.",
    choices: [
      {
        id: "agir",
        label: "Agir sur la note",
        detail: "Désamorcer avant que ça n'existe.",
        effects: (c) => {
          c.adj({ hidden: { agitation: -14 }, country: { marge: -4, cohesion: 3 }, power: { popularite: 4 } });
          c.flag("prospective_validee");
          c.log("Une crise sociale majeure a été désamorcée avant d'avoir commencé.");
          return "Trois préfets mobilisés, une enveloppe débloquée, deux négociations ouvertes sur des sites où il ne se passait rien. Six semaines plus tard, la crise n'a pas lieu. Personne ne vous en félicitera jamais : on ne décore pas les gens pour des catastrophes absentes. Vous êtes le seul à savoir ce que ce semestre a évité, et ça vous suffit — c'est même la première fois que ça vous suffit.";
        },
      },
      {
        id: "archiver",
        label: "Classer la note",
        detail: "Gouverner sur des prédictions, c'est déjà autre chose.",
        effects: (c) => {
          c.adj({ hidden: { agitation: 10 }, power: { popularite: -4 } });
          c.seg("periurbain", { soutien: -5 });
          return "Vous classez la note, par prudence institutionnelle, et vous avez raison sur le principe : un État ne se gouverne pas sur des prophéties, même vérifiables. La crise survient dix-neuf jours après la date annoncée, sur les sites listés, selon le mécanisme décrit. Le rapport est dans un tiroir avec votre paraphe et la date à laquelle vous l'avez lu.";
        },
      },
      {
        id: "dissoudre",
        label: "Dissoudre le bureau",
        detail: "Trop de gens commencent à en parler.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 10 }, player: { strategie: -4 } });
          c.rel("ternay", { loyaute: 8, rancune: -6 });
          c.flag("prospective_dissoute");
          return "Fin de la prestation, matériel restitué, badges désactivés un vendredi. Yves Ternay reprend le sujet dans son périmètre avec la satisfaction discrète de qui n'a jamais aimé les amateurs. Le jeune homme retourne à ses vidéos. Il ne dit rien de son passage rue de Varenne, ce qui, compte tenu de l'audience dont il dispose, relève de la grandeur d'âme.";
        },
      },
    ],
  },
];
