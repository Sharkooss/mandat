import type { CharacterDef, PromiseDef, Rarete, SegmentDef } from "../../engine/types";

// ---------------------------------------------------------------------------
// Les segments d'électorat (poids somme à 100)
// ---------------------------------------------------------------------------

export const SEGMENTS: SegmentDef[] = [
  { id: "retraites", nom: "Retraités", poids: 20, soutien: 42, participation: 80, description: "Pensions, sécurité, stabilité. Le socle de toute majorité — et le plus cher à entretenir." },
  { id: "periurbain", nom: "Ouvriers et employés du périurbain", poids: 15, soutien: 30, participation: 50, description: "Salaires, carburant, usines. Le segment que tout le monde invoque et que personne ne sert." },
  { id: "urbains", nom: "Cadres urbains diplômés", poids: 10, soutien: 45, participation: 72, description: "Climat, Europe, libertés. Les premiers à décrocher quand les contre-pouvoirs faiblissent." },
  { id: "jeunes", nom: "Jeunes (18-30 ans)", poids: 12, soutien: 35, participation: 35, description: "Logement, salaire d'entrée, climat. Les plus élastiques du corps électoral." },
  { id: "ruraux", nom: "Ruraux et agriculteurs", poids: 8, soutien: 34, participation: 74, description: "Services publics, revenu agricole. Un blocage de tracteurs fait plus de dégâts qu'une grève." },
  { id: "pavillonnaires", nom: "Classes moyennes pavillonnaires", poids: 12, soutien: 40, participation: 68, description: "Impôts, école, sécurité du quotidien. Le segment pivot de toutes les élections françaises." },
  { id: "quartiers", nom: "Quartiers populaires", poids: 7, soutien: 38, participation: 30, description: "Emploi, respect, services. Jugent d'abord les décisions sécuritaires — souvent sans être consultés." },
  { id: "public", nom: "Fonctionnaires et salariés du public", poids: 9, soutien: 41, participation: 75, description: "Statut, salaires, hôpital, école. Le seul segment qui peut arrêter le pays." },
  { id: "independants", nom: "Indépendants et commerçants", poids: 4, soutien: 38, participation: 76, description: "Charges basses, ordre, la paix. Sur-représentés dans chaque rue commerçante visitée." },
  { id: "csp", nom: "CSP+ et patrimoine", poids: 3, soutien: 48, participation: 84, description: "Compétitivité, fiscalité stable. Les perdre assèche la levée de fonds, pas les urnes." },
];

// ---------------------------------------------------------------------------
// Acte I — les cinq écrans de création
// ---------------------------------------------------------------------------

export interface CreationOption {
  id: string;
  nom: string;
  detail: string;
  /** Ce que l'option vous donne. */
  effets: string;
  /** Ce qu'elle vous coûte — toute origine se paie quelque part. */
  cout?: string;
  /** Inclinaison de départ sur la ligne politique (−3 gauche à +3 droite). */
  bord?: number;
  rarete: Rarete;
  icone: string;
}

export const REGIONS: CreationOption[] = [
  { id: "nord", nom: "Le bassin minier", detail: "Père ouvrier, mère au guichet.", effets: "+ endurance · périurbain", cout: "− réseau", bord: -1, rarete: "commune", icone: "⛏" },
  { id: "paris", nom: "Les beaux quartiers", detail: "Héritier. Le soupçon ne partira jamais.", effets: "+ réseau · levée de fonds", cout: "− quartiers · étiquette de privilégié", bord: 1, rarete: "commune", icone: "◈" },
  { id: "banlieue", nom: "La banlieue populaire", detail: "Le quartier attend tout de vous.", effets: "+ charisme · jeunes · quartiers", cout: "− ruraux · on vous ramènera toujours à ça", bord: -1, rarete: "peu_commune", icone: "▲" },
  { id: "bretagne", nom: "La Bretagne", detail: "Ancrage terrien, réseau dense, pluie fine.", effets: "+ stratégie · ruraux", cout: "− prestige international", rarete: "commune", icone: "⚓" },
  { id: "sudouest", nom: "Le Sud-Ouest rural", detail: "La république des maires et des cantines.", effets: "+ réseau · stratégie · ruraux", cout: "− urbains", rarete: "commune", icone: "☘" },
  { id: "lyon", nom: "La bourgeoisie lyonnaise", detail: "Gestion, sérieux, froideur polie.", effets: "+ stratégie · patronat", cout: "− charisme", bord: 1, rarete: "commune", icone: "⬢" },
  { id: "marseille", nom: "Marseille et le littoral", detail: "Des amitiés qu'il valait mieux ne pas avoir.", effets: "+ rhétorique · charisme", cout: "un passé qui ressortira devant un juge", rarete: "peu_commune", icone: "⚑" },
  { id: "est", nom: "L'Est frontalier", detail: "Europe, industrie, rigueur.", effets: "+ prestige · stratégie", cout: "− charisme", rarete: "commune", icone: "✦" },
  { id: "outremer", nom: "L'outre-mer", detail: "Une première historique.", effets: "+ cohésion · popularité · quartiers", cout: "la vie chère devient votre dossier permanent", bord: -1, rarete: "rare", icone: "❋" },
  { id: "exil", nom: "L'enfance à l'étranger", detail: "Fille de diplomate, six pays avant vingt ans.", effets: "+ prestige · réseau", cout: "− charisme · aucun ancrage local", rarete: "rare", icone: "✈" },
  { id: "montagne", nom: "La vallée alpine", detail: "Un village, une école, une route qui ferme l'hiver.", effets: "+ endurance · ruraux · environnement", cout: "− réseau parisien", rarete: "peu_commune", icone: "⛰" },
  { id: "normandie", nom: "Le bocage normand", detail: "Des vaches, des plages de débarquement, un silence.", effets: "+ endurance · ruraux · prestige mémoriel", cout: "− rhétorique", rarete: "commune", icone: "❧" },
  { id: "corse", nom: "L'île", detail: "Ici, tout le monde connaît le nom de votre grand-père.", effets: "+ réseau · loyautés inconditionnelles", cout: "− prestige · un cousin qui posera problème", rarete: "peu_commune", icone: "✵" },
  { id: "nord_pavillon", nom: "Le lotissement périurbain", detail: "Vingt kilomètres de la ville, deux voitures, un crédit.", effets: "+ pavillonnaires · périurbain", cout: "− urbains · − prestige", rarete: "commune", icone: "⌂" },
  { id: "ouvriere_usine", nom: "La cité industrielle du Rhône", detail: "Une usine chimique, un stade, un cimetière ouvrier.", effets: "+ endurance · syndicats · périurbain", cout: "− environnement · − csp", bord: -2, rarete: "peu_commune", icone: "⚗" },
  { id: "vignoble", nom: "Le vignoble bordelais", detail: "Des dîners où l'on parle bas et où l'on décide haut.", effets: "+ réseau · patronat · csp", cout: "− quartiers · − jeunes", bord: 2, rarete: "peu_commune", icone: "❦" },
  { id: "guyane", nom: "La forêt guyanaise", detail: "Le fleuve, l'orpaillage, la République à trois heures de pirogue.", effets: "+ endurance · environnement · cohésion", cout: "− réseau · un dossier sécuritaire insoluble", bord: -1, rarete: "rare", icone: "❈" },
  { id: "harkis", nom: "Le camp de transit", detail: "Vos grands-parents y ont vécu quatre ans. On l'a oublié, pas eux.", effets: "+ endurance · légitimité mémorielle · cohésion", cout: "− réseau ; une plaie nationale à rouvrir", rarete: "legendaire", icone: "✧" },
];

