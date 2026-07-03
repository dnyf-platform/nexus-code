class TemplateLibrary {
    constructor() {
        this.templates = this.loadTemplates();
    }

    loadTemplates() {
        return [
            {
                id: 'html5',
                name: 'HTML5 Boilerplate',
                icon: '🌐',
                description: 'Modern HTML5 starter template with responsive design',
                tags: ['html', 'responsive', 'starter'],
                filename: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Website</h1>
        <p>Start building your amazing website!</p>
    </div>
</body>
</html>`
            },
            {
                id: 'react-app',
                name: 'React Application',
                icon: '⚛️',
                description: 'Simple React application with components',
                tags: ['react', 'javascript', 'spa'],
                filename: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>React App</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        const App = () => React.createElement('div', null,
            React.createElement('h1', null, 'Hello React!'),
            React.createElement('p', null, 'Start building your React app')
        );
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
</body>
</html>`
            },
            {
                id: 'dashboard',
                name: 'Dashboard Layout',
                icon: '📊',
                description: 'Admin dashboard with sidebar and cards',
                tags: ['dashboard', 'admin', 'layout'],
                filename: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
        .sidebar { background: #2c3e50; color: white; padding: 20px; }
        .main { padding: 20px; background: #f5f6fa; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <aside class="sidebar">
        <h2>Dashboard</h2>
        <nav>
            <p>Home</p>
            <p>Analytics</p>
            <p>Settings</p>
        </nav>
    </aside>
    <main class="main">
        <h1>Dashboard Overview</h1>
        <div class="cards">
            <div class="card"><h3>Users</h3><p>1,234</p></div>
            <div class="card"><h3>Revenue</h3><p>$5,678</p></div>
            <div class="card"><h3>Orders</h3><p>890</p></div>
        </div>
    </main>
</body>
</html>`
            },
            {
                id: 'portfolio',
                name: 'Portfolio Site',
                icon: '🎨',
                description: 'Personal portfolio website template',
                tags: ['portfolio', 'personal', 'showcase'],
                filename: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Georgia, serif; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; }
        .projects { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; padding: 50px 20px; max-width: 1200px; margin: 0 auto; }
        .project-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 20px; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>John Doe</h1>
        <p>Web Developer & Designer</p>
    </section>
    <section class="projects">
        <div class="project-card">
            <h3>Project 1</h3>
            <p>A wonderful project description</p>
        </div>
        <div class="project-card">
            <h3>Project 2</h3>
            <p>Another amazing project</p>
        </div>
    </section>
</body>
</html>`
            },
            {
                id: 'landing-page',
                name: 'Landing Page',
                icon: '🚀',
                description: 'Product landing page with CTA',
                tags: ['landing', 'marketing', 'product'],
                filename: 'index.html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Product Launch</title>
    <style>
        body { font-family: 'Helvetica Neue', sans-serif; margin: 0; }
        .hero { background: #1a1a2e; color: white; text-align: center; padding: 100px 20px; }
        .hero h1 { font-size: 48px; margin-bottom: 20px; }
        .cta-button { background: #e94560; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; }
        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Launch Your Product</h1>
        <p>The best way to showcase your amazing product</p>
        <button class="cta-button">Get Started</button>
    </div>
    <div class="features">
        <div><h3>Fast</h3><p>Lightning fast performance</p></div>
        <div><h3>Secure</h3><p>Enterprise-grade security</p></div>
        <div><h3>Scalable</h3><p>Grows with your needs</p></div>
    </div>
</body>
</html>`
            }
        ];
    }

    getTemplates() {
        return this.templates;
    }

    getTemplate(id) {
        return this.templates.find(t => t.id === id);
    }
}

window.templateLibrary = new TemplateLibrary();
