import type { Ctx, GameState } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les actions de capital politique (3 points par trimestre — jamais assez).
// ---------------------------------------------------------------------------

export interface ActionDef {
  id: string;
  nom: string;
  cout: number;
  detail: string;
  cond?: (s: GameState) => boolean;
  effects: (c: Ctx, param?: string) => string;
  needParam?: "reforme" | "personnage" | "region";
}

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
      return "Le compte à rebours est lancé : le projet part en concertation, c'est-à-dire au front. Rendez-vous au prochain trimestre pour la table des négociations — apportez votre casque.";
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
      return "Salaires, lits, gouvernance : le plan est complet et coûteux. Ses effets réels arriveront dans deux à trois ans — vos ennuis de trésorerie, eux, commencent ce trimestre.";
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

export const ACTIONS: ActionDef[] = [
  {
    id: "reforme",
    nom: "Lancer une réforme",
    cout: 0, // le coût est celui de la réforme choisie
    detail: "Engager un grand chantier. Deux à trois points de capital.",
    needParam: "reforme",
    effects: (c, param) => {
      const ref = REFORMES.find((r) => r.id === param);
      if (!ref) return "Aucune réforme choisie.";
      return ref.effects(c);
    },
  },
  {
    id: "remaniement",
    nom: "Remanier le gouvernement",
    cout: 1,
    detail: "Changer de Premier ministre : le fusible classique.",
    cond: (s) => s.characters["rochefort"].enPoste,
    effects: (c) => {
      const r = c.s.characters["rochefort"];
      r.enPoste = false;
      c.rel("rochefort", { rancune: 15, loyaute: -20 });
      c.adj({ power: { popularite: 6, parti: -4 } });
      c.press("« Rochefort limogée : le fusible a sauté » — L'Écho Républicain", "neutre");
      c.log("Vous avez limogé la Première ministre Hélène Rochefort.");
      return "Hélène Rochefort remet sa démission « à votre demande », selon la formule qui ne trompe personne. Un nouveau Premier ministre, plus terne et plus docile, prend Matignon. L'opinion respire — les fusibles servent à ça. Vous n'en avez plus. Le prochain qui sautera, c'est vous.";
    },
  },
  {
    id: "deplacement",
    nom: "Se déplacer en région",
    cout: 1,
    detail: "Le terrain. Fatigant, utile, humain.",
    effects: (c) => {
      const cibles = ["periurbain", "ruraux", "pavillonnaires", "quartiers"] as const;
      const cible = c.rng.pick(cibles);
      c.seg(cible, { soutien: 4, participation: 2 });
      c.adj({ hidden: { fatigue: 6, agitation: -2 }, country: { cohesion: 1 } });
      const noms: Record<string, string> = {
        periurbain: "une ville moyenne qui a perdu son usine et garde sa fierté",
        ruraux: "un canton où la sous-préfecture est le dernier guichet de la République",
        pavillonnaires: "un lotissement où l'on vous parle d'école et de rond-point — le giratoire, pas le mouvement",
        quartiers: "un quartier où personne n'attendait un président, ce qui rend la visite utile",
      };
      return `Une journée dans ${noms[cible]}. Des mains serrées, deux engueulades saines, un café offert par quelqu'un qui « ne vote plus ». Le pays réel recharge une petite batterie que l'Élysée décharge.`;
    },
  },
  {
    id: "renflouer",
    nom: "Renflouer un secteur",
    cout: 2,
    detail: "De l'argent, tout de suite, là où ça saigne.",
    effects: (c) => {
      c.adj({ country: { marge: -5, services: 4 }, hidden: { agitation: -4 } });
      return "Une enveloppe d'urgence part vers le secteur qui criait le plus fort ce trimestre. Le soulagement est réel et provisoire — c'est le propre des perfusions. Danglade a signé en fermant les yeux, littéralement.";
    },
  },
  {
    id: "sommet",
    nom: "Recevoir un chef d'État",
    cout: 1,
    detail: "Tapis rouge, garde républicaine, contrats.",
    effects: (c) => {
      c.adj({ country: { prestige: 3 } });
      c.rel("weiss", { loyaute: 2 });
      c.press("« Paris au centre du jeu » — les images du sommet font le tour des chancelleries", "favorable");
      return "Deux jours de protocole millimétré, une déclaration commune, un contrat industriel à la clé. La diplomatie est le seul théâtre où la France joue encore dans la catégorie au-dessus de son PIB — autant occuper la scène.";
    },
  },
  {
    id: "seconde_source",
    nom: "Demander une seconde source",
    cout: 1,
    detail: "Ternay, en tête-à-tête. Les vrais chiffres — ceux qu'on vous cache.",
    effects: (c) => {
      const h = c.s.hidden;
      const lignes: string[] = [];
      lignes.push(`Agitation réelle : ${Math.round(h.agitation)}/100 (l'Intérieur vous annonçait ${Math.round(h.agitation * 0.75)}).`);
      if (h.coup > 25) lignes.push(`« Certains cercles militaires parlent. Niveau de risque : ${h.coup > 55 ? "sérieux" : "à surveiller"}. »`);
      if (h.assassinat > 25) lignes.push(`« Nous avons renforcé votre protection. Ne posez pas de questions sur les raisons. Niveau : ${h.assassinat > 55 ? "élevé" : "notable"}. »`);
      if (lignes.length === 1) lignes.push("« Pour le reste, rien que vous ne deviez savoir. Dormez — c'est un conseil professionnel. »");
      c.adj({ hidden: { paranoia: 2 } });
      return "Ternay vous reçoit sans dossier — tout est dans sa tête, c'est sa police d'assurance. " + lignes.join(" ");
    },
  },
  {
    id: "repos",
    nom: "Se reposer",
    cout: 1,
    detail: "Trois jours à la Lanterne. La presse ricanera.",
    effects: (c) => {
      c.adj({ hidden: { fatigue: -22, sante: 3 } });
      c.rel("conjoint", { loyaute: 5 });
      c.press("« Le Président au vert pendant que la France attend » — Philippe Bec, agacé de service", "satirique");
      return "Trois jours sans cortège ni dossier rouge. Vous dormez neuf heures, marchez en forêt, réapprenez le prénom de vos gardes du corps. Bec s'indigne dans son éditorial. Son indignation est le prix d'un service que personne d'autre ne vous rendra : durer.";
    },
  },
  {
    id: "famille",
    nom: "Du temps en famille",
    cout: 1,
    detail: "Ce que le pouvoir dévore en premier.",
    effects: (c) => {
      c.rel("conjoint", { loyaute: 8, rancune: -3 });
      c.adj({ hidden: { fatigue: -8 } });
      return "Un week-end entier, téléphones dans un tiroir — le protocole a protesté, vous avez tenu. Rien de politique ne s'y est passé, ce qui en fait le meilleur investissement du trimestre : les jauges qui comptent vraiment ne sont pas affichées non plus.";
    },
  },
];
