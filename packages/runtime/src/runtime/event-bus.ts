import type { EventRegistry, IkiraroEvent } from "./types";
/**
 * EventBus owns the typed pub/sub mechanics for the Ikiraro runtime.
 *
 * IkiraroRuntime composes one and delegates subscribe/emit through it,
 * keeping the bus testable in isolation from plugin lifecycle.
 */
export class EventBus {
  private handlers: Map<string, Set<(event: IkiraroEvent<any>) => void>> = new Map();
  emit<K extends keyof EventRegistry>(event: IkiraroEvent<K>): void {
    this.handlers.get(event.type as string)?.forEach((h) => h(event));
    this.handlers.get("*")?.forEach((h) => h(event));
  }
  on<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void {
    const typeStr = type as string;
    const set = this.handlers.get(typeStr) ?? new Set();
    set.add(handler as (event: IkiraroEvent<any>) => void);
    this.handlers.set(typeStr, set);
    return () => {
      this.handlers.get(typeStr)?.delete(handler as (event: IkiraroEvent<any>) => void);
    };
  }
  onAll(handler: (event: IkiraroEvent<any>) => void): () => void {
    const set = this.handlers.get("*") ?? new Set();
    set.add(handler);
    this.handlers.set("*", set);
    return () => {
      this.handlers.get("*")?.delete(handler);
    };
  }
}
