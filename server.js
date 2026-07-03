// ============================================
// NEXUSCODE STUDIO - BACKEND SERVER
// Complete app server with API, WebSocket, file management
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    rootDir: __dirname,
    distDir: path.join(__dirname, 'dist', 'NexusCode_IDE'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    corsOrigin: '*',
    enableWebSocket: true,
    enableAuth: false,
    logLevel: 'info'
};

// ============================================
// MIME TYPES
// ============================================
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'font/eot',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.wasm': 'application/wasm'
};

// ============================================
// LOGGER
// ============================================
class Logger {
    static info(msg) { console.log(`[INFO] ${new Date().toISOString()} ${msg}`); }
    static warn(msg) { console.warn(`[WARN] ${new Date().toISOString()} ${msg}`); }
    static error(msg) { console.error(`[ERROR] ${new Date().toISOString()} ${msg}`); }
    static debug(msg) { if (CONFIG.logLevel === 'debug') console.log(`[DEBUG] ${msg}`); }
    static request(method, url, status) {
        const color = status < 400 ? '\x1b[32m' : status < 500 ? '\x1b[33m' : '\x1b[31m';
        console.log(`${color}[${status}]\x1b[0m ${method} ${url}`);
    }
}

// ============================================
// IN-MEMORY STORAGE
// ============================================
class MemoryStore {
    constructor() {
        this.store = new Map();
        this.sessions = new Map();
        this.terminalSessions = new Map();
        this.fileLocks = new Map();
    }

    get(key) { return this.store.get(key); }
    set(key, value) { this.store.set(key, value); }
    delete(key) { this.store.delete(key); }
    has(key) { return this.store.has(key); }
    clear() { this.store.clear(); }
    keys() { return Array.from(this.store.keys()); }
    
    createSession() {
        const id = crypto.randomUUID();
        this.sessions.set(id, { created: Date.now(), data: {} });
        return id;
    }
    
    getSession(id) { return this.sessions.get(id); }
    
    createTerminalSession() {
        const id = crypto.randomUUID();
        this.terminalSessions.set(id, {
            id,
            created: Date.now(),
            cwd: '/home/user',
            history: [],
            env: { HOME: '/home/user', USER: 'developer', PATH: '/usr/bin' }
        });
        return id;
    }
    
    getTerminalSession(id) { return this.terminalSessions.get(id); }
}

const store = new MemoryStore();

// ============================================
// VIRTUAL FILE SYSTEM
// ============================================
class VirtualFileSystem {
    constructor() {
        this.files = new Map();
        this.initDefaultFiles();
    }

    initDefaultFiles() {
        const defaults = {
            '/home/user/index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>My Project</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <h1>Hello NexusCode!</h1>\n    <script src="script.js"></script>\n</body>\n</html>',
            '/home/user/styles.css': 'body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    background: #1e1e1e;\n    color: #ccc;\n}\nh1 { color: #58a6ff; }',
            '/home/user/script.js': 'console.log("Welcome to NexusCode!");\ndocument.addEventListener("DOMContentLoaded", () => {\n    console.log("Page loaded");\n});',
            '/home/user/README.md': '# My Project\n\nBuilt with NexusCode Studio\n\n## Features\n- Live Preview\n- Terminal\n- File Management'
        };

        for (const [filePath, content] of Object.entries(defaults)) {
            this.writeFile(filePath, content);
        }
    }

    readFile(filePath) {
        return this.files.get(filePath) || null;
    }

    writeFile(filePath, content) {
        this.files.set(filePath, content);
        return true;
    }

    deleteFile(filePath) {
        return this.files.delete(filePath);
    }

    listFiles(dirPath = '/') {
        const files = [];
        const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/';
        
        for (const [filePath, content] of this.files) {
            if (filePath.startsWith(prefix)) {
                const relative = filePath.substring(prefix.length);
                if (!relative.includes('/')) {
                    files.push({
                        name: relative,
                        path: filePath,
                        type: 'file',
                        size: content.length,
                        modified: new Date().toISOString()
                    });
                } else {
                    const dirName = relative.split('/')[0];
                    if (!files.find(f => f.name === dirName)) {
                        files.push({
                            name: dirName,
                            path: prefix + dirName,
                            type: 'directory',
                            size: 0,
                            modified: new Date().toISOString()
                        });
                    }
                }
            }
        }
        
        return files;
    }