export const MILIEUX: CreationOption[] = [
  { id: "ouvrier", nom: "Milieu ouvrier", detail: "On sait d'où vous venez. Vous aussi.", effets: "+ endurance · périurbain", cout: "− réseau", bord: -1, rarete: "commune", icone: "⚒" },
  { id: "fonctionnaire", nom: "Fonction publique", detail: "Le service de l'État comme évidence.", effets: "+ intégrité · public", cout: "− patronat", rarete: "commune", icone: "⚖" },
  { id: "commercant", nom: "Petit commerce", detail: "Les comptes du soir à la table de la cuisine.", effets: "+ stratégie · indépendants", cout: "− public", bord: 1, rarete: "commune", icone: "🛍" },
  { id: "bourgeois", nom: "Grande bourgeoisie", detail: "Les codes, les dîners, les adresses.", effets: "+ réseau · csp · patronat", cout: "+ cynisme · − quartiers", bord: 2, rarete: "peu_commune", icone: "♛" },
  { id: "agricole", nom: "Exploitation agricole", detail: "Levé avant l'aube, toute votre enfance.", effets: "+ endurance · ruraux", cout: "− urbains", rarete: "commune", icone: "🌾" },
  { id: "enseignant", nom: "Famille d'enseignants", detail: "Des livres partout, jamais d'argent.", effets: "+ rhétorique · public · urbains", cout: "− réseau économique", bord: -1, rarete: "peu_commune", icone: "✎" },
  { id: "immigre", nom: "Parents immigrés", detail: "Deux langues, deux mondes, une seule carte d'identité.", effets: "+ endurance · quartiers · jeunes", cout: "− ruraux ; une campagne de haine vous attend", bord: -1, rarete: "rare", icone: "◐" },
  { id: "militaire_famille", nom: "Famille de militaires", detail: "Quatre générations, la même devise au mur.", effets: "+ armée · endurance · sécurité", cout: "− urbains", bord: 1, rarete: "commune", icone: "⚔" },
  { id: "artisan", nom: "Atelier d'artisan", detail: "Un père qui refusait de sous-traiter, par principe.", effets: "+ indépendants · endurance · intégrité", cout: "− réseau", rarete: "commune", icone: "⚙" },
  { id: "medical", nom: "Cabinet médical de campagne", detail: "La salle d'attente comme premier théâtre politique.", effets: "+ intégrité · ruraux · services", cout: "− cynisme utile", rarete: "peu_commune", icone: "✚" },
  { id: "monoparental", nom: "Élevé par votre mère seule", detail: "Trois emplois, aucune plainte, une exigence absolue.", effets: "+ endurance · charisme · quartiers", cout: "− réseau · − csp", bord: -1, rarete: "peu_commune", icone: "◑" },
  { id: "patronal", nom: "Héritier d'une PME familiale", detail: "Deux cents salariés qui vous ont vu grandir.", effets: "+ patronat · stratégie · indépendants", cout: "− syndicats ; un conflit social dans votre nom", bord: 2, rarete: "peu_commune", icone: "⬡" },
  { id: "clerical", nom: "Famille catholique pratiquante", detail: "La messe, le scoutisme, et une idée du bien commun.", effets: "+ intégrité · ruraux · pavillonnaires", cout: "− urbains · − jeunes", bord: 1, rarete: "commune", icone: "✝" },
  { id: "communiste", nom: "Famille communiste", detail: "Le portrait au mur, la fête de l'Huma tous les ans.", effets: "+ syndicats · rhétorique · public", cout: "− patronat · − csp", bord: -2, rarete: "peu_commune", icone: "☭" },
];

export const FORMATIONS: CreationOption[] = [
  { id: "ena", nom: "L'école du pouvoir", detail: "La voie royale. On vous y attend.", effets: "+ stratégie · réseau", cout: "− popularité · − périurbain", rarete: "commune", icone: "▣" },
  { id: "droit", nom: "Faculté de droit", detail: "Éloquence et procédure.", effets: "+ rhétorique · justice", cout: "aucune compétence budgétaire", rarete: "commune", icone: "§" },
  { id: "eco", nom: "Thèse en économie", detail: "Vous savez lire un budget. Vraiment.", effets: "+ stratégie · crédibilité budgétaire", cout: "− charisme", rarete: "commune", icone: "∑" },
  { id: "militaire", nom: "Carrière militaire", detail: "Quinze ans sous l'uniforme.", effets: "+ endurance · armée · sécurité", cout: "− urbains ; un passé d'opérations qui ressortira", bord: 1, rarete: "peu_commune", icone: "★" },
  { id: "autodidacte", nom: "Autodidacte", detail: "Parti de rien, appris sur le tas.", effets: "+ charisme · endurance", cout: "− réseau · − stratégie", rarete: "peu_commune", icone: "◇" },
  { id: "medecin", nom: "Médecine hospitalière", detail: "Vingt ans de gardes avant la politique.", effets: "+ intégrité · services · crédibilité santé", cout: "− réseau politique", rarete: "rare", icone: "✚" },
  { id: "syndicale", nom: "L'école du syndicat", detail: "Formé dans les assemblées générales.", effets: "+ charisme · syndicats", cout: "− patronat · − csp", bord: -2, rarete: "peu_commune", icone: "✊" },
  { id: "ingenieur", nom: "Grande école d'ingénieurs", detail: "Vous croyez aux solutions techniques. C'est votre force et votre angle mort.", effets: "+ stratégie · environnement · crédibilité industrielle", cout: "− rhétorique", rarete: "commune", icone: "◭" },
  { id: "journalisme", nom: "École de journalisme", detail: "Vous connaissez la mécanique de l'autre côté.", effets: "+ rhétorique · presse", cout: "− intégrité perçue ; vos anciens confrères sont impitoyables", rarete: "peu_commune", icone: "✑" },
  { id: "prof", nom: "Professeur d'histoire", detail: "Vingt ans de classes de troisième. Rien ne vous impressionne.", effets: "+ rhétorique · public · endurance", cout: "− réseau économique", bord: -1, rarete: "commune", icone: "✎" },
  { id: "affaires", nom: "Carrière dans la finance", detail: "Huit ans à Londres, un bonus dont vous ne parlez jamais.", effets: "+ patronat · csp · stratégie", cout: "− intégrité perçue · − périurbain", bord: 2, rarete: "peu_commune", icone: "◈" },
  { id: "humanitaire", nom: "Quinze ans dans l'humanitaire", detail: "Cinq zones de guerre, deux enlèvements évités.", effets: "+ intégrité · prestige · cohésion", cout: "− stratégie politique · une naïveté qu'on vous reprochera", bord: -1, rarete: "rare", icone: "❋" },
  { id: "police", nom: "Commissaire de police", detail: "Vous avez vu ce que le pays produit la nuit.", effets: "+ sécurité · endurance · pavillonnaires", cout: "− quartiers · − urbains", bord: 2, rarete: "peu_commune", icone: "⌘" },
  { id: "sportif", nom: "Sport de haut niveau", detail: "Une médaille, puis un genou, puis la politique.", effets: "+ charisme · popularité · jeunes", cout: "− stratégie ; on vous croira léger dix ans de plus", rarete: "rare", icone: "✹" },
];

