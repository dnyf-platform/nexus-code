class ReactiveState {
    constructor(initialState = {}) {
        this.state = this.deepClone(initialState);
        this.subscribers = new Map();
        this.pathCache = new Map();
    }

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    get(path) {
        if (!path) return this.deepClone(this.state);
        
        const cached = this.pathCache.get(path);
        if (cached !== undefined) return cached;
        
        const value = path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : undefined;
        }, this.state);
        
        this.pathCache.set(path, value);
        return value;
    }

    set(path, value) {
        if (!path) return;
        
        const oldValue = this.get(path);
        const newValue = this.deepClone(value);
        
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = newValue;
        this.invalidateCache(path);
        this.notify(path, newValue, oldValue);
    }

    invalidateCache(path) {
        for (const [cachedPath] of this.pathCache) {
            if (cachedPath.startsWith(path)) {
                this.pathCache.delete(cachedPath);
            }
        }
    }

    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
        const currentValue = this.get(path);
        callback(currentValue);
        
        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    notify(path, newValue, oldValue) {
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in subscriber for "${path}":`, error);
                }
            });
        }
        
        this.subscribers.forEach((subs, subscriberPath) => {
            if (subscriberPath !== path && path.startsWith(subscriberPath + '.')) {
                subs.forEach(callback => {
                    try {
                        callback(this.get(subscriberPath));
                    } catch (error) {
                        console.error(`Error in subscriber for "${subscriberPath}":`, error);
                    }
                });
            }
        });
        
        window.eventBus.emit('state:changed', { path, newValue, oldValue });
    }

    batch(updates) {
        updates.forEach(({ path, value }) => {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = this.state;
            
            for (const key of keys) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }
            
            target[lastKey] = this.deepClone(value);
        });
        
        this.pathCache.clear();
        
        updates.forEach(({ path }) => {
            this.notify(path, this.get(path));
        });
    }

    reset(newState = {}) {
        this.state = this.deepClone(newState);
        this.pathCache.clear();
        this.subscribers.clear();
        window.eventBus.emit('state:reset');
    }
}

window.state = new ReactiveState({
    editor: {
        content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello NexusCode!</h1>\n</body>\n</html>',
        cursorPosition: { line: 1, column: 1 },
        selection: null,
        fileName: 'index.html',
        isDirty: false
    },
    workspace: {
        files: [
            { name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello NexusCode!</h1>\n</body>\n</html>' },
            { name: 'styles.css', type: 'file', content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 20px;\n}' },
            { name: 'script.js', type: 'file', content: 'console.log("Hello from NexusCode!");' }
        ],
        activeFile: 'index.html',
        expandedFolders: []
    },
    preview: {
        visible: true,
        autoRefresh: true
    },
    ui: {
        sidebarVisible: true,
        panelVisible: true,
        activePanel: 'preview',
        theme: 'dark'
    }
});