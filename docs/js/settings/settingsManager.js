class SettingsManager {
    constructor() {
        this.modal = document.getElementById('settings-modal');
        this.settings = this.loadSettings();
        this.initialize();
    }

    initialize() {
        document.getElementById('btn-settings')?.addEventListener('click', () => this.show());
        document.getElementById('btn-close-settings')?.addEventListener('click', () => this.hide());
        
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });

        this.setupNavigation();
        this.setupEventListeners();
        this.loadSettingsIntoForm();
    }

    loadSettings() {
        const defaultSettings = {
            autoSave: 'afterDelay',
            autoSaveDelay: 1000,
            confirmClose: true,
            restoreSession: true,
            fontSize: 14,
            fontFamily: 'monospace',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            lineNumbers: 'on',
            minimap: true,
            theme: 'dark',
            iconTheme: 'seti',
            layout: 'default',
            shell: 'bash',
            terminalFontSize: 13,
            gitEnabled: true,
            gitAutoFetch: true,
            experimental: false
        };

        try {
            const stored = localStorage.getItem('nexuscode_settings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('nexuscode_settings', JSON.stringify(this.settings));
        window.eventBus.emit('settings:changed', this.settings);
    }

    setupNavigation() {
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                const panelId = `settings-${item.dataset.section}`;
                document.getElementById(panelId)?.classList.add('active');
            });
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.setting-item input, .setting-item select').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.id.replace('setting-', '').replace(/-/g, '');
                let value = e.target.value;
                
                if (e.target.type === 'checkbox') {
                    value = e.target.checked;
                } else if (e.target.type === 'number') {
                    value = parseInt(value);
                }
                
                this.settings[id] = value;
                this.saveSettings();
                this.applySetting(id, value);
            });
        });

        document.getElementById('btn-reset-settings')?.addEventListener('click', () => {
            if (confirm('Reset all settings to default?')) {
                localStorage.removeItem('nexuscode_settings');
                this.settings = this.loadSettings();
                this.loadSettingsIntoForm();
                window.eventBus.emit('settings:reset');
            }
        });
    }

    loadSettingsIntoForm() {
        Object.entries(this.settings).forEach(([key, value]) => {
            const element = document.getElementById(`setting-${key}`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }

    applySetting(key, value) {
        switch(key) {
            case 'theme':
                document.documentElement.setAttribute('data-theme', value);
                break;
            case 'fontSize':
                document.documentElement.style.setProperty('--font-size', `${value}px`);
                break;
            case 'minimap':
                const minimap = document.getElementById('editor-minimap');
                if (minimap) minimap.style.display = value ? 'block' : 'none';
                break;
            case 'autoSave':
                window.eventBus.emit('autosave:changed', value);
                break;
        }
    }

    show() {
        this.modal?.classList.add('active');
    }

    hide() {
        this.modal?.classList.remove('active');
    }
}

window.settingsManager = new SettingsManager();
