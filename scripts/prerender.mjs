import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const routes = [
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
];

const PORT = 5173;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['serve', distDir, '-l', PORT.toString(), '-s'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Accepting connections') || output.includes('Serving!')) {
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    // Fallback: just assume it's up after 3s
    setTimeout(() => resolve(server), 3000);
  });
}

async function prerender() {
  console.log('Starting prerender process...');
  console.log(`Routes to prerender: ${routes.length}`);

  console.log('Starting local server...');
  const server = await startServer();
  await sleep(2000); // tiny extra buffer

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--single-process',
    ],
  });

  // lower default nav timeout
  browser.defaultBrowserContext().overridePermissions(`http://localhost:${PORT}`, []);
  let successCount = 0;
  const failedRoutes = [];

  try {
    for (const route of routes) {
      const url = `http://localhost:${PORT}${route}`;
      console.log(`Pre-rendering: ${route} (${url})`);

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      page.setDefaultNavigationTimeout(12000); // 12s cap per route

      // optional: don't waste time on analytics/fonts if you add them later
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const rurl = req.url();
        if (
          rurl.includes('googletagmanager.com') ||
          rurl.includes('google-analytics.com') ||
          rurl.includes('facebook.net') ||
          rurl.includes('fonts.googleapis.com') ||
          rurl.includes('challenges.cloudflare.com')
        ) {
          return req.abort();
        }
        req.continue();
      });

      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded', // much faster + good enough for SEO
          timeout: 12000,
        });

        // tiny extra wait to let React hydrate main content
        await sleep(1000);

        const html = await page.content();

        let outputPath;
        if (route === '/') {
          outputPath = path.join(distDir, 'index.html');
        } else {
          const routePath = route.replace(/^\//, '');
          const dirPath = path.join(distDir, routePath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          outputPath = path.join(dirPath, 'index.html');
        }

        fs.writeFileSync(outputPath, html);
        console.log(`  ✓ Written: ${outputPath}`);
        successCount++;
      } catch (routeError) {
        console.error(`  ✗ Failed to prerender ${route}: ${routeError.message}`);
        failedRoutes.push(route);
      } finally {
        await page.close();
      }
    }

    console.log('\n========================================');
    console.log('Prerender complete!');
    console.log(`Successfully generated: ${successCount}/${routes.length} pages`);
    if (failedRoutes.length > 0) {
      console.log(`Failed routes: ${failedRoutes.join(', ')}`);
    }
    console.log('========================================\n');
  } finally {
    console.log('Cleaning up...');
    await browser.close();
    try {
      server.kill('SIGTERM');
      await sleep(500);
      server.kill('SIGKILL');
    } catch (e) {
      // ignore
    }
    console.log('Cleanup complete. Exiting.');
    process.exit(0);
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});