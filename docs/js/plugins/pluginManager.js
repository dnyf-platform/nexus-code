// Plugin Manager
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.activePlugins = new Set();
    }

    register(name, plugin) {
        this.plugins.set(name, { name, ...plugin, status: 'registered' });
        console.log(`[Plugin] Registered: ${name}`);
    }

    activate(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;
        try {
            if (plugin.activate) plugin.activate();
            plugin.status = 'active';
            this.activePlugins.add(name);
            console.log(`[Plugin] Activated: ${name}`);
            return true;
        } catch(e) { console.error(`[Plugin] ${name}:`, e); return false; }
    }

    deactivate(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;
        try {
            if (plugin.deactivate) plugin.deactivate();
            plugin.status = 'inactive';
            this.activePlugins.delete(name);
            return true;
        } catch(e) { return false; }
    }

    getActive() { return Array.from(this.activePlugins); }
    getAll() { return Array.from(this.plugins.values()); }
    isActive(name) { return this.activePlugins.has(name); }
}

if (typeof window !== 'undefined') window.PluginManager = PluginManager;