export const EVENEMENTS_FONDATEURS: CreationOption[] = [
  { id: "usine", nom: "La fermeture de l'usine", detail: "Vous aviez seize ans. Le piquet a perdu.", effets: "+ périurbain · public · cause sociale", cout: "ce combat vous rattrapera au pouvoir", bord: -1, rarete: "commune", icone: "🏭" },
  { id: "frere", nom: "Le frère condamné", detail: "Une affaire, un silence de famille.", effets: "+ endurance", cout: "il demandera une grâce, un jour, en public", rarete: "peu_commune", icone: "⛓" },
  { id: "attentat", nom: "L'attentat auquel vous avez survécu", detail: "Vous y étiez. Vous n'en parlez jamais.", effets: "+ endurance · légitimité sécurité", cout: "des cauchemars · − santé", rarete: "rare", icone: "✷" },
  { id: "these", nom: "La thèse écrite trop vite", detail: "Trois chapitres empruntés. Pour l'instant.", effets: "+ stratégie · réseau · carrière accélérée", cout: "une bombe à retardement documentée", rarete: "peu_commune", icone: "📄" },
  { id: "campagne_perdue", nom: "La première campagne perdue", detail: "Battu à 21 ans. Le score, vous l'avez retenu.", effets: "+ stratégie", cout: "+ cynisme", rarete: "commune", icone: "☒" },
  { id: "greve_faim", nom: "La grève de la faim", detail: "Douze jours devant une préfecture. Vous aviez gagné.", effets: "+ charisme · endurance · syndicats", cout: "une santé entamée pour toujours", bord: -2, rarete: "legendaire", icone: "◉" },
  { id: "sauvetage", nom: "Le sauvetage", detail: "Vous avez sorti deux personnes d'une voiture en feu.", effets: "+ popularité durable · charisme", cout: "on attendra ce courage-là chaque semaine", rarete: "rare", icone: "✹" },
  { id: "faillite", nom: "La faillite familiale", detail: "L'huissier, le dimanche, devant les voisins.", effets: "+ endurance · indépendants · crédibilité économique", cout: "− réseau ; une rancune tenace envers les banques", rarete: "commune", icone: "⌧" },
  { id: "deuil", nom: "L'enfant qu'on n'a pas sauvé", detail: "Aux urgences, un vendredi soir, faute de lit.", effets: "+ services · crédibilité santé · intégrité", cout: "− santé ; un sujet sur lequel vous perdez tout sang-froid", bord: -1, rarete: "rare", icone: "✜" },
  { id: "emeute", nom: "La nuit des émeutes", detail: "Vous aviez dix-neuf ans, du mauvais côté du cordon.", effets: "+ quartiers · jeunes · endurance", cout: "− pavillonnaires ; une garde à vue archivée quelque part", bord: -2, rarete: "peu_commune", icone: "◮" },
  { id: "opex", nom: "L'embuscade", detail: "Trois morts dans votre section. Vous commandiez.", effets: "+ armée · endurance · sécurité", cout: "− santé ; des familles qui attendent toujours la vérité", bord: 1, rarete: "rare", icone: "⚔" },
  { id: "lanceur", nom: "Le dossier que vous avez sorti", detail: "Vous avez fait tomber un ministre. À trente ans.", effets: "+ intégrité · presse · popularité", cout: "− réseau ; la moitié de la classe politique vous hait", rarete: "rare", icone: "⚿" },
  { id: "prison", nom: "Les six mois de détention provisoire", detail: "Un dossier vide, une instruction bâclée, une carrière brisée puis reconstruite.", effets: "+ endurance · justice · légitimité morale", cout: "− prestige ; le mot « mis en examen » vous colle à la peau", rarete: "legendaire", icone: "▤" },
  { id: "canicule", nom: "L'été où les vieux sont morts", detail: "Vous étiez interne. On empilait les corps au sous-sol.", effets: "+ services · environnement · retraités", cout: "− santé mentale ; une obsession climatique qu'on jugera excessive", bord: -1, rarete: "peu_commune", icone: "☀" },
  { id: "delocalisation", nom: "La délocalisation de votre boîte", detail: "Vous étiez le DRH. Vous avez signé les lettres.", effets: "+ stratégie · patronat · réalisme économique", cout: "+ cynisme · − périurbain ; quatre-vingts noms que vous connaissez", bord: 1, rarete: "peu_commune", icone: "⌇" },
  { id: "rencontre", nom: "La poignée de main présidentielle", detail: "Vous aviez douze ans. Vous avez su ce soir-là.", effets: "+ charisme · réseau · ambition intacte", cout: "− intégrité ; vous faites de la politique pour la politique", rarete: "commune", icone: "✦" },
  { id: "naufrage", nom: "Le naufrage devant Lampedusa", detail: "Vous étiez à bord de l'ONG. Soixante-trois corps.", effets: "+ cohésion · prestige moral · urbains", cout: "− ruraux · − pavillonnaires ; un sujet qui vous coûtera des élections", bord: -2, rarete: "rare", icone: "❋" },
  { id: "braquage", nom: "Le commerce de vos parents braqué", detail: "Deux fois en un an. La deuxième, votre père n'a pas rouvert.", effets: "+ sécurité · indépendants · pavillonnaires", cout: "− quartiers ; une fermeté que rien ne tempère", bord: 2, rarete: "peu_commune", icone: "◪" },
];

export const MENTORS: CreationOption[] = [
  { id: "baron", nom: "Le baron local", detail: "Quarante ans de mandats, chaque bulletin en tête.", effets: "+ réseau · stratégie", cout: "+ cynisme ; il attend un retour, et il le dira", rarete: "commune", icone: "♜" },
  { id: "professeure", nom: "La professeure de droit", detail: "Elle croit aux institutions plus qu'aux hommes.", effets: "+ intégrité · rhétorique · justice", cout: "elle vous jugera publiquement le jour venu", rarete: "commune", icone: "⚜" },
  { id: "syndicaliste", nom: "Le vieux syndicaliste", detail: "Il vous a appris les salles hostiles.", effets: "+ charisme · syndicats", cout: "− patronat", bord: -1, rarete: "commune", icone: "✊" },
  { id: "industriel", nom: "L'industriel philanthrope", detail: "Il finance des carrières comme d'autres des musées.", effets: "+ réseau · patronat · fonds de campagne", cout: "un carnet qui engage, et qui existe", bord: 1, rarete: "peu_commune", icone: "⬣" },
  { id: "prefet", nom: "L'ancien préfet", detail: "Il sait comment l'État fonctionne vraiment.", effets: "+ stratégie · sécurité", cout: "il connaît vos dossiers mieux que vous", rarete: "commune", icone: "◫" },
  { id: "resistante", nom: "La dernière résistante", detail: "Cent deux ans. Elle vous a dit une seule phrase.", effets: "+ intégrité · cohésion · légitimité morale", cout: "une exigence à laquelle vous ne serez jamais à la hauteur", rarete: "legendaire", icone: "✶" },
  { id: "personne", nom: "Personne", detail: "Vous ne devez rien à personne. C'est aussi une faiblesse.", effets: "+ intégrité", cout: "− réseau · − stratégie", rarete: "rare", icone: "○" },
  { id: "cure", nom: "Le curé de la paroisse", detail: "Il a enterré votre père et vous a trouvé votre premier emploi.", effets: "+ intégrité · ruraux · cohésion", cout: "− urbains ; une laïcité qu'on vous contestera", bord: 1, rarete: "commune", icone: "✝" },
  { id: "patronne", nom: "La patronne de presse", detail: "Elle vous a appris à parler en petites phrases.", effets: "+ presse · rhétorique · popularité", cout: "− intégrité ; elle encaissera un jour", rarete: "peu_commune", icone: "✑" },
  { id: "avocat", nom: "L'avocat pénaliste", detail: "Il défend des gens indéfendables, très bien, très cher.", effets: "+ rhétorique · réseau · sang-froid", cout: "− intégrité perçue ; ses clients sont une bombe médiatique", rarete: "peu_commune", icone: "§" },
  { id: "generale", nom: "La générale à la retraite", detail: "Première femme cinq étoiles. Elle ne vous a jamais félicité.", effets: "+ armée · stratégie · endurance", cout: "− syndicats ; une brutalité de commandement", bord: 1, rarete: "rare", icone: "★" },
  { id: "militante", nom: "La militante de quartier", detail: "Trente ans d'association, zéro mandat, mille vies changées.", effets: "+ quartiers · jeunes · charisme", cout: "− csp ; elle vous rappellera vos promesses en public", bord: -2, rarete: "peu_commune", icone: "◐" },
  { id: "banquier", nom: "Le banquier d'affaires", detail: "Il vous appelle « mon cher ». C'est un contrat, pas une amitié.", effets: "+ csp · patronat · levée de fonds massive", cout: "+ cynisme · − intégrité ; il voudra un décret", bord: 2, rarete: "peu_commune", icone: "◈" },
  { id: "ennemi", nom: "Votre adversaire d'alors", detail: "Il vous a battu, puis formé. Personne n'a jamais compris pourquoi.", effets: "+ stratégie · rhétorique · lucidité rare", cout: "− parti ; les vôtres ne vous l'ont jamais pardonné", rarete: "legendaire", icone: "⚯" },
];

