import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import CrawlerService from './services/crawler.js';
import http from 'http';
import WebSocketService from './services/websocket.js';
import { generateHTML } from './utils/htmlGenerator.js';

const app = express();
const port = 3000;
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
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Scrawlix API is running');
});

// Helper function to get filename
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    return domain.replace(/\./g, '-');
  } catch (error) {
    return 'website';
  }
}

// PDF Generation endpoint
app.post('/api/generate', async (req, res) => {
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
  
  try {
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
      const browser = await puppeteer.launch();
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
    wsService.broadcast({ type: 'error', data: error.message });
    res.status(500).json({ 
      error: 'Generation failed',
      message: error.message 
    });
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

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 