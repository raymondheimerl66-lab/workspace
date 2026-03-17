/**
 * Mission Control PRO - Mobile + Features Upgrade
 */

const state = {
    currentTab: 'dashboard',
    projects: [], tasks: [], notes: [], habits: [], goals: [],
    pomodoro: { running: false, time: 1500, initialTime: 1500, interval: null, cycles: 0 },
    settings: {}
};

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupKeyboardShortcuts();
    setupTouchGestures();
    setupWelcomeMessage();
    loadAllData();
});

function setupTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = theme;
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        if (e.key === 'Escape') closeAllModals();
    });
}

function setupTouchGestures() {
    let startX = 0;
    const content = document.getElementById('content-area');
    content.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    content.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        const tabs = ['dashboard', 'tasks', 'habits', 'journal', 'settings'];
        const idx = tabs.indexOf(state.currentTab);
        if (Math.abs(diff) > 100) {
            if (diff > 0 && idx < tabs.length - 1) switchTab(tabs[idx + 1]);
            else if (diff < 0 && idx > 0) switchTab(tabs[idx - 1]);
        }
    }, { passive: true });
}

function setupWelcomeMessage() {
    const h = new Date().getHours();
    let g = 'Guten Morgen';
    if (h >= 12) g = 'Guten Tag';
    if (h >= 18) g = 'Guten Abend';
    const el = document.getElementById('welcome-text');
    if (el) el.textContent = `${g}, Ray!`;
}

async function loadAllData() {
    await Promise.all([loadProjects(), loadTasks(), loadHabits(), loadGoals(), loadNotes()]);
    updateDashboardStats();
}

async function refreshAll() {
    const btn = document.getElementById('refresh-btn');
    if (btn) btn.classList.add('fa-spin');
    await loadAllData();
    setTimeout(() => btn?.classList.remove('fa-spin'), 500);
    showToast('Aktualisiert', 'success');
}

async function loadProjects() {
    const r = await fetch('/api/projects');
    state.projects = await r.json();
    renderProjects();
    renderDashboardProjects();
    updateProjectSelects();
}

async function loadTasks() {
    const r = await fetch('/api/tasks');
    state.tasks = await r.json();
    renderTasks();
    updateTaskCount();
}

async function loadHabits() {
    const r = await fetch('/api/habits');
    state.habits = await r.json();
    renderHabits();
    renderDashboardHabits();
}

async function loadGoals() {
    const r = await fetch('/api/goals');
    state.goals = await r.json();
    renderGoals();
}

async function loadNotes() {
    const r = await fetch('/api/notes');
    state.notes = await r.json();
    renderNotes();
}

function updateDashboardStats() {
    const open = state.tasks.filter(t => t.status !== 'done').length;
    const active = state.projects.filter(p => p.status !== 'done').length;
    const seconds = state.tasks.reduce((a, t) => a + (t.tracked_time || 0), 0);
    document.getElementById('stat-open-tasks').textContent = open;
    document.getElementById('stat-active-projects').textContent = active;
    document.getElementById('stat-focus-time').textContent = `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    document.getElementById('stat-habits').textContent = `${state.habits.filter(h => h.completed_today).length}/${state.habits.length}`;
}

function renderDashboardProjects() {
    const c = document.getElementById('dashboard-projects');
    if (!c) return;
    const active = state.projects.filter(p => p.status !== 'done').slice(0, 3);
    c.innerHTML = active.length ? active.map(p => {
        const completed = p.completed_tasks || 0;
        const total = p.task_count || 0;
        const prog = total > 0 ? (completed / total) * 100 : 0;
        return `<div class="glass p-4 rounded-xl" onclick="switchTab('projects')"><div class="flex justify-between mb-2"><h4 class="font-medium">${esc(p.name)}</h4></div><div class="text-xs text-slate-500 mb-2">${completed}/${total} Tasks</div><div class="h-1.5 bg-slate-700 rounded-full"><div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width:${prog}%"></div></div></div>`;
    }).join('') : '<p class="text-slate-500 text-center py-4">Keine aktiven Projekte</p>';
}

function renderDashboardHabits() {
    const c = document.getElementById('dashboard-habits');
    if (!c) return;
    c.innerHTML = state.habits.slice(0, 5).map(h => `
        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50" onclick="toggleHabit(${h.id})">
            <div class="custom-checkbox ${h.completed_today ? 'checked' : ''}">${h.completed_today ? '<i class="fas fa-check text-white text-xs"></i>' : ''}</div>
            <div class="flex-1"><div class="font-medium text-sm">${esc(h.name)}</div></div>
            <div class="text-xs text-slate-500">${h.total_completions}x</div>
        </div>
    `).join('');
}

