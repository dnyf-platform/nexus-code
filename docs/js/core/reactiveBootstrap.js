// =====================================================
// NexusCode Studio IDE - Bootstrap
// Initializes all modules in correct order
// =====================================================

class ReactiveBootstrap {
    constructor() {
        this.modules = [];
        this.initialized = false;
        this.initAttempts = 0;
        this.maxAttempts = 10;
    }

    async initialize() {
        if (this.initialized) return;
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }
        
        await this.bootstrap();
    }

    async bootstrap() {
        try {
            console.log('🚀 Initializing NexusCode IDE...');
            
            // Validate core modules exist
            this.validateCore();
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Set up global handlers
            this.setupGlobalHandlers();
            
            // Set up auto-save
            this.setupAutoSave();
            
            this.initialized = true;
            console.log('✅ NexusCode IDE initialized successfully');
            
            // Notify app is ready
            window.eventBus?.emit('app:ready');
            
        } catch (error) {
            console.error('❌ Bootstrap failed:', error);
            this.initAttempts++;
            
            if (this.initAttempts < this.maxAttempts) {
                console.log(`Retrying initialization (attempt ${this.initAttempts + 1})...`);
                setTimeout(() => this.bootstrap(), 500);
            } else {
                this.showErrorFallback(error);
            }
        }
    }

    validateCore() {
        const required = [
            { name: 'eventBus', obj: window.eventBus },
            { name: 'state', obj: window.state },
            { name: 'renderEngine', obj: window.renderEngine }
        ];
        
        const missing = required.filter(r => !r.obj);
        if (missing.length > 0) {
            console.warn('Missing core modules:', missing.map(m => m.name).join(', '));
        }
    }

    async initializeModules() {
        // Order matters - later modules depend on earlier ones
        const moduleOrder = [
            { name: 'FileManager', fn: () => this.initModule('fileManager', () => new FileManager()) },
            { name: 'EditorCore', fn: () => this.initModule('editorCore', () => {
                if (typeof EditorCore !== 'undefined') return new EditorCore();
                return null;
            })},
            { name: 'PreviewEngine', fn: () => this.initModule('previewEngine', () => {
                if (typeof PreviewEngine !== 'undefined') return new PreviewEngine();
                return null;
            })},
            { name: 'SearchEngine', fn: () => this.initModule('searchEngine', () => {
                if (typeof SearchEngine !== 'undefined') return new SearchEngine();
                return null;
            })},
            { name: 'DashboardManager', fn: () => this.initModule('dashboardManager', () => {
                if (typeof DashboardManager !== 'undefined') return new DashboardManager();
                return null;
            })},
            { name: 'TerminalEngine', fn: () => this.initModule('terminalEngine', () => {
                if (typeof TerminalEngine !== 'undefined') return new TerminalEngine();
                return null;
            })},
            { name: 'TemplateEngine', fn: () => this.initModule('templateEngine', () => {
                if (typeof TemplateEngine !== 'undefined') return new TemplateEngine();
                return null;
            })},
            { name: 'SettingsManager', fn: () => this.initModule('settingsManager', () => {
                if (typeof SettingsManager !== 'undefined') return new SettingsManager();
                return null;
            })},
            { name: 'PluginManager', fn: () => this.initModule('pluginManager', () => {
                if (typeof PluginManager !== 'undefined') return new PluginManager();
                return null;
            })},
            { name: 'WorkspaceManager', fn: () => this.initModule('workspaceManager', () => {
                if (typeof WorkspaceManager !== 'undefined') return new WorkspaceManager();
                return null;
            })}
        ];
        
        for (const module of moduleOrder) {
            try {
                console.log(`  Initializing ${module.name}...`);
                await module.fn();
            } catch (error) {
                console.warn(`  ⚠ ${module.name} initialization skipped:`, error.message);
            }
        }
    }

    initModule(name, factory) {
        try {
            const instance = factory();
            if (instance) {
                this.modules.push({ name, instance });
                console.log(`  ✓ ${name} initialized`);
            }
            return instance;
        } catch (error) {
            console.warn(`  ⚠ ${name} not available`);
            return null;
        }
    }

    setupGlobalHandlers() {
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled rejection:', event.reason);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                window.fileManager?.saveCurrentFile();
            }
            
            // Ctrl+Shift+P = Command Palette
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
                e.preventDefault();
                document.getElementById('command-palette')?.classList.add('active');
                document.getElementById('command-input')?.focus();
            }
            
            // Ctrl+` = Toggle Terminal
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                const terminalTab = document.querySelector('[data-panel="terminal"]');
                if (terminalTab) terminalTab.click();
            }
        });
        
        // Save before unload
        window.addEventListener('beforeunload', () => {
            window.fileManager?.saveCurrentFile();
            window.fileManager?.saveToLocalStorage();
        });
    }

    setupAutoSave() {
        // Auto-save every 30 seconds if dirty
        setInterval(() => {
            const isDirty = window.state?.get('editor.isDirty');
            if (isDirty) {
                window.fileManager?.saveCurrentFile();
            }
        }, 30000);
    }

    showErrorFallback(error) {
        const body = document.body;
        if (!body) return;
        
        body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                padding: 20px;
                font-family: sans-serif;
                background: #1e1e1e;
                color: #cccccc;
                text-align: center;
            ">
                <h1 style="color: #f48771; margin-bottom: 10px;">⚠️ Initialization Error</h1>
                <p style="margin-bottom: 5px;">${error.message || 'Unknown error'}</p>
                <p style="font-size: 12px; color: #888; margin-bottom: 20px;">Please check that all files are present</p>
                <button onclick="location.reload()" style="
                    padding: 12px 24px;
                    background: #007acc;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                ">🔄 Reload Application</button>
                <button onclick="localStorage.clear();location.reload()" style="
                    margin-top: 10px;
                    padding: 10px 20px;
                    background: #d32f2f;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                ">🗑 Clear Data & Reload</button>
            </div>
        `;
    }
}

// Initialize bootstrap
(function() {
    const bootstrap = new ReactiveBootstrap();
    window.bootstrap = bootstrap;
    
    // Start initialization
    bootstrap.initialize().catch(err => {
        console.error('Fatal initialization error:', err);
    });
})();
