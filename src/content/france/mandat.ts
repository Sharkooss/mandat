import type { Ctx, GameEvent, GameState } from "../../engine/types";

// ---------------------------------------------------------------------------
// Acte IV — les événements du semestre. Le liant entre les intrigues.
// Règle : chaque décision coûte quelque chose à quelqu'un.
// ---------------------------------------------------------------------------

export const EVENTS_MANDAT: GameEvent[] = [
  // --- Budget & Europe ---------------------------------------------------
  {
    id: "loi_finances",
    kind: "standard",
    titre: "La loi de finances",
    source: "danglade",
    weight: (s) => (s.semestre === 2 ? 6 : 0.2),
    texte:
      "Danglade présente le budget avec l'optimisme prudent d'un homme dont la carrière dépend de ses prévisions. Le déficit dérape. Bruxelles a envoyé « une lettre d'observations ». Trois options sur la table, aucune bonne.",
    choices: [
      {
        id: "rigueur",
        label: "Un budget de rigueur",
        detail: "Couper. Bruxelles applaudit, la rue compte.",
        effects: (c) => {
          c.adj({ country: { marge: 8, cohesion: -4, services: -4 }, power: { popularite: -4 }, hidden: { agitation: 6 } });
          c.press("« LE RABOT » — une du Quotidien National, avec votre visage en médaillon", "hostile");
          return "Les coupes passent, ministère par ministère, ligne par ligne. Bruxelles salue « un effort crédible ». Dans les hôpitaux et les commissariats, on affiche la une du Quotidien dans les salles de pause.";
        },
      },
      {
        id: "statuquo",
        label: "Reconduire l'existant",
        detail: "Ne fâcher personne. N'arranger rien.",
        effects: (c) => {
          c.adj({ country: { dette: 1.5 } });
          c.rel("weiss", { loyaute: -4 });
          c.press("« Le budget de l'immobilisme » — Philippe Bec, éditorial", "hostile");
          return "Le budget reconduit tout, n'assume rien. La notation tiendra un an ou deux. Le chancelier Weiss vous glisse en sommet : « La France promet beaucoup, au futur. »";
        },
      },
      {
        id: "relance",
        label: "Un budget de relance",
        detail: "Investir. La dette attendra, pas le pays.",
        effects: (c) => {
          c.adj({ country: { croissance: 0.4, dette: 3, services: 5, marge: -8 }, power: { popularite: 3 } });
          c.rel("weiss", { loyaute: -8 });
          c.sched("agences_notation", 3, 8, 0.5);
          return "Écoles, hôpital, rail : le budget investit franchement. La croissance frémira dans un an. Les agences de notation, elles, ont déjà mis la France « sous surveillance ». Vous entendrez reparler d'elles.";
        },
      },
    ],
  },
  {
    id: "agences_notation",
    kind: "standard",
    titre: "La dégradation",
    once: true,
    weight: 0,
    texte:
      "L'agence a dégradé la note de la France ce matin, à l'ouverture des marchés asiatiques, avec un communiqué de quatre paragraphes que tout le monde cite et que personne n'a lu. Les taux montent. Danglade parle d'une « décision incompréhensible » — son téléphone n'arrête pas de sonner.",
    choices: [
      {
        id: "assumer",
        label: "Assumer le cap",
        effects: (c) => {
          c.adj({ country: { marge: -5 }, power: { popularite: -2 } });
          return "Vous tenez la ligne devant les caméras : « Une agence ne vote pas. » La formule est bonne. Les taux, eux, restent hauts : chaque point de dette coûte désormais un peu plus cher, chaque semestre, en silence.";
        },
      },
      {
        id: "plan",
        label: "Annoncer un plan d'économies",
        effects: (c) => {
          c.adj({ country: { marge: 4, cohesion: -3 }, hidden: { agitation: 4 } });
          return "Le plan d'économies calme les marchés en une semaine. Il faudra maintenant l'appliquer — c'est-à-dire choisir à qui on le fait payer.";
        },
      },
    ],
  },
  {
    id: "sommet_ue",
    kind: "standard",
    titre: "Le sommet européen",
    weight: 1.2,
    texte:
      "Bruxelles, 1h40 du matin, salle sans fenêtres. Le chancelier Weiss propose un compromis : la flexibilité budgétaire que la France demande, contre l'accord commercial que Berlin veut — celui qui inquiète vos agriculteurs.",
    choices: [
      {
        id: "accepter",
        label: "Accepter le compromis",
        effects: (c) => {
          c.adj({ country: { marge: 5, prestige: 2 } });
          c.rel("weiss", { loyaute: 8 });
          c.seg("ruraux", { soutien: -5 });
          c.sched("agriculteurs_blocage", 2, 6, 0.5);
          return "L'accord est signé à 3h20. Vous gagnez de l'air budgétaire pour deux ans. Sur les marchés de votre pays, les éleveurs commencent à faire les comptes de ce que Berlin a obtenu.";
        },
      },
      {
        id: "refuser",
        label: "Bloquer l'accord",
        detail: "Seul contre 26, mais debout.",
        effects: (c) => {
          c.adj({ country: { prestige: -2 }, power: { popularite: 2 } });
          c.rel("weiss", { loyaute: -10 });
          c.seg("ruraux", { soutien: 4 });
          return "Le veto français fait la une en Europe. « Paris s'isole », écrit la presse allemande. Vos agriculteurs vous remercient. Le prochain service que vous demanderez à Weiss coûtera le double.";
        },
      },
    ],
  },
  // --- Services publics & social -----------------------------------------
  {
    id: "hopital_hiver",
    kind: "standard",
    titre: "L'hôpital craque",
    weight: (s) => (s.semestre === 1 ? 4 : 0.5) * (s.country.services < 45 ? 2 : 1),
    texte:
      "Épidémie de grippe, urgences saturées, brancards dans les couloirs filmés au smartphone. Une infirmière de Valenciennes, en larmes, fait deux millions de vues. Le ministre parle de « tension saisonnière ». Personne ne le croit, pas même lui.",
    choices: [
      {
        id: "rallonge",
        label: "Débloquer une rallonge d'urgence",
        detail: "Cher, immédiat, reconductible — c'est le piège.",
        effects: (c) => {
          c.adj({ country: { marge: -6, services: 4 }, power: { popularite: 2 } });
          c.promesse("hopital", "partielle");
          return "Un milliard débloqué « en urgence ». Les couloirs se vident à moitié. L'an prochain, à la même date, la même rallonge sera attendue — les rallonges d'urgence sont l'impôt que le présent lève sur vos budgets futurs.";
        },
      },
      {
        id: "structurel",
        label: "Annoncer une réforme structurelle",
        detail: "Des effets dans trois ans. Des huées maintenant.",
        effects: (c) => {
          c.adj({ country: { services: 1 }, power: { popularite: -3 }, hidden: { agitation: 3 } });
          c.sched("hopital_fruits", 10, 14, 0.6);
          return "Vous refusez la rallonge, vous annoncez la refonte : carte hospitalière, salaires, gouvernance. L'infirmière de Valenciennes vous répond dans la presse : « On meurt maintenant, pas dans trois ans. » Le pays est de son côté. Vous avez peut-être raison quand même.";
        },
      },
      {
        id: "rien",
        label: "Laisser passer l'hiver",
        effects: (c) => {
          c.adj({ country: { services: -4, cohesion: -3 }, hidden: { agitation: 5 } });
          c.rel("belkacem", { rancune: 5 });
          c.press("« L'HIVER DU MÉPRIS » — Le Matin", "hostile");
          return "Mars arrive, l'épidémie reflue, les caméras s'en vont. Il ne reste que les soignants, qui n'oublient pas, et une une de presse qui ressortira à chaque hiver de votre mandat.";
        },
      },
    ],
  },
  {
    id: "hopital_fruits",
    kind: "standard",
    titre: "La réforme porte ses fruits",
    once: true,
    weight: 0,
    texte:
      "Trois ans après la réforme hospitalière, les chiffres tombent : temps d'attente en baisse, postes pourvus, deux CHU cités en exemple à l'étranger. C'est un succès. Il arrive, comme tous les succès structurels, bien après que vous en avez payé le prix politique.",
    choices: [
      {
        id: "ok",
        label: "Savourer discrètement",
        effects: (c) => {
          c.adj({ country: { services: 8 }, power: { popularite: 3 } });
          c.promesse("hopital", "tenue");
          c.log("La réforme de l'hôpital a fini par produire ses effets.");
          return "Vous vous offrez une visite de service hospitalier sans caméras, puis une avec. L'infirmière de Valenciennes refuse de vous serrer la main, mais elle admet, face caméra, que « ça va un peu mieux ». Venant d'elle, c'est un Panthéon.";
        },
      },
    ],
  },
  {
    id: "greve_transports",
    kind: "standard",
    titre: "La grève des transports",
    weight: (s) => 1 + Math.max(0, (s.hidden.agitation - 40) / 20),
    texte:
      "Huitième jour de grève dans les transports. Kervella exige le retrait d'un décret ; Belkacem, elle, demande « un geste » pour rentrer dans le rang sans perdre la face. Les quais sont noirs de monde et les journaux comptent les jours comme un score de match.",
    choices: [
      {
        id: "geste",
        label: "Donner un geste à Belkacem",
        detail: "La réformiste rentre, l'autre s'isole.",
        effects: (c) => {
          c.adj({ country: { marge: -3 }, power: { syndicats: 6 }, hidden: { agitation: -6 } });
          c.rel("belkacem", { loyaute: 8 });
          c.rel("kervella", { rancune: 6 });
          return "Une prime, un calendrier, une porte de sortie honorable : Belkacem signe et rentre. Kervella continue seul une semaine, puis plie. Vous venez de choisir votre syndicat — il faudra continuer à le faire vivre.";
        },
      },
      {
        id: "tenir",
        label: "Tenir sans rien lâcher",
        effects: (c) => {
          c.adj({ power: { popularite: -3, syndicats: -5 }, hidden: { agitation: 5 }, country: { croissance: -0.2 } });
          c.rel("kervella", { rancune: 10 });
          return "Quinze jours de plus. La grève s'effiloche faute de caisses de solidarité. Vous avez « gagné » — c'est-à-dire que tout le monde a perdu, et que Kervella a maintenant une revanche à prendre.";
        },
      },
      {
        id: "requisition",
        label: "Réquisitionner",
        detail: "Légal. Brutal. Efficace. Dangereux.",
        effects: (c) => {
          c.adj({ hidden: { agitation: 8 }, power: { syndicats: -10 }, country: { cohesion: -3 } });
          c.derive(1);
          c.rel("kervella", { rancune: 15 });
          return "Les réquisitions tombent, les trains repartent sous protection. Le droit de grève vient de reculer d'un pas — « temporairement », dit le décret. Les juristes notent la date. Kervella aussi.";
        },
      },
    ],
  },
  {
    id: "agriculteurs_blocage",
    kind: "standard",
    titre: "Les tracteurs",
    weight: (s) => (s.segments["ruraux"].soutien < 35 ? 2.5 : 0.8),
    texte:
      "Les tracteurs sont entrés dans la capitale à l'aube, dans un ordre impeccable qui rend le blocage plus impressionnant encore. Du fumier devant trois ministères. Les Français, embouteillés, les soutiennent à 72 %.",
    choices: [
      {
        id: "enveloppe",
        label: "Ouvrir une enveloppe d'urgence",
        effects: (c) => {
          c.adj({ country: { marge: -4 }, power: { popularite: 2 } });
          c.seg("ruraux", { soutien: 8 });
          return "Quatre cents millions, un guichet simplifié, un ministre envoyé sur un marché au petit matin. Les tracteurs repartent en klaxonnant. La question de fond — des prix qui ne paient pas le travail — repart avec eux, intacte.";
        },
      },
      {
        id: "normes",
        label: "Suspendre des normes environnementales",
        effects: (c) => {
          c.seg("ruraux", { soutien: 10 });
          c.seg("urbains", { soutien: -5 });
          c.adj({ country: { environnement: -4 } });
          return "Le moratoire sur les normes fait rentrer les tracteurs et sortir les urbains diplômés. Dans six mois, un rapport documentera ce que le moratoire a coûté aux nappes phréatiques. Vous l'enterrerez, ou pas.";
        },
      },
      {
        id: "fermete",
        label: "Fermeté",
        detail: "On ne négocie pas sous le fumier.",
        effects: (c) => {
          c.seg("ruraux", { soutien: -8 });
          c.adj({ hidden: { agitation: 6 }, power: { popularite: -3 } });
          return "L'évacuation est propre, la séquence désastreuse : un CRS et un éleveur de 61 ans, face à face devant les caméras. Devinez lequel des deux les Français ont trouvé digne.";
        },
      },
    ],
  },
  {
    id: "taxe_carburant",
    kind: "standard",
    titre: "La taxe carbone de Bercy",
    once: true,
    weight: (s) => (s.turnCount > 2 && !s.flags["rp_survenu"] ? 2 : 0),
    source: "danglade",
    texte:
      "Danglade propose une hausse de la fiscalité carbone : « indolore, six centimes par litre, et Bruxelles adorera ». Sur le papier, c'est de la bonne politique publique. Sur un rond-point de la Creuse, c'est autre chose.",
    choices: [
      {
        id: "adopter",
        label: "Adopter la taxe",
        effects: (c) => {
          c.adj({ country: { marge: 5, environnement: 2 } });
          c.seg("periurbain", { soutien: -6 });
          c.flag("taxe_carburant");
          c.sched("rp_1", 2, 6, 0.5);
          return "La taxe passe en douceur à l'Assemblée. Six centimes. Dans les zones où l'on prend sa voiture pour tout — travailler, soigner, vivre — six centimes, c'est un symbole. Et les symboles, contrairement aux taxes, ne se plafonnent pas.";
        },
      },
      {
        id: "cibler",
        label: "Version ciblée avec compensation",
        detail: "Moins de recettes, moins de colère.",
        effects: (c) => {
          c.adj({ country: { marge: 2, environnement: 1 } });
          return "Taxe réduite, chèque carburant pour les gros rouleurs. Bercy grogne (« usine à gaz »), Bruxelles hausse les épaules, personne ne descend dans la rue. L'histoire ne retient pas les catastrophes évitées — c'est leur seul défaut.";
        },
      },
      {
        id: "refuser",
        label: "Enterrer le projet",
        effects: (c) => {
          c.adj({ country: { environnement: -2 } });
          c.rel("danglade", { loyaute: -5 });
          c.seg("urbains", { soutien: -3 });
          return "Le projet retourne dans un tiroir de Bercy, où il rejoint ses semblables. Les urbains diplômés notent que le climat attendra. Encore.";
        },
      },
    ],
  },
  // --- Sécurité, société --------------------------------------------------
  {
    id: "fait_divers",
    kind: "standard",
    titre: "Le fait divers",
    weight: 1.5,
    source: "mazeau",
    texte:
      "Un fait divers atroce, un suspect multirécidiviste, une France en boucle sur les chaînes d'information. Mazeau arrive avec un projet de loi « fermeté » rédigé — on jurerait qu'il l'avait dans son tiroir. C'est parce qu'il l'avait dans son tiroir.",
    choices: [
      {
        id: "loi",
        label: "Porter la loi Mazeau",
        effects: (c) => {
          c.adj({ country: { securite: 3 }, power: { popularite: 3 } });
          c.seg("pavillonnaires", { soutien: 4 });
          c.seg("quartiers", { soutien: -5 });
          c.rel("mazeau", { loyaute: 6, ambition: 4 });
          c.derive(1);
          return "La loi passe en procédure accélérée, portée par l'émotion. Elle contient, article 14, un élargissement des contrôles que le Conseil constitutionnel laissera passer « en l'espèce ». Mazeau rayonne. Les juristes, moins.";
        },
      },
      {
        id: "refus_emotion",
        label: "Refuser de légiférer sous émotion",
        effects: (c) => {
          c.adj({ power: { popularite: -4 } });
          c.rel("mazeau", { rancune: 5, ambition: 3 });
          c.seg("urbains", { soutien: 3 });
          return "« On ne légifère pas sous le coup de l'émotion. » La phrase est juste, digne — et inaudible. Sallenave vous accuse de « regarder ailleurs pendant que la France a peur ». Mazeau range son texte, pas ses ambitions.";
        },
      },
      {
        id: "moyens",
        label: "Répondre par les moyens, pas par la loi",
        effects: (c) => {
          c.adj({ country: { securite: 2, marge: -3 } });
          c.promesse("police", "partielle");
          return "Pas de loi nouvelle : des postes, des juges, des greffiers. C'est la réponse la plus sérieuse et la moins spectaculaire — autant dire qu'elle ne fera pas la une, et que ses effets arriveront sans prévenir, dans deux ans.";
        },
      },
    ],
  },
  {
    id: "bavure",
    kind: "standard",
    titre: "La vidéo",
    weight: (s) => (s.country.securite < 60 ? 1.6 : 1),
    texte:
      "Une interpellation qui dégénère, un jeune homme au sol, une vidéo de quarante secondes. Le quartier brûle depuis deux nuits. Le syndicat de police exige un soutien « sans réserve ». Le quartier exige justice. Les deux vous regardent.",
    choices: [
      {
        id: "police",
        label: "Soutenir la police « sans réserve »",
        effects: (c) => {
          c.seg("pavillonnaires", { soutien: 3 });
          c.seg("quartiers", { soutien: -8, participation: -5 });
          c.adj({ country: { cohesion: -4 } });
          return "Le soutien est net, le calme revient en une semaine — le calme des quartiers, celui qui ressemble à du silence et n'en est pas. Une génération de plus vient d'apprendre que l'abstention est la seule réponse qu'on attend d'elle.";
        },
      },
      {
        id: "justice",
        label: "Suspendre les agents, saisir la justice",
        effects: (c) => {
          c.seg("quartiers", { soutien: 5, participation: 3 });
          c.seg("pavillonnaires", { soutien: -4 });
          c.adj({ power: { armee: -2 }, country: { cohesion: 2 } });
          c.rel("mazeau", { rancune: 6 });
          return "Suspension immédiate, juge saisi. Le syndicat de police parle de « lâchage » et manifeste en uniforme — ce qui est interdit, ce que personne ne relève. Mazeau vous le fera payer en conseil des ministres, à sa manière : en silence.";
        },
      },
      {
        id: "deux",
        label: "Les deux vérités",
        detail: "Soutien aux forces ET justice indépendante. Le chemin de crête.",
        effects: (c) => {
          c.adj({ player: { rhetorique: 2 }, country: { cohesion: 1 } });
          return "Votre allocution tient les deux bouts avec un soin d'équilibriste. Chaque camp n'en retient que la moitié qui le fâche. C'était peut-être la seule position honnête ; c'est certainement la moins payante.";
        },
      },
    ],
  },
  {
    id: "laicite",
    kind: "standard",
    titre: "La polémique",
    weight: 1.2,
    texte:
      "Une polémique enfle — un règlement intérieur, une photo, un menu de cantine, peu importe : cette semaine, c'est LA question. Les plateaux s'embrasent, chacun vous somme de choisir un camp. Le dossier réel, lui, tient en deux pages préfectorales que personne n'a lues.",
    choices: [
      {
        id: "droit",
        label: "Renvoyer au droit",
        detail: "« La loi est claire, les tribunaux trancheront. »",
        effects: (c) => {
          c.adj({ power: { popularite: -2 } });
          c.seg("urbains", { soutien: 2 });
          return "Position juridique, ton froid. Les deux camps vous accusent de fuir. La polémique meurt en dix jours, comme la précédente, comme la suivante. Vous n'avez rien gagné — mais rien nourri non plus.";
        },
      },
      {
        id: "camp_ordre",
        label: "Prendre le camp de la fermeté",
        effects: (c) => {
          c.seg("pavillonnaires", { soutien: 3 });
          c.seg("ruraux", { soutien: 2 });
          c.seg("quartiers", { soutien: -6 });
          c.adj({ country: { cohesion: -3 } });
          return "Votre déclaration fait la une. Une partie du pays applaudit, une autre encaisse ce qu'elle vit comme une désignation. La polémique s'éteint. Le ressentiment, non — il s'ajoute aux couches précédentes.";
        },
      },
      {
        id: "camp_apaisement",
        label: "Appeler à l'apaisement",
        effects: (c) => {
          c.seg("quartiers", { soutien: 3 });
          c.seg("pavillonnaires", { soutien: -4 });
          return "Votre appel au calme est digne. Sallenave le qualifie de « capitulation douce » et engrange. L'apaisement est la seule marchandise politique qui coûte à celui qui la vend.";
        },
      },
    ],
  },
  {
    id: "outremer_crise",
    kind: "standard",
    titre: "L'outre-mer à bout",
    weight: (s) => (s.flags["outremer"] ? 2.5 : 0.9),
    texte: (s) =>
      `La vie chère a mis une île à l'arrêt : barrages, port bloqué, supermarchés vides. Les prix y sont 40 % plus hauts qu'en métropole et les élus locaux parlent d'« abandon ».${s.flags["outremer"] ? " C'est chez vous. Les pancartes portent votre nom — en créole, et le mot n'est pas tendre." : ""}`,
    choices: [
      {
        id: "avion",
        label: "Prendre l'avion, négocier sur place",
        effects: (c) => {
          c.adj({ hidden: { fatigue: 8 }, country: { cohesion: 3, marge: -3 } });
          c.seg("quartiers", { soutien: 3 });
          if (c.s.flags["outremer"]) c.adj({ power: { popularite: 4 } });
          return "Onze heures de vol, trois jours de négociation, un accord sur les marges de la grande distribution. Le geste compte autant que le texte : vous êtes venu. L'accord tiendra dix-huit mois — c'est déjà ça, et c'est écrit dessus.";
        },
      },
      {
        id: "ministre",
        label: "Envoyer un ministre",
        effects: (c) => {
          c.adj({ country: { cohesion: -2 } });
          if (c.s.flags["outremer"]) {
            c.adj({ power: { popularite: -6 } });
            c.log("Né(e) là-bas, vous avez envoyé un ministre. L'île ne l'a pas oublié.");
          }
          return "Le ministre délégué atterrit, promet une mission, repart. Le barrage principal tient trois semaines de plus. Aux prochaines élections, l'abstention locale battra un record — on l'appellera « le vote silence ».";
        },
      },
    ],
  },
  {
    id: "usine_fermeture",
    kind: "standard",
    titre: "L'usine",
    once: true,
    weight: (s) => (s.flags["cause_sociale"] || s.bio.regionId === "nord" ? 2.5 : 1),
    texte: (s) =>
      `Un équipementier annonce la fermeture de son site historique : 1 200 emplois, une ville entière.${s.bio.regionId === "nord" ? " La ville, c'est la vôtre. Le piquet de grève s'est installé au même endroit qu'il y a trente ans — certains des grévistes vous ont connu enfant." : ""} Le groupe est profitable ; il « rationalise ».`,
    choices: [
      {
        id: "nationaliser",
        label: "Nationaliser temporairement",
        detail: "Coûteux, spectaculaire, juridiquement acrobatique.",
        effects: (c) => {
          c.adj({ country: { marge: -8 }, power: { patronat: -10, popularite: 5 } });
          c.seg("periurbain", { soutien: 8 });
          c.rel("charvet", { rancune: 10 });
          c.sched("usine_bilan", 8, 14, 0.6);
          return "L'État entre au capital « à titre transitoire ». Charvet parle de « soviétisation » sur trois plateaux dans la même journée. Sur le piquet, on pleure. Dans quatre ans, ce site sera un modèle ou un gouffre — vous venez de parier une part du budget sur la réponse.";
        },
      },
      {
        id: "repreneur",
        label: "Chercher un repreneur",
        effects: (c) => {
          const ok = c.rng.chance(0.5);
          if (ok) {
            c.seg("periurbain", { soutien: 4 });
            c.log("Le site industriel a trouvé un repreneur — 700 emplois sauvés sur 1 200.");
            return "Trois mois de banque d'affaires et de nuits blanches : un repreneur allemand conserve 700 postes sur 1 200. Ce n'est pas une victoire, c'est une défaite réduite — mais dans la ville, on sait compter.";
          }
          c.seg("periurbain", { soutien: -6 });
          c.adj({ country: { cohesion: -3 } });
          c.log("L'usine a fermé malgré la recherche de repreneur. La ville ne s'en est pas remise.");
          return "Deux repreneurs se présentent ; les deux dossiers s'effondrent. L'usine ferme un mardi de novembre, sous la pluie, devant les caméras. Quelqu'un a accroché une banderole : « On se souviendra. » Ils se souviendront.";
        },
      },
      {
        id: "accompagner",
        label: "Accompagner la fermeture",
        detail: "Reconversion, formations, indemnités. Le manuel.",
        effects: (c) => {
          c.seg("periurbain", { soutien: -8 });
          c.adj({ country: { marge: -2 } });
          if (c.s.bio.regionId === "nord") {
            c.log("Vous avez laissé fermer l'usine de votre propre ville.");
            c.seg("periurbain", { soutien: -4 });
          }
          return "Cellule de reclassement, contrat de territoire, « accompagnement personnalisé » : tout ce que la République sait faire quand elle a renoncé. Les mots sont propres. Sur le parking de l'usine, quelqu'un brûle un drapeau — pas le drapeau étranger du groupe : le vôtre.";
        },
      },
    ],
  },
  {
    id: "usine_bilan",
    kind: "standard",
    titre: "Le bilan de la nationalisation",
    once: true,
    weight: 0,
    texte:
      "Deux ans après la nationalisation « transitoire », la Cour des comptes rend son rapport. Le site a survécu, s'est modernisé — et a coûté trois fois l'estimation initiale. Le rapport emploie quatorze fois le mot « dérive ».",
    choices: [
      {
        id: "assumer",
        label: "Assumer : les emplois sont là",
        effects: (c) => {
          c.adj({ power: { popularite: 2 }, country: { marge: -2 } });
          return "« Douze cents familles vivent. Le reste est de la comptabilité. » La formule claque. La Cour des comptes, dans son style inimitable, note que « la comptabilité, précisément, relève de ses attributions ».";
        },
      },
      {
        id: "revendre",
        label: "Revendre discrètement",
        effects: (c) => {
          c.adj({ country: { marge: 3 } });
          c.seg("periurbain", { soutien: -4 });
          return "La cession se fait un vendredi d'août, au tiers du prix investi. L'acheteur promet de maintenir l'emploi « dans la mesure du possible ». Tout le monde sait mesurer ce possible-là.";
        },
      },
    ],
  },
  // --- Monde --------------------------------------------------------------
  {
    id: "monde_baril",
    kind: "monde",
    titre: "Le baril s'effondre — puis flambe",
    once: true,
    weight: 0.8,
    texte:
      "Une rupture d'oléoduc au Moyen-Orient, deux annonces de l'OPEP, et le baril prend 40 % en six semaines. À la pompe, le litre passe la barre symbolique. Ce n'est pas votre faute. Ce sera votre problème.",
    choices: [
      {
        id: "bouclier",
        label: "Bouclier tarifaire",
        effects: (c) => {
          c.adj({ country: { marge: -7, inflation: -0.5 }, power: { popularite: 3 } });
          return "L'État absorbe la hausse. Des milliards par semestre, silencieusement. Le jour où il faudra retirer le bouclier — car il faudra — la hausse reviendra d'un coup, avec les intérêts de la colère.";
        },
      },
      {
        id: "laisser",
        label: "Laisser les prix monter",
        effects: (c) => {
          c.adj({ country: { inflation: 0.8 }, hidden: { agitation: 7 } });
          c.seg("periurbain", { soutien: -5 });
          if (!c.s.flags["rp_survenu"]) c.sched("rp_1", 1, 4, 0.45);
          return "« Les prix mondiaux sont les prix mondiaux. » Économiquement exact. Politiquement, dans les territoires où la voiture n'est pas un choix, chaque passage à la pompe est désormais un référendum contre vous.";
        },
      },
    ],
  },
  {
    id: "monde_guerre",
    kind: "monde",
    titre: "La guerre des autres",
    once: true,
    weight: 0.7,
    texte:
      "Deux puissances régionales entrent en guerre ouverte à quatre mille kilomètres. Des images terribles, des marchés fébriles, et une question posée à la France, puissance du Conseil de sécurité : que fait-elle ?",
    choices: [
      {
        id: "mediation",
        label: "Proposer la médiation française",
        effects: (c) => {
          c.adj({ country: { prestige: 6 }, hidden: { fatigue: 6 } });
          c.sched("monde_escalade", 4, 12, 0.15);
          c.log("Vous avez porté une médiation internationale dans la guerre des Deux Fleuves.");
          return "Trois sommets, des nuits sans sommeil, un cessez-le-feu fragile qui porte le nom d'une ville française. Il tiendra ce qu'il tiendra ; le carnet diplomatique de la France, lui, vient de se réévaluer.";
        },
      },
      {
        id: "distance",
        label: "Se tenir à distance",
        effects: (c) => {
          c.adj({ country: { prestige: -4 } });
          c.sched("monde_escalade", 4, 12, 0.25);
          return "La France « appelle à la retenue » — le communiqué que l'on rédige quand on a choisi de ne rien faire. D'autres capitales occupent l'espace. On s'en souviendra dans les négociations suivantes.";
        },
      },
      {
        id: "armes",
        label: "Vendre des armes au camp « défensif »",
        effects: (c) => {
          c.adj({ country: { marge: 4, prestige: -2 }, player: { integrite: -4 } });
          c.sched("monde_armes_retour", 6, 16, 0.4);
          c.sched("monde_escalade", 4, 12, 0.3);
          return "Les contrats sont signés dans la discrétion des salons feutrés. L'industrie de défense embauche. Un jour, une photo montrera ce que ces armes ont fait — les photos finissent toujours par arriver.";
        },
      },
    ],
  },
  {
    id: "monde_armes_retour",
    kind: "monde",
    titre: "La photo",
    once: true,
    weight: 0,
    texte:
      "Une ONG publie le rapport : un marché couvert bombardé, et les débris portent les numéros de série des munitions que la France a vendues. La photo fait le tour du monde. Louise Ferrand a le rapport en exclusivité depuis trois jours.",
    choices: [
      {
        id: "assumer",
        label: "Assumer les contrats",
        effects: (c) => {
          c.adj({ country: { prestige: -5 }, player: { integrite: -3 } });
          c.seg("urbains", { soutien: -4 });
          return "« La France respecte le droit des conflits armés. » Le porte-parole tient la ligne, blême. Les contrats continuent. La photo, elle, est entrée dans les manuels — avec la mention de votre mandat.";
        },
      },
      {
        id: "suspendre",
        label: "Suspendre les livraisons",
        effects: (c) => {
          c.adj({ country: { marge: -3, prestige: 2 } });
          c.rel("charvet", { rancune: 5 });
          return "La suspension est annoncée sobrement. L'industrie de défense encaisse et le fait savoir. C'était la décision la moins mauvaise — catégorie dont votre mandat commence à faire collection.";
        },
      },
    ],
  },
  {
    id: "monde_pandemie",
    kind: "monde",
    titre: "L'alerte sanitaire",
    once: true,
    weight: 0.5,
    texte:
      "Un virus respiratoire circule en Asie du Sud-Est. L'OMS parle de « préoccupation ». Vos services parlent de « scénarios ». Le stock stratégique de masques a été réduit il y a quatre ans par souci d'économie — pas par vous, mais qui s'en souciera ?",
    choices: [
      {
        id: "preparer",
        label: "Préparer le pays en silence",
        detail: "Stocks, lits, protocoles. Cher, invisible.",
        effects: (c) => {
          c.adj({ country: { marge: -4 } });
          c.flag("pandemie_preparee");
          return "Commandes de masques, plans de continuité, exercices dans les hôpitaux. Si la vague n'arrive pas, ces milliards seront moqués comme « la précaution la plus chère de l'histoire ». Si elle arrive, personne ne vous remerciera non plus — on ne remercie jamais pour les catastrophes évitées.";
        },
      },
      {
        id: "attendre",
        label: "Attendre les données",
        effects: (c) => {
          c.flag("pandemie_ignoree");
          c.sched("crise_pandemie_declencheur", 2, 8, 0.3);
          return "« Pas de panique, de la vigilance. » C'est raisonnable. C'est ce qu'on dit toujours juste avant — ou juste pour rien. Vous le saurez dans quelques mois.";
        },
      },
    ],
  },
  {
    id: "crise_pandemie_declencheur",
    kind: "monde",
    titre: "Le premier cluster",
    once: true,
    weight: 0,
    texte:
      "Trente-sept cas dans une vallée alpine, un hôpital local débordé en quatre jours. Le virus est là. Les modèles de vos épidémiologistes divergent d'un facteur cent — l'information n'a jamais été aussi mauvaise, ni les décisions aussi lourdes.",
    choices: [
      {
        id: "durcir",
        label: "Mesures dures immédiates",
        effects: (c) => {
          c.adj({ country: { croissance: -1.5, cohesion: -2 }, power: { popularite: -4 }, hidden: { agitation: 4 } });
          c.log("Vous avez confiné tôt, contre l'avis de la moitié du conseil scientifique.");
          return "Restrictions immédiates, économie à l'arrêt partiel. Dans trois mois, soit on vous accusera d'avoir cassé l'économie « pour une grippe », soit les courbes des voisins parleront pour vous. Vous avez choisi sans savoir. C'est le métier.";
        },
      },
      {
        id: "cibler",
        label: "Endiguement ciblé",
        effects: (c) => {
          const grave = !c.s.flags["pandemie_preparee"] && c.rng.chance(0.5);
          if (grave) {
            c.adj({ country: { cohesion: -6, services: -8 }, power: { popularite: -8 }, hidden: { agitation: 8 } });
            c.log("L'endiguement ciblé a échoué ; l'épidémie a submergé les hôpitaux.");
            return "Trois semaines plus tard, la digue cède. Les images d'hôpitaux saturés que vous vouliez éviter arrivent — avec, en plus, le procès de la « semaine perdue ». L'Histoire jugera sur les courbes ; la presse juge dès ce soir.";
          }
          c.adj({ country: { croissance: -0.4 } });
          c.log("L'endiguement ciblé a tenu ; l'épidémie est restée contenue.");
          return "Isolement des clusters, tests massifs, frontières filtrées. La vague reste contenue — de justesse, et en partie par chance. La chance est une politique publique dont il ne faut jamais parler.";
        },
      },
    ],
  },
  // --- Perso --------------------------------------------------------------
  {
    id: "usines_bilan",
    kind: "standard",
    titre: "Le bilan des 100 usines",
    once: true,
    weight: 0,
    texte:
      "Deux ans après le lancement du plan de réindustrialisation, la Cour des comptes et la presse font les comptes ensemble, ce qui n'arrive jamais par hasard : 38 usines ouvertes, 51 « en projet », 11 subventionnées puis fermées. Le verre est aux deux tiers vide ou aux deux tiers plein, selon la chaîne.",
    choices: [
      {
        id: "inaugurer",
        label: "Inaugurer les 38, une par une",
        effects: (c) => {
          c.promesse("usines", "tenue");
          c.seg("periurbain", { soutien: 4 });
          c.adj({ hidden: { fatigue: 6 } });
          return "Trente-huit rubans coupés en dix-huit mois — un marathon d'inaugurations en terre industrielle. Les 38 sont réelles, avec de vrais bulletins de salaire. Ce n'est pas 100. C'est infiniment plus que zéro, et les territoires concernés font très bien la différence.";
        },
      },
      {
        id: "reconnaitre_usines",
        label: "Reconnaître l'écart et recalibrer",
        effects: (c) => {
          c.promesse("usines", "partielle");
          c.adj({ player: { integrite: 3 } });
          return "« L'objectif de 100 ne sera pas tenu dans le mandat. Voici pourquoi, et voici la suite. » L'honnêteté comptable désarçonne — on vous soupçonne d'une stratégie. C'en est une : la vérité a l'avantage tactique d'être invérifiable à charge.";
        },
      },
    ],
  },
  {
    id: "bensalah_diner",
    kind: "perso",
    titre: "Karim",
    weight: (s) => (s.turnCount > 4 ? 0.9 : 0.2),
    texte:
      "Karim Bensalah a réussi à obtenir un dîner — il a fallu trois semaines et deux annulations. Il vous regarde manger, puis pose sa fourchette : « T'es devenu qui, exactement ? Je demande pour un ami. L'ami, c'est toi, il y a vingt ans. »",
    choices: [
      {
        id: "ecouter",
        label: "L'écouter jusqu'au bout",
        effects: (c) => {
          c.adj({ hidden: { fatigue: -5, paranoia: -5 }, player: { integrite: 2 } });
          c.rel("bensalah", { loyaute: 5 });
          return "Il parle une heure. Du quartier, de votre mère, de la fois où vous aviez juré de « ne jamais devenir comme eux ». Vous ne répondez presque rien. En sortant, vous annulez une réunion pour marcher dix minutes seul. Ça n'était pas arrivé depuis des mois.";
        },
      },
      {
        id: "esquiver",
        label: "Plaisanter, changer de sujet",
        effects: (c) => {
          c.rel("bensalah", { loyaute: -10 });
          c.adj({ player: { cynisme: 2 } });
          return "Vous faites de l'esprit, il fait semblant de rire. Le dîner finit tôt. Dans la voiture, vous réalisez que vous venez de traiter votre plus vieil ami comme un journaliste. Il ne redemandera pas de dîner avant longtemps.";
        },
      },
    ],
  },
  {
    id: "conjoint_tribune",
    kind: "perso",
    titre: "La tribune",
    once: true,
    weight: (s) => (s.turnCount > 5 ? 1 : 0),
    texte: (s) =>
      `${s.bio.conjointPrenom} veut publier une tribune dans la presse — sur son terrain professionnel, signée de son nom. C'est brillant, c'est légitime, et deux passages contredisent frontalement la ligne de votre gouvernement. Roze a déjà préparé trois éléments de langage et un ulcère.`,
    choices: [
      {
        id: "soutenir",
        label: "« Publie-la. »",
        effects: (c) => {
          c.rel("conjoint", { loyaute: 10 });
          c.adj({ power: { popularite: -2 } });
          c.press("« Désaccord au sommet ? La tribune qui embarrasse l'Élysée » — L'Observateur", "neutre");
          return "La tribune paraît, brillante. Trois jours de gloses sur « la cacophonie au sommet de l'État ». Au dîner, ce soir-là, on vous sourit vraiment. Vous aviez oublié le prix de ce sourire-là. Il est raisonnable.";
        },
      },
      {
        id: "amender",
        label: "Demander d'adoucir deux passages",
        effects: (c) => {
          c.rel("conjoint", { loyaute: -8 });
          return "Les passages sont réécrits, la tribune paraît, affadie. Personne ne la commente. « Tu m'as corrigée comme un communiqué », dit simplement la personne qui partage votre vie. La phrase reste plantée là où elle a été posée.";
        },
      },
      {
        id: "bloquer",
        label: "Demander de renoncer",
        effects: (c) => {
          c.rel("conjoint", { loyaute: -15, rancune: 10 });
          c.adj({ hidden: { fatigue: 3 } });
          return "Vous invoquez « le moment », « le contexte », « la meute ». La tribune ne paraîtra pas. Le silence à la maison dure neuf jours. Quelque chose vient de se fermer, sans bruit, comme une porte bien huilée.";
        },
      },
    ],
  },
  {
    id: "sondage_absurde",
    kind: "standard",
    titre: "Le sondage du dimanche",
    weight: 0.7,
    texte:
      "Un institut publie : « 61 % des Français pensent que vous ne pensez pas ce que vous dites, mais 54 % pensent que vous le dites bien. » Philippe Bec y consacre son éditorial, intitulé « Le paradoxe du sincère menteur ». Votre équipe se demande s'il faut répondre.",
    choices: [
      {
        id: "rire",
        label: "En rire publiquement",
        effects: (c) => {
          c.adj({ player: { charisme: 2 } });
          return "« J'attends le sondage sur les sondages. » La petite phrase amuse, y compris Bec, qui la cite en la déplorant. Une journée de gagnée sur le vide — c'est déjà une victoire.";
        },
      },
      {
        id: "ignorer",
        label: "Ignorer",
        effects: () =>
          "Le sondage vit sa vie de sondage : une journée de plateaux, puis l'oubli. Vous avez utilisé ce temps pour travailler. Personne ne l'a remarqué — c'est le principe.",
      },
    ],
  },
];
