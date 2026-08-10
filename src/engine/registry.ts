import type { GameEvent } from "./types";
import { EVENTS_ASCENSION } from "../content/france/ascension";
import { EVENTS_MANDAT } from "../content/france/mandat";
import { EVENTS_INTRIGUES } from "../content/france/intrigues";
import { EVENTS_CAMPAGNE } from "../content/france/campagne";
import { CRISES, EVENTS_CRISES } from "../content/france/crises";
import { EVENTS_FINS } from "../content/france/fins";
import { EVENTS_PERSONNAGES } from "../content/france/personnages";
import { EVENTS_CONDITIONNELS } from "../content/france/conditionnels";
import { EVENTS_BORDS } from "../content/france/bords";
import { EVENTS_MEMOIRE } from "../content/france/memoire";
import { EVENTS_EUROPE } from "../content/france/europe";

const ALL: GameEvent[] = [
  ...EVENTS_ASCENSION,
  ...EVENTS_MANDAT,
  ...EVENTS_INTRIGUES,
  ...EVENTS_CAMPAGNE,
  ...EVENTS_CRISES,
  ...EVENTS_FINS,
  ...EVENTS_PERSONNAGES,
  ...EVENTS_CONDITIONNELS,
  ...EVENTS_BORDS,
  ...EVENTS_MEMOIRE,
  ...EVENTS_EUROPE,
];

const BY_ID = new Map<string, GameEvent>(ALL.map((e) => [e.id, e]));

export function getEvent(id: string): GameEvent | undefined {
  return BY_ID.get(id);
}

export function standardEvents(): GameEvent[] {
  // Les intrigues font partie du pool : leurs épisodes d'ouverture ont un
  // poids conditionnel, leurs épisodes de chaîne un poids nul (déclenchés
  // uniquement par les conséquences différées).
  return ALL.filter(
    (e) => e.kind === "standard" || e.kind === "monde" || e.kind === "perso" || e.kind === "intrigue"
  );
}

export function getCrise(id: string) {
  return CRISES.find((c) => c.id === id);
}
