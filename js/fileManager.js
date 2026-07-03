// =====================================================
// NexusCode Studio IDE - File Manager
// Handles file operations, localStorage, import/export
// =====================================================

class FileManager {
    constructor() {
        this.supportedExtensions = ['.html', '.css', '.js', '.json', '.txt', '.md', '.py', '.ts', '.jsx', '.tsx'];
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        if (this.initialized) return;
        
        // Set up event listeners
        window.eventBus?.on('file:save', () => this.saveCurrentFile());
        window.eventBus?.on('file:new', () => this.createNewFile());
        window.eventBus?.on('file:delete', (fileName) => this.deleteFile(fileName));
        window.eventBus?.on('file:rename', (data) => this.renameFile(data.oldName, data.newName));
        
        // Subscribe to dirty state
        window.state?.subscribe('editor.isDirty', (isDirty) => {
            this.updateDirtyIndicator(isDirty);
        });
        
        // Load saved files from localStorage
        this.loadFromLocalStorage();
        
        this.initialized = true;
        console.log('✅ FileManager initialized');
    }

    // ==================== FILE OPERATIONS ====================

    saveCurrentFile() {
        const fileName = window.state?.get('editor.fileName');
        const content = window.state?.get('editor.content');
        
        if (!fileName) {
            this.notify('No file to save', 'warning');
            return false;
        }
        
        const files = window.state?.get('workspace.files') || [];
        const fileIndex = files.findIndex(f => f.name === fileName);
        
        if (fileIndex >= 0) {
            files[fileIndex].content = content;
            files[fileIndex].lastModified = new Date().toISOString();
            window.state.set('workspace.files', [...files]);
            window.state.set('editor.isDirty', false);
            
            this.saveToLocalStorage();
            window.eventBus?.emit('file:saved', fileName);
            this.notify(`Saved: ${fileName}`, 'success');
            return true;
        }
        
        return false;
    }

