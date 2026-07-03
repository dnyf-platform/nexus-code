class WorkspaceManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.setupFileTree();
        this.setupTabs();
        this.setupPanelTabs();
        this.setupBottomNavigation();
        this.setupTopbarButtons();
        this.setupKeyboardShortcuts();
        
        window.fileManager.loadFromLocalStorage();
    }

    setupFileTree() {
        window.renderEngine.bind('#file-tree', 'workspace.files', (element, files) => {
            if (!files || !Array.isArray(files)) return;
            
            const activeFile = window.state.get('workspace.activeFile');
            
            const html = files.map(file => {
                const isActive = file.name === activeFile;
                const icon = file.type === 'folder' ? '📁' : '📄';
                
                return `
                    <div class="file-tree-item ${file.type} ${isActive ? 'active' : ''}" 
                         data-file="${file.name}" data-type="${file.type}">
                        <span class="icon">${icon}</span>
                        <span class="name">${file.name}</span>
                    </div>
                `;
            }).join('');
            
            element.innerHTML = html;
            
            element.querySelectorAll('.file-tree-item').forEach(item => {
                item.addEventListener('click', () => {
                    const fileName = item.dataset.file;
                    const fileType = item.dataset.type;
                    
                    if (fileType === 'file') {
                        window.fileManager.openFile(fileName);
                    }
                });
            });
        });
        
        window.state.subscribe('workspace.activeFile', (fileName) => {
            document.querySelectorAll('.file-tree-item').forEach(item => {
                item.classList.toggle('active', item.dataset.file === fileName);
            });
        });
    }

    setupTabs() {
        window.renderEngine.bind('#file-tabs', 'workspace.files', (element, files) => {
            const activeFile = window.state.get('workspace.activeFile');
            
            const fileTabs = files.filter(f => f.type === 'file');
            
            const html = fileTabs.map(file => {
                const isActive = file.name === activeFile;
                return `
                    <div class="tab ${isActive ? 'active' : ''}" data-file="${file.name}">
                        ${file.name}
                    </div>
                `;
            }).join('');
            
            element.innerHTML = html;
            
            element.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    window.fileManager.openFile(tab.dataset.file);
                });
            });
        });
        
        window.state.subscribe('workspace.activeFile', (fileName) => {
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.file === fileName);
            });
        });
    }

    setupPanelTabs() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const panel = tab.dataset.panel;
                
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`${panel}-section`)?.classList.add('active');
                
                window.state.set('ui.activePanel', panel);
            });
        });
    }

    setupBottomNavigation() {
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                
                document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                
                if (view === 'explorer') {
                    document.getElementById('sidebar')?.classList.toggle('active');
                } else if (view === 'preview') {
                    document.getElementById('panel')?.classList.toggle('active');
                }
            });
        });
    }

    setupTopbarButtons() {
        document.getElementById('btn-preview')?.addEventListener('click', () => {
            window.previewEngine?.toggleAutoRefresh();
        });
        
        document.getElementById('btn-new-file')?.addEventListener('click', () => {
            const name = prompt('Enter file name:');
            if (name) {
                window.fileManager.createNewFile(name);
            }
        });
        
        document.getElementById('btn-new-folder')?.addEventListener('click', () => {
            const name = prompt('Enter folder name:');
            if (name) {
                const files = window.state.get('workspace.files') || [];
                files.push({ name, type: 'folder' });
                window.state.set('workspace.files', [...files]);
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                // Quick file open could be implemented here
            }
        });
    }
}

window.workspaceManager = new WorkspaceManager();