// Runs before `vite build` (prebuild hook); writes public/sitemap.xml.
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://www.sfsaunarental.com';

// Public, indexable routes only. Utility/private routes are excluded
// (/admin, /reservation/:id, /reservation-confirmation, /a2p-form-review,
//  /thank-you, /reservation-system).
const entries = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/pricing', changefreq: 'weekly', priority: '0.9' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.8' },
  { path: '/how-it-started', changefreq: 'yearly', priority: '0.6' },
  { path: '/install-power', changefreq: 'monthly', priority: '0.7' },
  { path: '/policies', changefreq: 'yearly', priority: '0.4' },
  { path: '/terms', changefreq: 'yearly', priority: '0.4' },
  { path: '/learn', changefreq: 'monthly', priority: '0.7' },
  { path: '/learn-more', changefreq: 'monthly', priority: '0.6' },
  { path: '/reserve-your-sauna', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/media', changefreq: 'monthly', priority: '0.5' },
  { path: '/care', changefreq: 'yearly', priority: '0.4' },
  { path: '/service-areas', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-directory', changefreq: 'monthly', priority: '0.6' },
  { path: '/sauna-san-francisco', changefreq: 'monthly', priority: '0.8' },
  { path: '/in-home-sauna-san-francisco', changefreq: 'monthly', priority: '0.8' },
  { path: '/infrared-sauna-san-francisco', changefreq: 'monthly', priority: '0.8' },
  { path: '/finnish-sauna-san-francisco', changefreq: 'monthly', priority: '0.8' },
  { path: '/sauna-rental-sf', changefreq: 'monthly', priority: '0.8' },
  { path: '/sauna-rental-san-francisco', changefreq: 'monthly', priority: '0.8' },
  { path: '/sauna-rental-oakland', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-rental-berkeley', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-rental-marin', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-rental-palo-alto', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-rental-mountain-view', changefreq: 'monthly', priority: '0.7' },
  { path: '/sauna-review/south-end-rowing-club', changefreq: 'yearly', priority: '0.5' },
  { path: '/sauna-review/fitness-sf-fillmore', changefreq: 'yearly', priority: '0.5' },
  { path: '/email-more-info', changefreq: 'monthly', priority: '0.5' },
  { path: '/indoor-infrared-sauna-rental', changefreq: 'monthly', priority: '0.8' },
  { path: '/pre-fab-sauna-installation', changefreq: 'monthly', priority: '0.7' },
  { path: '/pre-fab-sauna-installation-form', changefreq: 'monthly', priority: '0.5' },
  { path: '/reserve-traditional-landing', changefreq: 'monthly', priority: '0.8' },
  { path: '/reserve-traditional-landing-pay', changefreq: 'monthly', priority: '0.7' },
  { path: '/reserve-traditional-landing-consult', changefreq: 'monthly', priority: '0.7' },
  { path: '/traditional-sauna-specs', changefreq: 'monthly', priority: '0.8' },
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map((e) =>
    [
      '  <url>',
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  ),
  '</urlset>',
].join('\n');

writeFileSync(resolve('public/sitemap.xml'), xml + '\n');
console.log(`sitemap.xml written (${entries.length} entries)`);