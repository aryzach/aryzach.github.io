import "./dev/bootstrap";
import { productionEnabled } from "./lib/runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PostHogProvider } from "posthog-js/react";

if (productionEnabled) {
  const w = window as unknown as { dataLayer: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=GTM-P929DVCW";
  document.head.appendChild(script);
}

const options = {
  api_host: "https://us.i.posthog.com",
} as const;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {productionEnabled ? <PostHogProvider
      apiKey="phc_IjEEVDzPmC9E1G0I680IbcYJqBtT2CTf4R20GxiKKE4"
      options={options}
    >
      <App />
    </PostHogProvider> : <App />}
  </StrictMode>
);
