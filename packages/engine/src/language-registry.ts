import type { SignLanguagePlugin } from "./types";

class LanguageRegistryImpl {
  private plugins = new Map<string, SignLanguagePlugin>();
  private activePluginId: string | null = null;

  register(plugin: SignLanguagePlugin) {
    this.plugins.set(plugin.id, plugin);
    if (!this.activePluginId) {
      this.activePluginId = plugin.id;
    }
  }

  setActive(id: string) {
    if (!this.plugins.has(id)) {
      throw new Error(`Language plugin '${id}' not registered.`);
    }
    this.activePluginId = id;
  }

  getActive(): SignLanguagePlugin {
    if (!this.activePluginId || !this.plugins.has(this.activePluginId)) {
      throw new Error("No active sign language plugin found. Did you forget to register one?");
    }
    return this.plugins.get(this.activePluginId)!;
  }

  getPlugin(id: string): SignLanguagePlugin | undefined {
    return this.plugins.get(id);
  }
}

export const LanguageRegistry = new LanguageRegistryImpl();
