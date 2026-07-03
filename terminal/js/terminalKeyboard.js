// ============================================
// Terminal Keyboard Manager
// Virtual keyboard toolbar and shortcuts
// ============================================

class TerminalKeyboard {
    constructor(inputElement) {
        this.input = inputElement;
        this.toolbar = document.getElementById('keyboard-toolbar');
        this.visible = false;
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        this.renderToolbar();
        this.setupShortcuts();
        this.setupEventListeners();
    }

    renderToolbar() {
        if (!this.toolbar) return;

        const keys = [
            { key: 'Tab', label: 'Tab', class: 'special wide' },
            { key: 'Escape', label: 'Esc', class: 'special' },
            { key: '/', label: '/' },
            { key: '-', label: '-' },
            { key: '|', label: '|' },
            { key: '&', label: '&' },
            { key: '$', label: '$' },
            { key: '>', label: '>' },
            { key: '<', label: '<' },
            { key: 'ArrowUp', label: '↑', class: 'special wide' },
            { key: 'ArrowDown', label: '↓', class: 'special wide' },
            { key: 'ArrowLeft', label: '←', class: 'special' },
            { key: 'ArrowRight', label: '→', class: 'special' },
            { key: 'Ctrl+C', label: '^C', class: 'danger' },
            { key: 'Ctrl+L', label: '^L', class: 'special' },
        ];

        this.toolbar.innerHTML = keys.map(k => 
            `<button class="key-btn ${k.class || ''}" data-key="${k.key}">${k.label}</button>`
        ).join('');

        this.toolbar.querySelectorAll('.key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleKeyButton(btn.dataset.key);
            });
        });
    }

    setupShortcuts() {
        this.shortcuts.set('Ctrl+L', () => {
            document.getElementById('terminal-output').innerHTML = '';
        });
        this.shortcuts.set('Ctrl+C', () => {
            this.input.value = '';
        });
        this.shortcuts.set('Ctrl+D', () => {
            // EOF - could close terminal
        });
    }

    setupEventListeners() {
        // Toggle keyboard toolbar
        document.getElementById('btn-keyboard')?.addEventListener('click', () => {
            this.toggle();
        });
    }

    handleKeyButton(key) {
        this.input.focus();

        const actions = {
            'Tab': () => {
                // Trigger autocomplete event
                this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
            },
            'Escape': () => {
                this.input.value = '';
                this.input.focus();
            },
            'ArrowUp': () => {
                this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            },
            'ArrowDown': () => {
                this.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            },
            'ArrowLeft': () => {
                const pos = this.input.selectionStart;
                if (pos > 0) this.input.setSelectionRange(pos - 1, pos - 1);
            },
            'ArrowRight': () => {
                const pos = this.input.selectionStart;
                if (pos < this.input.value.length) this.input.setSelectionRange(pos + 1, pos + 1);
            },
            'Ctrl+C': () => {
                this.input.value = '';
                this.input.focus();
            },
            'Ctrl+L': () => {
                document.getElementById('terminal-output').innerHTML = '';
            }
        };

        if (actions[key]) {
            actions[key]();
        } else {
            // Insert character at cursor position
            const start = this.input.selectionStart;
            const end = this.input.selectionEnd;
            const val = this.input.value;
            this.input.value = val.substring(0, start) + key + val.substring(end);
            this.input.setSelectionRange(start + key.length, start + key.length);
            this.input.focus();
        }
    }

    toggle() {
        if (!this.toolbar) return;
        this.visible = !this.visible;
        this.toolbar.style.display = this.visible ? 'flex' : 'none';
        
        // Save preference
        localStorage.setItem('terminal_keyboard_visible', this.visible);
    }

    show() {
        if (!this.toolbar) return;
        this.visible = true;
        this.toolbar.style.display = 'flex';
    }

    hide() {
        if (!this.toolbar) return;
        this.visible = false;
        this.toolbar.style.display = 'none';
    }

    isMobile() {
        return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    }

    loadPreference() {
        const saved = localStorage.getItem('terminal_keyboard_visible');
        if (saved === 'true') this.show();
        else if (saved === 'false') this.hide();
        else if (this.isMobile()) this.show();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalKeyboard;
}
