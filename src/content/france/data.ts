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
  effets: string; // description lisible
  rarete: Rarete;
  icone: string;
}

export const REGIONS: CreationOption[] = [
  { id: "nord", nom: "Le bassin minier", detail: "Père ouvrier, mère au guichet.", effets: "+ endurance · crédibilité populaire", rarete: "commune", icone: "⛏" },
  { id: "paris", nom: "Les beaux quartiers", detail: "Héritier. Le soupçon ne partira jamais.", effets: "+ réseau · levée de fonds", rarete: "commune", icone: "◈" },
  { id: "banlieue", nom: "La banlieue populaire", detail: "Le quartier attend tout de vous.", effets: "+ charisme · jeunes et quartiers", rarete: "peu_commune", icone: "▲" },
  { id: "bretagne", nom: "La Bretagne", detail: "Ancrage terrien, réseau dense.", effets: "+ stratégie · ruraux", rarete: "commune", icone: "⚓" },
  { id: "sudouest", nom: "Le Sud-Ouest rural", detail: "La république des maires.", effets: "+ réseau local · stratégie", rarete: "commune", icone: "☘" },
  { id: "lyon", nom: "La bourgeoisie lyonnaise", detail: "Gestion, sérieux, froideur.", effets: "+ stratégie · patronat · − charisme", rarete: "commune", icone: "⬢" },
  { id: "marseille", nom: "Marseille et le littoral", detail: "Des amitiés qu'il valait mieux ne pas avoir.", effets: "+ rhétorique · un passé qui ressortira", rarete: "peu_commune", icone: "⚑" },
  { id: "est", nom: "L'Est frontalier", detail: "Europe, industrie, rigueur.", effets: "+ prestige · − charisme", rarete: "commune", icone: "✦" },
  { id: "outremer", nom: "L'outre-mer", detail: "Une première historique.", effets: "+ cohésion · la vie chère devient votre dossier", rarete: "rare", icone: "❋" },
  { id: "exil", nom: "L'enfance à l'étranger", detail: "Fils de diplomate, six pays avant vingt ans.", effets: "+ prestige · réseau · − ancrage local", rarete: "rare", icone: "✈" },
  { id: "montagne", nom: "La vallée alpine", detail: "Un village, une école, une route qui ferme l'hiver.", effets: "+ endurance · ruraux · environnement", rarete: "peu_commune", icone: "⛰" },
];

export const MILIEUX: CreationOption[] = [
  { id: "ouvrier", nom: "Milieu ouvrier", detail: "On sait d'où vous venez. Vous aussi.", effets: "+ endurance · périurbain · − réseau", rarete: "commune", icone: "⚒" },
  { id: "fonctionnaire", nom: "Fonction publique", detail: "Le service de l'État comme évidence.", effets: "+ intégrité · public", rarete: "commune", icone: "⚖" },
  { id: "commercant", nom: "Petit commerce", detail: "Les comptes du soir à la table de la cuisine.", effets: "+ stratégie · indépendants", rarete: "commune", icone: "🛍" },
  { id: "bourgeois", nom: "Grande bourgeoisie", detail: "Les codes, les dîners, les adresses.", effets: "+ réseau · cynisme · − quartiers", rarete: "peu_commune", icone: "♛" },
  { id: "agricole", nom: "Exploitation agricole", detail: "Levé avant l'aube, toute votre enfance.", effets: "+ endurance · ruraux", rarete: "commune", icone: "🌾" },
  { id: "enseignant", nom: "Famille d'enseignants", detail: "Des livres partout, jamais d'argent.", effets: "+ rhétorique · public · urbains", rarete: "peu_commune", icone: "✎" },
  { id: "immigre", nom: "Parents immigrés", detail: "Deux langues, deux mondes, une seule carte d'identité.", effets: "+ endurance · quartiers · jeunes", rarete: "rare", icone: "◐" },
];

