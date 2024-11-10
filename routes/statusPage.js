export function setupStatusRoute(app) {
  app.get('/', (req, res) => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scrawlix API Status</title>
          <style>
              :root {
                  --primary-color: #6366f1;
                  --secondary-color: #818cf8;
                  --bg-color: #1e1b4b;
                  --card-bg: rgba(30, 27, 75, 0.9);
              }

              body {
                  margin: 0;
                  font-family: system-ui, -apple-system, sans-serif;
                  background: var(--bg-color);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
              }

              .api-status-container {
                  text-align: center;
                  position: relative;
              }

              .logo-container {
                  width: 150px;
                  height: 150px;
                  margin: 0 auto 2rem;
                  position: relative;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }

              .logo {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  animation: float 3s ease-in-out infinite;
                  filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.3));
              }

              .glow {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 160px;
                  height: 160px;
                  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%);
                  border-radius: 50%;
                  animation: pulse 2s ease-in-out infinite;
                  z-index: -1;
              }

              .status-card {
                  background: var(--card-bg);
                  padding: 2rem;
                  border-radius: 1rem;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  max-width: 500px;
                  margin: 0 auto;
              }

              .status-indicator {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 1rem;
                  margin: 1.5rem 0;
              }

              .pulse {
                  width: 12px;
                  height: 12px;
                  background: #22c55e;
                  border-radius: 50%;
                  animation: pulse 2s infinite;
              }

              .stats {
                  display: flex;
                  justify-content: center;
                  gap: 2rem;
                  margin-top: 2rem;
              }

              .stat-item {
                  text-align: center;
              }

              .stat-value {
                  font-size: 1.5rem;
                  font-weight: bold;
                  color: var(--primary-color);
              }

              .stat-label {
                  font-size: 0.875rem;
                  color: #94a3b8;
              }

              @keyframes float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-20px); }
              }

              @keyframes pulse {
                  0% { opacity: 0.5; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(1.1); }
                  100% { opacity: 0.5; transform: scale(1); }
              }

              @media (max-width: 768px) {
                  .status-card {
                      margin: 1rem;
                  }
                  .logo-container {
                      width: 120px;
                      height: 120px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="api-status-container">
              <div class="logo-container">
                  <div class="glow"></div>
                  <img src="logo.svg" alt="Scrawlix Logo" class="logo">
              </div>

              <div class="status-card">
                  <h1>Scrawlix API</h1>
                  <div class="status-indicator">
                      <span class="pulse"></span>
                      <span class="status-text">API is running smoothly</span>
                  </div>
                  
                  <div class="stats">
                      <div class="stat-item">
                          <div class="stat-value">99.9%</div>
                          <div class="stat-label">Uptime</div>
                      </div>
                      <div class="stat-item">
                          <div class="stat-value">42ms</div>
                          <div class="stat-label">Response Time</div>
                      </div>
                  </div>
              </div>
          </div>

          <script>
              document.addEventListener('DOMContentLoaded', () => {
                  const statusText = document.querySelector('.status-text');
                  const messages = [
                      "API is running smoothly",
                      "Ready to crawl websites",
                      "Processing requests at light speed",
                      "Web crawler operational",
                      "System fully functional"
                  ];

                  setInterval(() => {
                      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                      statusText.textContent = randomMessage;
                  }, 3000);
              });
          </script>
      </body>
      </html>
    `;
    res.send(html);
  });
}
