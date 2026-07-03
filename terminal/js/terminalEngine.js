// ============================================
// Terminal Engine
// Core terminal logic and orchestration
// ============================================

class TerminalEngine {
    constructor() {
        // Core modules
        this.fs = new TerminalFileSystem();
        this.history = new TerminalHistory();
        this.autocomplete = new TerminalAutocomplete(this.fs);
        this.clipboard = new TerminalClipboard();
        this.ui = new TerminalUI();
        this.commands = new TerminalCommands(this.fs);
        this.settings = new TerminalSettings();
        
        // State
        this.cwd = '/home/user';
        this.previousDir = '/home/user';
        this.commandCount = 0;
        
        // Initialize keyboard after DOM
        this.keyboard = null;
        
        this.init();
    }

    init() {
        // Set up filesystem CWD
        this.fs.setCwd(this.cwd);
        
        // Register commands for autocomplete
        this.autocomplete.setCommands(this.commands.getNames());
        
        // Initialize keyboard
        this.keyboard = new TerminalKeyboard(this.ui.input);
        this.keyboard.loadPreference();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show welcome
        this.ui.printWelcome();
        this.ui.updatePrompt(this.cwd);
        this.ui.updateTime();
        
        // Update time periodically
        setInterval(() => this.ui.updateTime(), 30000);
        
        // Focus input
        this.ui.focusInput();
        
        // Show initial suggestions
        this.showSuggestions();
        
        console.log('✅ Terminal Engine initialized');
    }

    setupEventListeners() {
        // Input handler
        this.ui.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Update suggestions on input
        this.ui.input.addEventListener('input', () => {
            this.showSuggestions();
        });

        // Button handlers
        document.getElementById('btn-clear')?.addEventListener('click', () => this.clear());
        document.getElementById('btn-copy')?.addEventListener('click', () => this.copyAll());
        document.getElementById('btn-paste')?.addEventListener('click', () => this.paste());
        document.getElementById('btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());

        // Click on screen focuses input
        this.ui.screen?.addEventListener('click', (e) => {
            if (e.target === this.ui.screen || e.target === this.ui.output) {
                this.ui.focusInput();
            }
        });

        // Suggestion chip clicks
        this.ui.suggestions?.addEventListener('click', (e) => {
            const chip = e.target.closest('.suggestion-chip');
            if (chip) {
                this.ui.setInputValue(chip.dataset.cmd);
                this.ui.focusInput();
            }
        });

        // Visibility change refocus
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.ui.focusInput();
            }
        });
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand(this.ui.getInputValue().trim());
                this.ui.clearInput();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const prevCmd = this.history.navigateUp();
                this.ui.setInputValue(prevCmd);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                const nextCmd = this.history.navigateDown();
                this.ui.setInputValue(nextCmd);
                break;
                
            case 'Tab':
                e.preventDefault();
                this.handleAutocomplete();
                break;
                
            case 'Escape':
                e.preventDefault();
                this.ui.clearInput();
                break;
        }
        
        // Ctrl key combinations
        if (e.ctrlKey) {
            switch(e.key) {
                case 'l':
                    e.preventDefault();
                    this.clear();
                    break;
                case 'c':
                    e.preventDefault();
                    this.ui.clearInput();
                    this.ui.print('^C', 'dim');
                    break;
                case 'v':
                    // Paste handled by browser
                    break;
            }
        }
    }

    executeCommand(input) {
        if (!input) return;
        
        this.history.add(input);
        this.commandCount++;
        
        // Print the command
        this.ui.printCommand(input);
        
        // Parse command and arguments
        const parts = this.parseCommand(input);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute
        const result = this.commands.execute(cmd, args, this);
        
        if (result) {
            if (result.type === 'clear') {
                this.ui.clear();
            } else {
                this.ui.print(result.text, result.type);
            }
        }
        
        // Update prompt and scroll
        this.ui.updatePrompt(this.cwd);
        this.fs.setCwd(this.cwd);
        this.ui.scrollToBottom();
        
        // Update suggestions after command
        this.showSuggestions();
    }

    parseCommand(input) {
        const parts = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if (inQuote) {
                if (char === quoteChar) {
                    inQuote = false;
                } else {
                    current += char;
                }
            } else if (char === '"' || char === "'") {
                inQuote = true;
                quoteChar = char;
            } else if (char === ' ' || char === '\t') {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) parts.push(current);
        return parts;
    }

    handleAutocomplete() {
        const input = this.ui.getInputValue();
        const result = this.autocomplete.complete(input, this.cwd);
        
        if (result.completed !== input) {
            this.ui.setInputValue(result.completed);
        }
        
        // Show matches
        if (result.matches && result.matches.length > 1) {
            this.ui.print('');
            this.ui.print(result.matches.join('  '), 'dim');
        }
    }

    showSuggestions() {
        const input = this.ui.getInputValue();
        const suggestions = this.autocomplete.getSuggestions(input, this.cwd);
        this.ui.renderSuggestions(suggestions);
    }

    updatePrompt() {
        this.ui.updatePrompt(this.cwd);
    }

    clear() {
        this.ui.clear();
    }

    async copyAll() {
        const text = this.ui.output?.innerText || '';
        await this.clipboard.copy(text);
    }

    async paste() {
        const text = await this.clipboard.paste();
        if (text) {
            const current = this.ui.getInputValue();
            this.ui.setInputValue(current + text);
            this.ui.focusInput();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalEngine;
}