function renderProjects() {
    const c = document.getElementById('projects-grid');
    if (!c) return;
    c.innerHTML = state.projects.map(p => {
        const completed = p.completed_tasks || 0;
        const total = p.task_count || 0;
        const prog = total > 0 ? (completed / total) * 100 : 0;
        return `<div class="glass-card p-5 rounded-xl"><div class="flex justify-between mb-3"><h3 class="font-semibold">${esc(p.name)}</h3><span class="px-2 py-1 text-xs rounded-full ${getStatusClass(p.status)}">${fmtStatus(p.status)}</span></div><p class="text-sm text-slate-500 mb-4">${esc(p.description || '')}</p><div class="flex justify-between text-xs text-slate-400 mb-3"><span>${completed}/${total} Tasks</span><span>P${p.priority || 3}</span></div><div class="h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width:${prog}%"></div></div></div>`;
    }).join('');
}

function renderTasks() {
    ['todo', 'in_progress', 'done', 'blocked'].forEach(status => {
        const c = document.getElementById(`kanban-${status}`);
        if (!c) return;
        const tasks = state.tasks.filter(t => t.status === status);
        document.getElementById(`count-${status}`).textContent = tasks.length;
        c.innerHTML = tasks.length ? tasks.map(t => `
            <div class="kanban-card glass p-4 rounded-lg" data-task-id="${t.id}" onclick="editTask(${t.id})">
                <div class="flex items-start gap-3">
                    <div class="custom-checkbox ${t.status === 'done' ? 'checked' : ''}" onclick="event.stopPropagation();toggleTask(${t.id})">${t.status === 'done' ? '<i class="fas fa-check text-white text-xs"></i>' : ''}</div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-sm ${t.status === 'done' ? 'line-through text-slate-500' : ''}">${esc(t.title)}</h4>
                        ${t.tracked_time ? `<div class="text-xs text-slate-500 mt-1"><i class="fas fa-clock mr-1"></i>${fmtTime(t.tracked_time)}</div>` : ''}
                        <div class="flex gap-2 mt-2 flex-wrap">
                            ${t.project_name ? `<span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">${esc(t.project_name)}</span>` : ''}
                            <span class="text-xs px-2 py-0.5 rounded ${getPriorityClass(t.priority)}">P${t.priority}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="text-slate-600 text-center py-8 text-sm">Keine Tasks</p>';
    });
}

function renderHabits() {
    const c = document.getElementById('habits-list');
    if (!c) return;
    c.innerHTML = state.habits.map(h => `
        <div class="glass-card p-4 rounded-xl flex items-center gap-4">
            <button onclick="toggleHabit(${h.id})" class="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style="background:${h.color}20;color:${h.color}">
                ${h.completed_today ? '<i class="fas fa-check"></i>' : `<i class="fas ${h.icon || 'fa-check'}"></i>`}
            </button>
            <div class="flex-1">
                <div class="font-medium">${esc(h.name)}</div>
                <div class="text-xs text-slate-500">${h.total_completions} completions</div>
            </div>
        </div>
    `).join('');
}

function renderGoals() {
    const c = document.getElementById('goals-list');
    if (!c) return;
    c.innerHTML = state.goals.map(g => {
        const prog = g.kr_count > 0 ? (g.kr_completed / g.kr_count) * 100 : 0;
        return `<div class="glass-card p-5 rounded-xl"><div class="flex justify-between mb-3"><h3 class="font-semibold">${esc(g.title)}</h3><span class="text-sm text-slate-400">${g.quarter} ${g.year}</span></div><div class="flex justify-between text-sm text-slate-400 mb-3"><span>${g.kr_completed}/${g.kr_count} Key Results</span><span>${Math.round(prog)}%</span></div><div class="h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style="width:${prog}%"></div></div></div>`;
    }).join('');
}

function renderNotes() {
    const c = document.getElementById('notes-grid');
    if (!c) return;
    const colors = { yellow: 'from-amber-500/20 to-yellow-500/10', blue: 'from-blue-500/20 to-cyan-500/10', green: 'from-green-500/20 to-emerald-500/10', pink: 'from-pink-500/20 to-rose-500/10', purple: 'from-purple-500/20 to-violet-500/10' };
    c.innerHTML = state.notes.map(n => `<div class="bg-gradient-to-br ${colors[n.color] || colors.yellow} border border-white/10 rounded-xl p-5"><div class="flex justify-between mb-3"><span class="text-xs uppercase text-slate-400">${n.category}</span><button onclick="deleteNote(${n.id})" class="text-slate-500"><i class="fas fa-times"></i></button></div><h4 class="font-medium mb-2">${esc(n.title || 'Notiz')}</h4><p class="text-sm text-slate-400 line-clamp-3">${esc(n.content?.substring(0, 100) || '')}</p></div>`).join('');
}

function renderCalendar() {
    const y = state.currentDate.getFullYear();
    const m = state.currentDate.getMonth();
    document.getElementById('calendar-month').textContent = state.currentDate.toLocaleString('de', { month: 'long', year: 'numeric' });
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const pad = (first.getDay() + 6) % 7;
    let html = '';
    for (let i = 0; i < pad; i++) html += '<div class="calendar-day opacity-30"></div>';
    const today = new Date();
    for (let d = 1; d <= last.getDate(); d++) {
        const isToday = new Date(y, m, d).toDateString() === today.toDateString();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">${d}</div>`;
    }
    document.getElementById('calendar-grid').innerHTML = html;
}

function changeMonth(d) {
    state.currentDate.setMonth(state.currentDate.getMonth() + d);
    renderCalendar();
}

function openPomodoro() {
    document.getElementById('pomodoro-overlay').classList.add('active');
    updatePomodoroDisplay();
}

function closePomodoro() {
    document.getElementById('pomodoro-overlay').classList.remove('active');
}

function togglePomodoro() {
    if (state.pomodoro.running) {
        clearInterval(state.pomodoro.interval);
        state.pomodoro.running = false;
        document.getElementById('pomodoro-play-icon').className = 'fas fa-play';
    } else {
        state.pomodoro.running = true;
        document.getElementById('pomodoro-play-icon').className = 'fas fa-pause';
        state.pomodoro.interval = setInterval(() => {
            if (state.pomodoro.time > 0) {
                state.pomodoro.time--;
                updatePomodoroDisplay();
            } else {
                completePomodoro();
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(state.pomodoro.interval);
    state.pomodoro.running = false;
    state.pomodoro.time = state.pomodoro.initialTime;
    document.getElementById('pomodoro-play-icon').className = 'fas fa-play';
    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const m = Math.floor(state.pomodoro.time / 60).toString().padStart(2, '0');
    const s = (state.pomodoro.time % 60).toString().padStart(2, '0');
    document.getElementById('pomodoro-time').textContent = `${m}:${s}`;
    const prog = ((state.pomodoro.initialTime - state.pomodoro.time) / state.pomodoro.initialTime) * 100;
    document.getElementById('pomodoro-progress').style.setProperty('--progress', `${prog}%`);
}

function completePomodoro() {
    clearInterval(state.pomodoro.interval);
    state.pomodoro.running = false;
    state.pomodoro.cycles++;
    document.getElementById('pomodoro-cycles').textContent = state.pomodoro.cycles;
    document.getElementById('pomodoro-play-icon').className = 'fas fa-play';
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    showToast('Pomodoro completed!', 'success');
}

function switchTab(tab) {
    state.currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active', 'bg-white/
function updateTaskCount() {
    const open = state.tasks.filter(t => t.status !== "done").length;
    const b = document.getElementById("nav-task-count");
    if (b) {
        b.textContent = open;
        b.classList.toggle("hidden", open === 0);
    }
}

async function loadJournalEntry() {
    const date = document.getElementById("journal-date").value;
    const r = await fetch(`/api/journal/${date}`);
    const entry = await r.json();
    if (entry) {
        document.getElementById("journal-content").value = entry.content || "";
        document.getElementById("journal-mood").value = entry.mood || "";
        document.getElementById("journal-tags").value = entry.tags || "";
        document.getElementById("journal-completed").value = entry.tasks_completed || "";
        document.getElementById("journal-planned").value = entry.tasks_planned || "";
        document.getElementById("journal-blockers").value = entry.blockers || "";
    }
}

function filterTasks() {
    renderTasks();
}

function getFilteredTasks() {
    const search = document.getElementById("task-search")?.value.toLowerCase() || "";
    const projectFilter = document.getElementById("task-filter-project")?.value || "";
    return state.tasks.filter(t => {
        if (search && !t.title.toLowerCase().includes(search)) return false;
        if (projectFilter && t.project_id != projectFilter) return false;
        return true;
    });
}
