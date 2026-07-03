// ============================================
// Terminal File System
// Virtual file system for terminal
// ============================================

class TerminalFileSystem {
    constructor() {
        this.fs = {
            '/': { type: 'dir', children: ['home', 'etc', 'tmp', 'var'] },
            '/home': { type: 'dir', children: ['user'] },
            '/home/user': {
                type: 'dir',
                children: ['Documents', 'Projects', 'Downloads', 'Desktop', '.bashrc', '.profile', '.gitconfig']
            },
            '/home/user/Documents': { type: 'dir', children: ['notes.txt', 'todo.md', 'nexuscode'] },
            '/home/user/Documents/nexuscode': { type: 'dir', children: ['index.html', 'styles.css', 'script.js'] },
            '/home/user/Projects': { type: 'dir', children: ['NexusCode', 'MyApp', 'Website'] },
            '/home/user/Downloads': { type: 'dir', children: [] },
            '/home/user/Desktop': { type: 'dir', children: ['shortcut.lnk'] },
            '/home/user/.bashrc': { type: 'file', size: 256 },
            '/home/user/.profile': { type: 'file', size: 128 },
            '/home/user/.gitconfig': { type: 'file', size: 64 },
            '/etc': { type: 'dir', children: ['hosts', 'resolv.conf'] },
            '/tmp': { type: 'dir', children: [] },
            '/var': { type: 'dir', children: ['log'] }
        };

        this.fileContents = {
            '/home/user/.bashrc': '# Bash configuration\nexport PATH=$PATH:/data/data/com.termux/files/usr/bin\nexport EDITOR=nano\nalias ll="ls -la"\nalias la="ls -A"\nalias ..="cd .."\nalias ...="cd ../.."\nalias gs="git status"\nalias gc="git commit"\nalias gp="git push"\n',
            '/home/user/.profile': '# Profile settings\nexport TERM=xterm-256color\nexport LANG=en_US.UTF-8\n',
            '/home/user/.gitconfig': '[user]\n    name = Developer\n    email = dev@nexuscode.io\n[core]\n    editor = nano\n',
            '/home/user/Documents/notes.txt': 'Project Notes\n==============\n\n- Fix login bug in auth module\n- Update API documentation\n- Deploy v2.0 by Friday\n- Review pull request #42\n- Add unit tests for user service\n',
            '/home/user/Documents/todo.md': '# TODO List\n\n## Urgent\n- [ ] Fix security vulnerability in login\n- [ ] Update npm dependencies\n- [ ] Write deployment docs\n\n## This Week\n- [ ] Add dark mode toggle\n- [ ] Implement search feature\n- [ ] Optimize database queries\n\n## Later\n- [ ] Add i18n support\n- [ ] Write integration tests\n- [ ] Set up CI/CD pipeline\n',
            '/home/user/Documents/nexuscode/index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>NexusCode</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>\n',
            '/home/user/Documents/nexuscode/styles.css': 'body { font-family: sans-serif; margin: 20px; background: #1e1e1e; color: #ccc; }\n',
            '/home/user/Documents/nexuscode/script.js': 'console.log("Hello from NexusCode!");\n',
            '/etc/hosts': '127.0.0.1 localhost\n::1 localhost\n192.168.1.1 router\n',
            '/etc/resolv.conf': 'nameserver 8.8.8.8\nnameserver 8.8.4.4\n'
        };
    }

    resolve(path) {
        if (!path) return null;
        if (path === '~') return '/home/user';
        if (path.startsWith('~')) return '/home/user' + path.slice(1);
        if (path.startsWith('/')) return this.normalize(path);
        return this.normalize(`${this.cwd}/${path}`);
    }

    normalize(path) {
        const parts = path.split('/').filter(Boolean);
        const result = [];
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') { result.pop(); continue; }
            result.push(part);
        }
        return '/' + result.join('/');
    }

    exists(path) {
        const resolved = this.resolve(path);
        return !!this.fs[resolved];
    }

    isDir(path) {
        const resolved = this.resolve(path);
        return this.fs[resolved]?.type === 'dir';
    }

    isFile(path) {
        const resolved = this.resolve(path);
        return this.fs[resolved]?.type === 'file';
    }

    list(path) {
        const resolved = this.resolve(path || this.cwd);
        const entry = this.fs[resolved];
        if (!entry || entry.type !== 'dir') return [];
        return entry.children || [];
    }

    read(path) {
        const resolved = this.resolve(path);
        return this.fileContents[resolved] || null;
    }

    write(path, content) {
        const resolved = this.resolve(path);
        this.fileContents[resolved] = content;
    }

    mkdir(path) {
        const resolved = this.resolve(path);
        if (this.fs[resolved]) return false;
        const parent = this.normalize(resolved + '/..');
        if (this.fs[parent]) {
            const name = resolved.split('/').pop();
            this.fs[resolved] = { type: 'dir', children: [] };
            this.fs[parent].children.push(name);
            return true;
        }
        return false;
    }

    touch(path) {
        const resolved = this.resolve(path);
        if (this.fs[resolved]) return false;
        const parent = this.normalize(resolved + '/..');
        if (this.fs[parent]) {
            const name = resolved.split('/').pop();
            this.fs[resolved] = { type: 'file', size: 0 };
            this.fileContents[resolved] = '';
            this.fs[parent].children.push(name);
            return true;
        }
        return false;
    }

    rm(path) {
        const resolved = this.resolve(path);
        const entry = this.fs[resolved];
        if (!entry) return false;
        if (entry.type === 'dir' && entry.children.length > 0) return false;
        const parent = this.normalize(resolved + '/..');
        if (this.fs[parent]) {
            const name = resolved.split('/').pop();
            this.fs[parent].children = this.fs[parent].children.filter(c => c !== name);
            delete this.fs[resolved];
            delete this.fileContents[resolved];
            return true;
        }
        return false;
    }

    getDirname(path) {
        const resolved = this.resolve(path);
        return this.normalize(resolved + '/..');
    }

    setCwd(cwd) {
        this.cwd = cwd;
    }

    getCwd() {
        return this.cwd || '/home/user';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalFileSystem;
}
