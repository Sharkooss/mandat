import type { Choice, GameEvent, GameState } from "../../engine/types";
import { CAST, CAST_TAGS } from "./data";

// ---------------------------------------------------------------------------
// Les décisions qui portent sur des personnes. Ce sont elles qui transforment
// un casting en souvenirs : on désigne un coupable, on choisit un successeur,
// on sacrifie un fidèle — et quelqu'un s'en souvient très longtemps.
// ---------------------------------------------------------------------------

const nom = (id: string) => CAST.find((c) => c.id === id)?.nom ?? id;
const fonction = (id: string) => CAST_TAGS[id] ?? CAST.find((c) => c.id === id)?.role ?? "";

/** Les ministres qu'on peut jeter en pâture. */
function sacrifiables(s: GameState): string[] {
  return ["mazeau", "danglade", "rochefort", "delval", "roze", "espitalier"].filter(
    (id) => s.characters[id]?.vivant && s.characters[id]?.enPoste
  );
}

/** Construit un choix « désigner untel » pour l'événement du bouc émissaire. */
function choixBouc(id: string): Choice {
  return {
    id: `bouc_${id}`,
    label: `Désigner ${nom(id)}`,
    detail: `${fonction(id)} — loyauté et rancune évolueront en conséquence.`,
    effects: (c) => {
      const st = c.s.characters[id];
      st.enPoste = false;
      c.rel(id, { loyaute: -35, rancune: 40 });
      c.adj({ power: { popularite: 5 }, player: { integrite: -4, cynisme: 4 } });
      c.flag("bouc_emissaire", id);
      c.sched("vengeance_bouc", 3, 8, 0.55);
      c.log(`Vous avez livré ${nom(id)} à l'opinion pour éteindre un scandale.`);
      const proche = c.s.characters[id].loyaute < 20 && ["roze", "rochefort"].includes(id);
      return `La conférence de presse est un exercice de cruauté administrative : on annonce un départ « d'un commun accord », on remercie pour « les services rendus », on passe à la question suivante. ${nom(id)} encaisse sans un mot devant les caméras. ${
        proche
          ? "C'était l'une des rares personnes de cette maison à vous dire la vérité. Vous venez de la renvoyer pour avoir fait son travail."
          : "Le scandale s'éteint en quatre jours. La rancune, elle, ne s'éteint pas : elle attend."
      }`;
    },
  };
}