    createNewFile(name = null) {
        const fileName = name || `untitled-${Date.now()}.html`;
        
        const files = window.state?.get('workspace.files') || [];
        
        // Check if file already exists
        if (files.find(f => f.name === fileName)) {
            this.notify(`File "${fileName}" already exists`, 'warning');
            return null;
        }
        
        // Determine default content based on extension
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        let defaultContent = '';
        
        switch (extension) {
            case '.html':
                defaultContent = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>New Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>';
                break;
            case '.css':
                defaultContent = '/* Styles */\n\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    font-family: Arial, sans-serif;\n}\n';
                break;
            case '.js':
                defaultContent = '// JavaScript\n\nconsole.log("Hello from NexusCode!");\n';
                break;
            case '.json':
                defaultContent = '{\n    "name": "new-project",\n    "version": "1.0.0"\n}\n';
                break;
            case '.md':
                defaultContent = '# New Document\n\nStart writing here...\n';
                break;
            default:
                defaultContent = '';
        }
        
        const newFile = {
            name: fileName,
            type: 'file',
            content: defaultContent,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        window.state.set('workspace.files', [...files, newFile]);
        window.state.set('workspace.activeFile', fileName);
        window.state.set('editor.content', defaultContent);
        window.state.set('editor.fileName', fileName);
        window.state.set('editor.isDirty', false);
        
        window.eventBus?.emit('file:created', fileName);
        this.notify(`Created: ${fileName}`, 'success');
        
        return newFile;
    }

    deleteFile(fileName) {
        if (!fileName) return;
        
        // Confirm deletion
        if (!confirm(`Delete "${fileName}"?`)) return;
        
        const files = window.state?.get('workspace.files') || [];
        const updatedFiles = files.filter(f => f.name !== fileName);
        
        window.state.set('workspace.files', updatedFiles);
        
        // If deleted file was active, switch to another file
        const activeFile = window.state?.get('workspace.activeFile');
        if (activeFile === fileName) {
            const nextFile = updatedFiles.find(f => f.type === 'file');
            if (nextFile) {
                this.openFile(nextFile.name);
            } else {
                window.state.set('editor.content', '');
                window.state.set('editor.fileName', '');
                window.state.set('workspace.activeFile', null);
            }
        }
        
        this.saveToLocalStorage();
        window.eventBus?.emit('file:deleted', fileName);
        this.notify(`Deleted: ${fileName}`, 'info');
    }

    renameFile(oldName, newName) {
        if (!oldName || !newName) return;
        
        const files = window.state?.get('workspace.files') || [];
        const file = files.find(f => f.name === oldName);
        
        if (!file) return;
        
        // Check if new name already exists
        if (files.find(f => f.name === newName)) {
            this.notify(`File "${newName}" already exists`, 'warning');
            return;
        }
        
        file.name = newName;
        file.lastModified = new Date().toISOString();
        
        window.state.set('workspace.files', [...files]);
        
        if (window.state.get('workspace.activeFile') === oldName) {
            window.state.set('workspace.activeFile', newName);
            window.state.set('editor.fileName', newName);
        }
        
        this.saveToLocalStorage();
        window.eventBus?.emit('file:renamed', { oldName, newName });
    }

    openFile(fileName) {
        if (!fileName) return;
        
        const files = window.state?.get('workspace.files') || [];
        const file = files.find(f => f.name === fileName);
        
        if (file && file.type === 'file') {
            window.state.set('workspace.activeFile', fileName);
            window.state.set('editor.content', file.content || '');
            window.state.set('editor.fileName', fileName);
            window.state.set('editor.isDirty', false);
            window.eventBus?.emit('file:opened', fileName);
        }
    }

    // ==================== STORAGE ====================

    saveToLocalStorage() {
        try {
            const files = window.state?.get('workspace.files');
            if (files) {
                localStorage.setItem('nexuscode_files', JSON.stringify(files));
            }
            
            // Save current file content separately for backup
            const content = window.state?.get('editor.content');
            const fileName = window.state?.get('editor.fileName');
            if (content && fileName) {
                localStorage.setItem(`nexuscode_file_${fileName}`, content);
            }
        } catch (error) {
            console.error('Failed to save files:', error);
            this.notify('Failed to save files', 'error');
        }
    }

    loadFromLocalStorage() {
        try {
            // Try loading full workspace
            const stored = localStorage.getItem('nexuscode_files');
            if (stored) {
                const files = JSON.parse(stored);
                if (Array.isArray(files) && files.length > 0) {
                    window.state?.set('workspace.files', files);
                    
                    // Open the first file or last active
                    const lastActive = localStorage.getItem('nexuscode_last_active');
                    const fileToOpen = lastActive && files.find(f => f.name === lastActive)
                        ? lastActive
                        : files.find(f => f.type === 'file')?.name;
                    
                    if (fileToOpen) {
                        this.openFile(fileToOpen);
                    }
                    return true;
                }
            }
            
            // If no files exist, create default files
            this.createDefaultFiles();
            return false;
        } catch (error) {
            console.error('Failed to load files from localStorage:', error);
            this.createDefaultFiles();
            return false;
        }
    }

    createDefaultFiles() {
        const defaultFiles = [
            {
                name: 'index.html',
                type: 'file',
                content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Project</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <h1>Hello NexusCode!</h1>\n    <p>Start editing to see your changes</p>\n    <script src="script.js"></script>\n</body>\n</html>',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            {
                name: 'styles.css',
                type: 'file',
                content: '/* Main Styles */\n\nbody {\n    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n    margin: 40px;\n    background: #1e1e1e;\n    color: #cccccc;\n}\n\nh1 {\n    color: #007acc;\n}\n',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            {
                name: 'script.js',
                type: 'file',
                content: '// Main Script\n\nconsole.log("Welcome to NexusCode IDE!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n    console.log("Page loaded successfully");\n});\n',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            {
                name: 'README.md',
                type: 'file',
                content: '# My Project\n\nCreated with **NexusCode IDE**\n\n## Getting Started\n\n1. Edit `index.html`\n2. Style with `styles.css`\n3. Add logic in `script.js`\n\n## Features\n\n- Live Preview\n- Terminal\n- File Management\n',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        ];
        
        window.state?.set('workspace.files', defaultFiles);
        this.openFile('index.html');
        this.saveToLocalStorage();
    }

    // ==================== IMPORT / EXPORT ====================

    exportProject() {
        const files = window.state?.get('workspace.files') || [];
        const projectData = {
            name: 'NexusCode Project',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            files: files
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexuscode-project-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.notify('Project exported successfully', 'success');
    }

    importProject(jsonData) {
        try {
            const projectData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (projectData.files && Array.isArray(projectData.files)) {
                window.state?.set('workspace.files', projectData.files);
                
                if (projectData.files.length > 0) {
                    const firstFile = projectData.files.find(f => f.type === 'file');
                    if (firstFile) {
                        this.openFile(firstFile.name);
                    }
                }
                
                this.saveToLocalStorage();
                window.eventBus?.emit('project:imported', projectData);
                this.notify('Project imported successfully', 'success');
                return true;
            }
        } catch (error) {
            console.error('Failed to import project:', error);
            this.notify('Failed to import project', 'error');
            return false;
        }
    }

    // ==================== HELPERS ====================

    updateDirtyIndicator(isDirty) {
        const tabs = document.querySelectorAll('.tab');
        const fileName = window.state?.get('editor.fileName');
        
        tabs.forEach(tab => {
            if (tab.dataset.file === fileName) {
                const nameEl = tab.querySelector('.tab-name');
                if (nameEl) {
                    nameEl.textContent = isDirty ? `${fileName} •` : fileName;
                }
            }
        });
        
        // Update status bar
        const statusSave = document.getElementById('status-save');
        if (statusSave) {
            statusSave.textContent = isDirty ? 'Unsaved' : 'Ready';
            statusSave.style.color = isDirty ? 'var(--warning)' : 'var(--text-secondary)';
        }
    }

    notify(message, type = 'info') {
        window.eventBus?.emit('notification:show', { message, type });
        console.log(`[FileManager] ${type}: ${message}`);
    }

    getFileIcon(fileName) {
        const ext = fileName?.substring(fileName.lastIndexOf('.')).toLowerCase();
        const icons = {
            '.html': '🌐',
            '.css': '🎨',
            '.js': '📜',
            '.json': '📋',
            '.md': '📝',
            '.txt': '📄',
            '.py': '🐍',
            '.ts': '📘',
            '.jsx': '⚛️',
            '.tsx': '⚛️'
        };
        return icons[ext] || '📄';
    }

    getFileLanguage(fileName) {
        const ext = fileName?.substring(fileName.lastIndexOf('.')).toLowerCase();
        const languages = {
            '.html': 'HTML',
            '.css': 'CSS',
            '.js': 'JavaScript',
            '.json': 'JSON',
            '.md': 'Markdown',
            '.py': 'Python',
            '.ts': 'TypeScript',
            '.jsx': 'React JSX',
            '.tsx': 'React TSX'
        };
        return languages[ext] || 'Plain Text';
    }

    // Get total file count and size
    getProjectStats() {
        const files = window.state?.get('workspace.files') || [];
        const fileCount = files.filter(f => f.type === 'file').length;
        const totalSize = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);
        const totalLines = files.reduce((sum, f) => sum + (f.content?.split('\n')?.length || 0), 0);
        
        return {
            files: fileCount,
            size: totalSize,
            lines: totalLines
        };
    }
}

// Create instance only when DOM is ready
let fileManagerInstance = null;

function initFileManager() {
    if (!fileManagerInstance) {
        fileManagerInstance = new FileManager();
        window.fileManager = fileManagerInstance;
    }
    return fileManagerInstance;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFileManager);
} else {
    initFileManager();
}

// Also expose for manual initialization
window.initFileManager = initFileManager;
