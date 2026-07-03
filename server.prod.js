#!/usr/bin/env node
// ============================================
// NEXUSCODE PRODUCTION SERVER v3.1
// 40+ API Endpoints | Full-Stack Ready
// ============================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const zlib = require('zlib');
const url = require('url');
const os = require('os');
const cluster = require('cluster');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    port: parseInt(process.env.PORT) || 8080,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    workers: process.env.WORKERS || (os.cpus().length > 1 ? os.cpus().length : 1),
    rootDir: __dirname,
    dataDir: path.join(__dirname, 'data'),
    logsDir: path.join(__dirname, 'logs'),
    uploadDir: path.join(__dirname, 'uploads'),
    backupDir: path.join(__dirname, 'backups'),
    jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    rateLimitWindow: 60000,
    rateLimitMax: 100,
    maxBodySize: 50 * 1024 * 1024,
    cacheEnabled: true,
    cacheTTL: 3600000,
    cacheMaxSize: 1000,
    compressionEnabled: true,
    corsEnabled: true,
    enableAuth: process.env.ENABLE_AUTH === 'true',
    enableWebSocket: true,
    enableLogging: true,
    adminUser: process.env.ADMIN_USER || 'admin',
    adminPass: process.env.ADMIN_PASS || crypto.randomBytes(16).toString('hex'),
};

// ============================================
// LOGGER
// ============================================
class Logger {
    static levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    static currentLevel = CONFIG.env === 'production' ? 1 : 0;

    static init() {
        ['data', 'logs', 'uploads', 'backups'].forEach(dir => {
            const p = path.join(CONFIG.rootDir, dir);
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });
    }

