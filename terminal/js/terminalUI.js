// ============================================
// Terminal UI Manager
// Handles rendering, welcome screen, themes
// ============================================

class TerminalUI {
    constructor() {
        this.output = document.getElementById('terminal-output');
        this.screen = document.getElementById('terminal-screen');
        this.input = document.getElementById('terminal-input');
        this.prompt = document.getElementById('terminal-prompt');
        this.suggestions = document.getElementById('suggestions-bar');
        this.statusDir = document.getElementById('status-dir');
        this.statusTime = document.getElementById('status-time');
    }

    print(text, type = 'output') {
        if (!text && text !== '') return;
        
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.innerHTML = this.formatText(text);
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    printCommand(command) {
        const line = document.createElement('div');
        line.className = 'terminal-line command';
        line.textContent = `${this.prompt.textContent} ${command}`;
        this.output.appendChild(line);
    }

    printWelcome() {
        const welcome = document.createElement('div');
        welcome.className = 'welcome-banner';
        welcome.innerHTML = `
            <div class="title">⬛ Welcome to NexusCode Terminal v3.0</div>
            <div class="grid">
                <span class="label">Session:</span><span class="value">termux-${Date.now()}</span>
                <span class="label">User:</span><span class="value">u0_a200</span>
                <span class="label">Host:</span><span class="value">localhost</span>
                <span class="label">Shell:</span><span class="value">bash 5.1</span>
                <span class="label">CWD:</span><span class="value">/home/user</span>
            </div>
            <div style="margin-top:8px;color:#666;font-size:10px;">
                Type <span style="color:#0c0">help</span> for commands •
                Type <span style="color:#0c0">clear</span> to reset
            </div>
        `;
        this.output.appendChild(welcome);
        this.scrollToBottom();
    }

    formatText(text) {
        // Basic ANSI code support
        return text
            .replace(/\x1b\[34m/g, '<span style="color:#4488ff">')
            .replace(/\x1b\[31m/g, '<span style="color:#ff4444">')
            .replace(/\x1b\[32m/g, '<span style="color:#44ff44">')
            .replace(/\x1b\[33m/g, '<span style="color:#ffaa00">')
            .replace(/\x1b\[0m/g, '</span>')
            .replace(/\n/g, '<br>');
    }

    clear() {
        this.output.innerHTML = '';
    }

    renderSuggestions(suggestions) {
        if (!this.suggestions) return;
        
        if (!suggestions || suggestions.length === 0) {
            this.suggestions.innerHTML = '';
            return;
        }
        
        this.suggestions.innerHTML = suggestions.map(s => 
            `<span class="suggestion-chip" data-cmd="${s.cmd}">${s.label}</span>`
        ).join('');
        
        this.suggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.input.value = chip.dataset.cmd;
                this.input.focus();
                this.input.dispatchEvent(new Event('input'));
            });
        });
    }

    updatePrompt(cwd) {
        const displayPath = cwd.replace('/home/user', '~');
        this.prompt.textContent = `u0_a200@localhost:${displayPath}$`;
        if (this.statusDir) {
            this.statusDir.textContent = displayPath;
        }
    }

    updateTime() {
        if (this.statusTime) {
            const now = new Date();
            this.statusTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            if (this.screen) {
                this.screen.scrollTop = this.screen.scrollHeight;
            }
        });
    }

    focusInput() {
        setTimeout(() => this.input?.focus(), 50);
    }

    getInputValue() {
        return this.input?.value || '';
    }

    clearInput() {
        if (this.input) this.input.value = '';
    }

    setInputValue(value) {
        if (this.input) {
            this.input.value = value;
            this.input.setSelectionRange(value.length, value.length);
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalUI;
}
