/**
 * Global debounce manager that automatically flushes all pending operations
 * when the user leaves the page or closes the browser tab.
 */

export interface PendingOperation {
  id: string;
  flush: () => void;
}

class DebounceManager {
  private operations = new Map<string, PendingOperation>();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupBeforeUnload();
      this.initialized = true;
    }
  }

  private setupBeforeUnload() {
    window.addEventListener("beforeunload", () => {
      this.flushAll();
    });

    // Also flush on visibility change (tab switch)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.flushAll();
      }
    });
  }

  register(operation: PendingOperation) {
    this.operations.set(operation.id, operation);
  }

  unregister(id: string) {
    this.operations.delete(id);
  }

  flushAll() {
    for (const operation of this.operations.values()) {
      try {
        operation.flush();
      } catch (error) {
        console.error("Error flushing debounced operation:", error);
      }
    }
    this.operations.clear();
  }

  flush(id: string) {
    const operation = this.operations.get(id);
    if (operation) {
      operation.flush();
      this.operations.delete(id);
    }
  }
}

export const debounceManager = new DebounceManager();

