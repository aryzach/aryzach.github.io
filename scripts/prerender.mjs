import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// All routes to pre-render
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

    // Give it time to start
    setTimeout(() => resolve(server), 3000);
  });
}

async function prerender() {
  console.log('Starting prerender process...');
  
  // Start local server
  console.log('Starting local server...');
  const server = await startServer();
  await sleep(2000);
  
  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of routes) {
      console.log(`Pre-rendering: ${route}`);
      
      const page = await browser.newPage();
      
      // Navigate to route
      const url = `http://localhost:${PORT}${route}`;
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for React to render
      await sleep(1000);
      
      // Get the rendered HTML
      const html = await page.content();
      
      // Determine output path
      let outputPath;
      if (route === '/') {
        outputPath = path.join(distDir, 'index.html');
      } else {
        const routePath = route.replace(/^\//, '');
        const dirPath = path.join(distDir, routePath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        outputPath = path.join(dirPath, 'index.html');
      }
      
      // Write the HTML file
      fs.writeFileSync(outputPath, html);
      console.log(`  Written: ${outputPath}`);
      
      await page.close();
    }
    
    console.log('\nPrerender complete!');
    console.log(`Generated ${routes.length} static HTML files.`);
    
  } finally {
    await browser.close();
    server.kill();
  }
}

prerender().catch(console.error);
