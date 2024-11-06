import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { shouldCrawlPath } from '../utils/pathMatcher.js'
import { debug } from '../utils/debug.js';

// Rate limiter: 1 request per second
const rateLimiter = new RateLimiterMemory({
  points: 1,
  duration: 1,
});

class CrawlerService {
  constructor() {
    this.visitedUrls = new Set();
    this.results = [];
  }

  async crawl(baseUrl, options, progressCallback) {
    this.visitedUrls.clear();
    this.results = [];
    
    try {
      await this._crawlPage(baseUrl, options, 1, progressCallback);
      return this.results;
    } catch (error) {
      throw new Error(`Crawling failed: ${error.message}`);
    }
  }

  async _crawlPage(url, options, depth, progressCallback) {
    if (
      this.visitedUrls.has(url) ||
      this.visitedUrls.size >= options.maxPages ||
      depth > options.crawlDepth
    ) {
      return;
    }

    try {
      debug('=== Crawling ===');
      debug('URL:', url);
      debug('Depth:', depth);
      debug('Options:', JSON.stringify(options, null, 2));

      await rateLimiter.consume(url);
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Clean up content
      this._removeUnwantedElements($);
      
      // Extract content
      const content = this._extractContent($);
      
      // Store result
      this.visitedUrls.add(url);
      this.results.push({
        url,
        content,
        depth,
      });

      // Report progress
      progressCallback({
        pagesProcessed: this.visitedUrls.size,
        currentDepth: depth,
        currentUrl: url,
      });

      // Extract and follow links if needed
      if (depth < options.crawlDepth) {
        const links = this._extractLinks($, url, options);
        for (const link of links) {
          if (this.visitedUrls.size < options.maxPages) {
            await this._crawlPage(link, options, depth + 1, progressCallback);
          }
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  _removeUnwantedElements($) {
    $('script').remove();
    $('style').remove();
    $('iframe').remove();
    $('noscript').remove();
    $('*[style*="display:none"]').remove();
    $('*[style*="display: none"]').remove();
    $('*[hidden]').remove();
  }

  _extractContent($) {
    const content = {
      title: $('title').text(),
      headings: [],
      paragraphs: [],
    };

    // Extract headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      content.headings.push({
        level: el.name[1],
        text: $(el).text().trim(),
      });
    });

    // Extract paragraphs
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) content.paragraphs.push(text);
    });

    return content;
  }

  _extractLinks($, baseUrl, options) {
    const links = new Set();
    const baseUrlObj = new URL(baseUrl);

    console.log('\n📑 URL EXTRACTION START');
    console.log('🌐 Base URL:', baseUrl);
    console.log('🚫 Exclude Patterns:', options.excludePaths);

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const url = new URL(href, baseUrl);
          const pathname = url.pathname;
          
          console.log('\n🔗 Checking URL:', url.href);
          console.log('📍 Path:', pathname);
          
          const shouldCrawl = shouldCrawlPath(pathname, options);
          
          if (
            url.hostname === baseUrlObj.hostname &&
            !url.href.includes('#') &&
            !url.href.includes('mailto:') &&
            shouldCrawl
          ) {
            links.add(url.href);
            console.log('✅ Added to crawl list');
          } else {
            console.log('❌ Filtered out:', !shouldCrawl ? 'Path excluded' : 'Other criteria');
          }
        } catch (error) {
          console.error('❌ Invalid URL:', href, error);
        }
      }
    });

    return Array.from(links);
  }
}

export default CrawlerService; 