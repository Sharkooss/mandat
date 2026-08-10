import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les crises : le temps passe au jour près, 4 à 6 décisions s'enchaînent,
// l'information est plus mauvaise que jamais. Une crise ne se gagne pas —
// elle se traverse, et elle laisse des traces.
// ---------------------------------------------------------------------------

export interface CriseDef {
  id: string;
  titre: string;
  events: string[];
}

export const CRISES: CriseDef[] = [
  { id: "crise_rp", titre: "L'Acte VII", events: ["crp_1", "crp_2", "crp_3", "crp_4"] },
  { id: "crise_vigor", titre: "Saint-Vigor", events: ["cvg_1", "cvg_2", "cvg_3", "cvg_4"] },
  { id: "crise_attentat", titre: "Le 14 novembre", events: ["cat_1", "cat_2", "cat_3", "cat_4", "cat_5"] },
];

export const EVENTS_CRISES: GameEvent[] = [
  // =========================================================================
  // CRISE : L'ACTE VII (Ronds-Points)
  // =========================================================================
  {
    id: "crp_1",
    kind: "crise",
    titre: "Samedi, 9h — Les barrages",
    texte:
      "L'« acte VII » a commencé à l'aube. Péages ouverts de force, dépôts pétroliers bloqués, et pour la première fois, des groupes qui montent vers les beaux quartiers de la capitale. Mazeau propose d'interdire la manifestation. Ternay, sobre : « L'interdiction ne tiendra pas. Nous n'avons pas les effectifs. »",
    choices: [
      {
        id: "interdire",
        label: "Interdire la manifestation",
        effects: (c) => {
          c.adj({ hidden: { agitation: 6 } });
          c.flag("crp_interdit");
          return "L'interdiction est publiée à 11h. À 14h, cent mille personnes manifestent quand même — l'interdiction a seulement retiré les organisateurs et laissé la foule. Ternay avait raison. Il ne le dira pas.";
        },
      },
      {
        id: "encadrer",
        label: "Encadrer sans interdire",
        effects: (c) => {
          c.adj({ hidden: { agitation: 2 } });
          return "Le cortège est canalisé, à distance. La journée sera longue mais lisible. Vous avez choisi de tenir la digue plutôt que de la déplacer — c'est le genre de choix qu'on ne peut évaluer qu'à minuit.";
        },
      },
    ],
  },
  {
    id: "crp_2",
    kind: "crise",
    titre: "Samedi, 16h — L'image",
    texte:
      "Une charge a mal tourné boulevard Berthelot. Une femme de 74 ans, venue « voir », est au sol, le visage en sang — le cliché est déjà l'image de la journée, peut-être de l'année. Les chaînes le passent en boucle. Dans la salle de crise, quelqu'un propose de « contextualiser ». Roze le foudroie du regard.",
    choices: [
      {
        id: "hopital",
        label: "Aller à l'hôpital, ce soir",
        effects: (c) => {
          c.adj({ power: { popularite: 2 }, hidden: { agitation: -4, fatigue: 5 } });
          c.flag("crp_hopital");
          return "Vous êtes au chevet à 21h, sans caméras — elles l'apprendront quand même, c'est le principe du sans-caméras réussi. La famille vous reçoit avec froideur et vous raccompagne avec autre chose. La nuit sera moins pire que prévu.";
        },
      },
      {
        id: "defendre_police",
        label: "Défendre les forces de l'ordre",
        effects: (c) => {
          c.adj({ hidden: { agitation: 8 }, country: { cohesion: -3 } });
          c.flag("crp_durci");
          return "« Les forces de l'ordre font face à une violence inédite » — le communiqué est exact et sonne faux à côté de l'image. Ce soir, le visage en sang de Berthelot a un nom, une pétition et deux millions de partages. La colère a trouvé sa sainte.";
        },
      },
    ],
  },
  {
    id: "crp_3",
    kind: "crise",
    titre: "Dimanche, 11h — La cellule de crise",
    texte:
      "Bilan de la nuit : deux préfectures attaquées, un péage incendié, quatre-vingts blessés dont vingt côté forces de l'ordre. Mazeau parle de « quasi-insurrection » et demande l'état d'urgence. Ternay, chiffres à l'appui, décrit un mouvement épuisé qui joue son va-tout. Deux lectures. Une décision.",
    choices: [
      {
        id: "etat_urgence",
        label: "Décréter l'état d'urgence",
        detail: "L'outil est efficace. Il est aussi une porte.",
        effects: (c) => {
          c.derive(2);
          c.adj({ hidden: { agitation: -8 }, power: { popularite: -3 } });
          c.flag("etat_urgence");
          c.sched("etat_urgence_prolongation", 2, 4, 0.8);
          return "L'état d'urgence est décrété à midi. Les samedis suivants sont contenus, les interpellations préventives pleuvent. L'ordre revient — avec des pouvoirs d'exception qui, l'expérience le montre, votent rarement leur propre abrogation.";
        },
      },
      {
        id: "tenir_droit",
        label: "Tenir dans le droit commun",
        effects: (c) => {
          c.adj({ hidden: { agitation: 3 }, power: { popularite: -2 } });
          return "Pas d'état d'urgence : le droit commun, ses lenteurs, sa légitimité. Mazeau sort de la réunion en laissant sa moue parler aux journalistes. Si le samedi prochain dérape, ce refus vous sera facturé. S'il tient, personne ne vous en créditera. Vous signez quand même.";
        },
      },
      {
        id: "annonces",
        label: "Parler au pays ce soir, avec du concret",
        effects: (c) => {
          c.adj({ country: { marge: -6 }, hidden: { agitation: -10 }, power: { popularite: 3 } });
          c.flag("crp_cheque");
          return "Allocution à 20h : prime exceptionnelle, gel des tarifs, indexation partielle. Dix milliards en treize minutes — Danglade, dans le fond de la salle, vieillit à vue d'œil. La rue reflue dès le samedi suivant. La facture, elle, ne refluera pas.";
        },
      },
    ],
  },
  {
    id: "crp_4",
    kind: "crise",
    titre: "Le samedi d'après",
    texte:
      "Le mouvement décroît — épuisement, division, ou apaisement, selon le plateau. Il laisse un pays strié de ronds-points désertés et de rancunes pleines. Maryse Cottin, la voix du mouvement, annonce « une suite politique ». Il reste un dernier choix : que faire de ce qui vient de se passer ?",
    choices: [
      {
        id: "grand_debat",
        label: "Lancer une grande consultation nationale",
        effects: (c) => {
          c.adj({ hidden: { agitation: -5, fatigue: 8 }, power: { popularite: 3 } });
          c.flag("rp_survenu");
          c.flag("grand_debat");
          c.log("Après la crise des Ronds-Points, vous avez sillonné le pays en consultation.");
          return "Trois mois de réunions en gymnases, des cahiers de doléances, vous en chemise devant des salles pas acquises. L'exercice est physiquement épuisant et politiquement fécond : la colère a trouvé une table. Ce qu'on en fera — c'est la question qui décidera si c'était une réponse ou un sas.";
        },
      },
      {
        id: "tourner_page",
        label: "Tourner la page, vite",
        effects: (c) => {
          c.adj({ hidden: { agitation: 2 } });
          c.flag("rp_survenu");
          c.flag("figure_rp");
          c.log("La crise des Ronds-Points s'est éteinte sans réponse politique. Maryse Cottin, elle, est restée.");
          return "Pas de suite, pas de bilan : l'agenda reprend, comme on remet un couvercle. Maryse Cottin annonce la création de son mouvement le mois suivant, depuis son rond-point, « là où on nous a laissés ». Les couvercles, en politique, ont une durée de garantie limitée.";
        },
      },
    ],
  },
  // =========================================================================
  // CRISE : SAINT-VIGOR
  // =========================================================================
  {
    id: "cvg_1",
    kind: "crise",
    titre: "Jour 1, 11h04 — Niveau 5",
    texte:
      "L'accident est classé niveau 5 : rejet radioactif limité mais réel, vent de sud-ouest. Le nuage — le mot est lâché sur toutes les chaînes — dérive vers trois départements. Les modèles de dispersion divergent. Les pharmacies sont déjà vides de comprimés d'iode. L'exploitant parle de « situation en voie de stabilisation ». Il parlait déjà ainsi à 4h du matin.",
    choices: [
      {
        id: "evacuation_large",
        label: "Évacuer large, tout de suite",
        detail: "300 000 personnes. Si c'est pour rien, vous êtes fini. Si c'est justifié, ils sont vivants.",
        effects: (c) => {
          c.adj({ country: { croissance: -0.5, marge: -8 }, hidden: { agitation: 5 } });
          c.flag("vigor_evacuation_large");
          return "L'ordre part à midi : périmètre de trente kilomètres, trois cent mille personnes, réquisition des cars et des gymnases. C'est la plus grande évacuation de l'histoire du pays. Les images sont terribles et ordonnées. Vous saurez dans six jours si vous êtes Cassandre ou un affolé. Les deux se paient différemment.";
        },
      },
      {
        id: "evacuation_ciblee",
        label: "Périmètre resserré, selon les modèles",
        effects: (c) => {
          const vent = c.rng.chance(0.5);
          if (vent) {
            c.flag("vigor_vent_tourne");
            c.adj({ power: { popularite: -8 }, country: { cohesion: -4 } });
            return "Dix kilomètres, comme disent les modèles médians. À 19h, le vent tourne — les modèles médians n'avaient pas voté pour ça. Deux bourgs hors périmètre reçoivent le panache. Les doses sont « faibles ». Le mot « faible » vient d'entrer dans le vocabulaire de la colère nationale.";
          }
          c.adj({ country: { marge: -3 } });
          return "Dix kilomètres, évacuation propre, vent constant. Le pari des modèles tient. La nuance entre « rigueur scientifique » et « chance » ne sera jamais tranchée — les deux dorment dans le même lit, cette semaine.";
        },
      },
    ],
  },
  {
    id: "cvg_2",
    kind: "crise",
    titre: "Jour 3 — La parole",
    texte: (s) =>
      `Le pays est suspendu aux cartes de dispersion comme à une météo de guerre. Il faut parler. Problème : ${s.flags["vigor_mensonge"] ? "votre communiqué du premier matin — « événement sans conséquence » — repasse en boucle, à charge" : "la parole publique sur le nucléaire n'a plus de crédit d'avance, nulle part"}. L'Allemagne ferme sa frontière aux produits frais français. Weiss « comprend l'émotion » — il comprend surtout ses éleveurs.`,
    choices: [
      {
        id: "verite_brute",
        label: "La vérité brute, chiffres et incertitudes",
        effects: (c) => {
          c.adj({ power: { presse: 4, popularite: 2 } });
          c.flag("vigor_parole_tenue");
          return "Vingt minutes d'allocution avec des cartes, des chiffres, et trois fois les mots « nous ne savons pas encore ». C'est la première fois qu'un exécutif traite le pays en adulte sur le nucléaire — l'effet est étrange : la peur reste, la panique décroît. La confiance est un isotope à demi-vie longue ; vous venez d'en réinjecter une dose.";
        },
      },
      {
        id: "rassurer",
        label: "Rassurer d'abord",
        effects: (c) => {
          c.adj({ hidden: { agitation: 3 } });
          c.sched("vigor_dement", 1, 2, 0.7);
          return "« La situation est sous contrôle. » Elle l'est — à 80 %, selon vos propres notes. Les 20 % restants sont désormais une épée au-dessus de chaque phrase. Si un chiffre sort qui contredit le « contrôle », tout l'édifice de parole s'effondrera d'un bloc.";
        },
      },
    ],
  },
  {
    id: "cvg_3",
    kind: "crise",
    titre: "Jour 6 — La zone",
    texte:
      "Le réacteur est stabilisé — froid, mort, sarcophagé de béton pour trente ans. Reste la zone : douze communes dans le périmètre durablement contaminé, dix-huit mille habitants qui ne rentreront pas avant des années. Ils sont dans des gymnases et veulent une réponse qui n'existe pas : « quand ? »",
    choices: [
      {
        id: "indemniser_fort",
        label: "Indemnisation totale, relogement national",
        effects: (c) => {
          c.adj({ country: { marge: -10, cohesion: 3 } });
          c.flag("vigor_indemnise");
          return "L'État reloge, rachète les maisons au prix d'avant, finance les vies recommencées. C'est un budget de guerre — c'en était une, d'un genre nouveau. Dans les gymnases, on ne vous acclame pas : on signe des formulaires. C'est la version administrative de la survie, et vous l'avez au moins rendue digne.";
        },
      },
      {
        id: "indemniser_min",
        label: "Faire porter la charge à l'exploitant",
        effects: (c) => {
          c.adj({ country: { cohesion: -5 }, hidden: { agitation: 5 } });
          c.flag("vigor_abandon");
          return "Juridiquement fondé : l'exploitant est responsable. Pratiquement : ses provisions couvrent un dixième du désastre, ses avocats plaideront dix ans. Les déplacés de Saint-Vigor deviennent un peuple à part, avec ses associations, sa mémoire, sa haine froide. Elle durera plus longtemps que le césium.";
        },
      },
    ],
  },
  {
    id: "cvg_4",
    kind: "crise",
    titre: "Jour 10 — Les comptes",
    texte: (s) =>
      `L'enquête parlementaire commence, et une question la résume : qui savait quoi ? ${s.flags["vigor_alerte_ignoree"] ? "L'ingénieure licenciée témoigne la première. Elle a tout : les courriers, les dates, le silence qui lui a répondu. Son dossier vous est directement opposable." : "Les archives de l'ASN parlent : le rapport, l'arrêté de prolongation, votre signature."} Le pays veut un récit. L'Histoire prendra le sien.`,
    choices: [
      {
        id: "responsabilite",
        label: "Assumer devant la commission",
        detail: "Venir soi-même. Aucun président ne l'a jamais fait.",
        effects: (c) => {
          c.adj({ power: { popularite: -5, justice: 5 }, player: { integrite: 8 } });
          c.log("Après Saint-Vigor, vous avez témoigné en personne devant la commission d'enquête.");
          return "Vous témoignez trois heures, sous serment, sans immunité invoquée. « J'ai prolongé cette centrale. Les éléments d'alerte existaient. Je ne les ai pas assez pesés. » La phrase entre le jour même dans les annales parlementaires. Elle vous coûtera la réélection, peut-être. Elle est la seule qui permette de se raser le matin.";
        },
      },
      {
        id: "systeme",
        label: "Plaider la défaillance systémique",
        effects: (c) => {
          c.adj({ power: { justice: -5 }, player: { integrite: -6 } });
          c.derive(1);
          c.flag("vigor_esquive");
          return "« Une chaîne de défaillances collectives » — l'expression est choisie pour n'avoir pas de sujet. La commission conclura mollement, les tribunaux prendront le relais pour dix ans. Vous avez gagné du temps contre de la vérité. Le taux de change de cette opération n'est jamais affiché à l'avance.";
        },
      },
    ],
  },
  {
    id: "vigor_dement",
    kind: "crise",
    titre: "Le chiffre qui contredit",
    texte:
      "Un laboratoire indépendant publie des relevés supérieurs aux chiffres officiels dans deux communes. L'écart est réel, l'explication technique existe — capteurs, granularité — mais elle tient en trois paragraphes et la colère en trois mots : « ILS MENTAIENT ENCORE ».",
    choices: [
      {
        id: "reconnaitre_ecart",
        label: "Reconnaître l'écart, publier tout en open data",
        effects: (c) => {
          c.adj({ power: { presse: 2 } });
          return "Tous les relevés bruts, publiés chaque soir, cartes en accès libre. La transparence tardive répare ce qu'elle peut. Les données deviennent publiques ; le doute, lui, a pris sa carte de résident.";
        },
      },
      {
        id: "contester",
        label: "Contester la méthodologie du laboratoire",
        effects: (c) => {
          c.adj({ power: { presse: -5, popularite: -4 } });
          return "La bataille d'experts s'engage — c'est la pire configuration : le public tranche toujours contre celui qui a le pouvoir. « Ils attaquent ceux qui mesurent », résume Ferrand. Sept mots. Imparables.";
        },
      },
    ],
  },
  // =========================================================================
  // CRISE : LE 14 NOVEMBRE (attentat)
  // =========================================================================
  {
    id: "cat_1",
    kind: "crise",
    titre: "21h47 — La nuit",
    texte:
      "Trois attaques coordonnées : un marché de nuit, une salle de concert, une brasserie. Le bilan monte d'heure en heure — il dépassera soixante morts. Un assaillant est retranché avec des otages dans la salle. Le pays regarde les bandeaux d'information défiler en tremblant. La cellule de crise attend un seul mot : le vôtre.",
    choices: [
      {
        id: "assaut",
        label: "Donner l'assaut",
        effects: (c) => {
          const propre = c.rng.chance(0.65);
          if (propre) {
            c.flag("cat_assaut_reussi");
            return "0h17 : l'assaut. Quatre minutes. L'assaillant est neutralisé, les otages sont vivants — tous. Le chef du RAID ressort le visage fermé de ceux qui ont vu le fil tenir. Cette nuit a trouvé son seul moment de lumière.";
          }
          c.flag("cat_assaut_drame");
          return "0h17 : l'assaut. L'assaillant déclenche sa charge à l'entrée des colonnes. Deux otages et un opérateur tombent avec lui. C'était probablement inévitable. « Probablement » est un mot avec lequel vous allez vivre longtemps.";
        },
      },
      {
        id: "negocier_cat",
        label: "Gagner du temps, négocier",
        effects: (c) => {
          const tient = c.rng.chance(0.4);
          if (tient) {
            c.flag("cat_negocie");
            return "Quatre heures de contact, une reddition à 2h40 — rarissime, précieuse : un assaillant vivant, c'est une filière entière qui parle. Les familles des victimes y verront un marchandage. Le renseignement y verra de l'or. Les deux regards sont justes.";
          }
          c.flag("cat_assaut_drame");
          return "La négociation s'étire, puis bascule : détonation à 1h50. L'assaillant a choisi sa fin et emporté un otage. On vous reprochera d'avoir attendu ; on vous aurait reproché de ne pas attendre. Cette nuit ne distribuait pas de bonnes décisions — seulement des comptes à rendre.";
        },
      },
    ],
  },
  {
    id: "cat_2",
    kind: "crise",
    titre: "Jour 1, 8h — Le pays debout",
    texte:
      "Le matin d'après. Les fleurs s'accumulent sur trois trottoirs. Le pays oscille entre sidération et rage. Tout le monde attend l'allocution — et derrière elle, la réponse politique. Mazeau a déjà « son » texte : état d'urgence, perquisitions administratives, fermetures de lieux. Alberti, du Conseil constitutionnel, a demandé à vous parler « avant toute chose ». C'est inhabituel. C'est un avertissement.",
    choices: [
      {
        id: "urgence_cat",
        label: "État d'urgence immédiat",
        effects: (c) => {
          c.derive(1);
          c.flag("etat_urgence");
          c.adj({ power: { popularite: 6 }, hidden: { agitation: -3 } });
          c.sched("etat_urgence_prolongation", 2, 4, 0.8);
          return "L'état d'urgence est décrété avant midi, voté à la quasi-unanimité dans la semaine — les parlements votent toujours la peur à main levée. Les perquisitions commencent la nuit même. L'immense majorité visera juste. Les autres fabriqueront, en silence, des ennemis pour dans dix ans.";
        },
      },
      {
        id: "droit_cat",
        label: "Répondre dans le droit commun, durement",
        effects: (c) => {
          c.adj({ power: { popularite: -4 } });
          c.rel("mazeau", { rancune: 8 });
          c.flag("cat_droit_commun");
          return "Moyens massifs, juges antiterroristes renforcés, pas d'exception. Alberti vous appelle le soir — deux mots : « Merci. Tenez. » Mazeau, en conseil, range son texte avec la lenteur de qui le ressortira. La moitié du pays vous trouve faible. L'autre moitié ne le dit pas encore.";
        },
      },
    ],
  },
  {
    id: "cat_3",
    kind: "crise",
    titre: "Jour 2 — L'hommage",
    texte:
      "L'hommage national se prépare. Protocole, familles, retransmission. Une question de mots, qui n'est jamais que de mots : que dire à un pays blessé ? Roze a préparé trois architectures de discours. Vous n'en garderez qu'une.",
    choices: [
      {
        id: "unite_cat",
        label: "L'unité — « Ils voulaient nous diviser »",
        effects: (c) => {
          c.adj({ country: { cohesion: 5 }, power: { popularite: 3 } });
          c.log("Votre discours d'hommage après le 14 novembre a marqué : l'unité contre la division.");
          return "Le discours refuse la vengeance et nomme la cible réelle : le lien entre les Français. « Ils ont visé notre joie parce qu'elle est notre force. » La phrase est reprise dans quarante langues. Pour un jour — un seul — le pays est exactement ce que vous avez décrit.";
        },
      },
      {
        id: "guerre_cat",
        label: "La guerre — « Nous les traquerons »",
        effects: (c) => {
          c.adj({ power: { popularite: 5, armee: 5 }, country: { cohesion: -2 } });
          c.rel("verdier", { loyaute: 5, ambition: 5 });
          c.flag("cat_rhetorique_guerre");
          return "Le vocabulaire est martial, la mâchoire aussi. Le pays, qui a besoin d'un bouclier, applaudit. Le mot « guerre » est désormais dans le débat public — les mots de guerre sont des chiens lâchés : ils ne reviennent pas toujours quand on les siffle.";
        },
      },
    ],
  },
  {
    id: "cat_4",
    kind: "crise",
    titre: "Jour 4 — La faille",
    texte:
      "Le rapport interne tombe, sec : l'un des trois assaillants était fiché, suivi, puis « désuivi » huit mois plus tôt — arbitrage de moyens, note de service à l'appui. Quelqu'un a signé cette note. La presse l'aura d'ici une semaine, Ferrand peut-être avant.",
    choices: [
      {
        id: "publier_faille",
        label: "Publier le rapport vous-même",
        effects: (c) => {
          c.adj({ power: { presse: 4, popularite: -3 }, player: { integrite: 5 } });
          return "Vous publiez tout, avec les noms des procédures et pas ceux des hommes, et une réforme du suivi annoncée le même jour. La transparence prend de vitesse le scandale — il reste une colère, mais pas de mensonge à y ajouter. C'est la version la moins toxique d'un désastre.";
        },
      },
      {
        id: "enterrer_faille",
        label: "Classifier le rapport",
        effects: (c) => {
          c.derive(1);
          c.adj({ hidden: { paranoia: 4 } });
          c.rel("ternay", { loyaute: -5 });
          c.sched("cat_faille_fuite", 3, 8, 0.5);
          return "Le rapport part au coffre, tampon rouge. Ternay exécute et note — il note toujours. Les documents classifiés ont ceci de particulier : ils pèsent plus lourd chaque année, et ils ne dorment que d'un œil.";
        },
      },
    ],
  },
  {
    id: "cat_5",
    kind: "crise",
    titre: "Jour 12 — Ce qui reste",
    texte:
      "La vie « normale » reprend, entre guillemets épais. Les terrasses se remplissent par défi. Reste la dernière décision de la séquence : les lieux. La salle de concert, le marché — que deviennent-ils ? Et avec eux, la mémoire de la nuit.",
    choices: [
      {
        id: "memorial",
        label: "Un mémorial national, décidé avec les familles",
        effects: (c) => {
          c.adj({ country: { cohesion: 3 } });
          c.log("Le mémorial du 14 novembre a été conçu avec les familles des victimes.");
          return "Deux ans de travail avec les familles, un lieu sobre, des noms gravés à hauteur d'enfant « pour qu'on apprenne à les lire tôt ». Le jour de l'inauguration, personne ne regarde les officiels. C'est exactement la réussite recherchée.";
        },
      },
      {
        id: "rouvrir",
        label: "Rouvrir, vite — « la vie gagne »",
        effects: (c) => {
          c.adj({ power: { popularite: 2 } });
          return "La salle rouvre en six mois, premier concert à guichets fermés, larmes et rappels. « La vie gagne » — le slogan est juste et publicitaire à la fois, comme souvent. Une partie des familles n'y remettra jamais les pieds. Les deux mémoires coexisteront : celle qui danse et celle qui ne peut pas.";
        },
      },
    ],
  },
  {
    id: "cat_faille_fuite",
    kind: "intrigue",
    titre: "Le rapport fuité",
    once: true,
    weight: 0,
    texte:
      "Louise Ferrand publie le rapport classifié sur la faille du suivi — intégralement, tampon rouge compris. La question n'est plus la faille : c'est la dissimulation. Les familles des victimes annoncent une plainte contre l'État. Certaines vous visaient déjà ; toutes, désormais.",
    choices: [
      {
        id: "assumer_classif",
        label: "Assumer la classification « pour protéger les méthodes »",
        effects: (c) => {
          c.adj({ power: { popularite: -6, justice: -4 } });
          c.derive(1);
          return "L'argument des « méthodes à protéger » existe — il est même en partie vrai. Mais face à des familles en deuil, la raison d'État a le débit de parole d'un coupable. Le procès durera des années. Le mot « dissimulation » est entré dans votre notice biographique, au marbre.";
        },
      },
      {
        id: "pardon_classif",
        label: "Reconnaître l'erreur, rencontrer les familles",
        effects: (c) => {
          c.adj({ power: { popularite: -2 }, player: { integrite: 4 }, hidden: { fatigue: 8 } });
          return "Vous recevez les familles, par petits groupes, sans caméras ni conseillers, des semaines durant. Vous écoutez ce que l'État a raté, famille par famille, prénom par prénom. Rien de politique n'en sort. C'est peut-être la chose la plus présidentielle que vous ayez faite.";
        },
      },
    ],
  },
  // =========================================================================
  // Déclencheurs et suites d'état d'urgence
  // =========================================================================
  {
    id: "attentat_alerte",
    kind: "standard",
    titre: "L'alerte de Ternay",
    once: true,
    weight: (s) => (s.turnCount >= 2 ? 1.2 : 0),
    source: "ternay",
    texte:
      "Ternay demande cinq minutes seul à seul. « Un projet d'attentat d'ampleur. Cellule partiellement identifiée, calendrier inconnu. Pour démanteler maintenant, il me faut des interpellations précoces — juridiquement fragiles. Ou nous continuons la surveillance pour remonter la filière, en acceptant le risque. » Il vous regarde. « C'est votre décision, monsieur le Président. Elle est mauvaise dans les deux cas. »",
    choices: [
      {
        id: "interpeller",
        label: "Interpeller maintenant",
        effects: (c) => {
          const filiere = c.rng.chance(0.5);
          if (filiere) {
            c.adj({ country: { securite: 4 }, power: { justice: -3 } });
            return "Les interpellations tombent à l'aube, la cellule est démantelée. Deux relaxes suivront, faute de preuves « précoces » — les avocats parleront d'arbitraire, ils n'auront pas tort en droit. Le pays ne saura jamais ce qui n'a pas eu lieu. C'est le tarif : les attentats évités n'ont pas de mémorial.";
          }
          c.adj({ power: { justice: -3 } });
          c.sched("crise_attentat_declencheur", 2, 6, 0.4);
          return "Les interpellations ne ramassent que le premier cercle. Le noyau dur, alerté, se disperse et change de calendrier. Ternay resserre la surveillance sur ce qui reste — c'est-à-dire sur des ombres. L'alerte est toujours là, quelque part, décalée.";
        },
      },
      {
        id: "surveiller",
        label: "Continuer la surveillance",
        detail: "Remonter la filière. Accepter le risque.",
        effects: (c) => {
          const succes = c.rng.chance(0.5);
          if (succes) {
            c.adj({ country: { securite: 6, prestige: 2 } });
            c.rel("ternay", { loyaute: 8 });
            return "Six semaines de filature de plus, et le coup de filet remonte jusqu'aux commanditaires, dans trois pays. C'est un succès majeur du renseignement — invisible, comme tous ses succès. Ternay vous adresse un hochement de tête. De sa part, c'est une accolade.";
          }
          c.sched("crise_attentat_declencheur", 1, 4, 0.6);
          return "La filature continue, prometteuse. Puis un silence radio de la cellule — routine, d'après les analystes. Les analystes sont formels à 70 %. Vous apprendrez bientôt ce que valent les 30 % restants.";
        },
      },
    ],
  },
  {
    id: "crise_attentat_declencheur",
    kind: "standard",
    titre: "La nuit du 14 novembre",
    once: true,
    weight: 0,
    texte:
      "Le téléphone sonne à 21h52. La voix de Ternay est méconnaissable de calme : « Attaques multiples en cours. C'est la cellule. Monsieur le Président, il faut descendre en salle de crise. »",
    choices: [
      {
        id: "descendre",
        label: "Descendre",
        effects: (c) => {
          c.crise("crise_attentat");
          return "L'ascenseur du PC Jupiter descend lentement. Vous pensez, absurdement, à la liste des choses prévues demain. Il n'y a plus de demain prévu.";
        },
      },
    ],
  },
  {
    id: "etat_urgence_prolongation",
    kind: "intrigue",
    titre: "La prolongation",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["etat_urgence"],
    texte:
      "L'état d'urgence expire dans trois semaines. Mazeau propose une prolongation « de précaution » — la troisième mesure de ce type devient toujours permanente, l'histoire du droit est formelle. Alberti, depuis le Conseil, fait savoir qu'elle « examinera avec la plus grande attention ». Les défenseurs des libertés comptent les jours. Une partie du pays trouve que c'est très bien comme ça.",
    choices: [
      {
        id: "prolonger",
        label: "Prolonger",
        effects: (c) => {
          c.derive(2);
          c.adj({ country: { securite: 2 }, hidden: { agitation: 2 } });
          c.sched("etat_urgence_permanent", 4, 10, 0.5);
          return "La prolongation passe sans difficulté — c'est précisément ça, le piège : chaque prolongation est plus facile que la précédente. L'exception s'installe dans le paysage, comme un échafaudage qu'on ne remarque plus. Les échafaudages qu'on ne remarque plus deviennent des murs.";
        },
      },
      {
        id: "lever",
        label: "Lever l'état d'urgence",
        effects: (c) => {
          c.derive(-1);
          c.flag("etat_urgence", false);
          c.adj({ power: { popularite: -3 } });
          c.seg("urbains", { soutien: 4 });
          c.log("Vous avez levé l'état d'urgence contre l'avis de votre ministre de l'Intérieur.");
          return "La levée est annoncée sobrement, « parce que l'exception doit rester l'exception ». Mazeau désapprouve en creux, Sallenave en plein. Si un attentat survient demain, cette décision sera votre procès. Vous la prenez quand même. C'est peut-être la définition de la fonction.";
        },
      },
    ],
  },
  {
    id: "etat_urgence_permanent",
    kind: "intrigue",
    titre: "L'exception permanente",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["etat_urgence"],
    texte:
      "Mazeau propose de « sortir de l'état d'urgence par le haut » : transférer ses pouvoirs dans le droit commun. Perquisitions administratives, assignations, fermetures — tout deviendrait ordinaire. « On lève l'état d'urgence ET on garde les outils », résume-t-il, ravi de sa formule. Les professeurs de droit public font des tribunes. Personne ne lit plus les tribunes.",
    choices: [
      {
        id: "droit_commun_urgence",
        label: "Faire passer la loi",
        effects: (c) => {
          c.derive(2);
          c.adj({ country: { securite: 3 } });
          c.seg("urbains", { soutien: -5 });
          c.log("Les pouvoirs d'exception sont entrés dans le droit commun, définitivement.");
          return "La loi passe. L'état d'urgence est levé en grande pompe — sa substance reste, naturalisée. C'est l'opération la plus élégante de la panoplie : personne ne peut dater le jour où l'exception est devenue la règle, puisqu'il y a eu une cérémonie pour dire le contraire.";
        },
      },
      {
        id: "refuser_permanent",
        label: "Refuser : l'exception expire",
        effects: (c) => {
          c.derive(-1);
          c.flag("etat_urgence", false);
          c.rel("mazeau", { rancune: 8, ambition: 5 });
          return "Le texte est enterré, l'état d'urgence expire à sa date. Mazeau, à qui on prête désormais « une ambition nationale », donne une interview sur « le courage qui manque ». Vous venez de fermer une porte que beaucoup, après vous, auraient trouvée commode. C'est le genre de service qu'on rend à des successeurs ingrats.";
        },
      },
    ],
  },
];
