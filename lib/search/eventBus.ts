import type { SearchTriggerEvent } from "@/lib/search/types";

type Listener = (event: SearchTriggerEvent) => void;

export function createSearchEventBus() {
  const listeners = new Set<Listener>();

  const publish = (event: SearchTriggerEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { publish, subscribe };
}

export type SearchEventBus = ReturnType<typeof createSearchEventBus>;
