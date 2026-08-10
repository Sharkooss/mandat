import type { Ctx, GameState } from "../../engine/types";
import { NATIONS } from "./data";
import { alliees, defDe, hostiles, majorite } from "../../engine/europe";

// ---------------------------------------------------------------------------
// Les actions de capital politique (3 points par semestre — jamais assez).
// ---------------------------------------------------------------------------

export interface ActionDef {
  id: string;
  nom: string;
  cout: number;
  detail: string;
  cond?: (s: GameState) => boolean;
  effects: (c: Ctx, param?: string) => string;
  needParam?: "reforme" | "personnage" | "region" | "nation";
  /** Candidats proposés quand l'action porte sur quelqu'un. */
  candidats?: (s: GameState) => string[];
  /** Toujours proposée (socle) plutôt que soumise au tirage. */
  socle?: boolean;
  /** Nombre de semestres avant de pouvoir la reprendre. */
  cooldown?: number;
  /**
   * Opportunité : une fenêtre que la situation ouvre, jamais deux fois. Elle ne
   * se présente que si sa `cond` est remplie, une seule à la fois, et elle
   * disparaît définitivement du jeu dès qu'on l'a saisie — c'est ce qui rend le
   * choix de la saisir ou non intéressant.
   */
  opportunite?: boolean;
  /** Pour une opportunité : à quel point elle se fait attendre. */
  rarete?: OpportuniteRarete;
  icone: string;
  tone: string;
}

/**
 * Trois degrés de rareté. Le nombre sert à la fois de poids dans le tirage et
 * de probabilité que l'opportunité tirée se présente vraiment : une occasion
 * historique reste rare même quand toutes ses conditions sont réunies.
 */
export type OpportuniteRarete = "rare" | "exceptionnelle" | "historique";

export const CHANCE_OPPORTUNITE: Record<OpportuniteRarete, number> = {
  rare: 0.5,
  exceptionnelle: 0.3,
  historique: 0.16,
};

export interface ReformeDef {
  id: string;
  nom: string;
  cout: number;
  promesse?: string;
  detail: string;
  effects: (c: Ctx) => string;
}

export const REFORMES: ReformeDef[] = [
  {
    id: "ref_retraites",
    nom: "La réforme des retraites",
    cout: 3,
    promesse: "retraite_oui",
    detail: "Le dossier maudit. Tous vos conseillers sont pour, tous les segments contre.",
    effects: (c) => {
      c.flag("retraites_lancee");
      c.sched("retraites_1", 1, 1, 1);
      return "Le compte à rebours est lancé : le projet part en concertation, c'est-à-dire au front. Rendez-vous au prochain semestre pour la table des négociations — apportez votre casque.";
    },
  },
  {
    id: "ref_hopital",
    nom: "Le plan hôpital",
    cout: 2,
    promesse: "hopital",
    detail: "Cher, lent, nécessaire.",
    effects: (c) => {
      c.adj({ country: { marge: -5, services: 3 } });
      c.promesse("hopital", "partielle");
      c.sched("hopital_fruits", 8, 14, 0.6);
      return "Salaires, lits, gouvernance : le plan est complet et coûteux. Ses effets réels arriveront dans deux à trois ans — vos ennuis de trésorerie, eux, commencent ce semestre.";
    },
  },
  {
    id: "ref_impots",
    nom: "La baisse d'impôts des classes moyennes",
    cout: 2,
    promesse: "impots",
    detail: "Populaire, coûteux, immédiat.",
    effects: (c) => {
      c.adj({ country: { marge: -6 }, power: { popularite: 4 } });
      c.seg("pavillonnaires", { soutien: 6 });
      c.seg("independants", { soutien: 4 });
      c.promesse("impots", "tenue");
      return "La baisse est visible dès la prochaine feuille d'impôt — c'est sa grande qualité politique. Bruxelles fronce un sourcil ; les pavillonnaires vous rendent des points de sondage. L'échange est daté, signé, non remboursable.";
    },
  },
  {
    id: "ref_police",
    nom: "La police de proximité",
    cout: 2,
    promesse: "police",
    detail: "Recoudre, îlot par îlot.",
    effects: (c) => {
      c.adj({ country: { marge: -3, securite: 3, cohesion: 2 } });
      c.seg("quartiers", { soutien: 4 });
      c.promesse("police", "tenue");
      return "Le retour des îlotiers, la connaissance des terrains, les statistiques qui baissent lentement — rien de spectaculaire, tout d'utile. Le syndicat de police le plus dur parle de « police sociale ». C'était l'idée, oui.";
    },
  },
  {
    id: "ref_nucleaire",
    nom: "Le programme nucléaire",
    cout: 3,
    promesse: "nucleaire",
    detail: "Six réacteurs. Trente ans d'engagement.",
    effects: (c) => {
      c.adj({ country: { marge: -6, dette: 2 } });
      c.promesse("nucleaire", "tenue");
      c.seg("urbains", { soutien: -3 });
      c.seg("periurbain", { soutien: 3 });
      return "Le programme est lancé — six réacteurs, des décennies de chantier, une filière qui embauche. La première électricité arrivera sous un autre président. C'est la définition d'une politique énergétique : un cadeau à quelqu'un qu'on ne connaît pas.";
    },
  },
  {
    id: "ref_rail",
    nom: "Le rail du quotidien",
    cout: 2,
    promesse: "rail",
    detail: "Les trains de la vraie vie.",
    effects: (c) => {
      c.adj({ country: { marge: -4, environnement: 3 } });
      c.promesse("rail", "tenue");
      c.seg("urbains", { soutien: 4 });
      c.seg("periurbain", { soutien: 2 });
      return "Pas de ligne à grande vitesse en fanfare : des petites lignes rouvertes, des rames neuves, des horaires tenus. C'est peu télégénique et profondément politique — le rail du quotidien est la seule promesse qui passe deux fois par jour devant ses électeurs.";
    },
  },
  {
    id: "ref_regularisation",
    nom: "La régularisation des travailleurs",
    cout: 2,
    promesse: "regularisation",
    detail: "Assumer une position. Toute la polémique avec.",
    effects: (c) => {
      c.promesse("regularisation", "tenue");
      c.seg("urbains", { soutien: 4 });
      c.seg("quartiers", { soutien: 5 });
      c.seg("pavillonnaires", { soutien: -5 });
      c.seg("ruraux", { soutien: -4 });
      c.adj({ country: { cohesion: -2 } });
      return "Les critères sont publiés, les préfectures instruisent. Sallenave tient son thème pour dix-huit mois. Les secteurs en tension — bâtiment, restauration, soin — embauchent enfin légalement ceux qui y travaillaient déjà. Les deux phrases précédentes sont vraies en même temps ; c'est tout le dossier.";
    },
  },
  {
    id: "ref_quotas",
    nom: "Les quotas migratoires",
    cout: 2,
    promesse: "quotas",
    detail: "Un vote annuel au Parlement. Assumé.",
    effects: (c) => {
      c.promesse("quotas", "tenue");
      c.seg("pavillonnaires", { soutien: 5 });
      c.seg("ruraux", { soutien: 4 });
      c.seg("urbains", { soutien: -5 });
      c.seg("quartiers", { soutien: -6 });
      c.adj({ country: { cohesion: -2 } });
      return "Le Parlement votera chaque année des plafonds par catégorie. Le débat annuel sera un rituel de déchirement national — c'est le coût du dispositif, et pour ses partisans, sa fonction.";
    },
  },
  {
    id: "ref_proportionnelle",
    nom: "La proportionnelle",
    cout: 2,
    promesse: "proportionnelle",
    detail: "Changer les règles du jeu — y compris pour vous.",
    effects: (c) => {
      c.promesse("proportionnelle", "tenue");
      c.flag("proportionnelle_active");
      c.seg("jeunes", { soutien: 4 });
      c.seg("urbains", { soutien: 3 });
      return "La loi électorale est promulguée : les prochaines législatives seront à la proportionnelle. Chaque courant aura ses députés — y compris ceux que le scrutin majoritaire étouffait, dans tous les sens du mot. Vous venez de rendre votre propre majorité future presque impossible. C'était le principe. Vous l'avez fait quand même.";
    },
  },
  {
    id: "ref_usines",
    nom: "Le plan 100 usines",
    cout: 2,
    promesse: "usines",
    detail: "Subventions, guichets, terrains. Bruxelles surveille.",
    effects: (c) => {
      c.adj({ country: { marge: -5 } });
      c.promesse("usines", "partielle");
      c.sched("usines_bilan", 8, 14, 0.6);
      c.seg("periurbain", { soutien: 4 });
      return "Les aides sont ouvertes, les préfets mobilisés, les terrains viabilisés. Les usines mettront des années à sortir de terre — les inaugurations, si elles arrivent, tomberont pile pendant la campagne de quelqu'un. Peut-être la vôtre.";
    },
  },
];