export const FORMATIONS: CreationOption[] = [
  { id: "ena", nom: "L'école du pouvoir", detail: "La voie royale. On vous y attend.", effets: "+ stratégie · réseau · − popularité", rarete: "commune", icone: "▣" },
  { id: "droit", nom: "Faculté de droit", detail: "Éloquence et procédure.", effets: "+ rhétorique", rarete: "commune", icone: "§" },
  { id: "eco", nom: "Thèse en économie", detail: "Vous savez lire un budget.", effets: "+ stratégie · crédibilité budgétaire", rarete: "commune", icone: "∑" },
  { id: "militaire", nom: "Carrière militaire", detail: "Quinze ans sous l'uniforme.", effets: "+ endurance · armée · un passé d'opérations", rarete: "peu_commune", icone: "★" },
  { id: "autodidacte", nom: "Autodidacte", detail: "Parti de rien, appris sur le tas.", effets: "+ charisme · endurance · − réseau", rarete: "peu_commune", icone: "◇" },
  { id: "medecin", nom: "Médecine hospitalière", detail: "Vingt ans de gardes avant la politique.", effets: "+ intégrité · crédibilité santé", rarete: "rare", icone: "✚" },
  { id: "syndicale", nom: "L'école du syndicat", detail: "Formé dans les assemblées générales.", effets: "+ charisme · syndicats · − patronat", rarete: "peu_commune", icone: "✊" },
];

export const EVENEMENTS_FONDATEURS: CreationOption[] = [
  { id: "usine", nom: "La fermeture de l'usine", detail: "Vous aviez seize ans. Le piquet a perdu.", effets: "cause sociale ; ce combat vous rattrapera", rarete: "commune", icone: "🏭" },
  { id: "frere", nom: "Le frère condamné", detail: "Une affaire, un silence de famille.", effets: "+ endurance ; il demandera une grâce", rarete: "peu_commune", icone: "⛓" },
  { id: "attentat", nom: "L'attentat auquel vous avez survécu", detail: "Vous y étiez. Vous n'en parlez jamais.", effets: "légitimité sécurité ; des cauchemars", rarete: "rare", icone: "✷" },
  { id: "these", nom: "La thèse écrite trop vite", detail: "Trois chapitres empruntés. Pour l'instant.", effets: "carrière rapide ; une bombe à retardement", rarete: "peu_commune", icone: "📄" },
  { id: "campagne_perdue", nom: "La première campagne perdue", detail: "Battu à 21 ans. Le score, vous l'avez retenu.", effets: "+ stratégie · cynisme", rarete: "commune", icone: "☒" },
  { id: "greve_faim", nom: "La grève de la faim", detail: "Douze jours devant une préfecture. Vous aviez gagné.", effets: "+ charisme · endurance ; une santé entamée", rarete: "legendaire", icone: "◉" },
  { id: "sauvetage", nom: "Le sauvetage", detail: "Vous avez sorti deux personnes d'une voiture en feu.", effets: "+ popularité durable · courage reconnu", rarete: "rare", icone: "✹" },
];

