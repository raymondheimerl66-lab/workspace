const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const multer = require('multer');

const execAsync = promisify(exec);
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const DB_PATH = path.join(__dirname, 'db', 'database.sqlite');
let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

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

// Health Check
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
    const userSettings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get();
    
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    
    res.json({ ...settingsObj, ...userSettings });
});

// Update setting
app.put('/api/settings/:key', (req, res) => {
    const db = getDb();
    const { key } = req.params;
    const { value } = req.body;
    
    const userSettingColumns = ['theme', 'notifications_enabled', 'pomodoro_duration', 'break_duration', 'daily_goal_hours'];
    
    if (userSettingColumns.includes(key)) {
        db.prepare(`UPDATE user_settings SET ${key} = ? WHERE id = 1`).run(value);
    } else {
        db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(key, value);
    }
    
    res.json({ message: 'Setting updated' });
});

// ==================== TIME TRACKING API ====================

// Start timer for task
app.post('/api/tasks/:id/start-timer', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const now = new Date().toISOString();
    
    db.prepare(`
        UPDATE tasks 
        SET timer_started_at = ?
        WHERE id = ?
    `).run(now, id);
    
    res.json({ message: 'Timer started', started_at: now });
});

// Stop timer for task
app.post('/api/tasks/:id/stop-timer', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const task = db.prepare('SELECT timer_started_at, tracked_time FROM tasks WHERE id = ?').get(id);
    if (!task || !task.timer_started_at) {
        return res.status(400).json({ error: 'Timer not running' });
    }
    
    const startedAt = new Date(task.timer_started_at);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    const newTrackedTime = (task.tracked_time || 0) + elapsedSeconds;
    
    db.prepare(`
        UPDATE tasks 
        SET tracked_time = ?, timer_started_at = NULL
        WHERE id = ?
    `).run(newTrackedTime, id);
    
    res.json({ 
        message: 'Timer stopped', 
        elapsed_seconds: elapsedSeconds,
        total_tracked: newTrackedTime
    });
});

// Get time report
app.get('/api/time-report', (req, res) => {
    const db = getDb();
    const { period } = req.query;
    
    let sql;
    if (period === 'weekly') {
        sql = `
            SELECT 
                p.name as project_name,
                SUM(t.tracked_time) as total_seconds,
                COUNT(t.id) as task_count
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.updated_at >= date('now', '-7 days')
            GROUP BY t.project_id
            ORDER BY total_seconds DESC
        `;
    } else {
        sql = `
            SELECT 
                p.name as project_name,
                SUM(t.tracked_time) as total_seconds,
                COUNT(t.id) as task_count
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE date(t.updated_at) = date('now')
            GROUP BY t.project_id
            ORDER BY total_seconds DESC
        `;
    }
    
    const report = db.prepare(sql).all();
    
    const formatted = report.map(r => ({
        ...r,
        total_hours: Math.floor(r.total_seconds / 3600),
        total_minutes: Math.floor((r.total_seconds % 3600) / 60)
    }));
    
    res.json(formatted);
});

// ==================== HABITS API ====================

// Get all habits with today's status
app.get('/api/habits', (req, res) => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const habits = db.prepare(`
        SELECT h.*, 
               COALESCE(hl.completed, 0) as completed_today,
               (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND completed = 1) as total_completions
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
        ORDER BY h.created_at DESC
    `).all(today);
    
    res.json(habits);
});

// Create habit
app.post('/api/habits', (req, res) => {
    const db = getDb();
    const { name, color, icon } = req.body;
    
    const result = db.prepare(`
        INSERT INTO habits (name, color, icon)
        VALUES (?, ?, ?)
    `).run(name, color || '#3b82f6', icon || 'fa-check');
    
    res.json({ id: result.lastInsertRowid, message: 'Habit created' });
});

// Update habit
app.put('/api/habits/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { name, color, icon } = req.body;
    
    db.prepare(`
        UPDATE habits 
        SET name = COALESCE(?, name),
            color = COALESCE(?, color),
            icon = COALESCE(?, icon)
        WHERE id = ?
    `).run(name, color, icon, id);
    
    res.json({ message: 'Habit updated' });
});

