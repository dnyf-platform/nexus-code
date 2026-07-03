class CursorManager {
    constructor(editorElement, gutterElement) {
        this.editor = editorElement;
        this.gutter = gutterElement;
        this.position = { line: 1, column: 1 };
        
        window.state.subscribe('editor.cursorPosition', (pos) => {
            if (pos) this.position = pos;
        });
    }

    updatePosition() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        
        const text = preCaretRange.toString();
        const lines = text.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        this.position = { line, column };
        window.state.set('editor.cursorPosition', this.position);
        
        window.eventBus.emit('cursor:updated', this.position);
    }

    setPosition(line, column) {
        const textNodes = this.getTextNodes();
        let currentLine = 1;
        let currentColumn = 1;
        let targetNode = null;
        let targetOffset = 0;
        
        for (const node of textNodes) {
            const nodeText = node.textContent;
            const nodeLines = nodeText.split('\n');
            
            for (let i = 0; i < nodeLines.length; i++) {
                if (currentLine === line) {
                    if (currentColumn + nodeLines[i].length >= column) {
                        targetNode = node;
                        targetOffset = column - currentColumn;
                        if (i > 0) {
                            const previousLength = nodeLines.slice(0, i).join('\n').length + i;
                            targetOffset = column - currentColumn + previousLength;
                        }
                        break;
                    }
                }
                
                if (i < nodeLines.length - 1) {
                    currentLine++;
                    currentColumn = 1;
                } else {
                    currentColumn += nodeLines[i].length + 1;
                }
            }
            
            if (targetNode) break;
        }
        
        if (targetNode) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(targetNode, Math.min(targetOffset, targetNode.length));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    getTextNodes() {
        const textNodes = [];
        const walker = document.createTreeWalker(
            this.editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }

    getLineColumnFromOffset(offset) {
        const text = this.editor.textContent;
        const lines = text.substr(0, offset).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    updateGutter() {
        const content = this.editor.textContent || '';
        const lines = content.split('\n');
        const lineCount = Math.max(lines.length, 1);
        
        let gutterHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            gutterHTML += `<div class="gutter-line">${i}</div>`;
        }
        
        this.gutter.innerHTML = gutterHTML;
    }

    syncScroll() {
        this.gutter.scrollTop = this.editor.scrollTop;
    }
}

window.cursorManager = null;