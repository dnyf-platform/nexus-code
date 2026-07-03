class RecentProjects {
    constructor() {
        this.storageKey = 'nexuscode_recent_projects';
        this.maxProjects = 10;
        this.projects = this.loadProjects();
    }

    loadProjects() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const projects = JSON.parse(stored);
                return Array.isArray(projects) ? projects : [];
            }
        } catch (error) {
            console.error('Failed to load recent projects:', error);
        }
        return [];
    }

    saveProjects() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
        } catch (error) {
            console.error('Failed to save recent projects:', error);
        }
    }

    addProject(project) {
        const existingIndex = this.projects.findIndex(p => p.id === project.id);
        
        if (existingIndex >= 0) {
            this.projects.splice(existingIndex, 1);
        }
        
        this.projects.unshift({
            ...project,
            lastOpened: new Date().toISOString()
        });
        
        if (this.projects.length > this.maxProjects) {
            this.projects = this.projects.slice(0, this.maxProjects);
        }
        
        this.saveProjects();
        window.eventBus.emit('projects:updated', this.projects);
    }

    removeProject(projectId) {
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.saveProjects();
        window.eventBus.emit('projects:updated', this.projects);
    }

    getRecentProjects() {
        return [...this.projects];
    }

    clearAll() {
        this.projects = [];
        this.saveProjects();
        window.eventBus.emit('projects:updated', []);
    }

    getProject(projectId) {
        return this.projects.find(p => p.id === projectId);
    }
}

window.recentProjects = new RecentProjects();