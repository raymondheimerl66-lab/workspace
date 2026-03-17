const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const execAsync = promisify(exec);
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'MissionControl', 'public')));

// Database connection
const DB_PATH = path.join(__dirname, 'MissionControl', 'db', 'database.sqlite');
let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

// Cache for external data
const cache = {
    github: { data: null, lastFetch: 0 },
    weather: { data: null, lastFetch: 0 },
    health: { data: null, lastFetch: 0 }
};

const CACHE_TTL = {
    github: 5 * 60 * 1000,    // 5 minutes
    weather: 10 * 60 * 1000,  // 10 minutes
    health: 30 * 1000         // 30 seconds
};

// ==================== API ROUTES ====================

// Simple Health Check for Railway
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Detailed Health Check
app.get('/api/health', async (req, res) => {
    try {
        const now = Date.now();
        if (now - cache.health.lastFetch > CACHE_TTL.health) {
            const { stdout: uptime } = await execAsync('uptime');
            const { stdout: memory } = await execAsync("vm_stat | awk '/Pages free/ {free=$3} /Pages active/ {active=$3} /Pages inactive/ {inactive=$3} /Pages wired/ {wired=$3} END {gsub(/\\./,\"\",free); gsub(/\\./,\"\",active); gsub(/\\./,\"\",inactive); gsub(/\\./,\"\",wired); total=(free+active+inactive+wired)*4096/1024/1024/1024; used=(active+inactive+wired)*4096/1024/1024/1024; printf \"%.1fGB / %.1fGB\", used, total}'");
            const { stdout: disk } = await execAsync("df -h / | awk 'NR==2 {print $4 \" / \" $2 \" (\" $5 \" used)\"}'");
            const { stdout: load } = await execAsync("uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}'");
            
            cache.health.data = {
                status: 'ok',
                uptime: uptime.trim(),
                memory: memory.trim(),
                disk: disk.trim(),
                load: load.trim(),
                timestamp: new Date().toISOString()
            };
            cache.health.lastFetch = now;
        }
        res.json(cache.health.data);
    } catch (error) {
        res.json({ status: 'error', error: error.message, timestamp: new Date().toISOString() });
    }
});