// ---------------------------------------------------------------------------
// La conviction fondatrice — l'écran qui place votre curseur sur la ligne.
// C'est le seul choix de l'Acte I qui décide d'emblée de qui vous êtes.
// ---------------------------------------------------------------------------

export const CONVICTIONS: CreationOption[] = [
  { id: "conv_revolution", nom: "« Le capitalisme est le problème »", detail: "Vous n'êtes pas venu aménager le système. Vous êtes venu le remplacer.", effets: "+ syndicats · public · jeunes · rhétorique", cout: "− patronat · − csp · les marchés vous détestent avant votre élection", bord: -4, rarete: "rare", icone: "☭" },
  { id: "conv_sociale", nom: "« L'égalité d'abord »", detail: "Redistribuer, protéger, financer les services.", effets: "+ public · quartiers · syndicats", cout: "− patronat · − marge budgétaire", bord: -2, rarete: "commune", icone: "⚖" },
  { id: "conv_ecolo", nom: "« Il ne restera rien à gouverner »", detail: "Le climat n'est pas un dossier parmi d'autres. C'est le seul.", effets: "+ environnement · urbains · jeunes", cout: "− périurbain · − patronat · − croissance", bord: -2, rarete: "peu_commune", icone: "❋" },
  { id: "conv_republicaine", nom: "« La République, rien d'autre »", detail: "Laïcité, école, mérite. Ni la gauche molle ni la droite dure.", effets: "+ public · cohésion · intégrité", cout: "− quartiers ; personne ne se reconnaît vraiment en vous", bord: 0, rarete: "commune", icone: "⚜" },
  { id: "conv_pragmatique", nom: "« Ce qui marche »", detail: "Ni de gauche ni de droite : les faits, les tableaux, les résultats.", effets: "+ stratégie · patronat · presse", cout: "− charisme ; aucune base militante ne mourra pour vous", bord: 0, rarete: "commune", icone: "◫" },
  { id: "conv_europe", nom: "« La France seule ne pèse rien »", detail: "L'échelle utile est le continent. Le reste est de la nostalgie.", effets: "+ prestige · urbains · csp", cout: "− périurbain · − ruraux ; « Bruxelles » sera votre insulte quotidienne", bord: 1, rarete: "peu_commune", icone: "✦" },
  { id: "conv_liberale", nom: "« Libérer le travail »", detail: "Moins d'État, moins de charges, plus d'initiative.", effets: "+ patronat · csp · indépendants · croissance", cout: "− syndicats · − services publics", bord: 3, rarete: "commune", icone: "◈" },
  { id: "conv_ordre", nom: "« L'autorité avant tout »", detail: "Un pays qui ne fait plus peur à ses délinquants a perdu.", effets: "+ sécurité · armée · pavillonnaires · retraités", cout: "− quartiers · − urbains · − libertés", bord: 3, rarete: "commune", icone: "⌘" },
  { id: "conv_nation", nom: "« La nation d'abord »", detail: "Frontières, souveraineté, préférence nationale assumée.", effets: "+ périurbain · ruraux · sécurité · popularité initiale", cout: "− prestige · − cohésion · − quartiers ; l'Europe vous attaquera", bord: 5, rarete: "rare", icone: "⚑" },
  { id: "conv_souverainiste", nom: "« Ni Bruxelles ni Washington »", detail: "La souveraineté ou rien — et elle n'est ni de gauche ni de droite.", effets: "+ périurbain · armée · indépendance stratégique", cout: "− prestige · − csp ; vous n'aurez d'alliés nulle part", bord: 2, rarete: "peu_commune", icone: "⬢" },
  { id: "conv_conservatrice", nom: "« Ce qui tient un pays »", detail: "La famille, la transmission, la mesure. On ne réforme pas une civilisation.", effets: "+ retraités · ruraux · pavillonnaires · cohésion", cout: "− jeunes · − urbains · − environnement", bord: 2, rarete: "commune", icone: "✝" },
  { id: "conv_populiste", nom: "« Le peuple contre les élites »", detail: "Peu importe le camp : ceux d'en bas contre ceux d'en haut.", effets: "+ charisme · périurbain · quartiers · participation", cout: "− presse · − csp ; on vous accusera de tout et de son contraire", bord: -1, rarete: "rare", icone: "◉" },
  { id: "conv_aucune", nom: "« Je verrai bien »", detail: "Vous êtes entré en politique sans idée fixe. C'est plus fréquent qu'on ne croit.", effets: "+ liberté totale de manœuvre · aucune ligne à trahir", cout: "− charisme · − parti ; on vous croira creux, et on n'aura pas tort", bord: 0, rarete: "peu_commune", icone: "○" },
  { id: "conv_technocrate", nom: "« Le pays est mal géré, pas mal orienté »", detail: "Pas un problème d'idées : un problème d'exécution.", effets: "+ stratégie · marge budgétaire · patronat", cout: "− charisme · − cohésion ; le pays réel vous échappera", bord: 1, rarete: "commune", icone: "∑" },
];

/** Poids de tirage : les options rares sortent moins souvent. */
export const POIDS_RARETE: Record<Rarete, number> = {
  commune: 10,
  peu_commune: 5,
  rare: 2,
  legendaire: 1,
};

// ---------------------------------------------------------------------------
// Le casting
// ---------------------------------------------------------------------------

