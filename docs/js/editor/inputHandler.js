class InputHandler {
    constructor(editorElement) {
        this.editor = editorElement;
        this.isComposing = false;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 100;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.editor.addEventListener('input', (e) => this.handleInput(e));
        this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));
        this.editor.addEventListener('cut', (e) => this.handleCut(e));
        this.editor.addEventListener('compositionstart', () => this.isComposing = true);
        this.editor.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            this.handleInput(e);
        });
    }

    handleInput(e) {
        if (this.isComposing) return;
        
        this.saveUndoState();
        this.updateEditorState();
        window.eventBus.emit('editor:content-changed');
    }

    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    window.eventBus.emit('file:save');
                    break;
                case 'a':
                    e.preventDefault();
                    window.selectionManager?.selectAll();
                    break;
                case 'f':
                    e.preventDefault();
                    window.eventBus.emit('search:toggle');
                    break;
            }
        }
        
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertText('    ');
        }
        
        setTimeout(() => {
            window.cursorManager?.updatePosition();
            window.selectionManager?.updateSelection();
        }, 0);
    }

    handlePaste(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        this.insertText(text);
    }

    handleCut(e) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const text = selection.toString();
            navigator.clipboard.writeText(text).catch(() => {});
            selection.deleteFromDocument();
            this.updateEditorState();
            window.eventBus.emit('editor:content-changed');
        }
    }

    insertText(text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        range.setStartAfter(textNode);
        range.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(range);
        
        this.updateEditorState();
        window.eventBus.emit('editor:content-changed');
    }

    updateEditorState() {
        const content = this.editor.textContent || '';
        window.state.set('editor.content', content);
        window.state.set('editor.isDirty', true);
        window.cursorManager?.updateGutter();
    }

    saveUndoState() {
        const content = this.editor.textContent || '';
        
        this.undoStack.push(content);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentContent = this.editor.textContent || '';
        this.redoStack.push(currentContent);
        
        const previousContent = this.undoStack.pop();
        this.editor.textContent = previousContent;
        
        this.updateEditorState();
        window.eventBus.emit('editor:content-changed');
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentContent = this.editor.textContent || '';
        this.undoStack.push(currentContent);
        
        const nextContent = this.redoStack.pop();
        this.editor.textContent = nextContent;
        
        this.updateEditorState();
        window.eventBus.emit('editor:content-changed');
    }
}

window.inputHandler = null;