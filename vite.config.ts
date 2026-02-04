import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// All routes to pre-render as static HTML files
export const routes = [
  '/',
  '/pricing',
  '/how-it-works',
  '/how-it-started',
  '/install-power',
  '/policies',
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
];

// Vite config for root GitHub Pages site (aryzach.github.io)
export default defineConfig(({ mode }) => ({
  // no subpath — this tells Vite to build asset URLs from "/"
  base: "/",

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
