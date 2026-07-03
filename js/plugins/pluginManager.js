class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.activePlugins = new Set();
        this.initialize();
    }

    initialize() {
        this.loadPlugins();
        window.eventBus.on('app:ready', () => this.activateBuiltinPlugins());
    }

    registerPlugin(name, plugin) {
        this.plugins.set(name, {
            name,
            ...plugin,
            status: 'registered'
        });
        
        window.eventBus.emit('plugin:registered', name);
    }

    activatePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        try {
            if (plugin.activate) {
                plugin.activate();
            }
            plugin.status = 'active';
            this.activePlugins.add(name);
            window.eventBus.emit('plugin:activated', name);
            return true;
        } catch (error) {
            console.error(`Failed to activate plugin: ${name}`, error);
            return false;
        }
    }

    deactivatePlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        try {
            if (plugin.deactivate) {
                plugin.deactivate();
            }
            plugin.status = 'inactive';
            this.activePlugins.delete(name);
            window.eventBus.emit('plugin:deactivated', name);
            return true;
        } catch (error) {
            console.error(`Failed to deactivate plugin: ${name}`, error);
            return false;
        }
    }

    loadPlugins() {
        if (window.builtinPlugins) {
            window.builtinPlugins.getPlugins().forEach(plugin => {
                this.registerPlugin(plugin.name, plugin);
            });
        }
    }

    activateBuiltinPlugins() {
        this.plugins.forEach((plugin, name) => {
            if (plugin.autoActivate !== false) {
                this.activatePlugin(name);
            }
        });
    }

    getActivePlugins() {
        return Array.from(this.activePlugins);
    }

    getPluginStatus(name) {
        const plugin = this.plugins.get(name);
        return plugin ? plugin.status : 'not-found';
    }
}

window.pluginManager = new PluginManager();
