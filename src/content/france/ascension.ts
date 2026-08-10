import type { GameEvent } from "../../engine/types";

// ---------------------------------------------------------------------------
// Acte II — L'ascension. Court, scripté, mais chaque choix laisse des traces
// qu'on retrouvera au pouvoir : alliés, ennemis, dettes, casseroles.
// ---------------------------------------------------------------------------

export const ASCENSION_SEQUENCE = ["asc_mairie", "asc_zone", "asc_congres", "asc_primaire", "asc_investiture"];

export const EVENTS_ASCENSION: GameEvent[] = [
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
];
