import type { Ctx, GameState } from "../../engine/types";

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
  needParam?: "reforme" | "personnage" | "region";
  /** Candidats proposés quand l'action porte sur quelqu'un. */
  candidats?: (s: GameState) => string[];
  /** Toujours proposée (socle) plutôt que soumise au tirage. */
  socle?: boolean;
  /** Nombre de semestres avant de pouvoir la reprendre. */
  cooldown?: number;
  /** Opportunité : n'apparaît que si la situation s'y prête, et frappe fort. */
  opportunite?: boolean;
  icone: string;
  tone: string;
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
    cooldown: 8,
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
    cooldown: 5,
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
    cooldown: 5,
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
    cooldown: 4,
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
    cooldown: 5,
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
    id: "grande_cause",
    nom: "Lancer la grande cause du mandat",
    cout: 2,
    detail: "Un sujet, cinq ans, votre nom dessus.",
    cond: (s) => s.turn <= 4 && !s.flags["grande_cause"],
    opportunite: true,
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
];

