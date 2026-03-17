/**
 * Mission Control PRO - Dashboard 2.0
 * Professional Redesign with Dark Theme, Glassmorphism, and Enterprise Features
 */

// ============================================
// GLOBAL STATE
// ============================================
let state = {
    currentTab: 'dashboard',
    taskView: 'kanban',
    projects: [],
    tasks: [],
    notes: [],
    events: [],
    githubData: null,
    currentDate: new Date(),
    selectedDate: null,
    systemChart: null,
    systemHistory: { load: [], memory: [], labels: [] }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    setupKeyboardShortcuts();
    setupWelcomeMessage();
    await loadAllData();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        refreshSystemHealth();
        refreshGitHub();
    }, 30000);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
            e.preventDefault();
            showQuickAdd();
        }
        if (e.key === 'Escape') {
            closeAllModals();
        }
        if (e.metaKey || e.ctrlKey) {
            const tabMap = { '1': 'dashboard', '2': 'tasks', '3': 'projects', '4': 'calendar', '5': 'notes', '6': 'github' };
            if (tabMap[e.key]) {
                e.preventDefault();
                switchTab(tabMap[e.key]);
            }
        }
    });
}

function setupWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = 'Guten Morgen';
    if (hour >= 12) greeting = 'Guten Tag';
    if (hour >= 18) greeting = 'Guten Abend';
    document.getElementById('welcome-text').textContent = `${greeting}, Ray!`;
}

// ============================================
// DATA LOADING
// ============================================
async function loadAllData() {
    try {
        await Promise.all([
            loadSystemHealth(),
            loadWeather(),
            loadProjects(),
            loadTasks(),
            loadNotes(),
            loadEvents(),
            loadGitHub()
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Fehler beim Laden der Daten', 'error');
    }
}

async function refreshAll() {
    const btn = document.getElementById('refresh-btn');
    btn.classList.add('fa-spin');
    await loadAllData();
    setTimeout(() => btn.classList.remove('fa-spin'), 500);
    showToast('Dashboard aktualisiert', 'success');
}

async function loadSystemHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        document.getElementById('system-status-dot').className = 'status-dot status-online';
        document.getElementById('system-status-text').textContent = 'System Online';
        document.getElementById('sys-load').textContent = data.load || '--';
        document.getElementById('sys-memory').textContent = data.memory || '--';
        document.getElementById('sys-disk').textContent = data.disk || '--';
        document.getElementById('sys-uptime').textContent = formatUptime(data.uptime);
        
        updateSystemChart(data);
    } catch (error) {
        document.getElementById('system-status-dot').className = 'status-dot status-offline';
        document.getElementById('system-status-text').textContent = 'System Offline';
    }
}

async function refreshSystemHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        updateSystemChart(data);
    } catch (error) {
        console.error('System health refresh failed');
    }
}

async function loadWeather() {
    try {
        const response = await fetch('/api/weather');
        const data = await response.json();
        
        document.getElementById('weather-temp').textContent = `${Math.round(data.temp)}°`;
        document.getElementById('weather-desc').textContent = data.description;
        
        const iconMap = {
            'clear sky': 'fa-sun', 'few clouds': 'fa-cloud-sun', 'scattered clouds': 'fa-cloud',
            'broken clouds': 'fa-cloud', 'shower rain': 'fa-cloud-rain', 'rain': 'fa-cloud-rain',
            'thunderstorm': 'fa-bolt', 'snow': 'fa-snowflake', 'mist': 'fa-smog'
        };
        const icon = iconMap[data.description] || 'fa-cloud-sun';
        document.getElementById('weather-icon').className = `fas ${icon} text-xl text-blue-400`;
    } catch (error) {
        console.error('Weather load failed');
    }
}

async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        state.projects = await response.json();
        renderProjects();
        renderDashboardProjects();
        updateProjectSelects();
    } catch (error) {
        console.error('Projects load failed');
    }
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        state.tasks = await response.json();
        renderTasks();
        updateTaskCount();
        initKanbanDragDrop();
    } catch (error) {
        console.error('Tasks load failed');
    }
}

async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        state.notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Notes load failed');
    }
}

async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        state.events = await response.json();
        renderDashboardEvents();
        renderCalendar();
    } catch (error) {
        console.error('Events load failed');
    }
}