    searchFiles(query) {
        const results = [];
        for (const [filePath, content] of this.files) {
            if (content.toLowerCase().includes(query.toLowerCase())) {
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: filePath,
                            line: index + 1,
                            content: line.trim(),
                            match: query
                        });
                    }
                });
            }
        }
        return results;
    }

    getStats() {
        let totalFiles = 0;
        let totalSize = 0;
        let totalLines = 0;

        for (const [filePath, content] of this.files) {
            totalFiles++;
            totalSize += content.length;
            totalLines += content.split('\n').length;
        }

        return { totalFiles, totalSize, totalLines };
    }
}

const vfs = new VirtualFileSystem();

// ============================================
// API HANDLERS
// ============================================
class APIHandler {
    
    // Handle API routes
    static async handle(req, res, pathname) {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', CONFIG.corsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return true;
        }
        
        const apiPath = pathname.replace('/api/', '');
        
        try {
            switch (true) {
                // File operations
                case apiPath === 'files' && req.method === 'GET':
                    return APIHandler.handleListFiles(req, res);
                case apiPath === 'files/read' && req.method === 'POST':
                    return APIHandler.handleReadFile(req, res);
                case apiPath === 'files/write' && req.method === 'POST':
                    return APIHandler.handleWriteFile(req, res);
                case apiPath === 'files/delete' && req.method === 'POST':
                    return APIHandler.handleDeleteFile(req, res);
                case apiPath === 'files/search' && req.method === 'POST':
                    return APIHandler.handleSearchFiles(req, res);
                case apiPath === 'files/stats' && req.method === 'GET':
                    return APIHandler.handleFileStats(req, res);
                
                // Project operations
                case apiPath === 'project/export' && req.method === 'GET':
                    return APIHandler.handleExportProject(req, res);
                case apiPath === 'project/import' && req.method === 'POST':
                    return APIHandler.handleImportProject(req, res);
                case apiPath === 'project/create' && req.method === 'POST':
                    return APIHandler.handleCreateProject(req, res);
                
                // Terminal operations
                case apiPath === 'terminal/create' && req.method === 'POST':
                    return APIHandler.handleCreateTerminal(req, res);
                case apiPath === 'terminal/execute' && req.method === 'POST':
                    return APIHandler.handleTerminalExecute(req, res);
                
                // System operations
                case apiPath === 'system/info' && req.method === 'GET':
                    return APIHandler.handleSystemInfo(req, res);
                case apiPath === 'system/ping' && req.method === 'GET':
                    return APIHandler.handlePing(req, res);
                
                // Session
                case apiPath === 'session' && req.method === 'POST':
                    return APIHandler.handleCreateSession(req, res);
                
                // Templates
                case apiPath === 'templates' && req.method === 'GET':
                    return APIHandler.handleGetTemplates(req, res);
                
                // Settings
                case apiPath === 'settings' && req.method === 'GET':
                    return APIHandler.handleGetSettings(req, res);
                case apiPath === 'settings' && req.method === 'POST':
                    return APIHandler.handleSaveSettings(req, res);
                
                default:
                    return false;
            }
        } catch (error) {
            Logger.error(`API Error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
            return true;
        }
    }

    // File handlers
    static async handleListFiles(req, res) {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const dir = urlObj.searchParams.get('dir') || '/';
        const files = vfs.listFiles(dir);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ files }));
        return true;
    }

    static async handleReadFile(req, res) {
        const body = await APIHandler.parseBody(req);
        const content = vfs.readFile(body.path);
        if (content === null) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return true;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ path: body.path, content }));
        return true;
    }

    static async handleWriteFile(req, res) {
        const body = await APIHandler.parseBody(req);
        if (!body.path || body.content === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing path or content' }));
            return true;
        }
        vfs.writeFile(body.path, body.content);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: body.path }));
        return true;
    }

    static async handleDeleteFile(req, res) {
        const body = await APIHandler.parseBody(req);
        const deleted = vfs.deleteFile(body.path);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: deleted }));
        return true;
    }

    static async handleSearchFiles(req, res) {
        const body = await APIHandler.parseBody(req);
        const results = vfs.searchFiles(body.query || '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results, count: results.length }));
        return true;
    }

    static async handleFileStats(req, res) {
        const stats = vfs.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return true;
    }

    // Project handlers
    static async handleExportProject(req, res) {
        const project = {
            name: 'NexusCode Project',
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            files: []
        };
        
        for (const [filePath, content] of vfs.files) {
            project.files.push({ path: filePath, content });
        }
        
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="nexuscode-project.json"'
        });
        res.end(JSON.stringify(project, null, 2));
        return true;
    }

    static async handleImportProject(req, res) {
        const body = await APIHandler.parseBody(req);
        if (body.files && Array.isArray(body.files)) {
            for (const file of body.files) {
                if (file.path && file.content !== undefined) {
                    vfs.writeFile(file.path, file.content);
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: body.files.length }));
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid project data' }));
        }
        return true;
    }

    static async handleCreateProject(req, res) {
        const body = await APIHandler.parseBody(req);
        const projectName = body.name || 'new-project';
        const template = body.template || 'html';
        
        const templates = {
            html: {
                'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>' + projectName + '</title>\n</head>\n<body>\n    <h1>Welcome</h1>\n</body>\n</html>',
                'styles.css': 'body { font-family: sans-serif; margin: 20px; }',
                'script.js': 'console.log("Project ready");'
            },
            react: {
                'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>' + projectName + '</title>\n</head>\n<body>\n    <div id="root"></div>\n    <script src="app.js"></script>\n</body>\n</html>',
                'app.js': '// React App\nconst App = () => {\n    return "<h1>Hello React!</h1>";\n};\nconsole.log(App());'
            }
        };
        
        const files = templates[template] || templates.html;
        for (const [name, content] of Object.entries(files)) {
            vfs.writeFile(`/home/user/${name}`, content);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, name: projectName, template }));
        return true;
    }

    // Terminal handlers
    static async handleCreateTerminal(req, res) {
        const sessionId = store.createTerminalSession();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessionId }));
        return true;
    }

    static async handleTerminalExecute(req, res) {
        const body = await APIHandler.parseBody(req);
        const command = body.command || '';
        const sessionId = body.sessionId;
        
        const session = sessionId ? store.getTerminalSession(sessionId) : null;
        const cwd = session ? session.cwd : '/home/user';
        
        // Simulate command execution
        const result = APIHandler.executeTerminalCommand(command, cwd, session);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return true;
    }

    static executeTerminalCommand(command, cwd, session) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'ls':
                const files = vfs.listFiles(cwd);
                return { output: files.map(f => f.type === 'directory' ? `\x1b[34m${f.name}/\x1b[0m` : f.name).join('  '), type: 'output' };
            case 'pwd':
                return { output: cwd, type: 'output' };
            case 'cat':
                if (args[0]) {
                    const content = vfs.readFile(cwd + '/' + args[0]) || vfs.readFile(args[0]);
                    return { output: content || 'File not found', type: content ? 'output' : 'error' };
                }
                return { output: 'Usage: cat <file>', type: 'error' };
            case 'echo':
                return { output: args.join(' '), type: 'output' };
            case 'whoami':
                return { output: 'developer', type: 'output' };
            case 'date':
                return { output: new Date().toString(), type: 'output' };
            case 'help':
                return { output: 'Available commands: ls, pwd, cat, echo, whoami, date, clear, help, stats', type: 'output' };
            case 'clear':
                return { output: '', type: 'clear' };
            case 'stats':
                const stats = vfs.getStats();
                return { output: `Files: ${stats.totalFiles}\nLines: ${stats.totalLines}\nSize: ${(stats.totalSize / 1024).toFixed(1)} KB`, type: 'output' };
            default:
                return { output: `Command not found: ${cmd}`, type: 'error' };
        }
    }

    // System handlers
    static async handleSystemInfo(req, res) {
        const info = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            pid: process.pid,
            serverTime: new Date().toISOString(),
            version: '2.0.0'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return true;
    }

    static async handlePing(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ pong: true, time: Date.now() }));
        return true;
    }

    // Session handler
    static async handleCreateSession(req, res) {
        const sessionId = store.createSession();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sessionId }));
        return true;
    }

    // Templates handler
    static async handleGetTemplates(req, res) {
        const templates = [
            { id: 'html5', name: 'HTML5 Boilerplate', icon: '🌐', tags: ['html', 'starter'] },
            { id: 'react', name: 'React App', icon: '⚛️', tags: ['react', 'spa'] },
            { id: 'dashboard', name: 'Dashboard', icon: '📊', tags: ['dashboard', 'admin'] },
            { id: 'portfolio', name: 'Portfolio', icon: '🎨', tags: ['portfolio', 'personal'] },
            { id: 'landing', name: 'Landing Page', icon: '🚀', tags: ['landing', 'marketing'] }
        ];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ templates }));
        return true;
    }

    // Settings handlers
    static async handleGetSettings(req, res) {
        const settings = store.get('settings') || {
            theme: 'dark',
            fontSize: 14,
            tabSize: 4,
            autoSave: true,
            minimap: true
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(settings));
        return true;
    }

    static async handleSaveSettings(req, res) {
        const body = await APIHandler.parseBody(req);
        store.set('settings', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return true;
    }

    // Helper to parse request body
    static parseBody(req) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(data || '{}'));
                } catch {
                    resolve({});
                }
            });
            req.on('error', reject);
        });
    }
}

// ============================================
// STATIC FILE SERVER
// ============================================
class StaticFileServer {
    
    static async serve(req, res, pathname) {
        // Determine which directory to serve from
        let filePath;
        
        // Check dist first, then root
        const distPath = path.join(CONFIG.distDir, pathname);
        const rootPath = path.join(CONFIG.rootDir, pathname);
        
        if (fs.existsSync(distPath)) {
            filePath = distPath;
        } else if (fs.existsSync(rootPath)) {
            filePath = rootPath;
        } else {
            // Try adding .html extension
            const htmlDistPath = path.join(CONFIG.distDir, pathname + '.html');
            const htmlRootPath = path.join(CONFIG.rootDir, pathname + '.html');
            
            if (fs.existsSync(htmlDistPath)) {
                filePath = htmlDistPath;
            } else if (fs.existsSync(htmlRootPath)) {
                filePath = htmlRootPath;
            } else {
                return false;
            }
        }
        
        try {
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Try index.html in directory
                const indexPath = path.join(filePath, 'index.html');
                if (fs.existsSync(indexPath)) {
                    filePath = indexPath;
                } else if (fs.existsSync(path.join(filePath, 'home.html'))) {
                    filePath = path.join(filePath, 'home.html');
                } else {
                    // Directory listing
                    return StaticFileServer.serveDirectoryListing(req, res, filePath, pathname);
                }
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
            
            // Support range requests for media
            const fileSize = fs.statSync(filePath).size;
            const range = req.headers.range;
            
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': mimeType
                });
                
                const stream = fs.createReadStream(filePath, { start, end });
                stream.pipe(res);
                stream.on('error', () => {
                    res.writeHead(500);
                    res.end('Stream error');
                });
            } else {
                res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Content-Length': fileSize,
                    'Cache-Control': 'public, max-age=3600'
                });
                
                const stream = fs.createReadStream(filePath);
                stream.pipe(res);
                stream.on('error', () => {
                    res.writeHead(500);
                    res.end('Stream error');
                });
            }
            
            return true;
        } catch (error) {
            Logger.error(`File serve error: ${error.message}`);
            return false;
        }
    }

    static async serveDirectoryListing(req, res, dirPath, pathname) {
        const files = fs.readdirSync(dirPath);
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Index of ${pathname}</title>
    <style>
        body { font-family: monospace; background: #1e1e1e; color: #ccc; padding: 20px; }
        h1 { color: #58a6ff; }
        a { color: #58a6ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .file { padding: 4px 0; }
        .dir { color: #3fb950; }
    </style>
</head>
<body>
    <h1>📁 Index of ${pathname}</h1>
    <hr>
    ${pathname !== '/' ? '<div class="file"><a href="../">📁 ../</a></div>' : ''}
    ${files.map(f => {
        const isDir = fs.statSync(path.join(dirPath, f)).isDirectory();
        return `<div class="file ${isDir ? 'dir' : ''}"><a href="${f}${isDir ? '/' : ''}">${isDir ? '📁' : '📄'} ${f}${isDir ? '/' : ''}</a></div>`;
    }).join('\n')}
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return true;
    }
}

// ============================================
// ROUTER
// ============================================
class Router {
    static async handle(req, res) {
        const parsedUrl = url.parse(req.url);
        const pathname = parsedUrl.pathname === '/' ? '/home.html' : parsedUrl.pathname;
        
        Logger.debug(`${req.method} ${pathname}`);
        
        try {
            // API routes
            if (pathname.startsWith('/api/')) {
                const handled = await APIHandler.handle(req, res, pathname);
                if (handled) {
                    Logger.request(req.method, pathname, res.statusCode);
                    return;
                }
            }
            
            // Static files
            const served = await StaticFileServer.serve(req, res, pathname);
            if (served) {
                Logger.request(req.method, pathname, res.statusCode);
                return;
            }
            
            // 404 - Serve home.html as fallback
            const homePath = path.join(CONFIG.distDir, 'home.html');
            if (fs.existsSync(homePath)) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                fs.createReadStream(homePath).pipe(res);
                Logger.request(req.method, pathname, 200);
                return;
            }
            
            // True 404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<!DOCTYPE html>
<html>
<head><title>404 - Not Found</title></head>
<body style="background:#1e1e1e;color:#ccc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">
<div>
    <h1 style="font-size:72px;color:#58a6ff;">404</h1>
    <p>Page not found: ${pathname}</p>
    <a href="/home.html" style="color:#58a6ff;">🏠 Go Home</a>
</div>
</body>
</html>`);
            Logger.request(req.method, pathname, 404);
            
        } catch (error) {
            Logger.error(`Router error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Internal Server Error</h1>');
            Logger.request(req.method, pathname, 500);
        }
    }
}

// ============================================
// SERVER SETUP
// ============================================
const server = http.createServer((req, res) => {
    Router.handle(req, res);
});

// ============================================
// WEBSOCKET SUPPORT (for terminal, live preview)
// ============================================
if (CONFIG.enableWebSocket) {
    server.on('upgrade', (req, socket, head) => {
        if (req.headers['upgrade'] !== 'websocket') {
            socket.destroy();
            return;
        }
        
        // Simple WebSocket implementation
        const key = req.headers['sec-websocket-key'];
        const acceptKey = crypto
            .createHash('sha1')
            .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
            .digest('base64');
        
        socket.write(
            'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            'Sec-WebSocket-Accept: ' + acceptKey + '\r\n\r\n'
        );
        
        Logger.info('WebSocket connection established');
        
        const terminalSession = store.createTerminalSession();
        
        socket.on('data', (buffer) => {
            try {
                // Simple frame parsing
                const opcode = buffer[0] & 0x0f;
                
                if (opcode === 0x8) {
                    socket.end();
                    return;
                }
                
                if (opcode === 0x1) {
                    const masked = (buffer[1] & 0x80) !== 0;
                    let payloadLength = buffer[1] & 0x7f;
                    let offset = 2;
                    
                    if (payloadLength === 126) {
                        payloadLength = buffer.readUInt16BE(2);
                        offset = 4;
                    } else if (payloadLength === 127) {
                        payloadLength = Number(buffer.readBigUInt64BE(2));
                        offset = 10;
                    }
                    
                    let mask = null;
                    if (masked) {
                        mask = buffer.slice(offset, offset + 4);
                        offset += 4;
                    }
                    
                    let payload = buffer.slice(offset, offset + payloadLength);
                    
                    if (mask) {
                        for (let i = 0; i < payload.length; i++) {
                            payload[i] ^= mask[i % 4];
                        }
                    }
                    
                    const message = payload.toString('utf8');
                    Logger.debug(`WS message: ${message}`);
                    
                    // Execute command
                    const result = APIHandler.executeTerminalCommand(message, '/home/user', store.getTerminalSession(terminalSession));
                    
                    // Send response
                    const response = JSON.stringify(result);
                    const responseBuffer = Buffer.from(response);
                    
                    const frame = Buffer.alloc(2 + responseBuffer.length);
                    frame[0] = 0x81; // Text frame
                    frame[1] = responseBuffer.length;
                    responseBuffer.copy(frame, 2);
                    
                    socket.write(frame);
                }
            } catch (e) {
                Logger.error(`WebSocket error: ${e.message}`);
            }
        });
        
        socket.on('end', () => {
            Logger.info('WebSocket connection closed');
        });
    });
}

// ============================================
// START SERVER
// ============================================
server.listen(CONFIG.port, CONFIG.host, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║        🚀 NEXUSCODE STUDIO SERVER           ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  🌐 Server:   http://${CONFIG.host}:${CONFIG.port}              ║`);
    console.log(`║  🏠 Home:     http://localhost:${CONFIG.port}/home.html   ║`);
    console.log(`║  ✏️  Editor:   http://localhost:${CONFIG.port}/index.html  ║`);
    console.log(`║  ⬛ Terminal: http://localhost:${CONFIG.port}/terminal/terminal.html ║`);
    console.log(`║  📊 API:      http://localhost:${CONFIG.port}/api/         ║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  📁 API Endpoints:                          ║');
    console.log('║    GET  /api/files?dir=/                    ║');
    console.log('║    POST /api/files/read                     ║');
    console.log('║    POST /api/files/write                    ║');
    console.log('║    POST /api/files/search                   ║');
    console.log('║    GET  /api/files/stats                    ║');
    console.log('║    POST /api/terminal/execute               ║');
    console.log('║    GET  /api/templates                      ║');
    console.log('║    GET  /api/settings                       ║');
    console.log('║    GET  /api/system/info                    ║');
    console.log('║    GET  /api/project/export                 ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    Logger.info(`Server running on port ${CONFIG.port}`);
    Logger.info('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    Logger.info('Shutting down...');
    server.close(() => {
        Logger.info('Server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    Logger.info('Shutting down...');
    server.close(() => {
        Logger.info('Server stopped');
        process.exit(0);
    });
});

// Export for testing
module.exports = { server, CONFIG, APIHandler, StaticFileServer, Router, vfs, store };
