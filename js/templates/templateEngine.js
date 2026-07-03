class TemplateEngine {
    constructor() {
        this.templates = [];
        this.modal = document.getElementById('templates-modal');
        this.initialize();
    }

    initialize() {
        document.getElementById('btn-templates')?.addEventListener('click', () => this.show());
        document.getElementById('btn-close-templates')?.addEventListener('click', () => this.hide());
        
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });

        document.getElementById('templates-search-input')?.addEventListener('input', (e) => {
            this.filterTemplates(e.target.value);
        });

        this.loadTemplates();
    }

    loadTemplates() {
        this.templates = window.templateLibrary?.getTemplates() || [];
        this.render();
    }

    render(filter = '') {
        const grid = document.getElementById('templates-grid');
        if (!grid) return;

        const filtered = filter 
            ? this.templates.filter(t => 
                t.name.toLowerCase().includes(filter.toLowerCase()) ||
                t.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
              )
            : this.templates;

        grid.innerHTML = filtered.map(template => `
            <div class="template-card" data-id="${template.id}">
                <div class="template-preview">${template.icon}</div>
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.description}</p>
                    <div class="template-tags">
                        ${template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="template-actions">
                    <button class="btn-preview-template" data-action="preview" data-id="${template.id}">
                        👁 Preview
                    </button>
                    <button class="btn-use-template" data-action="use" data-id="${template.id}">
                        ✓ Use Template
                    </button>
                </div>
            </div>
        `).join('');

        this.attachEventListeners();
    }

    attachEventListeners() {
        document.querySelectorAll('.btn-use-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.applyTemplate(id);
            });
        });

        document.querySelectorAll('.btn-preview-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.previewTemplate(id);
            });
        });
    }

    applyTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;

        window.state.set('editor.content', template.content);
        window.state.set('editor.fileName', template.filename || 'index.html');
        
        if (template.files) {
            window.state.set('workspace.files', template.files);
        }

        window.eventBus.emit('notification:show', {
            message: `Template "${template.name}" applied!`,
            type: 'success'
        });

        this.hide();
    }

    previewTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;

        window.state.set('editor.content', template.content);
        window.previewEngine?.forceRefresh();
        
        window.eventBus.emit('notification:show', {
            message: `Previewing: ${template.name}`,
            type: 'info'
        });
    }

    filterTemplates(query) {
        this.render(query);
    }

    show() {
        this.modal?.classList.add('active');
        this.render();
    }

    hide() {
        this.modal?.classList.remove('active');
    }
}

window.templateEngine = new TemplateEngine();
