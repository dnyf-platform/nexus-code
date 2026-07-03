class SettingsPanels {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        const shortcutsList = document.getElementById('keyboard-shortcuts-list');
        if (!shortcutsList) return;

        const shortcuts = [
            { action: 'Save File', key: 'Ctrl+S' },
            { action: 'Find', key: 'Ctrl+F' },
            { action: 'Replace', key: 'Ctrl+H' },
            { action: 'Command Palette', key: 'Ctrl+Shift+P' },
            { action: 'Toggle Terminal', key: 'Ctrl+`' },
            { action: 'Toggle Sidebar', key: 'Ctrl+B' },
            { action: 'Format Document', key: 'Shift+Alt+F' },
            { action: 'Undo', key: 'Ctrl+Z' },
            { action: 'Redo', key: 'Ctrl+Y' },
            { action: 'Select All', key: 'Ctrl+A' },
            { action: 'Copy', key: 'Ctrl+C' },
            { action: 'Paste', key: 'Ctrl+V' },
            { action: 'Cut', key: 'Ctrl+X' },
            { action: 'New File', key: 'Ctrl+N' },
            { action: 'Close Tab', key: 'Ctrl+W' }
        ];

        shortcutsList.innerHTML = shortcuts.map(s => `
            <div class="shortcut-item">
                <span>${s.action}</span>
                <kbd>${s.key}</kbd>
            </div>
        `).join('');
    }
}

window.settingsPanels = new SettingsPanels();
