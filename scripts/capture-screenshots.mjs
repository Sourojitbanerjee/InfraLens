import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../docs/screenshots');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:5173';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('Navigating to', APP_URL);
  await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2500);

  // 1. Landing View
  console.log('Capturing 01-landing.png...');
  await page.screenshot({ path: path.join(outputDir, '01-landing.png') });

  // 2. Command Center (Key '2')
  console.log('Navigating to Command Center...');
  await page.keyboard.press('2');
  await sleep(2000);
  console.log('Capturing 02-command-center.png...');
  await page.screenshot({ path: path.join(outputDir, '02-command-center.png') });

  // 3. GIS Map (Key '4')
  console.log('Navigating to GIS Map...');
  await page.keyboard.press('4');
  await sleep(3500); // Wait for Leaflet map tiles & GeoJSON
  console.log('Capturing 03-gis-map.png...');
  await page.screenshot({ path: path.join(outputDir, '03-gis-map.png') });

  // 4. AI Analysis (Key '3')
  console.log('Navigating to AI Scanner...');
  await page.keyboard.press('3');
  await sleep(1500);
  // Click first preset button to trigger CV analysis
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const presetBtn = buttons.find((b) => b.textContent && (b.textContent.includes('Pothole') || b.textContent.includes('Severe') || b.textContent.includes('Radial')));
    if (presetBtn) {
      presetBtn.click();
    } else {
      // Click any button in preset row
      const firstPreset = document.querySelector('button[class*="border transition-all"]');
      if (firstPreset) firstPreset.click();
    }
  });
  await sleep(3000); // Wait for pipeline stages to complete
  console.log('Capturing 04-ai-analysis.png...');
  await page.screenshot({ path: path.join(outputDir, '04-ai-analysis.png') });

  // 5. Priority Queue (Key '5')
  console.log('Navigating to Priority Queue...');
  await page.keyboard.press('5');
  await sleep(2000);
  console.log('Capturing 05-priority-queue.png...');
  await page.screenshot({ path: path.join(outputDir, '05-priority-queue.png') });

  // 6. Analytics (Key '6')
  console.log('Navigating to Analytics...');
  await page.keyboard.press('6');
  await sleep(2500);
  console.log('Capturing 06-analytics.png...');
  await page.screenshot({ path: path.join(outputDir, '06-analytics.png') });

  // 7. Citizen Portal
  console.log('Navigating to Citizen Portal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const citizenBtn = buttons.find((b) => b.textContent && b.textContent.includes('Citizen'));
    if (citizenBtn) citizenBtn.click();
  });
  await sleep(2000);
  console.log('Capturing 07-citizen-portal.png...');
  await page.screenshot({ path: path.join(outputDir, '07-citizen-portal.png') });

  // 8. Authorities (Key '7')
  console.log('Navigating to Authorities...');
  await page.keyboard.press('7');
  await sleep(2000);
  console.log('Capturing 08-authorities.png...');
  await page.screenshot({ path: path.join(outputDir, '08-authorities.png') });

  // 9. Chief Inspector Dashboard
  console.log('Navigating to Chief Inspector...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const chiefBtn = buttons.find((b) => b.textContent && b.textContent.includes('Chief Inspector'));
    if (chiefBtn) chiefBtn.click();
  });
  await sleep(2000);
  console.log('Capturing 09-chief-inspector.png...');
  await page.screenshot({ path: path.join(outputDir, '09-chief-inspector.png') });

  // 10. Supervisor Dashboard
  console.log('Navigating to Supervisor Dashboard...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const superBtn = buttons.find((b) => b.textContent && b.textContent.includes('Supervisor'));
    if (superBtn) superBtn.click();
  });
  await sleep(2000);
  console.log('Capturing 10-supervisor.png...');
  await page.screenshot({ path: path.join(outputDir, '10-supervisor.png') });

  // 11. Mobile Viewport: Field Inspector Mobile
  console.log('Setting Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await sleep(1000);

  // Switch to inspector-mobile
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const inspBtn = buttons.find((b) => b.textContent && b.textContent.includes('Inspector') && !b.textContent.includes('Chief'));
    if (inspBtn) inspBtn.click();
  });
  await sleep(2000);
  console.log('Capturing 11-field-inspector-mobile.png...');
  await page.screenshot({ path: path.join(outputDir, '11-field-inspector-mobile.png') });

  // 12. Mobile Landing
  await page.keyboard.press('1');
  await sleep(2000);
  console.log('Capturing 12-mobile-landing.png...');
  await page.screenshot({ path: path.join(outputDir, '12-mobile-landing.png') });

  // 13. Mobile Command Center
  await page.keyboard.press('2');
  await sleep(2000);
  console.log('Capturing 13-mobile-command.png...');
  await page.screenshot({ path: path.join(outputDir, '13-mobile-command.png') });

  await browser.close();
  console.log('All screenshots captured successfully in docs/screenshots!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