async function loadGitHub() {
    try {
        const response = await fetch('/api/github');
        state.githubData = await response.json();
        renderGitHub();
    } catch (error) {
        console.error('GitHub load failed');
    }
}

async function refreshGitHub() {
    try {
        const response = await fetch('/api/github');
        state.githubData = await response.json();
        renderGitHub();
    } catch (error) {
        console.error('GitHub refresh failed');
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function updateDashboardStats() {
    const openTasks = state.tasks.filter(t => t.status !== 'done').length;
    const activeProjects = state.projects.filter(p => p.status !== 'done').length;
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() + 7);
    const deadlines = state.tasks.filter(t => t.due_date && new Date(t.due_date) <= thisWeek && t.status !== 'done').length;
    const progress = state.tasks.length > 0 
        ? Math.round((state.tasks.filter(t => t.status === 'done').length / state.tasks.length) * 100) 
        : 0;
    
    document.getElementById('stat-open-tasks').textContent = openTasks;
    document.getElementById('stat-active-projects').textContent = activeProjects;
    document.getElementById('stat-deadlines').textContent = deadlines;
    document.getElementById('stat-progress').textContent = `${progress}%`;
    
    const badge = document.getElementById('nav-task-count');
    if (openTasks > 0) {
        badge.textContent = openTasks;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function updateTaskCount() {
    const openTasks = state.tasks.filter(t => t.status !== 'done').length;
    const badge = document.getElementById('nav-task-count');
    if (openTasks > 0) {
        badge.textContent = openTasks;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderDashboardProjects() {
    const container = document.getElementById('dashboard-projects');
    const active = state.projects.filter(p => p.status !== 'done').slice(0, 3);
    
    if (active.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-4">Keine aktiven Projekte</p>';
        return;
    }
    
    container.innerHTML = active.map(p => {
        const tasks = p.task_count || 0;
        const completed = p.completed_tasks || 0;
        const progress = tasks > 0 ? (completed / tasks) * 100 : 0;
        
        return `
            <div class="glass p-4 rounded-xl hover-lift cursor-pointer" onclick="switchTab('projects')">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-slate-200">${escapeHtml(p.name)}</h4>
                    <span class="px-2 py-0.5 text-xs rounded-full ${getStatusClass(p.status)}">${formatStatus(p.status)}</span>
                </div>
                <p class="text-sm text-slate-500 mb-3 line-clamp-1">${escapeHtml(p.description || '')}</p>
                <div class="flex items-center justify-between text-xs text-slate-400">
                    <span>${completed}/${tasks} Tasks</span>
                    <span>P${p.priority || 3}</span>
                </div>
                <div class="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderDashboardEvents() {
    const container = document.getElementById('dashboard-events');
    const upcoming = state.events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-4">Keine anstehenden Events</p>';
        return;
    }
    
    container.innerHTML = upcoming.map(e => {
        const date = new Date(e.date);
        return `
            <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div class="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-700">
                    <span class="text-lg font-bold text-blue-400">${date.getDate()}</span>
                    <span class="text-xs text-slate-500">${date.toLocaleString('de', { month: 'short' })}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-slate-200 truncate">${escapeHtml(e.title)}</h4>
                    <p class="text-xs text-slate-500">${e.project_name || 'Allgemein'}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded ${getEventTypeClass(e.type)}">${e.type}</span>
            </div>
        `;
    }).join('');
}

function renderProjects() {
    const container = document.getElementById('projects-grid');
    
    if (state.projects.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-8 col-span-full">Keine Projekte vorhanden</p>';
        return;
    }
    
    container.innerHTML = state.projects.map(p => {
        const tasks = p.task_count || 0;
        const completed = p.completed_tasks || 0;
        const progress = tasks > 0 ? (completed / tasks) * 100 : 0;
        
        return `
            <div class="glass-card p-6 rounded-xl hover-lift">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h3 class="font-semibold text-slate-200">${escapeHtml(p.name)}</h3>
                        ${p.phase ? `<span class="text-xs text-blue-400">${escapeHtml(p.phase)}</span>` : ''}
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(p.status)}">${formatStatus(p.status)}</span>
                </div>
                <p class="text-sm text-slate-500 mb-4 line-clamp-2">${escapeHtml(p.description || '')}</p>
                <div class="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span><i class="fas fa-tasks mr-1"></i>${completed}/${tasks} Tasks</span>
                    <span class="px-2 py-0.5 rounded bg-slate-700">P${p.priority || 3}</span>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width: ${progress}%"></div>
                </div>
                <div class="flex items-center justify-between text-xs text-slate-500">
                    ${p.deadline ? `<span><i class="fas fa-calendar mr-1"></i>${formatDate(p.deadline)}</span>` : '<span></span>'}
                    <button onclick="editProject(${p.id})" class="text-blue-400 hover:text-blue-300"><i class="fas fa-edit"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderTasks() {
    if (state.taskView === 'kanban') {
        renderKanbanView();
    } else {
        renderListView();
    }
}

function getFilteredTasks() {
    const search = document.getElementById('task-search')?.value.toLowerCase() || '';
    const projectFilter = document.getElementById('task-filter-project')?.value || '';
    const priorityFilter = document.getElementById('task-filter-priority')?.value || '';
    
    return state.tasks.filter(t => {
        if (search && !t.title.toLowerCase().includes(search)) return false;
        if (projectFilter && t.project_id != projectFilter) return false;
        if (priorityFilter && t.priority != priorityFilter) return false;
        return true;
    });
}

function renderKanbanView() {
    const statuses = ['todo', 'in_progress', 'done', 'blocked'];
    const filtered = getFilteredTasks();
    
    statuses.forEach(status => {
        const container = document.getElementById(`kanban-${status}`);
        const tasks = filtered.filter(t => t.status === status);
        
        document.getElementById(`count-${status}`).textContent = tasks.length;
        
        if (tasks.length === 0) {
            container.innerHTML = '<p class="text-slate-600 text-center py-8 text-sm">Keine Tasks</p>';
        } else {
            container.innerHTML = tasks.map(t => `
                <div class="kanban-card glass p-4 rounded-lg hover-lift" data-task-id="${t.id}">
                    <div class="flex items-start gap-3">
                        <div class="custom-checkbox ${t.status === 'done' ? 'checked' : ''}" onclick="toggleTask(${t.id})">
                            ${t.status === 'done' ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-sm text-slate-200 ${t.status === 'done' ? 'line-through text-slate-500' : ''}">${escapeHtml(t.title)}</h4>
                            ${t.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${escapeHtml(t.description)}</p>` : ''}
                            <div class="flex items-center gap-2 mt-2 flex-wrap">
                                ${t.project_name ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 truncate max-w-[100px]">${escapeHtml(t.project_name)}</span>` : ''}
                                <span class="text-xs px-2 py-0.5 rounded ${getPriorityClass(t.priority)}">P${t.priority}</span>
                                ${t.due_date ? `<span class="text-xs ${isOverdue(t.due_date) ? 'text-red-400' : 'text-slate-500'}"><i class="fas fa-clock mr-1"></i>${formatDateShort(t.due_date)}</span>` : ''}
                            </div>
                        </div>
                        <button onclick="editTask(${t.id})" class="text-slate-500 hover:text-slate-300"><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                </div>
            `).join('');
        }
    });
}

function renderListView() {
    const tbody = document.getElementById('tasks-table-body');
    const filtered = getFilteredTasks();
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Keine Tasks gefunden</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(t => `
        <tr class="hover:bg-white/5">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="custom-checkbox ${t.status === 'done' ? 'checked' : ''}" onclick="toggleTask(${t.id})">
                        ${t.status === 'done' ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                    </div>
                    <span class="${t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(t.title)}</span>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-400">${escapeHtml(t.project_name || '-')}</td>
            <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full ${getStatusClass(t.status)}">${formatStatus(t.status)}</span></td>
            <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded ${getPriorityClass(t.priority)}">P${t.priority}</span></td>
            <td class="px-4 py-3 text-sm ${isOverdue(t.due_date) ? 'text-red-400' : 'text-slate-400'}">${t.due_date ? formatDate(t.due_date) : '-'}</td>
            <td class="px-4 py-3">
                <button onclick="editTask(${t.id})" class="text-slate-500 hover:text-blue-400 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTask(${t.id})" class="text-slate-500 hover:text-red-400"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function initKanbanDragDrop() {
    const statuses = ['todo', 'in_progress', 'done', 'blocked'];
    statuses.forEach(status => {
        const container = document.getElementById(`kanban-${status}`);
        if (container && typeof Sortable !== 'undefined') {
            new Sortable(container, {
                group: 'kanban',
                animation: 150,
                ghostClass: 'dragging',
                dragClass: 'dragging',
                onEnd: function(evt) {
                    const taskId = evt.item.dataset.taskId;
                    const newStatus = evt.to.id.replace('kanban-', '');
                    if (taskId && newStatus) {
                        updateTaskStatus(taskId, newStatus);
                    }
                }
            });
        }
    });
}

function renderNotes() {
    const container = document.getElementById('notes-grid');
    
    if (state.notes.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-8 col-span-full">Keine Notizen vorhanden</p>';
        return;
    }
    
    const colorMap = {
        yellow: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/30',
        blue: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30',
        green: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30',
        pink: 'bg-gradient-to-br from-pink-500/20 to-rose-500/10 border-pink-500/30',
        purple: 'bg-gradient-to-br from-purple-500/20 to-violet-500/10 border-purple-500/30'
    };
    
    container.innerHTML = state.notes.map(n => `
        <div class="${colorMap[n.color] || colorMap.yellow} border rounded-xl p-5 hover-lift cursor-pointer" onclick="viewNote(${n.id})">
            <div class="flex items-start justify-between mb-3">
                <span class="text-xs uppercase tracking-wider text-slate-400">${n.category}</span>
                <button onclick="event.stopPropagation(); deleteNote(${n.id})" class="text-slate-500 hover:text-red-400 opacity-0 hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>
            </div>
            <h4 class="font-medium text-slate-200 mb-2">${escapeHtml(n.title)}</h4>
            <p class="text-sm text-slate-400 line-clamp-3">${escapeHtml(n.content.substring(0, 150))}${n.content.length > 150 ? '...' : ''}</p>
            <div class="mt-4 text-xs text-slate-500">${formatDateTime(n.created_at)}</div>
        </div>
    `).join('');
}

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    document.getElementById('calendar-month').textContent = 
        state.currentDate.toLocaleString('de', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday start
    
    const container = document.getElementById('calendar-grid');
    let html = '';
    
    // Padding days
    for (let i = 0; i < startPadding; i++) {
        html += '<div class="calendar-day opacity-30"></div>';
    }
    
    // Days
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const hasEvent = state.events.some(e => {
            const ed = new Date(e.date);
            return ed.toDateString() === date.toDateString();
        });
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" 
                 onclick="selectDate(${year}, ${month}, ${day})">
                <span class="text-sm">${day}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Show today's events by default
    if (!state.selectedDate) {
        selectDate(today.getFullYear(), today.getMonth(), today.getDate());
    }
}

function selectDate(year, month, day) {
    state.selectedDate = new Date(year, month, day);
    
    // Update visual selection
    document.querySelectorAll('.calendar-day').forEach(el => {
        el.style.background = '';
    });
    
    const selectedEl = Array.from(document.querySelectorAll('.calendar-day')).find(el => {
        const text = el.querySelector('span')?.textContent;
        return text == day && !el.classList.contains('opacity-30');
    });
    if (selectedEl) {
        selectedEl.style.background = 'rgba(59, 130, 246, 0.3)';
    }
    
    // Show events for selected date
    const events = state.events.filter(e => {
        const ed = new Date(e.date);
        return ed.toDateString() === state.selectedDate.toDateString();
    });
    
    const container = document.getElementById('selected-day-events');
    if (events.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center py-4">Keine Events an diesem Tag</p>';
    } else {
        container.innerHTML = events.map(e => `
            <div class="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                    <h4 class="font-medium text-slate-200">${escapeHtml(e.title)}</h4>
                    <p class="text-xs text-slate-500">${e.project_name || 'Allgemein'}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded ${getEventTypeClass(e.type)}">${e.type}</span>
            </div>
        `).join('');
    }
}

function changeMonth(delta) {
    state.currentDate.setMonth(state.currentDate.getMonth() + delta);
    renderCalendar();
}

function renderGitHub() {
    if (!state.githubData) return;
    
    document.getElementById('github-repo-name').textContent = state.githubData.repo || '';
    
    // Issues
    const issuesContainer = document.getElementById('github-issues');
    if (state.githubData.issues && state.githubData.issues.length > 0) {
        issuesContainer.innerHTML = state.githubData.issues.map(i => `
            <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer" onclick="window.open('${i.html_url}', '_blank')">
                <i class="fas fa-exclamation-circle text-green-400"></i>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm text-slate-200 truncate">${escapeHtml(i.title)}</h4>
                    <p class="text-xs text-slate-500">#${i.number} von ${i.user.login}</p>
                </div>
                <i class="fas fa-external-link-alt text-xs text-slate-600"></i>
            </div>
        `).join('');
    } else {
        issuesContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Keine offenen Issues</p>';
    }
    
    // PRs
    const prsContainer = document.getElementById('github-prs');
    if (state.githubData.prs && state.githubData.prs.length > 0) {
        prsContainer.innerHTML = state.githubData.prs.map(p => `
            <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer" onclick="window.open('${p.html_url}', '_blank')">
                <i class="fas fa-code-branch text-purple-400"></i>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm text-slate-200 truncate">${escapeHtml(p.title)}</h4>
                    <p class="text-xs text-slate-500">#${p.number} von ${p.user.login}</p>
                </div>
                <i class="fas fa-external-link-alt text-xs text-slate-600"></i>
            </div>
        `).join('');
    } else {
        prsContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Keine offenen PRs</p>';
    }
    
    // Commits
    const commitsContainer = document.getElementById('github-commits');
    if (state.githubData.commits && state.githubData.commits.length > 0) {
        commitsContainer.innerHTML = state.githubData.commits.slice(0, 10).map(c => `
            <div class="flex items-center gap-3 p-2 rounded hover:bg-slate-800/50 cursor-pointer" onclick="window.open('${c.html_url}', '_blank')">
                <i class="fas fa-code-commit text-slate-500 text-sm"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-300 truncate">${escapeHtml(c.commit.message.split('\n')[0])}</p>
                </div>
                <span class="text-xs text-slate-500">${c.author?.login || c.commit.author.name}</span>
            </div>
        `).join('');
    } else {
        commitsContainer.innerHTML = '<p class="text-slate-500 text-center py-4">Keine Commits</p>';
    }
}

// ============================================
// SYSTEM CHART
// ============================================
function updateSystemChart(data) {
    const ctx = document.getElementById('system-chart');
    if (!ctx) return;
    
    // Parse values
    const load = parseFloat(data.load) || 0;
    const mem = parseInt(data.memory) || 0;
    
    // Update history
    state.systemHistory.load.push(load);
    state.systemHistory.memory.push(mem);
    state.systemHistory.labels.push(new Date().toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' }));
    
    // Keep only last 20 points
    if (state.systemHistory.load.length > 20) {
        state.systemHistory.load.shift();
        state.systemHistory.memory.shift();
        state.systemHistory.labels.shift();
    }
    
    if (state.systemChart) {
        state.systemChart.data.labels = state.systemHistory.labels;
        state.systemChart.data.datasets[0].data = state.systemHistory.load;
        state.systemChart.data.datasets[1].data = state.systemHistory.memory;
        state.systemChart.update('none');
    } else {
        state.systemChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: state.systemHistory.labels,
                datasets: [
                    {
                        label: 'CPU Load',
                        data: state.systemHistory.load,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Memory %',
                        data: state.systemHistory.memory,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b', font: { size: 10 } }
                    }
                }
            }
        });
    }
}

// ============================================
// UI INTERACTIONS
// ============================================
function switchTab(tab) {
    state.currentTab = tab;
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active', 'bg-white/10', 'text-slate-100');
        el.classList.add('text-slate-400');
    });
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active', 'bg-white/10', 'text-slate-100');
    document.querySelector(`[data-tab="${tab}"]`)?.classList.remove('text-slate-400');
    
    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    
    // Update breadcrumbs
    const tabNames = {
        dashboard: 'Dashboard',
        tasks: 'Tasks',
        projects: 'Projekte',
        calendar: 'Kalender',
        notes: 'Notizen',
        github: 'GitHub'
    };
    document.getElementById('breadcrumbs').innerHTML = `<span class="text-slate-300">${tabNames[tab]}</span>`;
    
    // Refresh data if needed
    if (tab === 'tasks') renderTasks();
    if (tab === 'projects') renderProjects();
    if (tab === 'calendar') renderCalendar();
    if (tab === 'notes') renderNotes();
    if (tab === 'github') renderGitHub();
}

function setTaskView(view) {
    state.taskView = view;
    
    document.getElementById('view-kanban-btn').className = view === 'kanban' 
        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white'
        : 'px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5';
    
    document.getElementById('view-list-btn').className = view === 'list'
        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white'
        : 'px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5';
    
    document.getElementById('kanban-view').classList.toggle('hidden', view !== 'kanban');
    document.getElementById('list-view').classList.toggle('hidden', view !== 'list');
    
    renderTasks();
}

function filterTasks() {
    renderTasks();
}

function updateProjectSelects() {
    const selects = document.querySelectorAll('#task-project, #task-filter-project');
    selects.forEach(select => {
        const currentValue = select.value;
        const emptyOption = select.id === 'task-project' ? '<option value="">Kein Projekt</option>' : '<option value="">Alle Projekte</option>';
        select.innerHTML = emptyOption + state.projects.map(p => 
            `<option value="${p.id}">${escapeHtml(p.name)}</option>`
        ).join('');
        select.value = currentValue;
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openCommandPalette() {
    document.getElementById('command-palette').classList.add('active');
    document.getElementById('command-input').value = '';
    document.getElementById('command-input').focus();
    renderCommandResults('');
}

function closeCommandPalette(e) {
    if (!e || e.target.id === 'command-palette') {
        document.getElementById('command-palette').classList.remove('active');
    }
}

function searchCommand() {
    const query = document.getElementById('command-input').value.toLowerCase();
    renderCommandResults(query);
}

function renderCommandResults(query) {
    const container = document.getElementById('command-results');
    
    const commands = [
        { icon: 'fa-plus', text: 'Neuen Task erstellen', action: () => { closeCommandPalette(); openTaskModal(); } },
        { icon: 'fa-folder', text: 'Neues Projekt erstellen', action: () => { closeCommandPalette(); openProjectModal(); } },
        { icon: 'fa-sticky-note', text: 'Neue Notiz erstellen', action: () => { closeCommandPalette(); openNoteModal(); } },
        { icon: 'fa-sync', text: 'Dashboard aktualisieren', action: () => { closeCommandPalette(); refreshAll(); } },
        ...state.tasks.map(t => ({ icon: 'fa-check-circle', text: `Task: ${t.title}`, action: () => { closeCommandPalette(); switchTab('tasks'); } })),
        ...state.projects.map(p => ({ icon: 'fa-folder', text: `Projekt: ${p.name}`, action: () => { closeCommandPalette(); switchTab('projects'); } }))
    ];
    
    const filtered = commands.filter(c => c.text.toLowerCase().includes(query)).slice(0, 10);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="p-4 text-slate-500 text-center">Keine Ergebnisse</p>';
        return;
    }
    
    container.innerHTML = filtered.map((c, i) => `
        <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer ${i === 0 ? 'bg-white/5' : ''}" onclick="(${c.action.toString})()">
            <i class="fas ${c.icon} text-slate-400 w-5"></i>
            <span class="text-slate-200">${escapeHtml(c.text)}</span>
        </div>
    `).join('');
}

function showQuickAdd() {
    document.getElementById('quick-add-modal').classList.add('active');
}

function closeQuickAdd(e) {
    if (!e || e.target.id === 'quick-add-modal') {
        document.getElementById('quick-add-modal').classList.remove('active');
    }
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('task-modal-title');
    
    if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        title.textContent = 'Task bearbeiten';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-project').value = task.project_id || '';
        document.getElementById('task-due-date').value = task.due_date || '';
    } else {
        title.textContent = 'Neuer Task';
        form.reset();
        document.getElementById('task-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
}

function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('project-modal-title');
    
    if (projectId) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        title.textContent = 'Projekt bearbeiten';
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-status').value = project.status;
        document.getElementById('project-priority').value = project.priority;
        document.getElementById('project-phase').value = project.phase || '';
        document.getElementById('project-deadline').value = project.deadline || '';
    } else {
        title.textContent = 'Neues Projekt';
        form.reset();
        document.getElementById('project-id').value = '';
    }
    
    modal.classList.add('active');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

function openNoteModal() {
    document.getElementById('note-modal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('note-modal').classList.remove('active');
    document.getElementById('note-form').reset();
}

function closeAllModals() {
    closeCommandPalette();
    closeQuickAdd();
    closeTaskModal();
    closeProjectModal();
    closeNoteModal();
}

function viewNote(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    
    // Could open a view modal here
    showToast('Notiz: ' + note.title, 'success');
}

// ============================================
// CRUD OPERATIONS
// ============================================
async function saveTask(e) {
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
        closeTaskModal();
        await loadTasks();
    } catch (error) {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        showToast(newStatus === 'done' ? 'Task erledigt!' : 'Task reaktiviert', 'success');
        await loadTasks();
    } catch (error) {
        showToast('Fehler beim Aktualisieren', 'error');
    }
}

async function updateTaskStatus(id, newStatus) {
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        showToast(`Status geändert zu ${formatStatus(newStatus)}`, 'success');
        await loadTasks();
    } catch (error) {
        showToast('Fehler beim Verschieben', 'error');
    }
}

async function editTask(id) {
    openTaskModal(id);
}

async function deleteTask(id) {
    if (!confirm('Task wirklich löschen?')) return;
    
    try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        showToast('Task gelöscht', 'success');
        await loadTasks();
    } catch (error) {
        showToast('Fehler beim Löschen', 'error');
    }
}

async function saveProject(e) {
    e.preventDefault();
    
    const id = document.getElementById('project-id').value;
    const data = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        status: document.getElementById('project-status').value,
        priority: parseInt(document.getElementById('project-priority').value),
        phase: document.getElementById('project-phase').value,
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
        closeProjectModal();
        await loadProjects();
    } catch (error) {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function editProject(id) {
    openProjectModal(id);
}

async function saveNote(e) {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('note-title').value,
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
        closeNoteModal();
        await loadNotes();
    } catch (error) {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function deleteNote(id) {
    if (!confirm('Notiz wirklich löschen?')) return;
    
    try {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        showToast('Notiz gelöscht', 'success');
        await loadNotes();
    } catch (error) {
        showToast('Fehler beim Löschen', 'error');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `glass p-4 rounded-lg flex items-center gap-3 animate-slide-up ${type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`;
    toast.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle text-red-400' : 'fa-check-circle text-green-400'}"></i>
        <span class="text-slate-200">${escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
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

function getStatusClass(status) {
    const map = {
        'todo': 'bg-slate-600/30 text-slate-300',
        'in_progress': 'bg-blue-500/20 text-blue-400',
        'done': 'bg-green-500/20 text-green-400',
        'blocked': 'bg-red-500/20 text-red-400',
        'not_started': 'bg-slate-600/30 text-slate-400'
    };
    return map[status] || 'bg-slate-600/30 text-slate-300';
}

function getPriorityClass(priority) {
    const map = {
        1: 'bg-red-500/20 text-red-400',
        2: 'bg-orange-500/20 text-orange-400',
        3: 'bg-yellow-500/20 text-yellow-400',
        4: 'bg-slate-500/20 text-slate-400'
    };
    return map[priority] || 'bg-slate-500/20 text-slate-400';
}

function getEventTypeClass(type) {
    const map = {
        'event': 'bg-blue-500/20 text-blue-400',
        'deadline': 'bg-red-500/20 text-red-400',
        'milestone': 'bg-purple-500/20 text-purple-400'
    };
    return map[type] || 'bg-slate-500/20 text-slate-400';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('de-CH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatUptime(uptime) {
    if (!uptime) return '--';
    // Parse uptime string like "2 days, 5:30" or "5:30"
    const parts = uptime.split(',');
    if (parts.length > 1) {
        return parts[0].trim();
    }
    return uptime.split(':')[0] + 'h';
}

function isOverdue(dateString) {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
}