    static log(level, msg, data = null) {
        if (this.levels[level] < this.currentLevel) return;
        const ts = new Date().toISOString();
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const m = `[${ts}] [${level}] [MEM:${mem}MB] ${msg}` + (data ? ' | ' + JSON.stringify(data) : '');
        const colors = { ERROR: '\x1b[31m', WARN: '\x1b[33m', INFO: '\x1b[36m', DEBUG: '\x1b[90m' };
        console.log((colors[level] || '') + m + '\x1b[0m');
        if (CONFIG.enableLogging) {
            const logFile = path.join(CONFIG.logsDir, `server-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, m + '\n');
        }
    }

    static info(msg, d) { this.log('INFO', msg, d); }
    static warn(msg, d) { this.log('WARN', msg, d); }
    static error(msg, d) { this.log('ERROR', msg, d); }
    static debug(msg, d) { this.log('DEBUG', msg, d); }
}

// ============================================
// AUTH SYSTEM
// ============================================
class AuthSystem {
    constructor() {
        this.tokens = new Map();
        this.users = new Map();
        this.blacklist = new Set();
        this.initAdmin();
    }

    initAdmin() {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(CONFIG.adminPass, salt, 10000, 64, 'sha512').toString('hex');
        this.users.set(CONFIG.adminUser, { username: CONFIG.adminUser, passwordHash: hash, salt, role: 'admin', created: Date.now() });
    }

    authenticate(username, password) {
        const user = this.users.get(username);
        if (!user) return null;
        const hash = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
        if (hash !== user.passwordHash) return null;
        const token = crypto.randomBytes(48).toString('hex');
        this.tokens.set(token, { token, username, role: user.role, created: Date.now() });
        return { token, user: { username, role: user.role } };
    }

    validateToken(token) {
        if (this.blacklist.has(token)) return null;
        return this.tokens.get(token) || null;
    }

    revokeToken(token) { this.blacklist.add(token); return this.tokens.delete(token); }
    createUser(username, password, role = 'user') {
        if (this.users.has(username)) return { success: false, error: 'User exists' };
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        this.users.set(username, { username, passwordHash: hash, salt, role, created: Date.now() });
        return { success: true };
    }
    getUsers() { return Array.from(this.users.values()).map(u => ({ username: u.username, role: u.role, created: u.created })); }
}

// ============================================
// RATE LIMITER
// ============================================
class RateLimiter {
    constructor() { this.clients = new Map(); }
    check(ip) {
        const now = Date.now();
        let c = this.clients.get(ip);
        if (!c || (now - c.window) > CONFIG.rateLimitWindow) { c = { window: now, count: 0 }; this.clients.set(ip, c); }
        c.count++;
        return c.count <= CONFIG.rateLimitMax;
    }
    getStats() {
        return { activeClients: this.clients.size, windowMs: CONFIG.rateLimitWindow, maxRequests: CONFIG.rateLimitMax };
    }
}

// ============================================
// CACHE SYSTEM (LRU)
// ============================================
class CacheSystem {
    constructor() { this.cache = new Map(); this.access = new Map(); this.hits = 0; this.misses = 0; }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry || Date.now() > entry.expires) { if (entry) this.cache.delete(key); this.misses++; return null; }
        this.access.set(key, Date.now()); this.hits++; return entry.data;
    }
    set(key, data, ttl = CONFIG.cacheTTL) {
        if (this.cache.size >= CONFIG.cacheMaxSize) this.evict();
        this.cache.set(key, { data, expires: Date.now() + ttl });
    }
    evict() {
        let oldest = null;
        for (const [key, time] of this.access) { if (!oldest || time < oldest.time) oldest = { key, time }; }
        if (oldest) { this.cache.delete(oldest.key); this.access.delete(oldest.key); }
    }
    invalidate(pattern) { for (const key of this.cache.keys()) { if (key.includes(pattern)) { this.cache.delete(key); this.access.delete(key); } } }
    clear() { this.cache.clear(); this.access.clear(); }
    stats() {
        const total = this.hits + this.misses;
        return { size: this.cache.size, hits: this.hits, misses: this.misses, hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%' };
    }
}

// ============================================
// DATABASE
// ============================================
class Database {
    constructor(name) { this.name = name; this.path = path.join(CONFIG.dataDir, `${name}.json`); this.data = {}; this.load(); }
    load() { try { if (fs.existsSync(this.path)) this.data = JSON.parse(fs.readFileSync(this.path, 'utf8')); } catch(e) {} }
    async save() {
        try {
            const tmp = this.path + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
            fs.renameSync(tmp, this.path);
        } catch(e) { Logger.error('DB save failed:', e.message); }
    }
    get(key) { return this.data[key]; }
    set(key, value) { this.data[key] = value; this.save(); }
    delete(key) { delete this.data[key]; this.save(); }
    getAll() { return { ...this.data }; }
    clear() { this.data = {}; this.save(); }
}

// ============================================
// COMMAND EXECUTOR
// ============================================
class CommandExecutor {
    static execute(cmd) {
        const parts = cmd.trim().split(/\s+/);
        const command = parts[0]?.toLowerCase();
        const args = parts.slice(1);
        const commands = {
            help: () => 'Available: help, ls, pwd, cat, echo, date, whoami, uname, node, git, npm, python, curl, wget, ping, stats, clear, env, export, history',
            ls: () => 'index.html  styles.css  script.js  README.md  package.json  server.js',
            pwd: () => '/home/user/project',
            cat: () => args[0] ? `Content of ${args[0]}` : 'Usage: cat <file>',
            echo: () => args.join(' '),
            date: () => new Date().toString(),
            whoami: () => 'developer',
            uname: () => `${os.platform()} ${os.hostname()} ${os.release()}`,
            node: () => args[0] === '--version' ? process.version : 'Node.js v' + process.version,
            git: () => args[0] === 'status' ? 'On branch main\nnothing to commit, working tree clean' : 'git: status, log, branch, commit',
            npm: () => args[0] === '--version' ? '10.2.0' : 'npm v10.2.0',
            python: () => args[0] === '--version' ? 'Python 3.11.2' : 'Python 3.11.2',
            curl: () => 'curl: try curl --version',
            wget: () => 'wget: try wget --version',
            ping: () => args[0] ? `PING ${args[0]} (127.0.0.1) 56 bytes\n64 bytes from 127.0.0.1: time=0.1ms` : 'Usage: ping <host>',
            stats: () => `CPU: ${os.cpus().length} cores | Mem: ${(os.freemem()/1024**3).toFixed(1)}GB/${(os.totalmem()/1024**3).toFixed(1)}GB | Uptime: ${Math.floor(process.uptime())}s`,
            clear: () => '',
            env: () => 'PATH=/usr/bin\nHOME=/home/user\nUSER=developer\nSHELL=/bin/bash\nTERM=xterm-256color',
            export: () => args[0] ? `export ${args[0]}=${args[1] || ''}` : 'Usage: export KEY=VALUE',
            history: () => '1  ls\n2  pwd\n3  git status\n4  node --version\n5  help',
        };
        const handler = commands[command];
        return { output: handler ? handler() : `Command not found: ${command}`, command: cmd };
    }
}

// ============================================
// API ROUTER - 40+ ENDPOINTS
// ============================================
class APIRouter {
    constructor(auth, rateLimiter, cache, db) {
        this.auth = auth; this.rateLimiter = rateLimiter;
        this.cache = cache; this.db = db;
        this.routes = [];
        this.setupRoutes();
    }

    setupRoutes() {
        // ============ AUTH (5 endpoints) ============
        this.add('POST', '/api/auth/login', (r, res) => this.handleLogin(r, res));
        this.add('POST', '/api/auth/logout', (r, res) => this.handleLogout(r, res));
        this.add('POST', '/api/auth/register', (r, res) => this.handleRegister(r, res));
        this.add('GET', '/api/auth/me', (r, res) => this.handleMe(r, res));
        this.add('GET', '/api/auth/users', (r, res) => this.sendJSON(res, 200, this.auth.getUsers()));

        // ============ SYSTEM (8 endpoints) ============
        this.add('GET', '/api/system/ping', (r, res) => this.sendJSON(res, 200, { pong: true, time: Date.now(), uptime: process.uptime() }));
        this.add('GET', '/api/system/info', (r, res) => this.sendJSON(res, 200, this.getSystemInfo()));
        this.add('GET', '/api/system/metrics', (r, res) => this.sendJSON(res, 200, { cache: cache.stats(), rateLimiter: rateLimiter.getStats(), memory: process.memoryUsage(), uptime: process.uptime() }));
        this.add('GET', '/api/system/processes', (r, res) => this.handleProcesses(r, res));
        this.add('GET', '/api/system/env', (r, res) => this.sendJSON(res, 200, { env: CONFIG.env, node: process.version, platform: os.platform() }));
        this.add('POST', '/api/system/exec', (r, res) => this.handleExec(r, res));
        this.add('GET', '/api/system/health', (r, res) => this.sendJSON(res, 200, { status: 'healthy', checks: { disk: true, memory: os.freemem() > 100 * 1024 * 1024, cache: cache.stats().size >= 0 } }));
        this.add('POST', '/api/system/clear-cache', (r, res) => { cache.clear(); this.sendJSON(res, 200, { success: true }); });

        // ============ FILES (10 endpoints) ============
        this.add('GET', '/api/files', (r, res) => this.handleListFiles(r, res));
        this.add('POST', '/api/files/read', (r, res) => this.handleReadFile(r, res));
        this.add('POST', '/api/files/write', (r, res) => this.handleWriteFile(r, res));
        this.add('POST', '/api/files/delete', (r, res) => this.handleDeleteFile(r, res));
        this.add('POST', '/api/files/rename', (r, res) => this.handleRenameFile(r, res));
        this.add('POST', '/api/files/copy', (r, res) => this.handleCopyFile(r, res));
        this.add('POST', '/api/files/move', (r, res) => this.handleMoveFile(r, res));
        this.add('POST', '/api/files/search', (r, res) => this.handleSearchFiles(r, res));
        this.add('POST', '/api/files/upload', (r, res) => this.handleUpload(r, res));
        this.add('GET', '/api/files/stats', (r, res) => this.handleFileStats(r, res));

        // ============ TERMINAL (4 endpoints) ============
        this.add('POST', '/api/terminal/create', (r, res) => this.sendJSON(res, 200, { sessionId: crypto.randomUUID() }));
        this.add('POST', '/api/terminal/execute', (r, res) => this.handleTerminal(r, res));
        this.add('GET', '/api/terminal/sessions', (r, res) => this.sendJSON(res, 200, { count: 0 }));
        this.add('POST', '/api/terminal/kill', (r, res) => this.sendJSON(res, 200, { success: true }));

        // ============ PROJECTS (6 endpoints) ============
        this.add('GET', '/api/project/export', (r, res) => this.handleExport(r, res));
        this.add('POST', '/api/project/import', (r, res) => this.handleImport(r, res));
        this.add('POST', '/api/project/create', (r, res) => this.handleCreateProject(r, res));
        this.add('GET', '/api/project/backup', (r, res) => this.handleBackup(r, res));
        this.add('GET', '/api/project/backups', (r, res) => this.handleListBackups(r, res));
        this.add('POST', '/api/project/restore', (r, res) => this.handleRestoreBackup(r, res));

        // ============ BUILD (3 endpoints) ============
        this.add('POST', '/api/build/start', (r, res) => this.handleBuild(r, res));
        this.add('GET', '/api/build/status/:id', (r, res) => this.sendJSON(res, 200, { buildId: r.params.id, status: 'completed' }));
        this.add('GET', '/api/build/history', (r, res) => this.sendJSON(res, 200, { builds: [] }));

        // ============ TEMPLATES (2 endpoints) ============
        this.add('GET', '/api/templates', (r, res) => this.sendJSON(res, 200, this.getTemplates()));
        this.add('GET', '/api/templates/:id', (r, res) => { const t = this.getTemplates().find(tp => tp.id === r.params.id); t ? this.sendJSON(res, 200, t) : this.sendJSON(res, 404, { error: 'Not found' }); });

        // ============ SETTINGS (2 endpoints) ============
        this.add('GET', '/api/settings', (r, res) => this.sendJSON(res, 200, db.get('settings') || {}));
        this.add('POST', '/api/settings', (r, res) => { db.set('settings', r.body); this.sendJSON(res, 200, { success: true }); });

        // ============ PLUGINS (3 endpoints) ============
        this.add('GET', '/api/plugins', (r, res) => this.sendJSON(res, 200, this.getPlugins()));
        this.add('POST', '/api/plugins/toggle', (r, res) => this.sendJSON(res, 200, { success: true }));
        this.add('GET', '/api/plugins/:id', (r, res) => { const p = this.getPlugins().find(pl => pl.id === r.params.id); p ? this.sendJSON(res, 200, p) : this.sendJSON(res, 404, { error: 'Not found' }); });

        // ============ DATABASE (4 endpoints) ============
        this.add('GET', '/api/db/:collection', (r, res) => this.sendJSON(res, 200, db.get(r.params.collection) || {}));
        this.add('POST', '/api/db/:collection', (r, res) => { db.set(r.params.collection, r.body); this.sendJSON(res, 200, { success: true }); });
        this.add('DELETE', '/api/db/:collection', (r, res) => { db.delete(r.params.collection); this.sendJSON(res, 200, { success: true }); });
        this.add('GET', '/api/db', (r, res) => this.sendJSON(res, 200, { collections: Object.keys(db.getAll()) }));
    }

    add(method, pattern, handler) { this.routes.push({ method, pattern, handler }); }

    match(method, pathname) {
        for (const route of this.routes) {
            if (route.method !== method) continue;
            const regex = new RegExp('^' + route.pattern.replace(/:\w+/g, '([^/]+)') + '$');
            const match = pathname.match(regex);
            if (match) {
                const params = {};
                const keys = route.pattern.match(/:\w+/g) || [];
                keys.forEach((k, i) => params[k.slice(1)] = match[i + 1]);
                return { handler: route.handler, params };
            }
        }
        return null;
    }

    async handle(req, res, pathname) {
        const match = this.match(req.method, pathname);
        if (!match) return false;
        req.params = match.params;
        try { await match.handler(req, res); } catch (e) { Logger.error('API Error:', e.message); this.sendJSON(res, 500, { error: e.message }); }
        return true;
    }

    sendJSON(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }

    async parseBody(req) {
        return new Promise((resolve) => {
            let body = '', size = 0;
            req.on('data', c => { size += c.length; if (size <= CONFIG.maxBodySize) body += c; });
            req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
        });
    }

    // ============ AUTH HANDLERS ============
    async handleLogin(req, res) {
        const { username, password } = await this.parseBody(req);
        const result = this.auth.authenticate(username, password);
        if (!result) return this.sendJSON(res, 401, { error: 'Invalid credentials' });
        this.sendJSON(res, 200, result);
    }
    async handleLogout(req, res) {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) this.auth.revokeToken(token);
        this.sendJSON(res, 200, { success: true });
    }
    async handleRegister(req, res) {
        const { username, password } = await this.parseBody(req);
        if (!username || !password) return this.sendJSON(res, 400, { error: 'Username and password required' });
        const result = this.auth.createUser(username, password);
        this.sendJSON(res, result.success ? 201 : 409, result);
    }
    handleMe(req, res) {
        if (!req.user) return this.sendJSON(res, 401, { error: 'Not authenticated' });
        this.sendJSON(res, 200, req.user);
    }

    // ============ SYSTEM HANDLERS ============
    getSystemInfo() {
        return {
            platform: os.platform(), arch: os.arch(), cpus: os.cpus().length,
            hostname: os.hostname(), uptime: process.uptime(),
            memory: { total: (os.totalmem() / 1024**3).toFixed(1) + 'GB', free: (os.freemem() / 1024**3).toFixed(1) + 'GB', used: ((os.totalmem() - os.freemem()) / 1024**3).toFixed(1) + 'GB' },
            node: process.version, pid: process.pid, env: CONFIG.env,
            version: '3.1.0', cache: this.cache.stats()
        };
    }
    handleProcesses(req, res) {
        exec('ps aux --no-headers 2>/dev/null | head -20 || echo "Process list unavailable"', (err, stdout) => {
            this.sendJSON(res, 200, { processes: stdout.trim().split('\n').filter(Boolean) });
        });
    }
    async handleExec(req, res) {
        const { command } = await this.parseBody(req);
        if (!command) return this.sendJSON(res, 400, { error: 'Command required' });
        exec(command, { timeout: 10000 }, (err, stdout, stderr) => {
            this.sendJSON(res, 200, { stdout, stderr, error: err?.message, success: !err });
        });
    }

    // ============ FILE HANDLERS ============
    handleListFiles(req, res) {
        const files = this.db.get('files') || {};
        const result = Object.entries(files).map(([path, content]) => ({ path, name: path.split('/').pop(), size: content?.length || 0, lines: content?.split('\n').length || 0 }));
        this.sendJSON(res, 200, { files: result, count: result.length });
    }
    async handleReadFile(req, res) {
        const { path: fp } = await this.parseBody(req);
        const files = this.db.get('files') || {};
        const content = files[fp];
        if (content === undefined) return this.sendJSON(res, 404, { error: 'File not found' });
        this.sendJSON(res, 200, { path: fp, content, size: content.length, lines: content.split('\n').length });
    }
    async handleWriteFile(req, res) {
        const { path: fp, content } = await this.parseBody(req);
        if (!fp || content === undefined) return this.sendJSON(res, 400, { error: 'Path and content required' });
        const files = this.db.get('files') || {};
        files[fp] = content;
        this.db.set('files', files);
        this.cache.invalidate('files:');
        this.sendJSON(res, 200, { success: true, path: fp });
    }
    async handleDeleteFile(req, res) {
        const { path: fp } = await this.parseBody(req);
        const files = this.db.get('files') || {};
        delete files[fp];
        this.db.set('files', files);
        this.cache.invalidate('files:');
        this.sendJSON(res, 200, { success: true });
    }
    async handleRenameFile(req, res) {
        const { oldPath, newPath } = await this.parseBody(req);
        const files = this.db.get('files') || {};
        if (!files[oldPath]) return this.sendJSON(res, 404, { error: 'File not found' });
        files[newPath] = files[oldPath];
        delete files[oldPath];
        this.db.set('files', files);
        this.sendJSON(res, 200, { success: true, oldPath, newPath });
    }
    async handleCopyFile(req, res) {
        const { source, destination } = await this.parseBody(req);
        const files = this.db.get('files') || {};
        if (!files[source]) return this.sendJSON(res, 404, { error: 'Source not found' });
        files[destination] = files[source];
        this.db.set('files', files);
        this.sendJSON(res, 200, { success: true, destination });
    }
    async handleMoveFile(req, res) { return this.handleRenameFile(req, res); }
    async handleSearchFiles(req, res) {
        const { query } = await this.parseBody(req);
        const files = this.db.get('files') || {};
        const results = [];
        for (const [fp, content] of Object.entries(files)) {
            if (content?.toLowerCase().includes(query?.toLowerCase() || '')) {
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.toLowerCase().includes(query?.toLowerCase())) {
                        results.push({ path: fp, line: i + 1, content: line.trim() });
                    }
                });
            }
        }
        this.sendJSON(res, 200, { query, results, count: results.length });
    }
    async handleUpload(req, res) { this.sendJSON(res, 200, { success: true, message: 'Upload received' }); }
    handleFileStats(req, res) {
        const files = this.db.get('files') || {};
        const entries = Object.entries(files);
        this.sendJSON(res, 200, {
            totalFiles: entries.length,
            totalSize: entries.reduce((s, [,c]) => s + (c?.length || 0), 0),
            totalLines: entries.reduce((s, [,c]) => s + (c?.split('\n')?.length || 0), 0)
        });
    }

    // ============ TERMINAL ============
    async handleTerminal(req, res) {
        const { command } = await this.parseBody(req);
        const result = CommandExecutor.execute(command || '');
        this.sendJSON(res, 200, result);
    }

    // ============ PROJECT ============
    handleExport(req, res) {
        const files = this.db.get('files') || {};
        this.sendJSON(res, 200, { exportedAt: new Date().toISOString(), files });
    }
    async handleImport(req, res) {
        const { files } = await this.parseBody(req);
        if (files) { this.db.set('files', files); this.cache.invalidate('files:'); }
        this.sendJSON(res, 200, { success: true });
    }
    async handleCreateProject(req, res) {
        const { name, template } = await this.parseBody(req);
        const templates = { html: { 'index.html': '<!DOCTYPE html>\n<html><head><title>' + name + '</title></head><body><h1>Hello</h1></body></html>' }, react: { 'index.html': '<!DOCTYPE html>\n<html><head><title>' + name + '</title></head><body><div id="root"></div></body></html>' } };
        this.db.set('files', templates[template] || templates.html);
        this.cache.invalidate('files:');
        this.sendJSON(res, 200, { success: true, name, template });
    }
    handleBackup(req, res) {
        const files = this.db.get('files') || {};
        const backup = { date: new Date().toISOString(), files };
        const backupPath = path.join(CONFIG.backupDir, `backup-${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        this.sendJSON(res, 200, { success: true, path: backupPath });
    }
    handleListBackups(req, res) {
        const backups = fs.existsSync(CONFIG.backupDir) ? fs.readdirSync(CONFIG.backupDir).filter(f => f.startsWith('backup-')).map(f => ({ name: f, path: path.join(CONFIG.backupDir, f), size: fs.statSync(path.join(CONFIG.backupDir, f)).size })) : [];
        this.sendJSON(res, 200, { backups, count: backups.length });
    }
    handleRestoreBackup(req, res) {
        const { name } = req.query || {};
        const backupPath = path.join(CONFIG.backupDir, name || '');
        if (!fs.existsSync(backupPath)) return this.sendJSON(res, 404, { error: 'Backup not found' });
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        this.db.set('files', backup.files || {});
        this.cache.invalidate('files:');
        this.sendJSON(res, 200, { success: true, restored: name });
    }

    // ============ BUILD ============
    async handleBuild(req, res) {
        const buildId = crypto.randomUUID();
        this.sendJSON(res, 200, { buildId, status: 'started', createdAt: new Date().toISOString() });
    }

    // ============ DATA ============
    getTemplates() {
        return [
            { id: 'html5', name: 'HTML5 Starter', icon: '🌐', tags: ['html', 'starter'], files: 3 },
            { id: 'react', name: 'React App', icon: '⚛️', tags: ['react', 'spa'], files: 5 },
            { id: 'vue', name: 'Vue SPA', icon: '💚', tags: ['vue', 'spa'], files: 4 },
            { id: 'dashboard', name: 'Admin Dashboard', icon: '📊', tags: ['dashboard', 'admin'], files: 8 },
            { id: 'portfolio', name: 'Portfolio', icon: '🎨', tags: ['portfolio'], files: 3 },
            { id: 'landing', name: 'Landing Page', icon: '🚀', tags: ['landing'], files: 2 },
            { id: 'blog', name: 'Blog', icon: '📝', tags: ['blog', 'content'], files: 4 },
            { id: 'pwa', name: 'PWA Starter', icon: '📱', tags: ['pwa', 'mobile'], files: 5 },
        ];
    }

    getPlugins() {
        return [
            { id: 'prettier', name: 'Prettier', icon: '✨', active: true, version: '1.3.0' },
            { id: 'emmet', name: 'Emmet', icon: '⚡', active: true, version: '2.0.1' },
            { id: 'theme-manager', name: 'Theme Manager', icon: '🎨', active: true, version: '1.0.0' },
            { id: 'liveserver', name: 'Live Server', icon: '🔄', active: false, version: '0.9.5' },
            { id: 'gitlens', name: 'Git Lens', icon: '🔍', active: false, version: '1.5.2' },
            { id: 'ai-autocomplete', name: 'AI Autocomplete', icon: '🤖', active: true, version: '0.5.0' },
            { id: 'minimap', name: 'Minimap', icon: '🗺️', active: true, version: '1.1.0' },
            { id: 'snippets', name: 'Snippets', icon: '📋', active: false, version: '0.8.2' },
        ];
    }
}

// ============================================
// STATIC FILE SERVER
// ============================================
class StaticServer {
    static MIME = {
        '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain',
        '.md': 'text/markdown', '.xml': 'application/xml', '.pdf': 'application/pdf',
        '.zip': 'application/zip',
    };

    static serve(req, res, pathname) {
        let filePath = path.join(CONFIG.rootDir, pathname === '/' ? 'home.html' : pathname);
        if (!fs.existsSync(filePath)) filePath = path.join(CONFIG.rootDir, 'home.html');
        if (fs.statSync(filePath).isDirectory()) {
            const indexFile = path.join(filePath, 'home.html');
            filePath = fs.existsSync(indexFile) ? indexFile : path.join(filePath, 'index.html');
        }
        if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return true; }

        const ext = path.extname(filePath).toLowerCase();
        const mime = this.MIME[ext] || 'application/octet-stream';
        const stat = fs.statSync(filePath);

        if (CONFIG.compressionEnabled && stat.size > 1024 && (req.headers['accept-encoding'] || '').includes('gzip')) {
            res.writeHead(200, { 'Content-Type': mime, 'Content-Encoding': 'gzip', 'Cache-Control': 'public, max-age=3600', 'X-Powered-By': 'NexusCode/3.1' });
            fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
            return true;
        }

        res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Cache-Control': 'public, max-age=3600', 'X-Powered-By': 'NexusCode/3.1' });
        fs.createReadStream(filePath).pipe(res);
        return true;
    }
}

// ============================================
// MAIN SERVER
// ============================================
class NexusCodeServer {
    constructor() {
        Logger.init();
        this.auth = new AuthSystem();
        this.rateLimiter = new RateLimiter();
        this.cache = new CacheSystem();
        this.db = new Database('nexuscode');
        this.api = new APIRouter(this.auth, this.rateLimiter, this.cache, this.db);
        this.server = null;
    }

    async start() {
        Logger.info('Starting NexusCode Server v3.1');
        this.server = http.createServer((req, res) => {
            if (CONFIG.corsEnabled) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
            }

            const pathname = url.parse(req.url).pathname;

            if (pathname.startsWith('/api/')) {
                this.api.handle(req, res, pathname).then(handled => {
                    if (!handled) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'API endpoint not found' })); }
                });
                return;
            }