// Delete habit
app.delete('/api/habits/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    res.json({ message: 'Habit deleted' });
});

// Toggle habit completion
app.post('/api/habits/:id/toggle', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const existing = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(id, today);
    
    if (existing) {
        db.prepare('DELETE FROM habit_logs WHERE id = ?').run(existing.id);
        res.json({ completed: false, message: 'Habit unchecked' });
    } else {
        db.prepare(`
            INSERT INTO habit_logs (habit_id, date, completed)
            VALUES (?, ?, 1)
        `).run(id, today);
        res.json({ completed: true, message: 'Habit completed' });
    }
});

// ==================== GOALS API ====================

// Get all goals
app.get('/api/goals', (req, res) => {
    const db = getDb();
    const goals = db.prepare(`
        SELECT g.*, p.name as project_name,
               (SELECT COUNT(*) FROM key_results WHERE goal_id = g.id) as kr_count,
               (SELECT COUNT(*) FROM key_results WHERE goal_id = g.id AND current >= target) as kr_completed
        FROM goals g
        LEFT JOIN projects p ON g.project_id = p.id
        ORDER BY g.year DESC, g.quarter DESC
    `).all();
    res.json(goals);
});

// Create goal
app.post('/api/goals', (req, res) => {
    const db = getDb();
    const { title, quarter, year, project_id } = req.body;
    
    const result = db.prepare(`
        INSERT INTO goals (title, quarter, year, project_id)
        VALUES (?, ?, ?, ?)
    `).run(title, quarter, year, project_id);
    
    res.json({ id: result.lastInsertRowid, message: 'Goal created' });
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { title, quarter, year, status, progress, project_id } = req.body;
    
    db.prepare(`
        UPDATE goals 
        SET title = COALESCE(?, title),
            quarter = COALESCE(?, quarter),
            year = COALESCE(?, year),
            status = COALESCE(?, status),
            progress = COALESCE(?, progress),
            project_id = COALESCE(?, project_id)
        WHERE id = ?
    `).run(title, quarter, year, status, progress, project_id, id);
    
    res.json({ message: 'Goal updated' });
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    res.json({ message: 'Goal deleted' });
});

// ==================== KEY RESULTS API ====================

// Get key results for a goal
app.get('/api/goals/:id/key-results', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const krs = db.prepare('SELECT * FROM key_results WHERE goal_id = ? ORDER BY created_at').all(id);
    res.json(krs);
});

// Create key result
app.post('/api/key-results', (req, res) => {
    const db = getDb();
    const { goal_id, title, target, current } = req.body;
    
    const result = db.prepare(`
        INSERT INTO key_results (goal_id, title, target, current)
        VALUES (?, ?, ?, ?)
    `).run(goal_id, title, target, current || 0);
    
    res.json({ id: result.lastInsertRowid, message: 'Key Result created' });
});

// Update key result
app.put('/api/key-results/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const { title, target, current } = req.body;
    
    db.prepare(`
        UPDATE key_results 
        SET title = COALESCE(?, title),
            target = COALESCE(?, target),
            current = COALESCE(?, current)
        WHERE id = ?
    `).run(title, target, current, id);
    
    res.json({ message: 'Key Result updated' });
});

// Delete key result
app.delete('/api/key-results/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM key_results WHERE id = ?').run(id);
    res.json({ message: 'Key Result deleted' });
});

// ==================== JOURNAL API ====================

// Get all journal entries
app.get('/api/journal', (req, res) => {
    const db = getDb();
    const entries = db.prepare(`
        SELECT * FROM journal
        ORDER BY date DESC
        LIMIT 50
    `).all();
    res.json(entries);
});

// Get journal entry for specific date
app.get('/api/journal/:date', (req, res) => {
    const db = getDb();
    const { date } = req.params;
    
    const entry = db.prepare('SELECT * FROM journal WHERE date = ?').get(date);
    res.json(entry || null);
});

