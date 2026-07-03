// ============================================
// NexusCode Terminal - App Entry Point
// ============================================

(function() {
    'use strict';
    
    console.log('🟢 Starting NexusCode Terminal v3.0...');
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        try {
            // Create terminal instance
            const terminal = new TerminalEngine();
            
            // Expose for debugging
            window.terminal = terminal;
            
            // Handle resize
            window.addEventListener('resize', () => {
                terminal.ui.scrollToBottom();
            });
            
            // Handle online/offline
            window.addEventListener('online', () => {
                document.getElementById('status-conn').textContent = '● Online';
                document.getElementById('status-conn').style.color = '#0c0';
            });
            
            window.addEventListener('offline', () => {
                document.getElementById('status-conn').textContent = '○ Offline';
                document.getElementById('status-conn').style.color = '#f44';
            });
            
            console.log('✅ Terminal ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize terminal:', error);
            document.body.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d0d;color:#f44;font-family:monospace;text-align:center;padding:20px;">
                    <div>
                        <h1>⚠ Terminal Error</h1>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#f44;color:white;border:none;border-radius:6px;cursor:pointer;">
                            🔄 Reload
                        </button>
                    </div>
                </div>
            `;
        }
    }
})();
