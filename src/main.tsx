import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./ui/ErrorBoundary";
import { useGame } from "./store";

if (import.meta.env.DEV) {
  // Console de test : window.mandat.getState() / .getState().newGame() etc.
  (window as unknown as Record<string, unknown>).mandat = useGame;
  import("./engine/registry").then((m) => {
    (window as unknown as Record<string, unknown>).mandatRegistry = m;
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