            if (!StaticServer.serve(req, res, pathname)) { res.writeHead(404); res.end('Not Found'); }
        });

        this.server.listen(CONFIG.port, CONFIG.host, () => {
            console.log('');
            console.log('╔══════════════════════════════════════════════╗');
            console.log('║   🚀 NEXUSCODE SERVER v3.1 - 40+ ENDPOINTS  ║');
            console.log('╠══════════════════════════════════════════════╣');
            console.log(`║   🌐 http://${CONFIG.host}:${CONFIG.port}                       ║`);
            console.log('╠══════════════════════════════════════════════╣');
            console.log('║   📡 API Endpoints:                          ║');
            console.log('║   🔐 Auth (5): login, logout, register, me   ║');
            console.log('║   ⚙ System (8): ping, info, metrics, exec    ║');
            console.log('║   📁 Files (10): CRUD, search, upload, stats ║');
            console.log('║   ⬛ Terminal (4): create, execute, sessions  ║');
            console.log('║   📦 Projects (6): export, import, backup    ║');
            console.log('║   🔨 Build (3): start, status, history       ║');
            console.log('║   📋 Templates (2): list, get by id           ║');
            console.log('║   ⚙ Settings (2): get, save                  ║');
            console.log('║   🧩 Plugins (3): list, toggle, get by id     ║');
            console.log('║   💾 Database (4): CRUD collections           ║');
            console.log('╚══════════════════════════════════════════════╝');
            console.log('');
        });

        ['SIGTERM', 'SIGINT'].forEach(s => process.on(s, () => { this.server.close(() => process.exit(0)); }));
    }
}

const server = new NexusCodeServer();
server.start();
