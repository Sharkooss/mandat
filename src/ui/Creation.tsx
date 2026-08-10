import { useState } from "react";
import type { Bio } from "../engine/types";
import { useGame } from "../store";
import { REGIONS, MILIEUX, FORMATIONS, EVENEMENTS_FONDATEURS, MENTORS, type CreationOption } from "../content/france/data";

const STEPS = [
  { key: "identite", titre: "Qui êtes-vous ?" },
  { key: "regionId", titre: "D'où venez-vous ?", options: REGIONS },
  { key: "milieuId", titre: "Dans quel monde avez-vous grandi ?", options: MILIEUX },
  { key: "formationId", titre: "Qu'avez-vous appris ?", options: FORMATIONS },
  { key: "evenementId", titre: "Qu'est-ce qui vous a forgé ?", options: EVENEMENTS_FONDATEURS },
  { key: "mentorId", titre: "Qui vous a ouvert les portes ?", options: MENTORS },
] as const;

export default function Creation() {
  const submitBio = useGame((g) => g.submitBio);
  const randomBio = useGame((g) => g.randomBio);
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState<Bio>({
    prenom: "",
    nom: "",
    genre: "m",
    age: 47,
    regionId: "",
    milieuId: "",
    formationId: "",
    evenementId: "",
    mentorId: "",
    conjointPrenom: "",
    conjointCarriere: "avocature",
  });

  const current = STEPS[step];
  const pick = (key: string, id: string) => {
    const next = { ...bio, [key]: id };
    setBio(next);
    if (step < STEPS.length - 1) setStep(step + 1);
    else submitBio(next);
  };

  return (
    <div className="max-w-2xl mx-auto pt-12 px-6 fade-in" key={step}>
      <div className="flex justify-between items-center mb-8">
        <div className="text-xs uppercase tracking-widest text-paper-500">
          Acte I — Origines · {step + 1}/{STEPS.length}
        </div>
        <button className="text-xs text-paper-500 underline hover:text-paper-300" onClick={randomBio}>
          Tout aléatoire →
        </button>
      </div>
      <h1 className="press-une text-3xl mb-8">{current.titre}</h1>

      {current.key === "identite" ? (
        <div className="dossier p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-paper-500">Prénom</span>
              <input
                className="mt-1 w-full bg-ink-800 border border-ink-600 rounded px-3 py-2 text-sm"
                value={bio.prenom}
                placeholder="(aléatoire si vide)"
                onChange={(e) => setBio({ ...bio, prenom: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-paper-500">Nom</span>
              <input
                className="mt-1 w-full bg-ink-800 border border-ink-600 rounded px-3 py-2 text-sm"
                value={bio.nom}
                placeholder="(aléatoire si vide)"
                onChange={(e) => setBio({ ...bio, nom: e.target.value })}
              />
            </label>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex gap-2">
              {(["f", "m"] as const).map((genre) => (
                <button
                  key={genre}
                  className="px-4 py-2 rounded text-sm border"
                  style={{
                    background: bio.genre === genre ? "var(--accent)" : "var(--color-ink-800)",
                    borderColor: bio.genre === genre ? "var(--accent)" : "var(--color-ink-600)",
                  }}
                  onClick={() => setBio({ ...bio, genre })}
                >
                  {genre === "f" ? "Une femme" : "Un homme"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 flex-1">
              <span className="text-xs text-paper-500 whitespace-nowrap">Âge à l'élection : {bio.age} ans</span>
              <input type="range" min={38} max={68} value={bio.age} className="flex-1" onChange={(e) => setBio({ ...bio, age: +e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-paper-500">La carrière de votre conjoint(e)</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {["avocature", "médecine", "entreprise", "enseignement"].map((c) => (
                <button
                  key={c}
                  className="px-3 py-1.5 rounded text-xs border capitalize"
                  style={{
                    background: bio.conjointCarriere === c ? "var(--accent)" : "var(--color-ink-800)",
                    borderColor: bio.conjointCarriere === c ? "var(--accent)" : "var(--color-ink-600)",
                  }}
                  onClick={() => setBio({ ...bio, conjointCarriere: c })}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>
          <button className="btn-primary" onClick={() => setStep(1)}>
            Continuer
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {(current.options as readonly CreationOption[]).map((opt) => (
            <button key={opt.id} className="btn-choice" onClick={() => pick(current.key, opt.id)}>
              <div className="font-semibold text-sm">{opt.nom}</div>
              <div className="text-xs text-paper-500 mt-0.5">{opt.detail}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--color-accent-warm)" }}>
                {opt.effets}
              </div>
            </button>
          ))}
          {step > 0 && (
            <button className="text-xs text-paper-500 underline mt-2" onClick={() => setStep(step - 1)}>
              ← Revenir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
