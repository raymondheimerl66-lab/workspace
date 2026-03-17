/**
 * Mission Control PRO - Frontend Application
 */

// Global state
let currentTab = 'dashboard';
let projects = [];
let tasks = [];
let notes = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModals();
    initQuickActions();
    loadAllData();
    
    // Auto refresh every 5 minutes
    setInterval(loadAllData, 5 * 60 * 1000);
});

// Tab Navigation
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            currentTab = targetTab;
            
            if (targetTab === 'tasks') loadTasks();
            if (targetTab === 'projects') loadProjects();
            if (targetTab === 'notes') loadNotes();
            if (targetTab === 'github') loadGitHub();
        });
    });
}

async function loadAllData() {
    await Promise.all([
        loadSystemHealth(),
        loadWeather(),
        loadProjects(),
        loadTasks(),
        loadNotes(),
        loadEvents(),
        loadGitHub()
    ]);
}

async function loadSystemHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        document.getElementById('system-status').textContent = 'Online';
        document.getElementById('system-status').className = 'status-indicator online';
        document.getElementById('sys-load').textContent = data.load || '--';
        document.getElementById('sys-memory').textContent = data.memory || '--';
        document.getElementById('sys-disk').textContent = data.disk || '--';
        document.getElementById('sys-uptime').textContent = data.uptime ? data.uptime.split(',')[0] : '--';
    } catch (error) {
        document.getElementById('system-status').textContent = 'Offline';
        document.getElementById('system-status').className = 'status-indicator offline';
    }
}

async function loadWeather() {
    try {
        const response = await fetch('/api/weather');
        const data = await response.json();
        
        document.querySelector('.weather-temp').textContent = `${data.temp}°C`;
        document.querySelector('.weather-widget i').className = getWeatherIcon(data.description);
    } catch (error) {
        console.error('Failed to load weather:', error);
    }
}

function getWeatherIcon(description) {
    const desc = (description || '').toLowerCase();
    if (desc.includes('sun') || desc.includes('clear')) return 'fas fa-sun';
    if (desc.includes('cloud')) return 'fas fa-cloud';
    if (desc.includes('rain')) return 'fas fa-cloud-rain';
    if (desc.includes('snow')) return 'fas fa-snowflake';
    if (desc.includes('thunder')) return 'fas fa-bolt';
    return 'fas fa-cloud-sun';
}

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        projects = await response.json();
        
        renderProjectsPreview();
        renderProjectsGrid();
        updateProjectSelects();
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

