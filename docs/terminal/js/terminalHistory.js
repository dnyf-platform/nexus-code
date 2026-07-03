// ============================================
// Terminal History Manager
// Command history with persistence
// ============================================

class TerminalHistory {
    constructor(maxSize = 500) {
        this.maxSize = maxSize;
        this.history = [];
        this.index = -1;
        this.sessionFile = '/home/user/.bash_history';
        this.load();
    }

    add(command) {
        if (!command || command.trim() === '') return;
        
        // Don't add duplicates consecutively
        if (this.history.length > 0 && this.history[this.history.length - 1] === command) {
            return;
        }
        
        this.history.push(command);
        if (this.history.length > this.maxSize) {
            this.history.shift();
        }
        
        this.index = this.history.length;
        this.save();
    }

    navigateUp() {
        if (this.history.length === 0) return '';
        if (this.index > 0) this.index--;
        return this.history[this.index] || '';
    }

    navigateDown() {
        if (this.index < this.history.length - 1) {
            this.index++;
            return this.history[this.index] || '';
        }
        this.index = this.history.length;
        return '';
    }

    reset() {
        this.index = this.history.length;
    }

    search(prefix) {
        return this.history
            .filter(cmd => cmd.startsWith(prefix))
            .reverse()
            .slice(0, 10);
    }

    getAll() {
        return [...this.history];
    }

    clear() {
        this.history = [];
        this.index = -1;
        this.save();
    }

    save() {
        try {
            localStorage.setItem('terminal_history', JSON.stringify(this.history.slice(-200)));
        } catch (e) {
            // Storage full, ignore
        }
    }

    load() {
        try {
            const stored = localStorage.getItem('terminal_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.history = parsed.slice(-this.maxSize);
                    this.index = this.history.length;
                }
            }
        } catch (e) {
            this.history = [];
        }
    }

    getStats() {
        return {
            total: this.history.length,
            unique: new Set(this.history).size,
            lastCommand: this.history[this.history.length - 1] || 'none'
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalHistory;
}
