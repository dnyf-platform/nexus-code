class SearchEngine {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.currentMatchIndex = -1;
        this.matches = [];
        this.searchTimeout = null;
        
        if (!this.searchInput || !this.searchResults) {
            console.error('Search elements not found');
            return;
        }
        
        this.initialize();
    }

    initialize() {
        this.searchInput.addEventListener('input', () => {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.performSearch(), 300);
        });
        
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            } else if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
        
        window.eventBus.on('search:toggle', () => {
            this.searchInput.focus();
        });
    }

    performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.clearSearch();
            return;
        }
        
        this.matches = [];
        this.currentMatchIndex = -1;
        
        const files = window.state.get('workspace.files') || [];
        const regex = new RegExp(query, 'gi');
        
        files.forEach(file => {
            const lines = file.content.split('\n');
            lines.forEach((line, index) => {
                let match;
                while ((match = regex.exec(line)) !== null) {
                    this.matches.push({
                        file: file.name,
                        line: index + 1,
                        column: match.index + 1,
                        text: line.trim(),
                        matchText: match[0]
                    });
                }
            });
        });
        
        this.renderResults();
    }

    renderResults() {
        if (this.matches.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            return;
        }
        
        const html = this.matches.map((match, index) => {
            const highlightedText = match.text.replace(
                new RegExp(match.matchText, 'gi'),
                match => `<strong>${match}</strong>`
            );
            
            return `
                <div class="search-result-item" data-index="${index}">
                    <div>📄 ${match.file}:${match.line}:${match.column}</div>
                    <div>${highlightedText}</div>
                </div>
            `;
        }).join('');
        
        this.searchResults.innerHTML = html;
        
        this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.navigateToMatch(index);
            });
        });
    }

    navigateToMatch(index) {
        if (index < 0 || index >= this.matches.length) return;
        
        const match = this.matches[index];
        this.currentMatchIndex = index;
        
        if (window.state.get('workspace.activeFile') !== match.file) {
            window.state.set('workspace.activeFile', match.file);
        }
        
        setTimeout(() => {
            window.cursorManager?.setPosition(match.line, match.column);
            
            const editor = document.getElementById('editor-content');
            if (editor) {
                const matchElement = editor.querySelector('.highlight-match');
                if (matchElement) matchElement.classList.remove('highlight-match');
            }
        }, 100);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        this.matches = [];
        this.currentMatchIndex = -1;
    }

    findNext() {
        if (this.matches.length === 0) return;
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
        this.navigateToMatch(this.currentMatchIndex);
    }

    findPrevious() {
        if (this.matches.length === 0) return;
        this.currentMatchIndex = this.currentMatchIndex <= 0 
            ? this.matches.length - 1 
            : this.currentMatchIndex - 1;
        this.navigateToMatch(this.currentMatchIndex);
    }
}

window.searchEngine = new SearchEngine();