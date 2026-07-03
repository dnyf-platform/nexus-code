        // ============================================
        // NEXUSCODE TERMUX TERMINAL ENGINE
        // ============================================
        
        class TermuxTerminal {
            constructor() {
                this.screen = document.getElementById('terminal-screen');
                this.output = document.getElementById('terminal-output');
                this.input = document.getElementById('terminal-input');
                this.prompt = document.getElementById('terminal-prompt');
                this.toast = document.getElementById('copy-toast');
                
                this.history = [];
                this.historyIndex = -1;
                this.currentDir = '/home/user';
                this.commandCount = 0;
                
                // Virtual filesystem
                this.fs = {
                    '/home/user': {
                        type: 'dir',
                        children: ['Documents', 'Projects', 'Downloads', '.bashrc', '.profile']
                    },
                    '/home/user/Documents': {
                        type: 'dir',
                        children: ['notes.txt', 'todo.md', 'nexuscode']
                    },
                    '/home/user/Projects': {
                        type: 'dir',
                        children: ['NexusCode', 'MyApp']
                    },
                    '/home/user/Downloads': {
                        type: 'dir',
                        children: []
                    },
                    '/home/user/.bashrc': {
                        type: 'file',
                        content: '# Bash configuration\nexport PATH=$PATH:/data/data/com.termux/files/usr/bin\nalias ll="ls -la"\nalias ..="cd .."'
                    },
                    '/home/user/.profile': {
                        type: 'file',
                        content: '# Profile settings\nexport EDITOR=nano\nexport TERM=xterm-256color'
                    }
                };
                
                // File contents
                this.files = {
                    'notes.txt': 'Project notes:\n- Fix the login bug\n- Update documentation\n- Deploy v2.0 by Friday',
                    'todo.md': '# TODO List\n\n## Urgent\n- [ ] Fix security vulnerability\n- [ ] Update dependencies\n\n## Later\n- [ ] Add dark mode\n- [ ] Write tests',
                    'readme.md': '# NexusCode\nA browser-based IDE for Android\n\n## Features\n- Code Editor\n- Terminal\n- File Manager'
                };
                
                this.init();
            }
            
            init() {
                // Input handler
                this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
                
                // Suggestion chips
                document.querySelectorAll('.suggestion-chip').forEach(chip => {
                    chip.addEventListener('click', () => {
                        this.input.value = chip.dataset.cmd;
                        this.input.focus();
                    });
                });
                
                // Keyboard toolbar
                document.querySelectorAll('.key-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.handleKeyButton(btn.dataset.key);
                    });
                });
                
                // Focus input on screen tap
                this.screen.addEventListener('click', (e) => {
                    if (e.target === this.screen || e.target === this.output) {
                        this.input.focus();
                    }
                });
                
                // Update status time
                this.updateTime();
                setInterval(() => this.updateTime(), 30000);
                
                // Focus input
                setTimeout(() => this.input.focus(), 100);
                
                // Show welcome
                this.printWelcome();
            }
            
            handleKeyDown(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const cmd = this.input.value.trim();
                    if (cmd) {
                        this.executeCommand(cmd);
                        this.input.value = '';
                        this.historyIndex = -1;
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory(1);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.autoComplete();
                } else if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    this.clear();
                } else if (e.ctrlKey && e.key === 'c') {
                    e.preventDefault();
                    this.print('\n^C', 'dim');
                    this.input.value = '';
                }
            }
            
            handleKeyButton(key) {
                this.input.focus();
                
                if (key === 'Tab') {
                    this.autoComplete();
                } else if (key === 'Escape') {
                    this.input.value = '';
                } else if (key === 'ArrowUp') {
                    this.navigateHistory(-1);
                } else if (key === 'ArrowDown') {
                    this.navigateHistory(1);
                } else if (key === 'Ctrl+C') {
                    this.print('\n^C', 'dim');
                    this.input.value = '';
                } else {
                    const start = this.input.selectionStart;
                    const end = this.input.selectionEnd;
                    const val = this.input.value;
                    this.input.value = val.substring(0, start) + key + val.substring(end);
                    this.input.selectionStart = this.input.selectionEnd = start + key.length;
                }
            }
            
            executeCommand(input) {
                this.commandCount++;
                this.history.push(input);
                if (this.history.length > 100) this.history.shift();
                
                this.print(`\n${this.prompt.textContent} ${input}`, 'command');
                
                const args = input.split(/\s+/);
                const cmd = args[0].toLowerCase();
                
                switch(cmd) {
                    case 'help': this.cmdHelp(); break;
                    case 'clear': this.clear(); break;
                    case 'ls': this.cmdLs(args[1]); break;
                    case 'cd': this.cmdCd(args[1]); break;
                    case 'pwd': this.print(this.currentDir, 'info'); break;
                    case 'cat': this.cmdCat(args[1]); break;
                    case 'echo': this.print(args.slice(1).join(' ') || '', 'output'); break;
                    case 'date': this.print(new Date().toString(), 'info'); break;
                    case 'whoami': this.print('u0_a200', 'output'); break;
                    case 'hostname': this.print('localhost', 'output'); break;
                    case 'uname': this.print('Linux localhost 5.10.43-android12 #1 SMP PREEMPT', 'output'); break;
                    case 'mkdir': this.print(`mkdir: created directory '${args[1] || 'untitled'}'`, 'success'); break;
                    case 'touch': this.print(`Created file: ${args[1] || 'untitled'}`, 'success'); break;
                    case 'rm': this.print(`Removed: ${args[1] || 'file'}`, 'warning'); break;
                    case 'cp': this.print(`Copied: ${args[1]} -> ${args[2]}`, 'success'); break;
                    case 'mv': this.print(`Moved: ${args[1]} -> ${args[2]}`, 'success'); break;
                    case 'git': this.cmdGit(args.slice(1)); break;
                    case 'node': this.cmdNode(args.slice(1)); break;
                    case 'python': this.cmdPython(args.slice(1)); break;
                    case 'npm': this.cmdNpm(args.slice(1)); break;
                    case 'nano': case 'vim': case 'vi':
                        this.print(`Opening ${args[1] || 'file'} in editor... (simulated)`, 'info'); break;
                    case 'exit': this.print('Use close button to exit terminal', 'dim'); break;
                    case 'neofetch': this.cmdNeofetch(); break;
                    default:
                        this.print(`bash: ${cmd}: command not found`, 'error');
                }
                
                this.updatePrompt();
                this.scrollToBottom();
            }
            
            // ========== COMMANDS ==========
            
            cmdHelp() {
                const help = `
┌─────────────────────────────────────────────────┐
│           NexusCode Termux Terminal Help         │
├─────────────────────────────────────────────────┤
│ 📁 File Commands:                                │
│   ls [path]     - List directory contents        │
│   cd [dir]      - Change directory               │
│   pwd           - Print working directory        │
│   cat <file>    - Display file contents          │
│   mkdir <dir>   - Create directory               │
│   touch <file>  - Create empty file              │
│   rm <file>     - Remove file                    │
│   cp <src> <dst>- Copy file                      │
│   mv <src> <dst>- Move/rename file               │
│                                                  │
│ 🛠 Development Commands:                         │
│   git <cmd>     - Git version control            │
│   node <args>   - Node.js runtime                │
│   python <args> - Python runtime                 │
│   npm <cmd>     - Node package manager           │
│   nano <file>   - Open in editor                 │
│   vim <file>    - Open in editor                 │
│                                                  │
│ 📊 System Commands:                              │
│   help          - Show this help                 │
│   clear         - Clear terminal                 │
│   date          - Show current date/time         │
│   whoami        - Show current user              │
│   hostname      - Show hostname                  │
│   uname         - System information             │
│   neofetch      - System info (fancy)            │
│   echo <text>   - Print text                     │
│                                                  │
│ ⌨ Shortcuts:                                     │
│   Tab           - Auto-complete                  │
│   ↑/↓           - Command history                │
│   Ctrl+L        - Clear screen                   │
│   Ctrl+C        - Cancel current line            │
│   Ctrl+D        - Exit (EOF)                     │
└─────────────────────────────────────────────────┘`;
                this.print(help, 'output');
            }
            
            cmdLs(path) {
                const dir = path || this.currentDir;
                const fullPath = this.resolvePath(dir);
                const entry = this.fs[fullPath];
                
                if (!entry) {
                    this.print(`ls: cannot access '${dir}': No such file or directory`, 'error');
                    return;
                }
                
                if (entry.type === 'file') {
                    this.print(path || dir, 'output');
                    return;
                }
                
                const items = entry.children || [];
                if (items.length === 0) {
                    this.print('(empty)', 'dim');
                    return;
                }
                
                const colored = items.map(item => {
                    const itemPath = `${fullPath}/${item}`.replace(/\/\//g, '/');
                    const itemEntry = this.fs[itemPath];
                    return itemEntry?.type === 'dir' 
                        ? `\x1b[34m${item}/\x1b[0m` 
                        : item;
                }).join('  ');
                
                this.print(colored, 'output');
            }
            
            cmdCd(dir) {
                if (!dir || dir === '~') {
                    this.currentDir = '/home/user';
                } else if (dir === '..') {
                    const parts = this.currentDir.split('/');
                    parts.pop();
                    this.currentDir = parts.join('/') || '/';
                } else if (dir === '-') {
                    const prev = this.currentDir;
                    this.currentDir = this.prevDir || '/home/user';
                    this.prevDir = prev;
                } else if (dir.startsWith('/')) {
                    this.currentDir = dir;
                } else {
                    const newDir = `${this.currentDir}/${dir}`.replace(/\/\//g, '/');
                    if (this.fs[newDir]?.type === 'dir') {
                        this.prevDir = this.currentDir;
                        this.currentDir = newDir;
                    } else {
                        this.print(`cd: ${dir}: No such directory`, 'error');
                    }
                }
                this.updatePrompt();
            }
            
            cmdCat(file) {
                if (!file) {
                    this.print('Usage: cat <filename>', 'warning');
                    return;
                }
                
                const content = this.files[file];
                if (content) {
                    this.print(content, 'output');
                } else {
                    this.print(`cat: ${file}: No such file`, 'error');
                }
            }
            
            cmdGit(args) {
                if (!args || args.length === 0) {
                    this.print('usage: git <command> [<args>]', 'warning');
                    this.print('\nAvailable commands:', 'dim');
                    this.print('  status   Show working tree status', 'dim');
                    this.print('  branch   List branches', 'dim');
                    this.print('  log      Show commit logs', 'dim');
                    this.print('  add      Add file contents to index', 'dim');
                    this.print('  commit   Record changes to repository', 'dim');
                    return;
                }
                
                switch(args[0]) {
                    case 'status':
                        this.print('On branch main', 'info');
                        this.print('Your branch is up to date with \'origin/main\'.\n', 'dim');
                        this.print('nothing to commit, working tree clean', 'success');
                        break;
                    case 'branch':
                        this.print('* main', 'success');
                        this.print('  develop', 'dim');
                        this.print('  feature/new-ui', 'dim');
                        break;
                    case 'log':
                        this.print('commit abc123def456 (HEAD -> main)', 'warning');
                        this.print('Author: Developer <dev@nexuscode.io>', 'dim');
                        this.print('Date:   ' + new Date().toLocaleString(), 'dim');
                        this.print('\n    Latest changes and improvements\n', 'output');
                        break;
                    default:
                        this.print(`git: '${args[0]}' is not a git command.`, 'error');
                }
            }
            
            cmdNode(args) {
                if (!args || args.length === 0) {
                    this.print('Node.js v18.15.0 (Termux)', 'info');
                    return;
                }
                
                if (args[0] === '--version' || args[0] === '-v') {
                    this.print('v18.15.0', 'info');
                } else if (args[0] === '-e') {
                    try {
                        const result = eval(args.slice(1).join(' '));
                        this.print(String(result), 'output');
                    } catch(e) {
                        this.print(`Error: ${e.message}`, 'error');
                    }
                } else if (args[0] === '-p') {
                    try {
                        const result = eval(args.slice(1).join(' '));
                        this.print(String(result), 'output');
                    } catch(e) {
                        this.print(`Error: ${e.message}`, 'error');
                    }
                } else {
                    this.print(`node: cannot execute '${args.join(' ')}'`, 'error');
                }
            }
            
            cmdPython(args) {
                if (!args || args.length === 0) {
                    this.print('Python 3.11.2 (Termux)', 'info');
                    return;
                }
                
                if (args[0] === '--version' || args[0] === '-V') {
                    this.print('Python 3.11.2', 'info');
                } else if (args[0] === '-c') {
                    this.print('(executed)', 'success');
                } else {
                    this.print(`python: can't open file '${args[0]}'`, 'error');
                }
            }
            
            cmdNpm(args) {
                if (!args || args.length === 0) {
                    this.print('npm <command>\n\nUsage:\n  npm install <package>\n  npm start\n  npm run <script>\n  npm test', 'output');
                    return;
                }
                
                if (args[0] === 'install') {
                    this.print(`Installing ${args[1] || 'packages'}...`, 'info');
                    setTimeout(() => {
                        this.print('added 42 packages in 2s', 'success');
                    }, 500);
                } else {
                    this.print('npm command simulated in browser', 'dim');
                }
            }
            
            cmdNeofetch() {
                const info = `
     ┌─────────────── System Information ───────────────┐
     │                                                    │
     │   ⬛ NexusCode Termux Terminal v2.0                 │
     │   ─────────────────────────────────────────────    │
     │   OS: Android 12 (Termux)                          │
     │   Host: localhost                                  │
     │   Kernel: 5.10.43-android12                        │
     │   Shell: bash 5.1                                  │
     │   Resolution: ${window.innerWidth}x${window.innerHeight}                   │
     │   CPU: ARM64 (8) @ 2.4GHz                          │
     │   Memory: 2890MB / 4096MB                          │
     │   Storage: 12GB / 64GB                             │
     │   Uptime: ${Math.floor(Math.random() * 48)} hours                       │
     │   Packages: 42 (npm)                               │
     │   Terminal: NexusCode Web Terminal                 │
     │   Theme: ${document.documentElement.dataset.theme || 'dark'}                                    │
     │                                                    │
     └────────────────────────────────────────────────────┘`;
                this.print(info, 'output');
                
                // Colors
                const colors = ['#000','#f00','#0f0','#ff0','#00f','#f0f','#0ff','#fff'];
                const colorBar = colors.map(c => `\x1b[48;2;${this.hexToRgb(c)}m   \x1b[0m`).join('');
                this.print('\n' + colorBar + '\n', 'output');
            }
            
            hexToRgb(hex) {
                const r = parseInt(hex.slice(1,3), 16);
                const g = parseInt(hex.slice(3,5), 16);
                const b = parseInt(hex.slice(5,7), 16);
                return `${r};${g};${b}`;
            }
            
            // ========== HELPERS ==========
            
            print(text, className = '') {
                const line = document.createElement('div');
                line.className = `terminal-line ${className}`;
                
                // Handle ANSI color codes (basic)
                text = text.replace(/\x1b\[34m/g, '<span style="color:#4488ff">');
                text = text.replace(/\x1b\[0m/g, '</span>');
                text = text.replace(/\x1b\[48;2;(.*?)m/g, '<span style="background:rgb($1)">');
                
                line.innerHTML = text || '&nbsp;';
                this.output.appendChild(line);
                this.scrollToBottom();
            }
            
            printWelcome() {
                setTimeout(() => {
                    this.print('Welcome to NexusCode Termux Terminal', 'success');
                    this.print('Type \'help\' for available commands.\n', 'dim');
                }, 200);
            }
            
            clear() {
                this.output.innerHTML = '';
            }
            
            scrollToBottom() {
                setTimeout(() => {
                    this.screen.scrollTop = this.screen.scrollHeight;
                }, 10);
            }
            
            navigateHistory(direction) {
                if (this.history.length === 0) return;
                
                this.historyIndex += direction;
                
                if (this.historyIndex < 0) {
                    this.historyIndex = -1;
                    this.input.value = '';
                } else if (this.historyIndex >= this.history.length) {
                    this.historyIndex = this.history.length - 1;
                    this.input.value = this.history[this.history.length - 1];
                } else {
                    this.input.value = this.history[this.history.length - 1 - this.historyIndex] || '';
                }
            }
            
            autoComplete() {
                const val = this.input.value;
                const commands = [
                    'help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'echo', 'date',
                    'whoami', 'hostname', 'uname', 'mkdir', 'touch', 'rm', 'cp', 'mv',
                    'git', 'node', 'python', 'npm', 'nano', 'vim', 'exit', 'neofetch'
                ];
                
                const match = commands.find(c => c.startsWith(val));
                if (match) {
                    this.input.value = match;
                }
            }
            
            resolvePath(path) {
                if (path.startsWith('/')) return path;
                if (path === '~') return '/home/user';
                return `${this.currentDir}/${path}`.replace(/\/\//g, '/');
            }
            
            updatePrompt() {
                const dir = this.currentDir.replace('/home/user', '~');
                this.prompt.textContent = `u0_a200@localhost:${dir}$`;
                document.getElementById('status-dir').textContent = dir;
            }
            
            updateTime() {
                const now = new Date();
                document.getElementById('status-time').textContent = 
                    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            copyAll() {
                const text = this.output.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast('📋 Copied to clipboard!');
                }).catch(() => {
                    this.showToast('⚠ Copy failed');
                });
            }
            
            toggleKeyboard() {
                const toolbar = document.getElementById('keyboard-toolbar');
                toolbar.style.display = toolbar.style.display === 'none' ? 'flex' : 'none';
            }
            
            toggleFullscreen() {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen();
                }
            }
            
            showToast(message) {
                this.toast.textContent = message;
                this.toast.classList.add('show');
                setTimeout(() => this.toast.classList.remove('show'), 2000);
            }
        }
        
        // Initialize terminal
        const terminal = new TermuxTerminal();
        
        // Focus input on load
        window.addEventListener('load', () => {
            document.getElementById('terminal-input').focus();
        });
        
        // Re-focus on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                document.getElementById('terminal-input')?.focus();
            }
        });