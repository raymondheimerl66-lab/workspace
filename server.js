const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Statische Files servieren
app.use('/MissionControl', express.static(path.join(__dirname, 'MissionControl')));
app.use('/Projects', express.static(path.join(__dirname, 'Projects')));
app.use('/memory', express.static(path.join(__dirname, 'memory')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Hauptseite - Dashboard als HTML
app.get('/', (req, res) => {
  const dashboardPath = path.join(__dirname, 'MissionControl', 'dashboard.md');
  
  fs.readFile(dashboardPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error loading dashboard');
      return;
    }
    
    const htmlContent = marked(data);
    
    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mission Control</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #0d1117;
            color: #c9d1d9;
        }
        h1, h2, h3 { color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; margin-top: 30px; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: #161b22;
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #30363d;
        }
        th { background: #21262d; color: #f0f6fc; }
        tr:hover { background: #1c2128; }
        code {
            background: #21262d;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.9em;
        }
        pre {
            background: #161b22;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid #30363d;
        }
        pre code { background: none; padding: 0; }
        a { color: #58a6ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .refresh-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #238636;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 600;
        }
        .refresh-btn:hover { background: #2ea043; }
        blockquote {
            border-left: 4px solid #30363d;
            margin: 0;
            padding-left: 16px;
            color: #8b949e;
        }
    </style>
</head>
<body>
    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    ${htmlContent}
</body>
</html>`);
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎯 Mission Control running on port ${PORT}`);
});