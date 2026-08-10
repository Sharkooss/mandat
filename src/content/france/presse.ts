import type { GameEvent, GameState } from "../../engine/types";
import { nomCompletDe, nomDe } from "../../engine/noms";
import { amisPresse, faveursPresse, relationsPresse, souffleur } from "../../engine/presse";

// ---------------------------------------------------------------------------
// La presse comme terrain de jeu.
//
// Une rédaction ne se gagne pas avec une jauge : elle se gagne avec du temps,
// des services rendus et des choses qu'on n'aurait pas dû dire. Ce fichier
// tient les deux bouts — comment on met un journaliste dans sa poche, et ce
// qu'il en coûte quand il présente l'addition.
//
// Le croisement est la règle : une rédaction acquise sert surtout à survivre
// aux autres systèmes (la vendetta, l'enquête européenne, le registre des
// paroles), pas à gagner deux points de sondage.
// ---------------------------------------------------------------------------

/** Le journaliste le plus proche de vous sans être encore acquis. */
function courtise(s: GameState): string {
  const candidats = relationsPresse(s)
    .filter((r) => r.niveau !== "acquis")
    .sort((a, b) => b.loyaute - a.loyaute);
  return candidats[0]?.id ?? "bec";
}

export const EVENTS_PRESSE: GameEvent[] = [
  // =========================================================================
  // Comment on met quelqu'un dans sa poche
  // =========================================================================
  {
    id: "presse_approche",
    kind: "standard",
    titre: "La proposition du dîner",
    rarete: "peu_commune",
    source: "roze",
    weight: (s) => (amisPresse(s).length === 0 && s.power.presse < 62 ? 2.6 : 0.5),
    texte: (s) => {
      const id = courtise(s);
      const nom = nomCompletDe(s, id);
      const motif =
        id === "rives"
          ? "Il ne demande rien. Il propose « qu'on se parle plus souvent », ce qui dans sa bouche est un contrat."
          : id === "ferrand"
            ? "Elle prévient d'emblée : « Ce ne sera jamais un renvoi d'ascenseur. Mais je préfère écrire avec les vrais chiffres qu'avec ceux de vos communicants. »"
            : "Il veut du temps, des coulisses, et l'assurance d'être servi avant les autres. En échange, il « comprendra mieux ». C'est le mot qu'ils emploient tous.";
      return `Camille Roze pose la demande sur votre bureau comme si elle pesait trois kilos. ${nom} sollicite une relation suivie : un rendez-vous régulier, hors agenda, hors compte rendu. ${motif} Votre directrice de la communication est partagée : « Ça peut nous sauver un semestre. Ça peut aussi nous coûter très cher le jour où ça s'arrête. »`;
    },
    choices: [
      {
        id: "accepter_relation",
        label: "Accepter. Un rendez-vous par mois.",
        detail: "Du temps, des confidences, et une dette qui se constitue lentement.",
        effects: (c) => {
          const id = courtise(c.s);
          c.rel(id, { loyaute: 16, rancune: -6 });
          c.adj({ power: { presse: 6 }, hidden: { fatigue: 3 } });
          c.gagnerFaveur();
          c.flag(`presse_relation_${id}`);
          return `Le premier rendez-vous a lieu un jeudi soir, dans un appartement qui n'est à personne. Vous parlez deux heures d'un arbitrage que le pays connaîtra dans six mois. ${nomCompletDe(c.s, id)} ne prend pas de notes — c'est la règle, et c'est ce qui rend la chose dangereuse pour vous deux. À partir de maintenant, il y a dans une rédaction quelqu'un qui sait ce que vous pensez vraiment, et qui a intérêt à ce que vous duriez.`;
        },
      },
      {
        id: "servir_froid",
        label: "Accepter, mais donner peu",
        detail: "Le rendez-vous a lieu. Il n'en sort rien. La relation reste tiède.",
        effects: (c) => {
          const id = courtise(c.s);
          c.rel(id, { loyaute: 5 });
          c.adj({ power: { presse: 2 } });
          return `Vous tenez le rendez-vous, et vous le tenez mal : des éléments de langage servis dans un cadre qui appelait autre chose. ${nomDe(c.s, id)} repart poliment. Rien n'est cassé, rien n'est gagné — et vous venez de dépenser une soirée à obtenir ce qu'un communiqué obtenait déjà.`;
        },
      },
      {
        id: "refuser_relation",
        label: "Refuser. Tout passera par la communication.",
        detail: "Propre, symétrique, et sans un seul ami le jour où ça ira mal.",
        effects: (c) => {
          const id = courtise(c.s);
          c.rel(id, { loyaute: -6, rancune: 6 });
          c.adj({ player: { integrite: 4 } });
          return `La réponse part par le service de presse, dans les formes : « Le Président s'exprime devant tous les journalistes, ou devant aucun. » C'est irréprochable. ${nomCompletDe(c.s, id)} l'écrira tel quel, avec une pointe d'ironie, et la profession retiendra qu'on ne vous approche pas. Les présidents irréprochables sont ceux qu'on lâche le plus vite : personne ne se met en travers pour quelqu'un qui n'a rendu aucun service.`;
        },
      },
    ],
  },

  {
    id: "presse_alerte",
    kind: "intrigue",
    titre: "Le coup de fil de 22 h 40",
    rarete: "rare",
    weight: (s) => (souffleur(s) ? 2 : 0),
    cond: (s) => !!souffleur(s),
    texte: (s) => {
      const ami = souffleur(s)!;
      const sujet =
        (s.europe?.dossiers?.find((d) => !d.public)?.titre ??
          (s.propos.find((p) => !p.tenu) ? "une phrase de vous, et la date à laquelle vous avez fait le contraire" : null)) ??
        "les notes de frais de votre cabinet, sur trois ans";
      return `Votre portable personnel sonne à 22 h 40. ${nomCompletDe(s, ami)}, sans préambule : « Demain matin, à six heures. Le sujet, c'est ${sujet.toLowerCase()}. Ce n'est pas moi, je ne peux pas l'empêcher — mais je peux occuper la matinée avec autre chose, et à midi plus personne n'y reviendra. Vous me dites maintenant. »`;
    },
    choices: [
      {
        id: "alerte_faveur",
        label: "« Occupez la matinée. »",
        detail: "Un renvoi d'ascenseur. Il en reste peu, et il ne s'en crée pas tout seul.",
        cond: (s) => faveursPresse(s) > 0,
        effects: (c) => {
          const recit = c.faveurPresse("le sujet du lendemain");
          c.adj({ power: { presse: 2 }, player: { cynisme: 3 } });
          return `${recit ?? "L'appel suffit."} À midi, le sujet existe toujours — dans une brève, en bas d'une page, sans le mot qui aurait fait mal. Vous avez gagné une matinée et dépensé une amitié utile. Les deux se recomptent.`;
        },
      },
      {
        id: "alerte_devancer",
        label: "Le sortir vous-même, à 6 h 30",
        detail: "On ne révèle pas deux fois la même chose. Ça coûte, une fois.",
        effects: (c) => {
          c.adj({ power: { popularite: -5, presse: 9 }, player: { integrite: 5 } });
          c.rel(souffleur(c.s) ?? "bec", { loyaute: 4 });
          return `Communiqué à 6 h 30, précis, complet, sans adjectif. À sept heures, le sujet a perdu ce qui en faisait un sujet : la surprise. Les rédactions passent la journée à commenter votre transparence faute de pouvoir commenter autre chose. Cinq points de popularité s'en vont ; ils seraient partis de toute façon, et ils seraient revenus moins vite.`;
        },
      },
      {
        id: "alerte_rien",
        label: "« Laissez faire. »",
        detail: "Encaisser. Et garder la faveur pour plus grave.",
        effects: (c) => {
          c.adj({ power: { presse: -6, popularite: -4 } });
          c.rel(souffleur(c.s) ?? "bec", { loyaute: 3 });
          c.sched("presse_retombee", 1, 3, 0.5);
          return `« Comme vous voulez. » Il raccroche sans insister — c'est ce qui distingue un allié d'un obligé. Le sujet sort à six heures et tient trois jours. Vous n'avez rien dépensé, et votre réserve est intacte pour le jour où ce sera vraiment grave. Ce jour-là existe toujours.`;
        },
      },
    ],
  },

  {
    id: "presse_retombee",
    kind: "intrigue",
    titre: "La deuxième vague",
    weight: 0,
    texte: () =>
      "Le sujet devait tenir trois jours ; il en tient neuf. Une deuxième rédaction reprend l'affaire avec deux documents de plus, et la question passe du fait au « pourquoi personne n'a rien dit ». C'est toujours la deuxième vague qui emporte les gens, jamais la première.",
    choices: [
      {
        id: "retombee_repondre",
        label: "Répondre, point par point",
        detail: "Long, aride, et efficace si les faits sont de votre côté.",
        risque: 2,
        aptitude: "rhetorique",
        effects: (c) => {
          if (c.s.player.integrite >= 55) {
            c.adj({ power: { presse: 7, popularite: 2 } });
            return "Vous répondez sur le fond, document par document, pendant quarante minutes ennuyeuses et imparables. L'ennui est ici une stratégie : un sujet auquel on répond complètement cesse d'être un sujet. Les rédactions passent à autre chose en soupirant.";
          }
          c.adj({ power: { presse: -5, popularite: -4 } });
          return "Vous répondez point par point, et chaque point ouvre une question de plus. À la trentième minute, un journaliste demande simplement : « Pourquoi ne l'avez-vous pas dit avant ? » Vous n'avez pas de réponse à celle-là.";
        },
      },
      {
        id: "retombee_ignorer",
        label: "Ne rien commenter",
        detail: "Le silence présidentiel. Il marche une fois sur deux.",
        effects: (c) => {
          if (c.rng.chance(0.5)) {
            c.adj({ power: { presse: -2 } });
            return "Aucun commentaire, aucune réaction, aucun conseiller autorisé à parler. Le sujet s'épuise faute de carburant en dix jours. Le silence est le seul outil gratuit de la communication politique, et le seul qu'on ne peut utiliser que rarement.";
          }
          c.adj({ power: { presse: -8, popularite: -5 } });
          c.rel("ferrand", { rancune: 6 });
          return "Le silence est lu comme un aveu, puis raconté comme tel. Au bout d'une semaine, « l'Élysée n'a pas répondu à nos questions » devient la phrase finale de tous les papiers. C'est une phrase qui condamne sans procès.";
        },
      },
    ],
  },

  // =========================================================================
  // Ce que ça coûte — l'addition du magnat
  // =========================================================================
  {
    id: "rives_addition",
    kind: "intrigue",
    titre: "L'addition",
    rarete: "rare",
    weight: 0,
    cond: (s) => !!s.flags["pacte_rives_signe"] && s.characters["rives"]?.vivant,
    texte: () =>
      "Antoine Rives demande un rendez-vous « de courtoisie ». Il vient sans dossier et parle d'abord de la pluie, puis d'une concentration que l'autorité de régulation bloque depuis dix-huit mois, puis d'une fréquence, puis d'un décret qu'il suffirait de ne pas signer. Il ne rappelle rien de ce qu'il a fait pour vous. C'est inutile : les deux personnes présentes dans la pièce le savent, et une seule des deux a besoin de l'autre.",
    choices: [
      {
        id: "addition_payer",
        label: "Signer. On verra plus tard.",
        detail: "La régulation cède. Le groupe grossit. Vous restez au chaud.",
        effects: (c) => {
          c.adj({ power: { presse: 8, justice: -8 }, player: { integrite: -8, cynisme: 6 } });
          c.rel("rives", { loyaute: 12 });
          c.rel("ferrand", { rancune: 16 });
          c.gagnerFaveur();
          c.derive(1);
          c.dossier("concentration_medias", "Le décret qui a fait un monopole", 40);
          c.seg("urbains", { soutien: -4 });
          return "Le décret n'est pas signé, ce qui suffit : au bout de quatre mois, l'opération passe par épuisement de la procédure. Le groupe possède désormais quarante pour cent de l'information du pays et vous devez encore votre climat de presse à un seul homme. Louise Ferrand publie une infographie des participations croisées. Elle ne sera pas reprise, et c'est très exactement la démonstration.";
        },
      },
      {
        id: "addition_refuser",
        label: "Refuser. Poliment, définitivement.",
        detail: "Vous récupérez votre indépendance et perdez ce qu'elle avait acheté.",
        effects: (c) => {
          c.adj({ power: { presse: -14, justice: 5 }, player: { integrite: 8 } });
          c.rel("rives", { loyaute: -30, rancune: 30 });
          c.rel("ferrand", { loyaute: 8, rancune: -6 });
          c.s.faveursPresse = 0;
          c.flag("pacte_rives_rompu");
          c.log("Vous avez rompu avec Antoine Rives.");
          return "« Je comprends », dit-il, et il le pense : dans son métier on ne s'offense pas, on réévalue. Le changement de ton est perceptible en onze jours. Les mêmes chaînes, les mêmes plateaux, les mêmes invités — et un angle inversé sur chaque sujet. Vous avez récupéré votre honneur au prix d'un ennemi qui possède le tuyau par lequel le pays vous regarde.";
        },
      },
      {
        id: "addition_negocier",
        label: "Donner la moitié",
        detail: "La fréquence, pas la concentration. Un compromis qui ne satisfait personne.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          if (c.s.player.strategie + c.rng.int(-15, 15) > 52) {
            c.adj({ power: { presse: -3 }, player: { integrite: -3 } });
            c.rel("rives", { loyaute: -6, rancune: 6 });
            return "Vous lâchez la fréquence et tenez sur la concentration, en habillant le refus d'une contrainte européenne qui existe vraiment. Il repart avec quelque chose, ce qui lui permet de ne pas perdre la face, et sans l'essentiel, ce qui vous permet de dormir. Ce genre d'arbitrage ne tient jamais plus de deux ans.";
          }
          c.adj({ power: { presse: -9 }, player: { integrite: -5 } });
          c.rel("rives", { loyaute: -14, rancune: 16 });
          return "Le compromis est refusé avant d'être terminé. « Ne faites pas ça, ça n'a aucun intérêt pour vous et aucun pour moi. » Vous avez donné une fréquence et gardé un adversaire — la pire combinaison possible, et celle qu'on obtient presque toujours en croyant couper la poire en deux.";
        },
      },
    ],
  },

  // =========================================================================
  // Ce que ça rapporte — les croisements
  // =========================================================================
  {
    id: "presse_bouclier_enquete",
    kind: "intrigue",
    titre: "Ce que la procureure ne dira pas",
    rarete: "rare",
    weight: (s) => (s.europe?.enquete && souffleur(s) ? 3 : 0),
    cond: (s) => !!s.europe?.enquete && !!souffleur(s),
    texte: (s) =>
      `${nomCompletDe(s, souffleur(s)!)} appelle depuis Bruxelles, à voix basse. « J'ai vu le calendrier de la procureure. Ce n'est pas ce que vous croyez : la saisine porte sur les flux, pas sur vous — mais la conférence de presse, elle, portera sur vous, parce que c'est votre nom qui fait le titre. Je peux sortir le détail avant elle. Le détail est ennuyeux. C'est tout l'intérêt. »`,
    choices: [
      {
        id: "bouclier_publier",
        label: "Laissez-le publier le détail",
        detail: "Techniciser un scandale, c'est le tuer. Ça marche une fois.",
        cond: (s) => faveursPresse(s) > 0,
        effects: (c) => {
          const recit = c.faveurPresse("la saisine du parquet européen");
          c.adj({ hidden: { soupcons: -12 }, power: { presse: 4 } });
          c.rel("ferrand", { rancune: 5 });
          return `${recit ?? "Le papier sort."} Six mille signes de mécanique comptable, deux schémas, aucun adjectif. Quand la procureure tient sa conférence, la moitié de la salle a déjà lu que le dossier portait sur des flux de 2019. Le titre du soir est technique, donc invisible. Un scandale qu'on explique complètement cesse d'être un scandale — et ne le redevient que si quelqu'un trouve autre chose.`;
        },
      },
      {
        id: "bouclier_refuser",
        label: "Ne pas mêler un journaliste à ça",
        detail: "Par prudence, ou par principe. Les deux se ressemblent de loin.",
        effects: (c) => {
          c.adj({ player: { integrite: 4 }, hidden: { soupcons: 3 } });
          c.rel(souffleur(c.s) ?? "bec", { loyaute: 3 });
          return "« Vous avez sans doute raison », dit-il, et il n'insiste pas. La conférence de presse a lieu comme prévu, avec votre nom dans le titre et une photo d'archive mal choisie. Vous avez gardé les mains propres et une soirée épouvantable. Reste à savoir laquelle des deux vous coûtera le plus cher.";
        },
      },
    ],
  },

  {
    id: "presse_bienveillance",
    kind: "standard",
    titre: "Le portrait",
    rarete: "peu_commune",
    weight: (s) => (s.power.presse >= 58 || amisPresse(s).length > 0 ? 1.8 : 0),
    texte: (s) =>
      `Un hebdomadaire prépare un portrait de douze pages. Le journaliste a passé trois semaines avec vos équipes, il a parlé à vingt-deux personnes, et le texte qui remonte est ${
        s.power.presse >= 62 ? "étonnamment favorable" : "juste, ce qui est déjà rare"
      }. Camille Roze veut relire. Le journal refuse, comme toujours. Elle demande au moins à voir les photos.`,
    choices: [
      {
        id: "portrait_ouvrir",
        label: "Ouvrir les portes en grand",
        detail: "Le conjoint, la cuisine, le bureau à 23 h. Tout ce qui humanise.",
        effects: (c) => {
          c.adj({ power: { popularite: 6, presse: 6 }, hidden: { fatigue: 3 } });
          c.rel("conjoint", { loyaute: -5 });
          c.seg("pavillonnaires", { soutien: 4 });
          c.seg("retraites", { soutien: 3 });
          c.gagnerFaveur();
          return "Douze pages, quatre photos, et celle du bureau à 23 h que tout le monde reprendra. Le pays redécouvre quelqu'un qui travaille tard et cuisine mal. C'est dérisoire, c'est efficace, et ça vaut trois déplacements en région. Votre conjoint, en revanche, n'avait pas signé pour la double page du salon.";
        },
      },
      {
        id: "portrait_cadrer",
        label: "Le travail, rien que le travail",
        detail: "Un portrait sérieux, lu par ceux qui votaient déjà pour vous.",
        effects: (c) => {
          c.adj({ power: { presse: 4 } });
          c.seg("csp", { soutien: 3 });
          c.seg("urbains", { soutien: 2 });
          return "Le portrait paraît, dense et respectueux, avec quatre pages sur la méthode de travail et pas une ligne sur votre vie. Les lecteurs qui vous appréciaient vous apprécient un peu plus. Les autres ne l'ont pas ouvert. C'est le sort des portraits sérieux, et vous l'avez choisi.";
        },
      },
    ],
  },

  {
    id: "presse_prix_amitie",
    kind: "intrigue",
    titre: "Ce qu'on finit par vous demander",
    rarete: "rare",
    weight: (s) => (amisPresse(s).length > 0 && faveursPresse(s) >= 1 ? 1.4 : 0),
    cond: (s) => amisPresse(s).length > 0,
    texte: (s) => {
      const ami = souffleur(s)!;
      return `${nomCompletDe(s, ami)} demande à vous voir, et cette fois il apporte un nom : celui d'un ami à placer au conseil d'administration de l'audiovisuel public. Ce n'est pas grand-chose. C'est exactement pour cela que c'est efficace : personne ne rompt une relation de cinq ans pour un siège dans un conseil dont le pays ignore l'existence.`;
    },
    choices: [
      {
        id: "prix_ceder",
        label: "Le nom passe",
        detail: "Un siège contre une amitié. Le change est bon, sur le moment.",
        effects: (c) => {
          const ami = souffleur(c.s) ?? "bec";
          c.rel(ami, { loyaute: 10 });
          c.gagnerFaveur();
          c.adj({ player: { integrite: -5, cynisme: 4 }, power: { presse: 4 } });
          c.dossier("nomination_audiovisuel", "Un siège au conseil de l'audiovisuel, et pourquoi", 18);
          return "Le nom passe en conseil des ministres entre deux décrets, et personne ne relève. Vous venez d'apprendre la seule chose qu'il faut savoir sur les amitiés de presse : elles ne coûtent jamais cher d'un coup. Elles coûtent quatre fois de suite un peu.";
        },
      },
      {
        id: "prix_refuser",
        label: "Refuser, et le dire en face",
        detail: "La relation survivra peut-être. Diminuée.",
        effects: (c) => {
          const ami = souffleur(c.s) ?? "bec";
          c.rel(ami, { loyaute: -14, rancune: 6 });
          c.adj({ player: { integrite: 6 } });
          return `Vous dites non sans habillage, ce qui est plus élégant qu'un non déguisé en contrainte juridique. ${nomDe(c.s, ami)} encaisse, sourit, et parle d'autre chose pendant vingt minutes. Le rendez-vous suivant sera décalé deux fois, puis annulé. On ne se fâche pas dans ce métier : on s'espace.`;
        },
      },
    ],
  },
];