function renderProjectsPreview() {
    const container = document.getElementById('projects-preview');
    const activeProjects = projects.filter(p => p.status !== 'done').slice(0, 3);
    
    container.innerHTML = activeProjects.map(project => {
        const milestones = project.milestones || [];
        const completedMilestones = milestones.filter(m => m.done).length;
        const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <span class="project-name">${escapeHtml(project.name)}</span>
                    <span class="status-badge ${project.status}">${formatStatus(project.status)}</span>
                </div>
                <p class="project-description">${escapeHtml(project.description || '')}</p>
                <div class="project-meta">
                    <span>${project.task_count || 0} Tasks</span>
                    <span class="priority-badge p${project.priority}">${project.priority}</span>
                </div>
                ${milestones.length > 0 ? `
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${completedMilestones}/${milestones.length} Milestones</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') || '<div class="empty-state">Keine aktiven Projekte</div>';
}

function renderProjectsGrid() {
    const container = document.getElementById('projects-grid');
    
    container.innerHTML = projects.map(project => {
        const milestones = project.milestones || [];
        const completedMilestones = milestones.filter(m => m.done).length;
        const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
        const completedTasks = project.completed_tasks || 0;
        const totalTasks = project.task_count || 0;
        
        return `
            <div class="project-card">
                <div class="project-header">
                    <span class="project-name">${escapeHtml(project.name)}</span>
                    <span class="status-badge ${project.status}">${formatStatus(project.status)}</span>
                </div>
                <p class="project-description">${escapeHtml(project.description || '')}</p>
                <div class="project-meta">
                    <span><i class="fas fa-tasks"></i> ${completedTasks}/${totalTasks} Tasks</span>
                    <span class="priority-badge p${project.priority}">${project.priority}</span>
                </div>
                ${project.deadline ? `<div class="project-meta" style="margin-top: 8px;"><i class="fas fa-calendar"></i> Deadline: ${formatDate(project.deadline)}</div>` : ''}
                ${milestones.length > 0 ? `
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${completedMilestones}/${milestones.length} Milestones</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') || '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Keine Projekte vorhanden</p></div>';
}

function updateProjectSelects() {
    const selects = document.querySelectorAll('#task-project, #task-project-filter');
    selects.forEach(select => {
        const currentValue = select.value;
        const emptyOption = select.id === 'task-project' ? '<option value="">Kein Projekt</option>' : '<option value="">Alle Projekte</option>';
        select.innerHTML = emptyOption + projects.map(p => 
            `<option value="${p.id}">${escapeHtml(p.name)}</option>`
        ).join('');
        select.value = currentValue;
    });
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        
        renderTasks();
        renderDashboardTasks();
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

function renderTasks(filter = 'all') {
    const container = document.getElementById('tasks-list');
    const projectFilter = document.getElementById('task-project-filter')?.value;
    const statusFilter = document.getElementById('task-status-filter')?.value;
    const searchTerm = document.getElementById('task-search')?.value.toLowerCase();
    
    let filteredTasks = tasks;
    
    if (filter !== 'all') filteredTasks = filteredTasks.filter(t => t.status === filter);
    if (projectFilter) filteredTasks = filteredTasks.filter(t => t.project_id == projectFilter);
    if (statusFilter) filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    if (searchTerm) filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchTerm));
    
    container.innerHTML = filteredTasks.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-checkbox ${task.status === 'done' ? 'checked' : ''}" onclick="toggleTask(${task.id})">
                ${task.status === 'done' ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title ${task.status === 'done' ? 'done' : ''}">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    ${task.project_name ? `<span><i class="fas fa-folder"></i> ${escapeHtml(task.project_name)}</span>` : ''}
                    <span class="status-badge ${task.status}">${formatStatus(task.status)}</span>
                    <span class="priority-badge p${task.priority}">${task.priority}</span>
                    ${task.due_date ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.due_date)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn" onclick="editTask(${task.id})"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('') || '<div class="empty-state"><i class="fas fa-tasks"></i><p>Keine Tasks vorhanden</p></div>';
}

function renderDashboardTasks() {
    const container = document.getElementById('dashboard-tasks');
    const openTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);
    
    container.innerHTML = openTasks.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    ${task.project_name ? `<span>${escapeHtml(task.project_name)}</span>` : ''}
                    <span class="priority-badge p${task.priority}">${task.priority}</span>
                </div>
            </div>
        </div>
    `).join('') || '<div class="empty-state">Keine offenen Tasks</div>';
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        showToast(newStatus === 'done' ? 'Task erledigt!' : 'Task reaktiviert', 'success');
        loadTasks();
    } catch (error) {
        showToast('Fehler beim Aktualisieren', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Task wirklich löschen?')) return;
    
    try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        showToast('Task gelöscht', 'success');
        loadTasks();
    } catch (error) {
        showToast('Fehler beim Löschen', 'error');
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-project').value = task.project_id || '';
    document.getElementById('task-due-date').value = task.due_date || '';
    document.getElementById('task-modal-title').textContent = 'Task bearbeiten';
    
    openModal('task-modal');
}

async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

function renderNotes() {
    const container = document.getElementById('notes-board');
    
    container.innerHTML = notes.map(note => `
        <div class="note-card ${note.color}">
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-meta">
                <span class="note-category">${note.category}</span>
                <span>${formatDateTime(note.created_at)}</span>
            </div>
            <button class="note-delete" onclick="deleteNote(${note.id})"><i class="fas fa-times"></i></button>
        </div>
    `).join('') || '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>Keine Notizen vorhanden</p></div>';
}

async function deleteNote(id) {
    if (!confirm('Notiz wirklich löschen?')) return;
    
    try {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        showToast('Notiz gelöscht', 'success');
        loadNotes();
    } catch (error) {
        showToast('Fehler beim Löschen', 'error');
    }
}

async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        renderEvents(events);
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

function renderEvents(events) {
    const container = document.getElementById('events-list');
    
    container.innerHTML = events.slice(0, 5).map(event => {
        const date = new Date(event.date);
        return `
            <div class="event-item">
                <div class="event-date">
                    <span class="event-day">${date.getDate()}</span>
                    <span class="event-month">${date.toLocaleString('de', { month: 'short' })}</span>
                </div>
                <div class="event-content">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-meta">
                        ${event.project_name ? `<span><i class="fas fa-folder"></i> ${escapeHtml(event.project_name)}</span>` : ''}
                    </div>
                </div>
                <span class="event-type ${event.type}">${event.type}</span>
            </div>
        `;
    }).join('') || '<div class="empty-state">Keine anstehenden Events</div>';
}

async function loadGitHub() {
    try {
        const response = await fetch('/api/github');
        const data = await response.json();
        
        document.getElementById('github-repo').textContent = data.repo;
        
        const issuesContainer = document.getElementById('github-issues');
        issuesContainer.innerHTML = data.issues?.length ? data.issues.map(issue => `
            <div class="github-item issue">
                <i class="fas fa-exclamation-circle"></i>
                <div class="github-content">
                    <                    <div class="github-title"><a href="${issue.html_url}" target="_blank">${escapeHtml(issue.title)}</a></div>
                    <div class="github-meta">#${issue.number} von ${issue.user.login}</div>
                </div>
            </div>
        `).join('') : '<div class="empty-state">Keine offenen Issues</div>';
        
        const prsContainer = document.getElementById('github-prs');
        prsContainer.innerHTML = data.prs?.length ? data.prs.map(pr => `
            <div class="github-item pr">
                <i class="fas fa-code-branch"></i>
                <div class="github-content">
                    <div class="github-title"><a href="${pr.html_url}" target="_blank">${escapeHtml(pr.title)}</a></div>
                    <div class="github-meta">#${pr.number} von ${pr.user.login}</div>
                </div>
            </div>
        `).join('') : '<div class="empty-state">Keine offenen PRs</div>';
        
        const commitsContainer = document.getElementById('github-commits');
        commitsContainer.innerHTML = data.commits?.length ? data.commits.map(commit => `
            <div class="github-item commit">
                <i class="fas fa-code-commit"></i>
                <div class="github-content">
                    <div class="github-title"><a href="${commit.html_url}" target="_blank">${escapeHtml(commit.commit.message.split('\n')[0])}</a></div>
                    <div class="github-meta">${commit.author?.login || commit.commit.author.name} • ${formatDateTime(commit.commit.author.date)}</div>
                </div>
            </div>
        `).join('') : '<div class="empty-state">Keine Commits in den letzten 7 Tagen</div>';
    } catch (error) {
        console.error('Failed to load GitHub:', error);
    }
}

function initModals() {
    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const data = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            status: document.getElementById('task-status').value,
            priority: parseInt(document.getElementById('task-priority').value),
            project_id: document.getElementById('task-project').value || null,
            due_date: document.getElementById('task-due-date').value || null
        };
        
        try {
            if (id) {
                await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                showToast('Task aktualisiert', 'success');
            } else {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                showToast('Task erstellt', 'success');
            }
            closeModal('task-modal');
            loadTasks();
        } catch (error) {
            showToast('Fehler beim Speichern', 'error');
        }
    });
    
    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('project-id').value;
        const data = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            phase: document.getElementById('project-phase').value,
            status: document.getElementById('project-status').value,
            priority: parseInt(document.getElementById('project-priority').value),
            deadline: document.getElementById('project-deadline').value || null
        };
        
        try {
            if (id) {
                await fetch(`/api/projects/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                showToast('Projekt aktualisiert', 'success');
            } else {
                await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                showToast('Projekt erstellt', 'success');
            }
            closeModal('project-modal');
            loadProjects();
        } catch (error) {
            showToast('Fehler beim Speichern', 'error');
        }
    });
    
    document.getElementById('note-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            content: document.getElementById('note-content').value,
            category: document.getElementById('note-category').value,
            color: document.getElementById('note-color').value
        };
        
        try {
            await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            showToast('Notiz erstellt', 'success');
            closeModal('note-modal');
            document.getElementById('note-form').reset();
            loadNotes();
        } catch (error) {
            showToast('Fehler beim Speichern', 'error');
        }
    });
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        const idField = form.querySelector('input[type="hidden"]');
        if (idField) idField.value = '';
    }
}

function initQuickActions() {
    document.getElementById('add-task-quick').addEventListener('click', () => {
        document.getElementById('task-modal-title').textContent = 'Neuer Task';
        openModal('task-modal');
    });
    
    document.getElementById('add-note-quick').addEventListener('click', () => {
        openModal('note-modal');
    });
    
    document.getElementById('add-project-quick').addEventListener('click', () => {
        document.getElementById('project-modal-title').textContent = 'Neues Projekt';
        openModal('project-modal');
    });
    
    document.getElementById('add-event-quick').addEventListener('click', () => {
        showToast('Events können im Backend erstellt werden', 'success');
    });
    
    document.getElementById('add-task-btn').addEventListener('click', () => {
        document.getElementById('task-modal-title').textContent = 'Neuer Task';
        openModal('task-modal');
    });
    
    document.getElementById('add-project-btn').addEventListener('click', () => {
        document.getElementById('project-modal-title').textContent = 'Neues Projekt';
        openModal('project-modal');
    });
    
    document.getElementById('add-note-btn').addEventListener('click', () => {
        openModal('note-modal');
    });
    
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        const btn = document.getElementById('refresh-btn');
        btn.classList.add('spinning');
        
        await fetch('/api/update-dashboard', { method: 'POST' });
        await loadAllData();
        
        setTimeout(() => btn.classList.remove('spinning'), 500);
        showToast('Dashboard aktualisiert', 'success');
    });
    
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            document.querySelector(`[data-tab="${tab}"]`).click();
        });
    });
    
    document.querySelectorAll('#dashboard .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#dashboard .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    document.getElementById('task-search')?.addEventListener('input', () => renderTasks());
    document.getElementById('task-project-filter')?.addEventListener('change', () => renderTasks());
    document.getElementById('task-status-filter')?.addEventListener('change', () => renderTasks());
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatStatus(status) {
    const map = {
        'todo': 'Todo',
        'in_progress': 'In Progress',
        'done': 'Done',
        'blocked': 'Blocked',
        'not_started': 'Not Started'
    };
    return map[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
