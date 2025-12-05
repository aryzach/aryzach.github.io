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
  console.log(`Routes to prerender: ${routes.length}`);
  
  // Start local server
  console.log('Starting local server...');
  const server = await startServer();
  await sleep(3000); // Give server more time to start
  
  // Launch browser with robust CI configuration
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

  let successCount = 0;
  let failedRoutes = [];

  try {
    for (const route of routes) {
      try {
        console.log(`Pre-rendering: ${route}`);
        
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 800 });
        
        // Navigate to route with increased timeout
        const url = `http://localhost:${PORT}${route}`;
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 60000 
        });
        
        // Wait for React to render
        await sleep(2000);
        
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
        console.log(`  ✓ Written: ${outputPath}`);
        successCount++;
        
        await page.close();
      } catch (routeError) {
        console.error(`  ✗ Failed to prerender ${route}: ${routeError.message}`);
        failedRoutes.push(route);
      }
    }
    
    console.log('\n========================================');
    console.log(`Prerender complete!`);
    console.log(`Successfully generated: ${successCount}/${routes.length} pages`);
    if (failedRoutes.length > 0) {
      console.log(`Failed routes: ${failedRoutes.join(', ')}`);
    }
    console.log('========================================\n');
    
  } finally {
    console.log('Cleaning up...');
    await browser.close();
    
    // Force kill the server process and any children
    try {
      server.kill('SIGTERM');
      // Give it a moment to terminate gracefully
      await sleep(500);
      server.kill('SIGKILL');
    } catch (e) {
      // Ignore errors if already dead
    }
    
    console.log('Cleanup complete. Exiting.');
    process.exit(0);
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
