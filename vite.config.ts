import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { localRecordsPlugin } from "./scripts/dev/localRecordsPlugin";

// All routes to pre-render as static HTML files
export const routes = [
  '/',
  '/pricing',
  '/how-it-works',
  '/how-it-started',
  '/install-power',
  '/policies',
  '/blog/chronic-pain-resources-sf',
  '/learn',
  '/reserve-your-sauna',
  '/learn-more',
  '/contact',
  '/media',
  '/sauna-san-francisco',
  '/in-home-sauna-san-francisco',
  '/infrared-sauna-san-francisco',
  '/finnish-sauna-san-francisco',
  '/sauna-rental-sf',
  '/sauna-rental-san-francisco',
  '/sauna-rental-oakland',
  '/sauna-rental-berkeley',
  '/sauna-rental-marin',
  '/sauna-rental-palo-alto',
  '/sauna-rental-mountain-view',
  '/service-areas',
  '/sauna-directory',
  '/sauna-review/south-end-rowing-club',
  '/sauna-review/fitness-sf-fillmore',
  '/email-more-info',
  '/thank-you',
  '/reservation-payment-or-schedule-call',
  '/indoor-infrared-sauna-rental',
  '/reservation-system',
  '/terms',
  '/pre-fab-sauna-installation',
  '/pre-fab-sauna-installation-form',
  '/reserve-traditional-landing',
  '/reserve-traditional-landing-pay',
  '/reserve-traditional-landing-consult',
  '/a2p-form-review',
  '/traditional-sauna-specs',
  '/blog/landing/How-to-Fix-All-Your-Sleep-Issues-in-1-Day',
];

// Vite config for root GitHub Pages site (aryzach.github.io)
export default defineConfig(({ mode }) => ({
  // no subpath — this tells Vite to build asset URLs from "/"
  base: "/",

  // Development and preview artifacts never contain production backend credentials.
  define: mode === "production" ? {} : {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://preview.invalid"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("preview-public-placeholder"),
    "import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL": JSON.stringify(""),
    "import.meta.env.VITE_GHL_HIRING_WEBHOOK_URL": JSON.stringify(""),
  },

  server: {
    host: "127.0.0.1",
    port: 8080,
  },

  plugins: [react(), localRecordsPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
