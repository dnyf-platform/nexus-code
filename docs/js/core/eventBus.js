class EventBus {
    constructor() {
        this.events = {};
        this.onceEvents = {};
    }

    on(event, callback, priority = 0) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push({ callback, priority });
        this.events[event].sort((a, b) => b.priority - a.priority);
        
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        
        if (!this.onceEvents[event]) {
            this.onceEvents[event] = [];
        }
        
        this.onceEvents[event].push(wrapper);
        return this.on(event, wrapper);
    }

    emit(event, ...args) {
        const callbacks = this.events[event] || [];
        callbacks.forEach(({ callback }) => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }

    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(
            ({ callback: cb }) => cb !== callback
        );
        
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }

    removeAll(event) {
        if (event) {
            delete this.events[event];
            delete this.onceEvents[event];
        } else {
            this.events = {};
            this.onceEvents = {};
        }
    }

    listenerCount(event) {
        return (this.events[event] || []).length;
    }
}

window.eventBus = new EventBus();