export const CAST: CharacterDef[] = [
  { id: "rochefort", nom: "Hélène Rochefort", genre: "f", role: "Première ministre", camp: "gouvernement", loyaute: 65, ambition: 55, rancune: 5 },
  { id: "mazeau", nom: "Franck Mazeau", genre: "m", role: "Ministre de l'Intérieur", camp: "gouvernement", biais: "minimise l'agitation sociale (~−20 % sur les chiffres réels)", loyaute: 60, ambition: 60, rancune: 10 },
  { id: "danglade", nom: "Cyril Danglade", genre: "m", role: "Ministre de l'Économie", camp: "gouvernement", biais: "prévisions systématiquement optimistes", loyaute: 70, ambition: 40, rancune: 0 },
  { id: "verdier", nom: "Paul Verdier", genre: "m", titre: "général", role: "Chef d'état-major", camp: "gouvernement", biais: "surestime la menace extérieure", loyaute: 55, ambition: 45, rancune: 5 },
  { id: "ternay", nom: "Yves Ternay", genre: "m", role: "Directeur des services intérieurs", camp: "gouvernement", biais: "ne ment jamais — mais choisit ce qu'il vous montre", loyaute: 60, ambition: 25, rancune: 0 },
  { id: "roze", nom: "Camille Roze", genre: "f", role: "Directrice de la communication", camp: "gouvernement", loyaute: 85, ambition: 25, rancune: 0 },
  { id: "espitalier", nom: "Jean-Marc Espitalier", genre: "m", role: "Trésorier du parti", camp: "parti", loyaute: 70, ambition: 30, rancune: 5 },
  { id: "delval", nom: "Sacha Delval", genre: "m", role: "Secrétaire général du parti", camp: "parti", loyaute: 60, ambition: 70, rancune: 5 },
  { id: "sallenave", nom: "Victor Sallenave", genre: "m", role: "Chef de l'opposition tribunicienne", camp: "opposition", loyaute: 0, ambition: 90, rancune: 40 },
  { id: "andrieu", nom: "Claire Andrieu", genre: "f", role: "Opposante de gouvernement", camp: "opposition", loyaute: 10, ambition: 75, rancune: 10 },
  { id: "rives", nom: "Antoine Rives", genre: "m", role: "Magnat des médias", camp: "presse", loyaute: 40, ambition: 65, rancune: 10 },
  { id: "ferrand", nom: "Louise Ferrand", genre: "f", role: "Journaliste d'investigation, « Le Fil »", camp: "presse", loyaute: 0, ambition: 50, rancune: 10 },
  { id: "bec", nom: "Philippe Bec", genre: "m", role: "Éditorialiste", camp: "presse", loyaute: 30, ambition: 40, rancune: 0 },
  { id: "kervella", nom: "Bruno Kervella", genre: "m", role: "Syndicat contestataire", camp: "corps", loyaute: 5, ambition: 55, rancune: 25 },
  { id: "belkacem", nom: "Nadia Belkacem", genre: "f", registre: "maghreb", role: "Syndicat réformiste", camp: "corps", loyaute: 35, ambition: 45, rancune: 5 },
  { id: "charvet", nom: "Édouard Charvet", genre: "m", role: "Président du patronat", camp: "corps", loyaute: 45, ambition: 40, rancune: 0 },
  { id: "quesnel", nom: "Robert Quesnel", genre: "m", role: "Président du Sénat", camp: "institutions", loyaute: 40, ambition: 30, rancune: 10 },
  { id: "alberti", nom: "Denise Alberti", genre: "f", role: "Présidente du Conseil constitutionnel", camp: "institutions", loyaute: 30, ambition: 10, rancune: 0 },
  { id: "conjoint", nom: "—", genre: "f", role: "Conjoint(e)", camp: "intime", loyaute: 90, ambition: 35, rancune: 0 },
  { id: "bensalah", nom: "Karim Bensalah", genre: "m", registre: "maghreb", alias: ["Karim"], role: "Ami d'enfance", camp: "intime", loyaute: 95, ambition: 5, rancune: 0 },
  { id: "manin", nom: "Estelle Manin", genre: "f", titre: "Dr", role: "Médecin personnel", camp: "intime", loyaute: 90, ambition: 10, rancune: 0 },
  { id: "weiss", nom: "Weiss", genre: "m", registre: "allemagne", titre: "chancelier", role: "Chancelier allemand", camp: "etranger", loyaute: 40, ambition: 50, rancune: 0 },
];

/** Étiquette courte affichée en tag coloré dans le panneau Entourage. */
export const CAST_TAGS: Record<string, string> = {
  rochefort: "Matignon",
  mazeau: "Intérieur",
  danglade: "Bercy",
  verdier: "État-major",
  ternay: "Renseignement",
  roze: "Communication",
  espitalier: "Trésorier",
  delval: "Secrétaire gén.",
  sallenave: "Tribun",
  andrieu: "Opposition",
  rives: "Magnat",
  ferrand: "Investigation",
  bec: "Éditorialiste",
  kervella: "Syndicat dur",
  belkacem: "Syndicat réf.",
  charvet: "Patronat",
  quesnel: "Sénat",
  alberti: "Conseil const.",
  conjoint: "Conjoint",
  bensalah: "Ami d'enfance",
  manin: "Médecin",
  weiss: "Berlin",
};

// ---------------------------------------------------------------------------
// Le vivier de promesses. On n'en voit jamais la totalité : chaque campagne
// n'ouvre qu'une poignée de propositions, tirées par thème et par rareté. Les
// mesures les plus folles existent — encore faut-il qu'on vous les propose.
// ---------------------------------------------------------------------------

