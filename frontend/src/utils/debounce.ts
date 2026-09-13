import React from "react";
import { debounceManager } from "./debounceManager";

/**
 * Creates a debounced version of a function that groups multiple rapid calls
 * and executes them once after the specified delay.
 *
 * Supports manual flushing for immediate execution and cleanup.
 */

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush: () => void;
  cancel: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
      }
      timeoutId = null;
      lastArgs = null;
    }, delayMs);
  };

  debouncedFn.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return debouncedFn as DebouncedFunction<T>;
}

/**
 * Hook for managing debounced async operations.
 * Updates local state immediately, but debounces the API call.
 * Automatically flushes on component unmount or page unload.
 */
export function useDebounce<T>(
  asyncFn: (value: T) => Promise<void>,
  delayMs: number = 500,
  operationId?: string
) {
  const debouncedAsync = React.useMemo(
    () => debounce(asyncFn, delayMs),
    [asyncFn, delayMs]
  );

  const opId = operationId || `debounce-${Math.random()}`;

  React.useEffect(() => {
    // Register with global manager
    debounceManager.register({
      id: opId,
      flush: () => debouncedAsync.flush(),
    });

    // Unregister and flush on component unmount
    return () => {
      debouncedAsync.flush();
      debounceManager.unregister(opId);
    };
  }, [debouncedAsync, opId]);

  return debouncedAsync;
}




