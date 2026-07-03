// ============================================
// Terminal Commands
// All built-in terminal commands
// ============================================

class TerminalCommands {
    constructor(filesystem) {
        this.fs = filesystem;
        this.commands = new Map();
        this.registerAll();
    }

    registerAll() {
        this.register('help', this.help.bind(this));
        this.register('clear', this.clear.bind(this));
        this.register('ls', this.ls.bind(this));
        this.register('cd', this.cd.bind(this));
        this.register('pwd', this.pwd.bind(this));
        this.register('cat', this.cat.bind(this));
        this.register('echo', this.echo.bind(this));
        this.register('date', this.date.bind(this));
        this.register('whoami', this.whoami.bind(this));
        this.register('hostname', this.hostname.bind(this));
        this.register('uname', this.uname.bind(this));
        this.register('mkdir', this.mkdir.bind(this));
        this.register('touch', this.touch.bind(this));
        this.register('rm', this.rm.bind(this));
        this.register('cp', this.cp.bind(this));
        this.register('mv', this.mv.bind(this));
        this.register('git', this.git.bind(this));
        this.register('node', this.node.bind(this));
        this.register('python', this.python.bind(this));
        this.register('npm', this.npm.bind(this));
        this.register('nano', this.editor.bind(this));
        this.register('vim', this.editor.bind(this));
        this.register('vi', this.editor.bind(this));
        this.register('neofetch', this.neofetch.bind(this));
        this.register('history', this.history.bind(this));
        this.register('env', this.env.bind(this));
        this.register('exit', this.exit.bind(this));
    }

    register(name, handler) {
        this.commands.set(name, handler);
    }

    getNames() {
        return Array.from(this.commands.keys());
    }

    execute(cmd, args, terminal) {
        const handler = this.commands.get(cmd);
        if (handler) {
            return handler(args, terminal);
        }
        return { type: 'error', text: `bash: ${cmd}: command not found` };
    }

    // ========== COMMAND IMPLEMENTATIONS ==========

    help() {
        return { type: 'output', text: `
┌──────────────────────────────────────────────────┐
│         NexusCode Terminal Commands              │
├──────────────────────────────────────────────────┤
│ 📁 File System:                                  │
│   ls [path]     List directory contents          │
│   cd [dir]      Change directory                 │
│   pwd           Print working directory          │
│   cat <file>    Display file contents            │
│   mkdir <dir>   Create directory                 │
│   touch <file>  Create empty file                │
│   rm <file>     Remove file                      │
│   cp <s> <d>    Copy file                        │
│   mv <s> <d>    Move/rename file                 │
│                                                  │
│ 🛠 Development:                                  │
│   git <cmd>     Git version control              │
│   node <args>   Node.js runtime                  │
│   python <args> Python runtime                   │
│   npm <cmd>     Package manager                  │
│   nano/vim      Text editor                      │
│                                                  │
│ 📊 System:                                       │
│   help          This help message                │
│   clear         Clear terminal                   │
│   date          Show date/time                   │
│   whoami        Current user                     │
│   hostname      System hostname                  │
│   uname         System info                      │
│   neofetch      Fancy system info                │
│   history       Command history                  │
│   env           Environment variables            │
│   echo <text>   Print text                       │
│   exit          Exit terminal                    │
│                                                  │
│ ⌨ Shortcuts:                                     │
│   Tab           Autocomplete                     │
│   ↑/↓           History navigation               │
│   Ctrl+L        Clear screen                     │
│   Ctrl+C        Cancel                           │
└──────────────────────────────────────────────────┘
`.trim() };
    }

    ls(args, terminal) {
        const path = args[0] || terminal.cwd;
        const resolved = this.fs.resolve(path);
        
        if (!this.fs.exists(resolved)) {
            return { type: 'error', text: `ls: cannot access '${path}': No such file or directory` };
        }
        
        if (this.fs.isFile(resolved)) {
            return { type: 'output', text: path };
        }
        
        const items = this.fs.list(resolved);
        if (items.length === 0) {
            return { type: 'dim', text: '(empty)' };
        }
        
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
        
        let displayItems = showAll ? ['.', '..', ...items] : items;
        
        const colored = displayItems.map(item => {
            const itemPath = this.fs.resolve(resolved + '/' + item);
            const isDir = this.fs.isDir(itemPath);
            return isDir ? `\x1b[34m${item}/\x1b[0m` : item;
        });
        
        return { type: 'output', text: colored.join('  '), raw: displayItems };
    }