export const PROMESSES: PromiseDef[] = [
  // --- Budget, impôts, travail ---------------------------------------------
  { id: "deficit3", label: "Retour sous les 3 % de déficit", tenir: "De l'austérité quelque part", trahir: "Bruxelles, les marchés", theme: "budget", rarete: "commune", bord: 1, segments: ["csp", "retraites"] },
  { id: "impots", label: "Baisse d'impôts des classes moyennes", tenir: "De la marge budgétaire", trahir: "Les pavillonnaires", theme: "budget", rarete: "commune", bord: 1, segments: ["pavillonnaires", "independants"] },
  { id: "usines", label: "Réindustrialisation : 100 usines", tenir: "Subventions, bras de fer sur les aides d'État", trahir: "Périurbain, ruraux", theme: "budget", rarete: "commune", segments: ["periurbain", "ruraux"] },
  { id: "smic", label: "SMIC à 1 800 € net", tenir: "Le patronat entre en guerre froide", trahir: "Périurbain, quartiers", theme: "budget", rarete: "commune", bord: -2, segments: ["periurbain", "quartiers"] },
  { id: "isf", label: "Rétablissement de l'impôt sur la fortune", tenir: "Des départs, des tribunes, un procès en amateurisme", trahir: "Public, syndicats", theme: "budget", rarete: "commune", bord: -2, segments: ["public", "jeunes"] },
  { id: "tva_zero", label: "TVA à 0 % sur les produits de première nécessité", tenir: "Douze milliards par an", trahir: "Tout le monde, au supermarché", theme: "budget", rarete: "commune", bord: -1, segments: ["retraites", "periurbain"] },
  { id: "succession", label: "Suppression des droits de succession", tenir: "Un trou budgétaire et une querelle d'héritiers", trahir: "Pavillonnaires, indépendants", theme: "budget", rarete: "peu_commune", bord: 2, segments: ["pavillonnaires", "csp"] },
  { id: "flat_tax", label: "Impôt à taux unique de 15 %", tenir: "Une refonte fiscale totale en un mandat", trahir: "CSP+, indépendants", theme: "budget", rarete: "peu_commune", bord: 3, segments: ["csp", "independants"] },
  { id: "trente_deux", label: "Semaine de 32 heures", tenir: "Un affrontement de cinq ans avec le patronat", trahir: "Syndicats, jeunes", theme: "budget", rarete: "peu_commune", bord: -3, segments: ["public", "jeunes"] },
  { id: "revenu_universel", label: "Revenu universel d'existence", tenir: "Le plus gros chantier fiscal depuis 1945", trahir: "Jeunes, quartiers", theme: "budget", rarete: "rare", bord: -2, segments: ["jeunes", "quartiers"] },
  { id: "impot_robots", label: "Taxer les robots et les modèles d'IA", tenir: "Personne ne sait comment on assiette ça", trahir: "Syndicats, public", theme: "budget", rarete: "rare", bord: -1, segments: ["public", "periurbain"] },
  { id: "dette_repudiee", label: "Répudier une partie de la dette publique", tenir: "Les marchés se ferment le lendemain matin", trahir: "Votre propre base, qui y croyait", theme: "budget", rarete: "legendaire", bord: -5, segments: ["periurbain", "jeunes"] },

  // --- Retraites, santé, services ------------------------------------------
  { id: "retraite_non", label: "Pas de recul de l'âge de la retraite", tenir: "Toute marge budgétaire future", trahir: "Ronds-points garantis", miroir: "retraite_oui", theme: "social", rarete: "commune", bord: -2, segments: ["public", "periurbain"] },
  { id: "retraite_oui", label: "Réforme des retraites", tenir: "La rue, un an de mandat", trahir: "Marchés, Bruxelles, patronat", miroir: "retraite_non", theme: "social", rarete: "commune", bord: 2, segments: ["csp", "independants"] },
  { id: "hopital", label: "Plan d'urgence hôpital", tenir: "Cher, effets lents", trahir: "Public, retraités", theme: "social", rarete: "commune", segments: ["public", "retraites"] },
  { id: "sante_rurale", label: "Maisons de santé en zone rurale", tenir: "Budget, médecins introuvables", trahir: "Ruraux, retraités", theme: "social", rarete: "commune", segments: ["ruraux", "retraites"] },
  { id: "ecole_douze", label: "Classes à douze élèves partout", tenir: "Quarante mille postes à créer", trahir: "Public, pavillonnaires", theme: "social", rarete: "peu_commune", bord: -1, segments: ["public", "pavillonnaires"] },
  { id: "grand_age", label: "Grande loi sur le grand âge", tenir: "Un point de PIB, chaque année, pour toujours", trahir: "Retraités — c'est-à-dire l'élection", theme: "social", rarete: "peu_commune", bord: -1, segments: ["retraites", "public"] },
  { id: "logement_requis", label: "Réquisition des logements vacants", tenir: "Le Conseil constitutionnel et tous les propriétaires", trahir: "Jeunes, quartiers", theme: "social", rarete: "rare", bord: -3, segments: ["jeunes", "quartiers"] },
  { id: "medecins_affectes", label: "Affectation obligatoire des jeunes médecins", tenir: "Une grève des internes dès le premier mois", trahir: "Ruraux, retraités", theme: "social", rarete: "rare", bord: -1, segments: ["ruraux", "retraites"] },

  // --- Sécurité, justice ----------------------------------------------------
  { id: "police", label: "Police de proximité", tenir: "Budget, réforme interne", trahir: "Pavillonnaires, quartiers", theme: "securite", rarete: "commune", segments: ["pavillonnaires", "quartiers"] },
  { id: "peines_planchers", label: "Peines planchers et fin des remises", tenir: "Des prisons pleines à 160 %", trahir: "Pavillonnaires, retraités", theme: "securite", rarete: "commune", bord: 3, segments: ["pavillonnaires", "retraites"] },
  { id: "prisons", label: "Vingt mille places de prison", tenir: "Six milliards et douze ans de chantiers", trahir: "Pavillonnaires, indépendants", theme: "securite", rarete: "commune", bord: 2, segments: ["pavillonnaires", "independants"] },
  { id: "cannabis", label: "Légalisation du cannabis", tenir: "Des retraités furieux", trahir: "Les jeunes", theme: "securite", rarete: "commune", bord: -2, segments: ["jeunes", "urbains"] },
  { id: "couvre_feu", label: "Couvre-feu pour les mineurs de moins de 16 ans", tenir: "Inapplicable, et tout le monde le sait", trahir: "Pavillonnaires, retraités", theme: "securite", rarete: "peu_commune", bord: 3, segments: ["pavillonnaires", "retraites"] },
  { id: "perpetuite", label: "Perpétuité réelle incompressible", tenir: "Strasbourg vous condamnera", trahir: "Retraités, ruraux", theme: "securite", rarete: "peu_commune", bord: 3, segments: ["retraites", "ruraux"] },
  { id: "depenalisation", label: "Dépénalisation de tous les stupéfiants", tenir: "Une campagne de presse permanente", trahir: "Urbains, jeunes", theme: "securite", rarete: "rare", bord: -3, segments: ["urbains", "jeunes"] },
  { id: "peine_mort", label: "Référendum sur le rétablissement de la peine de mort", tenir: "La rupture avec l'Europe entière", trahir: "Un électorat qu'on avait réveillé pour rien", theme: "securite", rarete: "legendaire", bord: 6, segments: ["pavillonnaires", "ruraux"] },

  // --- Environnement, énergie ----------------------------------------------
  { id: "nucleaire", label: "Six réacteurs nucléaires", tenir: "Dette, une partie des urbains", trahir: "Industriels, souverainistes", miroir: "sortie_nucleaire", theme: "environnement", rarete: "commune", bord: 1, segments: ["periurbain", "csp"] },
  { id: "rail", label: "Rail du quotidien et sortie du charbon", tenir: "Budget, années de travaux", trahir: "Urbains, jeunes", theme: "environnement", rarete: "commune", bord: -1, segments: ["urbains", "jeunes"] },
  { id: "sortie_nucleaire", label: "Sortie du nucléaire en quinze ans", tenir: "Une facture d'électricité qui devient politique", trahir: "Urbains, jeunes", miroir: "nucleaire", theme: "environnement", rarete: "peu_commune", bord: -2, segments: ["urbains", "jeunes"] },
  { id: "zan", label: "Zéro artificialisation des sols", tenir: "Tous les maires de France contre vous", trahir: "Urbains, ruraux", theme: "environnement", rarete: "peu_commune", bord: -1, segments: ["urbains", "ruraux"] },
  { id: "energie_publique", label: "Renationalisation de l'énergie", tenir: "Cent milliards et un contentieux européen", trahir: "Public, périurbain", theme: "environnement", rarete: "peu_commune", bord: -3, segments: ["public", "periurbain"] },
  { id: "jets_prives", label: "Interdiction des jets privés et des vols intérieurs courts", tenir: "Symbolique, spectaculaire, et à peu près inutile", trahir: "Jeunes, urbains", theme: "environnement", rarete: "rare", bord: -3, segments: ["jeunes", "urbains"] },
  { id: "cantine_vege", label: "Deux repas végétariens par semaine à la cantine", tenir: "Six mois de polémique nationale sur le steak haché", trahir: "Urbains, jeunes", theme: "environnement", rarete: "rare", bord: -2, segments: ["urbains", "jeunes"] },

  // --- Institutions ---------------------------------------------------------
  { id: "ric", label: "Référendum d'initiative citoyenne", tenir: "Un instrument que vos ennemis utiliseront", trahir: "Jeunes, périurbain", theme: "institutions", rarete: "commune", bord: -1, segments: ["jeunes", "periurbain"] },
  { id: "proportionnelle", label: "Proportionnelle aux législatives", tenir: "Elle change les règles de VOTRE réélection", trahir: "Jeunes, urbains", theme: "institutions", rarete: "commune", segments: ["jeunes", "urbains"] },
  { id: "vote_obligatoire", label: "Vote obligatoire", tenir: "Des amendes impossibles à recouvrer", trahir: "Retraités, public", theme: "institutions", rarete: "commune", segments: ["retraites", "public"] },
  { id: "moins_elus", label: "Diviser par deux le nombre de parlementaires", tenir: "Faire voter leur propre réduction par les intéressés", trahir: "Périurbain, indépendants", theme: "institutions", rarete: "peu_commune", bord: 1, segments: ["periurbain", "independants"] },
  { id: "vote_seize", label: "Droit de vote à seize ans", tenir: "Un débat interminable pour trois cent mille voix", trahir: "Jeunes, urbains", theme: "institutions", rarete: "peu_commune", bord: -1, segments: ["jeunes", "urbains"] },
  { id: "senat", label: "Suppression du Sénat", tenir: "Une révision que le Sénat doit voter lui-même", trahir: "Jeunes, périurbain", theme: "institutions", rarete: "rare", bord: -2, segments: ["jeunes", "periurbain"] },
  { id: "constituante", label: "Convoquer une Constituante — la VIe République", tenir: "Vous ouvrez une porte que personne ne sait refermer", trahir: "Jeunes, urbains, public", theme: "institutions", rarete: "rare", bord: -3, segments: ["jeunes", "urbains"] },
  { id: "assemblee_tiree", label: "Une chambre de citoyens tirés au sort", tenir: "Deux légitimités concurrentes dans le même pays", trahir: "Jeunes, quartiers", theme: "institutions", rarete: "rare", bord: -2, segments: ["jeunes", "quartiers"] },
  { id: "mandat_unique", label: "Mandat unique — « je ne me représenterai pas »", tenir: "Vous devenez un canard boiteux le premier jour", trahir: "Coûte double partout", theme: "institutions", rarete: "peu_commune", segments: ["urbains", "jeunes"] },

  // --- Société, immigration -------------------------------------------------
  { id: "regularisation", label: "Régularisation des travailleurs sans-papiers", tenir: "Une polémique permanente", trahir: "Urbains, quartiers", miroir: "quotas", theme: "societe", rarete: "commune", bord: -2, segments: ["urbains", "quartiers"] },
  { id: "quotas", label: "Quotas migratoires annuels", tenir: "Urbains, quartiers", trahir: "Pavillonnaires, ruraux", miroir: "regularisation", theme: "societe", rarete: "commune", bord: 2, segments: ["pavillonnaires", "ruraux"] },
  { id: "uniforme", label: "Uniforme à l'école", tenir: "Presque rien — et c'est bien le problème", trahir: "Pavillonnaires, retraités", theme: "societe", rarete: "commune", bord: 2, segments: ["pavillonnaires", "retraites"] },
  { id: "fin_de_vie", label: "Aide active à mourir", tenir: "Une fracture morale dans votre propre camp", trahir: "Urbains, retraités", theme: "societe", rarete: "peu_commune", bord: -1, segments: ["urbains", "retraites"] },
  { id: "service_national", label: "Service national obligatoire de neuf mois", tenir: "Douze milliards et des casernes qui n'existent plus", trahir: "Retraités, ruraux", theme: "societe", rarete: "peu_commune", bord: 2, segments: ["retraites", "ruraux"] },
  { id: "droit_du_sol", label: "Fin du droit du sol", tenir: "Une révision constitutionnelle et une plaie ouverte", trahir: "Ruraux, pavillonnaires", theme: "societe", rarete: "rare", bord: 4, segments: ["ruraux", "pavillonnaires"] },
  { id: "concordat", label: "Abrogation du Concordat d'Alsace-Moselle", tenir: "Trois départements en révolte pour un principe", trahir: "Public, urbains", theme: "societe", rarete: "legendaire", bord: -2, segments: ["public", "urbains"] },

  // --- Monde ----------------------------------------------------------------
  { id: "defense_trois", label: "Trois pour cent du PIB pour la défense", tenir: "Trente milliards pris ailleurs", trahir: "Ruraux, pavillonnaires", theme: "monde", rarete: "commune", bord: 2, segments: ["ruraux", "pavillonnaires"] },
  { id: "aide_dev", label: "0,7 % du PIB pour l'aide au développement", tenir: "La cible favorite de toutes les oppositions", trahir: "Urbains", theme: "monde", rarete: "peu_commune", bord: -1, segments: ["urbains", "public"] },
  { id: "armee_europeenne", label: "Créer une armée européenne", tenir: "Vingt-six partenaires et autant de vetos", trahir: "Urbains, CSP+", theme: "monde", rarete: "peu_commune", bord: 1, segments: ["urbains", "csp"] },
  { id: "otan", label: "Sortie du commandement intégré de l'OTAN", tenir: "Washington ne vous le pardonnera pas", trahir: "Périurbain", theme: "monde", rarete: "rare", segments: ["periurbain", "public"] },
  { id: "frexit", label: "Référendum sur la sortie de l'Union européenne", tenir: "Tout. Absolument tout.", trahir: "L'électorat qui n'attendait que ça", theme: "monde", rarete: "legendaire", bord: 5, segments: ["periurbain", "ruraux"] },

  // --- Insolite : rare, et c'est ce qui fait la légende ----------------------
  { id: "autoroutes", label: "Renationaliser les autoroutes", tenir: "Quarante milliards d'indemnités de résiliation", trahir: "Périurbain, ruraux", theme: "insolite", rarete: "peu_commune", bord: -2, segments: ["periurbain", "ruraux"] },
  { id: "pub_interdite", label: "Interdiction totale de la publicité dans l'espace public", tenir: "La presse privée d'un tiers de ses recettes — et de sa bienveillance", trahir: "Urbains, jeunes", theme: "insolite", rarete: "rare", bord: -3, segments: ["urbains", "jeunes"] },
  { id: "quatre_vingts", label: "80 km/h sur tout le réseau secondaire", tenir: "La mesure la plus détestée de l'histoire récente", trahir: "Urbains", theme: "insolite", rarete: "rare", segments: ["urbains", "public"] },
  { id: "heure_paris", label: "Fin du changement d'heure et retour au méridien de Paris", tenir: "Un pays entier à remettre à l'heure, littéralement", trahir: "Personne. C'est bien le problème.", theme: "insolite", rarete: "rare", segments: ["retraites", "ruraux"] },
  { id: "capitale", label: "Déplacer la capitale administrative à Bourges", tenir: "Quatre-vingt mille fonctionnaires et zéro volontaire", trahir: "Ruraux, périurbain", theme: "insolite", rarete: "legendaire", segments: ["ruraux", "periurbain"] },
  { id: "banques", label: "Nationalisation du secteur bancaire", tenir: "Une fuite des capitaux en quarante-huit heures", trahir: "Public, périurbain", theme: "insolite", rarete: "legendaire", bord: -4, segments: ["public", "periurbain"] },
];

