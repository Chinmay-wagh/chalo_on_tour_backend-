const puppeteer = require('puppeteer');
const fs = require('fs');
const { buildTourSummaryHtml } = require('./tourSummaryHtml');

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const possiblePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of possiblePaths) {
    try { if (fs.existsSync(p)) return p; } catch (e) {}
  }
  return undefined;
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: findChrome(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

// Shared logger for PDF generation
const path = require('path');
const logFile = path.join(__dirname, '../pdf-debug.log');
const logLine = (msg) => {
    try {
        const entry = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(logFile, entry);
        console.log(msg);
    } catch (e) {
        console.error('Logging failed:', e.message);
    }
};

async function buildTourSummaryPdf(lead, res) {
  logLine(`buildTourSummaryPdf started for lead: ${lead._id}`);
  const html = buildTourSummaryHtml(lead);
  logLine('HTML built, launching browser...');
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    logLine('Page created, setting content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    logLine('Content set, generating PDF...');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });
    logLine(`PDF buffer generated, size: ${pdfBuffer.length}`);

    const leadId = lead?.leadId || lead?._id?.toString?.() || 'lead';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="tour-summary-${leadId}.pdf"`);
    res.send(pdfBuffer);
    logLine('PDF sent to response');
  } catch (err) {
    logLine(`Error in buildTourSummaryPdf: ${err.message}`);
    throw err;
  } finally {
    await browser.close();
    logLine('Browser closed');
  }
}

module.exports = { buildTourSummaryPdf };
