import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-core';
import CrawlerService from './services/crawler.js';
import http from 'http';
import WebSocketService from './services/websocket.js';
import { generateHTML } from './utils/htmlGenerator.js';
import chromium from '@sparticuz/chromium';
import { fileURLToPath } from 'url';
import path from 'path';

// Add these lines to get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Add this line to serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// HTML template for the styled API response
const getStyledHTML = (data) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scrawlix API Status</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        body {
            background: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }

        .api-container {
            background: #141414;
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            position: relative;
            overflow: hidden;
        }

        .api-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #6366f1, transparent);
            animation: scan 2s linear infinite;
        }

        @keyframes scan {
            from { transform: translateX(-50%); }
            to { transform: translateX(50%); }
        }

        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            position: relative;
            animation: spinLogo 1s ease-out;
        }

        @keyframes spinLogo {
            from { transform: rotate(-180deg) scale(0); }
            to { transform: rotate(0) scale(1); }
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            animation: pulseLogo 2s infinite ease-in-out;
        }

        .logo::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%);
            border-radius: 50%;
            z-index: -1;
            animation: glowPulse 2s infinite ease-in-out;
        }

        @keyframes pulseLogo {
            0% { transform: scale(1); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
        }

        @keyframes glowPulse {
            0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
            100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
        }

        .status-badge {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 1.5rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #6366f1;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
            100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        .json-display {
            background: #1a1a1a;
            border-radius: 8px;
            padding: 1.5rem;
            color: #fff;
            font-family: 'Monaco', 'Consolas', monospace;
            line-height: 1.5;
            animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .key { color: #6366f1; }
        .string { color: #fff; }

        .status-message {
            font-size: 1.2rem;
            color: #6366f1;
            margin: 1rem 0;
            font-weight: 500;
            animation: fadeIn 0.5s ease-out;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-top: 1.5rem;
            text-align: center;
        }

        .stat-card {
            background: rgba(99, 102, 241, 0.1);
            padding: 1rem;
            border-radius: 8px;
            animation: slideUp 0.5s ease-out;
        }

        .stat-value {
            font-size: 1.5rem;
            color: #6366f1;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #94a3b8;
        }

        #status-text {
            transition: all 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="api-container">
        <div class="logo">
            <img src="/logo.svg" alt="Scrawlix Logo">
        </div>
        <div class="status-badge">
            <span class="status-dot"></span>
            <span id="status-text">Crawling the web like a boss!</span>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">42ms</div>
                <div class="stat-label">Response Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">99.9%</div>
                <div class="stat-label">Uptime</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">∞</div>
                <div class="stat-label">Pages Ready</div>
            </div>
        </div>
    </div>

    <script>
        const statusMessages = [
            "Crawling the web like a boss! 🕷️",
            "Converting HTML faster than you can say 'DOM'! 🚀",
            "Making PDFs look pretty since 2023 ✨",
            "Parsing pages at ludicrous speed! 💨",
            "Web scraping with style and grace 🎭",
            "Turning chaos into beautiful PDFs 📑",
            "Your friendly neighborhood web crawler 🕸️",
            "Making the web printer-friendly, one page at a time 🖨️",
            "Transforming websites into pocket-sized PDFs 📱",
            "Ready to crawl, parse, and amaze! ✨"
        ];

        const responseTimeMessages = [
            "Faster than a caffeinated developer",
            "Quick as a keyboard shortcut",
            "Speed of light (almost)",
            "Blink and you'll miss it"
        ];

        function updateStatusMessage() {
            const statusText = document.getElementById('status-text');
            const randomMessage = statusMessages[Math.floor(Math.random() * statusMessages.length)];
            statusText.style.opacity = 0;
            setTimeout(() => {
                statusText.textContent = randomMessage;
                statusText.style.opacity = 1;
            }, 300);
        }

        function updateResponseTime() {
            const responseTime = Math.floor(Math.random() * 20 + 30);
            document.querySelector('.stat-value').textContent = responseTime + 'ms';
        }

        setInterval(updateStatusMessage, 4000);
        setInterval(updateResponseTime, 2000);
    </script>
</body>
</html>
`;

// Root endpoint with content negotiation
app.get('/', (req, res) => {
  const accepts = req.accepts(['html', 'json']);
  const data = {
    status: 'ok',
    message: 'Scrawlix API is running'
  };

  if (accepts === 'html') {
    res.setHeader('Content-Type', 'text/html');
    res.send(getStyledHTML(data));
  } else {
    res.json(data);
  }
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
