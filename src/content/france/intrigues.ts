import type { GameEvent, GameState } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les intrigues à épisodes. Chaque arc est une chaîne d'événements reliés par
// des drapeaux et des déclencheurs différés : la mémoire longue du jeu.
// ---------------------------------------------------------------------------

/** Le plus vieux secret du joueur — la cible de Louise Ferrand. */
export function plusVieuxSecret(s: GameState): { flag: string; nom: string } {
  if (s.flags["carnets_armes"] || s.flags["don_libanais"]) return { flag: "secret_financement", nom: "le financement de votre campagne" };
  if (s.flags["these_arrangee"]) return { flag: "secret_these", nom: "votre thèse de doctorat" };
  if (s.flags["passe_militaire"]) return { flag: "secret_opex", nom: "une opération de votre passé militaire" };
  if (s.flags["amities_marseille"]) return { flag: "secret_marseille", nom: "vos amitiés marseillaises" };
  if (s.flags["pot_de_vin_ascension"] || s.flags["zone_flou"]) return { flag: "secret_zone", nom: "le marché de la zone d'activité" };
  if (s.flags["frere_condamne"]) return { flag: "secret_frere", nom: "le dossier judiciaire de votre frère" };
  return { flag: "secret_mineur", nom: "vos années de jeunesse" };
}

