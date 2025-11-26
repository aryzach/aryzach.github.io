import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PostHogProvider } from "posthog-js/react";

const options = {
  api_host: "https://us.i.posthog.com",
} as const;

createRoot(document.getElementById("root")!).render(
  <PostHogProvider 
    apiKey="phc_IjEEVDzPmC9E1G0I680IbcYJqBtT2CTf4R20GxiKKE4" 
    options={options}
  >
    <App />
  </PostHogProvider>
);
