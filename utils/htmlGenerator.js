export function generateHTML(pages, options) {
  const getFontSize = (size) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    return sizes[size] || sizes.medium;
  };

  const css = `
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: ${getFontSize(options.fontSize)};
        line-height: 1.6;
        color: #333;
      }
      h1 { font-size: 2em; margin: 0.67em 0; }
      h2 { font-size: 1.5em; margin: 0.75em 0; }
      h3 { font-size: 1.17em; margin: 0.83em 0; }
      img { max-width: 100%; height: auto; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      td, th { border: 1px solid #ddd; padding: 8px; }
      .page-break { page-break-after: always; }
      .url { color: #666; font-size: 0.9em; margin-bottom: 1em; }
    </style>
  `;

  const content = pages.map((page, index) => `
    <div class="page ${index < pages.length - 1 ? 'page-break' : ''}">
      <div class="url">Source: ${page.url}</div>
      <h1>${page.content.title}</h1>
      
      ${page.content.headings.map(h => 
        `<h${h.level}>${h.text}</h${h.level}>`
      ).join('\n')}
      
      ${page.content.paragraphs.map(p => 
        `<p>${p}</p>`
      ).join('\n')}
    </div>
  `).join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        ${css}
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
} 