/**
 * A standard interface for any resource that needs explicit cleanup.
 */
export interface IDisposable {
  dispose(): void | Promise<void>;
}

/**
 * The ResourceRegistry is a centralized manager for heavy system resources.
 * It tracks Web Workers, AudioContexts, and other IDisposable objects
 * to guarantee their cleanup when the runtime stops.
 */
export class ResourceRegistry {
  private resources = new Set<IDisposable>();

  /**
   * Registers a resource to be tracked for disposal.
   * Returns a function to manually unregister and dispose the resource.
   */
  register<T extends IDisposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  /**
   * Removes a resource from tracking without disposing it.
   */
  unregister(resource: IDisposable): void {
    this.resources.delete(resource);
  }

  /**
   * Disposes all registered resources in reverse order of registration.
   */
  async disposeAll(): Promise<void> {
    const items = Array.from(this.resources).reverse();
    for (const item of items) {
      try {
        await item.dispose();
      } catch (err) {
        console.error("Resource disposal failed:", err);
      }
    }
    this.resources.clear();
  }
}

export const globalResourceRegistry = new ResourceRegistry();
