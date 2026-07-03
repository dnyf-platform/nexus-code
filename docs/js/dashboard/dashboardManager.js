class DashboardManager {
    constructor() {
        this.dashboardModal = document.getElementById('dashboard-modal');
        this.initialize();
    }

    initialize() {
        document.getElementById('btn-dashboard')?.addEventListener('click', () => this.toggle());
        document.getElementById('btn-close-dashboard')?.addEventListener('click', () => this.hide());
        
        this.dashboardModal?.addEventListener('click', (e) => {
            if (e.target === this.dashboardModal) this.hide();
        });

        this.setupActivityTracking();
        this.updateStats();
        
        setInterval(() => this.updatePerformanceMetrics(), 5000);
    }

    toggle() {
        this.dashboardModal?.classList.toggle('active');
        if (this.dashboardModal?.classList.contains('active')) {
            this.updateStats();
            this.loadRecentActivity();
        }
    }

    hide() {
        this.dashboardModal?.classList.remove('active');
    }

    updateStats() {
        const files = window.state.get('workspace.files') || [];
        const content = window.state.get('editor.content') || '';
        
        document.getElementById('stat-files').textContent = files.length;
        document.getElementById('stat-lines').textContent = content.split('\n').length;
        document.getElementById('stat-size').textContent = this.formatSize(new Blob([content]).size);
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        const activities = this.getRecentActivities();
        activityList.innerHTML = activities.map(a => `
            <div class="activity-item">
                <span>${a.action}</span>
                <span class="activity-time">${a.time}</span>
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = JSON.parse(localStorage.getItem('nexuscode_activities') || '[]');
        return activities.slice(0, 10);
    }

    setupActivityTracking() {
        window.eventBus.on('file:saved', (fileName) => {
            this.logActivity(`Saved ${fileName}`);
        });
        
        window.eventBus.on('file:created', (fileName) => {
            this.logActivity(`Created ${fileName}`);
        });
        
        window.eventBus.on('app:ready', () => {
            this.logActivity('IDE Started');
        });
    }

    logActivity(action) {
        const activities = JSON.parse(localStorage.getItem('nexuscode_activities') || '[]');
        activities.unshift({
            action,
            time: new Date().toLocaleTimeString()
        });
        
        if (activities.length > 50) activities.pop();
        localStorage.setItem('nexuscode_activities', JSON.stringify(activities));
    }

    updatePerformanceMetrics() {
        if (performance.memory) {
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(1);
            console.log(`Memory: ${used}MB / ${total}MB`);
        }
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
}

window.dashboardManager = new DashboardManager();
