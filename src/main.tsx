import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

initPostHog();

// If a lazy-loaded JS chunk fails to load (stale deployment), reload the page once.
window.addEventListener("error", (e) => {
  if (e.message?.includes("dynamically imported module") || e.message?.includes("Failed to fetch")) {
    const reloaded = sessionStorage.getItem("chunk-reload");
    if (!reloaded) {
      sessionStorage.setItem("chunk-reload", "1");
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