export const EVENTS_INTRIGUES: GameEvent[] = [
  // =========================================================================
  // 1. L'AFFAIRE DES CARNETS
  // =========================================================================
  {
    id: "carnets_1",
    kind: "intrigue",
    titre: "Trois lignes dans « Le Fil »",
    once: true,
    weight: 0,
    texte:
      "Page 12 du « Fil », en bas : « Selon nos informations, le parquet financier s'intéresserait à des mouvements de fonds liés à la dernière campagne présidentielle. » Trois lignes. Personne n'en parle. Vous les avez relues quatre fois.",
    choices: [
      {
        id: "rien",
        label: "Ne rien faire",
        detail: "Trois lignes ne sont pas un article.",
        effects: (c) => {
          c.sched("carnets_2", 3, 8, 0.5);
          return "Vous refermez le journal. Espitalier, joint dans la journée « pour tout autre chose », a la voix de quelqu'un qui a lu la page 12. L'affaire dort. Les affaires dorment toujours, avant.";
        },
      },
      {
        id: "espitalier",
        label: "Convoquer Espitalier",
        effects: (c) => {
          c.rel("espitalier", { loyaute: -5 });
          c.sched("carnets_2", 3, 8, 0.5);
          c.adj({ hidden: { paranoia: 3 } });
          return "Espitalier arrive avec sa serviette et son calme de comptable. « Tout est cloisonné. Rien ne remonte jusqu'à toi. » Il ne dit pas : rien ne remonte jusqu'à moi. Vous notez la différence. Lui aussi.";
        },
      },
      {
        id: "avocat",
        label: "Prendre un avocat, discrètement",
        effects: (c) => {
          c.flag("carnets_avocat");
          c.sched("carnets_2", 3, 8, 0.5);
          return "Maître Sender, pénaliste des affaires, vous reçoit à son cabinet un dimanche. Il écoute, prend deux notes, puis : « Première règle : ne demandez rien à personne. Deuxième : quand ça sortira — et ça sortira — chaque chose que vous aurez faite d'ici là sera regardée. »";
        },
      },
    ],
  },
  {
    id: "carnets_2",
    kind: "intrigue",
    titre: "La protection",
    once: true,
    weight: 0,
    texte:
      "Espitalier demande à vous voir en tête-à-tête. Il n'a plus son calme de comptable. « Le parquet a saisi les comptes de l'intermédiaire. Il me faut un poste. Quelque chose avec un titre — la présidence de l'agence de développement, par exemple. Un trésorier, ça se convoque. Un président d'agence, ça se ménage. »",
    choices: [
      {
        id: "nommer",
        label: "Le nommer",
        detail: "Il sait des choses. Qu'il les garde.",
        effects: (c) => {
          c.adj({ player: { integrite: -5 } });
          c.flag("espitalier_protege");
          c.rel("espitalier", { loyaute: 15 });
          c.press("« L'étrange promotion du trésorier » — Le Fil, Louise Ferrand", "hostile");
          c.rel("ferrand", { ambition: 10 });
          c.sched("carnets_3", 3, 9, 0.55);
          return "Le décret de nomination paraît un jeudi, noyé parmi d'autres. Ferrand le repère en quarante minutes et publie une notice au vitriol. Vous venez d'acheter un silence — c'est-à-dire de confirmer qu'il y avait quelque chose à taire.";
        },
      },
      {
        id: "refuser",
        label: "Refuser",
        detail: "Céder une fois, c'est céder toujours.",
        effects: (c) => {
          c.rel("espitalier", { loyaute: -25, rancune: 20 });
          c.flag("espitalier_lache");
          c.sched("carnets_3", 2, 6, 0.6);
          return "« Je vois. » Deux mots, et il range ses lunettes avec un soin excessif. En partant, il s'arrête à la porte : « Tu sais, la mémoire, c'est comme les carnets. Ça se garde. » Vous auriez préféré une menace claire.";
        },
      },
    ],
  },
  {
    id: "carnets_3",
    kind: "intrigue",
    titre: "La perquisition",
    once: true,
    weight: 0,
    texte:
      "7h10, le siège du parti est perquisitionné. Scellés, cartons, photographes prévenus par on-ne-sait-qui. Le parquet financier a ouvert une information judiciaire pour « financement illicite de campagne électorale ». Votre nom n'apparaît nulle part. Pour l'instant, tout est là : pour l'instant.",
    choices: [
      {
        id: "fusible",
        label: "Lâcher Espitalier",
        detail: "Un communiqué : « la justice doit passer ». Il comprendra. Il parlera peut-être.",
        effects: (c) => {
          c.rel("espitalier", { loyaute: -40, rancune: 30 });
          c.flag("carnets_fusible");
          c.sched("carnets_memoires", 6, 16, 0.5);
          c.adj({ power: { popularite: -2, justice: 3 } });
          return "Le communiqué est d'une neutralité chirurgicale. Espitalier est mis en examen dans la semaine. Ses avocats font savoir qu'il « assumera seul » — formule dont chacun sait qu'elle a une date de péremption.";
        },
      },
      {
        id: "couvrir",
        label: "Le couvrir",
        detail: "Ralentir le parquet. On sait faire. C'est un pas — un vrai.",
        effects: (c) => {
          c.adj({ player: { integrite: -8 }, power: { justice: -10 } });
          c.derive(2);
          c.flag("carnets_obstruction");
          c.rel("ferrand", { ambition: 15 });
          c.sched("carnets_watergate", 4, 12, 0.45);
          return "Un procureur général « fait remonter des observations », une mutation opportune, un dossier qui s'enlise. Ça ne laisse presque pas de traces. Presque. Louise Ferrand a commencé une frise chronologique sur le mur de son bureau.";
        },
      },
      {
        id: "verite",
        label: "Dire la vérité aux Français",
        detail: "Tout. L'allocution de la dernière chance — ou de la première.",
        effects: (c) => {
          c.adj({ power: { popularite: -12, presse: 5, justice: 5 }, player: { integrite: 10 } });
          c.flag("carnets_confession");
          c.log("Vous avez reconnu publiquement les irrégularités du financement de votre campagne.");
          return "Vingt minutes, seul face caméra, sans prompteur : « Des fautes ont été commises. Je ne les ai pas ordonnées. Je ne les ai pas empêchées. » Le pays encaisse, sonné. La presse étrangère parle d'un « moment sans précédent ». Votre popularité s'effondre. Votre parole, curieusement, vient de prendre de la valeur.";
        },
      },
    ],
  },
  {
    id: "carnets_memoires",
    kind: "intrigue",
    titre: "Les carnets, publiés",
    once: true,
    weight: 0,
    texte:
      "Espitalier publie ses mémoires : « Le Trésorier ». Chapitre 9 : la campagne, les intermédiaires, les dîners. Il n'accuse jamais frontalement — il « raconte ». C'est pire. Le livre est numéro un des ventes avant même sa sortie.",
    choices: [
      {
        id: "dementir",
        label: "Démentir « un règlement de comptes »",
        effects: (c) => {
          c.adj({ power: { popularite: -5 } });
          c.flag("carnets_proces");
          return "Le démenti est ferme et las. Le pays a déjà choisi de croire le livre — les livres ont toujours raison contre les communiqués. Le parquet, lui, lit le chapitre 9 avec un surligneur.";
        },
      },
      {
        id: "silence",
        label: "Le silence",
        effects: (c) => {
          c.adj({ power: { popularite: -3 } });
          c.flag("carnets_proces");
          return "Pas un mot. La dignité du silence — ou son aveu, selon le camp. Le livre s'installe douze semaines en tête des ventes, puis en poche, puis en documentaire. Cette affaire a désormais sa propre économie.";
        },
      },
    ],
  },
  {
    id: "carnets_watergate",
    kind: "intrigue",
    titre: "L'enquête sur l'enquête",
    once: true,
    weight: 0,
    texte:
      "Louise Ferrand publie : « Comment l'Élysée a enrayé la justice ». Datée, sourcée, implacable — la mutation du procureur, les « observations », tout y est. Ce n'est plus une affaire de financement. C'est une affaire d'État.",
    choices: [
      {
        id: "nier",
        label: "Tout nier",
        effects: (c) => {
          c.adj({ power: { justice: -5, presse: -5, popularite: -8 } });
          c.derive(1);
          c.flag("carnets_proces");
          return "Le démenti est catégorique et personne n'y croit, à commencer par ceux qui le rédigent. Une commission d'enquête parlementaire se constitue. Le mot « destitution » apparaît pour la première fois — en tribune, pour l'instant.";
        },
      },
      {
        id: "sacrifier",
        label: "Sacrifier un conseiller",
        detail: "Quelqu'un a « excédé ses instructions ».",
        effects: (c) => {
          c.adj({ power: { popularite: -5 }, player: { integrite: -5, cynisme: 4 } });
          c.flag("carnets_proces");
          return "Un directeur de cabinet tombe, avec un communiqué qui l'accable poliment. Il se tait — pour l'instant, comme tous ceux qui tombent. Ferrand titre le lendemain : « Le fusible du fusible. » Elle tient sa série. Vous êtes le feuilleton.";
        },
      },
    ],
  },
  // =========================================================================
  // 2. LE GÉNÉRAL VERDIER
  // =========================================================================
  {
    id: "verdier_tribune",
    kind: "intrigue",
    titre: "La tribune du général",
    once: true,
    weight: (s) => (s.turnCount >= 2 && (s.hidden.agitation > 40 || s.country.securite < 50) ? 2.5 : 0.4),
    texte:
      "Le général Verdier publie une tribune dans la presse d'Antoine Rives : « L'autorité n'est pas un gros mot ». Pas une ligne d'insubordination — et pourtant chaque phrase en a le parfum. Un chef d'état-major n'écrit pas de tribune. Celui-ci, si.",
    choices: [
      {
        id: "recadrer",
        label: "Le recadrer en privé",
        effects: (c) => {
          c.rel("verdier", { rancune: 8, ambition: 3 });
          c.sched("verdier_sondage", 2, 5, 0.6);
          return "L'entretien est glacial et réglementaire. Verdier écoute au garde-à-vous, ce qui est sa façon de ne pas écouter. « Je n'ai fait que servir le moral des armées, monsieur le Président. » Le mot « monsieur » a duré un dixième de seconde de trop.";
        },
      },
      {
        id: "publique",
        label: "Le remettre à sa place publiquement",
        detail: "« Les armées obéissent. Point. »",
        effects: (c) => {
          c.adj({ power: { armee: -6 } });
          c.rel("verdier", { rancune: 15, ambition: 5 });
          c.sched("verdier_sondage", 2, 4, 0.7);
          return "La phrase claque en conseil des ministres et fuite dans l'heure — vous saurez plus tard par qui. L'institution militaire se ferme comme une huître. Dans les mess d'officiers, ce soir-là, on porte des toasts que vous n'entendrez pas.";
        },
      },
      {
        id: "flatter",
        label: "Saluer « un soldat qui pense »",
        detail: "L'embrasser pour mieux l'étouffer.",
        effects: (c) => {
          c.rel("verdier", { ambition: 8 });
          c.adj({ power: { armee: 3 } });
          c.sched("verdier_sondage", 2, 5, 0.6);
          return "Votre éloge public le déconcerte deux jours — puis il comprend que vous l'avez adoubé, et que c'est réversible. Le jeu est lancé entre vous. Il croit que c'est lui qui l'a commencé. Vous croyez que c'est vous. L'un de vous deux se trompe.";
        },
      },
    ],
  },
  {
    id: "verdier_sondage",
    kind: "intrigue",
    titre: "41 %",
    once: true,
    weight: 0,
    texte:
      "Un institut publie la question que personne n'avait posée : « Un militaire ferait-il un bon président de la République ? » Oui : 41 %. Le portrait du général Verdier occupe la moitié de la page. Il a « refusé de commenter » — avec le sourire du refus qui commente.",
    choices: [
      {
        id: "ignorer",
        label: "Ignorer",
        effects: (c) => {
          c.rel("verdier", { ambition: 6 });
          c.sched("verdier_ordre", 3, 8, 0.5);
          return "Un sondage n'est qu'un sondage. Sauf qu'il sera cité dans chaque portrait du général désormais, comme une possibilité en suspens. Les possibilités en suspens sont l'oxygène des ambitieux.";
        },
      },
      {
        id: "occuper",
        label: "Occuper le terrain régalien",
        detail: "Visites aux armées, treillis, porte-avions. Montrer qui est le chef.",
        effects: (c) => {
          c.adj({ power: { armee: 4 }, hidden: { fatigue: 6 } });
          c.rel("verdier", { ambition: -3 });
          c.sched("verdier_ordre", 3, 8, 0.4);
          return "Trois déplacements militaires en un mois, des images de treillis et de passerelles. C'est efficace et un peu humiliant — courir derrière son propre général. Les photos sont bonnes. Le fond de l'affaire est inchangé.";
        },
      },
    ],
  },
  {
    id: "verdier_ordre",
    kind: "intrigue",
    titre: "L'ordre discuté",
    once: true,
    weight: 0,
    texte:
      "Conseil de défense. Vous ordonnez une réduction du dispositif extérieur. Verdier pose son stylo : « Sauf votre respect, cet ordre est une erreur stratégique. Je demande qu'il soit consigné que je m'y suis opposé. » Consigné. Un chef d'état-major qui constitue un dossier. Le silence dans la salle a une texture nouvelle.",
    choices: [
      {
        id: "limoger",
        label: "Le limoger séance tenante",
        effects: (c) => {
          const v = c.s.characters["verdier"];
          v.enPoste = false;
          c.adj({ power: { armee: -10 }, hidden: { coup: -15 } });
          c.rel("verdier", { rancune: 25 });
          c.flag("verdier_limoge");
          c.sched("verdier_civil", 4, 10, 0.5);
          c.log("Vous avez limogé le général Verdier en plein conseil de défense.");
          return "« Général, vous êtes relevé de vos fonctions. » Il se lève, salue impeccablement, sort. L'armée gronde des semaines. Mais un général limogé est un général sans divisions — il lui reste la télévision, ce qui n'est pas rien.";
        },
      },
      {
        id: "promouvoir",
        label: "Le nommer ministre des Armées",
        detail: "Dans le gouvernement, il est à vous. En principe.",
        effects: (c) => {
          c.adj({ power: { armee: 5 } });
          c.rel("verdier", { ambition: 10, loyaute: 5 });
          c.flag("verdier_ministre");
          c.adj({ hidden: { coup: -8 } });
          return "La nomination surprend tout le monde et arrange presque tout le monde. Verdier troque l'uniforme contre le costume — il garde le maintien. Il est désormais solidaire de votre bilan. Et présent à toutes les réunions qui comptent. Vous avez enfermé le loup dans la bergerie pour le surveiller. C'est une stratégie. C'en est une.";
        },
      },
      {
        id: "plier",
        label: "Retirer l'ordre",
        detail: "Il a peut-être raison sur le fond.",
        effects: (c) => {
          c.adj({ power: { armee: 2 }, hidden: { coup: 8 } });
          c.rel("verdier", { ambition: 12 });
          c.flag("verdier_plie");
          return "Vous « suspendez » l'ordre pour « complément d'analyse ». Sur le fond, c'était peut-être sage. Sur la forme, chaque officier présent a vu la même chose : le président a reculé devant le général. Ces images-là ne passent jamais à la télévision et ne s'effacent jamais.";
        },
      },
    ],
  },
  {
    id: "verdier_civil",
    kind: "intrigue",
    titre: "Le général en civil",
    once: true,
    weight: 0,
    texte:
      "Verdier, en costume gris et médailles remisées, lance son mouvement : « Redressement ». Meetings pleins, discours courts, phrases simples. Il ne vous attaque jamais nommément — il parle de « ceux qui ont laissé faire ». Les sondages le placent d'emblée à 16 %.",
    choices: [
      {
        id: "debattre",
        label: "L'affronter sur le fond",
        effects: (c) => {
          c.adj({ player: { rhetorique: 2 } });
          c.flag("verdier_opposant");
          return "Vous le traitez en adversaire politique ordinaire — c'est la meilleure façon de le désacraliser. Il débat correctement, sans plus : les tribuns d'état-major perdent un peu de leur aura dans le brouhaha civil. Un peu.";
        },
      },
      {
        id: "meprise",
        label: "L'ignorer avec hauteur",
        effects: (c) => {
          c.flag("verdier_opposant");
          c.rel("verdier", { ambition: 5 });
          return "« Je ne commente pas les carrières reconverties. » Le mépris nourrit sa légende d'homme seul contre le système. Son mouvement grossit dans les zones où l'État a reculé. Vous le retrouverez sur un bulletin de vote.";
        },
      },
    ],
  },
  // =========================================================================
  // 3. LOUISE FERRAND
  // =========================================================================
  {
    id: "ferrand_1",
    kind: "intrigue",
    titre: "La demande de commentaire",
    once: true,
    weight: (s) => (s.turnCount >= 2 ? 1.8 : 0.5),
    texte: (s) =>
      `Un mail de Louise Ferrand à votre service de presse, poli et précis comme un scalpel : elle prépare « une enquête au long cours » sur ${plusVieuxSecret(s).nom}. Sept questions. Délai de réponse : dix jours. La septième question montre qu'elle sait déjà l'essentiel.`,
    choices: [
      {
        id: "transparence",
        label: "Répondre à tout, précisément",
        effects: (c) => {
          c.flag("ferrand_transparence");
          c.rel("ferrand", { rancune: -5 });
          c.sched("ferrand_2", 3, 8, 0.5);
          return "Les réponses partent, exactes et complètes — Roze a plaidé deux heures contre, puis s'est inclinée. L'article sera dur mais factuel. Avec Ferrand, c'est le maximum atteignable : l'équité. Jamais l'alliance.";
        },
      },
      {
        id: "entrave",
        label: "Opposer le silence et les avocats",
        effects: (c) => {
          c.flag("ferrand_entrave");
          c.rel("ferrand", { ambition: 10, rancune: 8 });
          c.sched("ferrand_2", 2, 6, 0.6);
          return "Réponse du service juridique en quatre lignes comminatoires. Erreur de calibre : on n'intimide pas une journaliste qui a un dossier — on lui confirme qu'il est bon. Son enquête vient de passer en tête de sa pile.";
        },
      },
      {
        id: "intimidation",
        label: "Faire « regarder » son environnement",
        detail: "Ternay saura faire. C'est une ligne qu'on ne repasse pas dans l'autre sens.",
        effects: (c) => {
          c.derive(2);
          c.adj({ player: { integrite: -8 }, hidden: { paranoia: 5 } });
          c.flag("ferrand_surveillee");
          c.rel("ternay", { ambition: 5 });
          c.sched("ferrand_watergate", 4, 12, 0.4);
          c.sched("ferrand_2", 2, 6, 0.5);
          return "Ternay écoute votre demande sans un battement de cil, puis : « Il me faut l'instruction par écrit. » Vous refusez. Il hoche la tête : « Alors il ne me faut rien du tout. » Le lendemain, la « veille » commence quand même. Vous n'avez rien signé. Vous avez tout commencé.";
        },
      },
    ],
  },
  {
    id: "ferrand_2",
    kind: "intrigue",
    titre: "La publication",
    once: true,
    weight: 0,
    texte: (s) =>
      `L'enquête de Ferrand paraît en trois volets : « ${plusVieuxSecret(s).nom.charAt(0).toUpperCase() + plusVieuxSecret(s).nom.slice(1)} — ce que la République ne voulait pas savoir ». ${s.flags["ferrand_transparence"] ? "Vos réponses y figurent, intégralement. L'article est sévère et honnête." : "Votre silence y figure aussi — en creux, à chaque paragraphe."}`,
    choices: [
      {
        id: "encaisser",
        label: "Encaisser sans répondre",
        effects: (c) => {
          const malus = c.s.flags["ferrand_transparence"] ? -3 : -7;
          c.adj({ power: { popularite: malus } });
          c.log("L'enquête de Louise Ferrand sur votre passé a marqué l'opinion.");
          return "Trois jours de tempête médiatique, une séquence à l'Assemblée, puis le cycle suivant recouvre celui-là. Il en reste une couche de sédiment sur votre nom — les sédiments ne s'en vont jamais, ils se superposent.";
        },
      },
      {
        id: "contre_attaque",
        label: "Attaquer la journaliste",
        detail: "« Le procès permanent », « la presse militante ».",
        effects: (c) => {
          c.adj({ power: { presse: -8, popularite: -3 } });
          c.rel("ferrand", { ambition: 8 });
          c.derive(1);
          c.seg("urbains", { soutien: -4 });
          return "Attaquer le messager : le classique qui ne marche jamais et qu'on refait toujours. Les sociétés de journalistes publient une tribune commune. Ferrand, elle, ne répond pas : elle a l'éternité pour elle, et un deuxième dossier en cours.";
        },
      },
    ],
  },
  {
    id: "ferrand_watergate",
    kind: "intrigue",
    titre: "« Ils m'écoutaient »",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["ferrand_surveillee"],
    texte:
      "Ferrand publie, preuves à l'appui : son téléphone, sa voiture, son entourage — surveillés. Le document technique porte un tampon des services. La une du « Fil » tient en trois mots : « ILS M'ÉCOUTAIENT ». Toutes les rédactions du pays, y compris celles de Rives, reprennent l'information. C'est votre Watergate — il porte votre empreinte, pas votre signature. Ça ne changera rien.",
    choices: [
      {
        id: "ternay_fusible",
        label: "Lâcher Ternay",
        effects: (c) => {
          const t = c.s.characters["ternay"];
          t.enPoste = false;
          c.rel("ternay", { rancune: 20 });
          c.adj({ power: { popularite: -10, justice: -5 } });
          c.flag("watergate_public");
          c.log("Le scandale des écoutes a emporté le directeur des services — et entamé votre présidence.");
          return "Ternay est démis « pour initiative non autorisée ». Il part sans un mot — les hommes des services partent toujours sans un mot, c'est après qu'ils parlent. Une commission d'enquête est créée. Le mot « destitution » revient, et cette fois il est dans des bouches sérieuses.";
        },
      },
      {
        id: "assumer_raison_etat",
        label: "Invoquer la raison d'État",
        detail: "Assumer. Franchir.",
        effects: (c) => {
          c.derive(3);
          c.adj({ power: { popularite: -8, presse: -15 }, player: { integrite: -6 } });
          c.flag("watergate_public");
          c.flag("raison_etat");
          c.log("Vous avez publiquement assumé la surveillance d'une journaliste au nom de la raison d'État.");
          return "« La sécurité nationale ne se commente pas. » Le pays entend très bien ce que la phrase ne dit pas. Une partie s'indigne. Une autre — c'est le plus inquiétant — approuve. Vous venez de découvrir qu'un pas de plus est toujours possible, et qu'il y a des applaudissements à chaque marche.";
        },
      },
    ],
  },
  // =========================================================================
  // 4. LE SECRET MÉDICAL
  // =========================================================================
  {
    id: "sante_malaise",
    kind: "intrigue",
    titre: "Le malaise",
    once: true,
    weight: (s) => (s.turnCount >= 2 && (s.hidden.fatigue > 55 || s.bio.age > 55) ? 2 : 0.3),
    texte:
      "Sommet international, huis clos. Au milieu d'une phrase, le sol tangue. Vous vous rattrapez au pupitre — deux secondes, permanence rattrapée en « geste d'emphase ». Personne n'a rien vu, sauf votre aide de camp. Le soir, le Dr Manin vous examine longuement, puis repose son stéthoscope avec une lenteur qui est déjà un diagnostic.",
    choices: [
      {
        id: "examens",
        label: "Faire les examens complets",
        effects: (c) => {
          c.chain("sante_diagnostic");
          return "Manin organise tout : une clinique de confiance, un dimanche, un nom d'emprunt. Trois heures d'examens dans un bâtiment vide. Les résultats arriveront sous huit jours, par porteur, dans une enveloppe sans en-tête.";
        },
      },
      {
        id: "refuser_examens",
        label: "« Plus tard. Le pays d'abord. »",
        effects: (c) => {
          c.adj({ hidden: { sante: -8 } });
          c.rel("manin", { rancune: 5 });
          c.sched("sante_malaise_2", 2, 6, 0.7);
          return "Manin vous fixe un long moment. « C'est votre droit. C'est aussi exactement la phrase que m'ont dite mes trois derniers patients hospitalisés en urgence. » Vous retournez travailler. Le sol, quelque part, se souvient d'avoir tangué.";
        },
      },
    ],
  },
  {
    id: "sante_malaise_2",
    kind: "intrigue",
    titre: "Le deuxième malaise",
    once: true,
    weight: 0,
    texte:
      "Celui-là, il y avait des caméras. Trois secondes d'absence en pleine cérémonie, le regard vide, la main du préfet qui vous retient discrètement. La séquence tourne au ralenti sur toutes les chaînes, analysée image par image par des médecins de plateau qui ne vous ont jamais ausculté.",
    choices: [
      {
        id: "examens2",
        label: "Cette fois, les examens",
        effects: (c) => {
          c.adj({ power: { popularite: -3 } });
          c.chain("sante_diagnostic");
          return "Plus le choix. Manin obtient sa clinique et son dimanche. Dans la salle d'attente vide, vous réalisez que vous n'avez pas été seul dans une pièce sans enjeu depuis deux ans.";
        },
      },
    ],
  },
  {
    id: "sante_diagnostic",
    kind: "intrigue",
    titre: "Le diagnostic",
    once: true,
    weight: 0,
    texte:
      "Le Dr Manin vous reçoit seule, en fin de journée. Elle ne tourne pas autour : « C'est une maladie évolutive. Traitable — pas guérissable. Avec le traitement, des années de bonne qualité. Sans lui, beaucoup moins. Le traitement fatigue, et il se verra. » Elle attend. La question n'est pas médicale, et vous le savez tous les deux.",
    choices: [
      {
        id: "cacher",
        label: "Cacher. Traiter en secret.",
        detail: "Un secret de plus à protéger — le plus lourd de tous.",
        effects: (c) => {
          c.flag("maladie_cachee");
          c.adj({ hidden: { sante: -5, paranoia: 5 } });
          c.sched("sante_incident", 4, 12, 0.45);
          c.sched("sante_rumeur", 3, 8, 0.4);
          c.log("Un diagnostic grave a été posé — et caché au pays.");
          return "Les bulletins de santé continueront de paraître, rassurants et faux. Manin accepte — « une fois, et je le note dans un dossier que je garde ». Le traitement commence, camouflé en « compléments ». Vous venez d'ajouter un secret d'État à la liste, et celui-là vit dans votre sang.";
        },
      },
      {
        id: "reveler",
        label: "Révéler au pays",
        effects: (c) => {
          c.flag("maladie_publique");
          c.adj({ power: { popularite: -6 } });
          c.rel("delval", { ambition: 10 });
          c.rel("rochefort", { ambition: 8 });
          c.log("Vous avez révélé votre maladie au pays — un précédent dans l'histoire de la fonction.");
          return "L'allocution est sobre : le diagnostic, le traitement, la capacité à gouverner « sous le contrôle de médecins indépendants ». Le pays est ému, puis pragmatique. Dans les états-majors politiques, tous les chronomètres viennent de se remettre à zéro. Rochefort vous assure de sa loyauté avec une chaleur nouvelle. C'est ça qui vous inquiète.";
        },
      },
    ],
  },
  {
    id: "sante_rumeur",
    kind: "intrigue",
    titre: "La rumeur",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["maladie_cachee"],
    texte:
      "Un site people publie : « Mystère autour des visites dominicales du Président dans une clinique de l'Ouest parisien ». C'est imprécis, à moitié faux, et beaucoup trop proche. Ferrand, elle, n'a encore rien publié. C'est mauvais signe : elle ne publie que quand c'est solide.",
    choices: [
      {
        id: "dementir_sante",
        label: "Faire démentir « des rumeurs indignes »",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 5 } });
          c.rel("manin", { rancune: 3 });
          return "Le démenti est publié — un mensonge de plus sur la pile, et la pile devient haute. Manin vous appelle le soir : « Chaque démenti que vous signez, c'est mon nom que vous engagez aussi. » Elle reste. Pour l'instant.";
        },
      },
      {
        id: "rien_sante",
        label: "Ne rien dire",
        effects: (c) => {
          c.adj({ power: { presse: -2 } });
          return "Pas de démenti — nier une rumeur, c'est la nourrir. Elle flotte, s'étiole, ressurgira. Vous vivez désormais avec un compte à rebours dont vous ne connaissez pas le cadran.";
        },
      },
    ],
  },
  {
    id: "sante_incident",
    kind: "intrigue",
    titre: "L'incident public",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["maladie_cachee"],
    texte:
      "Interview du 14-Juillet, en direct. Au milieu d'une réponse, le mot ne vient pas. N'importe quel mot — celui-là refuse. Quatre secondes de silence à l'antenne, l'éternité. Le journaliste, par pitié ou par réflexe, enchaîne. Ce soir, le pays entier a vu la même chose et met dessus des mots différents.",
    choices: [
      {
        id: "verite_sante",
        label: "Dire la vérité, maintenant",
        effects: (c) => {
          c.flag("maladie_publique");
          c.adj({ power: { popularite: -8 }, player: { integrite: 5 } });
          c.rel("rochefort", { ambition: 10 });
          c.log("Après l'incident en direct, vous avez révélé la maladie que vous cachiez.");
          return "Allocution trois jours plus tard : le diagnostic, la date — et le mensonge, reconnu. « J'ai eu tort de vous le cacher. » La sincérité tardive paie moins que la sincérité — mais infiniment plus que le mensonge suivant. Le pays, étrangement, se montre plus doux que la classe politique.";
        },
      },
      {
        id: "fatigue_excuse",
        label: "« Une grande fatigue »",
        detail: "Le mensonge de plus. Il tiendra ce qu'il tiendra.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 8, sante: -5 } });
          c.sched("sante_effondrement", 4, 10, 0.5);
          return "« Un emploi du temps déraisonnable, une fatigue passagère. » L'explication tient — officiellement. Dans les rédactions, plus personne n'y croit, et deux d'entre elles mettent des équipes sur « le dossier santé ». Vous gouvernez désormais une course entre votre corps et leur bouclage.";
        },
      },
    ],
  },
  {
    id: "sante_effondrement",
    kind: "intrigue",
    titre: "Le corps décide",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["maladie_cachee"],
    texte:
      "Cette fois, c'est une évacuation. Malaise en conseil des ministres, civière par l'escalier de service, hôpital militaire. Impossible à cacher : il y avait quarante témoins. Manin est formelle : « Opération, maintenant. Ou démission de fait dans six mois, sur un brancard. »",
    choices: [
      {
        id: "operation",
        label: "L'opération — et la vérité",
        effects: (c) => {
          c.flag("maladie_publique");
          c.adj({ hidden: { sante: 15, fatigue: -20 }, power: { popularite: -5 } });
          c.log("Opéré(e) en urgence, vous avez survécu — et le pays a tout appris.");
          return "L'opération réussit. La convalescence est publique, les mensonges précédents aussi. Rochefort a « assuré la continuité » avec un naturel qu'on lui découvre. Vous revenez diminué(e) et vivant(e) — dans cet ordre, disent vos adversaires ; dans l'autre, dit Manin.";
        },
      },
      {
        id: "refus_operation",
        label: "Refuser. Tenir debout.",
        detail: "Manin dit que c'est de la folie. C'est votre folie.",
        effects: (c) => {
          c.adj({ hidden: { sante: -25 } });
          c.rel("manin", { loyaute: -20 });
          c.log("Contre tous les avis médicaux, vous avez refusé l'opération pour rester au pouvoir.");
          return "Manin dépose sa démission de médecin personnel — vous la refusez, elle reste « par conscience, pas par accord ». Vous tenez debout aux cérémonies, par la volonté et la chimie. Le pouvoir vaut-il ça ? La question ne se pose plus : vous y avez répondu.";
        },
      },
    ],
  },
  // =========================================================================
  // 5. LA CENTRALE DE SAINT-VIGOR
  // =========================================================================
  {
    id: "vigor_rapport",
    kind: "intrigue",
    titre: "Le rapport de l'Autorité de sûreté",
    once: true,
    weight: (s) => (s.turnCount >= 2 && s.turnCount <= 4 ? 3 : 0),
    texte:
      "Le rapport annuel de l'Autorité de sûreté nucléaire consacre onze pages à la centrale de Saint-Vigor, mise en service en 1978 : microfissures sur le circuit secondaire, « anomalie sérieuse sans danger immédiat ». Fermer : deux mille emplois, 4 % de la production électrique, une vallée en colère. Prolonger : « sous réserve de travaux », dit l'ASN. Les travaux coûtent le prix d'un porte-avions.",
    choices: [
      {
        id: "fermer",
        label: "Fermer Saint-Vigor",
        effects: (c) => {
          c.adj({ country: { marge: -6, environnement: 3 } });
          c.seg("periurbain", { soutien: -4 });
          c.flag("vigor_fermee");
          c.sched("vigor_maire", 4, 10, 0.6);
          c.log("Vous avez fermé la centrale de Saint-Vigor sur avis de sûreté.");
          return "L'annonce tombe un lundi. La vallée défile derrière une banderole : « Saint-Vigor vivra ». Les factures d'électricité prendront quelques points cet hiver, et la presse ne manquera pas de faire le lien. Personne ne vous félicitera jamais pour l'accident qui n'aura pas lieu.";
        },
      },
      {
        id: "travaux",
        label: "Prolonger avec le grand carénage",
        detail: "Cher, lent, sérieux.",
        effects: (c) => {
          c.adj({ country: { marge: -8 } });
          c.flag("vigor_travaux");
          c.log("Vous avez financé la rénovation complète de Saint-Vigor.");
          return "Le chantier durera six ans et engloutira des milliards. C'est la décision la plus coûteuse et la moins visible de votre mandat : une centrale qui ne explose pas ne fait jamais la une. Vous venez d'acheter du silence statistique. C'était probablement le bon achat.";
        },
      },
      {
        id: "prolonger",
        label: "Prolonger en l'état",
        detail: "« Sans danger immédiat », dit le rapport. Le mot important est « immédiat ».",
        effects: (c) => {
          c.flag("vigor_prolongee");
          c.sched("vigor_alerte", 2, 6, 0.5);
          c.sched("vigor_incident", 8, 22, 0.35);
          return "Un arrêté discret prolonge l'exploitation « dans l'attente d'un schéma directeur ». La marge budgétaire respire, la vallée aussi. Le rapport de l'ASN rejoint un tiroir. Les microfissures, elles, ne lisent pas les arrêtés.";
        },
      },
    ],
  },
  {
    id: "vigor_alerte",
    kind: "intrigue",
    titre: "La lanceuse d'alerte",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["vigor_prolongee"],
    texte:
      "Une ingénieure sûreté de Saint-Vigor a écrit à sa hiérarchie, puis à l'ASN, puis à la presse : les fissures progressent plus vite que le modèle. L'exploitant l'a licenciée pour « divulgation ». Elle passe ce soir à la télévision, avec des schémas.",
    choices: [
      {
        id: "reintegrer",
        label: "La faire réintégrer, ordonner une revue",
        effects: (c) => {
          c.adj({ country: { marge: -3 } });
          c.flag("vigor_revue");
          c.press("« L'ingénieure qui a fait plier l'Élysée » — portrait dans L'Observateur", "neutre");
          return "La réintégration est ordonnée, une revue de sûreté indépendante lancée. Ses conclusions, dans huit mois, vous laisseront le même choix qu'aujourd'hui — mais documenté. Vous ne pourrez plus dire que vous ne saviez pas. C'est peut-être ce que vous venez de chercher.";
        },
      },
      {
        id: "laisser",
        label: "Ne pas s'en mêler",
        detail: "Un contentieux privé entre un exploitant et une salariée.",
        effects: (c) => {
          c.flag("vigor_alerte_ignoree");
          c.seg("urbains", { soutien: -3 });
          return "L'État reste « attentif », c'est-à-dire absent. L'ingénieure perd son procès en première instance et devient une figure. Chaque document qu'elle a produit est daté, archivé, opposable. Le dossier Saint-Vigor a désormais une mémoire externe — et elle vous est hostile.";
        },
      },
    ],
  },
  {
    id: "vigor_incident",
    kind: "intrigue",
    titre: "Saint-Vigor : l'alarme",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["vigor_prolongee"],
    texte:
      "3h44 du matin. Le téléphone de permanence : « Incident de niveau 2 en cours à Saint-Vigor. Fuite maîtrisée sur le circuit secondaire. Pas de rejet. » À 4h10, deuxième appel : « Niveau 3. Rejet mineur possible. » Les mots changent vite, la nuit.",
    choices: [
      {
        id: "transparence_vigor",
        label: "Tout dire, tout de suite, évacuer par précaution",
        effects: (c) => {
          const grave = c.rng.chance(0.3);
          if (grave) {
            c.crise("crise_vigor");
            return "À 6h, vous parlez au pays. À 9h, l'évacuation préventive commence. À 11h, le niveau passe à 5 : la fuite n'était pas maîtrisée. Votre transparence de la nuit est la seule chose qui tiendra debout dans les semaines qui viennent — car tout le reste vacille.";
          }
          c.adj({ power: { popularite: 3, presse: 4 }, country: { marge: -3 } });
          c.flag("vigor_incident_gere");
          c.log("L'incident de Saint-Vigor a été géré dans la transparence — et contenu.");
          return "L'incident est contenu au niveau 3. L'évacuation préventive, critiquée sur le moment (« panique d'État », écrit un éditorialiste), devient en une semaine la preuve que l'État protège. L'ingénieure licenciée passe à la télévision : « Pour une fois, on a écouté avant. » Le dossier de la fermeture, lui, revient sur la table — avec vos propres sueurs froides comme pièce jointe.";
        },
      },
      {
        id: "minimiser_vigor",
        label: "Minimiser en attendant d'en savoir plus",
        detail: "Pas de panique nationale à 4h du matin.",
        effects: (c) => {
          const grave = c.rng.chance(0.5);
          if (grave) {
            c.flag("vigor_mensonge");
            c.crise("crise_vigor");
            return "Le communiqué de 7h parle d'un « événement sans conséquence ». À midi, le niveau passe à 5 et des balises étrangères détectent le panache. Le mot « mensonge » est déjà écrit — il ne quittera plus jamais ce dossier, ni votre nom.";
          }
          c.adj({ hidden: { paranoia: 3 } });
          c.flag("vigor_incident_gere");
          return "L'incident se stabilise au niveau 2. Le pari du silence a tenu — cette fois. Dans le civil, on appelle ça de la chance. Dans le nucléaire, on appelle ça un avertissement.";
        },
      },
    ],
  },
  {
    id: "vigor_maire",
    kind: "intrigue",
    titre: "Le maire de Saint-Vigor",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["vigor_fermee"],
    texte:
      "Le maire de Saint-Vigor, ancien contremaître de la centrale, a fait de votre nom un slogan de colère. Sa commune se meurt : commerces fermés, école menacée. Il entame une « marche des territoires sacrifiés » vers la capitale, et la France des sous-préfectures se reconnaît en lui, département après département.",
    choices: [
      {
        id: "recevoir_maire",
        label: "Le recevoir à l'Élysée",
        effects: (c) => {
          c.adj({ country: { marge: -3, cohesion: 3 } });
          c.seg("ruraux", { soutien: 3 });
          return "Deux heures d'entretien, un contrat de territoire signé : reconversion, fibre, exonérations. Il sort en disant : « J'ai obtenu des choses. Je ne lui pardonne pas. » C'est exactement ce que les deux phrases pouvaient donner de mieux ensemble.";
        },
      },
      {
        id: "ignorer_maire",
        label: "Laisser la marche s'essouffler",
        effects: (c) => {
          c.seg("ruraux", { soutien: -5 });
          c.adj({ hidden: { agitation: 4 } });
          c.flag("figure_territoires");
          return "La marche atteint la capitale avec trois mille personnes et toutes les caméras du pays. Le maire lit un discours simple et terrible devant l'Assemblée. Un parti lui propose une investiture le soir même. Vous venez de fabriquer un adversaire — artisanal, authentique, inusable.";
        },
      },
    ],
  },
  // =========================================================================
  // 6. LES RONDS-POINTS
  // =========================================================================
  {
    id: "rp_1",
    kind: "intrigue",
    titre: "Les premiers ronds-points",
    once: true,
    weight: 0,
    texte:
      "Ça a commencé un samedi, sans syndicat, sans parti, sans porte-parole : des gilets rétro-réfléchissants sur des ronds-points, contre le prix du carburant et « tout le reste ». Mazeau parle de « quelques centaines d'irréductibles ». La carte de vos préfets en compte quarante mille.",
    choices: [
      {
        id: "ecouter_rp",
        label: "Aller sur un rond-point",
        detail: "Sans préavis, sans plateau. Écouter.",
        effects: (c) => {
          c.adj({ hidden: { agitation: -5, fatigue: 5 }, power: { popularite: 2 } });
          c.flag("rp_ecoute");
          c.sched("rp_2", 2, 5, 0.5);
          return "Deux heures sous la pluie autour d'un brasero, à écouter des gens qui n'avaient jamais parlé à un ministre, encore moins à vous. Pas d'annonce, pas de miracle — mais la photo fait le tour du pays, et elle ne ressemble à rien de connu. Le mouvement continue. Il vous hait un peu moins que prévu.";
        },
      },
      {
        id: "mepriser_rp",
        label: "Suivre l'analyse de Mazeau",
        detail: "« Ça retombera avec le froid. »",
        effects: (c) => {
          c.adj({ hidden: { agitation: 8 } });
          c.sched("rp_2", 1, 3, 0.8);
          return "L'Intérieur promet l'essoufflement « sous quinzaine ». Le samedi suivant, ils sont trois fois plus nombreux, et un slogan est né — il tient en deux mots, le second est « démission ». Le premier est votre nom.";
        },
      },
      {
        id: "lacher_tot",
        label: "Annuler la mesure qui a tout déclenché",
        effects: (c) => {
          c.adj({ country: { marge: -4 }, power: { popularite: -2 } });
          c.flag("rp_recul_tot");
          c.flag("rp_survenu");
          return "Le recul immédiat éteint la mèche — et allume une leçon que tout le pays apprend par cœur : cet exécutif cède quand on occupe un rond-point. La prochaine colère commencera directement là, en sautant les étapes.";
        },
      },
    ],
  },
  {
    id: "rp_2",
    kind: "intrigue",
    titre: "Le mouvement a un visage",
    once: true,
    weight: 0,
    texte:
      "Elle s'appelle Maryse Cottin, aide-soignante à Guéret, 52 ans. Elle a dit face caméra, calmement : « On ne vit plus, monsieur le Président. On survit, et encore, pas tous. » Douze millions de vues. Elle refuse tous les partis, tous les plateaux sauf un, et toute négociation « tant qu'il ne viendra pas nous voir en vrai ». Le mouvement n'a pas de chef — il a mieux : une voix.",
    choices: [
      {
        id: "rencontrer_cottin",
        label: "Aller la voir, « en vrai »",
        effects: (c) => {
          c.adj({ power: { popularite: 3 }, hidden: { agitation: -8, fatigue: 5 } });
          c.flag("rp_survenu");
          c.flag("cottin_rencontree");
          c.log("Vous êtes allé(e) rencontrer Maryse Cottin sur son rond-point de Guéret.");
          return "Vous y allez. Une table en formica dans un préfabriqué, un café refroidi, quarante minutes filmées par un seul téléphone. Elle ne vous épargne rien ; vous ne promettez presque rien. « Au moins il est venu », dira-t-elle. Le mouvement décroît lentement — sans pardonner. Maryse Cottin, elle, entre dans le paysage. Vous la retrouverez.";
        },
      },
      {
        id: "refuser_cottin",
        label: "« La République ne négocie pas sur un rond-point »",
        effects: (c) => {
          c.adj({ hidden: { agitation: 10 } });
          c.crise("crise_rp");
          return "La phrase, prononcée au perron de l'Élysée, met le feu. Le samedi suivant s'appelle « acte VII » et plus personne n'en contrôle l'affiche. La suite ne se jouera plus en semestres, mais en jours.";
        },
      },
    ],
  },
  // =========================================================================
  // 7. LA RÉFORME MAUDITE (RETRAITES)
  // =========================================================================
  {
    id: "retraites_1",
    kind: "intrigue",
    titre: "Retraites : la table des négociations",
    once: true,
    weight: 0,
    texte:
      "La réforme est lanccée — tous vos conseillers l'exigeaient, aucun segment n'en veut. Autour de la table : Belkacem, qui veut des contreparties réelles (pénibilité, carrières longues, minimum revalorisé) ; Kervella, qui ne veut pas d'accord mais un rapport de force ; Charvet, qui trouve que « ça manque d'ambition ». La rue attend le premier faux pas.",
    choices: [
      {
        id: "belkacem_deal",
        label: "Construire l'accord avec Belkacem",
        detail: "Une réforme amputée mais signée.",
        effects: (c) => {
          c.adj({ country: { marge: -3 }, power: { syndicats: 8 }, hidden: { agitation: 4 } });
          c.rel("belkacem", { loyaute: 12 });
          c.rel("kervella", { rancune: 8 });
          c.rel("charvet", { rancune: 5 });
          c.flag("retraites_negociee");
          c.sched("retraites_3", 2, 4, 0.8);
          return "Trois semaines de nuits blanches, un texte amendé de moitié. Belkacem signe — elle y laisse une partie de sa base, vous une partie des économies attendues. Kervella dénonce « la trahison » et appelle seul à la grève. C'est le scénario le moins explosif. Il reste explosif.";
        },
      },
      {
        id: "passage_force",
        label: "Passer en force, texte intégral",
        effects: (c) => {
          c.adj({ hidden: { agitation: 12 }, power: { syndicats: -10 } });
          c.rel("kervella", { rancune: 15 });
          c.rel("belkacem", { rancune: 10 });
          c.flag("retraites_force");
          c.sched("retraites_2", 1, 2, 0.9);
          return "« Le texte, tout le texte. » Les deux centrales, pour la première fois depuis quinze ans, publient un communiqué commun. Vous avez réussi l'exploit d'unir Kervella et Belkacem. Les cortèges de jeudi diront le prix de l'exploit.";
        },
      },
      {
        id: "retraites_retrait",
        label: "Retirer la réforme",
        detail: "Vivre pour reculer un autre jour.",
        effects: (c) => {
          c.adj({ power: { popularite: -4, patronat: -8 }, country: { marge: -2 } });
          c.promesse("retraite_oui", "trahie");
          c.rel("weiss", { loyaute: -5 });
          c.press("« LA CAPITULATION » — une du Quotidien National", "hostile");
          c.log("Vous avez retiré la réforme des retraites avant l'épreuve de force.");
          return "Le retrait est annoncé sobrement. La rue ne défile pas : elle n'a plus besoin. Les marchés notent, Bruxelles « prend acte », Charvet parle d'« abdication ». Vous avez évité l'incendie en cédant la maison. C'était peut-être le bon calcul. Personne ne vous le dira jamais.";
        },
      },
    ],
  },
  {
    id: "retraites_2",
    kind: "intrigue",
    titre: "Le pays dans la rue",
    once: true,
    weight: 0,
    texte:
      "Troisième journée nationale : 1,7 million de manifestants selon l'Intérieur — Mazeau a arrondi vers le bas, comme toujours. Raffineries bloquées, transports au tiers, et dans les cortèges, une nouveauté : des gens qui ne manifestent jamais. Le texte arrive à l'Assemblée la semaine prochaine, et il vous manque trente voix.",
    choices: [
      {
        id: "q49_3",
        label: "Le 49.3",
        detail: "Passer sans vote. Payer comptant.",
        effects: (c) => {
          c.adj({ power: { popularite: -8 }, country: { cohesion: -6 }, hidden: { agitation: 10 } });
          c.flag("retraites_493");
          c.flag("retraites_faite");
          c.promesse("retraite_oui", "tenue");
          c.sched("censure_motion", 1, 2, 0.7);
          c.sched("retraites_fruits", 8, 12, 0.8);
          c.log("La réforme des retraites est passée au 49.3, sans vote.");
          return "L'article est dégainé un vendredi à 17h. La réforme est adoptée sans l'être — c'est toute l'élégance du 49.3. Sur les places, le soir même, des casserolades. À l'Assemblée, une motion de censure se prépare. Vous avez gagné le texte. Reste à savoir ce que vous avez perdu avec.";
        },
      },
      {
        id: "referendum_retraites",
        label: "Le référendum",
        detail: "Quitte ou double. Le peuple tranchera.",
        effects: (c) => {
          const gagne = c.s.power.popularite > 42 && c.rng.chance(0.5);
          if (gagne) {
            c.flag("retraites_faite");
            c.promesse("retraite_oui", "tenue");
            c.adj({ power: { popularite: 6 }, country: { cohesion: 3 }, hidden: { agitation: -10 } });
            c.sched("retraites_fruits", 8, 12, 0.8);
            c.log("Le référendum sur les retraites a été gagné — un séisme politique.");
            return "52,8 % de oui. Personne n'y croyait, pas même Roze, pas même vous à 19h59. La rue ne peut rien contre une urne. La réforme passe, lavée de tout soupçon de force. Les manuels de science politique réécriront ce chapitre — avec votre nom en gras.";
          }
          c.adj({ power: { popularite: -12 }, country: { cohesion: -3 } });
          c.promesse("retraite_oui", "trahie");
          c.flag("referendum_perdu");
          c.log("Le référendum sur les retraites a été perdu — votre autorité en sort brisée.");
          return "58,1 % de non. Le soir du scrutin, le silence de l'Élysée s'entend depuis la rue. La réforme est morte, votre autorité aussi — un président qui perd un référendum gouverne ensuite par politesse. Sallenave demande votre démission « par respect pour le suffrage ». Il ne l'aura pas. Mais la phrase reste.";
        },
      },
      {
        id: "suspendre_retraites",
        label: "Suspendre « pour six mois de concertation »",
        effects: (c) => {
          c.adj({ hidden: { agitation: -8 }, power: { popularite: -3, patronat: -5 } });
          c.promesse("retraite_oui", "partielle");
          return "La suspension calme la rue et n'engage à rien — c'est sa fonction. Dans six mois, il faudra choisir à nouveau, avec les mêmes options en pire. La concertation est la salle d'attente de la politique : tout le monde sait qu'on n'y guérit pas.";
        },
      },
    ],
  },
  {
    id: "retraites_3",
    kind: "intrigue",
    titre: "Retraites : le vote",
    once: true,
    weight: 0,
    texte:
      "Le texte négocié avec Belkacem arrive au vote. Kervella a sorti ses cortèges, mais l'accord syndical a coupé le mouvement en deux. À l'Assemblée, votre majorité tiendra — sauf surprise. Il y a toujours une surprise.",
    choices: [
      {
        id: "vote_normal",
        label: "Aller au vote",
        effects: (c) => {
          const passe = c.s.power.sieges >= 270 || c.rng.chance(0.7);
          if (passe) {
            c.flag("retraites_faite");
            c.promesse("retraite_oui", "tenue");
            c.adj({ hidden: { agitation: 5 } });
            c.sched("retraites_fruits", 8, 12, 0.8);
            c.log("La réforme des retraites, négociée, a été votée à l'Assemblée.");
            return "289 voix pour, à quatre de la chute. La réforme est votée — négociée, amendée, mais votée, ce qui la rend solide. Kervella promet « une mémoire longue ». Belkacem passe à la postérité syndicale, en bien ou en mal selon les cortèges. Vous, vous avez fait la réforme maudite en restant en démocratie. Ça se paiera moins cher que l'inverse.";
          }
          c.adj({ power: { popularite: -6, parti: -8 } });
          c.promesse("retraite_oui", "trahie");
          c.log("La réforme des retraites est tombée à sept voix — trahie par votre propre camp.");
          return "Rejetée à sept voix. Douze des vôtres ont voté contre — vous avez la liste, Delval l'avait avant vous. Le texte meurt, l'autorité saigne. Dans l'hémicycle, quelqu'un a applaudi un peu trop fort du côté de vos bancs. Vous savez qui.";
        },
      },
    ],
  },
  {
    id: "retraites_fruits",
    kind: "intrigue",
    titre: "Les chiffres des retraites",
    once: true,
    weight: 0,
    texte:
      "Le Conseil d'orientation des retraites publie son rapport : la trajectoire financière est rétablie, l'équilibre en vue. Le rapport fait quarante pages et zéro une de journal. Tout le coût était immédiat. Tout le bénéfice arrive maintenant — c'est-à-dire trop tard pour la gratitude, à temps pour l'Histoire.",
    choices: [
      {
        id: "ok_retraites",
        label: "Prendre acte",
        effects: (c) => {
          c.adj({ country: { marge: 8 } });
          c.log("La réforme des retraites a rétabli l'équilibre financier — dans l'indifférence générale.");
          return "La marge budgétaire retrouvée financera des choses dont d'autres couperont les rubans. Vous rangez le rapport du COR dans le tiroir des victoires sans témoins. Il commence à être plein.";
        },
      },
    ],
  },
  {
    id: "censure_motion",
    kind: "intrigue",
    titre: "La motion de censure",
    once: true,
    weight: 0,
    texte:
      "Toutes les oppositions ont signé — même celles qui se détestent, surtout celles qui se détestent. La motion de censure sera votée demain. Il lui faut 289 voix. Les pointages de Rochefort en donnent 271 « sûres », plus « une vingtaine d'incertains ». Une vingtaine. Rochefort a la voix de quelqu'un qui a déjà rangé son bureau.",
    choices: [
      {
        id: "negocier_censure",
        label: "Négocier les incertains, un par un",
        detail: "Des circonscriptions, des postes, des promesses. La plomberie.",
        effects: (c) => {
          const tient = c.s.power.sieges >= 260 ? c.rng.chance(0.75) : c.rng.chance(0.45);
          if (tient) {
            c.adj({ power: { parti: -5 }, player: { cynisme: 3 } });
            c.log("La motion de censure a échoué à quelques voix, au prix de négociations peu glorieuses.");
            return "283 voix. La motion échoue à six voix près. Ce que ces six voix ont coûté ne figurera dans aucun journal officiel : deux investitures, une ambassade, un « oubli » fiscal dont vous préférez ignorer les détails. Le gouvernement survit. Le mot « survivre » est désormais le verbe principal de votre mandat.";
          }
          c.flag("censure_votee");
          c.log("La motion de censure a été adoptée : votre gouvernement est tombé.");
          return "290 voix. Une de plus que nécessaire — l'Histoire aime les marges fines. Le gouvernement Rochefort est renversé. Dans la voiture qui la ramène de l'Assemblée, la Première ministre ne dit pas un mot. La crise de régime commence ce soir.";
        },
      },
      {
        id: "defier_censure",
        label: "Défier : « Qu'ils me censurent »",
        effects: (c) => {
          const tient = c.rng.chance(0.5);
          if (tient) {
            c.adj({ power: { popularite: 4 } });
            c.log("Vous avez défié la censure — et elle a échoué.");
            return "Le pari du bras de fer : pas une négociation, pas un appel. 279 voix — la motion échoue. Le panache paie, cette fois. Dans les couloirs, on murmure que vous avez « une chance insolente ». L'insolence, oui. La chance, elle, tient des comptes.";
          }
          c.flag("censure_votee");
          c.log("Votre défi à la censure s'est retourné contre vous : gouvernement renversé.");
          return "295 voix. Le défi a soudé vos adversaires mieux qu'aucun accord. Le gouvernement tombe avec fracas. Vos proches évoquent une dissolution, un nouveau Premier ministre, « un second souffle ». Leurs voix disent autre chose que leurs mots.";
        },
      },
    ],
  },
  // =========================================================================
  // 8. ANTOINE RIVES
  // =========================================================================
  {
    id: "rives_diner",
    kind: "intrigue",
    titre: "Le dîner chez Rives",
    once: true,
    weight: (s) => (s.turnCount >= 1 && s.turnCount <= 3 ? 2.5 : 0.5),
    texte:
      "Hôtel particulier d'Antoine Rives, dîner « strictement amical ». Ses chaînes vous ont bien traité pendant la campagne — vous le savez, il sait que vous le savez. Au café, il y vient : la loi audiovisuelle prévue au printemps « mérite d'être repensée », et une fréquence TNT se libère « par ailleurs ». Il ne demande rien. Il énonce.",
    choices: [
      {
        id: "accepter_rives",
        label: "Donner ce qu'il veut",
        detail: "La presse restera douce. La dépendance commence.",
        effects: (c) => {
          c.adj({ power: { presse: 10 }, player: { integrite: -6 } });
          c.rel("rives", { loyaute: 15 });
          c.flag("rives_deal");
          c.sched("rives_retour", 4, 10, 0.6);
          c.log("Vous avez passé un accord tacite avec le magnat Antoine Rives.");
          return "La loi audiovisuelle sera « repensée », la fréquence trouvera preneur. Rives lève son verre : « À la stabilité. » Ses éditorialistes découvriront dans les semaines qui viennent que vous gouvernez remarquablement bien. Le prix de ces éloges est simple : il n'est jamais soldé.";
        },
      },
      {
        id: "refuser_rives",
        label: "Refuser, avec le sourire",
        effects: (c) => {
          c.rel("rives", { rancune: 12 });
          c.adj({ power: { presse: -6 } });
          c.flag("rives_refus");
          c.sched("rives_rachat", 3, 8, 0.6);
          return "« La loi suivra son cours, Antoine. Le dîner était excellent. » Il vous raccompagne avec une courtoisie parfaite — chez Rives, la courtoisie est une unité de mesure de la menace. Comptez deux semestres avant que ses éditoriaux « s'interrogent ». Vous n'attendrez pas si longtemps.";
        },
      },
    ],
  },
  {
    id: "rives_rachat",
    kind: "intrigue",
    titre: "Rives rachète « L'Observateur »",
    once: true,
    weight: 0,
    texte:
      "Antoine Rives annonce le rachat du deuxième quotidien du pays. Avec ses chaînes et ses hebdos, il contrôlerait 40 % de l'audience d'information. L'Autorité de la concurrence peut s'en saisir — si le gouvernement le lui « suggère ». La rédaction de « L'Observateur » est en grève. Rives, lui, est « serein ».",
    choices: [
      {
        id: "bloquer_rachat",
        label: "Saisir l'Autorité de la concurrence",
        effects: (c) => {
          c.rel("rives", { rancune: 20 });
          c.adj({ power: { presse: -8 } });
          c.flag("rives_guerre");
          c.sched("rives_fabrique", 6, 14, 0.6);
          c.log("Vous avez bloqué la concentration des médias voulue par Rives.");
          return "L'Autorité bloque l'opération en huit semaines — un record. La presse indépendante salue « un sursaut ». La presse de Rives, qui reste la moitié de la presse, entame ce que ses rédactions appellent entre elles « le traitement ». Vous venez de gagner un principe et de perdre un empire médiatique. Les deux se paient.";
        },
      },
      {
        id: "laisser_rachat",
        label: "Laisser faire le marché",
        effects: (c) => {
          c.rel("rives", { loyaute: 8 });
          c.derive(1);
          c.seg("urbains", { soutien: -4 });
          c.flag("rives_empire");
          return "« L'État n'a pas à choisir les propriétaires des journaux. » L'argument est libéral, l'effet ne l'est pas : 40 % de l'information du pays a désormais un seul actionnaire, et cet actionnaire a votre numéro. La docilité de vos unes s'achète maintenant en gros.";
        },
      },
    ],
  },
  {
    id: "rives_retour",
    kind: "intrigue",
    titre: "Le retour d'ascenseur",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["rives_deal"],
    texte:
      "Rives revient. Cette fois c'est un marché public — la numérisation des services de l'État, trois milliards — pour lequel son groupe de BTP-télécoms est « naturellement positionné ». Il évoque, en passant, « la constance de (ses) rédactions » à votre égard. La phrase est aimable comme un relevé de compte.",
    choices: [
      {
        id: "ceder_encore",
        label: "Orienter le marché",
        effects: (c) => {
          c.adj({ player: { integrite: -8 }, power: { presse: 5 } });
          c.derive(1);
          c.flag("rives_marche_truque");
          c.sched("rives_scandale", 6, 16, 0.4);
          return "Le cahier des charges est réécrit sur mesure — c'est un artisanat discret que Bercy maîtrise. Le groupe Rives « remporte » l'appel d'offres. Chaque service rendu appelle le suivant : vous ne dînez plus avec un magnat, vous remboursez un créancier. Et quelque part, un fonctionnaire intègre a gardé la première version du cahier des charges.";
        },
      },
      {
        id: "rupture_rives",
        label: "Rompre. Maintenant.",
        detail: "Il fera payer. Autant que ce soit tout de suite.",
        effects: (c) => {
          c.rel("rives", { rancune: 25, loyaute: -20 });
          c.adj({ power: { presse: -12 } });
          c.flag("rives_guerre");
          c.sched("rives_fabrique", 4, 12, 0.7);
          return "« Le marché sera attribué selon les règles, Antoine. » Un silence. « Bien entendu. » Il part sans café. La semaine suivante, ses chaînes découvrent que votre gouvernement est « à bout de souffle ». La guerre commence — elle sera longue, feutrée, et il a plus de munitions que vous.";
        },
      },
    ],
  },
  {
    id: "rives_fabrique",
    kind: "intrigue",
    titre: "Le candidat de Rives",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["rives_guerre"],
    texte:
      "Les médias de Rives ont trouvé leur champion pour la prochaine présidentielle : exposition permanente, portraits fleuves, indulgence éditoriale totale. Le produit prend dans les sondages. Rives ne fabrique pas un président — il fabrique votre adversaire, ce qui est plus rentable.",
    choices: [
      {
        id: "encaisser_fabrique",
        label: "En prendre acte",
        effects: (c) => {
          c.flag("rives_champion");
          return "Vous connaissez maintenant le paysage de votre réélection : en face, un candidat propulsé par la moitié des écrans du pays. Il faudra le battre avec l'autre moitié — et avec ce qui reste de réel dans ce métier : les préaux, les marchés, les mains serrées.";
        },
      },
      {
        id: "loi_concentration",
        label: "Porter une loi anti-concentration des médias",
        detail: "Frontal. Historique. Risqué.",
        effects: (c) => {
          c.adj({ power: { presse: -10, popularite: 3 } });
          c.seg("urbains", { soutien: 6 });
          c.rel("rives", { rancune: 15 });
          c.flag("loi_medias");
          c.log("Vous avez porté une loi limitant la concentration des médias — contre l'empire Rives.");
          return "La loi limite à 25 % l'audience contrôlée par un seul groupe. Le débat parlementaire est une guerre totale, l'empire Rives tire tout ce qu'il a. Le texte passe de justesse. C'est la réforme la plus applaudie à l'étranger et la plus punie dans vos propres journaux — les deux pour la même raison.";
        },
      },
    ],
  },
  {
    id: "rives_scandale",
    kind: "intrigue",
    titre: "Le cahier des charges",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["rives_marche_truque"],
    texte:
      "Le fonctionnaire intègre existait. Louise Ferrand publie les deux versions du cahier des charges de la numérisation, en vis-à-vis, surlignées. La démonstration tient en une double page : le marché a été cousu main pour le groupe Rives. Le parquet financier s'autosaisit dans la journée.",
    choices: [
      {
        id: "nier_marche",
        label: "Nier toute intervention",
        effects: (c) => {
          c.adj({ power: { popularite: -8, justice: -5 } });
          c.flag("carnets_proces");
          return "Le démenti part, mécanique. Mais les documents sont là, et les documents votent toujours dans le même sens. L'instruction remontera la chaîne des paraphes jusqu'où elle mène. Vous savez où elle mène.";
        },
      },
      {
        id: "lacher_rives",
        label: "Lâcher Rives à la justice",
        detail: "Rompre le pacte en rase campagne.",
        effects: (c) => {
          c.rel("rives", { rancune: 30 });
          c.adj({ power: { presse: -15, justice: 5 } });
          c.flag("rives_guerre");
          return "L'Élysée « souhaite que toute la lumière soit faite » — Rives lit le communiqué comme une déclaration de guerre, à raison. Ses avocats plaident, ses journaux mitraillent. Vous avez peut-être sauvé votre dossier judiciaire. Vous avez définitivement perdu la moitié des unes du pays.";
        },
      },
    ],
  },
  // =========================================================================
  // 9. LE CONJOINT
  // =========================================================================
  {
    id: "conjoint_affaire",
    kind: "intrigue",
    titre: "Le client gênant",
    once: true,
    weight: (s) => (s.turnCount >= 2 ? 1.5 : 0.3),
    texte: (s) =>
      `Un hebdomadaire révèle que le cabinet de ${s.bio.conjointPrenom} compte parmi ses clients un groupe qui vient d'obtenir un marché de l'État. Rien d'illégal — tout de gênant. Le mot « conflit d'intérêts » est dans tous les titres, avec un point d'interrogation qui ne trompe personne.`,
    choices: [
      {
        id: "renoncer_carriere",
        label: "Demander l'abandon du client",
        effects: (c) => {
          c.rel("conjoint", { loyaute: -12, rancune: 8 });
          c.adj({ power: { popularite: 2 } });
          return "Le client est abandonné, le communiqué est propre, la polémique meurt. À la maison, une carrière de vingt ans vient d'être amputée par la vôtre — encore. Le décompte de ces « encore » est tenu quelque part, précisément, et pas par vous.";
        },
      },
      {
        id: "defendre_conjoint",
        label: "Défendre son indépendance",
        detail: "« Nous sommes deux personnes, deux carrières. »",
        effects: (c) => {
          c.rel("conjoint", { loyaute: 12 });
          c.adj({ power: { popularite: -4 } });
          c.sched("conjoint_commission", 3, 8, 0.4);
          return "La position est moderne et sincère. La presse la trouve « habile », c'est-à-dire qu'elle n'y croit pas. Le sujet reviendra à chaque marché public frôlant le cabinet. Mais ce soir-là, à la maison, quelqu'un vous a regardé comme avant l'Élysée.";
        },
      },
    ],
  },
  {
    id: "conjoint_commission",
    kind: "intrigue",
    titre: "La commission s'en mêle",
    once: true,
    weight: 0,
    texte:
      "La Haute Autorité pour la transparence ouvre un examen des « liens d'intérêts au sein du couple exécutif ». C'est une procédure, pas une accusation — mais les procédures ont des fuites, et les fuites ont des unes.",
    choices: [
      {
        id: "cooperer",
        label: "Coopérer totalement",
        effects: (c) => {
          c.adj({ player: { integrite: 3 }, power: { popularite: -2 } });
          return "Tout est transmis : agendas, contrats, relevés. L'examen conclut à « une situation sensible sans manquement caractérisé ». La formule est un acquittement au goût de soupçon — c'est le seul acquittement que cette République délivre.";
        },
      },
      {
        id: "trainer",
        label: "Faire traîner",
        effects: (c) => {
          c.adj({ power: { justice: -4 } });
          c.rel("ferrand", { ambition: 5 });
          return "Les documents arrivent incomplets, avec retard, par avocats interposés. La Haute Autorité le note dans son rapport — sobrement, ce qui est pire. Ferrand ajoute une fiche à son mur. Le dossier restera « en cours » : c'est un statut, désormais, presque une adresse.";
        },
      },
    ],
  },
  {
    id: "conjoint_divorce",
    kind: "intrigue",
    titre: "La fin du couple",
    once: true,
    weight: (s) => {
      const conj = s.characters["conjoint"];
      return conj && conj.loyaute < 40 ? 3 : 0;
    },
    texte: (s) =>
      `${s.bio.conjointPrenom} vous attend un soir dans le salon privé, avec deux verres et aucune colère — c'est la colère depuis longtemps épuisée. « Je pars. Pas contre toi. Loin de tout ça. On annonce comme tu veux. Mais je pars. » Un divorce à l'Élysée : la presse en rêve, l'Histoire n'en a presque pas d'exemple, et vous avez un pays à gouverner demain à 8h.`,
    choices: [
      {
        id: "accepter_depart",
        label: "Accepter, protéger, annoncer dignement",
        effects: (c) => {
          c.flag("divorce");
          c.adj({ power: { popularite: -6 }, hidden: { fatigue: 10 } });
          c.rel("conjoint", { rancune: -10 });
          c.log("Votre couple n'a pas survécu à la présidence. La séparation a été annoncée avec dignité.");
          return "Le communiqué tient en quatre lignes, sans adjectifs. La presse people en tire six mois de couvertures ; la presse politique, des analyses sur « la solitude du pouvoir ». Aux dîners d'État, votre chaise voisine reste vide. Vous découvrez que le silence de l'Élysée, la nuit, a plusieurs épaisseurs.";
        },
      },
      {
        id: "supplier",
        label: "Demander de tenir jusqu'à la fin du mandat",
        detail: "« Après, je te le jure, tout s'arrête. »",
        effects: (c) => {
          const reste = c.rng.chance(0.5);
          if (reste) {
            c.rel("conjoint", { loyaute: 10, rancune: 5 });
            c.flag("couple_sursis");
            return "Un long silence, puis : « Jusqu'à la fin du mandat. Pas un jour de plus. Et tu me dois la vérité sur tout, à partir de maintenant. » Le couple présidentiel tiendra en public. En privé, vous vivez désormais dans un armistice — c'est plus solide qu'une paix fausse, et plus triste.";
          }
          c.flag("divorce");
          c.adj({ power: { popularite: -8 }, hidden: { fatigue: 12 } });
          c.rel("conjoint", { rancune: 15 });
          c.log("Votre couple s'est brisé en plein mandat, malgré vos supplications.");
          return "« C'est exactement la phrase que tu as dite avant la campagne. Et avant la primaire. » Le départ a lieu dans le mois. L'annonce vous échappe — un hebdomadaire dégaine avant le communiqué, avec les mots les plus cruels. La séquence est un incendie privé en place publique.";
        },
      },
    ],
  },
  // =========================================================================
  // 10. LE PASSÉ (l'intrigue biographique)
  // =========================================================================
  {
    id: "frere_grace",
    kind: "intrigue",
    titre: "La demande de grâce",
    once: true,
    weight: (s) => (s.flags["frere_condamne"] && s.turnCount >= 2 ? 2.5 : 0),
    texte:
      "Votre frère purge sa peine depuis sept ans. Sa demande de grâce présidentielle est sur votre bureau — déposée par son avocat, médiatisée avant d'arriver. Le droit vous le permet. Tout le reste vous le déconseille. Votre mère a appelé trois fois cette semaine.",
    choices: [
      {
        id: "gracier",
        label: "Signer la grâce",
        effects: (c) => {
          c.adj({ power: { popularite: -8, justice: -8 }, player: { integrite: -6 } });
          c.log("Vous avez gracié votre propre frère — l'opinion ne l'a jamais digéré.");
          c.sched("frere_retombees", 4, 12, 0.5);
          return "Le décret est signé un vendredi d'été. Rien n'y fait — ni la date, ni les précédents juridiques que vos services alignent : le pays voit un président qui sort son frère de prison. Sallenave tient son angle pour deux ans. Votre mère pleure au téléphone. C'est le seul moment de la journée que vous ne regrettez pas.";
        },
      },
      {
        id: "refuser_grace",
        label: "Refuser",
        detail: "Le président ne peut pas être un frère.",
        effects: (c) => {
          c.adj({ player: { integrite: 6 }, hidden: { fatigue: 5 } });
          c.flag("frere_refuse");
          c.sched("frere_interview", 3, 8, 0.6);
          c.log("Vous avez refusé la grâce de votre propre frère.");
          return "La réponse part par la voie officielle, sans un mot personnel — il n'y a pas de voie pour les mots personnels dans cette maison. Votre mère ne rappelle plus. La presse salue « un sens de l'État ». Le sens de l'État, personne ne vous dit jamais combien il coûte en famille.";
        },
      },
    ],
  },
  {
    id: "frere_interview",
    kind: "intrigue",
    titre: "L'interview du frère",
    once: true,
    weight: 0,
    texte:
      "Votre frère parle depuis sa cellule, longue interview exclusive : l'enfance, l'affaire, et vous. « Il n'a pas refusé ma grâce. Il a refusé d'être mon frère. Ça fait longtemps, remarquez. » Le portrait qu'il dresse de vous est injuste, intime, et par endroits — c'est le pire — exact.",
    choices: [
      {
        id: "silence_frere",
        label: "Ne pas répondre",
        effects: (c) => {
          c.adj({ power: { popularite: -3 }, hidden: { fatigue: 5 } });
          return "Aucun commentaire, aucune source anonyme, rien. L'interview vit dix jours puis s'éteint. Ce qu'elle a ouvert en vous ne s'éteint pas sur le même calendrier. Bensalah vous appelle le soir même : « Ça va ? » C'est le seul qui pose la question sans y intéresser une carrière.";
        },
      },
      {
        id: "repondre_frere",
        label: "Répondre, une fois, avec le cœur",
        effects: (c) => {
          c.adj({ player: { charisme: 3 }, power: { popularite: 2 } });
          return "Trois phrases en marge d'un déplacement, la voix moins assurée que d'habitude : « C'est mon frère. Je l'aime. Le président, lui, n'a pas de frère — c'est la part du métier qu'on ne me pardonnera pas, et c'est normal. » Le pays, qui a des frères, entend. C'est votre meilleure séquence de l'année, et elle n'était pas calculée. Enfin — pas entièrement.";
        },
      },
    ],
  },
  {
    id: "frere_retombees",
    kind: "intrigue",
    titre: "La récidive",
    once: true,
    weight: 0,
    texte:
      "Votre frère gracié vient d'être interpellé — une affaire mineure, mais une affaire. Chaque journal du pays a la même une avec des polices différentes : la grâce présidentielle, la récidive, votre visage. L'éditorial de Bec s'intitule « Le prix du sang ».",
    choices: [
      {
        id: "assumer_frere",
        label: "Assumer sans se défausser",
        effects: (c) => {
          c.adj({ power: { popularite: -6 }, player: { integrite: 2 } });
          return "« J'ai pris cette décision seul, en conscience. Elle m'appartient, et ses suites aussi. » Pas de fusible cette fois — il n'y en avait pas de disponible, et c'était votre frère. L'affaire vous coûtera des points jusqu'à la fin du mandat. Certaines dettes ne s'amortissent pas.";
        },
      },
    ],
  },
  {
    id: "these_ressort",
    kind: "intrigue",
    titre: "Les trois chapitres",
    once: true,
    weight: (s) => (s.flags["these_arrangee"] && s.turnCount >= 2 ? 2 : 0),
    texte:
      "Un professeur émérite, aidé d'un logiciel et d'une patience de bénédictin, a comparé votre thèse à trois ouvrages des années 80. Les concordances sont surlignées, paginées, indiscutables. Il a tout envoyé à l'université — et à Louise Ferrand. L'université « examine ». Ferrand, elle, n'examine pas : elle boucle.",
    choices: [
      {
        id: "avouer_these",
        label: "Reconnaître, avant la publication",
        effects: (c) => {
          c.adj({ power: { popularite: -5 }, player: { integrite: 4 } });
          c.log("Vous avez reconnu les emprunts de votre thèse avant que la presse ne les révèle.");
          return "Vous prenez tout le monde de vitesse : « À vingt-six ans, pressé d'exister, j'ai emprunté ce que j'aurais dû citer. C'était une faute. » L'université retire le titre, la presse retire ses gros titres — avouer avant, c'est dégonfler le scandale en payant comptant. Le doctorat disparaît de votre biographie officielle. La faute, elle, y entre. L'échange est honnête.";
        },
      },
      {
        id: "minimiser_these",
        label: "Parler de « méthodes d'époque »",
        effects: (c) => {
          c.adj({ power: { popularite: -8 }, player: { integrite: -5 } });
          c.rel("ferrand", { ambition: 5 });
          return "« Les usages de citation étaient différents. » Le professeur émérite répond en une phrase : « Le vol aussi était interdit dans les années 80. » Il gagne le duel par K.-O. L'affaire s'installe, et chaque diplôme que vous remettrez désormais fera sourire quelqu'un dans la salle.";
        },
      },
    ],
  },
  {
    id: "militaire_bavure",
    kind: "intrigue",
    titre: "Le camarade qui parle",
    once: true,
    weight: (s) => (s.flags["passe_militaire"] && s.turnCount >= 2 ? 2 : 0),
    texte:
      "Un ancien de votre section a parlé à un documentariste : une opération extérieure, il y a vingt-cinq ans, un village, des tirs « dans la confusion », deux civils. Votre nom n'est pas dans le rapport officiel de l'époque — c'est précisément ce que le documentaire trouve étrange. Vous étiez l'officier de permanence cette nuit-là.",
    choices: [
      {
        id: "verite_opex",
        label: "Raconter cette nuit, publiquement",
        effects: (c) => {
          c.adj({ power: { popularite: -4, armee: -5 }, player: { integrite: 8 } });
          c.log("Vous avez raconté publiquement la nuit qui hantait votre passé militaire.");
          return "Vous parlez vingt minutes, précisément, sans vous exonérer : la confusion, les ordres, les deux morts, le rapport « lissé » par la hiérarchie d'alors. L'institution militaire déteste l'exercice. Les familles des victimes, contactées par votre bureau, reçoivent enfin des réponses — et des excuses de l'État. Vous dormez mal cette semaine-là. Mieux qu'avant, cependant.";
        },
      },
      {
        id: "secret_defense",
        label: "Opposer le secret-défense",
        effects: (c) => {
          c.adj({ power: { armee: 3 }, player: { integrite: -6 } });
          c.derive(1);
          c.sched("opex_retour", 6, 14, 0.4);
          return "Le documentaire est diffusé avec un carton noir : « L'Élysée a opposé le secret de la défense nationale. » Le carton fait plus de dégâts qu'une réponse. L'armée apprécie la protection de l'institution ; le pays, lui, retient qu'il y a quelque chose à protéger.";
        },
      },
    ],
  },
  {
    id: "opex_retour",
    kind: "intrigue",
    titre: "Le rapport déclassifié",
    once: true,
    weight: 0,
    texte:
      "Un tribunal administratif ordonne la déclassification partielle du rapport de l'époque. Votre nom y figure — non pas dans les tirs, mais dans la chaîne de rédaction du rapport « lissé ». Vous n'avez pas tué. Vous avez signé la version propre. C'est un autre crime, plus petit et plus vôtre.",
    choices: [
      {
        id: "assumer_rapport",
        label: "Assumer : « J'ai signé. J'avais 26 ans. J'ai eu tort. »",
        effects: (c) => {
          c.adj({ power: { popularite: -5 }, player: { integrite: 5 } });
          return "La confession est sèche et sans excuse d'époque. Une partie du pays respecte, une autre condamne, l'armée se tait — son silence est sa manière de tourner la page avec vous dedans. Le documentariste, beau joueur, ajoute votre déclaration en post-scriptum de son film.";
        },
      },
    ],
  },
  {
    id: "heritier_photo",
    kind: "intrigue",
    titre: "La photo du manoir",
    once: true,
    weight: (s) => (s.flags["heritier"] && s.turnCount >= 2 ? 1.5 : 0),
    texte:
      "En pleine séquence sur « les efforts demandés aux Français », un hebdomadaire publie huit pages sur la propriété familiale : le parc, les communs, la piscine « historique ». Les photos sont légales — prises d'un chemin public — et dévastatrices. Le mot « déconnecté » remonte dans tous les baromètres comme une marée.",
    choices: [
      {
        id: "assumer_heritage",
        label: "Assumer l'héritage",
        detail: "« Je ne m'excuserai pas de ma famille. »",
        effects: (c) => {
          c.seg("periurbain", { soutien: -5 });
          c.seg("csp", { soutien: 3 });
          return "La position est droite et coûteuse. « Il ne s'excuse pas d'être riche, c'est déjà ça », grince un éditorialiste. Sur les ronds-points passés et futurs, la photo de la piscine est plastifiée. Elle resservira à chaque effort demandé.";
        },
      },
      {
        id: "vendre",
        label: "Annoncer la mise en vente",
        detail: "Un geste. Votre famille ne vous le pardonnera pas.",
        effects: (c) => {
          c.adj({ power: { popularite: 3 }, hidden: { fatigue: 5 } });
          c.rel("conjoint", { rancune: 5 });
          c.log("Vous avez vendu la propriété familiale pour éteindre une polémique.");
          return "La vente est annoncée « au profit d'une fondation ». Politiquement, la séquence est parfaite. Au déjeuner de Noël suivant, votre sœur ne vous adresse pas la parole, et votre mère parle de la maison au passé, comme d'une personne. Les sondages ne mesurent pas ça.";
        },
      },
    ],
  },
  {
    id: "marseille_amis",
    kind: "intrigue",
    titre: "Les amis d'avant",
    once: true,
    weight: (s) => (s.flags["amities_marseille"] && s.turnCount >= 2 ? 2 : 0),
    texte:
      "Un règlement de comptes sur le Vieux-Port, un prévenu — et dans le dossier d'instruction, des photos d'archives : lui et vous, à vingt ans, épaule contre épaule à un mariage. Vous n'avez rien fait d'illégal. Vous avez juste grandi où vous avez grandi, avec qui il y avait. La presse nationale découvre le mot « quartier » avec des pincettes.",
    choices: [
      {
        id: "assumer_origines",
        label: "Assumer ses origines, toutes",
        effects: (c) => {
          c.adj({ player: { charisme: 4 } });
          c.seg("quartiers", { soutien: 5 });
          c.seg("pavillonnaires", { soutien: -3 });
          return "« Je viens d'un endroit où l'on ne choisissait pas ses voisins de mariage. Certains ont mal tourné. Moi, j'ai fini président — c'est dire si les trajectoires divergent. » L'aplomb désarme. Marseille, qui déteste qu'on rougisse d'elle, vous le rend au centuple.";
        },
      },
      {
        id: "distancer",
        label: "Prendre ses distances par communiqué",
        effects: (c) => {
          c.seg("quartiers", { soutien: -4 });
          c.rel("bensalah", { loyaute: -8 });
          return "Le communiqué parle de « relations anciennes et sans suite ». Techniquement vrai. Au quartier, on traduit autrement : il a honte. Bensalah vous le dit sans détour au téléphone : « Ce communiqué, c'est pas toi. » Vous ne répondez pas, parce que si.";
        },
      },
    ],
  },
  // =========================================================================
  // 11. SACHA DELVAL, LE DAUPHIN
  // =========================================================================
  {
    id: "delval_phrase",
    kind: "intrigue",
    titre: "La petite phrase",
    once: true,
    weight: (s) => (s.turnCount >= 2 ? 2 : 0.3),
    texte:
      "En clôture d'université d'été, Sacha Delval a lâché, l'air de rien : « La fidélité, en politique, n'est pas un état — c'est un contrat. Et un contrat, ça se renégocie. » La salle a ri. Les journalistes, non : ils ont titré. Il jure qu'il parlait « en général ». Personne ne parle jamais en général.",
    choices: [
      {
        id: "convoquer_delval",
        label: "Le convoquer et crever l'abcès",
        effects: (c) => {
          c.rel("delval", { loyaute: 5, ambition: -3 });
          c.sched("delval_courant", 4, 10, 0.4);
          return "Une heure en tête-à-tête, cartes sur table : ses ambitions, votre calendrier, ce qu'il peut espérer et quand. Il sort rasséréné — les ambitieux ne demandent qu'un horizon daté. Vous venez d'acheter du temps. Le prix affiché viendra plus tard.";
        },
      },
      {
        id: "humilier_delval",
        label: "L'humilier d'un mot en conseil",
        detail: "« Les contrats, Sacha, ont aussi des clauses de résiliation. »",
        effects: (c) => {
          c.rel("delval", { rancune: 15, ambition: 8 });
          c.sched("delval_courant", 2, 6, 0.7);
          return "Le mot fait le tour du microcosme en deux heures — c'était le but. Delval encaisse avec un sourire de vingt ans plus jeune que le vôtre. Vous avez gagné l'échange. Il a gagné un grief, et les griefs sont le carburant des carrières.";
        },
      },
      {
        id: "ignorer_delval",
        label: "Ignorer",
        effects: (c) => {
          c.rel("delval", { ambition: 5 });
          c.sched("delval_courant", 3, 8, 0.5);
          return "Pas de réaction — les phrases qu'on ne relève pas meurent plus vite. Celle-ci, pourtant, continue de vivre en coulisses : elle a donné un mot d'ordre à ceux qui s'impatientent. Ils savent maintenant qu'ils sont plusieurs.";
        },
      },
    ],
  },
  {
    id: "delval_courant",
    kind: "intrigue",
    titre: "Le courant",
    once: true,
    weight: 0,
    texte:
      "Ça s'appelle « Générations » — les courants s'appellent toujours ainsi. Trente parlementaires, un site, des débats « sur le fond ». Delval jure que ce n'est « pas contre » vous. C'est l'exactitude des ambitieux : ce n'est pas contre vous, c'est pour après vous — et « après » est une date qu'ils se réservent de fixer.",
    choices: [
      {
        id: "integrer_delval",
        label: "L'intégrer au gouvernement",
        detail: "Un grand ministère. Solidaire du bilan, tenu par l'agenda.",
        effects: (c) => {
          c.rel("delval", { loyaute: 8, ambition: 5 });
          c.flag("delval_ministre");
          return "Delval accepte le ministère avec un empressement qui en dit long sur le calcul : s'user au bilan ou se construire une stature — il parie sur la stature. Vous pariez sur l'usure. L'un de vous deux gagnera ce pari au moment de la réélection.";
        },
      },
      {
        id: "affronter_delval",
        label: "Provoquer le congrès et l'affronter",
        effects: (c) => {
          const gagne = c.s.power.parti > 50;
          if (gagne) {
            c.rel("delval", { rancune: 20, ambition: -5 });
            c.adj({ power: { parti: -8 } });
            c.flag("delval_ecrase");
            return "Le congrès vous donne 61 %. Victoire nette — et pyrrhique : les images de la salle coupée en deux passent en boucle, et 39 % d'un parti, ça ne se dissout pas, ça attend. Delval félicite « le vainqueur du jour ». L'expression est choisie au scalpel.";
          }
          c.rel("delval", { ambition: 15 });
          c.adj({ power: { parti: -15 } });
          c.flag("delval_vainqueur");
          return "52 % pour la motion Delval. Vous gardez l'Élysée, il prend le parti — la machine, les fichiers, les investitures. Vous êtes désormais un président sans appareil, ce qui ressemble à un général sans armée : le titre reste, l'écho change.";
        },
      },
      {
        id: "laisser_delval",
        label: "Le laisser prospérer",
        effects: (c) => {
          c.rel("delval", { ambition: 10 });
          c.adj({ power: { parti: -5 } });
          c.sched("delval_congres", 4, 10, 0.5);
          return "Vous choisissez l'indifférence de façade. Le courant grossit, tranquillement, comme une rivière qui sait où est la mer. Au prochain congrès, la question ne sera plus de savoir s'il pèse — mais s'il attend la fin de votre mandat ou s'il le raccourcit.";
        },
      },
    ],
  },
  {
    id: "delval_congres",
    kind: "intrigue",
    titre: "Le congrès des couteaux",
    once: true,
    weight: 0,
    texte:
      "Le congrès s'ouvre dans une ambiance de conclave armé. La motion Delval revendique « un nouveau souffle » — le vocabulaire de la succession du vivant. Les fédérations sont partagées, les couloirs comptent et recomptent. Ce soir, le parti aura un propriétaire.",
    choices: [
      {
        id: "bataille_finale",
        label: "Se battre jusqu'à la dernière fédération",
        effects: (c) => {
          const gagne = c.s.power.parti > 45 && c.rng.chance(0.6);
          if (gagne) {
            c.flag("delval_ecrase");
            c.rel("delval", { rancune: 25 });
            c.adj({ power: { parti: 5 }, hidden: { fatigue: 10 } });
            return "Vous faites la tournée des fédérations comme un candidat de trente ans, nuit après nuit. 57 % — le parti reste vôtre. Delval quitte le secrétariat général « pour se consacrer à ses idées ». Traduction : pour préparer la présidentielle. La vôtre ou la sienne, c'est désormais la même date.";
          }
          c.flag("delval_vainqueur");
          c.adj({ power: { parti: -15 }, hidden: { fatigue: 10 } });
          c.log("Le congrès vous a échappé : Sacha Delval contrôle désormais votre parti.");
          return "54 % pour Delval. Le discours de clôture qu'il prononce est un chef-d'œuvre d'hommage funèbre à un président vivant. Vous applaudissez, parce que les caméras. Le parti a tourné la page — le problème, c'est que la page, c'était vous.";
        },
      },
    ],
  },
  // =========================================================================
  // 12. L'ENGRENAGE SAHÉLIEN
  // =========================================================================
  {
    id: "sahel_otages",
    kind: "intrigue",
    titre: "Les otages",
    once: true,
    weight: (s) => (s.turnCount >= 2 && s.turnCount <= 4 ? 2.5 : 0.4),
    texte:
      "Deux humanitaires français enlevés dans la bande sahélienne, à trois cents kilomètres de la base française de Tessalit-Ouest. La katiba demande une rançon et un retrait symbolique. Verdier propose un raid : « Fenêtre favorable, renseignement solide, risque réel. » Il surestime toujours la menace — surestime-t-il aussi la fenêtre ?",
    choices: [
      {
        id: "raid",
        label: "Autoriser le raid",
        effects: (c) => {
          const succes = c.rng.chance(0.6);
          if (succes) {
            c.adj({ country: { prestige: 5 }, power: { armee: 6, popularite: 4 } });
            c.rel("verdier", { loyaute: 5, ambition: 5 });
            c.sched("sahel_junte", 4, 10, 0.6);
            c.log("Le raid de Tessalit a libéré les otages — une nuit que le pays n'oubliera pas.");
            return "3h20, heure locale. Quarante minutes d'opération, deux otages libérés, aucune perte française. Les images des retrouvailles sur le tarmac font pleurer un pays entier. Verdier, sobre et décoré, gagne dix points d'aura — vous y penserez plus tard. Cette nuit, vous avez gagné. Le Sahel, lui, continue.";
          }
          c.adj({ country: { prestige: -4 }, power: { armee: -5, popularite: -6 } });
          c.flag("sahel_drame");
          c.sched("sahel_junte", 3, 8, 0.7);
          c.log("Le raid de Tessalit a échoué : deux soldats et un otage sont morts.");
          return "La fenêtre s'est refermée pendant l'approche. Deux commandos tués, un otage exécuté pendant l'assaut, l'autre exfiltré. Les honneurs militaires aux Invalides, la pluie, les familles. Vous avez serré des mains en sachant que votre signature était sur l'ordre. Elle y restera.";
        },
      },
      {
        id: "rancon",
        label: "Négocier discrètement",
        detail: "Officiellement, la France ne paie pas. Officiellement.",
        effects: (c) => {
          c.adj({ player: { integrite: -4 } });
          c.flag("rancon_payee");
          c.sched("sahel_junte", 4, 10, 0.6);
          c.sched("rancon_fuite", 6, 16, 0.35);
          return "Les otages sont libérés « grâce à des médiations régionales » — la formule consacrée. Sept millions ont transité par trois intermédiaires. La katiba s'achètera des pick-up et des munitions ; certains serviront contre des soldats français. Cette arithmétique-là, personne ne la prononce jamais à voix haute.";
        },
      },
      {
        id: "attendre_sahel",
        label: "Temporiser",
        effects: (c) => {
          c.adj({ power: { popularite: -3 } });
          c.flag("otages_abandonnes");
          c.sched("sahel_junte", 4, 10, 0.6);
          return "Ni raid, ni rançon : l'attente. Les familles des otages passent à la télévision toutes les semaines, avec le décompte des jours en bandeau. Chaque apparition est un procès silencieux. La détention durera — et son ombre aussi.";
        },
      },
    ],
  },
  {
    id: "sahel_junte",
    kind: "intrigue",
    titre: "La junte",
    once: true,
    weight: 0,
    texte:
      "Coup d'État dans le pays hôte : une junte de colonels, un discours anti-français vibrant, une foule devant l'ambassade. La base de Tessalit-Ouest abrite huit cents hommes. La junte « invite » la France à partir — tout en négociant secrètement avec la milice d'une puissance rivale, qui attend en coulisses avec ses instructeurs et ses contrats miniers.",
    choices: [
      {
        id: "partir_sahel",
        label: "Retirer les troupes",
        detail: "L'humiliation ordonnée vaut mieux que l'enlisement subi.",
        effects: (c) => {
          c.adj({ country: { prestige: -8, marge: 3 }, power: { armee: -6 } });
          c.flag("sahel_retrait");
          c.log("Vous avez ordonné le retrait du Sahel — la fin d'une époque, en silence.");
          return "Le retrait prend quatre mois, drapeaux pliés, matériel convoyé. La milice rivale s'installe dans vos emprises avant même le dernier avion — les images font le tour du monde. Soixante ans de présence s'achèvent sans cérémonie. C'est un déchirement stratégique, et un soulagement budgétaire. Les deux sont vrais. C'est le problème.";
        },
      },
      {
        id: "rester_sahel",
        label: "Rester, coûte que coûte",
        effects: (c) => {
          c.adj({ country: { marge: -4 }, power: { armee: 3 } });
          c.flag("sahel_enlisement");
          c.sched("sahel_attentat_base", 3, 8, 0.5);
          c.sched("sahel_attentat_base2", 9, 16, 0.4);
          return "La France « ne cédera pas aux injonctions » : la base reste, ravitaillée sous tension, juridiquement fragile, politiquement assiégée. Verdier approuve. Chaque mois coûtera des millions et un risque. Vous venez de choisir l'enlisement par refus de l'humiliation — le menu habituel de cette région, depuis toujours.";
        },
      },
    ],
  },
  {
    id: "sahel_attentat_base",
    kind: "intrigue",
    titre: "L'attaque de la base",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["sahel_enlisement"],
    texte:
      "4h50 : véhicule suicide contre l'entrée sud de Tessalit-Ouest, suivi d'un assaut. Trois soldats français tués, onze blessés. L'attaque était coordonnée depuis une zone que la junte « ne contrôle pas » — formule qui signifie qu'elle l'a laissée faire. Les cercueils arrivent jeudi aux Invalides.",
    choices: [
      {
        id: "frapper_fort",
        label: "Frapper les camps en représailles",
        effects: (c) => {
          c.adj({ country: { prestige: 2 }, power: { armee: 5 } });
          c.rel("verdier", { loyaute: 5 });
          return "Les frappes détruisent trois camps et une colonne. L'efficacité militaire est réelle, l'effet politique incertain : chaque frappe recrute pour l'adversaire, disent vos propres notes. La spirale a sa propre logique — vous êtes dedans, et vous tenez le volant d'une seule main.";
        },
      },
      {
        id: "partir_apres_sang",
        label: "Annoncer le retrait",
        detail: "Partir après les cercueils : le pire moment. Il n'y en aura pas de meilleur.",
        effects: (c) => {
          c.adj({ country: { prestige: -6 }, power: { armee: -8, popularite: -3 } });
          c.flag("sahel_retrait");
          c.flag("sahel_enlisement", false);
          c.log("Après l'attaque de Tessalit, vous avez ordonné le retrait du Sahel.");
          return "Annoncer le retrait au lendemain des obsèques : l'opposition parle de « défaite », l'état-major se tait avec éloquence. Mais les mères des soldats suivants ne recevront pas de drapeau plié. Vous avez choisi que l'Histoire vous appelle « celui qui a perdu le Sahel » plutôt que d'en nourrir la suite. Il fallait bien que quelqu'un le choisisse un jour.";
        },
      },
    ],
  },
  {
    id: "sahel_attentat_base2",
    kind: "intrigue",
    titre: "Tessalit, encore",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["sahel_enlisement"],
    texte:
      "Nouvelle attaque contre la base — repoussée, cette fois, au prix d'un blessé grave. C'est la routine désormais : un assaut par saison, des millions par mois, un intérêt stratégique que plus personne ne sait formuler sans notes. En conseil de défense, un jeune colonel ose la question que tout le monde évite : « Quel est l'état final recherché, monsieur le Président ? »",
    choices: [
      {
        id: "rester_encore",
        label: "« La France ne part pas sous le feu. »",
        effects: (c) => {
          c.adj({ country: { marge: -3 } });
          return "La formule clôt la réunion — elle ne répond pas à la question, c'est sa fonction. L'enlisement continue, budgété, sanglant à bas bruit. Le jeune colonel sera muté dans un placard honorable. Sa question, elle, reste dans la pièce. Elle y sera encore au prochain conseil.";
        },
      },
      {
        id: "sortie_negociee",
        label: "Négocier une sortie avec la junte",
        effects: (c) => {
          c.adj({ country: { prestige: -4, marge: 3 }, player: { cynisme: 3 } });
          c.flag("sahel_retrait");
          c.flag("sahel_enlisement", false);
          c.log("Vous avez négocié avec la junte une sortie du Sahel — discrète et amère.");
          return "L'accord est laid et efficace : un calendrier de retrait, des « coopérations » de façade, une non-agression tacite avec des gens que la République ne fréquente pas officiellement. La diplomatie a des couloirs de service. Vous venez d'en emprunter un, et il ne figure sur aucun plan.";
        },
      },
    ],
  },
  {
    id: "rancon_fuite",
    kind: "intrigue",
    titre: "« La France a payé »",
    once: true,
    weight: 0,
    texte:
      "Une agence de presse étrangère publie les preuves du versement : sept millions, trois intermédiaires, un mémo interne. Vos alliés, qui appliquent la doctrine du non-paiement, sont furieux — leurs otages à venir vaudront désormais plus cher. Et au Parlement, une question simple : qui a menti à qui ?",
    choices: [
      {
        id: "assumer_rancon",
        label: "Assumer : « J'ai choisi deux vies »",
        effects: (c) => {
          c.adj({ country: { prestige: -4 }, power: { popularite: 2 }, player: { integrite: 3 } });
          return "« Entre une doctrine et deux vies françaises, j'ai choisi les vies. Je le referais. » La phrase divise les chancelleries et rassemble les familles. C'est un mensonge d'État avoué en son cœur — l'aveu vous coûte à l'étranger ce qu'il vous rend à l'intérieur. Solde : nul. Conscience : mieux.";
        },
      },
      {
        id: "nier_rancon",
        label: "Nier, doctrine oblige",
        effects: (c) => {
          c.adj({ player: { integrite: -5 }, country: { prestige: -2 } });
          c.rel("ferrand", { ambition: 5 });
          return "« La France n'a pas payé, ne paie pas, ne paiera pas. » Le triple démenti est récité partout, cru nulle part. Le mémo est authentique et tout le monde le sait. Vous venez d'ajouter un mensonge officiel au dossier — Ferrand collectionne les triples démentis comme d'autres les papillons.";
        },
      },
    ],
  },
];
