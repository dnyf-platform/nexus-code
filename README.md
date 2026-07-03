# 🚀 NexusCode Studio IDE

**Production-Grade Browser IDE for Android & Web**

<div align="center">

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/dnyf-platform/nexus-code/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web%20%7C%20PWA-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Made with Love](https://img.shields.io/badge/made%20with-❤️-red.svg)]()

**🌐 [Live Demo](https://dnyf-platform.github.io/nexus-code/)**

</div>

---

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/1E1E1E/FFFFFF?text=NexusCode+Studio+IDE" alt="NexusCode Screenshot" width="800">
</div>

---

## ✨ Features

### 📝 Code Editor
- **Syntax highlighting** for HTML, CSS, JavaScript, Java, XML, JSON, Markdown
- **Multi-tab support** with drag-to-reorder
- **Line numbers** with active line highlight
- **Auto-save** to localStorage
- **Undo/Redo** with history stack
- **Auto-close brackets** & quotes
- **Tab key** inserts 4 spaces
- **Word wrap** toggle
- **Minimap** code overview

### 👁 Live Preview
- **Real-time HTML/CSS/JS** rendering
- **Device emulators** (Pixel 7, Tablet, Desktop)
- **CSS injection** into preview
- **JavaScript** with console capture
- **Auto-refresh** on file change
- **Fullscreen mode**
- **Open in new tab**

### ⬛ Terminal
- **25+ built-in commands** (ls, cat, cd, git, node, npm, python, etc.)
- **Virtual file system** with directories
- **Command history** with persistence
- **Tab autocomplete**
- **Virtual keyboard** toolbar
- **Copy/Paste** support
- **Theme support**

### 📊 Dashboard
- **Project statistics** (files, lines, size, errors)
- **Performance meters** (Memory, Storage, CPU)
- **Recent activity** timeline
- **Quick actions** panel
- **Project info** card

### ⎇ Git Manager
- **Stage/Unstage** individual files
- **Commit** with message (Ctrl+Enter)
- **Branch switching** & creation
- **Push/Pull/Fetch** operations
- **Stash** save/apply/drop
- **Commit history** with graph
- **Remote** management

### 📋 Templates
- **12+ starter templates** (HTML5, React, Vue, Dashboard, Portfolio, Landing, Blog, PWA, API Docs, E-Commerce, Chat, Auth)
- **Category filters** (Web, Framework, Design, Mobile, Backend)
- **Preview modal** with code view
- **One-click apply**
- **Search** by name or tag

### 🧩 Plugins
- **10 plugins** with enable/disable
- **Per-plugin settings**
- **Stats dashboard** (Total, Active, Inactive)
- **Filter by category**
- **Reinstall** support
- **Marketplace** (coming soon)

### ⚙ Settings
- **7 settings panels** (General, Editor, Appearance, Terminal, Git, Shortcuts, About)
- **Material toggle switches**
- **Theme switcher** (Dark/Light)
- **14 keyboard shortcuts** reference
- **Reset to defaults**

### 🔍 Search
- **Full-text search** across 6 file types
- **Case-sensitive** toggle
- **Regex** support
- **Recent searches** history
- **Result highlighting**
- **Click to open** in editor

---

## 🗂 Project Structure

```

NexusCode/
├── 📄 home.html                    # 🏠 Main launcher
├── 📄 index.html                   # ✏️ Full code editor
├── 📄 run.html                     # ▶ Run & Preview
├── 📄 dashboard.html               # 📊 Project dashboard
├── 📄 settings.html                # ⚙ Settings manager
├── 📄 templates.html               # 📋 Template library
├── 📄 plugins.html                 # 🧩 Plugin manager
├── 📄 search.html                  # 🔍 Global search
├── 📄 git.html                     # ⎇ Git manager
│
├── 📁 css/
│   └── unified.css                 # 🎨 Material Design system
│
├── 📁 js/
│   ├── 📁 core/                    # 🔧 Core system
│   │   ├── eventBus.js             #    Pub/Sub events
│   │   ├── reactiveState.js        #    State management
│   │   ├── renderEngine.js         #    DOM rendering
│   │   └── reactiveBootstrap.js    #    App initialization
│   ├── 📁 editor/                  # ✏️ Editor engine
│   │   ├── editorCore.js           #    Main controller
│   │   ├── cursorManager.js        #    Cursor tracking
│   │   ├── selectionManager.js     #    Selection handling
│   │   └── inputHandler.js         #    Input processing
│   ├── 📁 dashboard/               # 📊 Dashboard
│   ├── 📁 templates/               # 📋 Templates
│   ├── 📁 settings/                # ⚙ Settings
│   ├── 📁 plugins/                 # 🧩 Plugins
│   ├── fileManager.js              # 📁 File operations
│   ├── searchEngine.js             # 🔍 Search engine
│   ├── previewEngine.js            # 👁 Preview engine
│   ├── recentProjects.js           # 🕒 Recent projects
│   └── workspaceManager.js         # 🔗 Workspace coordinator
│
├── 📁 terminal/                    # ⬛ Standalone terminal
│   ├── terminal.html
│   ├── terminal.css
│   └── js/ (10 modules)
│
├── 📁 android-app/                 # 📱 Android APK project
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/nexuscode/
│       │   └── MainActivity.java
│       └── assets/www/build/
│
├── 🚀 server.js                    # Dev server
├── 🚀 server.prod.js              # Production server v3.0
├── 📦 package.json                 # NPM config
├── 🐳 Dockerfile                   # Docker build
├── 🐳 docker-compose.yml           # Docker compose
├── ⚙ ecosystem.config.js          # PM2 config
└── 📄 README.md                    # This file

```

---

## 🚀 Quick Start

### Option 1: Open Directly
```bash
# Open in Chrome/Edge (no server needed)
open index.html
# or
xdg-open home.html
```

Option 2: Local Server

```bash
# Node.js production server
node server.prod.js

# Or Python simple server
python3 -m http.server 8080

# Or PM2 for production
pm2 start ecosystem.config.js
```

Option 3: Docker

```bash
docker-compose up -d
```

Option 4: GitHub Pages

Already deployed at:
🌐 https://dnyf-platform.github.io/nexus-code/

---

⌨ Keyboard Shortcuts

Shortcut Action
Ctrl+S Save file
Ctrl+Z Undo
Ctrl+Y Redo
Ctrl+F Search
Ctrl+H Replace
Ctrl+B Toggle sidebar
 Ctrl+`  Toggle terminal
Ctrl+P Command palette
Ctrl+D Dashboard
Ctrl+, Settings
Ctrl+N New file
Ctrl+W Close tab
Ctrl+Enter Commit (Git)
F5 Refresh preview

---

📡 API Endpoints (server.prod.js)

Method Endpoint Description
GET /api/system/ping Health check
GET /api/system/info System information
GET /api/system/metrics Performance metrics
POST /api/auth/login User login
POST /api/auth/register User registration
GET /api/files List files
POST /api/files/read Read file
POST /api/files/write Write file
POST /api/files/search Search files
POST /api/terminal/execute Execute command
GET /api/templates Get templates
GET /api/settings Get settings
POST /api/settings Save settings
GET /api/project/export Export project
POST /api/project/import Import project
GET /api/project/backup Create backup

---

🛠 Tech Stack

Category Technology
Frontend HTML5, CSS3 (Material Design 3), Vanilla JavaScript (ES6+)
Backend Node.js, HTTP/HTTPS, WebSocket
Storage localStorage, JSON file-based, in-memory cache
PWA Service Worker, Web App Manifest
Android WebView, Java, Gradle
DevOps Docker, PM2, GitHub Pages, GitHub Actions
Design Material Design 3, CSS Grid, Flexbox, Custom Properties

---

📱 Android APK

The project includes a full Android wrapper in android-app/:

```bash
# Build APK
cd android-app
./gradlew assembleDebug

# APK location
app/build/outputs/apk/debug/app-debug.apk
```

Or open android-app/ in Android Studio and build from there.

---

🔧 Production Server Features (v3.0)

Feature Implementation
Clustering Multi-CPU with auto-restart
Authentication JWT with token blacklist
Rate Limiting IP-based, configurable window
Caching LRU with eviction policy
Database Atomic JSON writes (tmp + rename)
WebSocket Frame decoding, terminal sessions
Compression Gzip with configurable level
Security CORS, XSS headers, input validation
Logging Structured with file rotation
Backup Automatic project backups

---

🎨 Themes

Theme Class Description
🌙 Dark data-theme="dark" Material Dark (default)
☀ Light data-theme="light" Material Light

---

📄 License

MIT License - See LICENSE file

---

🤝 Contributing

1. Fork the repository
2. Create your feature branch: git checkout -b feature/amazing
3. Commit your changes: git commit -m 'Add amazing feature'
4. Push to the branch: git push origin feature/amazing
5. Open a Pull Request

---

🌟 Star History

If you find this project useful, please consider giving it a ⭐!

---

📬 Contact

· GitHub: @dnyf-platform
· Repository: nexus-code
· Live Demo: GitHub Pages

---

<div align="center">
  <sub>Built with ❤️ by dnyf-platform</sub>
</div>