    cd(args, terminal) {
        const dir = args[0] || '~';
        let newDir;
        
        if (dir === '-') {
            newDir = terminal.previousDir || terminal.cwd;
            terminal.previousDir = terminal.cwd;
        } else {
            newDir = this.fs.resolve(dir);
        }
        
        if (!this.fs.exists(newDir)) {
            return { type: 'error', text: `cd: ${dir}: No such file or directory` };
        }
        
        if (!this.fs.isDir(newDir)) {
            return { type: 'error', text: `cd: ${dir}: Not a directory` };
        }
        
        terminal.previousDir = terminal.cwd;
        terminal.cwd = newDir;
        terminal.updatePrompt();
        return null; // No output, just change dir
    }

    pwd(args, terminal) {
        return { type: 'output', text: terminal.cwd };
    }

    cat(args) {
        if (!args[0]) {
            return { type: 'error', text: 'Usage: cat <filename>' };
        }
        
        const content = this.fs.read(args[0]);
        if (content === null) {
            return { type: 'error', text: `cat: ${args[0]}: No such file` };
        }
        
        return { type: 'output', text: content };
    }

    echo(args) {
        return { type: 'output', text: args.join(' ') };
    }

    date() {
        const now = new Date();
        return { type: 'output', text: now.toString() };
    }

    whoami() {
        return { type: 'output', text: 'u0_a200' };
    }

    hostname() {
        return { type: 'output', text: 'localhost' };
    }

    uname(args) {
        if (args.includes('-a')) {
            return { type: 'output', text: 'Linux localhost 5.10.43-android12 #1 SMP PREEMPT aarch64 Android' };
        }
        if (args.includes('-r')) {
            return { type: 'output', text: '5.10.43-android12' };
        }
        return { type: 'output', text: 'Linux' };
    }

    mkdir(args) {
        if (!args[0]) return { type: 'error', text: 'Usage: mkdir <directory>' };
        const success = this.fs.mkdir(args[0]);
        return success 
            ? { type: 'success', text: `Created directory: ${args[0]}` }
            : { type: 'error', text: `mkdir: cannot create directory '${args[0]}'` };
    }

    touch(args) {
        if (!args[0]) return { type: 'error', text: 'Usage: touch <filename>' };
        const success = this.fs.touch(args[0]);
        return success 
            ? { type: 'success', text: `Created file: ${args[0]}` }
            : { type: 'error', text: `touch: cannot create '${args[0]}'` };
    }

    rm(args) {
        if (!args[0]) return { type: 'error', text: 'Usage: rm <file>' };
        const success = this.fs.rm(args[0]);
        return success 
            ? { type: 'success', text: `Removed: ${args[0]}` }
            : { type: 'error', text: `rm: cannot remove '${args[0]}'` };
    }

    cp(args) {
        if (!args[0] || !args[1]) return { type: 'error', text: 'Usage: cp <source> <destination>' };
        return { type: 'success', text: `Copied: ${args[0]} -> ${args[1]}` };
    }

    mv(args) {
        if (!args[0] || !args[1]) return { type: 'error', text: 'Usage: mv <source> <destination>' };
        return { type: 'success', text: `Moved: ${args[0]} -> ${args[1]}` };
    }

