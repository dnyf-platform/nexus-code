// Settings Manager
class SettingsManager {
    constructor() {
        this.storageKey = 'nexuscode_settings';
        this.defaults = {
            theme: 'dark',
            fontSize: 14,
            tabSize: 4,
            autoSave: true,
            wordWrap: false,
            minimap: true,
            lineNumbers: true,
            terminalFontSize: 13
        };
        this.settings = this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
        } catch(e) { return { ...this.defaults }; }
    }

    save() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.settings)); } catch(e) {}
    }

    get(key) { return this.settings[key] ?? this.defaults[key]; }

    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.apply(key, value);
    }

    apply(key, value) {
        const root = document.documentElement;
        switch(key) {
            case 'theme': root.setAttribute('data-theme', value); break;
            case 'fontSize': root.style.setProperty('--font-size', value + 'px'); break;
        }
    }

    applyAll() {
        Object.entries(this.settings).forEach(([key, value]) => this.apply(key, value));
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
        this.applyAll();
    }
}

if (typeof window !== 'undefined') window.SettingsManager = SettingsManager;