/**
 * Le tirage du programme : on garantit un éventail thématique, puis on
 * complète à la rareté. Personne ne voit le vivier entier — il faut composer
 * avec ce que la campagne vous met sur la table.
 */
export const PROGRAMME_PROPOSITIONS = 14;

export function tirerProgramme(rng: {
  pick<T>(a: readonly T[]): T;
  weighted<T>(i: readonly { item: T; weight: number }[]): T;
}): string[] {
  const restants = [...PROMESSES];
  const retenus: PromiseDef[] = [];
  const prendre = (p: PromiseDef) => {
    retenus.push(p);
    restants.splice(restants.indexOf(p), 1);
  };
  const poids = (p: PromiseDef) => POIDS_RARETE[p.rarete ?? "commune"];

  // Un point d'entrée par thème : aucune campagne ne peut ignorer la sécurité
  // ou l'école sous prétexte que le tirage a été distrait.
  const themes = [...new Set(PROMESSES.map((p) => p.theme))];
  for (const theme of themes) {
    const pool = restants.filter((p) => p.theme === theme);
    if (pool.length > 0) prendre(rng.weighted(pool.map((p) => ({ item: p, weight: poids(p) }))));
  }
  while (retenus.length < PROGRAMME_PROPOSITIONS && restants.length > 0) {
    prendre(rng.weighted(restants.map((p) => ({ item: p, weight: poids(p) }))));
  }

  // On rend la liste dans l'ordre du vivier : la présentation reste lisible.
  const choisis = new Set(retenus.map((p) => p.id));
  return PROMESSES.filter((p) => choisis.has(p.id)).map((p) => p.id);
}