    git(args) {
        if (!args[0]) return { type: 'output', text: 'usage: git <command>\n\nAvailable: status, branch, log, add, commit, push, pull, diff' };
        
        switch(args[0]) {
            case 'status':
                return { type: 'output', text: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean' };
            case 'branch':
                return { type: 'output', text: '* main\n  develop\n  feature/new-ui\n  bugfix/login-fix' };
            case 'log':
                return { type: 'output', text: `commit abc123def456 (HEAD -> main)\nAuthor: Developer <dev@nexuscode.io>\nDate:   ${new Date().toLocaleString()}\n\n    Latest changes and improvements` };
            case 'diff':
                return { type: 'output', text: 'diff --git a/index.html b/index.html\n--- a/index.html\n+++ b/index.html\n@@ -1 +1 @@\n-<h1>Old</h1>\n+<h1>New</h1>' };
            default:
                return { type: 'success', text: `git ${args.join(' ')}: command executed successfully` };
        }
    }

    node(args) {
        if (!args[0]) return { type: 'info', text: 'Node.js v18.15.0' };
        if (args[0] === '--version' || args[0] === '-v') return { type: 'info', text: 'v18.15.0' };
        if (args[0] === '-e' || args[0] === '-p') {
            try {
                const result = eval(args.slice(1).join(' '));
                return { type: 'output', text: String(result) };
            } catch(e) {
                return { type: 'error', text: `Error: ${e.message}` };
            }
        }
        return { type: 'error', text: `node: cannot execute '${args.join(' ')}'` };
    }

    python(args) {
        if (!args[0]) return { type: 'info', text: 'Python 3.11.2' };
        if (args[0] === '--version' || args[0] === '-V') return { type: 'info', text: 'Python 3.11.2' };
        return { type: 'error', text: `python: can't open file '${args[0]}'` };
    }

    npm(args) {
        if (!args[0]) return { type: 'output', text: 'npm <command>\n\nUsage:\n  npm install <pkg>\n  npm start\n  npm test\n  npm run <script>' };
        if (args[0] === 'install') return { type: 'success', text: `Installed ${args[1] || 'packages'} successfully\nadded 42 packages in 2s` };
        return { type: 'success', text: `npm ${args.join(' ')}: completed` };
    }

    editor(args) {
        const file = args[0] || 'untitled';
        return { type: 'info', text: `Opening "${file}" in editor...\n(File editing available in NexusCode IDE)` };
    }

    neofetch(args, terminal) {
        const info = `
     ┌──────────────────────────────────────────────┐
     │                                              │
     │   ⬛ NexusCode Terminal v3.0                  │
     │   ───────────────────────────────────────    │
     │   OS: Android 12 (Termux)                    │
     │   Host: localhost                            │
     │   Kernel: 5.10.43-android12                  │
     │   Shell: bash 5.1                            │
     │   Resolution: ${typeof window !== 'undefined' ? window.innerWidth + 'x' + window.innerHeight : '1080x2400'}                       │
     │   CPU: ARM64 (8) @ 2.4GHz                    │
     │   Memory: 2890MB / 4096MB                    │
     │   Storage: 12GB / 64GB                       │
     │   Uptime: ${Math.floor(Math.random() * 72)} hours                       │
     │   Packages: 42 (npm)                         │
     │   CWD: ${terminal?.cwd || '/home/user'}                     │
     │   Theme: dark                                │
     │                                              │
     └──────────────────────────────────────────────┘`;
        return { type: 'output', text: info };
    }

    history(args, terminal) {
        if (!terminal.history) return { type: 'dim', text: 'No history available' };
        const all = terminal.history.getAll();
        if (args.includes('-c')) {
            terminal.history.clear();
            return { type: 'success', text: 'History cleared' };
        }
        return { type: 'output', text: all.map((h, i) => `  ${i + 1}  ${h}`).join('\n') };
    }

    env() {
        const vars = [
            'PATH=/data/data/com.termux/files/usr/bin',
            'HOME=/home/user',
            'USER=u0_a200',
            'SHELL=/bin/bash',
            'TERM=xterm-256color',
            'LANG=en_US.UTF-8',
            'EDITOR=nano',
            'PWD=/home/user'
        ];
        return { type: 'output', text: vars.join('\n') };
    }

    exit() {
        return { type: 'info', text: 'logout\nSession ended. Close tab to exit.' };
    }

    clear() {
        return { type: 'clear', text: '' };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalCommands;
}
