class EditorCore {
    constructor() {
        this.editorElement = document.getElementById('editor-content');
        this.gutterElement = document.getElementById('editor-gutter');
        this.cursorPositionElement = document.getElementById('cursor-position');
        
        if (!this.editorElement || !this.gutterElement) {
            console.error('Editor elements not found');
            return;
        }
        
        this.initialize();
    }

    initialize() {
        window.cursorManager = new CursorManager(this.editorElement, this.gutterElement);
        window.selectionManager = new SelectionManager(this.editorElement);
        window.inputHandler = new InputHandler(this.editorElement);
        
        this.setupEventListeners();
        this.setupStateBindings();
        this.loadInitialContent();
    }

    setupEventListeners() {
        this.editorElement.addEventListener('click', () => {
            window.cursorManager?.updatePosition();
            window.selectionManager?.updateSelection();
        });
        
        this.editorElement.addEventListener('keyup', () => {
            window.cursorManager?.updatePosition();
            window.selectionManager?.updateSelection();
        });
        
        this.editorElement.addEventListener('scroll', () => {
            window.cursorManager?.syncScroll();
        });
        
        window.eventBus.on('cursor:updated', (position) => {
            if (this.cursorPositionElement && position) {
                this.cursorPositionElement.textContent = `Ln ${position.line}, Col ${position.column}`;
            }
        });
        
        window.eventBus.on('state:changed', ({ path }) => {
            if (path === 'editor.content') {
                window.cursorManager?.updateGutter();
            }
        });
        
        const observer = new MutationObserver(() => {
            window.cursorManager?.updateGutter();
        });
        
        observer.observe(this.editorElement, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    setupStateBindings() {
        window.renderEngine.bind('#editor-content', 'editor.content', (element, content) => {
            if (content !== undefined && content !== null) {
                const currentContent = element.textContent || '';
                if (currentContent !== content) {
                    element.textContent = content;
                    window.cursorManager?.updateGutter();
                }
            }
        });
        
        window.state.subscribe('workspace.activeFile', (fileName) => {
            if (fileName) {
                const files = window.state.get('workspace.files') || [];
                const file = files.find(f => f.name === fileName);
                if (file) {
                    window.state.set('editor.content', file.content);
                    window.state.set('editor.fileName', fileName);
                    window.state.set('editor.isDirty', false);
                }
            }
        });
    }

    loadInitialContent() {
        const content = window.state.get('editor.content');
        if (content) {
            this.editorElement.textContent = content;
            window.cursorManager?.updateGutter();
        }
    }
}

window.editorCore = new EditorCore();