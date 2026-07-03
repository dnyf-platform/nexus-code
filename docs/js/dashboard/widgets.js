class DashboardWidgets {
    constructor() {
        this.widgets = new Map();
        this.initialize();
    }

    initialize() {
        this.registerWidget('quick-actions', () => this.setupQuickActions());
        this.registerWidget('git-status', () => this.setupGitStatus());
        this.registerWidget('extensions', () => this.setupExtensions());
        
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-button');
            if (actionBtn) {
                this.executeQuickAction(actionBtn.dataset.action);
            }
        });
    }

    registerWidget(name, setupFn) {
        this.widgets.set(name, setupFn);
    }

    setupQuickActions() {
        console.log('Quick actions widget initialized');
    }

    setupGitStatus() {
        const gitInfo = document.getElementById('dashboard-git');
        if (gitInfo) {
            gitInfo.innerHTML = `
                <div class="git-info">
                    <span>📦 Branch: main</span>
                    <span>💬 Commits: 12</span>
                    <span>🔗 Remote: origin</span>
                </div>
                <div class="git-changes">
                    <span class="added">+3 Added</span>
                    <span class="modified">~1 Modified</span>
                    <span class="deleted">-0 Deleted</span>
                </div>
            `;
        }
    }

    setupExtensions() {
        const extensionsList = document.getElementById('extensions-list');
        if (extensionsList) {
            extensionsList.innerHTML = `
                <div class="extension-item">
                    <span>✨ Prettier</span>
                    <span class="extension-status active">Active</span>
                </div>
                <div class="extension-item">
                    <span>🎨 Theme Manager</span>
                    <span class="extension-status active">Active</span>
                </div>
                <div class="extension-item">
                    <span>📝 Emmet</span>
                    <span class="extension-status inactive">Inactive</span>
                </div>
                <div class="extension-item">
                    <span>🔄 Live Server</span>
                    <span class="extension-status inactive">Inactive</span>
                </div>
            `;
        }
    }

    executeQuickAction(action) {
        switch(action) {
            case 'format':
                window.eventBus.emit('editor:format');
                break;
            case 'lint':
                this.runLinter();
                break;
            case 'build':
                this.runBuild();
                break;
            case 'deploy':
                this.showNotification('Deploy feature coming soon!', 'info');
                break;
            case 'share':
                this.shareProject();
                break;
            case 'backup':
                this.createBackup();
                break;
        }
    }

    runLinter() {
        const content = window.state.get('editor.content') || '';
        const errors = [];
        
        if (content.includes('<html>') && !content.includes('<!DOCTYPE html>')) {
            errors.push('Missing DOCTYPE declaration');
        }
        
        window.eventBus.emit('problems:update', errors);
        this.showNotification(`Lint complete: ${errors.length} issues found`, errors.length ? 'warning' : 'success');
    }

    runBuild() {
        this.showNotification('Build started...', 'info');
        setTimeout(() => {
            this.showNotification('Build completed successfully!', 'success');
        }, 2000);
    }

    shareProject() {
        const files = window.state.get('workspace.files') || [];
        const projectData = JSON.stringify({ files, date: new Date().toISOString() });
        
        if (navigator.share) {
            navigator.share({
                title: 'NexusCode Project',
                text: projectData.substring(0, 100)
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(projectData);
            this.showNotification('Project data copied to clipboard', 'success');
        }
    }

    createBackup() {
        const backup = {
            files: window.state.get('workspace.files'),
            content: window.state.get('editor.content'),
            date: new Date().toISOString()
        };
        
        localStorage.setItem('nexuscode_backup', JSON.stringify(backup));
        this.showNotification('Backup created successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        window.eventBus.emit('notification:show', { message, type });
    }
}

window.dashboardWidgets = new DashboardWidgets();