// ---------------------------------------------------------------------------
// Le comparatif final — moyennes publiques approximatives, Ve République
// ---------------------------------------------------------------------------

export interface PresidentRef {
  nom: string;
  annees: number;
  croissance: number; // moyenne annuelle %
  chomage: number; // moyenne %
  detteDelta: number; // évolution en points de PIB
}

export const PRESIDENTS: PresidentRef[] = [
  { nom: "de Gaulle", annees: 10, croissance: 5.5, chomage: 2.0, detteDelta: -10 },
  { nom: "Pompidou", annees: 5, croissance: 5.3, chomage: 2.6, detteDelta: -2 },
  { nom: "Giscard d'Estaing", annees: 7, croissance: 2.7, chomage: 4.5, detteDelta: 2 },
  { nom: "Mitterrand", annees: 14, croissance: 2.2, chomage: 9.4, detteDelta: 25 },
  { nom: "Chirac", annees: 12, croissance: 2.0, chomage: 9.6, detteDelta: 8 },
  { nom: "Sarkozy", annees: 5, croissance: 0.6, chomage: 9.0, detteDelta: 22 },
  { nom: "Hollande", annees: 5, croissance: 1.0, chomage: 9.9, detteDelta: 9 },
  { nom: "Macron", annees: 8, croissance: 1.2, chomage: 7.8, detteDelta: 15 },
];

// ---------------------------------------------------------------------------
// Les viviers de noms. Tout le casting est rebaptisé à chaque partie : les
// fonctions, les biais et les rancunes ne bougent pas, mais on ne retrouve
// jamais les mêmes visages. Les patronymes sont volontairement dépourvus
// d'homonymes courants — `RichText` les repère dans les textes, et un nom qui
// est aussi un nom commun se met à clignoter au milieu des phrases.
// ---------------------------------------------------------------------------

export const PRENOMS_F = [
  "Claire", "Isabelle", "Nathalie", "Sophie", "Anne", "Valérie", "Élise", "Margot", "Aurore", "Delphine",
  "Camille", "Hélène", "Béatrice", "Céline", "Diane", "Émilie", "Florence", "Gabrielle", "Hortense", "Inès",
  "Julie", "Marion", "Noémie", "Pauline", "Sandrine", "Véronique", "Agnès", "Blandine", "Charlotte", "Estelle",
  "Fanny", "Geneviève", "Irène", "Justine", "Louise", "Manon", "Nadège", "Ophélie", "Sylvie", "Armelle",
];
export const PRENOMS_M = [
  "Julien", "Thomas", "Marc", "Antoine", "Pierre", "Nicolas", "Étienne", "Vincent", "Laurent", "Rémi",
  "Olivier", "Bertrand", "Guillaume", "Fabien", "Damien", "Maxime", "Sébastien", "Arnaud", "Clément", "Baptiste",
  "Cédric", "Denis", "Édouard", "Franck", "Gaspard", "Henri", "Jérôme", "Loïc", "Mathieu", "Patrice",
  "Quentin", "Raphaël", "Stéphane", "Victor", "Xavier", "Yann", "Alban", "Corentin", "Aurélien", "Benoît",
];
export const NOMS = [
  "Vasseur", "Morel", "Lambert", "Girard", "Roussel", "Berthier", "Lemoine", "Perrin", "Guilloux", "Santelli",
  "Kerbrat", "Delorme", "Aubry", "Cordier", "Delaunay", "Estève", "Faivre", "Gauthier", "Hamon", "Jourdan",
  "Maillard", "Orsini", "Pasquier", "Rambaud", "Tanguy", "Aubertin", "Béranger", "Dumesnil", "Grangier", "Cazeneuve",
  "Sabatier", "Bergeron", "Chastel", "Dorval", "Faucher", "Galtier", "Hébrard", "Imbert", "Jaubert", "Lassalle",
  "Mercadier", "Ollivier", "Raynaud", "Salvat", "Thibault", "Vergne", "Ancelin", "Bouvier", "Darrieux", "Gaillard",
  "Joubert", "Lauret", "Monnier", "Poitevin", "Reboul", "Sénéchal", "Turpin", "Ledoux", "Beauvais", "Chambon",
  "Dutertre", "Fresnay", "Lestrade", "Marsac", "Solignac", "Vaugeois", "Coquelin", "Larcher", "Miquel", "Nogaret",
  "Pineau", "Revel", "Sorel", "Tourreau", "Valdenaire", "Fabiani", "Casanova", "Pieri", "Alberti", "Ferrandi",
];

/** Les personnages qui ne viennent pas du même monde gardent leur texture. */
export const PRENOMS_M_ALLEMAGNE = ["Klaus", "Dietrich", "Helmut", "Reinhard", "Matthias", "Jürgen", "Wolfgang", "Andreas", "Stefan", "Lothar", "Gerhard", "Konrad"];
export const NOMS_ALLEMAGNE = ["Weiss", "Brandt", "Kessler", "Hofmann", "Lindner", "Reuter", "Bergmann", "Kuhn", "Steinbach", "Kleinert", "Zimmerling", "Naumann"];
export const PRENOMS_M_MAGHREB = ["Karim", "Samir", "Rachid", "Mehdi", "Yacine", "Farid", "Nabil", "Sofiane", "Tarek", "Amine"];
export const PRENOMS_F_MAGHREB = ["Nadia", "Leïla", "Samira", "Yasmina", "Amina", "Farida", "Sonia", "Malika", "Nour", "Djamila"];
export const NOMS_MAGHREB = ["Bensalah", "Belkacem", "Haddad", "Benali", "Cherif", "Mansouri", "Ziani", "Boukhari", "Amrani", "Slimani", "Ouazani", "Taleb"];