// Create/update journal entry
app.post('/api/journal', (req, res) => {
    const db = getDb();
    const { date, content, mood, tags, tasks_completed, tasks_planned, blockers } = req.body;
    
    const existing = db.prepare('SELECT id FROM journal WHERE date = ?').get(date);
    
    if (existing) {
        db.prepare(`
            UPDATE journal 
            SET content = ?, mood = ?, tags = ?, tasks_completed = ?, tasks_planned = ?, blockers = ?
            WHERE date = ?
        `).run(content, mood, tags, tasks_completed, tasks_planned, blockers, date);
        res.json({ message: 'Journal entry updated' });
    } else {
        const result = db.prepare(`
            INSERT INTO journal (date, content, mood, tags, tasks_completed, tasks_planned, blockers)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(date, content, mood, tags, tasks_completed, tasks_planned, blockers);
        res.json({ id: result.lastInsertRowid, message: 'Journal entry created' });
    }
});

// Delete journal entry
app.delete('/api/journal/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM journal WHERE id = ?').run(id);
    res.json({ message: 'Journal entry deleted' });
});

// ==================== FILE UPLOAD API ====================

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
    const db = getDb();
    const { task_id } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = db.prepare(`
        INSERT INTO files (task_id, filename, original_name, path, size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        task_id || null,
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype
    );
    
    res.json({ 
        id: result.lastInsertRowid, 
        filename: req.file.filename,
        original_name: req.file.originalname,
        size: req.file.size,
        message: 'File uploaded' 
    });
});

// Get files for a task
app.get('/api/tasks/:id/files', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const files = db.prepare('SELECT * FROM files WHERE task_id = ? ORDER BY uploaded_at DESC').all(id);
    res.json(files);
});

// Download file
app.get('/api/files/:id/download', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(file.path, file.original_name);
});

// Delete file
app.delete('/api/files/:id', (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
    
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    res.json({ message: 'File deleted' });
});

// ==================== SEARCH API ====================

// Global search
app.get('/api/search', (req, res) => {
    const db = getDb();
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json({ tasks: [], projects: [], notes: [], files: [] });
    }
    
    const searchTerm = `%${q}%`;
    
    const tasks = db.prepare(`
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.title LIKE ? OR t.description LIKE ?
        ORDER BY t.created_at DESC
        LIMIT 10
    `).all(searchTerm, searchTerm);
    
    const projects = db.prepare(`
        SELECT * FROM projects 
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
    `).all(searchTerm, searchTerm);
    
    const notes = db.prepare(`
        SELECT * FROM notes 
        WHERE title LIKE ? OR content LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
    `).all(searchTerm, searchTerm);
    
    const files = db.prepare(`
        SELECT f.*, t.title as task_title 
        FROM files f 
        LEFT JOIN tasks t ON f.task_id = t.id
        WHERE f.original_name LIKE ?
        ORDER BY f.uploaded_at DESC
        LIMIT 10
    `).all(searchTerm);
    
    res.json({ tasks, projects, notes, files });
});

// ==================== DATA EXPORT API ====================

// Export tasks as JSON
app.get('/api/export/tasks', (req, res) => {
    const db = getDb();
    const tasks = db.prepare(`
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
    `).all();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
    res.json(tasks);
});

// Export tasks as CSV
app.get('/api/export/tasks/csv', (req, res) => {
    const db = getDb();
    const tasks = db.prepare(`
        SELECT t.*, p.name as project_name 
        FROM tasks t 
        LEFT JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at DESC
    `).all();
    
    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Project', 'Due Date', 'Tracked Time'];
    const rows = tasks.map(t => [
        t.id, 
        `"${(t.title || '').replace(/"/g, '""')}"`, 
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        `"${(t.project_name || '').replace(/"/g, '""')}"`,
        t.due_date || '',
        t.tracked_time || 0
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
    res.send(csv);
});

// Export projects as JSON
app.get('/api/export/projects', (req, res) => {
    const db = getDb();
    const projects = db.prepare(`
        SELECT p.*, 
               COUNT(t.id) as task_count,
               SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `).all();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="projects.json"');
    res.json(projects);
});

// ==================== FRONTEND ====================

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;

// Initialize database on startup
const { initDatabase } = require('./db/init');
initDatabase();

app.listen(PORT, () => {
    console.log(`🎯 Mission Control PRO running on port ${PORT}`);
});

module.exports = app;

