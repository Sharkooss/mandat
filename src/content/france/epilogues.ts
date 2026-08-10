import type { GameState } from "../../engine/types";
import { nomDe, nomCompletDe } from "../../engine/noms";
import type { EndingCause } from "./fins";

// ---------------------------------------------------------------------------
// Le dernier jour.
//
// Une fin de partie ne doit pas tomber comme un couperet : le joueur a passé
// des heures à conduire un pays, il a droit à la scène. L'épilogue raconte
// concrètement comment ça s'est terminé — qui est entré, par quelle porte,
// ce qui a été dit — et il se souvient de l'état dans lequel le pays était.
//
// Rien ici n'est décoratif : chaque paragraphe se branche sur les jauges, sur
// l'armée, sur les rancunes accumulées. Deux parties qui finissent sur la même
// cause ne racontent pas la même chose.
// ---------------------------------------------------------------------------

/** Les indicateurs vitaux dans le rouge — la mesure objective de l'effondrement. */
export function indicateursCritiques(s: GameState): string[] {
  const out: string[] = [];
  if (s.country.croissance < 0) out.push("l'économie en récession");
  if (s.country.chomage > 12) out.push("le chômage de masse");
  if (s.country.inflation > 6) out.push("les prix hors de contrôle");
  if (s.country.dette > 150) out.push("une dette que plus personne ne finance");
  if (s.country.services < 25) out.push("des services publics à l'arrêt");
  if (s.country.cohesion < 25) out.push("un pays coupé en deux");
  if (s.country.securite < 30) out.push("des quartiers entiers hors contrôle");
  if (s.power.popularite < 25) out.push("un président que personne ne soutient plus");
  if (s.hidden.agitation > 70) out.push("la rue qui ne rentre plus chez elle");
  return out;
}

/** Le personnage vivant qui vous en veut le plus — souvent celui qui finit par agir. */
function plusRancunier(s: GameState): { id: string; rancune: number } | null {
  const liste = Object.values(s.characters)
    .filter((c) => c.vivant && c.id !== "conjoint")
    .sort((a, b) => b.rancune - a.rancune);
  const t = liste[0];
  return t && t.rancune >= 40 ? { id: t.id, rancune: t.rancune } : null;
}

/** Énumère à la française : « a, b et c ». */
function liste(items: string[], max = 3): string {
  const l = items.slice(0, max);
  if (l.length === 0) return "";
  if (l.length === 1) return l[0];
  return `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}`;
}