export const EVENTS_PERSONNAGES: GameEvent[] = [
  // =========================================================================
  // Le bouc émissaire
  // =========================================================================
  {
    id: "bouc_emissaire",
    kind: "intrigue",
    titre: "Il faut un coupable",
    rarete: "rare",
    once: true,
    weight: (s) => (s.turnCount >= 2 && s.power.popularite < 48 ? 2.2 : 0.6),
    texte:
      "Un rapport accablant sur un marché public fuite dans la presse. Les faits sont réels, la responsabilité collective, et le pays veut un nom. Camille Roze est formelle : « Sans démission d'ici quarante-huit heures, c'est vous qui portez l'affaire. » Autour de la table, chacun regarde ses chaussures.",
    choices: [
      {
        id: "personne",
        label: "Ne sacrifier personne",
        detail: "Assumer collectivement. Coûteux, et rare.",
        effects: (c) => {
          c.adj({ power: { popularite: -8, presse: -4 }, player: { integrite: 8 } });
          for (const id of sacrifiables(c.s)) c.rel(id, { loyaute: 12 });
          c.log("Vous avez refusé de livrer un ministre à l'opinion.");
          return "« La responsabilité est gouvernementale, donc présidentielle. Personne ne partira. » La presse parle d'entêtement, l'opposition de protection. Mais autour de la table, quelque chose change : on vient de comprendre qu'on ne sera pas lâché. C'est le genre de capital qui ne se mesure dans aucun sondage et qui décide des trahisons futures.";
        },
      },
    ],
    dynamicChoices: (s) => sacrifiables(s).map(choixBouc),
  },
  {
    id: "vengeance_bouc",
    kind: "intrigue",
    titre: "Le sacrifié parle",
    once: true,
    weight: 0,
    texte: (s) => {
      const id = (s.flags["bouc_emissaire"] as string) ?? "mazeau";
      return `${nom(id)}, qu'on avait prié de partir « d'un commun accord », a accordé un entretien de trois heures à Louise Ferrand. La personne sait tout des arbitrages, des notes, des réunions dont il n'existe pas de compte rendu. Le premier volet paraît demain.`;
    },
    choices: [
      {
        id: "negocier",
        label: "Négocier son silence",
        detail: "Un poste, une ambassade, une présidence d'agence.",
        effects: (c) => {
          const id = (c.s.flags["bouc_emissaire"] as string) ?? "mazeau";
          c.rel(id, { rancune: -25, loyaute: 10 });
          c.adj({ player: { integrite: -6 }, power: { popularite: -2 } });
          c.derive(1);
          return "Un déjeuner discret, une inspection générale à la clé, et l'entretien se réduit à deux paragraphes prudents. Le silence a un prix affiché, et vous venez de le payer sans marchander. Louise Ferrand comprend parfaitement ce qui s'est passé — elle n'a simplement plus de source.";
        },
      },
      {
        id: "affronter",
        label: "Laisser paraître",
        detail: "Encaisser et tenir.",
        effects: (c) => {
          c.adj({ power: { popularite: -9, presse: -4 } });
          c.flag("memoires_sacrifie");
          c.log("L'ancien ministre sacrifié a déballé le fonctionnement de votre exécutif.");
          return "Les trois volets paraissent. Rien d'illégal, tout de dévastateur : la fabrique quotidienne des décisions, les arbitrages pris à trois dans un couloir, les notes qu'on ne lit pas. Le pays découvre comment il est gouverné et n'aime pas ce qu'il voit. Vous n'avez rien à répondre parce que c'est exact.";
        },
      },
      {
        id: "discrediter",
        label: "Le discréditer",
        detail: "Sortir ce que vous avez sur lui.",
        effects: (c) => {
          const id = (c.s.flags["bouc_emissaire"] as string) ?? "mazeau";
          c.rel(id, { rancune: 25 });
          c.adj({ player: { integrite: -8, cynisme: 5 }, power: { popularite: -3, presse: -6 } });
          c.derive(1);
          return "Des éléments sur ses notes de frais parviennent à trois rédactions le même matin — la simultanéité est une signature. L'entretien perd de sa force, l'auteur de la fuite ne fait de doute pour personne. On ne vous croit plus quand vous parlez de dignité de la vie publique. Vous en aviez encore un peu.";
        },
      },
    ],
  },

  // =========================================================================
  // Le Premier ministre trop brillant
  // =========================================================================
  {
    id: "pm_rival",
    kind: "intrigue",
    titre: "Matignon prend la lumière",
    once: true,
    weight: 0,
    texte: (s) => {
      const id = (s.flags["pm_actuel"] as string) ?? "rochefort";
      return `Votre Premier ministre — ${nom(id)} — vient de dépasser votre cote de popularité de onze points. Les portraits élogieux se multiplient, les déplacements se font sans vous prévenir, et l'entourage de Matignon parle de « pôle de stabilité ». Le compliment est une arme quand il désigne un seul des deux.`;
    },
    choices: [
      {
        id: "laisser_courir",
        label: "Laisser courir",
        detail: "Un PM populaire protège aussi.",
        effects: (c) => {
          const id = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(id, { ambition: 12 });
          c.adj({ power: { popularite: 2 } });
          c.sched("pm_trahison", 3, 8, 0.5);
          return "Vous laissez faire, non sans raison : un chef de gouvernement populaire amortit les chocs et fait passer les réformes. Il grandit, vous respirez. Le calcul est juste tant que la question de la succession ne se pose pas — et cette question se pose toujours plus tôt que prévu.";
        },
      },
      {
        id: "recadrer_pm",
        label: "Le recadrer publiquement",
        detail: "Rappeler qui décide.",
        effects: (c) => {
          const id = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(id, { rancune: 18, loyaute: -12 });
          c.adj({ power: { popularite: -3, parti: -4 } });
          return "« Le Premier ministre met en œuvre la politique que je détermine. » La phrase, prononcée devant la presse, est constitutionnellement irréprochable et humainement humiliante. Matignon encaisse en silence. Les silences de Matignon sont des dossiers en préparation.";
        },
      },
      {
        id: "associer",
        label: "L'associer étroitement",
        detail: "Partager la lumière plutôt que la disputer.",
        effects: (c) => {
          const id = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(id, { loyaute: 15, ambition: -5 });
          c.adj({ power: { popularite: 4, parti: 5 } });
          return "Déplacements communs, arbitrages partagés, communication coordonnée. Le duo fonctionne, et le pays aime voir un exécutif qui ne se déchire pas. Vous perdez un peu de centralité et gagnez une majorité qui tient. Beaucoup de présidents n'ont jamais accepté ce marché.";
        },
      },
    ],
  },
  {
    id: "pm_terne",
    kind: "intrigue",
    titre: "Matignon ne prend pas",
    once: true,
    weight: 0,
    texte:
      "Votre Premier ministre est loyal, travailleur et totalement inaudible. Ses interventions ne font pas trois lignes dans la presse, ses conférences se tiennent devant des salles clairsemées. Un exécutif sans porte-parole crédible, ce sont toutes les critiques qui remontent directement à vous.",
    choices: [
      {
        id: "former",
        label: "Le mettre en avant, l'aider",
        effects: (c) => {
          const id = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(id, { loyaute: 12 });
          c.adj({ power: { popularite: 1 }, hidden: { fatigue: 4 } });
          return "Coaching, interviews préparées, séquences taillées sur mesure. Il progresse — lentement, comme progressent les gens sans instinct politique. Vous y passez du temps que vous n'aviez pas. C'est un investissement, ou une perte sèche : vous le saurez à la prochaine crise.";
        },
      },
      {
        id: "assumer_seul",
        label: "Tout porter soi-même",
        effects: (c) => {
          c.adj({ hidden: { fatigue: 10 }, power: { popularite: 2 } });
          return "Vous montez au front sur chaque dossier. L'exécutif retrouve de la voix — la vôtre, uniquement. Le pays finit par confondre le gouvernement et vous, ce qui est excellent quand tout va bien et catastrophique le reste du temps.";
        },
      },
    ],
  },

  // =========================================================================
  // La trahison — quand rancune et ambition s'alignent
  // =========================================================================
  {
    id: "pm_trahison",
    kind: "intrigue",
    titre: "La candidature de trop",
    once: true,
    weight: 0,
    texte: (s) => {
      const id = (s.flags["pm_actuel"] as string) ?? "rochefort";
      return `${nom(id)} a démissionné ce matin par communiqué, sans vous prévenir, et annoncé dans la foulée « une candidature de rassemblement ». Votre propre Premier ministre part en campagne contre vous, avec cinq ans d'archives gouvernementales dans la tête.`;
    },
    choices: [
      {
        id: "attaquer_traitre",
        label: "L'attaquer sur sa déloyauté",
        effects: (c) => {
          const id = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(id, { rancune: 20 });
          c.adj({ power: { parti: -8 } });
          c.flag("rival_interne", id);
          return "« On ne trahit pas un pays parce qu'on s'ennuie dans ses fonctions. » La formule fait mouche une journée. Puis chacun se souvient que vous l'aviez nommé, promu, défendu — et la déloyauté devient une question de discernement. Le vôtre.";
        },
      },
      {
        id: "bilan_commun",
        label: "Le renvoyer au bilan commun",
        detail: "« Il a signé tout ce qu'il critique. »",
        effects: (c) => {
          c.adj({ player: { strategie: 3 }, power: { parti: -3 } });
          c.flag("rival_interne", (c.s.flags["pm_actuel"] as string) ?? "rochefort");
          return "Vous ressortez, sans un mot plus haut que l'autre, la liste des textes qu'il a défendus, des budgets qu'il a présentés, des arbitrages qu'il a réclamés. C'est la seule riposte qui fonctionne contre un transfuge : lui rendre son propre bilan, intact, avec sa signature dessus.";
        },
      },
    ],
  },

  // =========================================================================
  // Les faveurs et les dettes
  // =========================================================================
  {
    id: "faveur_fidele",
    kind: "perso",
    titre: "Le service qu'on ne refuse pas",
    weight: (s) => (s.turnCount >= 2 ? 1.4 : 0),
    texte:
      "Un fidèle de la première heure demande à vous voir. Pas pour lui : pour son fils, candidat malheureux à un concours administratif, « à trois points, avec un jury qui avait ses têtes ». Il ne demande rien d'explicite. Il raconte, longuement, tout ce qu'il a fait pour vous depuis vingt ans. Il a raison sur les faits.",
    choices: [
      {
        id: "refuser_faveur",
        label: "Refuser, et le dire clairement",
        effects: (c) => {
          c.adj({ player: { integrite: 6 }, power: { parti: -4 } });
          c.rel("bensalah", { loyaute: 4 });
          return "« Je ne peux pas, et tu sais que je ne peux pas. » Il hoche la tête, comprend, et ne vous le pardonnera jamais tout à fait. Dans les fédérations, on dira que vous avez « changé ». C'est le prix ordinaire de l'intégrité : il se paie en amitiés, pas en sondages.";
        },
      },
      {
        id: "coup_fil",
        label: "Passer un coup de fil",
        detail: "Rien d'illégal. Juste un nom prononcé.",
        effects: (c) => {
          c.adj({ player: { integrite: -6, cynisme: 3 }, power: { parti: 5 } });
          c.flag("faveur_accordee");
          c.sched("faveur_retour", 4, 10, 0.35);
          return "Un appel de trois minutes à un directeur d'administration centrale. Vous ne demandez rien, vous « signalez un dossier ». Le concours suivant se passe mieux pour l'intéressé. Personne ne saura — sauf le directeur, le fidèle, son fils, et vous. Cela fait déjà quatre personnes de trop.";
        },
      },
    ],
  },
  {
    id: "faveur_retour",
    kind: "intrigue",
    titre: "Le dossier du concours",
    once: true,
    weight: 0,
    cond: (s) => !!s.flags["faveur_accordee"],
    texte:
      "Une association de candidats évincés a déposé un recours et obtenu les pièces du concours. Le nom d'un directeur d'administration y figure ; le vôtre, nulle part — mais l'intéressé a fait savoir à son entourage qu'il avait « agi sur signalement ». Louise Ferrand vient de lui demander un entretien.",
    choices: [
      {
        id: "couvrir_directeur",
        label: "Couvrir le directeur",
        effects: (c) => {
          c.adj({ power: { justice: -6 }, player: { integrite: -4 } });
          c.derive(1);
          return "Le directeur est promu ailleurs, plus haut, plus loin. Le recours prospère lentement dans un tribunal administratif. La promotion d'un homme au cœur d'un dossier est le genre de détail que les journalistes gardent en réserve pour la prochaine fois.";
        },
      },
      {
        id: "lacher_directeur",
        label: "Le laisser à découvert",
        effects: (c) => {
          c.adj({ power: { popularite: -3 }, player: { integrite: -2 } });
          c.rel("ferrand", { ambition: 6 });
          return "Le directeur tombe seul, avec un communiqué qui rappelle que « nul n'est au-dessus des procédures ». Il ne parle pas. Pas encore. Les gens lâchés se taisent toujours d'abord — c'est ensuite qu'ils écrivent.";
        },
      },
    ],
  },

  // =========================================================================
  // L'ami d'enfance et le conjoint : le vrai coût du pouvoir
  // =========================================================================
  {
    id: "bensalah_service",
    kind: "perso",
    titre: "Karim demande quelque chose",
    once: true,
    weight: (s) => (s.turnCount >= 3 && s.characters["bensalah"].loyaute > 60 ? 1.6 : 0.2),
    texte:
      "Karim Bensalah n'a jamais rien demandé en trente ans. Aujourd'hui, il appelle : son association de quartier perd sa subvention, un dispositif est supprimé, quatre-vingts gamins se retrouvent dehors le mercredi. « Je ne te demande pas un passe-droit. Je te demande de regarder le dossier. C'est tout. »",
    choices: [
      {
        id: "regarder",
        label: "Regarder le dossier",
        detail: "Le faire remonter par la voie normale.",
        effects: (c) => {
          c.rel("bensalah", { loyaute: 6 });
          c.seg("quartiers", { soutien: 3 });
          c.adj({ country: { marge: -1, cohesion: 2 } });
          return "Vous demandez une note. Le dispositif était supprimé pour de mauvaises raisons budgétaires, il est rétabli avec deux autres du même type. Karim ne dit pas merci — il dit : « Voilà. C'était pas compliqué. » C'est le seul retour honnête que vous recevrez ce semestre.";
        },
      },
      {
        id: "deleguer",
        label: "Le renvoyer vers un conseiller",
        effects: (c) => {
          c.rel("bensalah", { loyaute: -14 });
          return "Vous lui donnez le numéro d'un conseiller. Le conseiller donne le numéro d'un chargé de mission. Le chargé de mission répond six semaines plus tard, par courriel type. Karim ne rappellera pas. Vous venez de perdre le dernier interlocuteur qui ne voulait rien de vous.";
        },
      },
    ],
  },
  {
    id: "conjoint_lassitude",
    kind: "perso",
    titre: "La conversation reportée",
    once: true,
    weight: (s) => (s.characters["conjoint"].loyaute < 60 && s.turnCount >= 3 ? 2 : 0.3),
    texte: (s) =>
      `${s.bio.conjointPrenom} vous demande une soirée. Pas un dîner officiel, pas un week-end protocolaire : une soirée, sans téléphone, pour parler « de nous, pas du pays ». Votre agenda du semestre est déjà arbitré à la demi-heure près. La demande a été formulée trois fois depuis un an.`,
    choices: [
      {
        id: "donner_soiree",
        label: "Libérer la soirée",
        detail: "Décaler deux choses importantes.",
        effects: (c) => {
          c.rel("conjoint", { loyaute: 16, rancune: -10 });
          c.adj({ hidden: { fatigue: -6, paranoia: -5 } });
          return "Vous décalez un conseil et une remise de rapport. La soirée est difficile — on ne rattrape pas dix-huit mois en trois heures — mais elle a lieu. À la fin, on vous dit : « Je voulais juste savoir si tu étais encore là. » Vous n'avez pas de réponse toute prête, et c'est mieux ainsi.";
        },
      },
      {
        id: "reporter_encore",
        label: "Reporter — le pays d'abord",
        effects: (c) => {
          c.rel("conjoint", { loyaute: -18, rancune: 12 });
          return "« Après le sommet, promis. » Vous le pensez sincèrement. Après le sommet, il y aura le budget, puis la crise, puis la campagne. On ne vous redemandera plus rien : c'est ainsi que finissent les couples de l'Élysée, non pas dans un éclat mais dans un agenda.";
        },
      },
    ],
  },

  // =========================================================================
  // L'opposition qu'on peut retourner
  // =========================================================================
  {
    id: "andrieu_main_tendue",
    kind: "intrigue",
    titre: "La main tendue de l'opposition",
    once: true,
    weight: (s) => (s.power.sieges < 289 && s.power.sieges > 0 && s.turnCount >= 2 ? 2 : 0.3),
    texte:
      "Claire Andrieu demande un rendez-vous discret. Elle propose un accord de législature : son groupe s'abstient sur les textes budgétaires, en échange de trois amendements majeurs et d'un poste à la commission des finances. C'est une offre honnête. C'est aussi une reconnaissance publique que vous ne pouvez pas gouverner seul.",
    choices: [
      {
        id: "accepter_andrieu",
        label: "Accepter l'accord",
        effects: (c) => {
          c.rel("andrieu", { loyaute: 20, rancune: -10 });
          c.adj({ power: { sieges: 28, parti: -8 }, country: { marge: 3 } });
          c.flag("accord_andrieu");
          c.log("Vous avez conclu un accord de législature avec l'opposition modérée.");
          return "L'accord est annoncé sobrement, et il tient. Vos textes passent sans 49.3, votre majorité respire — et votre propre camp hurle à la trahison, parce qu'un accord avec l'adversaire modéré vaut toujours mieux, pour les militants, qu'une victoire partagée. Claire Andrieu, elle, engrange une stature de femme d'État.";
        },
      },
      {
        id: "refuser_andrieu",
        label: "Refuser",
        detail: "Gouverner seul, au 49.3 s'il le faut.",
        effects: (c) => {
          c.rel("andrieu", { rancune: 12 });
          c.adj({ power: { parti: 5 } });
          return "« La France a élu une majorité, pas une coalition. » Le refus rassure vos troupes et vous condamne à l'article 49 alinéa 3 pour chaque texte difficile. Claire Andrieu sort en souriant : elle vous a offert une porte de sortie, vous l'avez claquée, et elle pourra le raconter longtemps.";
        },
      },
      {
        id: "debaucher",
        label: "Débaucher ses députés un par un",
        detail: "Sans accord, sans contrepartie publique. Sale et efficace.",
        effects: (c) => {
          c.rel("andrieu", { rancune: 25 });
          c.adj({ power: { sieges: 14 }, player: { integrite: -5, cynisme: 5 } });
          return "Circonscriptions promises, rapports budgétaires attribués, dîners individuels : quatorze députés rejoignent la majorité en six semaines. C'est efficace, silencieux, et cela réduit chaque parlementaire concerné à son prix. Claire Andrieu ne vous proposera plus jamais rien.";
        },
      },
    ],
  },

  // =========================================================================
  // Quand la rancune accumulée finit par exploser
  // =========================================================================
  {
    id: "coalition_rancunes",
    kind: "intrigue",
    titre: "Ceux que vous avez blessés",
    once: true,
    weight: (s) => {
      const rancuniers = Object.values(s.characters).filter((c) => c.vivant && c.rancune >= 35).length;
      return rancuniers >= 3 ? 3 : 0;
    },
    texte: (s) => {
      const noms = Object.entries(s.characters)
        .filter(([, c]) => c.vivant && c.rancune >= 35)
        .slice(0, 3)
        .map(([id]) => nom(id));
      return `Un dîner a réuni des gens qui n'ont en commun que vous : ${noms.join(", ")}. Aucun n'a le pouvoir de vous nuire seul. Ensemble, ils ont des dates, des notes, des témoins, et le même intérêt à parler en même temps. Yves Ternay vous en informe sans commentaire — c'est sa façon de commenter.`;
    },
    choices: [
      {
        id: "desamorcer",
        label: "Les désamorcer un par un",
        detail: "Recevoir, écouter, réparer ce qui peut l'être.",
        effects: (c) => {
          for (const [id, st] of Object.entries(c.s.characters)) {
            if (st.rancune >= 35) c.rel(id, { rancune: -20, loyaute: 6 });
          }
          c.adj({ hidden: { fatigue: 8 }, power: { popularite: -1 } });
          c.log("Vous avez repris un par un ceux que vous aviez blessés.");
          return "Six rendez-vous en trois semaines, sans caméras, sans notes. Vous écoutez surtout, vous reconnaissez deux torts réels, vous réparez ce qui est réparable. Ce n'est ni glorieux ni médiatique, et c'est probablement le meilleur usage que vous ayez fait de votre temps depuis un an.";
        },
      },
      {
        id: "surveiller_rancuniers",
        label: "Les faire surveiller",
        effects: (c) => {
          c.derive(2);
          c.adj({ hidden: { paranoia: 12 } });
          c.sched("ferrand_watergate", 4, 10, 0.35);
          return "Ternay accepte du bout des lèvres, en précisant qu'il « ne fera rien d'illégal » — la précision vaut avertissement. Vous saurez désormais qui déjeune avec qui. Vous dormirez plus mal, parce que la surveillance ne rassure jamais : elle fournit chaque semaine de nouvelles raisons d'avoir peur.";
        },
      },
      {
        id: "ignorer_rancuniers",
        label: "Les ignorer",
        detail: "Des aigris n'ont jamais renversé personne.",
        effects: (c) => {
          c.sched("fuite_coordonnee", 3, 7, 0.6);
          return "Vous haussez les épaules : la politique est pleine de gens amers qui dînent ensemble. C'est vrai. C'est vrai jusqu'au jour où l'un d'eux décide que sa carrière est finie de toute façon — et ce jour-là, il n'a plus rien à perdre, ce qui en fait l'homme le plus dangereux de France.";
        },
      },
    ],
  },
  {
    id: "fuite_coordonnee",
    kind: "intrigue",
    titre: "La fuite coordonnée",
    once: true,
    weight: 0,
    texte:
      "Trois rédactions publient le même jour, à la même heure, des documents différents mais convergents : notes internes, relevés de décisions, comptes rendus de réunions qui n'auraient pas dû exister. Ce n'est pas une fuite, c'est une opération. Elle porte la signature de gens qui connaissent la maison.",
    choices: [
      {
        id: "enquete_interne",
        label: "Ordonner une enquête interne",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 10 }, power: { popularite: -5 } });
          c.derive(1);
          return "L'enquête interne empoisonne l'Élysée pendant deux mois : téléphones vérifiés, badges tracés, tout le monde suspect de tout le monde. On ne trouve personne — on ne trouve jamais personne. Ce qu'on trouve, en revanche, c'est un exécutif où plus personne n'ose écrire quoi que ce soit.";
        },
      },
      {
        id: "transparence_fuite",
        label: "Tout publier soi-même",
        detail: "Désamorcer en donnant plus que ce qu'ils ont.",
        effects: (c) => {
          c.adj({ power: { presse: 8, popularite: -3 }, player: { integrite: 6 } });
          c.log("Face à une fuite coordonnée, vous avez tout publié vous-même.");
          return "Vous publiez l'intégralité des notes concernées, y compris celles qui n'avaient pas fuité et qui sont pires. Le coup est stupéfiant : privée de son exclusivité, l'opération s'effondre en quarante-huit heures. Les rédactions saluent, l'opposition s'étrangle, et vos adversaires internes découvrent qu'on ne fait pas chanter quelqu'un qui accepte de tout dire.";
        },
      },
    ],
  },
];
