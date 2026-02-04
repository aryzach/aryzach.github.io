// Centralized route definitions for the application
// Used by: App.tsx routing, prerender script, sitemap generation

export const routes = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.9, changefreq: 'weekly' },
  { path: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
  { path: '/how-it-started', priority: 0.6, changefreq: 'yearly' },
  { path: '/install-power', priority: 0.7, changefreq: 'monthly' },
  { path: '/policies', priority: 0.4, changefreq: 'yearly' },
  { path: '/learn', priority: 0.6, changefreq: 'monthly' },
  { path: '/reserve-your-sauna', priority: 0.9, changefreq: 'monthly' },
  { path: '/learn-more', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/media', priority: 0.6, changefreq: 'monthly' },
  { path: '/sauna-san-francisco', priority: 0.9, changefreq: 'weekly' },
  { path: '/in-home-sauna-san-francisco', priority: 0.9, changefreq: 'weekly' },
  { path: '/infrared-sauna-san-francisco', priority: 0.9, changefreq: 'weekly' },
  { path: '/finnish-sauna-san-francisco', priority: 0.9, changefreq: 'weekly' },
  { path: '/sauna-rental-sf', priority: 0.9, changefreq: 'weekly' },
  { path: '/sauna-rental-san-francisco', priority: 0.9, changefreq: 'weekly' },
  { path: '/sauna-rental-oakland', priority: 0.8, changefreq: 'weekly' },
  { path: '/sauna-rental-berkeley', priority: 0.8, changefreq: 'weekly' },
  { path: '/sauna-rental-marin', priority: 0.8, changefreq: 'weekly' },
  { path: '/sauna-rental-palo-alto', priority: 0.8, changefreq: 'weekly' },
  { path: '/sauna-rental-mountain-view', priority: 0.8, changefreq: 'weekly' },
  { path: '/service-areas', priority: 0.7, changefreq: 'monthly' },
  { path: '/sauna-directory', priority: 0.8, changefreq: 'weekly' },
  { path: '/sauna-review/south-end-rowing-club', priority: 0.7, changefreq: 'monthly' },
  { path: '/sauna-review/fitness-sf-fillmore', priority: 0.7, changefreq: 'monthly' },
  { path: '/email-more-info', priority: 0.5, changefreq: 'monthly' },
  { path: '/thank-you', priority: 0.3, changefreq: 'monthly' },
  { path: '/reservation-payment-or-schedule-call', priority: 0.6, changefreq: 'monthly' },
  { path: '/indoor-infrared-sauna-rental', priority: 0.8, changefreq: 'monthly' },
] as const;

export const routePaths = routes.map(r => r.path);
