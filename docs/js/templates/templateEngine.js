// Template Engine
class TemplateEngine {
    constructor() {
        this.templates = [];
        this.loadTemplates();
    }

    loadTemplates() {
        this.templates = [
            { id: 'html5', name: 'HTML5 Starter', icon: '🌐', type: 'html', tags: ['html', 'starter'] },
            { id: 'react', name: 'React App', icon: '⚛️', type: 'js', tags: ['react', 'spa'] },
            { id: 'vue', name: 'Vue SPA', icon: '💚', type: 'js', tags: ['vue', 'spa'] },
            { id: 'dashboard', name: 'Admin Dashboard', icon: '📊', type: 'html', tags: ['dashboard'] },
            { id: 'portfolio', name: 'Portfolio', icon: '🎨', type: 'html', tags: ['portfolio'] },
            { id: 'landing', name: 'Landing Page', icon: '🚀', type: 'html', tags: ['landing'] },
        ];
    }

    getTemplates() { return this.templates; }

    getTemplate(id) { return this.templates.find(t => t.id === id); }

    filter(query) {
        const q = query.toLowerCase();
        return this.templates.filter(t => 
            t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
        );
    }

    applyTemplate(id, fileManager) {
        const template = this.getTemplate(id);
        if (!template || !fileManager) return false;
        
        // Create default files based on template
        fileManager.createFile('index.html', 'html', '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>' + template.name + '</title>\n</head>\n<body>\n    <h1>' + template.name + '</h1>\n</body>\n</html>');
        fileManager.createFile('styles.css', 'css', 'body { font-family: system-ui, sans-serif; margin: 40px; }');
        fileManager.createFile('script.js', 'js', 'console.log("Template: ' + template.name + '");');
        
        return true;
    }
}

if (typeof window !== 'undefined') window.TemplateEngine = TemplateEngine;
