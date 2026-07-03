class SelectionManager {
    constructor(editorElement) {
        this.editor = editorElement;
        this.selection = null;
        
        window.eventBus.on('editor:content-changed', () => {
            this.selection = null;
            window.state.set('editor.selection', null);
        });
    }

    getSelection() {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) return null;
        
        const range = sel.getRangeAt(0);
        const preRange = document.createRange();
        preRange.selectNodeContents(this.editor);
        preRange.setEnd(range.startContainer, range.startOffset);
        const start = preRange.toString().length;
        
        const selectedText = range.toString();
        const end = start + selectedText.length;
        
        return {
            start,
            end,
            text: selectedText,
            startPos: this.getLineColumn(start),
            endPos: this.getLineColumn(end)
        };
    }

    getLineColumn(offset) {
        const text = this.editor.textContent;
        const beforeText = text.substr(0, offset);
        const lines = beforeText.split('\n');
        
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    updateSelection() {
        const selection = this.getSelection();
        window.state.set('editor.selection', selection);
        
        if (selection) {
            window.eventBus.emit('selection:changed', selection);
        }
    }

    selectAll() {
        const range = document.createRange();
        range.selectNodeContents(this.editor);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        this.updateSelection();
    }

    selectWord() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent;
        let start = range.startOffset;
        let end = range.endOffset;
        
        const wordRegex = /\w/;
        
        while (start > 0 && wordRegex.test(text[start - 1])) start--;
        while (end < text.length && wordRegex.test(text[end])) end++;
        
        range.setStart(range.startContainer, start);
        range.setEnd(range.endContainer, end);
        selection.removeAllRanges();
        selection.addRange(range);
        this.updateSelection();
    }

    replaceSelection(newText) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        if (newText) {
            const textNode = document.createTextNode(newText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.updateSelection();
        window.eventBus.emit('editor:content-changed');
    }
}

window.selectionManager = null;