// Built-in Plugins
class BuiltinPlugins {
    static registerAll(pluginManager) {
        pluginManager.register('prettier', {
            version: '1.0.0',
            description: 'Code formatter',
            activate: () => console.log('Prettier activated'),
            deactivate: () => console.log('Prettier deactivated')
        });
        
        pluginManager.register('emmet', {
            version: '2.0.0',
            description: 'HTML/CSS expansion',
            activate: () => console.log('Emmet activated')
        });
        
        pluginManager.register('theme-manager', {
            version: '1.0.0',
            description: 'Theme switching',
            activate: () => console.log('Theme Manager activated')
        });
        
        pluginManager.register('minimap', {
            version: '1.0.0',
            description: 'Code overview minimap',
            activate: () => console.log('Minimap activated')
        });
        
        pluginManager.register('git-lens', {
            version: '1.0.0',
            description: 'Git integration',
            activate: () => console.log('Git Lens activated')
        });
    }
}

if (typeof window !== 'undefined') window.BuiltinPlugins = BuiltinPlugins;
