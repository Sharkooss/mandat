import type { GameEvent, GameState } from "../../engine/types";
import { nomCompletDe, nomDe } from "../../engine/noms";
import { armeDe, desamorcer } from "../../engine/vendetta";

// ---------------------------------------------------------------------------
// La mémoire longue du pays.
//
// Deux fils s'y croisent : ce que vous avez dit, et qui ne l'a pas oublié.
// Le premier ressort par la presse ; le second par les gens.
// ---------------------------------------------------------------------------

function proposRenie(s: GameState) {
  const sujet = s.flags["propos_renie"];
  if (typeof sujet !== "string") return undefined;
  return s.propos.find((p) => p.sujet === sujet && !p.tenu);
}

/** Le journaliste qui ressort l'archive : celui qui vous en veut le plus. */
function archiviste(s: GameState): string {
  const presse = ["ferrand", "bec", "rives"].filter((id) => s.characters[id]?.vivant);
  const trie = presse.sort((a, b) => s.characters[b].rancune - s.characters[a].rancune);
  return trie[0] ?? "ferrand";
}

export const EVENTS_MEMOIRE: GameEvent[] = [
  // =========================================================================
  // Ce que vous avez dit
  // =========================================================================
  {
    id: "propos_confrontation",
    kind: "intrigue",
    titre: "L'archive",
    weight: 0,
    cond: (s) => !!proposRenie(s),
    texte: (s) => {
      const p = proposRenie(s);
      if (!p) return "";
      const j = archiviste(s);
      const ecart = Math.max(1, s.turnCount - p.turn);
      const duree = ecart <= 2 ? "il y a moins d'un an" : `il y a ${Math.round(ecart / 2)} ans`;
      return `Le plateau est banal, la question aussi, jusqu'au moment où ${nomCompletDe(s, j)} pose une tablette sur la table et lance la vidéo. C'est vous, ${duree}, ${p.contexte} : « ${p.citation} ». Vingt-deux secondes. Le silence qui suit en dure trois de plus, et c'est celui-là qui tournera en boucle. « Alors ma question est simple : qu'est-ce qui a changé — le pays, ou vous ? »`;
    },
    choices: [
      {
        id: "assumer_revirement",
        label: "« Le pays a changé. Moi aussi. »",
        detail: "Assumer le revirement au lieu de le nier. C'est la seule ligne qui ne s'effondre pas.",
        risque: 2,
        aptitude: "rhetorique",
        effects: (c) => {
          c.adj({ power: { presse: 6, popularite: -2 }, player: { integrite: 4, rhetorique: 2 } });
          c.flag("propos_renie", false);
          return "Vous ne vous défilez pas : vous racontez précisément ce qui vous a fait changer d'avis, avec les chiffres et la date. Ce n'est pas confortable et ça ne fait pas un bon titre — c'est justement ce qui le rend crédible. L'éditorial du lendemain parle d'« un moment rare » ; l'opposition, d'« un aveu ». Les deux ont raison, et vous n'avez rien perdu de plus que ce qui était déjà perdu.";
        },
      },
      {
        id: "nier_propos",
        label: "« Ce n'est pas ce que j'ai dit. »",
        detail: "Contester le montage. La vidéo est pourtant intégrale.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          c.adj({ power: { presse: -12, popularite: -8 }, player: { integrite: -8 } });
          c.rel(archiviste(c.s), { rancune: 20 });
          c.flag("propos_renie", false);
          c.flag("mensonge_archive");
          c.sched("propos_montage", 1, 2, 0.8);
          return "Vous parlez de « séquence sortie de son contexte ». La rédaction met en ligne les vingt-deux minutes intégrales dans l'heure, avec un minutage. Le contexte, il s'avère, était pire que l'extrait. Vous venez d'ajouter un mensonge vérifiable à un revirement discutable — le premier est bien plus grave que le second.";
        },
      },
      {
        id: "contre_attaque_propos",
        label: "Renvoyer la question au journaliste",
        detail: "Attaquer la presse plutôt que répondre. Votre base adore.",
        effects: (c) => {
          c.adj({ power: { presse: -10, popularite: 2 } });
          c.seg("periurbain", { soutien: 3 });
          c.seg("urbains", { soutien: -4 });
          c.rel(archiviste(c.s), { rancune: 15 });
          c.flag("propos_renie", false);
          return "Vous demandez à votre tour combien de fois cette chaîne a changé de ligne éditoriale depuis dix ans. La séquence fait un million de vues et votre camp exulte. On aura remarqué, tout de même, que vous n'avez pas répondu — et « il n'a pas répondu » est une phrase qui s'installe plus durablement qu'une pique.";
        },
      },
    ],
  },
  {
    id: "propos_montage",
    kind: "intrigue",
    titre: "Les vingt-deux minutes",
    weight: 0,
    texte: (s) =>
      `La rédaction n'a pas laissé passer. Elle a publié l'intégralité, minutée, annotée, avec les trois autres fois où vous aviez dit la même chose — meetings, plateaux, profession de foi. Le montage que vous dénonciez n'existait pas ; les archives, elles, sont accablantes. ${nomCompletDe(s, archiviste(s))} n'a même pas commenté : elle a mis un lien.`,
    choices: [
      {
        id: "excuses_montage",
        label: "Présenter des excuses",
        detail: "Court, net, sans conditionnel.",
        risque: 2,
        aptitude: "integrite",
        effects: (c) => {
          c.adj({ power: { presse: 8, popularite: -3 }, player: { integrite: 6 } });
          c.flag("mensonge_archive", false);
          return "Quarante secondes, en début de conseil des ministres, devant les caméras : « J'ai dit une chose fausse. Je la retire. » Aucun élément de langage, aucune mise en perspective. Le service de presse est atterré ; c'est la seule séquence de la semaine que personne ne parvient à retourner contre vous.";
        },
      },
      {
        id: "silence_montage",
        label: "Ne plus commenter",
        effects: (c) => {
          c.adj({ power: { presse: -6, popularite: -5 } });
          return "La consigne est passée : on ne commente plus. La séquence vit sa vie pendant onze jours, se transforme en gimmick, puis en surnom. Les surnoms, en politique, survivent aux mandats.";
        },
      },
    ],
  },

  // =========================================================================
  // La vendetta — étape 2 : le recrutement
  // =========================================================================
  {
    id: "vendetta_recrutement",
    kind: "intrigue",
    titre: "Les rendez-vous",
    rarete: "rare",
    weight: 0,
    cond: (s) => !!s.vendetta && s.vendetta.etape >= 2 && !s.vendetta.desamorcee,
    texte: (s) => {
      const v = s.vendetta!;
      const nom = nomCompletDe(s, v.id);
      const arme = armeDe(v.id);
      const detail: Record<string, string> = {
        publication: "deux anciens de votre cabinet, un magistrat à la retraite, et un documentaliste",
        motion: "onze parlementaires de votre majorité, reçus un par un, jamais ensemble",
        putsch: "trois généraux de corps d'armée, dans un mess où l'on ne prend pas de notes",
        censure: "les présidents de quatre groupes, dont deux qui ne se parlaient plus",
        greve: "les fédérations, une par une, y compris celles qui vous soutenaient",
        revelation: "un avocat, un éditeur, et quelqu'un qui vous connaît depuis très longtemps",
      };
      return `${nomDe(s, "ternay")} pose une note de sept lignes sur le bureau. ${nom} a vu, ces six dernières semaines : ${detail[arme]}. Aucun de ces rendez-vous n'est illégal, aucun n'est secret, et pris séparément aucun ne veut rien dire. C'est la liste qui veut dire quelque chose. « Je ne sais pas encore ce que c'est », conclut la note. « Je sais que c'est en train de se construire. »`;
    },
    choices: [
      {
        id: "reconcilier",
        label: "Réparer, franchement",
        detail: "Reconnaître le tort d'origine. Coûte de l'orgueil, referme le dossier.",
        risque: 2,
        aptitude: "integrite",
        effects: (c) => {
          const v = c.s.vendetta!;
          const nom = nomCompletDe(c.s, v.id);
          if (c.s.characters[v.id].rancune >= 80) {
            c.rel(v.id, { rancune: -18 });
            return `Le rendez-vous a lieu, sans conseillers, sans notes. Vous dites les choses correctement — ce qui a été fait, pourquoi c'était injuste. ${nom} écoute jusqu'au bout, poliment, puis répond : « C'est un peu tard, et vous le savez. » La rancune baisse d'un cran. Elle ne descend pas jusqu'à zéro : certaines choses ne se rattrapent pas par une conversation, aussi honnête soit-elle.`;
          }
          desamorcer(c.s, 40);
          c.adj({ player: { integrite: 4 } });
          c.log(`Vous vous êtes réconcilié avec ${nom}.`);
          return `Le rendez-vous a lieu, sans conseillers, sans notes. Vous dites les choses correctement — ce qui a été fait, pourquoi c'était injuste, ce que vous auriez dû faire. ${nom} ne pardonne pas exactement : ${nomDe(c.s, v.id)} décroise les bras, ce qui est déjà beaucoup. Les rendez-vous cessent la semaine suivante. Personne ne saura jamais ce que vous venez d'éviter — c'est le propre des choses évitées.`;
        },
      },
      {
        id: "acheter_vendetta",
        label: "Offrir quelque chose",
        detail: "Un poste, une mission, une place. Ça marche, et ça se paie ailleurs.",
        effects: (c) => {
          const v = c.s.vendetta!;
          desamorcer(c.s, 32);
          c.adj({ power: { parti: -8, presse: -4 }, player: { integrite: -5, cynisme: 5 } });
          c.flag("vendetta_achetee");
          c.log(`Vous avez acheté le silence de ${nomCompletDe(c.s, v.id)}.`);
          return `L'offre est faite par un intermédiaire, dans les formes. Elle est acceptée en quarante-huit heures — c'est toujours accepté, et c'est toujours ce qui déçoit le plus chez les gens. Les rendez-vous cessent. En revanche, trois personnes savent désormais le prix exact de votre tranquillité, et l'une d'elles le racontera un jour.`;
        },
      },
      {
        id: "detruire_vendetta",
        label: "Frapper le premier",
        detail: "Sortir ce que vous avez sur eux. Il faut avoir de quoi, et de quoi tenir.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const v = c.s.vendetta!;
          const nom = nomCompletDe(c.s, v.id);
          const moyens = c.s.power.justice >= 55 || c.s.power.presse >= 58 || c.s.derive >= 5;
          if (moyens && c.rng.chance(0.6)) {
            desamorcer(c.s, 50);
            c.adj({ power: { presse: -6 }, player: { integrite: -8, cynisme: 6 } });
            c.derive(1);
            c.log(`Vous avez neutralisé ${nom} avant qu'il n'agisse.`);
            return `Le dossier sort un jeudi, sans votre nom nulle part. Il est solide, il est daté, et il est vrai — c'est ce qui le rend imparable. ${nom} passe les trois mois suivants à se défendre au lieu de préparer quoi que ce soit. Vous avez gagné. Vous avez aussi montré à tout votre entourage ce qui arrive à ceux qui vous déplaisent, et personne ne l'oubliera.`;
          }
          c.rel(v.id, { rancune: 25 });
          c.adj({ power: { presse: -14, popularite: -8, justice: -8 }, player: { integrite: -10 } });
          c.log(`Votre tentative de neutraliser ${nom} s'est retournée contre vous.`);
          return `Le dossier sort. Il est mince, il est daté de six ans, et sa provenance est identifiée en deux jours — l'Élysée. Le sujet devient la manœuvre et non la cible. ${nom} donne une conférence de presse de neuf minutes qui vaut à ${nomDe(c.s, v.id)} des soutiens qu'${nomDe(c.s, v.id)} n'avait pas la veille. Vous venez de transformer une rancune privée en cause publique.`;
        },
      },
      {
        id: "surveiller_vendetta",
        label: "Faire surveiller. Attendre.",
        detail: "Ne rien décider. Savoir, au moins.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 6 } });
          c.flag("vendetta_surveillee");
          return `La consigne est donnée aux services : on suit, on ne touche pas. Les notes arrivent toutes les trois semaines, de plus en plus précises, de plus en plus inutiles — savoir n'a jamais empêché quoi que ce soit d'arriver. Vous les lisez le soir, chacune, jusqu'au bout.`;
        },
      },
    ],
  },

  // =========================================================================
  // La vendetta — étape 3 : la préparation
  // =========================================================================
  {
    id: "vendetta_preparation",
    kind: "intrigue",
    titre: "Ce qui est prêt",
    rarete: "rare",
    weight: 0,
    cond: (s) => !!s.vendetta && s.vendetta.etape >= 3 && !s.vendetta.desamorcee,
    texte: (s) => {
      const v = s.vendetta!;
      const nom = nomCompletDe(s, v.id);
      const arme = armeDe(v.id);
      const objet: Record<string, string> = {
        publication: "un manuscrit de trois cents pages, chez un éditeur qui a déjà réservé la date",
        motion: "une motion, ficelée, à laquelle il manque neuf signatures — il en a onze",
        putsch: "un plan de déploiement mis à jour, et deux régiments dont les permissions ont été gelées",
        censure: "une motion de censure transpartisane, et l'accord tacite de gens qui ne s'accordent sur rien",
        greve: "un préavis reconductible dans six branches, déposé et non annoncé",
        revelation: "un entretien enregistré de quatre heures, dont l'existence a fuité et pas le contenu",
      };
      const parole = s.propos.find((p) => !p.tenu);
      return `Ce n'est plus une hypothèse. ${nom} a ${objet[arme]}. Le calendrier n'est pas connu ; tout le reste l'est.${
        parole ? ` La note des services signale un détail : le dossier s'ouvre sur une de vos phrases — « ${parole.citation} » — et la date à laquelle vous avez fait le contraire.` : ""
      } Vous avez encore la main sur le moment, pas sur le fond. C'est peu, et ce n'est pas rien.`;
    },
    choices: [
      {
        id: "devancer",
        label: "Prendre les devants",
        detail: "Annoncer vous-même ce qui va sortir. On ne révèle pas deux fois la même chose.",
        risque: 3,
        aptitude: "rhetorique",
        effects: (c) => {
          const v = c.s.vendetta!;
          desamorcer(c.s, 15);
          c.adj({ power: { popularite: -10, presse: 10 }, player: { integrite: 6 } });
          c.log(`Vous avez désamorcé ${nomCompletDe(c.s, v.id)} en révélant vous-même l'affaire.`);
          return `Vous sortez le sujet vous-même, un mardi matin, dans le détail, sans attendre la question. Dix points de popularité partent en une heure. En échange, l'objet du mois n'existe plus : on ne révèle pas ce qui est déjà sur la table. ${nomCompletDe(c.s, v.id)} se retrouve avec trois cents pages sans révélation dedans — c'est la seule contre-attaque qui fonctionne vraiment, et elle coûte exactement ce qu'elle rapporte.`;
        },
      },
      {
        id: "negocier_vendetta",
        label: "Négocier le silence",
        detail: "Il y a toujours un prix. Il est plus élevé à ce stade.",
        effects: (c) => {
          const v = c.s.vendetta!;
          if (c.s.characters[v.id].rancune >= 85 || c.s.player.reseau < 30) {
            c.rel(v.id, { rancune: 10 });
            c.adj({ player: { integrite: -4 } });
            return `L'émissaire revient avec une phrase et rien d'autre : « Dites-lui qu'il n'y a pas de prix. » Ce n'est pas de la posture — vous avez suffisamment négocié pour reconnaître quand il n'y a rien à négocier. Vous venez surtout de confirmer que le dossier vaut quelque chose.`;
          }
          desamorcer(c.s, 25);
          c.adj({ country: { marge: -6 }, player: { integrite: -8, cynisme: 6 } });
          c.flag("vendetta_achetee");
          c.log(`Vous avez acheté le silence de ${nomCompletDe(c.s, v.id)} au prix fort.`);
          return `Le prix est élevé, et il n'est pas seulement financier : il y a une nomination dedans, et un dossier qu'on n'ouvrira pas. L'accord tient. Il tiendra tant que vous serez en position de le faire tenir — ce genre d'accord n'a jamais de date de fin, seulement une condition de validité.`;
        },
      },
      {
        id: "protection",
        label: "Se blinder",
        detail: "Verrouiller juridiquement, préparer la riposte, tenir le choc.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          c.flag("vendetta_blinde");
          c.adj({ power: { justice: 5 }, hidden: { fatigue: 6 } });
          return `Cellule dédiée, avocats, contre-dossier, éléments de langage prêts pour les six scénarios les plus probables. Vous ne pouvez pas empêcher le coup ; vous pouvez décider de l'état dans lequel vous le recevrez. C'est un travail de six semaines qui ne produira jamais aucune image.`;
        },
      },
      {
        id: "laisser_venir",
        label: "Laisser venir",
        detail: "Il y a des combats qu'on gagne en les acceptant. Il y en a d'autres.",
        effects: (c) => {
          c.adj({ hidden: { paranoia: 8, fatigue: 4 } });
          return `Vous décidez de ne rien décider. Les notes continuent d'arriver ; vous cessez de les lire jusqu'au bout. Il y a une forme de repos dans l'idée que la chose arrivera de toute façon — c'est un repos qui se paie, mais il est réel, et vous dormez mieux ces semaines-là qu'au premier trimestre.`;
        },
      },
    ],
  },

  // =========================================================================
  // La vendetta — étape 4 : le coup
  // =========================================================================
  {
    id: "vendetta_coup",
    kind: "crise",
    titre: "Le coup",
    rarete: "legendaire",
    weight: 0,
    cond: (s) => !!s.vendetta && s.vendetta.etape >= 4 && !s.vendetta.desamorcee,
    texte: (s) => {
      const v = s.vendetta!;
      const nom = nomCompletDe(s, v.id);
      const arme = armeDe(v.id);
      const scene: Record<string, string> = {
        publication: `Le livre sort à 6h. À 9h, il est en tête des ventes ; à 11h, le parquet a été saisi par trois associations. ${nom} enchaîne les plateaux avec le calme de quelqu'un qui a répété.`,
        motion: `La motion est déposée à l'ouverture de la séance. ${nom} l'a fait signer par onze des vôtres — des noms que vous connaissez, dont deux que vous aviez nommés.`,
        putsch: `À 4h, l'état-major cesse de répondre. Deux régiments ont quitté leur garnison sans ordre écrit. ${nom} n'a pas téléphoné : c'est ça, le message.`,
        censure: `La motion de censure est déposée avec les signatures de quatre groupes qui ne s'étaient pas parlé depuis dix ans. ${nom} les a réunis autour de la seule chose sur laquelle ils s'accordent : vous.`,
        greve: `Le préavis tombe sur six branches à la fois, reconductible. ${nom} a annoncé la date en direct, un dimanche soir, à l'heure du journal.`,
        revelation: `L'entretien paraît sur onze pages. Ce n'est pas de la politique : c'est vous, de près, par quelqu'un qui y était. ${nom} n'a pas menti une seule fois, et c'est bien le problème.`,
      };
      return `${scene[arme]} ${
        s.flags["vendetta_blinde"]
          ? "Votre cellule de crise travaille dessus depuis six semaines. Vous avez les réponses, les contre-pièces et les relais. Ça ne rend pas la journée agréable ; ça la rend jouable."
          : "Vous l'apprenez par une alerte téléphone, comme tout le monde."
      }`;
    },
    choices: [
      {
        id: "encaisser_coup",
        label: "Encaisser et tenir",
        detail: "Traverser. C'est long et ça laisse des traces.",
        risque: 2,
        aptitude: "endurance",
        effects: (c) => {
          const v = c.s.vendetta!;
          const blinde = !!c.s.flags["vendetta_blinde"];
          const arme = armeDe(v.id);
          const f = blinde ? 0.5 : 1;
          c.adj({
            power: { popularite: -Math.round(16 * f), presse: -Math.round(10 * f), parti: -Math.round(12 * f) },
            hidden: { fatigue: 10 },
          });
          if (arme === "putsch") c.adj({ hidden: { coup: Math.round(32 * f) } });
          if (arme === "motion" || arme === "censure") c.flag("censure_votee", !blinde);
          if (arme === "greve") c.adj({ hidden: { agitation: Math.round(26 * f) } });
          if (arme === "publication" || arme === "revelation") c.adj({ player: { integrite: -Math.round(10 * f) } });
          c.s.vendetta = null;
          c.log(`${nomCompletDe(c.s, v.id)} a frappé. Vous avez tenu.`);
          return blinde
            ? "Les six semaines de préparation servent exactement à ça : chaque attaque trouve une réponse dans l'heure, chaque pièce une contre-pièce. Vous ne gagnez pas — on ne gagne pas ces journées-là — mais vous êtes encore là vendredi soir, et c'était le seul objectif atteignable."
            : "Vous encaissez à découvert, en direct, pendant onze jours. Chaque réponse arrive trop tard d'une heure et paraît improvisée parce qu'elle l'est. Vous êtes encore là à la fin, et c'est à peu près tout ce qu'on peut en dire.";
        },
      },
      {
        id: "riposte_totale",
        label: "Riposter sans retenue",
        detail: "Tout sortir, tout de suite, sur tout le monde. Ça se retourne souvent.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const v = c.s.vendetta!;
          const arme = armeDe(v.id);
          c.derive(2);
          if (c.s.derive >= 6 || c.s.power.presse >= 60) {
            c.adj({ power: { popularite: -8, presse: -14 }, player: { integrite: -12, cynisme: 8 } });
            if (arme === "putsch") c.adj({ hidden: { coup: 20 } });
            c.rel(v.id, { rancune: 20 });
            c.s.vendetta = null;
            c.log(`Vous avez répondu au coup de ${nomCompletDe(c.s, v.id)} par une contre-offensive totale.`);
            return "Vous sortez tout : les dossiers, les liens, les financements, y compris ceux qui n'ont rien à voir. Le bruit devient tel que plus personne ne distingue l'accusation d'origine. C'est une victoire, au sens où l'on ne parle plus de vous — on parle du bruit. Le pays, lui, a compris que le pouvoir dispose de dossiers sur à peu près tout le monde.";
          }
          c.adj({ power: { popularite: -18, presse: -20, justice: -12 }, player: { integrite: -14 } });
          if (arme === "motion" || arme === "censure") c.flag("censure_votee");
          c.s.vendetta = null;
          c.log("Votre contre-offensive s'est retournée : elle a validé l'accusation.");
          return "La riposte part dans tous les sens et touche surtout vous. Attaquer tout le monde revient à dire que tout le monde a quelque chose à cacher, ce qui est exact, et qui n'aide personne — surtout pas celui qui le dit depuis l'Élysée. Au troisième jour, votre propre camp demande publiquement que « ça cesse ».";
        },
      },
      {
        id: "ceder_coup",
        label: "Céder ce qu'ils veulent",
        detail: "Une tête, une mesure, un renoncement. Ça referme.",
        effects: (c) => {
          const v = c.s.vendetta!;
          const arme = armeDe(v.id);
          c.adj({ power: { popularite: -6, parti: -14 }, player: { integrite: -4 } });
          if (arme === "greve") c.adj({ hidden: { agitation: -18 }, country: { marge: -10 } });
          if (arme === "putsch") c.adj({ power: { armee: 10 }, hidden: { coup: -18 } });
          c.rel(v.id, { rancune: -35 });
          c.s.vendetta = null;
          c.log(`Vous avez cédé pour refermer le dossier ${nomDe(c.s, v.id)}.`);
          return "Il y a une négociation, courte, et un communiqué commun qui ne trompe personne. Vous donnez ce qu'il fallait donner — un ministre, une mesure, un principe. La crise se referme en quatre jours. Tout le monde, dans le pays et dans votre camp, a noté le tarif : on obtient de vous ce qu'on veut à condition d'aller jusqu'au bout.";
        },
      },
    ],
  },
];
