class RenderEngine {
    constructor() {
        this.bindings = new Map();
        this.renderQueue = new Set();
        this.renderScheduled = false;
        this.components = new Map();
    }

    bind(selector, statePath, renderFn) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element not found: ${selector}`);
            return;
        }
        
        const unsubscribe = window.state.subscribe(statePath, (value) => {
            this.scheduleRender(element, renderFn, value);
        });
        
        if (!this.bindings.has(element)) {
            this.bindings.set(element, []);
        }
        
        this.bindings.get(element).push({ statePath, renderFn, unsubscribe });
        
        const initialValue = window.state.get(statePath);
        this.scheduleRender(element, renderFn, initialValue);
    }

    scheduleRender(element, renderFn, value) {
        const key = `${element.id || element.className}-${Date.now()}`;
        this.renderQueue.add({ element, renderFn, value, key });
        
        if (!this.renderScheduled) {
            this.renderScheduled = true;
            requestAnimationFrame(() => this.processQueue());
        }
    }

    processQueue() {
        this.renderQueue.forEach(({ element, renderFn, value }) => {
            try {
                renderFn(element, value);
            } catch (error) {
                console.error('Render error:', error);
            }
        });
        
        this.renderQueue.clear();
        this.renderScheduled = false;
    }

    registerComponent(name, template, statePaths) {
        this.components.set(name, { template, statePaths });
    }

    renderComponent(name, container) {
        const component = this.components.get(name);
        if (!component) return;
        
        const element = document.createElement('div');
        element.innerHTML = component.template;
        container.appendChild(element);
        
        component.statePaths.forEach(({ selector, statePath, renderFn }) => {
            this.bind(selector, statePath, renderFn);
        });
    }

    unbind(element) {
        const bindings = this.bindings.get(element);
        if (bindings) {
            bindings.forEach(({ unsubscribe }) => unsubscribe());
            this.bindings.delete(element);
        }
    }

    unbindAll() {
        this.bindings.forEach((bindings, element) => {
            bindings.forEach(({ unsubscribe }) => unsubscribe());
        });
        this.bindings.clear();
    }
}

window.renderEngine = new RenderEngine();