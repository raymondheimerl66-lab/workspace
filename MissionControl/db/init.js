const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'database.sqlite');
const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
function initDatabase() {
    console.log('🗄️  Initializing database...');
    
    const db = new Database(DB_PATH);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Execute schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    
    console.log('✅ Database initialized');
    
    // Insert sample data if tables are empty
    insertSampleData(db);
    
    db.close();
}

function insertSampleData(db) {
    // Check if we already have data
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    if (taskCount.count > 0) {
        console.log('📦 Sample data already exists');
        return;
    }
    
    console.log('🌱 Inserting sample data...');
    
    // Sample Projects
    const projects = [
        {
            name: 'Therapeuten-Plattform CH',
            description: 'Plattform für Therapeuten in der Schweiz',
            phase: 'M1: Foundation',
            status: 'in_progress',
            priority: 1,
            deadline: '2026-04-30',
            milestones: JSON.stringify([
                { name: 'M1.1 Konzept', done: true },
                { name: 'M1.2 Domain/Hosting', done: true },
                { name: 'M1.3 MVP Setup', done: false },
                { name: 'M1.4 Launch', done: false }
            ])
        },
        {
            name: 'cal.com Evaluation',
            description: 'Evaluation von cal.com für Terminbuchung',
            phase: 'Research',
            status: 'not_started',
            priority: 2,
            deadline: '2026-03-31',
            milestones: JSON.stringify([
                { name: 'Hosting-Kosten vergleichen', done: false },
                { name: 'DSGVO-Check', done: false },
                { name: 'Entscheidung', done: false }
            ])
        },
        {
            name: 'Mission Control PRO',
            description: 'Das Dashboard für alle Projekte',
            phase: 'Live',
            status: 'in_progress',
            priority: 1,
            milestones: JSON.stringify([
                { name: 'SQLite Setup', done: true },
                { name: 'API Endpoints', done: true },
                { name: 'Frontend', done: true },
                { name: 'GitHub Integration', done: false }
            ])
        }
    ];
    
    const insertProject = db.prepare(`
        INSERT INTO projects (name, description, phase, status, priority, deadline, milestones_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    projects.forEach(p => insertProject.run(p.name, p.description, p.phase, p.status, p.priority, p.deadline, p.milestones));
    
    // Sample Tasks
    const tasks = [
        { title: 'SQLite Schema erstellen', status: 'done', priority: 1, project_id: 3 },
        { title: 'API Endpoints bauen', status: 'done', priority: 1, project_id: 3 },
        { title: 'Frontend Dashboard designen', status: 'done', priority: 1, project_id: 3 },
        { title: 'GitHub Integration implementieren', status: 'in_progress', priority: 2, project_id: 3 },
        { title: 'Therapeuten-Plattform: Domain registrieren', status: 'done', priority: 1, project_id: 1 },
        { title: 'Therapeuten-Plattform: Hosting einrichten', status: 'in_progress', priority: 1, project_id: 1 },
        { title: 'cal.com: Self-host vs SaaS vergleichen', status: 'todo', priority: 3, project_id: 2 },
        { title: 'Weekly Review durchführen', status: 'todo', priority: 2, project_id: null }
    ];
    
    const insertTask = db.prepare(`
        INSERT INTO tasks (title, status, priority, project_id)
        VALUES (@title, @status, @priority, @project_id)
    `);
    
    tasks.forEach(t => insertTask.run(t));
    
    // Sample Notes
    const notes = [
        { content: 'Dashboard sollte Dark Mode haben 🌙', category: 'ideas', color: 'blue' },
        { content: 'Meeting mit HP Partner: Q2 Ziele besprochen', category: 'meeting', color: 'yellow' },
        { content: 'FontAwesome Icons für bessere UI', category: 'ideas', color: 'green' },
        { content: 'Railway Deployment läuft stabil ✅', category: 'random', color: 'pink' }
    ];
    
    const insertNote = db.prepare(`
        INSERT INTO notes (content, category, color)
        VALUES (@content, @category, @color)
    `);
    
    notes.forEach(n => insertNote.run(n));
    
    // Sample Events
    const events = [
        { title: 'M1.2 Review Therapeuten-Plattform', date: '2026-03-20T10:00:00', project_id: 1, type: 'milestone' },
        { title: 'cal.com Entscheidung', date: '2026-03-31T17:00:00', project_id: 2, type: 'deadline' },
        { title: 'Weekly Review', date: '2026-03-21T09:00:00', project_id: null, type: 'event' }
    ];
    
    const insertEvent = db.prepare(`
        INSERT INTO events (title, date, project_id, type)
        VALUES (@title, @date, @project_id, @type)
    `);
    
    events.forEach(e => insertEvent.run(e));
    
    // Default Settings
    const settings = [
        { key: 'github_repo', value: 'Rayze64/therapeuten-plattform' },
        { key: 'ics_url', value: '' },
        { key: 'weather_location', value: 'Luzern,CH' },
        { key: 'theme', value: 'dark' }
    ];
    
    const insertSetting = db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (@key, @value)
    `);
    
    settings.forEach(s => insertSetting.run(s));
    
    console.log('✅ Sample data inserted');
}

// Run if called directly
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase, DB_PATH };