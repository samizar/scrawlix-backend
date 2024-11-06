import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-core';
import CrawlerService from './services/crawler.js';
import http from 'http';
import WebSocketService from './services/websocket.js';
import { generateHTML } from './utils/htmlGenerator.js';
import chromium from '@sparticuz/chromium';

const app = express();
const server = http.createServer(app);
const wsService = new WebSocketService(server);

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://scrawlix.abuzarifa.com'
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Scrawlix API is running'
  });
});

// PDF Generation endpoint
app.post('/api/generate', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    
    const { 
      url, 
      format,
      crawlDepth, 
      maxPages,
      fontSize, 
      margin,
      includePaths,
      excludePaths 
    } = req.body;
    
    const crawler = new CrawlerService();
    const filename = getFilenameFromUrl(url);
    
    // Start crawling
    const pages = await crawler.crawl(url, {
      crawlDepth,
      maxPages,
      includePaths,
      excludePaths
    }, (progress) => {
      wsService.broadcast({ type: 'progress', data: progress });
    });

    if (format === 'pdf') {
      // Generate PDF
      const page = await browser.newPage();
      const html = generateHTML(pages, { fontSize, margin });
      await page.setContent(html);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: getPDFMargins(margin)
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
      res.send(pdf);
    } else {
      // Return JSON
      res.json({ pages });
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Generation failed',
      message: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

function getPDFMargins(margin) {
  const margins = {
    none: '0px',
    small: '10px',
    medium: '20px',
    large: '40px'
  };
  const size = margins[margin] || margins.medium;
  return {
    top: size,
    right: size,
    bottom: size,
    left: size
  };
}

function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '-');
    const pathname = urlObj.pathname.replace(/\//g, '-');
    return `${hostname}${pathname}`.replace(/[^a-zA-Z0-9-]/g, '');
  } catch (error) {
    return 'download';
  }
}

// Only start server if not in Vercel
if (process.env.NODE_ENV !== 'production') {
  server.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

export default app; 