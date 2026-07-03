class PreviewEngine {
    constructor() {
        this.previewFrame = document.getElementById('preview-frame');
        this.autoRefresh = true;
        this.updateTimeout = null;
        this.lastContent = '';
        
        if (!this.previewFrame) {
            console.error('Preview frame not found');
            return;
        }
        
        this.initialize();
    }

    initialize() {
        window.state.subscribe('editor.content', (content) => {
            if (this.autoRefresh && content) {
                this.debounceUpdate(content);
            }
        });
        
        window.state.subscribe('preview.autoRefresh', (autoRefresh) => {
            this.autoRefresh = autoRefresh !== false;
        });
        
        window.eventBus.on('preview:refresh', () => {
            const content = window.state.get('editor.content');
            if (content) this.updatePreview(content);
        });
        
        window.eventBus.on('editor:content-changed', () => {
            if (this.autoRefresh) {
                const content = window.state.get('editor.content');
                if (content) this.debounceUpdate(content);
            }
        });
        
        this.loadInitialPreview();
    }

    debounceUpdate(content) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updatePreview(content);
        }, 300);
    }

    updatePreview(content) {
        if (!this.previewFrame || !content) return;
        
        if (content === this.lastContent) return;
        this.lastContent = content;
        
        this.previewFrame.classList.add('loading');
        
        try {
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            this.previewFrame.src = url;
            
            this.previewFrame.onload = () => {
                this.previewFrame.classList.remove('loading');
                URL.revokeObjectURL(url);
            };
            
            this.previewFrame.onerror = () => {
                this.previewFrame.classList.remove('loading');
                URL.revokeObjectURL(url);
            };
            
            window.eventBus.emit('preview:updated', { success: true });
        } catch (error) {
            console.error('Preview update failed:', error);
            this.previewFrame.classList.remove('loading');
            window.eventBus.emit('preview:error', error);
        }
    }

    loadInitialPreview() {
        const content = window.state.get('editor.content');
        if (content) {
            this.updatePreview(content);
        }
    }

    toggleAutoRefresh() {
        const current = window.state.get('preview.autoRefresh');
        window.state.set('preview.autoRefresh', !current);
    }

    forceRefresh() {
        const content = window.state.get('editor.content');
        if (content) {
            this.lastContent = '';
            this.updatePreview(content);
        }
    }
}

window.previewEngine = new PreviewEngine();