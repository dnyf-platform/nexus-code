// ============================================
// Terminal Clipboard Manager
// Copy/paste functionality
// ============================================

class TerminalClipboard {
    constructor() {
        this.toast = document.getElementById('toast');
    }

    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('📋 Copied!');
            return true;
        } catch (e) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showToast('📋 Copied!');
                return true;
            } catch (err) {
                this.showToast('⚠ Copy failed');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (e) {
            this.showToast('⚠ Paste failed');
            return '';
        }
    }

    copyAll(output) {
        const text = output.innerText || output.textContent;
        this.copy(text);
    }

    showToast(message) {
        if (!this.toast) return;
        this.toast.textContent = message;
        this.toast.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toast.classList.remove('show');
        }, 2000);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalClipboard;
}