export const MENTORS: CreationOption[] = [
  { id: "baron", nom: "Le baron local", detail: "Quarante ans de mandats, chaque bulletin en tête.", effets: "+ réseau · cynisme ; il attend un retour", rarete: "commune", icone: "♜" },
  { id: "professeure", nom: "La professeure de droit", detail: "Elle croit aux institutions plus qu'aux hommes.", effets: "+ intégrité · rhétorique ; elle vous jugera", rarete: "commune", icone: "⚜" },
  { id: "syndicaliste", nom: "Le vieux syndicaliste", detail: "Il vous a appris les salles hostiles.", effets: "+ charisme · syndicats", rarete: "commune", icone: "✊" },
  { id: "industriel", nom: "L'industriel philanthrope", detail: "Il finance des carrières comme d'autres des musées.", effets: "+ fonds · patronat ; un carnet qui engage", rarete: "peu_commune", icone: "⬣" },
  { id: "prefet", nom: "L'ancien préfet", detail: "Il sait comment l'État fonctionne vraiment.", effets: "+ stratégie ; il connaît vos dossiers", rarete: "commune", icone: "◫" },
  { id: "resistante", nom: "La dernière résistante", detail: "Cent deux ans. Elle vous a dit une seule phrase.", effets: "+ intégrité · légitimité morale", rarete: "legendaire", icone: "✶" },
  { id: "personne", nom: "Personne", detail: "Vous ne devez rien à personne. C'est aussi une faiblesse.", effets: "+ intégrité · − réseau · − stratégie", rarete: "rare", icone: "○" },
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
  { id: "rochefort", nom: "Hélène Rochefort", role: "Première ministre", camp: "gouvernement", loyaute: 65, ambition: 55, rancune: 5 },
  { id: "mazeau", nom: "Franck Mazeau", role: "Ministre de l'Intérieur", camp: "gouvernement", biais: "minimise l'agitation sociale (~−20 % sur les chiffres réels)", loyaute: 60, ambition: 60, rancune: 10 },
  { id: "danglade", nom: "Cyril Danglade", role: "Ministre de l'Économie", camp: "gouvernement", biais: "prévisions systématiquement optimistes", loyaute: 70, ambition: 40, rancune: 0 },
  { id: "verdier", nom: "Général Paul Verdier", role: "Chef d'état-major", camp: "gouvernement", biais: "surestime la menace extérieure", loyaute: 55, ambition: 45, rancune: 5 },
  { id: "ternay", nom: "Yves Ternay", role: "Directeur des services intérieurs", camp: "gouvernement", biais: "ne ment jamais — mais choisit ce qu'il vous montre", loyaute: 60, ambition: 25, rancune: 0 },
  { id: "roze", nom: "Camille Roze", role: "Directrice de la communication", camp: "gouvernement", loyaute: 85, ambition: 25, rancune: 0 },
  { id: "espitalier", nom: "Jean-Marc Espitalier", role: "Trésorier du parti", camp: "parti", loyaute: 70, ambition: 30, rancune: 5 },
  { id: "delval", nom: "Sacha Delval", role: "Secrétaire général du parti", camp: "parti", loyaute: 60, ambition: 70, rancune: 5 },
  { id: "sallenave", nom: "Victor Sallenave", role: "Chef de l'opposition tribunicienne", camp: "opposition", loyaute: 0, ambition: 90, rancune: 40 },
  { id: "andrieu", nom: "Claire Andrieu", role: "Opposante de gouvernement", camp: "opposition", loyaute: 10, ambition: 75, rancune: 10 },
  { id: "rives", nom: "Antoine Rives", role: "Magnat des médias", camp: "presse", loyaute: 40, ambition: 65, rancune: 10 },
  { id: "ferrand", nom: "Louise Ferrand", role: "Journaliste d'investigation, « Le Fil »", camp: "presse", loyaute: 0, ambition: 50, rancune: 10 },
  { id: "bec", nom: "Philippe Bec", role: "Éditorialiste", camp: "presse", loyaute: 30, ambition: 40, rancune: 0 },
  { id: "kervella", nom: "Bruno Kervella", role: "Syndicat contestataire", camp: "corps", loyaute: 5, ambition: 55, rancune: 25 },
  { id: "belkacem", nom: "Nadia Belkacem", role: "Syndicat réformiste", camp: "corps", loyaute: 35, ambition: 45, rancune: 5 },
  { id: "charvet", nom: "Édouard Charvet", role: "Président du patronat", camp: "corps", loyaute: 45, ambition: 40, rancune: 0 },
  { id: "quesnel", nom: "Robert Quesnel", role: "Président du Sénat", camp: "institutions", loyaute: 40, ambition: 30, rancune: 10 },
  { id: "alberti", nom: "Denise Alberti", role: "Présidente du Conseil constitutionnel", camp: "institutions", loyaute: 30, ambition: 10, rancune: 0 },
  { id: "conjoint", nom: "—", role: "Conjoint(e)", camp: "intime", loyaute: 90, ambition: 35, rancune: 0 },
  { id: "bensalah", nom: "Karim Bensalah", role: "Ami d'enfance", camp: "intime", loyaute: 95, ambition: 5, rancune: 0 },
  { id: "manin", nom: "Dr Estelle Manin", role: "Médecin personnel", camp: "intime", loyaute: 90, ambition: 10, rancune: 0 },
  { id: "weiss", nom: "Chancelier Weiss", role: "Chancelier allemand", camp: "etranger", loyaute: 40, ambition: 50, rancune: 0 },
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
// Le pool de promesses (16, en choisir 6)
// ---------------------------------------------------------------------------

export const PROMESSES: PromiseDef[] = [
  { id: "deficit3", label: "Retour sous les 3 % de déficit", tenir: "De l'austérité quelque part", trahir: "Bruxelles, les marchés", segments: ["csp", "retraites"] },
  { id: "impots", label: "Baisse d'impôts des classes moyennes", tenir: "De la marge budgétaire", trahir: "Les pavillonnaires", segments: ["pavillonnaires", "independants"] },
  { id: "retraite_non", label: "Pas de recul de l'âge de la retraite", tenir: "Toute marge budgétaire future", trahir: "Ronds-Points garantis", miroir: "retraite_oui", segments: ["public", "periurbain"] },
  { id: "retraite_oui", label: "Réforme des retraites", tenir: "La rue, un an de mandat", trahir: "Marchés, Bruxelles, patronat", miroir: "retraite_non", segments: ["csp", "independants"] },
  { id: "usines", label: "Réindustrialisation : 100 usines", tenir: "Subventions, bras de fer sur les aides d'État", trahir: "Périurbain, ruraux", segments: ["periurbain", "ruraux"] },
  { id: "hopital", label: "Plan d'urgence hôpital", tenir: "Cher, effets lents", trahir: "Public, retraités", segments: ["public", "retraites"] },
  { id: "sante_rurale", label: "Maisons de santé en zone rurale", tenir: "Budget, médecins introuvables", trahir: "Ruraux, retraités", segments: ["ruraux", "retraites"] },
  { id: "police", label: "Police de proximité", tenir: "Budget, réforme interne", trahir: "Pavillonnaires, quartiers", segments: ["pavillonnaires", "quartiers"] },
  { id: "nucleaire", label: "Six réacteurs nucléaires", tenir: "Dette, une partie des urbains", trahir: "Industriels, souverainistes", segments: ["periurbain", "csp"] },
  { id: "rail", label: "Rail du quotidien et sortie du charbon", tenir: "Budget, années de travaux", trahir: "Urbains, jeunes", segments: ["urbains", "jeunes"] },
  { id: "ric", label: "Référendum d'initiative citoyenne", tenir: "Un instrument que vos ennemis utiliseront", trahir: "Jeunes, périurbain", segments: ["jeunes", "periurbain"] },
  { id: "cannabis", label: "Légalisation du cannabis", tenir: "Des retraités furieux", trahir: "Les jeunes", segments: ["jeunes", "urbains"] },
  { id: "regularisation", label: "Régularisation des travailleurs sans-papiers", tenir: "Une polémique permanente", trahir: "Urbains, quartiers", miroir: "quotas", segments: ["urbains", "quartiers"] },
  { id: "quotas", label: "Quotas migratoires annuels", tenir: "Urbains, quartiers", trahir: "Pavillonnaires, ruraux", miroir: "regularisation", segments: ["pavillonnaires", "ruraux"] },
  { id: "proportionnelle", label: "Proportionnelle aux législatives", tenir: "Elle change les règles de VOTRE réélection", trahir: "Jeunes, urbains", segments: ["jeunes", "urbains"] },
  { id: "mandat_unique", label: "Mandat unique — « je ne me représenterai pas »", tenir: "Interdit la moitié des fins du jeu", trahir: "Coûte double partout", segments: ["urbains", "jeunes"] },
];

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

// Prénoms crédibles pour la génération aléatoire
export const PRENOMS_F = ["Claire", "Isabelle", "Nathalie", "Sophie", "Anne", "Valérie", "Élise", "Margot", "Aurore", "Delphine"];
export const PRENOMS_M = ["Julien", "Thomas", "Marc", "Antoine", "Pierre", "Nicolas", "Étienne", "Vincent", "Laurent", "Rémi"];
export const NOMS = ["Vasseur", "Morel", "Lambert", "Girard", "Fontaine", "Roussel", "Chevalier", "Berthier", "Lemoine", "Perrin", "Guilloux", "Santelli", "Kerbrat", "Delorme"];
