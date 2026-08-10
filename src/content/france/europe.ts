import type { GameEvent, GameState } from "../../engine/types";
import { nomCompletDe, nomDe } from "../../engine/noms";
import { alliees, defDe, dossierDe, etoufferDossier, hostiles, menaceExterieure } from "../../engine/europe";

// ---------------------------------------------------------------------------
// L'Europe, côté salle et côté cuisine.
//
// Trois familles de fils s'y croisent :
//  — le plateau (élections chez les autres, blocs, chantages, ripostes) ;
//  — les dossiers (ce qu'on a fait et qui laisse une trace) ;
//  — l'enquête (ce que la trace finit par produire, étape par étape).
//
// La règle d'écriture : aucun de ces fils ne doit se refermer tout seul. Un
// dossier étouffé reste un dossier ; une capitale humiliée s'en souvient ; une
// procureure dessaisie a des successeurs.
// ---------------------------------------------------------------------------

/** La capitale qui en sait trop et ne vous aime pas — le danger, nommé. */
function maitreChanteur(s: GameState) {
  return menaceExterieure(s);
}

function nationElue(s: GameState) {
  const id = s.flags["election_etrangere"];
  return typeof id === "string" ? defDe(id) : undefined;
}

export const EVENTS_EUROPE: GameEvent[] = [
  // =========================================================================
  // Le plateau bouge tout seul
  // =========================================================================
  {
    id: "europe_election",
    kind: "monde",
    titre: "Ils ont voté, eux aussi",
    weight: 0,
    cond: (s) => !!nationElue(s),
    texte: (s) => {
      const def = nationElue(s)!;
      const ecart = (s.flags["election_etrangere_ecart"] as number) ?? 0;
      const st = s.europe.nations[def.id];
      const proche = Math.abs(s.bord - st.bord) <= 3;
      if (Math.abs(ecart) >= 5) {
        return `${def.capitale} a basculé. Pas infléchi : basculé. La coalition sortante est balayée, et celle qui arrive a fait campagne sur l'inverse exact de ce que la France défend depuis deux ans — ou sur exactement la même chose, ce qui, dans les deux cas, change tout. Le Quai d'Orsay vous remet une note de quatre pages dont la première phrase est : « Nos hypothèses de travail sur ${def.nom} sont caduques. » ${proche ? "Le nouveau gouvernement vous ressemble beaucoup. C'est une chance, et un problème : on vous prêtera désormais tout ce qu'il fera." : "Le nouveau gouvernement ne vous ressemble en rien. Vos alliés d'hier vont devoir choisir."}`;
      }
      return `Élections à ${def.capitale}. Le sortant se maintient de justesse, au prix d'une coalition qui ne tiendra pas trois ans, et il rentre chez lui affaibli — donc plus dur en négociation, pas moins. Le Quai note sobrement que « la fenêtre de coopération se réduit ». ${proche ? "Vous restez proches sur le fond, ce qui vous laisse un allié fragile plutôt qu'un adversaire solide." : "L'écart avec Paris se creuse encore d'un cran."}`;
    },
    choices: [
      {
        id: "feliciter_vite",
        label: "Décrocher le premier",
        detail: "Appeler avant tout le monde. Ça ne coûte rien et ça se retient longtemps.",
        effects: (c) => {
          const def = nationElue(c.s);
          if (def) c.nation(def.id, { relation: 12, faveurs: 6 });
          c.adj({ country: { influence: 2 } });
          c.flag("election_etrangere", false);
          return "Vous appelez à 23 h 40, avant les résultats définitifs, avant Berlin, avant Washington. La conversation dure onze minutes et ne porte sur rien. Elle sera pourtant citée par votre interlocuteur pendant deux ans, chaque fois qu'on lui demandera qui est son meilleur partenaire en Europe. Les gestes gratuits sont les seuls qu'on n'oublie pas.";
        },
      },
      {
        id: "attendre_voir",
        label: "Attendre de voir",
        detail: "Ne rien engager avec un gouvernement qui n'a pas encore montré son visage.",
        effects: (c) => {
          c.adj({ player: { strategie: 2 } });
          c.flag("election_etrangere", false);
          return "Le Quai plaide pour la prudence, et le Quai a souvent raison : on a vu des gouvernements durer six semaines. Vous attendez. C'est sage, ça n'engage rien, et ça ne rapporte rien non plus — en diplomatie, la prudence est un placement sans intérêts.";
        },
      },
      {
        id: "prendre_distance",
        label: "Marquer la distance publiquement",
        detail: "Dire tout haut ce que leur campagne avait de détestable.",
        cond: (s) => {
          const def = nationElue(s);
          return !!def && Math.abs(s.bord - s.europe.nations[def.id].bord) >= 6;
        },
        risque: 2,
        effects: (c) => {
          const def = nationElue(c.s);
          if (def) c.nation(def.id, { relation: -25 });
          c.adj({ country: { prestige: 3, influence: -4 }, power: { popularite: 5 }, player: { integrite: 5 } });
          c.seg("urbains", { soutien: 5 });
          c.flag("election_etrangere", false);
          return "Vous nommez les choses au perchoir, sans périphrase diplomatique : ce qui a été dit pendant cette campagne était indigne, et la France ne fera pas semblant de l'ignorer. Le pays apprécie, une partie de l'Europe aussi, et vous venez de vous fermer une capitale pour la durée d'une législature. Il y a des positions qui valent leur prix ; encore faut-il l'avoir calculé.";
        },
      },
    ],
  },

  {
    id: "europe_chantage",
    kind: "intrigue",
    titre: "Ce qu'ils savent",
    weight: (s) => {
      const m = menaceExterieure(s);
      return m && s.europe.dossiers.some((d) => !d.public) ? 2.4 : 0;
    },
    cond: (s) => !!menaceExterieure(s) && s.europe.dossiers.some((d) => !d.public),
    texte: (s) => {
      const m = maitreChanteur(s)!;
      const dossier = s.europe.dossiers.find((d) => !d.public)!;
      return `L'ambassadeur demande un entretien « sans note ». Il vient seul, ce qui n'arrive jamais, et il parle de la pluie pendant dix minutes. Puis il pose sur la table une chemise fine et ne l'ouvre pas. « Nos services ont reconstitué certaines choses concernant ${dossier.titre.toLowerCase()}. Rien ne sortira, évidemment. Nous tenons trop à notre relation. » Un silence. « À ce propos : ${m.capitale} attend beaucoup du vote de jeudi. »`;
    },
    choices: [
      {
        id: "ceder_chantage",
        label: "Voter comme ils veulent",
        detail: "Payer. Une fois. On paie toujours une fois.",
        effects: (c) => {
          const m = maitreChanteur(c.s);
          if (m) c.nation(m.id, { relation: 10, faveurs: -20, savoir: 5 });
          c.adj({ country: { influence: -9, prestige: -4 }, player: { integrite: -5 }, hidden: { paranoia: 10 } });
          c.toutesNations({ relation: -4 }, m ? [m.id] : []);
          c.flag("chantage_paye");
          c.sched("europe_chantage_retour", 2, 5, 0.75);
          return "Jeudi, la France vote contre sa propre position de la semaine précédente. Le Quai réécrit trois fois l'argumentaire avant de renoncer à en produire un. Personne n'y croit et personne ne demande. Vous avez acheté un silence contre une voix — le problème des silences achetés, c'est qu'ils se rachètent.";
        },
      },
      {
        id: "refuser_chantage",
        label: "Refuser, et le dire",
        detail: "Sortir soi-même le sujet avant qu'ils ne le fassent.",
        risque: 3,
        aptitude: "strategie",
        effects: (c) => {
          const m = maitreChanteur(c.s);
          const d = c.s.europe.dossiers.find((x) => !x.public);
          if (m) c.nation(m.id, { relation: -20 });
          if (d) {
            d.public = true;
            c.adj({ power: { presse: -14, popularite: -12 }, hidden: { soupcons: 20 } });
          }
          c.adj({ player: { integrite: 6 }, country: { influence: 3 } });
          c.press("« LE PRÉSIDENT PREND LES DEVANTS » — l'aveu partiel occupe six pages et ne convainc personne", "hostile");
          return "Vous convoquez la presse le lendemain matin et vous racontez une version — la vôtre, incomplète mais vérifiable. L'ambassadeur apprend la nouvelle à la radio. Vous perdez énormément en une matinée, et vous cessez d'être tenu. Ce sont deux choses différentes, et une seule des deux se récupère.";
        },
      },
      {
        id: "retourner_chantage",
        label: "Chercher ce qu'on a sur eux",
        detail: "Soubeyran écoute la question sans lever les yeux.",
        cond: (s) => s.derive >= 3,
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const m = maitreChanteur(c.s);
          const ok = c.s.player.reseau + c.s.power.armee * 0.3 + c.rng.int(-20, 20) > 60;
          c.derive(1);
          if (ok) {
            if (m) c.nation(m.id, { relation: 5, savoir: -20 });
            c.adj({ hidden: { paranoia: 12 }, player: { cynisme: 8 } });
            c.rel("soubeyran", { loyaute: 8 });
            return "Onze jours plus tard, une chemise arrive sur votre bureau. Elle concerne un membre de leur gouvernement, une société chypriote et un chantier de dessalement. Vous ne vous en servez pas : il suffit que l'ambassadeur sache qu'elle existe. Le vote de jeudi n'est plus évoqué. On appelle ça un équilibre ; ça n'en est pas un, c'est un dépôt d'armes.";
          }
          if (m) c.nation(m.id, { relation: -18, savoir: 12 });
          c.adj({ hidden: { paranoia: 18, soupcons: 12 }, player: { integrite: -6 } });
          c.dossier("espionnage_allie", "La surveillance d'un partenaire européen", 50);
          return "L'équipe est repérée en quatre jours. Un ministre étranger tient une conférence de presse avec les photos. La France espionnait un partenaire pour se protéger d'un chantage sur un dossier qu'elle nie — chaque partie de cette phrase aggrave la précédente, et elle sera imprimée telle quelle.";
        },
      },
    ],
  },

  {
    id: "europe_finance_opposition",
    kind: "intrigue",
    titre: "L'argent vient de loin",
    weight: (s) => (hostiles(s).length > 0 && s.vendetta && s.vendetta.etape >= 2 ? 2.8 : 0),
    cond: (s) => hostiles(s).length > 0 && !!s.vendetta && s.vendetta.etape >= 2 && !s.vendetta.desamorcee,
    texte: (s) => {
      const h = hostiles(s).filter((d) => !d.institution)[0] ?? hostiles(s)[0];
      const cible = s.vendetta!.id;
      return `Ternay vient sans dossier, ce qui veut dire qu'il ne veut rien laisser d'écrit. « Une fondation enregistrée à ${h.capitale} finance depuis huit mois trois think tanks, deux chaînes en ligne et une série de sondages. Tous concluent la même chose. » Il marque un temps. « Et depuis six semaines, elle finance aussi les déplacements de ${nomCompletDe(s, cible)}. » Ce n'est plus une rancune intérieure : c'est une rancune avec un budget et une politique étrangère derrière.`;
    },
    choices: [
      {
        id: "denoncer_ingerence",
        label: "Dénoncer l'ingérence publiquement",
        detail: "Nommer le pays, montrer les flux. Et assumer la crise diplomatique.",
        risque: 2,
        aptitude: "rhetorique",
        effects: (c) => {
          const h = hostiles(c.s).filter((d) => !d.institution)[0] ?? hostiles(c.s)[0];
          if (h) c.nation(h.id, { relation: -25 });
          c.adj({ country: { cohesion: 6, influence: -5 }, power: { popularite: 8, presse: 5 } });
          // L'accusation d'ingérence protège aussi la cible : elle devient une
          // victime, ce qui est exactement ce qu'il lui manquait.
          if (c.s.vendetta) c.rel(c.s.vendetta.id, { rancune: 12 });
          c.press("« LA MAIN ÉTRANGÈRE » — les flux financiers sont publiés en fac-similé, l'ambassade parle de « fantasme »", "favorable");
          c.log("Vous avez publiquement dénoncé une ingérence étrangère dans le débat français.");
          return "Vous sortez les relevés en conférence de presse, avec les montants et les dates. Le pays se resserre — rien ne rassemble comme un ennemi extérieur nommé. Mais l'homme que vous vouliez atteindre au passage devient, en une soirée, l'opposant qu'on essaie de salir en le disant vendu à l'étranger. Vous venez de lui offrir la seule chose qui lui manquait : une injustice.";
        },
      },
      {
        id: "couper_flux",
        label: "Assécher discrètement",
        detail: "Bercy, Tracfin, les banques. Sans un mot en public.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          const h = hostiles(c.s).filter((d) => !d.institution)[0] ?? hostiles(c.s)[0];
          if (h) c.nation(h.id, { relation: -8, savoir: 6 });
          c.adj({ country: { securite: 3 }, hidden: { paranoia: 6 } });
          if (c.s.vendetta) {
            c.rel(c.s.vendetta.id, { rancune: 6 });
            c.s.vendetta.depuis = c.s.turnCount + 1;
          }
          c.derive(1);
          return "Trois comptes gelés « pour vérification de conformité », deux agréments suspendus, un prestataire qui découvre qu'il ne peut plus être payé. Rien ne sort. Le fil se grippe, l'homme perd deux mois — et les gens autour de lui apprennent que déplaire coûte son banquier. C'est efficace, et c'est le genre de méthode dont on garde ensuite l'habitude.";
        },
      },
      {
        id: "acheter_la_cible",
        label: "Racheter l'homme, pas le flux",
        detail: "Ils l'ont acheté. On peut surenchérir.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const ok = c.s.player.cynisme + c.s.player.reseau * 0.5 + c.rng.int(-18, 22) > 70;
          if (ok && c.s.vendetta) {
            c.rel(c.s.vendetta.id, { rancune: -35, loyaute: 10 });
            c.s.vendetta.desamorcee = true;
            c.adj({ player: { integrite: -8, cynisme: 6 }, country: { marge: -3 } });
            return "Une présidence d'agence, un logement de fonction, un maroquin honorifique dans un organisme dont personne ne connaît le sigle. Il accepte en quarante-huit heures, et son financement étranger s'arrête de lui-même — on ne paie pas quelqu'un qui n'attaque plus. Vous avez éteint un incendie en achetant l'incendiaire. Il le sait, vous le savez, et cela vous lie tous les deux.";
          }
          c.adj({ player: { integrite: -8 }, hidden: { soupcons: 10 } });
          if (c.s.vendetta) c.rel(c.s.vendetta.id, { rancune: 20 });
          c.dossier("achat_opposant", "La proposition faite à un opposant", 35);
          return "Il écoute la proposition jusqu'au bout, poliment. Puis il la répète mot pour mot à trois journalistes, avec la date, l'heure et le nom de l'émissaire. Tenter d'acheter quelqu'un qui vous hait, c'est lui fournir la preuve de tout ce qu'il racontait sur vous.";
        },
      },
    ],
  },

  {
    id: "europe_chantage_retour",
    kind: "intrigue",
    titre: "Ils rappellent",
    weight: 0,
    cond: (s) => !!s.flags["chantage_paye"],
    texte: (s) => {
      const m = maitreChanteur(s) ?? hostiles(s)[0] ?? defDe("royaumeuni")!;
      return `Le même ambassadeur, le même salon, la même chemise fine — un peu plus épaisse. Il ne parle même plus de la pluie. « ${m.capitale} a beaucoup apprécié votre compréhension au printemps. Nous aurions besoin, cette fois, d'une position française sur le dossier énergétique. » Il sourit. « Et d'un consulat, à terme. » On ne sort pas d'un chantage en payant : on s'y abonne.`;
    },
    choices: [
      {
        id: "payer_encore",
        label: "Payer encore",
        detail: "Il n'y a rien d'autre à faire. C'est ce qu'ils comptent bien vous faire croire.",
        effects: (c) => {
          const m = maitreChanteur(c.s);
          if (m) c.nation(m.id, { relation: 6, faveurs: -25, savoir: 8 });
          c.adj({ country: { influence: -14, prestige: -7 }, hidden: { paranoia: 14 }, player: { integrite: -6 } });
          c.toutesNations({ relation: -6 }, m ? [m.id] : []);
          c.sched("europe_chantage_retour", 2, 4, 0.7);
          return "Vous payez. La position française sur l'énergie change de trois degrés, ce que personne ne remarque, sauf les vingt-six capitales qui suivent ces choses de très près. Le Quai d'Orsay commence à écrire ses notes en supposant que Paris n'est plus libre de ses votes — et le pire, c'est que la note est juste.";
        },
      },
      {
        id: "tout_publier",
        label: "Tout mettre sur la table",
        detail: "Le dossier, le chantage, le vote de jeudi. Tout, d'un coup.",
        risque: 3,
        aptitude: "rhetorique",
        effects: (c) => {
          const m = maitreChanteur(c.s);
          const d = c.s.europe.dossiers.find((x) => !x.public);
          if (m) c.nation(m.id, { relation: -35 });
          if (d) d.public = true;
          c.adj({ power: { presse: -10, popularite: -14 }, hidden: { soupcons: 25 }, player: { integrite: 10 }, country: { influence: 6 } });
          c.flag("chantage_paye", false);
          c.flag("aveu_public");
          c.press("« J'AI CÉDÉ, ET JE M'ARRÊTE » — l'allocution de dix minutes est diffusée sans commentaire par toutes les chaînes", "neutre");
          c.log("Vous avez révélé vous-même le chantage étranger dont vous étiez l'objet.");
          return "Dix minutes en direct, sans prompteur : le dossier, le chantage, le vote que vous avez changé, et la phrase que personne n'attendait — « je me mets à la disposition de la justice ». C'est une catastrophe politique immédiate et la seule sortie qui n'ait pas de suite. Les vingt-six capitales le notent aussi : la France redevient un partenaire dont les votes signifient quelque chose.";
        },
      },
    ],
  },

  {
    id: "isolement_montee",
    kind: "intrigue",
    titre: "La chaise vide",
    weight: 0,
    texte: (s) => {
      const perdus = hostiles(s).filter((d) => !d.institution);
      return `Le Quai d'Orsay ne fait plus de notes de synthèse sur l'Europe : il fait des notes sur l'absence de la France en Europe, ce qui est un genre différent. Trois réunions préparatoires se sont tenues sans nous. Un format à six s'est constitué, dont Paris n'est pas. ${perdus.length > 0 ? `${perdus.map((d) => d.capitale).join(", ")} ne répondent plus qu'aux courriers officiels, et avec le délai réglementaire.` : "Les capitales répondent, poliment, et ne proposent rien."} L'ambassadeur de France auprès de l'Union demande à être reçu. Il a préparé deux pages. Il n'en lira qu'une phrase : « Monsieur le Président, à ce rythme, il n'y aura plus rien à réintégrer. »`;
    },
    choices: [
      {
        id: "isolement_tournee",
        label: "Aller les voir, toutes, une par une",
        detail: "Six semaines de route. Rien d'autre à l'agenda.",
        risque: 2,
        aptitude: "endurance",
        effects: (c) => {
          c.toutesNations({ relation: 18 });
          c.adj({ country: { influence: 12, prestige: 4 }, hidden: { fatigue: 26 }, power: { popularite: -6 } });
          c.flag("isolement_alerte", false);
          c.log("Vous avez fait le tour des capitales pour rompre l'isolement de la France.");
          return "Onze capitales en six semaines, sans délégation, sans communiqué commun, sans rien à annoncer. Vous écoutez plus que vous ne parlez, ce qui n'était pas arrivé depuis longtemps, et vous apprenez précisément ce que chacune vous reproche. Rien n'est réglé. Mais on recommence à vous appeler avant les réunions, et c'est de là que tout repart.";
        },
      },
      {
        id: "isolement_concession",
        label: "Payer le prix qu'ils demandent",
        detail: "Céder sur le dossier qui bloque tout. Ça se verra à l'intérieur.",
        effects: (c) => {
          c.toutesNations({ relation: 14 });
          c.adj({ country: { influence: 9, marge: -10 }, power: { popularite: -10, presse: -4 } });
          c.seg("ruraux", { soutien: -6 });
          c.seg("periurbain", { soutien: -5 });
          c.flag("isolement_alerte", false);
          return "Vous cédez, en une fois, sur le dossier qui empoisonnait tout depuis deux ans. Les portes se rouvrent en quinze jours — c'est le prix affiché, il était connu. À l'intérieur, l'opposition parle de capitulation et une partie de votre camp aussi, avec les mêmes mots, ce qui est plus embêtant.";
        },
      },
      {
        id: "isolement_assumer",
        label: "Assumer la solitude",
        detail: "La France a raison seule. Ça s'est déjà vu.",
        risque: 3,
        effects: (c) => {
          c.adj({ power: { popularite: 8 }, country: { influence: -6, prestige: -5 } });
          c.toutesNations({ relation: -6 });
          c.seg("ruraux", { soutien: 5 });
          c.dire("europe", "La France n'a besoin de la permission de personne. Elle n'en a jamais eu besoin", "devant les ambassadeurs réunis");
          return "Vous recevez les ambassadeurs et vous leur dites, en substance, que la France n'a pas à demander la permission. La phrase fait un tabac à l'intérieur et un froid considérable partout ailleurs. Il y a des moments de l'Histoire où avoir raison seul a payé. Il faut, pour cela, que le reste tienne — et le reste, en ce moment, ne tient pas.";
        },
      },
    ],
  },

  {
    id: "zeeman_approche",
    kind: "intrigue",
    titre: "Le déjeuner de M. Zeeman",
    once: true,
    weight: (s) => (s.power.parti < 45 && !s.europe.dossiers.some((d) => d.id === "circuit") ? 2.2 : 0),
    cond: (s) => s.turnCount >= 2 && !s.europe.dossiers.some((d) => d.id === "circuit"),
    texte: (s) =>
      `Le trésorier du parti insiste depuis trois semaines pour ce déjeuner et refuse de dire pourquoi par téléphone. L'homme s'appelle ${nomCompletDe(s, "zeeman")}, il est néerlandais, il a l'air d'un professeur de mathématiques fatigué et il ne demande rien. Il expose. Une fondation, une société de conseil, un flux de facturation, trois juridictions. « Chaque brique est légale et vérifiable. Je ne vous propose rien d'illégal, monsieur le Président. Je vous propose de ne pas être le seul parti d'Europe à se financer comme en 1988. » Le trésorier regarde ses mains.`,
    choices: [
      {
        id: "zeeman_refuser",
        label: "Non. Tout de suite, et devant témoin",
        detail: "Le dire clairement, pour que le trésorier l'entende aussi.",
        effects: (c) => {
          c.adj({ player: { integrite: 8 }, power: { parti: -6 } });
          c.rel("zeeman", { rancune: 10 });
          c.rel("espitalier", { rancune: 8 });
          c.flag("circuit_refuse");
          return "Vous dites non avant le café, sans négocier, et vous le redites au trésorier une fois seuls, dans des termes qu'il n'oubliera pas. Le parti restera pauvre. Vous venez aussi de vous priver de la seule excuse dont vous auriez pu vous servir plus tard — celle de n'avoir pas su. C'est un luxe, et il se paiera en trésorerie pendant cinq ans.";
        },
      },
      {
        id: "zeeman_ecouter",
        label: "Demander une note écrite",
        detail: "Ne rien décider. Juste voir à quoi ça ressemble sur le papier.",
        risque: 2,
        effects: (c) => {
          c.adj({ hidden: { soupcons: 8 }, player: { cynisme: 4 } });
          c.rel("zeeman", { loyaute: 10 });
          c.nation("paysbas", { savoir: 8 });
          c.sched("zeeman_approche", 2, 4, 0.6);
          return "Il envoie la note le lendemain, par porteur, en un seul exemplaire, non signée. Elle fait quatre pages et elle est brillante. Vous ne décidez rien, et vous ne la détruisez pas non plus — vous la rangez. Il n'existe pas de manière neutre de conserver un document pareil : le simple fait qu'il soit dans votre coffre est déjà une position.";
        },
      },
      {
        id: "zeeman_accepter",
        label: "Ouvrir le circuit",
        detail: "Le parti respire. Personne ne saura. Personne ne sait jamais.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          c.dossier("circuit", "Le financement du parti par un circuit étranger", 55);
          c.adj({ power: { parti: 20 }, player: { integrite: -10, cynisme: 8 } });
          c.nation("paysbas", { savoir: 25 });
          c.rel("zeeman", { loyaute: 15 });
          c.rel("espitalier", { loyaute: 12 });
          c.sched("circuit_trace", 3, 7, 0.6);
          c.log("Le parti est désormais financé par un circuit passant par trois juridictions.");
          return "Vous ne signez rien : c'est tout l'intérêt du montage. Une poignée de main, un numéro de dossier, et deux millions par trimestre qui remontent d'une société de conseil dont l'objet social est « la veille stratégique ». Le trésorier vous serre la main à la sortie avec une reconnaissance qui vous met mal à l'aise, et vous avez raison qu'elle vous mette mal à l'aise.";
        },
      },
    ],
  },

  {
    id: "farkas_pacte",
    kind: "intrigue",
    titre: "L'ami de Budapest",
    once: true,
    weight: (s) => (s.derive >= 4 && Math.abs(s.bord) >= 5 ? 2.5 : 0),
    cond: (s) => s.derive >= 3,
    texte: (s) =>
      `${nomCompletDe(s, "farkas")} vous prend à part dans un couloir de sommet, sans interprète, dans un anglais approximatif et joyeux. « Ils vous font le même coup qu'à moi. Les rapports, les valeurs, l'État de droit. » Il rit. « Vous savez ce que j'ai compris en quinze ans ? Que l'article 7 n'est jamais voté, parce qu'il faut l'unanimité. Il suffit d'être deux. » Il pose une main sur votre bras. « Vous me couvrez, je vous couvre. On ne signe rien. On n'a jamais besoin de signer, entre gens qui ont compris. »`,
    choices: [
      {
        id: "farkas_pacte_oui",
        label: "Serrer la main",
        detail: "Une assurance contre Bruxelles. Elle ne coûte rien aujourd'hui.",
        risque: 2,
        effects: (c) => {
          c.nation("hongrie", { relation: 35, faveurs: 15 });
          c.nation("commission", { relation: -18 });
          c.toutesNations({ relation: -10 }, ["hongrie"]);
          c.adj({ country: { influence: -8, prestige: -6 } });
          c.rel("farkas", { loyaute: 30 });
          c.flag("pacte_budapest");
          c.derive(1);
          c.log("Un pacte de blocage mutuel a été noué avec Budapest.");
          return "Rien n'est signé, rien n'est écrit, et tout le monde le sait dans les quarante-huit heures — c'est la particularité des pactes de couloir. Vous êtes désormais protégé contre toute sanction européenne, et vous avez perdu en une poignée de main la totalité de ce que la France appelait sa position morale. Elle valait beaucoup plus cher que vous ne le pensiez.";
        },
      },
      {
        id: "farkas_pacte_non",
        label: "Retirer votre bras",
        detail: "Ne pas être rangé dans cette catégorie. Pas encore.",
        effects: (c) => {
          c.nation("hongrie", { relation: -20 });
          c.nation("commission", { relation: 12 });
          c.toutesNations({ relation: 6 }, ["hongrie", "commission"]);
          c.adj({ country: { prestige: 4, influence: 3 }, player: { integrite: 5 } });
          c.rel("farkas", { rancune: 20 });
          return "Vous retirez votre bras et vous répondez que la France n'a pas besoin d'être couverte. Il sourit, hausse les épaules, et vous dit une phrase que vous entendrez encore dans dix ans : « Vous reviendrez me voir. » Ce qui est désagréable, ce n'est pas la menace. C'est qu'il ne menaçait pas : il constatait une trajectoire.";
        },
      },
    ],
  },

  {
    id: "soubeyran_dossier",
    kind: "intrigue",
    titre: "L'option la plus courte",
    once: true,
    weight: (s) => (s.derive >= 5 && s.hidden.paranoia > 40 ? 2 : 0),
    cond: (s) => s.derive >= 4 && !s.europe.dossiers.some((d) => d.id === "operation"),
    texte: (s) =>
      `${nomCompletDe(s, "soubeyran")} demande huit minutes en fin de journée, sans note au secrétariat. Il décrit une menace — précise, documentée, extérieure, réelle. Puis il décrit trois options : la voie judiciaire, qui prendra quatre ans ; la voie diplomatique, qui ne donnera rien ; et une troisième, qu'il ne nomme pas et pour laquelle il a apporté une chemise cartonnée qu'il n'ouvre pas. « Je ne vous recommande rien, monsieur le Président. Je vous présente l'éventail. » L'éventail, dans ce métier, est toujours présenté dans l'ordre où l'on souhaite qu'il soit lu.`,
    choices: [
      {
        id: "soubeyran_judiciaire",
        label: "La voie judiciaire",
        detail: "Quatre ans, un résultat incertain, et rien à cacher.",
        effects: (c) => {
          c.adj({ country: { securite: -3 }, player: { integrite: 6 }, power: { justice: 5 } });
          c.rel("soubeyran", { loyaute: -5 });
          return "Vous choisissez la voie longue. Soubeyran acquiesce sans discuter — c'est un professionnel — et referme la chemise, qu'il remportera. La menace sera traitée dans quatre ans, ou pas. Vous saurez toujours que vous aviez le moyen d'aller plus vite, et c'est cette phrase-là que les présidents se répètent la nuit, dans les deux sens.";
        },
      },
      {
        id: "soubeyran_ouvrir",
        label: "Ouvrir la chemise",
        detail: "Juste regarder. On peut toujours refuser après.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          c.dossier("operation", "L'opération conduite à l'étranger sans mandat", 85);
          c.derive(2);
          c.adj({ country: { securite: 9 }, power: { armee: 6 }, hidden: { paranoia: 16 }, player: { integrite: -14, cynisme: 10 } });
          c.rel("soubeyran", { loyaute: 12 });
          c.nation("royaumeuni", { savoir: 25 });
          c.toutesNations({ savoir: 6 }, ["royaumeuni"]);
          c.sched("operation_suite", 2, 5, 0.8);
          c.log("Vous avez autorisé une opération clandestine hors du territoire.");
          return "Vous ouvrez la chemise. Il y a quatre pages et une photographie, et à partir du moment où vous avez vu la photographie il n'existe plus de version de la soirée où vous refusez. C'est pour cela qu'il l'a apportée. Vous signez en bas à droite ; il range le document dans une poche intérieure et vous remercie ; et vous restez seul dans un bureau où quelque chose vient de changer définitivement.";
        },
      },
    ],
  },

  // =========================================================================
  // Les dossiers
  // =========================================================================
  {
    id: "circuit_trace",
    kind: "intrigue",
    titre: "La trace",
    weight: 0,
    cond: (s) => !!dossierDe(s, "circuit"),
    texte: (s) =>
      `${nomCompletDe(s, "ferrand")} n'appelle pas l'Élysée : elle appelle le trésorier du parti, ce qui est beaucoup plus inquiétant. Elle a une facture de « veille stratégique », un numéro de TVA néerlandais et le nom d'une société de Jersey dont le gérant apparaît dans deux autres affaires. Elle demande vingt-quatre heures pour un droit de réponse. Le trésorier vous transfère le courriel à 23 h 12 sans un mot d'accompagnement, ce qui est sa manière de dire qu'il ne portera pas ça tout seul.`,
    choices: [
      {
        id: "fermer_circuit",
        label: "Tout fermer, ce soir",
        detail: "Couper les flux, rendre l'argent, encaisser le trou.",
        effects: (c) => {
          const d = dossierDe(c.s, "circuit");
          if (d) d.gravite = Math.max(10, d.gravite - 30);
          c.adj({ power: { parti: -20, presse: 4 }, player: { integrite: 6 }, hidden: { soupcons: -8 } });
          c.rel("espitalier", { rancune: 15 });
          c.rel("zeeman", { rancune: 20, loyaute: -25 });
          c.rel("ferrand", { loyaute: 5 });
          return "Vous appelez le trésorier à minuit et vous fermez tout : conventions résiliées, sommes restituées, prestataire remercié. Le parti se retrouve avec un trou de deux ans et un secrétaire général qui ne vous le pardonnera pas. Louise Ferrand publie quand même — mais elle publie l'histoire d'un montage arrêté, ce qui est une histoire deux fois moins grave. Ce qui reste, ce sont les dix-huit mois où il a fonctionné.";
        },
      },
      {
        id: "droit_reponse_technique",
        label: "Répondre sur la technique",
        detail: "Tout est légal pris séparément. Le dire, en détail, sans mentir.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          const ok = c.s.player.strategie + c.rng.int(-15, 20) > 58;
          if (ok) {
            c.adj({ power: { presse: -4 }, hidden: { soupcons: 6 } });
            c.nation("paysbas", { savoir: 8 });
            return "Quarante pages de réponse, avec les textes, les avis fiscaux et les précédents. L'article sort quand même, mais amputé : ce qui reste est technique, aride, et illisible à l'antenne. Vous n'avez rien démenti — vous avez rendu la vérité trop ennuyeuse pour tenir un journal télévisé. C'est une victoire qui dure exactement jusqu'à ce que quelqu'un ait le temps de lire.";
          }
          c.adj({ power: { presse: -10, popularite: -6 }, hidden: { soupcons: 16 } });
          const d = dossierDe(c.s, "circuit");
          if (d) d.gravite = Math.min(100, d.gravite + 12);
          return "Votre réponse technique contient une erreur de date. Une seule. Elle est en première ligne de l'article, encadrée, avec la mention « selon le document que nous nous sommes procuré ». Quand on choisit le terrain de la précision, on n'a pas droit à l'à-peu-près.";
        },
      },
      {
        id: "etouffer_circuit",
        label: "Faire taire",
        detail: "Antoine Rives possède 40 % du groupe qui la publie.",
        cond: (s) => s.characters["rives"]?.vivant,
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          etoufferDossier(c.s, "circuit");
          c.derive(2);
          c.adj({ power: { presse: -8 }, player: { integrite: -10, cynisme: 8 }, hidden: { soupcons: 10 } });
          c.rel("rives", { loyaute: -10, ambition: 12 });
          c.rel("ferrand", { rancune: 30 });
          c.flag("ferrand_etouffee");
          c.sched("circuit_ferrand_ailleurs", 2, 5, 0.8);
          c.log("L'enquête sur le financement du parti a été enterrée par une pression sur l'actionnaire.");
          return "Un déjeuner avec Antoine Rives, aucune demande explicite, deux allusions à un dossier d'attribution de fréquences. L'article ne sort pas. Louise Ferrand apprend la décision par une note de trois lignes de son directeur de rédaction. Elle ne démissionne pas et ne proteste pas : elle photographie la note. Vous venez de transformer une journaliste en témoin, et un dossier en deux dossiers.";
        },
      },
    ],
  },

  {
    id: "circuit_ferrand_ailleurs",
    kind: "intrigue",
    titre: "Elle publie ailleurs",
    weight: 0,
    once: true,
    cond: (s) => !!s.flags["ferrand_etouffee"],
    texte: (s) =>
      `Le papier sort à 6 h du matin, dans un consortium de onze rédactions européennes qui publient simultanément dans neuf langues. ${nomDe(s, "ferrand")} n'y signe qu'un des quatre volets. Le premier raconte le montage ; le deuxième, la société de Jersey ; le troisième, deux autres partis européens branchés sur le même tuyau. Le quatrième est un fac-similé de la note de trois lignes par laquelle sa direction lui avait interdit de publier, avec en légende la date du déjeuner à l'Élysée.`,
    choices: [
      {
        id: "assumer_consortium",
        label: "Tout reconnaître, immédiatement",
        detail: "Devancer les vingt-quatre heures qui suivent. Elles décideront de tout.",
        risque: 2,
        aptitude: "rhetorique",
        effects: (c) => {
          const d = dossierDe(c.s, "circuit");
          if (d) {
            d.public = true;
            d.etouffe = false;
          }
          c.adj({ power: { popularite: -12, presse: 4, parti: -12 }, player: { integrite: 5 }, hidden: { soupcons: 12 } });
          c.press("« LE PRÉSIDENT RECONNAÎT TOUT » — le montage, la pression sur la rédaction, et rien d'autre", "hostile");
          return "Onze heures du matin, salle des fêtes, quinze minutes debout : le montage a existé, la pression sur la rédaction a existé, elles étaient l'une et l'autre indéfendables. Vous ne citez pas d'avocat et vous ne parlez pas de complot. C'est la pire journée de votre mandat et la seule stratégie qui empêche qu'il y en ait trente autres.";
        },
      },
      {
        id: "complot_etranger",
        label: "Dénoncer une opération étrangère",
        detail: "Onze rédactions, neuf langues, le même matin. Ça se pilote.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const d = dossierDe(c.s, "circuit");
          if (d) d.public = true;
          c.adj({ power: { popularite: -8, presse: -18 }, player: { integrite: -10 }, hidden: { soupcons: 22, paranoia: 15 } });
          c.derive(2);
          c.toutesNations({ relation: -10 });
          c.seg("urbains", { soutien: -8 });
          c.flag("theorie_complot");
          return "Vous parlez d'« une opération coordonnée visant à déstabiliser la France ». Trois des onze rédactions sont françaises ; deux appartiennent à des groupes détenus par vos soutiens. La théorie s'effondre avant le journal de 20 h, et il en reste ce qui reste toujours de ces choses-là : un tiers du pays qui y croira toujours, et vingt-six capitales qui viennent d'être accusées publiquement sans preuve.";
        },
      },
    ],
  },

  {
    id: "comptes_eurostat",
    kind: "intrigue",
    titre: "Eurostat a fini",
    weight: 0,
    cond: (s) => !!dossierDe(s, "comptes"),
    texte: (s) =>
      `La note fait onze pages et arrive par la voie normale, ce qui est le plus mauvais signe : personne n'a jugé utile de vous prévenir avant. Eurostat a repris trois exercices, requalifié la soulte, réintégré les dettes hospitalières et anticipé ce qui avait été anticipé. Le déficit réel dépasse de deux points celui que la France a notifié. ${nomCompletDe(s, "vestergaard")} vous appelle elle-même, ce qu'elle ne fait jamais : « Je vais devoir ouvrir une procédure. Je préfère vous le dire avant de le signer. »`,
    choices: [
      {
        id: "assumer_comptes",
        label: "Reconnaître et corriger",
        detail: "Renotifier les vrais chiffres. Le marché va les découvrir d'un coup.",
        effects: (c) => {
          const d = dossierDe(c.s, "comptes");
          if (d) {
            d.public = true;
            d.gravite = Math.max(15, d.gravite - 20);
          }
          c.adj({ country: { dette: 8, marge: -10, prestige: -6 }, power: { popularite: -9, presse: 3 }, player: { integrite: 6 }, hidden: { soupcons: -10 } });
          c.nation("commission", { relation: 12, savoir: -10 });
          c.nation("allemagne", { relation: 5 });
          c.rel("danglade", { loyaute: 8, rancune: -10 });
          c.log("La France a renotifié ses comptes publics à la hausse.");
          return "Renotification complète un vendredi soir, communiqué de quatre lignes, conférence de presse de Bercy le lundi. Les taux montent de trente points de base en deux séances, ce qui coûtera au budget plus que tout ce que le maquillage avait fait gagner. Bruxelles, en revanche, referme le dossier — et une Commission qui vous croit vaut plusieurs milliards par an.";
        },
      },
      {
        id: "contester_eurostat",
        label: "Contester la méthode",
        detail: "Deux ans de contentieux. C'est deux ans de gagnés.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          c.adj({ country: { prestige: -4, influence: -6 }, hidden: { soupcons: 14 } });
          c.nation("commission", { relation: -14, savoir: 12 });
          c.nation("allemagne", { relation: -8, savoir: 8 });
          c.sched("comptes_marches", 2, 5, 0.6);
          return "Bercy produit un mémoire de deux cent quarante pages contestant la requalification de la soulte. C'est solide, c'est long, et ça repousse tout de deux ans. Ce qui se passe pendant ces deux ans, c'est que chaque analyste de marché apprend que les chiffres français font l'objet d'un contentieux — et qu'ils commencent tous, discrètement, à appliquer leur propre correction.";
        },
      },
      {
        id: "acheter_commission",
        label: "Négocier dans le couloir",
        detail: "Une procédure a un rapporteur. Un rapporteur a une carrière.",
        cond: (s) => s.derive >= 3,
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const ok = c.s.player.reseau + c.s.country.influence * 0.3 + c.rng.int(-20, 20) > 75;
          if (ok) {
            etoufferDossier(c.s, "comptes");
            c.nation("commission", { relation: -6, savoir: 15 });
            c.adj({ player: { integrite: -10, cynisme: 8 }, hidden: { soupcons: 8 } });
            c.derive(1);
            return "La procédure est ouverte, puis « suspendue dans l'attente d'éléments complémentaires ». Le rapporteur prend la tête d'une agence à Vienne quatorze mois plus tard. Rien de tout cela ne se prouve, et tout le monde à Bruxelles le raconte au dîner. Vous avez gagné du temps et perdu quelque chose qui ne se rachète pas : la présomption de bonne foi.";
          }
          c.nation("commission", { relation: -30, savoir: 25 });
          c.adj({ player: { integrite: -12 }, hidden: { soupcons: 25 }, country: { influence: -12, prestige: -8 } });
          c.dossier("pression_commission", "Les pressions exercées sur la Commission", 60);
          c.rel("vestergaard", { rancune: 30 });
          return "Vous choisissez mal votre intermédiaire. Ingrid Vestergaard reçoit un compte rendu de la conversation par écrit, le fait traduire, et le joint au dossier de procédure. Elle ne vous rappellera plus jamais elle-même. Tenter d'arranger une procédure, c'est en créer une seconde, et la seconde porte votre nom en toutes lettres.";
        },
      },
    ],
  },

  {
    id: "comptes_marches",
    kind: "intrigue",
    titre: "Les marchés ont lu",
    weight: 0,
    once: true,
    texte: () =>
      `Ça commence par une note d'une maison de gestion néerlandaise, six paragraphes, publiée un mardi matin. Elle ne révèle rien : elle rappelle simplement que les chiffres français sont contestés et propose « une hypothèse alternative ». À 11 h, l'écart avec le Bund a pris quinze points. À 15 h, quarante. Danglade entre dans le bureau sans frapper, ce qu'il n'a jamais fait, et pose son téléphone écran vers vous.`,
    choices: [
      {
        id: "marches_verite",
        label: "Publier les vrais chiffres, tout de suite",
        detail: "Ce qui fait paniquer, ce n'est pas la dette. C'est de ne pas savoir.",
        risque: 2,
        effects: (c) => {
          const d = dossierDe(c.s, "comptes");
          if (d) d.public = true;
          c.adj({ country: { dette: 10, marge: -8, prestige: -3 }, power: { popularite: -8 }, hidden: { soupcons: -12 } });
          c.nation("commission", { relation: 10 });
          return "Tout est mis en ligne à 17 h 30 : les trois exercices, la méthode, l'écart, sans commentaire. La séance du lendemain ouvre en baisse puis se stabilise avant midi. Les marchés supportent très bien les mauvaises nouvelles ; ce qu'ils ne supportent pas, c'est de soupçonner qu'il y en a d'autres.";
        },
      },
      {
        id: "marches_tenir",
        label: "Tenir la ligne",
        detail: "Démentir, rassurer, attendre que ça passe.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const tient = c.rng.chance(0.4);
          if (tient) {
            c.adj({ country: { dette: 3, marge: -4 }, power: { popularite: -3 } });
            return "Trois jours difficiles, deux communiqués, un déplacement à Francfort. La vague passe : il faut plus qu'une note de six paragraphes pour renverser une signature souveraine. Vous avez tenu. Vous avez aussi appris exactement combien de jours vous pouvez tenir, ce qui est une information que d'autres ont apprise en même temps que vous.";
          }
          c.adj({ country: { dette: 16, marge: -18, croissance: -0.7, prestige: -10 }, power: { popularite: -14, patronat: -10 } });
          c.nation("allemagne", { relation: -12 });
          c.press("« LA SIGNATURE FRANCE » — quatre séances de baisse, l'agence de notation avance sa revue de trois mois", "hostile");
          c.log("Une crise de défiance sur la dette française a coûté plusieurs points de PIB.");
          return "Vous démentez le mardi, vous rassurez le mercredi, vous convoquez les banquiers le jeudi. Chaque prise de parole accélère la chute, parce que chacune confirme qu'il y a un sujet. L'agence avance sa revue. Le coût de la dette augmentera pendant huit ans à cause d'une semaine.";
        },
      },
    ],
  },

  {
    id: "operation_suite",
    kind: "intrigue",
    titre: "Ce qui est revenu",
    weight: 0,
    cond: (s) => !!dossierDe(s, "operation"),
    texte: (s) =>
      `${nomCompletDe(s, "soubeyran")} vous rend compte debout, en quatre minutes. L'objectif est atteint ; la menace ne se reconstituera pas avant des années ; deux services alliés ont « pris note avec intérêt ». Puis il ajoute la seule phrase qui compte : « Un de nos hommes a été identifié à la sortie. Pas arrêté. Identifié. » Il attend. « Ils savent, monsieur le Président. Ils ne diront rien tant qu'ils n'en auront pas besoin. »`,
    choices: [
      {
        id: "operation_couvrir",
        label: "Couvrir l'équipe",
        detail: "Ils ont exécuté un ordre écrit. Le vôtre.",
        effects: (c) => {
          c.adj({ power: { armee: 10 }, hidden: { paranoia: 10 }, player: { integrite: 3 } });
          c.rel("soubeyran", { loyaute: 20 });
          c.rel("verdier", { loyaute: 10 });
          c.nation("royaumeuni", { savoir: 10 });
          return "Vous refusez d'effacer votre signature du registre des autorisations, contre l'avis de tout le monde. Les services l'apprennent en quarante-huit heures — ces choses-là circulent — et vous gagnez auprès d'eux une loyauté qui ne s'achète par aucun autre moyen. Elle vous servira. Elle vous a aussi rendu personnellement responsable de quelque chose d'irréparable.";
        },
      },
      {
        id: "operation_effacer",
        label: "Faire disparaître la trace",
        detail: "Le registre, l'ordre écrit, la chaîne d'autorisation.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const d = dossierDe(c.s, "operation");
          if (d) d.gravite = Math.min(100, d.gravite + 10);
          c.derive(2);
          c.adj({ power: { armee: -14 }, player: { integrite: -12 }, hidden: { paranoia: 20 } });
          c.rel("soubeyran", { rancune: 25, loyaute: -30 });
          c.flag("ordre_efface");
          c.sched("operation_chantage", 2, 5, 0.85);
          return "L'ordre écrit disparaît du registre un jeudi. Soubeyran s'en aperçoit le vendredi. Il ne dit rien, ne proteste pas, et fait une copie de tout ce qui reste — c'est exactement ce que vous auriez fait à sa place. Vous avez effacé une preuve contre vous et créé un témoin contre vous, ce qui est un mauvais change.";
        },
      },
      {
        id: "operation_devancer",
        label: "Prévenir les alliés avant qu'ils ne parlent",
        detail: "Leur raconter la version française. Il en restera quelque chose.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          c.nation("royaumeuni", { relation: 10, savoir: -10 });
          c.nation("allemagne", { savoir: 12, relation: -8 });
          c.adj({ country: { prestige: -3 }, hidden: { paranoia: 8 } });
          return "Vous envoyez Soubeyran raconter une version — la vôtre, sérieuse, incomplète — à trois services alliés avant qu'ils n'aient à choisir quoi en faire. Deux vous remercient de la confiance. Le troisième vous remercie aussi, puis classe la note dans un dossier qui porte votre nom. Vous n'avez pas supprimé le levier : vous en avez négocié le prix.";
        },
      },
    ],
  },

  {
    id: "operation_chantage",
    kind: "intrigue",
    titre: "Le témoin",
    weight: 0,
    once: true,
    cond: (s) => !!s.flags["ordre_efface"],
    texte: (s) =>
      `${nomCompletDe(s, "soubeyran")} demande à être reçu. Il ne s'assied pas. « J'ai passé trente ans à exécuter des ordres que personne n'a jamais écrits, et ça m'allait. Ce qui ne m'allait pas, c'est qu'on efface le seul qui l'était. » Il pose une clé USB sur le bureau et ne la lâche pas. « Ceci reste chez mon notaire. Je ne demande rien. Je voulais juste que vous sachiez qu'elle existe, pour que vous ayez à y penser chaque fois que vous serez tenté de faire disparaître quelqu'un d'autre. »`,
    choices: [
      {
        id: "temoin_respecter",
        label: "Le laisser partir avec",
        detail: "Il a raison. C'est la seule réponse possible.",
        effects: (c) => {
          c.rel("soubeyran", { rancune: -25, loyaute: 15 });
          c.adj({ player: { integrite: 8 }, hidden: { paranoia: 12 } });
          return "Vous ne dites rien pendant huit secondes, puis vous le remerciez, sincèrement, et il sort. La clé existera pour le reste de votre vie et vous y penserez chaque semaine. C'est, très exactement, ce qu'il voulait — et c'est le seul contre-pouvoir qu'il vous reste, parce que vous avez démonté tous les autres.";
        },
      },
      {
        id: "temoin_ecarter",
        label: "L'écarter du service",
        detail: "Une ambassade lointaine, un titre, un silence.",
        risque: 3,
        effects: (c) => {
          c.rel("soubeyran", { rancune: 40, loyaute: -40 });
          c.derive(2);
          c.adj({ power: { armee: -12 }, hidden: { paranoia: 25, soupcons: 18 } });
          const d = dossierDe(c.s, "operation");
          if (d) d.gravite = Math.min(100, d.gravite + 15);
          return "Il part avec les honneurs pour une ambassade de trois personnes. La clé, elle, ne part nulle part. Vous venez d'ajouter à la liste des gens qui peuvent vous détruire celui qui, ce matin, était venu vous dire qu'il ne le ferait pas.";
        },
      },
    ],
  },

  {
    id: "accord_agriculteurs",
    kind: "standard",
    titre: "Les tracteurs sont partis à 4 h",
    weight: 0,
    cond: (s) => s.propos.some((p) => p.sujet === "agriculture"),
    texte: () =>
      `Ils sont partis de six départements à quatre heures du matin, et ils convergent. À midi, l'A6 est fermée dans les deux sens ; à 16 h, deux préfectures sont bloquées par des remorques de lisier. La revendication tient en une ligne, peinte sur une bâche de vingt mètres à l'entrée de Paris : votre phrase du jour de la signature, recopiée mot pour mot, suivie d'un point d'interrogation.`,
    choices: [
      {
        id: "agri_clause",
        label: "Rouvrir une clause de sauvegarde",
        detail: "Revenir sur une partie de l'accord. Bruxelles va crier.",
        effects: (c) => {
          c.adj({ country: { croissance: -0.3, influence: -8 }, power: { patronat: -8 }, hidden: { agitation: -12 } });
          c.seg("ruraux", { soutien: 12 });
          c.nation("commission", { relation: -12 });
          c.toutesNations({ relation: -5 }, ["commission"]);
          return "Clause de sauvegarde sur trois filières, activée unilatéralement, notifiée après coup. Les tracteurs rentrent. Bruxelles ouvre un contentieux, deux capitales exportatrices parlent de « protectionnisme déguisé », et vous découvrez que tenir parole à l'intérieur se paie toujours à l'extérieur — l'inverse étant également vrai, ce qui ne laisse aucune sortie propre.";
        },
      },
      {
        id: "agri_tenir",
        label: "Tenir l'accord",
        detail: "Il a été signé. Un traité qu'on rouvre n'est plus un traité.",
        risque: 2,
        effects: (c) => {
          const cite = c.contredire("agriculture");
          c.adj({ country: { influence: 5 }, hidden: { agitation: 14 }, power: { patronat: 6 } });
          c.seg("ruraux", { soutien: -14, participation: 6 });
          return cite
            ? `Vous tenez, et vous avez raison sur le fond : un pays qui rouvre ses signatures ne signe plus rien d'utile. Mais à l'entrée de Paris, la bâche de vingt mètres porte toujours vos vingt-deux mots — « ${cite} » — et il n'existe aucune manière de gagner un débat contre soi-même. Le blocage dure onze jours.`
            : "Vous tenez. Un pays qui rouvre ses signatures ne signe plus rien d'utile, et vous le dites clairement, ce qui est courageux et parfaitement inaudible depuis un tracteur. Le blocage dure onze jours et laisse dans six départements une rancune qui votera.";
        },
      },
    ],
  },

  {
    id: "bloc_traite",
    kind: "intrigue",
    titre: "Le traité",
    weight: 0,
    once: true,
    cond: (s) => !!s.flags["bloc_forme"],
    texte: (s) => {
      const amis = alliees(s).filter((d) => !d.institution && !d.horsUnion);
      const ou = amis[0]?.capitale ?? "Rome";
      return `Ce qui n'était qu'un format de coordination a produit quelque chose : soixante pages, un mécanisme de financement commun, une clause de solidarité industrielle, et une architecture institutionnelle qui n'existait pas il y a dix-huit mois. Les juristes disent que ça tient. ${amis.length + 1} capitales sont prêtes à signer. Le Quai propose ${ou} pour la cérémonie ; la présidence de la Commission fait savoir, très poliment, qu'elle préférerait Bruxelles, et que le texte devrait « s'articuler avec les traités existants » plutôt que d'exister à côté.`;
    },
    choices: [
      {
        id: "traite_signer",
        label: "Signer, et vite",
        detail: "Les fenêtres comme celle-ci se referment à la première élection.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          c.flag("traite_signe");
          c.adj({ country: { influence: 20, prestige: 14, croissance: 0.5 }, power: { popularite: 8, presse: 6 } });
          for (const d of alliees(c.s)) c.nation(d.id, { relation: 12, faveurs: 12 });
          c.nation("commission", { relation: -10 });
          c.press("« LE TRAITÉ DE PARIS » — le texte porte le nom de la ville, et les commentateurs celui du Président", "favorable");
          c.log("Un traité européen conclu à votre initiative a été signé.");
          return "Signature en huit semaines, ratification en quatorze mois, et une phrase dans les manuels : c'est ici que l'Europe a recommencé à avancer à quelques-uns plutôt qu'à s'arrêter à vingt-sept. La Commission n'a pas aimé être contournée et ne l'oubliera pas. Les États qui n'en sont pas demandent tous à y entrer dans les trois ans — c'est ainsi que fonctionne ce continent, et vous venez de l'utiliser dans le bon sens.";
        },
      },
      {
        id: "traite_bruxelles",
        label: "Passer par la Commission",
        detail: "Plus lent, plus solide, moins glorieux.",
        effects: (c) => {
          c.flag("traite_signe");
          c.adj({ country: { influence: 11, prestige: 7 }, power: { popularite: 3 } });
          c.nation("commission", { relation: 22, faveurs: 10 });
          c.toutesNations({ relation: 4 }, ["commission"]);
          c.rel("vestergaard", { loyaute: 18 });
          c.log("Votre initiative a été intégrée aux traités européens par la voie institutionnelle.");
          return "Le texte entre dans la machine et en ressort dix-neuf mois plus tard, plus court, plus prudent, sans le nom de Paris dessus. Il est aussi devenu opposable à vingt-sept au lieu de six, ce qui vaut infiniment plus. Vous avez échangé une page d'histoire contre un effet réel. Peu de gens vous en créditeront ; les vingt-sept, si.";
        },
      },
    ],
  },

  {
    // La grande cause s'armait depuis toujours sans jamais rien déclencher :
    // « elles ne se jugent qu'à la fin » était une promesse en l'air.
    id: "grande_cause_bilan",
    kind: "standard",
    titre: "Le bilan de la grande cause",
    weight: 0,
    once: true,
    cond: (s) => !!s.flags["grande_cause"],
    texte: (s) =>
      `Trois ans après le lancement, l'inspection générale rend son évaluation : cent quatre-vingts pages, quarante-deux indicateurs, et une conclusion en demi-teinte comme le sont toutes les évaluations honnêtes. Les moyens ont été engagés, les structures créées, et ${
        s.country.services > 50 ? "les résultats commencent à se voir sur le terrain, sans qu'on puisse encore les attribuer avec certitude" : "les résultats se font attendre, ce que le rapport impute autant à la lenteur des administrations qu'à la dispersion des crédits"
      }. Camille Roze demande ce qu'on en fait : on peut en faire un anniversaire, ou on peut le laisser paraître un vendredi d'août.`,
    choices: [
      {
        id: "cause_anniversaire",
        label: "En faire l'anniversaire du mandat",
        detail: "Une semaine entière dessus. Le rapport dit ce qu'il dit.",
        risque: 2,
        aptitude: "rhetorique",
        effects: (c) => {
          const solide = c.s.country.services > 48 || c.s.country.environnement > 55;
          if (solide) {
            c.adj({ country: { cohesion: 5, prestige: 3 }, power: { popularite: 8, presse: 5 } });
            c.log("La grande cause du mandat a produit un bilan défendable.");
            return "Une semaine de déplacements sur le terrain, avec le rapport dans la main, y compris les pages qui fâchent. Vous lisez à voix haute l'indicateur qui n'a pas bougé, devant les gens concernés, et vous expliquez pourquoi. Le pays ne voit pas souvent un gouvernement présenter son propre bulletin sans l'avoir maquillé ; ça compte davantage que les résultats eux-mêmes.";
          }
          c.adj({ power: { popularite: -6, presse: -6 } });
          return "Vous montez une semaine de célébration sur un rapport qui ne célèbre rien. Dès le deuxième jour, un journaliste lit à l'antenne la page 114 — celle où l'inspection écrit « aucun effet mesurable à ce stade ». Le reste de la semaine est consacré à commenter la page 114. On ne fête pas un bilan avant de l'avoir lu.";
        },
      },
      {
        id: "cause_approfondir",
        label: "Remettre au pot, sans communiquer",
        detail: "Corriger ce que le rapport pointe. Personne n'en parlera.",
        effects: (c) => {
          c.adj({ country: { services: 6, environnement: 4, cohesion: 3, marge: -7 }, power: { popularite: -2 } });
          c.flag("grande_cause_tenue");
          c.log("Vous avez corrigé et refinancé la grande cause après son évaluation.");
          return "Vous reprenez les quarante-deux indicateurs un par un avec l'inspection, vous en supprimez douze qui ne mesuraient rien, vous refinancez les six qui marchent. Aucune caméra, aucune annonce, aucun bénéfice politique — et un dispositif qui, dans quatre ans, aura effectivement changé quelque chose pour quelqu'un. C'est très exactement le genre de décision que rien, dans ce métier, n'encourage à prendre.";
        },
      },
      {
        id: "cause_enterrer",
        label: "Le publier un vendredi d'août",
        detail: "Il existe des manières de rendre un rapport public sans le rendre lisible.",
        effects: (c) => {
          c.adj({ player: { cynisme: 5, integrite: -3 }, power: { presse: -3 } });
          c.rel("roze", { loyaute: -5 });
          c.sched("cause_ressort", 3, 7, 0.5);
          return "Mis en ligne le 14 août à 19 h 30, en PDF non indexé, sur le site d'une inspection dont personne ne connaît l'adresse. Techniquement publié, statistiquement invisible. Camille Roze exécute sans commenter, ce qui, chez elle, est un commentaire. Les rapports enterrés en août ressortent en général deux ans plus tard, exhumés par quelqu'un qui cherchait autre chose.";
        },
      },
    ],
  },

  {
    id: "cause_ressort",
    kind: "standard",
    titre: "Page 114",
    weight: 0,
    once: true,
    texte: (s) =>
      `Une doctorante l'a retrouvé en cherchant tout autre chose, et l'a mis en ligne avec un fil de commentaires. En quarante-huit heures, la page 114 est partout. Ce qui intéresse la presse n'est d'ailleurs pas le contenu du rapport — c'est la date et l'heure de sa mise en ligne, capture d'écran à l'appui. ${nomCompletDe(s, "bec")} y consacre son éditorial sous un titre de six mots : « Ce qu'on publie le 14 août ».`,
    choices: [
      {
        id: "ressort_assumer",
        label: "Reconnaître l'enterrement",
        detail: "Le geste était minable. Le dire l'est moins que de le défendre.",
        effects: (c) => {
          c.adj({ power: { presse: 4, popularite: -4 }, player: { integrite: 5 } });
          return "« Nous l'avons publié à un moment où nous savions que personne ne le lirait. C'était une petite manœuvre et je l'assume comme telle. » La phrase circule autant que le rapport. On vous reproche le geste pendant trois jours, puis on passe — parce qu'il n'y a rien de plus à en tirer quand l'intéressé a déjà tout dit.";
        },
      },
      {
        id: "ressort_defendre",
        label: "Défendre le calendrier de publication",
        detail: "« Les délais réglementaires ont été respectés. » Ce qui est vrai.",
        effects: (c) => {
          c.adj({ power: { presse: -9, popularite: -6 }, player: { cynisme: 4 } });
          return "Le porte-parole explique pendant onze minutes que le délai réglementaire a été respecté. C'est parfaitement exact et absolument personne ne parlait de cela. Chaque minute de cette réponse prolonge d'une journée la vie d'un sujet qui serait mort tout seul.";
        },
      },
    ],
  },

  // =========================================================================
  // L'enquête — quatre étapes, un mur qui se rapproche
  // =========================================================================
  {
    id: "enquete_signalement",
    kind: "intrigue",
    titre: "Le signalement",
    weight: 0,
    cond: (s) => !!s.europe.enquete,
    texte: (s) => {
      const d = dossierDe(s, s.europe.enquete!.dossier);
      return `La note ne vous est pas adressée. Elle circule entre quatre administrations et l'une d'elles vous en glisse une copie par courtoisie — la courtoisie étant, dans ce métier, une forme d'avertissement. Une cellule anti-fraude européenne a agrégé des signalements bancaires portant sur ${d?.titre.toLowerCase() ?? "des flux inexpliqués"}. Elle conclut à « des éléments justifiant un examen approfondi ». Rien n'est ouvert. Rien n'est public. Quelqu'un, quelque part, décide en ce moment s'il transmet.`;
    },
    choices: [
      {
        id: "signalement_ranger",
        label: "Tout mettre en ordre, sincèrement",
        detail: "Régulariser avant qu'on ne vienne regarder. Coûteux, définitif.",
        effects: (c) => {
          const e = c.s.europe.enquete;
          const d = e ? dossierDe(c.s, e.dossier) : undefined;
          if (d) d.gravite = Math.max(10, d.gravite - 28);
          c.adj({ hidden: { soupcons: -22 }, country: { marge: -8 }, power: { parti: -10 }, player: { integrite: 7 } });
          if (e && c.s.hidden.soupcons < 40) c.s.europe.enquete = null;
          return "Régularisations spontanées, redressement accepté sans contester, conventions résiliées, un avocat qui écrit à l'administration avant qu'elle n'écrive. C'est humiliant, ça coûte très cher, et ça vide le dossier de l'essentiel de sa substance. Une cellule anti-fraude qui trouve un dossier déjà rangé passe au suivant : elle a douze mille dossiers.";
        },
      },
      {
        id: "signalement_avocats",
        label: "Verrouiller juridiquement",
        detail: "Trois cabinets, la meilleure défense possible. Ne rien reconnaître.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          c.adj({ country: { marge: -4 }, hidden: { soupcons: 6 } });
          c.rel("alberti", { rancune: 6 });
          return "Trois cabinets, une note de stratégie de soixante pages, et une doctrine simple : ne rien produire qui n'ait été demandé. C'est la bonne défense sur le plan technique. Sur le plan humain, quatre administrations viennent d'apprendre que l'Élysée s'est doté d'une défense — ce qui, pour une cellule anti-fraude, ressemble beaucoup à une confirmation.";
        },
      },
      {
        id: "signalement_ignorer",
        label: "Ne rien faire",
        detail: "Réagir, c'est reconnaître. Beaucoup de notes ne vont nulle part.",
        effects: (c) => {
          c.adj({ hidden: { soupcons: 4 }, player: { cynisme: 3 } });
          return "Vous ne faites rien, et c'est défendable : la plupart de ces notes s'enterrent d'elles-mêmes, faute de moyens, faute de temps, faute d'un magistrat que le sujet intéresse. Il suffit qu'il y en ait un.";
        },
      },
    ],
  },

  {
    id: "enquete_saisine",
    kind: "intrigue",
    titre: "La saisine",
    weight: 0,
    cond: (s) => !!s.europe.enquete,
    texte: (s) =>
      `${nomCompletDe(s, "dragomir")} ne vous a pas prévenu et n'avait pas à le faire. Le parquet européen est saisi ; une équipe de délégués est constituée dans trois pays ; les demandes d'entraide sont parties. La différence avec un juge français, c'est qu'il n'existe aucun canal — aucun ami commun, aucun ancien camarade de promotion, aucun garde des Sceaux à qui parler. Le procureur général n'a pas de hiérarchie nationale. C'est précisément pour cela qu'on l'a créé, et c'est vous qui aviez voté pour.`,
    choices: [
      {
        id: "saisine_cooperer",
        label: "Coopérer pleinement",
        detail: "Tout ouvrir, tout de suite, sans attendre les réquisitions.",
        risque: 2,
        effects: (c) => {
          const e = c.s.europe.enquete;
          const d = e ? dossierDe(c.s, e.dossier) : undefined;
          if (d) d.gravite = Math.max(15, d.gravite - 20);
          c.adj({ hidden: { soupcons: -14 }, power: { presse: 6, popularite: -5, justice: 8 }, player: { integrite: 8 } });
          c.nation("commission", { relation: 10 });
          c.rel("dragomir", { loyaute: 8 });
          if (e) e.depuis = c.s.turnCount + 2;
          return "Vous ouvrez tout : serveurs, agendas, notes de frais, sans attendre une seule réquisition. Vos avocats hurlent, et ils ont raison sur le plan technique. Sur tous les autres, coopérer avant qu'on ne vous y force est la seule chose qui distingue encore un dossier d'un scandale. La procédure ralentit, parce qu'une procédure avance surtout contre la résistance.";
        },
      },
      {
        id: "saisine_immunite",
        label: "Invoquer l'immunité",
        detail: "Un chef d'État en exercice n'est pas justiciable. Constitutionnellement.",
        risque: 2,
        effects: (c) => {
          c.adj({ hidden: { soupcons: 10 }, power: { presse: -10, popularite: -6, justice: -8 } });
          c.derive(1);
          c.nation("commission", { relation: -8 });
          c.rel("alberti", { rancune: 10 });
          return "L'argument est juridiquement solide et il tiendra jusqu'au dernier jour de votre mandat. C'est exactement ce que tout le monde comprend : vous n'êtes pas innocenté, vous êtes protégé, et la protection a une date d'expiration inscrite au calendrier. L'enquête, elle, continue sur tous ceux qui n'ont pas d'immunité — c'est-à-dire tous les autres.";
        },
      },
      {
        id: "saisine_dessaisir",
        label: "Faire dessaisir la procureure",
        detail: "Une procédure de récusation, quelques relais à Bruxelles. Ça s'est déjà vu.",
        cond: (s) => s.derive >= 4,
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          const ok = c.s.country.influence * 0.5 + c.s.player.reseau * 0.4 + c.rng.int(-25, 25) > 55;
          c.derive(2);
          if (ok) {
            if (c.s.europe.enquete) c.s.europe.enquete.enterree = true;
            c.adj({ hidden: { soupcons: 6, paranoia: 15 }, player: { integrite: -14 }, country: { influence: -10 } });
            c.rel("dragomir", { rancune: 40 });
            c.dossier("pression_parquet", "Les manœuvres contre le parquet européen", 70);
            c.sched("enquete_successeur", 3, 6, 0.7);
            c.log("Vous avez obtenu le dessaisissement de la procureure européenne.");
            return "Récusation acceptée pour un motif de forme que personne ne défend sérieusement. Elena Dragomir quitte le dossier sans un mot public. Il est reversé à un collègue, qui hérite en même temps du dossier et de la manière dont on l'a obtenu — et qui, ayant tout compris, sera beaucoup moins accommodant que la précédente.";
          }
          c.adj({ hidden: { soupcons: 30 }, player: { integrite: -16 }, country: { influence: -18, prestige: -10 }, power: { presse: -12 } });
          c.rel("dragomir", { rancune: 45 });
          c.dossier("pression_parquet", "Les manœuvres contre le parquet européen", 70);
          c.toutesNations({ relation: -12 });
          return "La récusation est rejetée en onze jours, et le contenu de la démarche fuite en quatorze. Une chef d'État a tenté de faire écarter la magistrate qui l'enquête : c'est le genre de phrase qui traverse les frontières sans traduction. Vous avez transformé un dossier financier en question de principe, et sur les questions de principe, l'Europe est très mauvaise perdante.";
        },
      },
    ],
  },

  {
    id: "enquete_perquisition",
    kind: "intrigue",
    titre: "Les scellés",
    weight: 0,
    cond: (s) => !!s.europe.enquete,
    texte: (s) => {
      // Ce qui rend la scène irrattrapable, c'est ce qu'on a dit soi-même.
      const parole = s.propos.find((p) => p.sujet === "probite") ?? s.propos.find((p) => !p.tenu);
      const base = `Six heures du matin, quatre sites simultanément : le siège du parti, deux cabinets, et le domicile du trésorier. Les délégués du parquet européen sont accompagnés d'officiers français qui ne les ont pas prévenus la veille. À 7 h 40, une chaîne d'information est en direct devant le siège — quelqu'un a appelé, et ce quelqu'un est à l'intérieur.`;
      if (!parole) return `${base} À midi, quatorze cartons sont sortis. On les compte à l'antenne, un par un, en boucle, jusqu'au soir.`;
      return `${base} À midi, quatorze cartons sont sortis. La chaîne les compte en boucle jusqu'au soir, et l'éditorialiste de la tranche de 18 h trouve l'angle que tout le monde reprendra le lendemain : il rediffuse votre phrase — « ${parole.citation} » — et laisse tourner l'image des cartons dessous, sans un mot de commentaire. C'est le montage le plus honnête possible, et c'est le plus dévastateur.`;
    },
    choices: [
      {
        id: "scelles_silence",
        label: "Ne rien dire jusqu'au bout",
        detail: "Aucun commentaire sur une procédure en cours. Tenir six mois.",
        effects: (c) => {
          c.adj({ power: { popularite: -12, presse: -6 }, hidden: { soupcons: 4, paranoia: 12 } });
          c.rel("roze", { loyaute: -8 });
          return "Pas un mot, pas une réponse, pas un déplacement annulé. La doctrine est juste et elle est intenable : chaque silence est rempli par quelqu'un d'autre, et au bout de trois semaines le pays a entendu toutes les versions sauf la vôtre. Camille Roze demande à être déchargée de la communication sur ce dossier — elle n'a plus rien à communiquer.";
        },
      },
      {
        id: "scelles_sacrifier",
        label: "Lâcher le trésorier",
        detail: "Il a monté le circuit. Techniquement, c'est vrai.",
        risque: 3,
        aptitude: "cynisme",
        effects: (c) => {
          c.adj({ power: { popularite: 4, parti: -22 }, player: { integrite: -12, cynisme: 8 } });
          c.rel("espitalier", { rancune: 55, loyaute: -50 });
          c.flag("bouc_emissaire", "espitalier");
          c.sched("vengeance_bouc", 2, 4, 0.8);
          return "« Ces montages ont été conçus sans que j'en aie été informé. » C'est faux et c'est plaidable, ce qui suffit trois semaines. Jean-Marc Espitalier apprend la phrase à la radio, dans sa voiture, garé devant chez lui. Il a tout monté sur instruction et il a gardé les instructions — c'est même la seule chose qu'un trésorier apprend à faire avant de savoir compter.";
        },
      },
      {
        id: "scelles_assumer",
        label: "Tout porter soi-même",
        detail: "Devant les caméras, sans avocat, sans intermédiaire.",
        risque: 3,
        aptitude: "rhetorique",
        effects: (c) => {
          const ok = c.s.player.rhetorique + c.s.player.integrite * 0.5 + c.rng.int(-20, 22) > 75;
          if (ok) {
            c.adj({ power: { popularite: -4, presse: 10 }, player: { integrite: 10 }, hidden: { soupcons: -10 } });
            const e = c.s.europe.enquete;
            if (e) e.depuis = c.s.turnCount + 2;
            return "Vous descendez dans la cour, sans notes, et vous répondez pendant quarante minutes à tout ce qu'on vous demande, y compris à ce que vos avocats vous avaient interdit. Vous reconnaissez ce qui est vrai et vous refusez ce qui ne l'est pas, avec les dates. Ça ne fait pas disparaître le dossier — mais le pays entend pour la première fois quelqu'un qui n'a pas l'air de se cacher, et cela change la température de tout.";
          }
          c.adj({ power: { popularite: -16, presse: -10 }, player: { integrite: -4 }, hidden: { soupcons: 14 } });
          return "Vous descendez dans la cour sans notes, et à la sixième question vous vous emmêlez sur une date. La séquence de onze secondes tourne trois cent mille fois avant minuit. Il y a des situations où l'improvisation sincère est la meilleure des stratégies ; il fallait, pour celle-là, connaître son dossier mieux que ceux qui l'ont instruit.";
        },
      },
    ],
  },

  {
    id: "enquete_requisitions",
    kind: "intrigue",
    titre: "Les réquisitions",
    weight: 0,
    cond: (s) => !!s.europe.enquete,
    texte: (s) => {
      const d = dossierDe(s, s.europe.enquete!.dossier);
      const grave = (d?.gravite ?? 50) >= 60;
      return `Le réquisitoire fait quatre cent douze pages et il est écrit dans une langue plate, sans adjectif, ce qui le rend pire. ${nomCompletDe(s, "dragomir")} y demande le renvoi devant le tribunal ${grave ? "de six personnes, dont vous, à l'expiration de votre mandat" : "de quatre personnes de votre entourage, et vous cite quarante-sept fois sans vous mettre en cause formellement"}. La date de l'audience sera fixée après les élections — c'est-à-dire à un moment où vous ne serez plus protégé par grand-chose. Vos avocats parlent d'appel. Votre Première ministre demande à vous voir seule.`;
    },
    choices: [
      {
        id: "requisitions_combattre",
        label: "Se battre pied à pied",
        detail: "Appels, nullités, questions préjudicielles. Des années.",
        effects: (c) => {
          c.adj({ power: { popularite: -10, presse: -8, justice: -6 }, country: { marge: -3 }, hidden: { paranoia: 15 } });
          c.flag("proces_en_cours");
          c.flag("chute_judiciaire", c.s.player.integrite < 35 && c.s.power.justice < 40);
          return "Chaque nullité soulevée gagne quatre mois et coûte un point de popularité. La stratégie est bonne si l'objectif est de ne jamais être jugé pendant le mandat, et elle atteindra cet objectif. Ce qu'elle ne peut pas empêcher, c'est que le mandat, lui, ait une fin — et que ce jour-là, tout ce qui a été gagné cesse de l'être d'un seul coup.";
        },
      },
      {
        id: "requisitions_demission_pm",
        label: "Sacrifier le gouvernement",
        detail: "Rochefort propose de tout endosser et de partir. Elle le propose sincèrement.",
        risque: 2,
        effects: (c) => {
          const pm = (c.s.flags["pm_actuel"] as string) ?? "rochefort";
          c.rel(pm, { loyaute: -10, rancune: 20 });
          if (c.s.characters[pm]) c.s.characters[pm].enPoste = false;
          c.adj({ power: { popularite: 6, parti: -14 }, player: { integrite: -8 }, hidden: { soupcons: 4 } });
          c.flag("proces_en_cours");
          return "Elle démissionne le vendredi en assumant « la responsabilité politique de dysfonctionnements » qu'elle n'a pas commis, dans une déclaration de deux minutes d'une dignité insupportable. Le pays vous accorde un répit de six semaines. Elle, elle ne vous accordera plus rien : on ne se relève pas d'avoir été utilisée comme une provision pour risques.";
        },
      },
      {
        id: "requisitions_partir",
        label: "Partir avant l'audience",
        detail: "Démissionner, redevenir un justiciable ordinaire, et se battre à armes égales.",
        risque: 3,
        effects: (c) => {
          c.adj({ player: { integrite: 12 }, power: { presse: 12 } });
          c.flag("retrait_judiciaire");
          c.flag("proces_en_cours");
          c.log("Vous avez quitté la fonction avant l'audience, pour vous défendre en justiciable ordinaire.");
          return "L'allocution dure quatre minutes. Vous ne plaidez pas votre cause, vous dites simplement qu'un pays ne peut pas être gouverné depuis une salle d'audience et qu'on ne se défend pas correctement derrière une immunité. Le pays est stupéfait. Une partie de la presse écrit le mot « grandeur » pour la première fois depuis longtemps — et vous entrez dans le prétoire sans rien pour vous protéger.";
        },
      },
    ],
  },

  {
    id: "enquete_successeur",
    kind: "intrigue",
    titre: "Le successeur",
    weight: 0,
    once: true,
    cond: (s) => !!s.europe.enquete?.enterree,
    texte: () =>
      `Le nouveau procureur délégué a quarante-deux ans, aucune ambition politique connue, et il a demandé lui-même le dossier — ce qu'aucun magistrat sensé ne fait. Sa première décision est de reprendre l'intégralité des actes depuis le début, y compris la procédure de récusation de sa prédécesseure, qu'il a jointe au dossier principal comme « élément de contexte ». La manœuvre qui vous avait débarrassé du problème vient de devenir une pièce du problème.`,
    choices: [
      {
        id: "successeur_laisser",
        label: "Laisser faire",
        detail: "Toucher à celui-ci reviendrait à signer les aveux.",
        effects: (c) => {
          if (c.s.europe.enquete) {
            c.s.europe.enquete.enterree = false;
            c.s.europe.enquete.depuis = c.s.turnCount;
          }
          c.adj({ hidden: { soupcons: 8, paranoia: 10 } });
          return "Vous ne faites rien, et c'est la seule décision juste : un deuxième magistrat écarté sur le même dossier ferait le tour du continent en une nuit. L'enquête reprend son cours, avec deux ans de retard et une pièce de plus. Vous avez acheté du temps au prix d'une aggravation — c'est le tarif habituel.";
        },
      },
      {
        id: "successeur_negocier",
        label: "Ouvrir une négociation globale",
        detail: "Reconnaissance préalable de culpabilité, amende, et on referme.",
        risque: 2,
        aptitude: "strategie",
        effects: (c) => {
          const ok = c.s.player.integrite * 0.4 + c.s.power.justice * 0.4 + c.rng.int(-15, 20) > 45;
          if (ok) {
            c.s.europe.enquete = null;
            const d = c.s.europe.dossiers.find((x) => !x.public);
            if (d) {
              d.public = true;
              d.gravite = Math.max(10, d.gravite - 40);
            }
            c.adj({ country: { marge: -12 }, power: { popularite: -14, presse: 5 }, hidden: { soupcons: -30 }, player: { integrite: 4 } });
            c.log("Une transaction a mis fin à l'enquête européenne.");
            return "Amende record, reconnaissance des faits matériels, publication intégrale de l'accord. C'est une humiliation payée comptant et c'est fini — vraiment fini, ce que rien d'autre n'aurait permis. Vous porterez le mot « transaction » jusqu'à la dernière ligne de votre notice nécrologique, et vous n'aurez pas d'audience.";
          }
          c.adj({ hidden: { soupcons: 12 }, power: { presse: -6 } });
          if (c.s.europe.enquete) c.s.europe.enquete.enterree = false;
          return "Le procureur écoute la proposition, prend des notes, et répond qu'une transaction suppose que les faits soient établis et que l'enquête soit terminée — ni l'un ni l'autre n'est le cas. Puis il verse la proposition au dossier. Tout, avec lui, finit versé au dossier.";
        },
      },
    ],
  },
];
