class BuiltinPlugins {
    getPlugins() {
        return [
            {
                name: 'prettier',
                version: '1.0.0',
                description: 'Code formatter',
                autoActivate: true,
                activate: () => {
                    console.log('Prettier plugin activated');
                },
                deactivate: () => {
                    console.log('Prettier plugin deactivated');
                }
            },
            {
                name: 'emmet',
                version: '1.0.0',
                description: 'HTML/CSS expansion',
                autoActivate: false,
                activate: () => {
                    console.log('Emmet plugin activated');
                }
            },
            {
                name: 'theme-manager',
                version: '1.0.0',
                description: 'Theme switching support',
                autoActivate: true,
                activate: () => {
                    const theme = window.state.get('ui.theme');
                    if (theme) {
                        document.documentElement.setAttribute('data-theme', theme);
                    }
                }
            },
            {
                name: 'live-server',
                version: '1.0.0',
                description: 'Local development server',
                autoActivate: false,
                activate: () => {
                    console.log('Live server plugin activated');
                }
            },
            {
                name: 'git-integration',
                version: '1.0.0',
                description: 'Git version control',
                autoActivate: true,
                activate: () => {
                    console.log('Git integration activated');
                }
            }
        ];
    }
}

window.builtinPlugins = new BuiltinPlugins();