function heure(s: GameState): string {
  const h = 4 + (s.turnCount % 5);
  return `${h}h${String((s.seed % 6) * 10).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------

export function epilogue(s: GameState, cause: EndingCause): string[] {
  const critiques = indicateursCritiques(s);
  const ruine = critiques.length >= 4;
  const p: string[] = [];
  const rancunier = plusRancunier(s);
  const conjoint = s.bio.conjointPrenom;

  switch (cause) {
    // -- Les sorties par effondrement ---------------------------------------
    case "insurrection": {
      p.push(
        `Ça n'a pas commencé à la capitale. Ça a commencé dans une sous-préfecture dont personne ne se souvient du nom, un vendredi, quand les gendarmes ont refusé de dégager un blocage. À midi, trois préfectures étaient occupées. À la nuit, dix-sept.`
      );
      p.push(
        `Le pays tenait encore par habitude — ${liste(critiques, 3)}. L'habitude a lâché d'un coup, comme lâchent les habitudes. ${
          s.power.armee < 35
            ? `L'état-major a fait savoir qu'il « ne prendrait pas la responsabilité d'un ordre de tir sur la population ». C'était une phrase de communiqué. C'était aussi une réponse.`
            : `L'armée a été consultée. Elle a demandé un ordre écrit. Personne, à l'Élysée, n'a voulu signer.`
        }`
      );
      p.push(
        `Vous avez quitté le palais à ${heure(s)}, par la grille de la rue de l'Élysée, dans une voiture qui n'était pas la vôtre. ${
          s.hidden.paranoia > 60
            ? `Vous aviez fait vérifier l'itinéraire trois fois. Il n'y avait personne pour vous attendre : c'est ça qui vous a fait comprendre que c'était fini.`
            : `Une foule attendait devant l'entrée principale. Elle ne criait pas. C'est ce silence-là que les journaux ont décrit le lendemain, faute de pouvoir décrire autre chose.`
        }`
      );
      break;
    }

    case "chute_regime": {
      p.push(
        `Le régime a tenu exactement aussi longtemps que l'armée a bien voulu le porter. ${
          s.power.armee < 40
            ? `Le jour où deux régiments ont refusé de se déployer, il ne restait plus rien dessous.`
            : `Le jour où l'état-major a cessé de répondre au téléphone, il ne restait plus rien dessous.`
        }`
      );
      p.push(
        `Vous aviez promis ${
          s.bord <= -5 ? "que tout appartiendrait à tous" : "de rendre le pays à ceux qui y étaient nés"
        }. À la fin, ${
          s.bord <= -5
            ? "tout vous appartenait, et le mot « camarade » ne se prononçait plus qu'à la télévision d'État"
            : "le pays s'était réduit à un registre, un drapeau et une liste de gens à surveiller"
        }. Le peuple au nom duquel vous gouverniez a fini par se présenter en personne : ${liste(critiques, 3)}, et plus une seule institution capable d'amortir le choc.`
      );
      p.push(
        `La foule est entrée par la cour d'honneur, avec les soldats et non contre eux. Il n'y a pas eu de procès — il n'y avait plus de tribunal dont quiconque aurait reconnu la compétence. ${
          rancunier
            ? `${nomCompletDe(s, rancunier.id)} était sur les marches. On raconte que ${nomDe(s, rancunier.id)} n'a rien dit, et qu'il n'y avait rien à dire.`
            : `Ceux qui vous avaient servi étaient partis la veille, chacun de son côté, sans se prévenir.`
        }`
      );
      p.push(
        `La place a été rebaptisée dans l'année. Elle porte le nom d'une date : celle-là. On y organise chaque année une cérémonie courte, et les manuels que vous aviez fait réécrire ont été réécrits une seconde fois.`
      );
      break;
    }

    case "prison": {
      p.push(
        `Ce ne sont jamais les grands crimes qui font tomber un président. C'est une pièce jointe. ${nomCompletDe(s, "ferrand")} tenait le dossier depuis des mois — elle a attendu d'avoir la dernière signature, celle qui empêche de parler de montage.`
      );
      p.push(
        `La publication a eu lieu un mardi. Le mercredi, le parquet national financier ouvrait une information judiciaire. Le jeudi, ${
          s.power.parti < 40
            ? `votre propre parti publiait un communiqué de six lignes où votre nom n'apparaissait pas une seule fois.`
            : `trois ministres se déclaraient « sereins », ce qui est la formule consacrée pour prendre ses distances.`
        }`
      );
      p.push(
        `Vous avez quitté la fonction avant le terme, en invoquant « la sérénité des institutions ». L'instruction a duré quatre ans. ${
          s.player.integrite < 25
            ? `Le jugement est long de trois cent quarante pages. Il ne contient aucune circonstance atténuante.`
            : `Le jugement retient votre bonne foi sur l'essentiel et votre négligence sur le reste. C'est la partie « négligence » qui vous a coûté la liberté.`
        }`
      );
      p.push(
        `${conjoint ? `${conjoint} a fait le déplacement le premier jour. ` : ""}Vous êtes le premier ancien président de la Ve République à purger une peine ferme. Les manuels de droit constitutionnel ont dû créer un paragraphe.`
      );
      break;
    }

    case "la_haye": {
      const complices = Object.values(s.europe.nations).filter((n) => n.savoir >= 30).length;
      p.push(
        `Ce n'est pas la France qui vous juge, et c'est tout le problème. Un chef d'État français dispose, chez lui, d'une immunité, d'un Conseil constitutionnel et d'un garde des Sceaux à qui parler. Devant une juridiction internationale, il ne dispose de rien de tout cela — il dispose d'un avocat et d'un numéro de dossier.`
      );
      p.push(
        `${nomCompletDe(s, "soubeyran")} a été entendu pendant onze jours. ${
          s.flags["ordre_efface"]
            ? `Il a produit une copie de l'ordre que vous aviez fait retirer du registre. La cour a passé une demi-journée sur la question de savoir pourquoi l'original manquait — c'est cette demi-journée qui a décidé du reste.`
            : `Il n'a rien caché, rien chargé, et il a répété la même phrase à chaque audience : « J'ai exécuté un ordre régulier, signé, daté. » La régularité de l'ordre était précisément ce qui vous mettait en cause.`
        }`
      );
      p.push(
        complices >= 3
          ? `${complices} services alliés savaient depuis le début. Aucun n'a témoigné spontanément ; tous ont répondu aux commissions rogatoires, exhaustivement, avec des archives datées. On appelle cela la coopération judiciaire. C'est le mot que les amitiés d'État emploient quand elles cessent.`
          : `Deux gouvernements étrangers ont transmis des pièces sans qu'on les leur demande. On ne saura jamais s'il s'agissait de justice ou de règlement de comptes ; l'un et l'autre produisent les mêmes documents.`
      );
      p.push(
        `${conjoint ? `${conjoint} est venu le premier jour, puis plus du tout. ` : ""}Le pays, lui, a réagi de la manière la plus déroutante qui soit : il n'a pas réagi. On ne défile pas pour une opération que personne n'a demandée, contre quelqu'un dont personne n'a jamais su le nom.`
      );
      break;
    }

    case "mise_au_ban": {
      const perdus = Object.entries(s.europe.nations).filter(([, n]) => n.relation <= -30).length;
      p.push(
        `Il n'y a pas eu de rupture, pas de départ claqué, pas de référendum. Il y a eu une série de réunions auxquelles la France n'était pas conviée, et dont elle a appris l'existence par la presse — d'abord une, puis trois, puis toutes.`
      );
      p.push(
        `${perdus} capitales avaient cessé de répondre. Le Quai d'Orsay a longtemps parlé de « tensions conjoncturelles », puis a cessé d'écrire des notes, faute d'interlocuteurs à qui les adresser. Une influence de ${Math.round(
          s.country.influence
        )}/100 ne se lit pas comme un chiffre : elle se lit dans le nombre de fois où un téléphone ne sonne pas.`
      );
      p.push(
        s.bord >= 5
          ? `Vous aviez promis de reprendre le contrôle et vous l'avez repris : le pays décide désormais tout seul de choses dont il ne décide plus rien, parce qu'elles se décident ailleurs, à vingt-six. La souveraineté retrouvée s'est révélée être une salle vide avec un très beau plafond.`
          : `Vous aviez promis une autre Europe. Vous en avez obtenu une autre, en effet : celle qui se réunit sans vous. Les capitales qui partageaient vos idées ont, l'une après l'autre, préféré la table où l'on décide à celle où l'on a raison.`
      );
      p.push(
        `Votre successeur a fait de la « réintégration » son premier chantier. Il lui a fallu six ans, et il a dû commencer par expliquer, dans chaque capitale, qu'il n'était pas vous.`
      );
      break;
    }

    case "europe_presidence": {
      const amis = Object.values(s.europe.nations).filter((n) => n.relation >= 35).length;
      p.push(
        `Le traité porte le nom d'une ville et, dans toutes les langues du continent sauf le français, le vôtre en sous-titre. Il a fallu dix-neuf mois de ratification, deux référendums gagnés de justesse ailleurs, et ${amis} capitales qui ont tenu quand il aurait été plus simple de lâcher.`
      );
      p.push(
        `Ce que les manuels retiendront, c'est le mécanisme de financement commun. Ce dont vous vous souviendrez, c'est d'une nuit de février, dans un couloir sans fenêtre, où tout a failli s'arrêter sur une virgule concernant les régions ultrapériphériques, et de la tête du juriste qui a trouvé la formulation à 4 h 10.`
      );
      p.push(
        s.power.popularite < 45
          ? `À l'intérieur, on vous a reproché tout cela sans discontinuer : les déplacements, les nuits blanches, les sommets pendant que le pays attendait. Ils n'avaient pas tort. On ne peut pas être partout, et vous avez choisi le continent. Votre popularité à ${Math.round(
              s.power.popularite
            )}/100 est le prix affiché de ce choix, et il était affiché dès le début.`
          : `Le plus rare n'est pas d'avoir refait l'Europe : c'est de l'avoir fait sans que le pays vous le fasse payer. Il y a là une conjonction que personne n'a su reproduire depuis, et sur laquelle trois thèses ont été soutenues.`
      );
      p.push(
        `Vous présidez aujourd'hui une institution qui n'existait pas quand vous êtes entré en fonction. ${
          conjoint ? `${conjoint} vous fait remarquer que vous n'avez toujours pas pris de vacances. ` : ""
        }Sur le mur du bureau, il y a une photographie de la salle de signature prise de très loin, pour qu'on voie surtout la salle.`
      );
      break;
    }

    // -- Les sorties violentes ----------------------------------------------
    case "assassinat": {
      const parRancune = rancunier && rancunier.rancune >= 60;
      p.push(
        parRancune
          ? `On a longtemps cherché un déséquilibré. On a trouvé un dossier — et dans le dossier, un nom que vous connaissiez : ${nomCompletDe(s, rancunier!.id)}. Pas la main qui a tiré. Celle qui a ouvert les portes, arrangé les horaires, laissé traîner un itinéraire.`
          : `Trois secondes, à la sortie d'une cérémonie ordinaire. Le protocole avait signalé le point faible du dispositif onze jours plus tôt, dans une note que personne n'a lue jusqu'au bout.`
      );
      p.push(
        s.derive >= 6
          ? `L'enquête a été confiée aux services que vous aviez vous-même placés hors de tout contrôle. Ils ont rendu leurs conclusions en six semaines. Personne, à l'étranger, n'a fait semblant d'y croire.`
          : `L'enquête a été longue, publique et honnête. Elle n'a rien changé : on ne répare pas trois secondes.`
      );
      p.push(
        `${
          s.power.popularite < 35
            ? `Le pays vous détestait le matin. Il vous a pleuré l'après-midi. Les deux étaient sincères — c'est une chose qu'on apprend tard sur les peuples.`
            : `Cinq cent mille personnes dans les rues. Beaucoup n'avaient jamais voté pour vous et le disaient à voix haute, en pleurant, sans y voir de contradiction.`
        } ${conjoint ? `${conjoint} a refusé les obsèques nationales, puis a cédé.` : ""}`
      );
      break;
    }

    case "coup": {
      p.push(
        `Le communiqué n°1 a été lu à ${heure(s)} du matin par un colonel que personne ne connaissait. Il portait des gants blancs. C'est le détail que tout le monde a retenu.`
      );
      p.push(
        s.flags["verdier_limoge"]
          ? `Le général que vous aviez limogé n'était pas dans le studio. Il était dans la pièce d'à côté, et c'est lui qui avait relu le texte. On ne se débarrasse pas d'un chef d'état-major : on change simplement l'endroit d'où il commande.`
          : `Vous aviez vu passer les signes pendant des mois — les dîners déclinés, les manœuvres non planifiées, les transmissions hors protocole. Chacun était explicable. C'est le propre des signes.`
      );
      p.push(
        `${
          ruine
            ? `Le pays n'a pas défendu la République, parce que la République ne défendait plus grand monde : ${liste(critiques, 3)}. Il y a eu des manifestations. Elles étaient tristes et peu nombreuses.`
            : `Il y a eu une résistance, réelle, dans trois villes. Elle a duré onze jours. On lui a consacré depuis deux films et une rue.`
        }`
      );
      break;
    }

    case "mort_epuisement": {
      p.push(
        `Le communiqué parle d'un « malaise dans l'exercice de ses fonctions ». Les mots « épuisement », « dix-huit heures par jour » et « avertissements répétés » ne figurent dans aucune version officielle.`
      );
      p.push(
        `${nomCompletDe(s, "manin")} avait posé un ultimatum médical. Vous l'aviez entendu comme on entend une contrainte d'agenda. ${
          conjoint ? `${conjoint} l'avait posé aussi, dans d'autres termes, plus tôt.` : ""
        }`
      );
      p.push(`On vous a trouvé le matin, dans le bureau, avec la note du lendemain annotée jusqu'à la moitié. L'autre moitié a été traitée par votre successeur, qui a gardé vos annotations.`);
      break;
    }

    // -- Les sorties politiques ---------------------------------------------
    case "censure": {
      p.push(`289 voix. Le compte y était, à deux près, et les deux étaient de votre camp — ils avaient prévenu, et vous n'aviez pas rappelé.`);
      p.push(
        `${nomCompletDe(s, "rochefort")} a remis la démission du gouvernement dans l'heure, avec la correction de quelqu'un qui avait préparé cette lettre depuis longtemps. Vous auriez pu nommer un autre gouvernement. Vous saviez ce qu'il serait devenu.`
      );
      p.push(`Le pays a suivi la séance en direct, puis est passé à autre chose avant le journal de 20 heures. C'est la vitesse à laquelle les crises de régime se digèrent, quand le régime, lui, tient encore.`);
      break;
    }

    case "poignards": {
      p.push(
        `Personne ne vous a battu. C'est un point qu'il faut souligner, parce que c'est le plus humiliant : il n'y a pas eu de vainqueur, seulement un vide qui s'est creusé autour de vous, semaine après semaine.`
      );
      p.push(
        `${nomCompletDe(s, "delval")} a compté les voix avant vous — c'est son métier, et vous le lui aviez confié. Quand la délégation est arrivée dans le bureau, elle n'avait pas besoin de parler : elle était venue à sept, et sept, c'était déjà la réponse.`
      );
      p.push(
        `${
          rancunier
            ? `${nomCompletDe(s, rancunier.id)} n'était pas de la délégation. ${nomDe(s, rancunier.id)} avait fait le travail avant, plus discrètement, et n'avait aucune raison d'être là pour la photo.`
            : `Vous avez signé la lettre le soir même. La formule « pour ne pas ajouter la crise à la crise » était de vous. Elle a beaucoup servi depuis.`
        }`
      );
      break;
    }

    case "battu":
    case "jamais_elu": {
      p.push(
        `20 heures. Le visage à l'écran n'est pas le vôtre. Dans la salle, quelqu'un a coupé la musique trop tard, et pendant six secondes il y a eu de la fête sur une défaite — le genre de détail dont on se souvient vingt ans après.`
      );
      p.push(
        cause === "battu"
          ? `Vous êtes descendu, vous avez parlé quatre minutes, vous avez félicité. Les mots existaient déjà, il suffisait de les prendre dans l'ordre. ${
              s.power.popularite < 35 ? `Le pays ne vous a pas remercié : il avait passé cinq ans à préparer ce soir-là.` : `Le pays vous a applaudi de loin, avec la tendresse qu'on réserve à ceux qui s'en vont.`
            }`
          : `Vous n'aurez pas gouverné. Toute une vie de préparation pour une soirée de six secondes de trop. Les carrières politiques sont pleines de gens qui n'ont jamais franchi ce seuil, et qui, à quatre-vingts ans, en parlent encore comme d'hier.`
      );
      break;
    }

    // -- Les sorties honorables ---------------------------------------------
    case "statues": {
      p.push(
        `Vous partez avec un pays en meilleur état que celui qu'on vous a confié. C'est une phrase courte. Très peu de vos prédécesseurs pouvaient la prononcer sans avoir à l'aménager.`
      );
      p.push(
        `Croissance tenue, cohésion recousue, contre-pouvoirs intacts : les trois ensemble, ce que les manuels appelleront plus tard « le triangle », et dont ils expliqueront doctement qu'il était impossible. Vous avez quitté l'Élysée à pied, ce qui n'était pas prévu par le protocole et que le protocole a fini par accepter.`
      );
      p.push(
        `La première statue a été inaugurée de votre vivant, dans votre département, contre votre avis explicite. Vous avez demandé qu'on retire l'inscription élogieuse et qu'on garde les dates. On a gardé les deux. ${
          conjoint ? `${conjoint} trouve qu'elle ne vous ressemble pas. Vous en êtes secrètement soulagé.` : ""
        }`
      );
      break;
    }

    case "fin_mandats": {
      p.push(
        `Dix ans, jour pour jour. Vous rendez un pays qui tient debout, avec des libertés que personne n'a eu à défendre contre vous — c'est peu spectaculaire et c'est presque tout.`
      );
      p.push(
        `Le dernier conseil a duré quarante minutes. À la fin, ${nomCompletDe(s, "rochefort")} a dit quelque chose de banal sur la continuité de l'État, et deux personnes autour de la table ont pleuré, ce qui n'était pas prévu à l'ordre du jour.`
      );
      p.push(`Une place portera votre nom. Il y en a peu, des places gagnées comme ça : la plupart sont attribuées par des conseils municipaux qui n'ont pas connu l'intéressé.`);
      break;
    }

    case "memoires": {
      p.push(
        `Il n'y a pas eu de scène. Les mandats ordinaires se terminent le mardi, avec une passation de quarante minutes et un carton d'archives que personne ne rouvrira.`
      );
      p.push(
        `${
          ruine
            ? `Vous laissez ${liste(critiques, 3)}. Votre successeur en fera son premier discours, et vous en serez le personnage principal sans être nommé.`
            : `Vous laissez un pays à peu près comme vous l'avez trouvé — ce qui, selon l'humeur des chroniqueurs, s'appelle de la stabilité ou du surplace.`
        }`
      );
      p.push(`Le livre sortira dans deux ans. Il s'appellera « Le Prix des choses ». Il se vendra bien. Vous n'y direz pas tout, et le chapitre le plus lu sera celui où vous en dites le moins.`);
      break;
    }

    case "geneve": {
      p.push(`Le pays ne vous a pas reconduit ; le monde vous a recruté. Les deux se sont produits à quatre mois d'intervalle, et le second a beaucoup consolé du premier.`);
      p.push(
        `Vous prenez la tête d'une organisation dont votre pays, il y a peu, contestait le budget — c'est aussi ça, un prestige international à ${s.country.prestige}/100 : ça n'a jamais fait gagner une élection, et ça ouvre des portes que les élections ne fabriquent pas.`
      );
      break;
    }

    case "retrait_volontaire": {
      p.push(`Vous aviez dit une chose. Vous l'avez faite. La classe politique a mis dix-huit mois à s'en remettre, et certains n'y croient toujours pas.`);
      p.push(
        `Le dernier jour, il y avait cent quarante journalistes dans la cour, et la question revenait sous quinze formulations : pourquoi ? La seule réponse honnête — « parce que je l'avais dit » — n'a été retenue par aucune rédaction, faute d'arrière-pensée exploitable.`
      );
      break;
    }

    case "cincinnatus": {
      p.push(
        `Vous aviez tout le pouvoir. Vous l'avez rendu, morceau par morceau, en organisant méthodiquement les conditions de votre propre défaite. Aucun de vos conseillers n'a compris avant la fin ; certains ne comprennent toujours pas.`
      );
      p.push(
        `Dimanche, 20h. Vous avez perdu largement, proprement, et vous avez félicité votre successeur avant que les résultats définitifs ne tombent. Sur le perron, il cherchait ses mots. Vous connaissiez la sensation.`
      );
      p.push(`Vous vivez aujourd'hui dans une maison sans grille, dans un pays qui a de nouveau des journaux qui vous détestent. C'est, à la réflexion, exactement ce que vous vouliez.`);
      break;
    }

    // -- Les sorties autoritaires qui tiennent -------------------------------
    case "consulat":
    case "republique_populaire":
    case "etat_national": {
      p.push(
        `Il n'y a pas eu de dernier jour. C'est la particularité de ce genre de sortie : elle n'a pas de date, seulement une durée qui s'allonge.`
      );
      p.push(
        `${
          s.power.armee >= 55
            ? `L'armée est restée loyale — c'est la seule chose qui vous a été demandée, et c'est la seule que vous ayez vraiment payée, en budgets, en décorations et en silences.`
            : `L'armée ne vous aime pas, mais elle a jugé qu'un changement coûterait plus cher que vous. Les régimes tiennent souvent sur des arbitrages de ce niveau.`
        } ${
          ruine
            ? `Le pays, lui, va mal : ${liste(critiques, 3)}. Les chiffres ne sont plus publiés depuis trois ans, ce qui règle la question de leur interprétation.`
            : `Le pays fonctionne. Mal par endroits, correctement ailleurs. C'est l'argument principal du régime, et il n'est pas entièrement faux.`
        }`
      );
      p.push(
        `${nomCompletDe(s, "ferrand")} a cessé de publier en année trois. On ne sait pas ce qu'elle est devenue, et la question n'est plus posée dans les conférences de presse — il n'y a plus de conférences de presse.`
      );
      break;
    }

    case "consulat_perdu": {
      p.push(`61 % de non. Vous aviez demandé au peuple la permission de rester ; il a saisi la seule occasion qu'on lui offrait depuis des années de tout dire d'un coup.`);
      p.push(
        `La soirée a été étrange : pas de foule, pas de casse, juste un taux de participation que le ministère de l'Intérieur a mis quatre heures à publier. ${nomCompletDe(s, "mazeau")} a parlé d'un « signal ». C'était un verdict.`
      );
      break;
    }

    default:
      p.push(`Et puis ça s'est arrêté, comme s'arrêtent la plupart des mandats : par une addition de choses qu'on n'avait pas le temps de regarder en face.`);
  }

  return p;
}
