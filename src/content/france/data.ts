import type { CharacterDef, PromiseDef, SegmentDef } from "../../engine/types";

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
}

export const REGIONS: CreationOption[] = [
  { id: "nord", nom: "Le bassin minier (Nord)", detail: "Père ouvrier, mère au guichet. Enfant de la crise.", effets: "+ endurance, + crédibilité populaire" },
  { id: "paris", nom: "Les beaux quartiers (ouest parisien)", detail: "Héritier. Le soupçon de déconnexion ne partira jamais.", effets: "+ réseau, + levée de fonds" },
  { id: "banlieue", nom: "La banlieue populaire (Île-de-France)", detail: "L'ascension méritocratique. Le quartier attend tout de vous.", effets: "+ charisme, jeunes et quartiers acquis" },
  { id: "bretagne", nom: "La Bretagne", detail: "Ancrage terrien, réseau associatif et agricole dense.", effets: "+ stratégie, ruraux favorables" },
  { id: "sudouest", nom: "Le Sud-Ouest rural", detail: "La république des maires. Le cumul dans le sang.", effets: "+ réseau local, + stratégie" },
  { id: "lyon", nom: "Lyon et sa bourgeoisie", detail: "Gestion, sérieux, un certain froid en meeting.", effets: "+ stratégie, + patronat, − charisme" },
  { id: "marseille", nom: "Marseille et le littoral", detail: "Débrouille, réseaux, des amitiés qu'il aurait mieux valu ne pas avoir.", effets: "+ rhétorique, un passé qui ressortira" },
  { id: "est", nom: "L'Est frontalier", detail: "Europe, industrie, rigueur. Un déficit de flamme.", effets: "+ prestige international, − charisme" },
  { id: "outremer", nom: "L'outre-mer", detail: "Une première historique. Des attentes immenses.", effets: "+ cohésion au départ, la vie chère devient votre dossier" },
];

export const MILIEUX: CreationOption[] = [
  { id: "ouvrier", nom: "Milieu ouvrier", detail: "On sait d'où vous venez, et vous aussi.", effets: "+ endurance, périurbain favorable, − réseau" },
  { id: "fonctionnaire", nom: "Fonction publique", detail: "Le service de l'État comme évidence familiale.", effets: "+ intégrité, public favorable" },
  { id: "commercant", nom: "Petit commerce", detail: "Les comptes du soir à la table de la cuisine.", effets: "+ stratégie, indépendants favorables" },
  { id: "bourgeois", nom: "Grande bourgeoisie", detail: "Les codes, les dîners, les adresses.", effets: "+ réseau, + cynisme, quartiers hostiles" },
  { id: "agricole", nom: "Exploitation agricole", detail: "Levé avant l'aube, toute votre enfance.", effets: "+ endurance, ruraux acquis" },
];

export const FORMATIONS: CreationOption[] = [
  { id: "ena", nom: "L'école du pouvoir", detail: "La voie royale. Tout le monde vous y attend.", effets: "+ stratégie, + réseau, − charisme populaire" },
  { id: "droit", nom: "Faculté de droit", detail: "Avocature, éloquence, procédure.", effets: "+ rhétorique" },
  { id: "eco", nom: "Thèse en économie", detail: "Vous savez lire un budget. La presse s'en souviendra.", effets: "+ stratégie, crédibilité budgétaire" },
  { id: "militaire", nom: "Carrière militaire", detail: "Quinze ans sous l'uniforme avant la politique.", effets: "+ endurance, armée favorable, un passé d'opérations" },
  { id: "autodidacte", nom: "Autodidacte", detail: "Parti de rien, appris sur le tas.", effets: "+ charisme, + endurance, − réseau" },
];

export const EVENEMENTS_FONDATEURS: CreationOption[] = [
  { id: "usine", nom: "La fermeture de l'usine", detail: "Vous aviez seize ans. Le piquet de grève a duré deux mois, et perdu.", effets: "+ cause sociale ; ce combat vous rattrapera" },
  { id: "frere", nom: "Le frère condamné", detail: "Une affaire, une condamnation, un silence de famille.", effets: "+ endurance ; un jour il demandera une grâce" },
  { id: "attentat", nom: "L'attentat auquel vous avez survécu", detail: "Vous y étiez. Vous n'en parlez jamais.", effets: "+ légitimité sur la sécurité ; des cauchemars" },
  { id: "these", nom: "La thèse écrite trop vite", detail: "Trois chapitres empruntés. Personne n'a vérifié. Pour l'instant.", effets: "+ carrière rapide ; une bombe à retardement" },
  { id: "campagne_perdue", nom: "La première campagne perdue", detail: "Battu à 21 ans aux cantonales. Vous n'avez jamais oublié le score.", effets: "+ stratégie, + rancune utile" },
];

export const MENTORS: CreationOption[] = [
  { id: "baron", nom: "Le baron local", detail: "Quarante ans de mandats. Il connaît chaque bulletin de vote du département.", effets: "+ réseau, + cynisme ; il attend un retour" },
  { id: "professeure", nom: "La professeure de droit public", detail: "Elle croit aux institutions plus qu'aux hommes.", effets: "+ intégrité, + rhétorique ; elle vous jugera" },
  { id: "syndicaliste", nom: "Le vieux syndicaliste", detail: "Il vous a appris à parler à une salle hostile.", effets: "+ charisme, syndicats favorables" },
  { id: "industriel", nom: "L'industriel philanthrope", detail: "Il finance des carrières comme d'autres des musées.", effets: "+ levée de fonds, patronat favorable ; un carnet d'adresses qui engage" },
  { id: "prefet", nom: "L'ancien préfet", detail: "Il sait comment l'État fonctionne vraiment.", effets: "+ stratégie ; il connaît aussi vos dossiers" },
];

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
