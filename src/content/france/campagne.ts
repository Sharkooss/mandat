import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Acte III — événements de campagne (tirés certains jours entre les actions).
// ---------------------------------------------------------------------------

export const EVENTS_CAMPAGNE: GameEvent[] = [
  {
    id: "camp_tract",
    kind: "campagne",
    titre: "Le tract mensonger",
    once: true,
    texte:
      "Un tract circule dans trois départements : votre photo, un chiffre inventé, une accusation grossière. Personne ne le signe. Tout le monde sait d'où il vient.",
    choices: [
      {
        id: "ignorer",
        label: "Ignorer",
        detail: "Répondre, c'est amplifier.",
        effects: (c) => {
          c.adj({ player: { endurance: -2 } });
          return "Vous ne répondez pas. Le tract vit sa vie trois jours, puis meurt. Votre équipe fulmine ; vous avez probablement eu raison. Probablement.";
        },
      },
      {
        id: "plainte",
        label: "Porter plainte",
        detail: "La justice tranchera. Dans deux ans.",
        effects: (c) => {
          c.adj({ power: { justice: 2 } });
          c.press("« Le candidat saisit la justice » — L'Écho Républicain", "neutre");
          return "La plainte est déposée, la séquence médiatique est correcte. Le tribunal rendra sa décision bien après l'élection — tout le monde le sait, c'est le geste qui compte.";
        },
      },
      {
        id: "riposte",
        label: "Riposter par un contre-tract",
        detail: "Même arme, même boue.",
        effects: (c) => {
          c.adj({ player: { integrite: -3, cynisme: 3 } });
          if (c.s.campaign) c.s.campaign.opposantScore -= 3;
          return "Votre équipe sort un contre-tract en douze heures, aussi anonyme et aussi sale. Il fait mal. La campagne vient de descendre d'un étage, et c'est vous qui avez appuyé sur le bouton.";
        },
      },
    ],
  },
  {
    id: "camp_micro",
    kind: "campagne",
    titre: "Le micro resté ouvert",
    once: true,
    texte:
      "Fin de meeting, vous pensiez le micro coupé. Vous avez dit de la fédération locale : « ces ploucs finiront bien par voter comme il faut ». C'était de l'humour de coulisses. C'est maintenant un extrait de neuf secondes.",
    choices: [
      {
        id: "excuses",
        label: "S'excuser vite et bien",
        detail: "Une faute, des excuses, on passe.",
        effects: (c) => {
          c.seg("ruraux", { soutien: -3 });
          c.adj({ player: { integrite: 2 } });
          return "Excuses sobres le soir même, sans avocat ni « si j'ai pu blesser ». Le feu s'éteint en quarante-huit heures. Il restera une cicatrice chez les ruraux, et une leçon : les micros sont toujours ouverts.";
        },
      },
      {
        id: "assumer",
        label: "En rire",
        detail: "« Je parle comme tout le monde en coulisses. »",
        effects: (c) => {
          c.seg("ruraux", { soutien: -6 });
          c.seg("jeunes", { participation: 3 });
          if (c.s.campaign) c.s.campaign.dynamique += 1;
          return "Le pari : l'authenticité. Les jeunes trouvent ça drôle, les ruraux beaucoup moins. Les sondeurs sont incapables de dire si vous venez de gagner ou de perdre — ce qui, en soi, est une information.";
        },
      },
      {
        id: "montage",
        label: "Crier au montage",
        detail: "Nier. C'est risqué : l'extrait est authentique.",
        effects: (c) => {
          c.flag("mensonge_micro");
          c.rel("ferrand", { rancune: 10 });
          c.adj({ player: { integrite: -5 } });
          return "« Extrait tronqué, manipulation. » Ça tient deux jours — jusqu'à ce que Louise Ferrand publie l'enregistrement complet, avec un sonagramme. Vous avez menti, c'est prouvé, c'est archivé. Elle s'en souviendra.";
        },
      },
    ],
  },
  {
    id: "camp_don",
    kind: "campagne",
    titre: "Le donateur pressant",
    once: true,
    cond: (s) => !s.flags["financement_propre"],
    texte:
      "Un homme d'affaires franco-libanais propose d'organiser « trois dîners » à deux cent mille euros. Espitalier vous glisse : « Ses affaires sont… diversifiées. Mais son argent est comme les autres. »",
    choices: [
      {
        id: "refuse",
        label: "Refuser",
        effects: (c) => {
          c.adj({ player: { integrite: 3 } });
          return "Espitalier annule les dîners avec une moue de comptable contrarié. La campagne se serrera la ceinture une semaine de plus.";
        },
      },
      {
        id: "accepte",
        label: "Accepter",
        detail: "Trois dîners. C'est tout.",
        effects: (c) => {
          c.flag("don_libanais");
          c.sched("carnets_1", 8, 20, 0.35);
          c.adj({ player: { integrite: -5 } });
          return "Les trois dîners ont lieu. Les fonds arrivent par des chemins que vous ne demandez pas à connaître. Dans le grand livre invisible de la campagne, une nouvelle ligne s'écrit — et celle-là a un nom, une adresse, et des ennuis judiciaires à venir.";
        },
      },
    ],
  },
  {
    id: "camp_transfuge",
    kind: "campagne",
    titre: "Le transfuge",
    once: true,
    texte:
      "Un député du camp adverse propose de vous rallier publiquement — contre la promesse d'un ministère. C'est une prise de guerre. C'est aussi un homme que vous méprisez cordialement.",
    choices: [
      {
        id: "prendre",
        label: "Accepter le ralliement",
        effects: (c) => {
          if (c.s.campaign) {
            c.s.campaign.opposantScore -= 4;
            c.s.campaign.dynamique += 2;
          }
          c.flag("ministere_promis");
          return "La conférence de presse du ralliement fait grand bruit. L'adversaire encaisse. Vous venez de promettre un ministère à un homme dont la seule conviction est le sens du vent — il faudra honorer ça, ou pas.";
        },
      },
      {
        id: "refuser",
        label: "Décliner poliment",
        effects: (c) => {
          c.adj({ player: { integrite: 3 } });
          return "Vous déclinez. Il se ralliera à quelqu'un d'autre, avec le même communiqué où il suffira de changer le nom. Votre équipe regrette la prise ; vous, pas vraiment.";
        },
      },
    ],
  },
  {
    id: "camp_meeting_rate",
    kind: "campagne",
    titre: "La salle à moitié vide",
    once: true,
    texte:
      "Grand meeting annoncé, six mille places réservées, deux mille personnes présentes. Les photographes ont tous cadré les rangées vides — c'est leur métier, et c'est l'image de la journée. Votre équipe s'accuse mutuellement depuis une heure.",
    choices: [
      {
        id: "ironie_salle",
        label: "En rire le premier",
        effects: (c) => {
          const ok = c.s.player.charisme + c.rng.int(-10, 20) > 55;
          if (ok) {
            if (c.s.campaign) c.s.campaign.dynamique += 2;
            c.adj({ player: { charisme: 2 } });
            return "« On m'avait promis un stade, j'ai eu une salle des fêtes — au moins on s'entend parler. » La vanne fait le tour des réseaux et retourne complètement la séquence. On ne peut pas humilier quelqu'un qui rit le premier.";
          }
          if (c.s.campaign) c.s.campaign.dynamique -= 2;
          return "La plaisanterie tombe à plat devant deux mille personnes qui, elles, s'étaient déplacées. On vous trouve désinvolte. Il y a des jours où rien ne fonctionne.";
        },
      },
      {
        id: "changer_format",
        label: "Abandonner les grands meetings",
        effects: (c) => {
          for (const id of ["periurbain", "ruraux", "pavillonnaires"]) c.seg(id, { soutien: 3, participation: 3 });
          c.adj({ hidden: { fatigue: 6 } });
          return "Vous annulez les trois meetings suivants au profit de petites salles et de marchés. C'est épuisant, moins spectaculaire, et bien plus efficace : dans une salle de trois cents personnes, personne ne compte les chaises vides.";
        },
      },
    ],
  },
  {
    id: "camp_maladie",
    kind: "campagne",
    titre: "La voix qui lâche",
    once: true,
    cond: (s) => s.hidden.fatigue > 50,
    texte:
      "Une extinction de voix doublée d'une fièvre à quarante-huit heures d'un débat. Le médecin de campagne est formel : trois jours de silence complet, ou vous perdez la voix pour deux semaines. Votre agenda ne prévoit pas trois jours.",
    choices: [
      {
        id: "se_soigner",
        label: "Se taire trois jours",
        effects: (c) => {
          c.adj({ hidden: { fatigue: -18, sante: 3 } });
          if (c.s.campaign) c.s.campaign.dynamique -= 2;
          return "Trois jours d'absence en pleine campagne : l'adversaire occupe seul l'espace et ne se prive pas. Vous revenez avec une voix intacte et deux points de retard. C'était le bon calcul, ce qui ne le rend pas confortable.";
        },
      },
      {
        id: "tenir_malade",
        label: "Tenir malgré tout",
        effects: (c) => {
          c.adj({ hidden: { fatigue: 14, sante: -10 } });
          c.rel("manin", { rancune: 6 });
          return "Infiltrations, corticoïdes, et une voix rauque qui passe curieusement bien à la télévision. Vous tenez le rythme. Votre médecin note la date dans un dossier — les campagnes se gagnent parfois sur le corps qu'on hypothèque.";
        },
      },
    ],
  },
  {
    id: "camp_soutien_encombrant",
    kind: "campagne",
    titre: "Le soutien dont on se passerait",
    once: true,
    texte:
      "Une personnalité sulfureuse annonce publiquement qu'elle votera pour vous, en des termes qui vous font plus de mal que dix attaques adverses. Les journalistes vous demandent si vous acceptez ce soutien. La question sera reposée chaque jour jusqu'à la réponse.",
    choices: [
      {
        id: "refuser_soutien",
        label: "Le refuser explicitement",
        effects: (c) => {
          c.seg("urbains", { soutien: 4 });
          c.seg("periurbain", { soutien: -3 });
          c.adj({ player: { integrite: 3 } });
          return "« Je n'ai pas besoin de ces voix-là. » Phrase risquée : en campagne, on ne refuse jamais de voix. Elle vous coûte une frange de l'électorat protestataire et vous rend crédible auprès de tous les autres.";
        },
      },
      {
        id: "esquiver_soutien",
        label: "Esquiver la question",
        effects: (c) => {
          if (c.s.campaign) c.s.campaign.dynamique -= 1;
          c.adj({ player: { cynisme: 3 } });
          return "« Chacun vote comme il l'entend. » L'esquive est techniquement irréprochable et la question revient chaque jour, en boucle, jusqu'à devenir le sujet. Vous perdez une semaine de campagne à ne pas répondre.";
        },
      },
    ],
  },
  {
    id: "camp_sondage_choc",
    kind: "campagne",
    titre: "Le sondage choc",
    once: true,
    texte:
      "Un institut mineur vous donne sept points de moins que tous les autres. Méthodologie douteuse, échantillon faible — mais c'est LE chiffre dont tout le monde parle ce matin, et votre équipe panique par étages entiers.",
    choices: [
      {
        id: "calme",
        label: "Calmer tout le monde",
        detail: "Un sondage n'est pas une élection.",
        effects: (c) => {
          c.adj({ player: { strategie: 2 } });
          return "Réunion d'équipe, voix posée : « Un institut, un chiffre, une journée. On travaille. » La panique retombe. Vous découvrez qu'une partie du métier consiste à être la seule personne calme dans une pièce qui ne l'est pas.";
        },
      },
      {
        id: "surreagir",
        label: "Changer de stratégie en urgence",
        detail: "Le terrain a peut-être raison.",
        effects: (c) => {
          if (c.s.campaign) c.s.campaign.dynamique -= 2;
          c.adj({ hidden: { fatigue: 5 } });
          return "Vous rebattez les cartes en quarante-huit heures : nouveau slogan, nouveau calendrier. La presse sent la fébrilité — elle titre « flottement ». Le sondage était probablement faux. Votre réaction, elle, était bien réelle.";
        },
      },
    ],
  },
];