// Weather
app.get('/api/weather', async (req, res) => {
    try {
        const now = Date.now();
        if (now - cache.weather.lastFetch > CACHE_TTL.weather) {
            const location = process.env.WEATHER_LOCATION || 'Luzern,CH';
            const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
            const data = await response.json();
            cache.weather.data = {
                location: data.nearest_area[0].areaName[0].value,
                country: data.nearest_area[0].country[0].value,
                temp: data.current_condition[0].temp_C,
                feelsLike: data.current_condition[0].FeelsLikeC,
                description: data.current_condition[0].weatherDesc[0].value,
                humidity: data.current_condition[0].humidity,
                wind: data.current_condition[0].windspeedKmph,
                timestamp: new Date().toISOString()
            };
            cache.weather.lastFetch = now;
        }
        res.json(cache.weather.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GitHub Integration
app.get('/api/github', async (req, res) => {
    try {
        const now = Date.now();
        if (now - cache.github.lastFetch > CACHE_TTL.github) {
            const repo = process.env.GITHUB_REPO || 'Rayze64/therapeuten-plattform';
            const token = process.env.GITHUB_TOKEN;
            
            let issues = [];
            let prs = [];
            let commits = [];
            
            if (token) {
                // Fetch issues
                const issuesRes = await fetch(`https://api.github.com/repos/${repo}/issues?state=open`, {
                    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
                });
                if (issuesRes.ok) {
                    const allIssues = await issuesRes.json();
                    issues = allIssues.filter(i => !i.pull_request).slice(0, 5);
                    prs = allIssues.filter(i => i.pull_request).slice(0, 5);
                }
                
                // Fetch recent commits
                const commitsRes = await fetch(`https://api.github.com/repos/${repo}/commits?since=${new Date(Date.now() - 7*24*60*60*1000).toISOString()}`, {
                    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
                });
                if (commitsRes.ok) {
                    commits = await commitsRes.json();
                }
            }
            
            cache.github.data = {
                repo,
                issues,
                prs,
                commits: commits.slice(0, 10),
                timestamp: new Date().toISOString()
            };
            cache.github.lastFetch = now;
        }
        res.json(cache.github.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Force refresh all caches
app.post('/api/update-dashboard', (req, res) => {
    cache.github.lastFetch = 0;
    cache.weather.lastFetch = 0;
    cache.health.lastFetch = 0;
    res.json({ message: 'Caches cleared, will refresh on next request' });
});

// ==================== TASKS API ====================

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const db = getDb();
    const { status, project_id, priority } = req.query;
    let sql = `
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        LEFT JOIN projects p ON t.project_id = p.id 
        WHERE 1=1
    `;
    const params = [];
    
    if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
    }
    if (project_id) {
        sql += ' AND t.project_id = ?';
        params.push(project_id);
    }
    if (priority) {
        sql += ' AND t.priority = ?';
        params.push(priority);
    }
    
    sql += ' ORDER BY t.priority ASC, t.created_at DESC';
    
    const tasks = db.prepare(sql).all(...params);
    res.json(tasks);
});

// Create task
app.post('/api/tasks', (req, res) => {
    const db = getDb();
    const { title, description, status, priority, project_id, due_date, tags } = req.body;
    
    const result = db.prepare(`
        INSERT INTO tasks (title, description, status, priority, project_id, due_date, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, status || 'todo', priority || 3, project_id, due_date, tags);
    
    res.json({ id: result.lastInsertRowid, message: 'Task created' });
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { title, description, status, priority, project_id, due_date, tags } = req.body;
    
    db.prepare(`
        UPDATE tasks 
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            project_id = COALESCE(?, project_id),
            due_date = COALESCE(?, due_date),
            tags = COALESCE(?, tags)
        WHERE id = ?
    `).run(title, description, status, priority, project_id, due_date, tags, id);
    
    res.json({ message: 'Task updated' });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Task deleted' });
});

// ==================== PROJECTS API ====================

// Get all projects
app.get('/api/projects', (req, res) => {
    const db = getDb();
    const projects = db.prepare(`
        SELECT p.*, 
               COUNT(t.id) as task_count,
               SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
        ORDER BY p.priority ASC, p.created_at DESC
    `).all();
    
    // Parse milestones_json for each project
    projects.forEach(p => {
        try {
            p.milestones = JSON.parse(p.milestones_json || '[]');
            delete p.milestones_json;
        } catch {
            p.milestones = [];
        }
    });
    
    res.json(projects);
});

// Create project
app.post('/api/projects', (req, res) => {
    const db = getDb();
    const { name, description, phase, status, priority, deadline, milestones } = req.body;
    
    const result = db.prepare(`
        INSERT INTO projects (name, description, phase, status, priority, deadline, milestones_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, phase, status || 'not_started', priority || 3, deadline, 
           JSON.stringify(milestones || []));
    
    res.json({ id: result.lastInsertRowid, message: 'Project created' });
});

// Update project
app.put('/api/projects/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { name, description, phase, status, priority, deadline, milestones } = req.body;
    
    let sql = 'UPDATE projects SET ';
    const updates = [];
    const params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (phase !== undefined) { updates.push('phase = ?'); params.push(phase); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
    if (deadline !== undefined) { updates.push('deadline = ?'); params.push(deadline); }
    if (milestones !== undefined) { updates.push('milestones_json = ?'); params.push(JSON.stringify(milestones)); }
    
    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    db.prepare(sql).run(...params);
    res.json({ message: 'Project updated' });
});

// ==================== NOTES API ====================

// Get all notes
app.get('/api/notes', (req, res) => {
    const db = getDb();
    const { category } = req.query;
    let sql = 'SELECT * FROM notes';
    const params = [];
    
    if (category) {
        sql += ' WHERE category = ?';
        params.push(category);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const notes = db.prepare(sql).all(...params);
    res.json(notes);
});

// Create note
app.post('/api/notes', (req, res) => {
    const db = getDb();
    const { content, category, color } = req.body;
    
    const result = db.prepare(`
        INSERT INTO notes (content, category, color)
        VALUES (?, ?, ?)
    `).run(content, category || 'random', color || 'yellow');
    
    res.json({ id: result.lastInsertRowid, message: 'Note created' });
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    res.json({ message: 'Note deleted' });
});

// ==================== EVENTS API ====================

// Get all events
app.get('/api/events', (req, res) => {
    const db = getDb();
    const events = db.prepare(`
        SELECT e.*, p.name as project_name
        FROM events e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE date >= date('now')
        ORDER BY e.date ASC
        LIMIT 20
    `).all();
    res.json(events);
});

// Create event
app.post('/api/events', (req, res) => {
    const db = getDb();
    const { title, date, project_id, type, description } = req.body;
    
    const result = db.prepare(`
        INSERT INTO events (title, date, project_id, type, description)
        VALUES (?, ?, ?, ?, ?)
    `).run(title, date, project_id, type || 'event', description);
    
    res.json({ id: result.lastInsertRowid, message: 'Event created' });
});

// ==================== SETTINGS API ====================

// Get settings
app.get('/api/settings', (req, res) => {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.json(settingsObj);
});

// Update setting
app.put('/api/settings/:key', (req, res) => {
    const db = getDb();
    const { key } = req.params;
    const { value } = req.body;
    
    db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    
    res.json({ message: 'Setting updated' });
});

// ==================== FRONTEND ====================

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'MissionControl', 'public', 'index.html'));
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;

// Initialize database on startup
const { initDatabase } = require('./MissionControl/db/init');
initDatabase();

app.listen(PORT, () => {
    console.log(`🎯 Mission Control PRO running on port ${PORT}`);
});

module.exports = app;
