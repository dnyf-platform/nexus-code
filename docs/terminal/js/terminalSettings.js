// ============================================
// Terminal Settings Manager
// User preferences and configuration
// ============================================

class TerminalSettings {
    constructor() {
        this.defaults = {
            fontSize: 14,
            fontFamily: 'monospace',
            theme: 'dark',
            cursorStyle: 'block',
            cursorBlink: true,
            scrollback: 1000,
            enableKeyboard: true,
            enableSuggestions: true,
            enableSounds: false,
            historySize: 500,
            confirmOnExit: true
        };
        
        this.settings = this.load();
        this.modal = document.getElementById('settings-modal');
        this.body = document.getElementById('settings-body');
        
        this.init();
    }

    load() {
        try {
            const stored = localStorage.getItem('terminal_settings');
            return stored ? { ...this.defaults, ...JSON.parse(stored) } : { ...this.defaults };
        } catch {
            return { ...this.defaults };
        }
    }

    save() {
        try {
            localStorage.setItem('terminal_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings');
        }
    }

    get(key) {
        return this.settings[key] ?? this.defaults[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.apply(key, value);
    }

    apply(key, value) {
        switch(key) {
            case 'fontSize':
                document.documentElement.style.setProperty('--font-size', value + 'px');
                break;
            case 'fontFamily':
                document.documentElement.style.setProperty('--font-mono', value);
                break;
            case 'theme':
                document.documentElement.setAttribute('data-theme', value);
                break;
            case 'enableKeyboard':
                const toolbar = document.getElementById('keyboard-toolbar');
                if (toolbar) toolbar.style.display = value ? 'flex' : 'none';
                break;
        }
    }

    applyAll() {
        Object.entries(this.settings).forEach(([key, value]) => {
            this.apply(key, value);
        });
    }

    init() {
        // Settings button
        document.getElementById('btn-settings')?.addEventListener('click', () => this.open());
        document.getElementById('btn-close-settings')?.addEventListener('click', () => this.close());
        
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        this.applyAll();
    }

    open() {
        this.renderSettingsPanel();
        this.modal?.classList.add('active');
    }

    close() {
        this.modal?.classList.remove('active');
    }

    renderSettingsPanel() {
        if (!this.body) return;

        const settings = [
            {
                label: 'Font Size',
                key: 'fontSize',
                type: 'number',
                min: 8,
                max: 24,
                value: this.get('fontSize')
            },
            {
                label: 'Font Family',
                key: 'fontFamily',
                type: 'select',
                options: ['monospace', 'Courier New', 'Fira Code', 'JetBrains Mono'],
                value: this.get('fontFamily')
            },
            {
                label: 'Theme',
                key: 'theme',
                type: 'select',
                options: ['dark', 'light', 'green', 'amber', 'high-contrast'],
                value: this.get('theme')
            },
            {
                label: 'Cursor Style',
                key: 'cursorStyle',
                type: 'select',
                options: ['block', 'underline', 'bar'],
                value: this.get('cursorStyle')
            },
            {
                label: 'Cursor Blink',
                key: 'cursorBlink',
                type: 'checkbox',
                value: this.get('cursorBlink')
            },
            {
                label: 'Scrollback Lines',
                key: 'scrollback',
                type: 'number',
                min: 100,
                max: 10000,
                step: 100,
                value: this.get('scrollback')
            },
            {
                label: 'Show Keyboard Toolbar',
                key: 'enableKeyboard',
                type: 'checkbox',
                value: this.get('enableKeyboard')
            },
            {
                label: 'Show Suggestions',
                key: 'enableSuggestions',
                type: 'checkbox',
                value: this.get('enableSuggestions')
            },
            {
                label: 'History Size',
                key: 'historySize',
                type: 'number',
                min: 100,
                max: 2000,
                step: 100,
                value: this.get('historySize')
            }
        ];

        this.body.innerHTML = settings.map(s => `
            <div class="setting-item">
                <label>${s.label}</label>
                ${s.type === 'select' ? `
                    <select data-setting="${s.key}">
                        ${s.options.map(o => `<option value="${o}" ${o === s.value ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                ` : s.type === 'checkbox' ? `
                    <input type="checkbox" data-setting="${s.key}" ${s.value ? 'checked' : ''}>
                ` : `
                    <input type="${s.type}" data-setting="${s.key}" value="${s.value}" 
                           ${s.min ? `min="${s.min}"` : ''} ${s.max ? `max="${s.max}"` : ''} 
                           ${s.step ? `step="${s.step}"` : ''}>
                `}
            </div>
        `).join('');

        // Add event listeners
        this.body.querySelectorAll('[data-setting]').forEach(el => {
            el.addEventListener('change', () => {
                const key = el.dataset.setting;
                const value = el.type === 'checkbox' ? el.checked : el.value;
                this.set(key, value);
            });
        });

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:#d32f2f;color:white;border:none;border-radius:6px;cursor:pointer;';
        resetBtn.addEventListener('click', () => {
            this.settings = { ...this.defaults };
            this.save();
            this.applyAll();
            this.close();
        });
        this.body.appendChild(resetBtn);
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
        this.applyAll();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalSettings;
}
