// ============================================
// Terminal Autocomplete
// Tab completion for commands and paths
// ============================================

class TerminalAutocomplete {
    constructor(filesystem) {
        this.fs = filesystem;
        this.commands = [];
        this.pathCache = new Map();
    }

    setCommands(commands) {
        this.commands = commands;
    }

    complete(input, cwd) {
        if (!input) return { matches: [], completed: input };
        
        const args = input.split(/\s+/);
        const lastArg = args[args.length - 1];
        
        // First argument = command completion
        if (args.length === 1 && !lastArg.startsWith('./') && !lastArg.startsWith('/') && !lastArg.startsWith('~')) {
            return this.completeCommand(lastArg);
        }
        
        // Path completion
        return this.completePath(lastArg, cwd);
    }

    completeCommand(prefix) {
        const matches = this.commands.filter(cmd => cmd.startsWith(prefix));
        
        if (matches.length === 0) {
            return { matches: [], completed: prefix };
        }
        
        if (matches.length === 1) {
            return { matches, completed: matches[0] + ' ' };
        }
        
        // Find common prefix
        const commonPrefix = this.findCommonPrefix(matches);
        if (commonPrefix.length > prefix.length) {
            return { matches, completed: commonPrefix };
        }
        
        return { matches, completed: prefix };
    }

    completePath(path, cwd) {
        const dirname = path.includes('/') 
            ? path.substring(0, path.lastIndexOf('/') + 1) 
            : '';
        const basename = path.includes('/') 
            ? path.substring(path.lastIndexOf('/') + 1) 
            : path;
        
        let searchDir = dirname || '.';
        if (!searchDir.startsWith('/') && !searchDir.startsWith('~')) {
            searchDir = cwd + (searchDir === '.' ? '' : '/' + searchDir);
        }
        searchDir = this.fs.resolve(searchDir);
        
        if (!this.fs.exists(searchDir) || !this.fs.isDir(searchDir)) {
            return { matches: [], completed: path };
        }
        
        const children = this.fs.list(searchDir);
        const matches = children.filter(child => child.startsWith(basename));
        
        if (matches.length === 0) {
            return { matches: [], completed: path };
        }
        
        const prefix = dirname + matches[0];
        
        if (matches.length === 1) {
            const fullPath = this.fs.resolve(searchDir + '/' + matches[0]);
            const isDir = this.fs.isDir(fullPath);
            return { matches, completed: prefix + (isDir ? '/' : ' ') };
        }
        
        const commonPrefix = dirname + this.findCommonPrefix(matches);
        if (commonPrefix.length > path.length) {
            return { matches, completed: commonPrefix };
        }
        
        return { matches, completed: path };
    }

    findCommonPrefix(strings) {
        if (strings.length === 0) return '';
        let prefix = strings[0];
        for (let i = 1; i < strings.length; i++) {
            while (strings[i].indexOf(prefix) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === '') return '';
            }
        }
        return prefix;
    }

    getSuggestions(input, cwd) {
        if (input && input.length > 0) return [];
        
        const suggestions = [
            { cmd: 'ls -la', label: 'ls -la' },
            { cmd: 'git status', label: 'git status' },
            { cmd: 'node --version', label: 'node -v' },
            { cmd: 'python --version', label: 'python -v' },
            { cmd: 'cd ..', label: 'cd ..' },
            { cmd: 'clear', label: 'clear' },
            { cmd: 'neofetch', label: 'neofetch' },
            { cmd: 'help', label: 'help' }
        ];
        
        return suggestions;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalAutocomplete;
}