// ---------------------------------------------------------------------------
// Les actions. Trois catégories :
//   · socle       — toujours disponibles (réformer, souffler, la famille)
//   · pool        — quatre tirées au sort chaque semestre, avec cooldown
//   · opportunité — n'apparaissent que si la situation s'y prête, et frappent fort
// ---------------------------------------------------------------------------

/** Personnages nommables à un grand poste, du plus loyal au moins. */
function nommables(s: GameState): string[] {
  return ["rochefort", "delval", "mazeau", "danglade", "roze", "verdier", "belkacem", "quesnel"].filter(
    (id) => s.characters[id]?.vivant && s.characters[id]?.enPoste !== false
  );
}

export const ACTIONS: ActionDef[] = [
  // --- Socle ---------------------------------------------------------------
  {
    id: "reforme",
    nom: "Lancer une réforme",
    cout: 0,
    detail: "Engager un grand chantier.",
    needParam: "reforme",
    socle: true,
    icone: "▣",
    tone: "var(--color-monde)",
    effects: (c, param) => {
      const ref = REFORMES.find((r) => r.id === param);
      if (!ref) return "Aucune réforme choisie.";
      return ref.effects(c);
    },
  },
  {
    id: "repos",
    nom: "Souffler",
    cout: 1,
    detail: "Trois jours sans cortège. La presse ricanera.",
    socle: true,
    icone: "☾",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ hidden: { fatigue: -24, sante: 3 } });
      c.rel("conjoint", { loyaute: 5 });
      c.press("« Le Président au vert pendant que la France attend » — Philippe Bec, agacé de service", "satirique");
      return "Trois jours sans dossier rouge. Vous dormez neuf heures, marchez en forêt, réapprenez le prénom de vos gardes du corps. Philippe Bec s'indigne. Son indignation est le prix d'un service que personne d'autre ne vous rendra : durer.";
    },
  },
  {
    id: "famille",
    nom: "Du temps en famille",
    cout: 1,
    detail: "Ce que le pouvoir dévore en premier.",
    socle: true,
    icone: "❦",
    tone: "var(--color-env)",
    effects: (c) => {
      c.rel("conjoint", { loyaute: 8, rancune: -3 });
      c.rel("bensalah", { loyaute: 3 });
      c.adj({ hidden: { fatigue: -8, paranoia: -4 } });
      return "Un week-end entier, téléphones dans un tiroir. Rien de politique n'en sort, ce qui en fait le meilleur investissement du semestre : les jauges qui comptent vraiment ne s'affichent pas non plus.";
    },
  },

  // --- Pool tiré au sort ---------------------------------------------------
  {
    id: "remaniement",
    nom: "Changer de Premier ministre",
    cout: 1,
    detail: "Le fusible saute. Reste à choisir le suivant.",
    needParam: "personnage",
    candidats: (s) => nommables(s).filter((id) => id !== "rochefort" || !s.characters["rochefort"].enPoste),
    cond: (s) => s.characters["rochefort"].enPoste || !!s.flags["pm_actuel"],
    cooldown: 4,
    icone: "♟",
    tone: "var(--color-pouvoir)",
    effects: (c, param) => {
      const sortant = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
      const sortantSt = c.s.characters[sortant];
      if (sortantSt) {
        sortantSt.enPoste = false;
        c.rel(sortant, { rancune: 18, loyaute: -22 });
      }
      const id = param ?? "roze";
      c.flag("pm_actuel", id);
      c.rel(id, { loyaute: 10, ambition: 8 });
      c.adj({ power: { popularite: 6, parti: -4 } });
      c.log(`Vous avez remplacé votre Premier ministre par ${id}.`);

      const nouveau = c.s.characters[id];
      if (nouveau && nouveau.ambition > 60) {
        c.sched("pm_rival", 3, 7, 0.5);
        return "Le sortant remet sa démission « à votre demande », selon la formule qui ne trompe personne. Le successeur, lui, prend Matignon avec l'appétit de quelqu'un qui n'a jamais considéré ce poste comme une fin. L'opinion respire — les fusibles servent à ça. Vous venez d'en installer un qui conduit.";
      }
      c.sched("pm_terne", 4, 8, 0.4);
      return "Le sortant remet sa démission « à votre demande ». Le successeur est loyal, appliqué, et n'éclipsera jamais personne — c'est exactement ce qu'on demande à un Premier ministre, jusqu'au jour où il faudrait qu'il ait du charisme.";
    },
  },
  {
    id: "deplacement",
    nom: "Déplacement en région",
    cout: 1,
    detail: "Le terrain. Fatigant, utile, humain.",
    cooldown: 2,
    icone: "◎",
    tone: "var(--color-social)",
    effects: (c) => {
      const cibles = ["periurbain", "ruraux", "pavillonnaires", "quartiers"] as const;
      const cible = c.rng.pick(cibles);
      c.seg(cible, { soutien: 5, participation: 3 });
      c.adj({ hidden: { fatigue: 6, agitation: -3 }, country: { cohesion: 1 } });
      const noms: Record<string, string> = {
        periurbain: "une ville moyenne qui a perdu son usine et garde sa fierté",
        ruraux: "un canton où la sous-préfecture est le dernier guichet de la République",
        pavillonnaires: "un lotissement où l'on vous parle d'école et de giratoire",
        quartiers: "un quartier où personne n'attendait un président, ce qui rend la visite utile",
      };
      return `Une journée dans ${noms[cible]}. Des mains serrées, deux engueulades saines, un café offert par quelqu'un qui « ne vote plus ». Le pays réel recharge une batterie que l'Élysée décharge.`;
    },
  },
  {
    id: "renflouer",
    nom: "Renflouer un secteur",
    cout: 2,
    detail: "De l'argent tout de suite, là où ça saigne.",
    cooldown: 3,
    icone: "◈",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ country: { marge: -5, services: 5 }, hidden: { agitation: -5 } });
      return "Une enveloppe d'urgence part vers le secteur qui criait le plus fort. Le soulagement est réel et provisoire — c'est le propre des perfusions. Cyril Danglade a signé en fermant les yeux, littéralement.";
    },
  },
  {
    id: "sommet",
    nom: "Recevoir un chef d'État",
    cout: 1,
    detail: "Tapis rouge, garde républicaine, contrats.",
    cooldown: 3,
    icone: "⚑",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { prestige: 4 } });
      c.rel("weiss", { loyaute: 3 });
      c.press("« Paris au centre du jeu » — les images du sommet font le tour des chancelleries", "favorable");
      return "Deux jours de protocole millimétré, une déclaration commune, un contrat industriel. La diplomatie est le seul théâtre où la France joue au-dessus de son PIB — autant occuper la scène.";
    },
  },
  {
    id: "seconde_source",
    nom: "Demander une seconde source",
    cout: 1,
    detail: "Yves Ternay, en tête-à-tête. Les vrais chiffres.",
    cooldown: 2,
    icone: "◐",
    tone: "var(--color-secu)",
    effects: (c) => {
      const h = c.s.hidden;
      const lignes: string[] = [];
      lignes.push(`Agitation réelle : ${Math.round(h.agitation)}/100 — l'Intérieur vous annonçait ${Math.round(h.agitation * 0.75)}.`);
      lignes.push(`Votre fatigue : ${h.fatigue > 70 ? "critique" : h.fatigue > 45 ? "notable" : "maîtrisée"}. Votre santé : ${h.sante < 45 ? "préoccupante" : h.sante < 70 ? "moyenne" : "bonne"}.`);
      if (h.coup > 25) lignes.push(`« Certains cercles militaires parlent. Risque : ${h.coup > 55 ? "sérieux" : "à surveiller"}. »`);
      if (h.assassinat > 25) lignes.push(`« Nous avons renforcé votre protection. Ne demandez pas pourquoi. Niveau : ${h.assassinat > 55 ? "élevé" : "notable"}. »`);
      c.adj({ hidden: { paranoia: 2 } });
      return "Yves Ternay vous reçoit sans dossier — tout est dans sa tête, c'est son assurance-vie. " + lignes.join(" ");
    },
  },
  {
    id: "allocution",
    nom: "Allocution télévisée",
    cout: 1,
    detail: "20h, tous les écrans. Réussie ou ratée.",
    cooldown: 3,
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const perf = c.s.player.rhetorique - (c.s.hidden.fatigue > 65 ? 20 : 0) + c.rng.int(-18, 18);
      if (perf > 58) {
        c.adj({ power: { popularite: 6, presse: 3 }, hidden: { fatigue: 4 } });
        return "Douze minutes, sans prompteur, avec une formule qui restera. Les chaînes la repassent en boucle, et pour une fois sans ironie. On vous redécouvre.";
      }
      if (perf > 38) {
        c.adj({ power: { popularite: 1 }, hidden: { fatigue: 4 } });
        return "Une allocution correcte, oubliée avant le journal de 23h. L'audience était bonne, l'effet nul. C'est le sort de la plupart des paroles présidentielles.";
      }
      c.adj({ power: { popularite: -4, presse: -3 }, hidden: { fatigue: 5 } });
      return "Le ton sonne faux dès la deuxième phrase. Les réseaux découpent l'allocution en extraits moqueurs avant même la fin. Camille Roze ne dit rien, ce qui est pire que tout.";
    },
  },
  {
    id: "nomination",
    nom: "Nommer à un grand poste",
    cout: 1,
    detail: "Récompenser, neutraliser, ou s'attacher quelqu'un.",
    needParam: "personnage",
    candidats: nommables,
    cooldown: 3,
    icone: "♛",
    tone: "var(--color-pouvoir)",
    effects: (c, param) => {
      const id = param ?? "roze";
      const st = c.s.characters[id];
      if (!st) return "Personne à nommer.";
      c.rel(id, { loyaute: 12, ambition: 5 });
      c.adj({ power: { parti: -2 } });
      // Les ambitieux qu'on installe deviennent plus dangereux, pas moins.
      if (st.ambition > 60) {
        c.flag(`promu_${id}`);
        return "La nomination est saluée comme habile : vous placez un rival là où il devra vous être solidaire. Il accepte avec un empressement qui devrait vous alerter — un ambitieux ne dit jamais oui par gratitude, mais par calcul.";
      }
      return "La nomination récompense une fidélité. Ce sont les nominations les plus utiles et les moins commentées : personne ne fait la une avec un poste bien attribué.";
    },
  },
  {
    id: "decoration",
    nom: "Décorer quelqu'un",
    cout: 1,
    detail: "Une médaille coûte moins cher qu'un ministère.",
    needParam: "personnage",
    candidats: (s) => ["kervella", "belkacem", "charvet", "quesnel", "alberti", "rives", "bec", "verdier"].filter((id) => s.characters[id]?.vivant),
    cooldown: 4,
    icone: "✦",
    tone: "var(--color-perso)",
    effects: (c, param) => {
      const id = param ?? "quesnel";
      c.rel(id, { loyaute: 8, rancune: -8 });
      return "La cérémonie dure vingt minutes, le discours en fait dix. La personne décorée fait mine de trouver ça dérisoire et gardera la boîte toute sa vie. La vanité est le carburant le moins cher de la République.";
    },
  },
  {
    id: "commission",
    nom: "Installer une commission",
    cout: 1,
    detail: "Enterrer un problème sous des travaux sérieux.",
    cooldown: 4,
    icone: "◫",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.adj({ hidden: { agitation: -6 }, power: { presse: -2 } });
      c.flag("commission_en_cours");
      return "Une commission d'experts, une lettre de mission, dix-huit mois de travaux. Le sujet quitte l'actualité dès le lendemain. Son rapport, à sa remise, ne sera lu par personne — sauf par ceux qui voudront vous le jeter au visage.";
    },
  },
  {
    id: "negocier_syndicats",
    nom: "Négocier avec les syndicats",
    cout: 1,
    detail: "Choisir son interlocuteur, c'est choisir son camp.",
    cooldown: 3,
    icone: "✊",
    tone: "var(--color-social)",
    effects: (c) => {
      c.rel("belkacem", { loyaute: 10 });
      c.rel("kervella", { rancune: 6 });
      c.adj({ power: { syndicats: 6 }, hidden: { agitation: -7 }, country: { marge: -2 } });
      return "Quatre séances avec Nadia Belkacem, un relevé de conclusions, une concession budgétaire. Bruno Kervella dénonce « un syndicalisme de préfecture » et s'isole un peu plus. Vous avez acheté du calme et fabriqué un adversaire plus dur.";
    },
  },
  {
    id: "diner_patronat",
    nom: "Dîner avec le patronat",
    cout: 1,
    detail: "Ils investiront. Ils voudront quelque chose.",
    cooldown: 3,
    icone: "⬣",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.rel("charvet", { loyaute: 10 });
      c.adj({ power: { patronat: 8 }, country: { croissance: 0.2 } });
      c.seg("public", { soutien: -3 });
      return "Édouard Charvet lève son verre à « un exécutif enfin lucide ». Trois engagements d'investissement sont annoncés le lendemain, dont deux étaient déjà prévus. La photo, elle, tourne dans les syndicats avec une légende peu amène.";
    },
  },
  {
    id: "interview",
    nom: "Grand entretien à la presse",
    cout: 1,
    detail: "Une journaliste, une heure, aucun filet.",
    cooldown: 3,
    icone: "✎",
    tone: "var(--color-perso)",
    effects: (c) => {
      const ok = c.s.player.rhetorique + c.rng.int(-15, 15) > 50;
      if (ok) {
        c.adj({ power: { presse: 8, popularite: 2 } });
        c.rel("ferrand", { rancune: -4 });
        return "Une heure d'entretien sans questions transmises à l'avance. Vous encaissez trois questions dures et en retournez deux. Les rédactions saluent « un exercice courageux » — le compliment le plus rare de la profession.";
      }
      c.adj({ power: { presse: -6, popularite: -3 } });
      return "L'entretien dérape sur une question que tout le monde voyait venir sauf vous. La phrase malheureuse fera les titres pendant trois jours, et les compilations pendant trois ans.";
    },
  },
  {
    id: "conseil_defense",
    nom: "Conseil de défense",
    cout: 1,
    detail: "Le huis clos où se décide ce qui ne se dit pas.",
    cooldown: 3,
    icone: "★",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.adj({ country: { securite: 4 }, power: { armee: 5 } });
      c.rel("verdier", { loyaute: 5 });
      c.adj({ hidden: { coup: -4 } });
      return "Salle sécurisée, téléphones consignés. On y traite en deux heures ce que le Parlement mettrait un an à effleurer. L'état-major apprécie qu'on le consulte — c'est la façon la moins chère d'acheter la loyauté d'une armée.";
    },
  },
  {
    id: "inauguration",
    nom: "Inaugurer un chantier",
    cout: 1,
    detail: "Un ruban, une pelleteuse, un bon plan de coupe.",
    cooldown: 3,
    icone: "⚒",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ power: { popularite: 3 }, country: { croissance: 0.1 } });
      c.seg("periurbain", { soutien: 3 });
      return "Un ruban, un casque de chantier mal ajusté, quarante photographes. Le chantier était financé par votre prédécesseur, mais l'inauguration est à vous — c'est la règle la plus constante de la vie politique.";
    },
  },
  {
    id: "audit",
    nom: "Auditer un ministère",
    cout: 1,
    detail: "Découvrir ce qu'on vous cache dans votre propre maison.",
    cooldown: 4,
    icone: "◍",
    tone: "var(--color-monde)",
    effects: (c) => {
      const trouve = c.rng.chance(0.55);
      if (trouve) {
        c.adj({ country: { marge: 5 }, power: { popularite: -1 } });
        c.rel("mazeau", { rancune: 5 });
        return "L'audit exhume des crédits dormants, deux marchés surfacturés et une agence dont personne ne sait plus ce qu'elle fait. Vous récupérez de la marge budgétaire et un ministre furieux qu'on soit allé fouiller chez lui.";
      }
      c.adj({ country: { marge: 1 } });
      return "L'audit ne trouve rien de scandaleux — juste une administration lente et consciencieuse. Le rapport conclut à « des marges d'optimisation ». C'est ce qu'on écrit quand on n'a rien trouvé.";
    },
  },
  {
    id: "referendum_local",
    nom: "Consulter les Français",
    cout: 2,
    detail: "Une consultation nationale. Risquée, mémorable.",
    cooldown: 6,
    icone: "◈",
    tone: "var(--color-monde)",
    effects: (c) => {
      const adhesion = c.s.power.popularite + c.rng.int(-20, 20);
      if (adhesion > 52) {
        c.adj({ power: { popularite: 7 }, country: { cohesion: 5 } });
        c.seg("jeunes", { participation: 6 });
        return "La consultation mobilise au-delà des attentes et vous donne raison. Une légitimité fraîche, extraite directement du pays sans passer par les corps intermédiaires — ils l'ont remarqué, et ne l'ont pas aimé.";
      }
      c.adj({ power: { popularite: -6 }, country: { cohesion: -2 } });
      return "Participation faible, résultat ambigu, interprétations contradictoires dès 20h01. Vous avez donné au pays une occasion de vous dire non ; une partie s'en est saisie. On ne consulte jamais impunément.";
    },
  },

  // --- Opportunités --------------------------------------------------------
  {
    id: "discours_historique",
    nom: "Le discours d'une vie",
    cout: 2,
    detail: "Vous avez le charisme pour ça. Ça n'arrivera pas deux fois.",
    cond: (s) => s.player.charisme >= 70 || s.player.rhetorique >= 75,
    opportunite: true,
    rarete: "historique",
    icone: "✷",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { popularite: 10, presse: 6 }, country: { cohesion: 6 }, hidden: { fatigue: 8 } });
      c.log("Votre discours au Panthéon est entré dans les anthologies.");
      return "Vous parlez trente-cinq minutes sous la nef du Panthéon. Pas une annonce, pas une mesure : une idée de ce que le pays est. Les commentateurs cherchent l'arrière-pensée politique et n'en trouvent pas, ce qui les déstabilise. Le texte entrera dans les manuels.";
    },
  },
  {
    id: "plan_urgence",
    nom: "Plan d'urgence national",
    cout: 2,
    detail: "Un secteur s'effondre. Y aller massivement.",
    cond: (s) => s.country.services < 32 || s.country.securite < 35 || s.country.cohesion < 28,
    opportunite: true,
    rarete: "rare",
    icone: "✚",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.adj({ country: { services: 9, securite: 5, cohesion: 4, marge: -9 }, power: { popularite: 4 }, hidden: { agitation: -8 } });
      c.log("Un plan d'urgence national a été déclenché pour un secteur au bord de la rupture.");
      return "Des milliards, un pilotage direct depuis l'Élysée, des préfets réquisitionnés. C'est cher, spectaculaire, et ça marche — les urgences absolues sont les seuls moments où l'État français retrouve sa vitesse d'exécution.";
    },
  },
  {
    id: "offensive_mediatique",
    nom: "Reprendre la main sur le récit",
    cout: 2,
    detail: "La presse vous massacre. Contre-attaquer.",
    cond: (s) => s.power.presse < 36,
    opportunite: true,
    rarete: "rare",
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const ok = c.s.player.rhetorique + c.rng.int(-12, 22) > 55;
      if (ok) {
        c.adj({ power: { presse: 14, popularite: 3 } });
        return "Trois semaines d'occupation méthodique du terrain : reportages en immersion, entretiens fleuves, portes ouvertes. Le récit change de main. Ça se joue toujours à l'usure, jamais au coup d'éclat.";
      }
      c.adj({ power: { presse: -5, popularite: -3 } });
      c.derive(1);
      return "L'offensive tourne au bras de fer, puis à la crispation. Un conseiller suggère de « revoir les accréditations » de deux rédactions. Vous ne dites pas non assez vite, et c'est déjà noté quelque part.";
    },
  },
  {
    id: "apaiser_rue",
    nom: "Aller au-devant de la colère",
    cout: 2,
    detail: "Le pays gronde. Y aller sans service d'ordre.",
    cond: (s) => s.hidden.agitation > 55,
    opportunite: true,
    rarete: "rare",
    icone: "◎",
    tone: "var(--color-social)",
    effects: (c) => {
      const courage = c.rng.chance(0.65);
      if (courage) {
        c.adj({ hidden: { agitation: -16, fatigue: 8 }, power: { popularite: 5 }, country: { cohesion: 4 } });
        c.log("Vous êtes allé(e) au contact d'un pays en colère, sans filtre.");
        return "Six heures dans une salle des fêtes hostile, sans notes, sans service d'ordre visible. On vous coupe la parole, on vous insulte, puis on vous écoute. Vous ne convainquez pas grand monde — mais vous êtes venu, et dans un pays qui se sent méprisé, c'est déjà la moitié du sujet.";
      }
      c.adj({ hidden: { agitation: 5 }, power: { popularite: -4 } });
      return "L'exercice tourne mal : une bousculade, une image de vous protégé par six gardes, reprise partout. La séquence prouve exactement le contraire de ce qu'elle devait montrer.";
    },
  },
  {
    id: "purge_administrative",
    nom: "Reprendre en main l'appareil d'État",
    cout: 2,
    detail: "Placer les vôtres partout. Efficace. Irréversible.",
    cond: (s) => s.derive >= 3,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.derive(2);
      c.adj({ power: { justice: -8, presse: -5 }, country: { securite: 3 } });
      c.rel("alberti", { rancune: 12 });
      c.log("Vous avez placé vos fidèles à la tête des administrations de contrôle.");
      return "Préfets, directions centrales, autorités de contrôle : une vague de nominations en trois conseils des ministres. Chacune est légale et défendable. Ensemble, elles font qu'aucun contre-pouvoir ne vous surprendra plus. C'est très confortable. C'est le problème.";
    },
  },
  {
    id: "virage_gauche",
    nom: "Infléchir à gauche",
    cout: 1,
    detail: "Un budget, un symbole, un camp. On saura enfin où vous êtes.",
    cond: (s) => s.bord > -10,
    cooldown: 3,
    icone: "◀",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      c.bord(-2);
      c.adj({ country: { services: 3, marge: -4 }, hidden: { agitation: -3 } });
      const extreme = c.s.bord <= -6;
      return extreme
        ? "Encore un cran. Les mesures s'enchaînent plus vite que les études d'impact, votre base exulte, et deux conseillers de Bercy demandent leur mutation le même jour. Il n'y a plus grand monde pour vous dire non, et c'est exactement ce que vous vouliez il y a deux ans."
        : "Un collectif budgétaire, deux symboles, un discours. La lecture est immédiate dans tout le pays : vous avez choisi un camp. On vous jugera désormais sur les résultats de ce camp-là, ce qui est plus exigeant que le flou.";
    },
  },
  {
    id: "virage_droite",
    nom: "Infléchir à droite",
    cout: 1,
    detail: "L'ordre, le travail, la frontière. La clarté a ses électeurs.",
    cond: (s) => s.bord < 10,
    cooldown: 3,
    icone: "▶",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.bord(2);
      c.adj({ country: { securite: 3, croissance: 0.2, environnement: -2 } });
      const extreme = c.s.bord >= 6;
      return extreme
        ? "Encore un cran. Le vocabulaire officiel change avant les lois — c'est toujours l'ordre des choses. Trois ambassadeurs demandent des « éclaircissements », votre électorat parle de courage, et personne au Conseil des ministres ne relève plus rien."
        : "Deux textes, un ton, une ligne. Le pays comprend enfin qui vous êtes, et une partie de ceux qui vous avaient élu par défaut commence à faire ses comptes. La clarté rapporte toujours plus qu'elle ne coûte, jusqu'au jour où c'est l'inverse.";
    },
  },
  {
    id: "purge_ideologique",
    nom: "Épurer l'appareil d'État",
    cout: 2,
    detail: "Ne garder que les vôtres. Les convictions avant les compétences.",
    cond: (s) => Math.abs(s.bord) >= 7 && s.derive >= 3,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "⚑",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.derive(2);
      c.bord(c.s.bord < 0 ? -1 : 1);
      c.adj({ power: { justice: -10, presse: -8 }, country: { services: -4, cohesion: -6 } });
      c.rel("alberti", { rancune: 14 });
      c.log("Vous avez épuré l'administration selon un critère politique.");
      return "Quatre-vingt-dix hauts fonctionnaires écartés en trois vagues, remplacés par des fidèles dont la principale qualification est la fidélité. L'appareil vous obéit désormais au doigt et à l'œil, et il a perdu en six mois la seule chose qui le rendait utile : la capacité de vous dire que vous vous trompez.";
    },
  },
  {
    id: "grande_cause",
    nom: "Lancer la grande cause du mandat",
    cout: 2,
    detail: "Un sujet, cinq ans, votre nom dessus.",
    cond: (s) => s.turn <= 4 && !s.flags["grande_cause"],
    opportunite: true,
    rarete: "rare",
    icone: "✶",
    tone: "var(--color-env)",
    effects: (c) => {
      c.flag("grande_cause");
      c.adj({ country: { cohesion: 5, environnement: 4, services: 3 }, power: { popularite: 3 }, hidden: { agitation: -3 } });
      c.sched("grande_cause_bilan", 6, 10, 0.7);
      c.log("Vous avez fait d'un seul sujet la grande cause de votre mandat.");
      return "Un sujet, une équipe dédiée, un budget sanctuarisé et votre nom associé pour toujours. Les grandes causes ne se jugent qu'à la fin — mais elles donnent à un mandat ce qui lui manque presque toujours : une direction lisible.";
    },
  },

  // --- Opportunités : l'économie -------------------------------------------
  {
    id: "conference_prix",
    nom: "Convoquer la conférence des prix",
    cout: 2,
    detail: "Les étiquettes brûlent. Réunir la distribution et taper du poing.",
    cond: (s) => s.country.inflation > 5.5,
    opportunite: true,
    rarete: "rare",
    icone: "◈",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire(
        "prix",
        "Les prix vont baisser. Je m'y engage devant vous, et je reviendrai vous rendre des comptes",
        "à la sortie de la conférence des prix",
      );
      c.adj({ country: { inflation: -1.4, marge: -4 }, power: { popularite: 6, patronat: -8 } });
      c.rel("charvet", { rancune: 10 });
      c.press("« Trois cents produits bloqués » — la mesure fait la une de tous les journaux du soir", "favorable");
      return "Onze heures de réunion, une liste de trois cents produits, et une conférence de presse à minuit où vous annoncez des baisses que vous n'avez pas totalement obtenues. La distribution signe en serrant les dents. Ça calmera le caddie six mois ; personne dans la salle ne croit que ça règle quoi que ce soit.";
    },
  },
  {
    id: "grand_emprunt",
    nom: "Lancer le grand emprunt national",
    cout: 2,
    detail: "Les caisses sont vides. Aller chercher l'argent chez les Français.",
    cond: (s) => s.country.dette > 145 || s.country.marge < 18,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "▤",
    tone: "var(--color-eco)",
    effects: (c) => {
      const succes = c.s.power.popularite + c.rng.int(-15, 20) > 45;
      if (succes) {
        c.adj({ country: { marge: 16, dette: 6, cohesion: 4 }, power: { popularite: 4 } });
        c.log("Le grand emprunt national a été souscrit au-delà des objectifs.");
        return "Guichets ouverts six semaines, taux honnête, affiches partout. Les Français prêtent à leur propre État plus qu'on ne l'espérait — il y a dans ce geste quelque chose de très ancien, à mi-chemin entre la confiance et le placement. La dette monte, mais elle est désormais détenue par des gens qui votent.";
      }
      c.adj({ country: { marge: 5, dette: 4 }, power: { popularite: -5, patronat: -4 } });
      return "Guichets ouverts six semaines, et un résultat tiède que Bercy qualifie de « conforme aux prévisions révisées ». On ne prête pas à un État dont on doute, et c'est bien le problème : vous vouliez de l'argent, vous avez obtenu un sondage.";
    },
  },
  {
    id: "grands_travaux",
    nom: "Décréter les grands travaux",
    cout: 2,
    detail: "Le chômage explose. Sortir la truelle et le béton.",
    cond: (s) => s.country.chomage > 11.5,
    opportunite: true,
    rarete: "rare",
    icone: "⚒",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire("emploi", "Personne ne restera au bord du chemin. Le chantier est ouvert, et il est ouvert à tous", "au lancement des grands travaux");
      c.adj({
        country: { chomage: -1.3, croissance: 0.5, marge: -10, dette: 5, environnement: -4 },
        power: { popularite: 6, syndicats: 8, patronat: 5 },
      });
      c.seg("periurbain", { soutien: 6 });
      c.log("Un plan de grands travaux a été décrété.");
      return "Lignes ferroviaires, réseaux d'eau, rénovation de trois mille écoles : de la commande publique brute, décidée en six semaines au lieu de six ans. Les carnets se remplissent, les chiffres du chômage tourneront dans un an, et les écologistes de votre majorité découvrent la quantité de béton qu'il faut pour faire baisser une courbe.";
    },
  },
  {
    id: "dividende_croissance",
    nom: "Rendre le dividende de la croissance",
    cout: 1,
    detail: "Ça va bien. Trop bien pour ne rien en faire.",
    cond: (s) => s.country.croissance > 2.4 && s.country.marge > 52,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "✧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ country: { marge: -12, cohesion: 5, services: 3 }, power: { popularite: 11, presse: 4 } });
      c.seg("periurbain", { soutien: 5, participation: 3 });
      c.seg("csp", { soutien: 4 });
      c.press("« Le président rend l'argent » — la séquence tourne en boucle", "favorable");
      c.log("Vous avez redistribué l'excédent budgétaire aux ménages.");
      return "Un chèque, un vrai, envoyé avant l'été à quinze millions de foyers. Bercy plaide pour désendetter, vous plaidez pour qu'on se souvienne de vous. Les deux raisonnements sont bons ; un seul se voit sur un relevé bancaire.";
    },
  },

  // --- Opportunités : le monde ---------------------------------------------
  {
    id: "mediation_mondiale",
    nom: "Prendre la médiation",
    cout: 2,
    detail: "Deux puissances se parlent enfin. Elles cherchent une table.",
    cond: (s) => s.country.prestige > 68,
    opportunite: true,
    rarete: "historique",
    icone: "☮",
    tone: "var(--color-monde)",
    effects: (c) => {
      const abouti = c.s.player.strategie + c.rng.int(-10, 25) > 60;
      if (abouti) {
        c.adj({ country: { prestige: 14, cohesion: 4 }, power: { popularite: 8, presse: 7 }, hidden: { fatigue: 12 } });
        c.rel("weiss", { loyaute: 8 });
        c.flag("mediation_reussie");
        c.press("« La paix signée à Paris » — les images de la poignée de main font le tour du monde", "favorable");
        c.log("Vous avez obtenu un accord entre deux puissances en guerre.");
        return "Neuf jours dans un château sous cloche, sans téléphone, à faire la navette entre deux ailes. Le texte final tient en quatre pages et ne satisfait personne, ce qui est la définition d'un accord. La photo de la poignée de main sera dans les manuels bien après que le pays aura oublié votre bilan intérieur.";
      }
      c.adj({ country: { prestige: -6 }, power: { popularite: -4 }, hidden: { fatigue: 14 } });
      return "Neuf jours dans un château sous cloche, et une délégation qui repart la nuit sans prévenir. Vous avez engagé la France dans un échec très visible. En diplomatie, celui qui convoque est celui qui perd si personne ne signe.";
    },
  },
  {
    id: "tournee_reconquete",
    nom: "La tournée de reconquête",
    cout: 2,
    detail: "La France ne pèse plus rien. Aller le corriger sur place.",
    cond: (s) => s.country.prestige < 32,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "✈",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { prestige: 12, marge: -3 }, power: { popularite: -3, patronat: 6 }, hidden: { fatigue: 16 } });
      c.rel("weiss", { loyaute: 5 });
      c.press("« Onze pays en dix-huit jours » — la presse compte les kilomètres plutôt que les résultats", "neutre");
      return "Onze capitales, dix-huit jours, quatre fuseaux horaires et deux contrats industriels qu'on vous disait perdus. Vous rentrez avec un prestige recousu et une opinion intérieure qui a compté vos absences une par une. Le rayonnement se paie toujours en présence.";
    },
  },

  // --- Opportunités : les corps et l'appareil -------------------------------
  {
    id: "grenelle",
    nom: "Ouvrir un Grenelle",
    cout: 2,
    detail: "Les syndicats sont partis, la rue est pleine. Tout remettre sur la table.",
    cond: (s) => s.power.syndicats < 26 && s.hidden.agitation > 45,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "⚖",
    tone: "var(--color-social)",
    effects: (c) => {
      c.adj({ power: { syndicats: 20, patronat: -7, popularite: 4 }, country: { marge: -7, cohesion: 5 }, hidden: { agitation: -14, fatigue: 10 } });
      c.rel("kervella", { rancune: -12, loyaute: 8 });
      c.rel("belkacem", { loyaute: 10 });
      c.rel("charvet", { rancune: 8 });
      c.log("Un Grenelle a été ouvert avec les partenaires sociaux.");
      return "Trois nuits blanches rue de Grenelle, des salaires, des grilles, un relevé de conclusions signé à 4 h 20 du matin par des gens qui ne se parlaient plus. Bruno Kervella signe le dernier et sans un mot. Ça coûte très cher et ça vous rachète une année de paix sociale — les deux à la fois, comme toujours.";
    },
  },
  {
    id: "pacte_productif",
    nom: "Sceller le pacte productif",
    cout: 2,
    detail: "Le patronat vous a lâché. Le récupérer coûtera quelque chose.",
    cond: (s) => s.power.patronat < 28,
    opportunite: true,
    rarete: "rare",
    icone: "◧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.adj({ power: { patronat: 20, syndicats: -8, popularite: -3 }, country: { croissance: 0.6, chomage: -0.5, marge: -6 } });
      c.rel("charvet", { loyaute: 14, rancune: -8 });
      c.rel("kervella", { rancune: 10 });
      c.seg("csp", { soutien: 5 });
      return "Baisse de charges contre engagements d'embauche, signés devant caméras. Édouard Charvet vous serre la main comme on referme un contrat d'assurance. Les engagements ne sont pas contraignants ; la baisse de charges, elle, s'applique dès janvier. Vous savez très bien lequel des deux tiendra.";
    },
  },
  {
    id: "congres_extraordinaire",
    nom: "Convoquer un congrès extraordinaire",
    cout: 2,
    detail: "Le parti vous échappe. Le reprendre devant ses militants.",
    cond: (s) => s.power.parti < 32,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "♟",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      const tenu = c.s.player.charisme + c.rng.int(-15, 22) > 55;
      if (tenu) {
        c.adj({ power: { parti: 24, popularite: 2 } });
        c.rel("delval", { loyaute: 10, ambition: -8 });
        c.log("Vous avez repris le parti en main lors d'un congrès extraordinaire.");
        return "Deux mille militants dans un parc des expositions surchauffé, et quarante minutes sans notes qui rappellent à tout le monde pourquoi c'est vous. Sacha Delval applaudit debout, au troisième rang, avec la tête de quelqu'un qui recompte ses appuis.";
      }
      c.adj({ power: { parti: -10, popularite: -4, presse: -4 } });
      c.rel("delval", { ambition: 12, loyaute: -10 });
      c.sched("pm_rival", 2, 5, 0.5);
      return "Deux mille militants, et une motion concurrente qui recueille 41 % — un score qu'on ne présente comme une victoire que quand on a perdu. Sacha Delval fait le tour des plateaux le lendemain pour expliquer qu'il n'est candidat à rien. Personne ne le croit, et il compte là-dessus.";
    },
  },
  {
    id: "loi_moralisation",
    nom: "La loi de moralisation",
    cout: 2,
    detail: "Votre réputation est intacte. C'est un capital qui se dépense.",
    cond: (s) => s.player.integrite > 74 && s.power.justice > 45,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "§",
    tone: "var(--color-secu)",
    effects: (c) => {
      c.dire("probite", "Aucun de mes proches, aucun de mes ministres, aucun de mes amis ne bénéficiera de la moindre exception", "en présentant la loi de moralisation");
      c.adj({ power: { justice: 14, presse: 9, popularite: 7, parti: -12 }, player: { integrite: 4 } });
      c.rel("espitalier", { rancune: 16 });
      c.rel("alberti", { loyaute: 10 });
      c.flag("moralisation");
      c.log("La loi de moralisation de la vie publique a été promulguée.");
      return "Emplois familiaux interdits, casier vierge exigé, réserve parlementaire supprimée, comptes de campagne ouverts. Le texte passe parce que personne ne peut voter contre à visage découvert. Jean-Marc Espitalier vous explique en petit comité que vous venez d'assécher le parti — il a raison, et il ne l'oubliera pas.";
    },
  },

  // --- Opportunités : l'homme ou la femme ----------------------------------
  {
    id: "adresse_solennelle",
    nom: "L'adresse au pays",
    cout: 2,
    detail: "Vous êtes au fond. Vingt minutes, en direct, sans filet.",
    cond: (s) => s.power.popularite < 24,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "◉",
    tone: "var(--color-perso)",
    effects: (c) => {
      const juste = c.s.player.rhetorique + c.s.player.integrite / 2 + c.rng.int(-18, 20) > 70;
      if (juste) {
        c.dire("cap", "J'ai entendu. Je ne changerai pas de cap, je changerai de manière", "dans l'adresse aux Français");
        c.adj({ power: { popularite: 13, presse: 5 }, country: { cohesion: 4 }, hidden: { agitation: -8 } });
        c.log("Votre adresse aux Français a inversé la courbe.");
        return "Vingt minutes seul face à une caméra, sans décor, sans prompteur visible. Vous reconnaissez deux erreurs par leur nom — ce que personne ne fait jamais — et vous ne demandez rien. Vingt-trois millions de téléspectateurs. Le lendemain, pour la première fois depuis un an, la courbe remonte.";
      }
      c.adj({ power: { popularite: -6, presse: -5 } });
      return "Vingt minutes seul face à une caméra, et un ton qui sonne faux dès la troisième phrase. Le pays entend un homme qui s'explique au lieu d'un président qui décide. Les réseaux découpent la séquence en trente extraits avant même la fin du direct. On ne se relève pas d'une adresse ratée : on l'ajoute au dossier.";
    },
  },
  {
    id: "verite_sante",
    nom: "Dire la vérité sur votre santé",
    cout: 1,
    detail: "Le Dr Manin insiste. Le pays finira par l'apprendre autrement.",
    cond: (s) => s.hidden.sante < 45,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "✚",
    tone: "var(--color-perso)",
    effects: (c) => {
      c.adj({ power: { popularite: 8, presse: 10, parti: -8 }, player: { integrite: 6 }, hidden: { paranoia: -12 } });
      c.rel("manin", { loyaute: 12 });
      c.rel("conjoint", { loyaute: 8 });
      c.rel("delval", { ambition: 10 });
      c.flag("sante_publique");
      c.press("« Le président dit son mal » — le bulletin de santé est publié intégralement", "favorable");
      c.log("Vous avez rendu public votre état de santé.");
      return "Un communiqué de quatre lignes, un bulletin de santé complet, et une phrase en fin de conférence de presse : « Vous saurez tout, et vous le saurez de moi. » Le pays vous en sait gré immédiatement. Votre propre camp, lui, commence à compter les mois — c'est le prix, et il est déjà payé.";
    },
  },
  {
    id: "retraite_strategique",
    nom: "Disparaître quinze jours",
    cout: 1,
    detail: "Vous n'en pouvez plus. Personne ne sait où vous êtes.",
    cond: (s) => s.hidden.fatigue > 78,
    opportunite: true,
    rarete: "rare",
    icone: "☾",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ hidden: { fatigue: -42, sante: 10, paranoia: -10 }, power: { popularite: -5, presse: -6 } });
      c.rel("conjoint", { loyaute: 12, rancune: -8 });
      c.press("« Où est le président ? » — deux semaines d'absence et autant de spéculations", "hostile");
      return "Quinze jours dans une maison de fonction que personne ne connaît, sans agenda, sans note, sans conseiller. Vous dormez douze heures par nuit la première semaine. La presse parle de fuite, l'opposition d'abandon, et votre médecin de la seule décision sensée que vous ayez prise depuis deux ans.";
    },
  },
  {
    id: "devancer_generaux",
    nom: "Devancer les généraux",
    cout: 2,
    detail: "Ça se murmure dans les états-majors. Ne pas attendre.",
    cond: (s) => s.hidden.coup > 50,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      const net = c.s.player.strategie + c.s.power.armee / 2 + c.rng.int(-20, 20) > 70;
      if (net) {
        c.adj({ hidden: { coup: -34, paranoia: 8 }, power: { armee: 6 } });
        c.rel("verdier", { loyaute: 8, ambition: -10 });
        c.log("Vous avez démantelé un noyau de conjurés dans l'armée.");
        return "Trois mutations, une mise à la retraite anticipée, un commandement dissous, tout cela un mardi matin et sans un mot à la presse. Le général Verdier vous remet lui-même la liste, ce qui répond à la seule question qui comptait vraiment. Le reste de l'état-major comprend le message en lisant le Journal officiel.";
      }
      c.adj({ hidden: { coup: 12, paranoia: 16 }, power: { armee: -12 } });
      c.rel("verdier", { rancune: 18, loyaute: -14 });
      c.derive(1);
      return "Vous frappez trop large et trop vite. Deux des officiers écartés n'avaient rien à se reprocher, et leurs camarades le savent. Vous vouliez décapiter une rumeur ; vous venez de lui donner des martyrs et une raison. L'armée ne pardonne pas l'injustice administrative — c'est la seule qu'elle subisse.";
    },
  },

  // --- Opportunités : le pays ----------------------------------------------
  {
    id: "loi_climat",
    nom: "La loi climat de rupture",
    cout: 2,
    detail: "L'environnement s'effondre. Un texte que personne n'ose écrire.",
    cond: (s) => s.country.environnement < 32,
    opportunite: true,
    rarete: "rare",
    icone: "❧",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({
        country: { environnement: 16, croissance: -0.5, marge: -6 },
        power: { patronat: -12, presse: 6, popularite: -2 },
      });
      c.seg("urbains", { soutien: 8, participation: 4 });
      c.seg("ruraux", { soutien: -6 });
      c.rel("charvet", { rancune: 14 });
      c.log("Une loi climat de rupture a été promulguée.");
      return "Interdictions datées, trajectoires contraignantes, sanctions réelles : pour une fois le texte n'est pas un catalogue d'intentions. Les urbains diplômés vous redécouvrent, la ruralité comprend qu'elle paiera d'abord, et le patronat sort de la réunion sans faire de déclaration — ce qui est sa manière de déclarer la guerre.";
    },
  },
  {
    id: "leadership_climat",
    nom: "Prendre la tête du monde qui vient",
    cout: 2,
    detail: "Exemplaire chez vous, écouté partout. Une seule fois dans un mandat.",
    cond: (s) => s.country.environnement > 68 && s.country.prestige > 55,
    opportunite: true,
    rarete: "historique",
    icone: "✦",
    tone: "var(--color-env)",
    effects: (c) => {
      c.adj({ country: { prestige: 15, environnement: 5, cohesion: 3 }, power: { popularite: 7, presse: 8 }, hidden: { fatigue: 10 } });
      c.flag("leadership_climat");
      c.seg("jeunes", { soutien: 10, participation: 6 });
      c.press("« L'accord de Paris, le vrai » — quarante chefs d'État signent le texte français", "favorable");
      c.log("La France a pris la tête d'une coalition climatique mondiale.");
      return "On ne vous a pas donné ce rôle : vous l'avez pris, parce que vous étiez le seul à pouvoir montrer vos propres chiffres sans rougir. Quarante chefs d'État signent un texte rédigé au Quai d'Orsay. Les jeunes, qui ne vous devaient rien, vous inscrivent au crédit de quelque chose qu'ils vérifieront dans trente ans.";
    },
  },
  {
    id: "union_nationale",
    nom: "Former l'union nationale",
    cout: 2,
    detail: "Le pays est derrière vous. Élargir tant que ça tient.",
    cond: (s) => s.country.cohesion > 68 && s.power.popularite > 58,
    opportunite: true,
    rarete: "historique",
    icone: "⚭",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      c.adj({ power: { sieges: 42, parti: -10, popularite: 5, presse: 6 }, country: { cohesion: 6 } });
      c.rel("andrieu", { loyaute: 25, rancune: -15, ambition: -8 });
      c.rel("delval", { rancune: 12 });
      c.rel("sallenave", { rancune: 15 });
      c.flag("union_nationale");
      c.log("Un gouvernement d'union nationale a été formé.");
      return "Quatre portefeuilles à l'opposition de gouvernement, dont un régalien — ce qui est le seul geste que personne ne peut qualifier de cosmétique. Claire Andrieu accepte en quarante-huit heures ; son propre camp la traite de collaboratrice le soir même. Vous gouvernez désormais avec une majorité écrasante et sans plus aucune excuse.";
    },
  },
  {
    id: "dissolution_offensive",
    nom: "Dissoudre",
    cout: 2,
    detail: "Vous êtes haut, l'Assemblée est courte. Tout remettre en jeu.",
    cond: (s) => s.power.popularite > 60 && s.power.sieges < 289,
    opportunite: true,
    rarete: "historique",
    icone: "⚑",
    tone: "var(--color-pouvoir)",
    effects: (c) => {
      const marge = c.s.power.popularite - 50 + c.s.power.parti / 4 + c.rng.int(-22, 18);
      if (marge > 12) {
        c.adj({ power: { sieges: 96, parti: 10, popularite: 4 } });
        c.s.cohabitation = false;
        c.log("La dissolution vous a rendu une majorité absolue.");
        return "Vingt-quatre jours de campagne éclair sur un seul argument : laissez-moi finir. Le pays vous donne une majorité absolue et le sentiment très rare, à l'Élysée, d'avoir eu raison contre tous les conseillers. Vous n'aurez plus jamais cette fenêtre — les dissolutions gagnantes ne se reproduisent pas.";
      }
      c.adj({ power: { sieges: -54, parti: -14, popularite: -10 } });
      c.s.cohabitation = true;
      c.rel("andrieu", { ambition: 14 });
      c.log("La dissolution a tourné à la cohabitation.");
      return "Vingt-quatre jours de campagne éclair, et un dimanche soir où les cartes se remplissent d'une couleur qui n'est pas la vôtre. Vous aviez la popularité ; il vous manquait les circonscriptions, qui ne se sondent pas. Il faudra désormais partager le pouvoir avec quelqu'un qui vous doit sa fonction et rien d'autre.";
    },
  },

  // --- L'Europe : la diplomatie ordinaire ----------------------------------
  {
    id: "bilateral",
    nom: "Un tête-à-tête",
    cout: 1,
    detail: "Deux heures avec une capitale. Sans conseillers, sans communiqué.",
    needParam: "nation",
    candidats: (s) => NATIONS.filter((d) => s.europe.nations[d.id]).map((d) => d.id),
    cooldown: 2,
    icone: "⚑",
    tone: "var(--color-monde)",
    effects: (c, param) => {
      const def = defDe(param ?? "allemagne");
      if (!def) return "Aucune capitale choisie.";
      const st = c.s.europe.nations[def.id];
      const ecart = Math.abs(c.s.bord - st.bord);
      // On ne rattrape pas idéologiquement ce qui sépare deux lignes. On peut
      // seulement rendre le désaccord courtois — c'est déjà beaucoup.
      const gain = Math.round(16 - ecart * 1.1 + c.s.player.charisme * 0.06);
      c.nation(def.id, { relation: Math.max(3, gain), faveurs: 4 });
      c.adj({ hidden: { fatigue: 4 }, country: { prestige: 1 } });
      if (def.dirigeantId) c.rel(def.dirigeantId, { loyaute: 6 });
      if (ecart >= 8) {
        return `Deux heures à ${def.capitale}, dont quarante minutes sans interprète. Vous ne vous entendez sur rien et vous le dites franchement, ce qui vous rapproche davantage que six communiqués communs. On se quitte en sachant exactement où l'autre bloquera — dans ce métier, c'est le seul luxe.`;
      }
      return `Deux heures à ${def.capitale}, un déjeuner qui déborde, deux dossiers réglés dans le couloir. Rien qui se voie de Paris. Mais le jour où il faudra une voix de plus au Conseil, quelqu'un décrochera.`;
    },
  },
  {
    id: "conseil_europeen",
    nom: "Monter au Conseil",
    cout: 2,
    detail: "Porter une initiative française. Il faut compter ses voix avant.",
    cooldown: 3,
    icone: "★",
    tone: "var(--color-monde)",
    effects: (c) => {
      const maj = majorite(c.s);
      const passe = maj + c.s.player.strategie * 0.15 + c.rng.int(-14, 14) > 58;
      if (passe) {
        c.adj({ country: { influence: 9, prestige: 5, marge: 3 }, power: { popularite: 4, presse: 3 } });
        c.toutesNations({ relation: 2 }, hostiles(c.s).map((d) => d.id));
        c.log("Une initiative française a été adoptée par le Conseil européen.");
        return `Trente-neuf heures de sommet, deux nuits blanches, un texte réécrit six fois dans un couloir. Il sort avec votre nom dessus et deux tiers de ce que vous vouliez. À ${maj} % de voix acquises en entrant, c'était jouable ; ceux qui vous suivent aujourd'hui compteront la facture demain.`;
      }
      c.adj({ country: { influence: -7, prestige: -4 }, power: { popularite: -3, presse: -4 } });
      c.nation("allemagne", { relation: -5 });
      return `Trente-neuf heures de sommet pour un communiqué de onze lignes qui « prend note » de la proposition française. « Prendre note » est le mot que l'Europe emploie pour dire non sans humilier. À ${maj} % de voix acquises en entrant, il ne fallait pas y aller — ou il fallait y aller autrement.`;
    },
  },

  // --- L'Europe : les occasions --------------------------------------------
  {
    id: "sommet_paris",
    nom: "Convoquer un sommet à Paris",
    cout: 2,
    detail: "Vous pesez assez pour fixer l'ordre du jour de tout le monde.",
    cond: (s) => s.country.influence > 62,
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "✦",
    tone: "var(--color-monde)",
    effects: (c) => {
      c.adj({ country: { influence: 11, prestige: 8 }, power: { popularite: 5, presse: 5 }, hidden: { fatigue: 10 } });
      c.toutesNations({ relation: 6 });
      c.press("« Vingt-sept à Paris » — les images du Grand Palais tournent sur toutes les chaînes du continent", "favorable");
      c.log("Vous avez convoqué et présidé un sommet européen à Paris.");
      return "Convoquer, c'est déjà décider : celui qui fixe l'ordre du jour a gagné la moitié du sommet avant qu'il commence. Deux jours de Grand Palais, un communiqué où la France est citée quatre fois, et la découverte que la plupart des chefs d'État viennent surtout pour les couloirs.";
    },
  },
  {
    id: "coalition_bloc",
    nom: "Former un bloc",
    cout: 2,
    detail: "Trois capitales qui votent ensemble, toujours. Ça change tout.",
    cond: (s) => alliees(s).filter((d) => !d.institution && !d.horsUnion).length >= 2 && !s.flags["bloc_forme"],
    opportunite: true,
    rarete: "historique",
    icone: "◈",
    tone: "var(--color-monde)",
    effects: (c) => {
      const amis = alliees(c.s).filter((d) => !d.institution && !d.horsUnion);
      c.flag("bloc_forme", amis.map((d) => d.id).join(","));
      c.adj({ country: { influence: 16, prestige: 6 } });
      for (const d of amis) c.nation(d.id, { relation: 10, faveurs: 8 });
      // Ceux qui restent dehors voient très bien ce qui se construit.
      c.toutesNations({ relation: -6 }, [...amis.map((d) => d.id), "commission"]);
      c.sched("bloc_traite", 3, 6, 0.6);
      c.log(`Vous avez formé un bloc avec ${amis.map((d) => d.capitale).join(" et ")}.`);
      return `Un format à ${amis.length + 1}, une réunion préparatoire avant chaque Conseil, une position commune arrêtée en amont. ${amis.map((d) => d.capitale).join(" et ")} acceptent — non par affection, mais parce qu'un bloc pèse plus que la somme de ses membres. Les autres capitales comprennent en une semaine, et commencent à en construire un autre.`;
    },
  },
  {
    id: "veto",
    nom: "Mettre le veto",
    cout: 1,
    detail: "Tout bloquer jusqu'à obtenir ce que vous voulez. Ça se paie longtemps.",
    cond: (s) => majorite(s) < 46,
    opportunite: true,
    rarete: "rare",
    icone: "⊘",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.adj({ country: { marge: 7, influence: -12, prestige: -5 }, power: { popularite: 6 } });
      c.toutesNations({ relation: -14 }, ["hongrie"]);
      c.nation("hongrie", { relation: 8 });
      c.press("« LA FRANCE BLOQUE TOUT » — la presse allemande emploie le mot « chantage », la presse française le mot « fermeté »", "neutre");
      c.log("Vous avez opposé votre veto au Conseil pour obtenir une contrepartie.");
      return "Vous bloquez le paquet entier pour une ligne budgétaire. Ça marche : à quatre heures du matin, on vous donne ce que vous demandiez pour que le sommet finisse. Vous rentrez avec votre enveloppe et avec vingt-six capitales qui savent désormais que la France se paie. On vous le fera sentir à chaque vote, pendant des années.";
    },
  },
  {
    id: "accord_commercial",
    nom: "Signer le grand accord",
    cout: 2,
    detail: "Des marchés ouverts contre des concessions. Les agriculteurs vont hurler.",
    cond: (s) => alliees(s).some((d) => d.traits.includes("industrielle")),
    opportunite: true,
    rarete: "rare",
    icone: "◧",
    tone: "var(--color-eco)",
    effects: (c) => {
      c.dire("agriculture", "Aucun agriculteur français ne sera sacrifié à un traité. Aucun", "à la signature de l'accord");
      c.adj({
        country: { croissance: 0.9, chomage: -0.6, environnement: -6, influence: 5, prestige: 3 },
        power: { patronat: 12, syndicats: -6, popularite: 2 },
      });
      c.seg("ruraux", { soutien: -10 });
      c.seg("csp", { soutien: 6 });
      c.sched("accord_agriculteurs", 2, 5, 0.7);
      c.log("Un grand accord commercial a été signé.");
      return "Quatre cents pages, dix-neuf ans de négociation, et une signature qui prend douze secondes. Les carnets de commandes de l'industrie se remplissent avant même la ratification. Dans les campagnes, on lit la même page et on y voit exactement l'inverse — et on n'a pas tort.";
    },
  },
  {
    id: "guerre_commerciale",
    nom: "Passer aux représailles",
    cout: 2,
    detail: "Une capitale vous nuit. Répondre sur le terrain qui fait mal.",
    cond: (s) => hostiles(s).some((d) => !d.institution),
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "⚔",
    tone: "var(--color-bad)",
    effects: (c) => {
      const cible = hostiles(c.s).filter((d) => !d.institution)[0];
      if (!cible) return "Plus personne à qui répondre.";
      c.nation(cible.id, { relation: -22 });
      c.toutesNations({ relation: -5 }, [cible.id]);
      c.adj({ country: { croissance: -0.4, inflation: 0.6, influence: -6 }, power: { popularite: 7, patronat: -8 } });
      c.press(`« PARIS RIPOSTE » — les mesures visant ${cible.nom} sont annoncées à 20 h, appliquées à minuit`, "neutre");
      c.log(`Vous avez engagé des représailles commerciales contre ${cible.nom}.`);
      return `Droits de douane ciblés, marchés publics fermés, deux licences d'exportation suspendues « pour vérification ». ${cible.capitale} répond en quarante-huit heures, sur vos produits les plus symboliques. L'opinion adore ; les industriels des deux pays paient ; et personne ne sait plus comment on s'arrête.`;
    },
  },

  // --- L'Europe : l'arrière-cuisine ----------------------------------------
  {
    id: "circuit_etranger",
    nom: "Ouvrir le circuit",
    cout: 1,
    detail: "Zeeman a un montage. Le parti respirerait enfin.",
    cond: (s) => (s.power.parti < 48 || s.derive >= 2) && !s.europe.dossiers.some((d) => d.id === "circuit"),
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "◐",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("circuit", "Le financement du parti par un circuit étranger", 55);
      c.adj({ power: { parti: 22, popularite: 2 }, player: { integrite: -10, cynisme: 8 } });
      c.nation("paysbas", { savoir: 25 });
      c.nation("royaumeuni", { savoir: 15 });
      c.rel("zeeman", { loyaute: 15, ambition: 10 });
      c.rel("espitalier", { loyaute: 10 });
      c.sched("circuit_trace", 3, 7, 0.6);
      c.log("Le parti est désormais financé par un circuit passant par trois juridictions.");
      return "Une fondation à Amsterdam, une société de conseil à Jersey, une facture de « veille stratégique » de deux millions par trimestre. Joost Zeeman explique tout au tableau blanc, en trente minutes, et rien de ce qu'il décrit n'est illégal pris séparément. C'est l'assemblage qui l'est. Le trésorier respire pour la première fois depuis deux ans.";
    },
  },
  {
    id: "maquiller_deficit",
    nom: "Arranger les comptes",
    cout: 1,
    detail: "Bercy sait faire. Bruxelles ne regarde pas si près.",
    cond: (s) => (s.country.dette > 128 || s.country.marge < 26) && !s.europe.dossiers.some((d) => d.id === "comptes"),
    opportunite: true,
    rarete: "exceptionnelle",
    icone: "▤",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("comptes", "La sincérité des comptes transmis à Bruxelles", 45);
      c.adj({ country: { marge: 14, dette: -6 }, power: { popularite: 4, patronat: 5 }, player: { integrite: -8 } });
      c.nation("commission", { savoir: 20, relation: 6 });
      c.nation("allemagne", { savoir: 12 });
      c.rel("danglade", { loyaute: -8, rancune: 10 });
      c.sched("comptes_eurostat", 3, 8, 0.6);
      c.log("Les comptes transmis à la Commission ont été « retraités ».");
      return "Trois recettes exceptionnelles anticipées, deux dettes d'hôpitaux sorties du périmètre, une soulte requalifiée. Danglade signe en demandant que sa réserve figure au procès-verbal — ce qui, le jour venu, sera la seule ligne qui comptera. Bruxelles valide en six semaines. Eurostat, lui, prend deux ans, et il n'oublie pas.";
    },
  },
  {
    id: "operation_speciale",
    nom: "Autoriser l'opération",
    cout: 2,
    detail: "Soubeyran, minuit, une chemise cartonnée. Il vaut mieux ne pas l'ouvrir.",
    cond: (s) => s.derive >= 5 && s.power.armee > 45 && !s.europe.dossiers.some((d) => d.id === "operation"),
    opportunite: true,
    rarete: "historique",
    icone: "☠",
    tone: "var(--color-bad)",
    effects: (c) => {
      c.dossier("operation", "L'opération conduite à l'étranger sans mandat", 85);
      c.derive(2);
      c.adj({ country: { securite: 10 }, power: { armee: 8 }, hidden: { paranoia: 18 }, player: { integrite: -14, cynisme: 12 } });
      c.rel("soubeyran", { loyaute: 12 });
      c.nation("royaumeuni", { savoir: 30 });
      c.toutesNations({ savoir: 8 }, ["royaumeuni"]);
      c.sched("operation_suite", 2, 5, 0.8);
      c.log("Vous avez autorisé une opération clandestine hors du territoire.");
      return "La chemise contient quatre pages et une photographie. Soubeyran ne dit pas le mot, il dit « neutralisation d'une capacité de nuisance », et il attend. Vous signez en bas à droite. Onze jours plus tard, un fait divers à l'étranger occupe deux colonnes puis disparaît. Vous êtes désormais quelqu'un que trois personnes peuvent détruire d'une phrase.";
    },
  },
];

