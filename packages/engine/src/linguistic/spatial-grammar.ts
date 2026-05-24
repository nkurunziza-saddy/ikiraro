import { type SpatialMemory, type Point3D } from "../types";

export class EpisodicSpatialMemory {
  private memory: SpatialMemory = {
    self: { x: 0, y: -0.35, z: 0.1 }, // Default center chest
    entities: new Map(),
    createdAt: new Map(),
  };

  private ttlMs = 5 * 60 * 1000; // 5 minutes TTL

  // Available slots for referents
  private slots: Point3D[] = [
    { x: -0.6, y: 0.2, z: 0.3 }, // Left front
    { x: 0.6, y: 0.2, z: 0.3 }, // Right front
    { x: -0.8, y: 0, z: 0 }, // Far left
    { x: 0.8, y: 0, z: 0 }, // Far right
  ];

  private currentSlotIndex = 0;

  public reset() {
    this.memory.entities.clear();
    this.memory.createdAt.clear();
    this.currentSlotIndex = 0;
  }

  private cleanDecayed() {
    const now = Date.now();
    for (const [key, timestamp] of this.memory.createdAt.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.memory.entities.delete(key);
        this.memory.createdAt.delete(key);
      }
    }
  }

  public assignEntity(key: string): Point3D {
    this.cleanDecayed();

    const normalizedKey = key.toUpperCase();

    // Check if it already exists
    if (this.memory.entities.has(normalizedKey)) {
      this.memory.createdAt.set(normalizedKey, Date.now());
      return this.memory.entities.get(normalizedKey)!;
    }

    // Special cases
    if (["I", "ME", "MY", "SELF"].includes(normalizedKey)) {
      return this.memory.self;
    }

    // Temporal mapping
    if (normalizedKey === "PAST" || normalizedKey === "YESTERDAY") {
      return { x: 0, y: 0.5, z: -0.5 }; // Over shoulder
    }
    if (normalizedKey === "FUTURE" || normalizedKey === "TOMORROW") {
      return { x: 0, y: 0, z: 0.8 }; // Forward
    }

    // Assign generic slot
    const slot = this.slots[this.currentSlotIndex % this.slots.length]!;
    this.memory.entities.set(normalizedKey, slot);
    this.memory.createdAt.set(normalizedKey, Date.now());
    this.currentSlotIndex++;

    return slot;
  }

  public getAnchor(key?: string): Point3D | undefined {
    if (!key) return undefined;
    this.cleanDecayed();
    const normalizedKey = key.toUpperCase();
    if (["I", "ME", "MY", "SELF"].includes(normalizedKey)) {
      return this.memory.self;
    }
    const anchor = this.memory.entities.get(normalizedKey);
    if (anchor) {
      this.memory.createdAt.set(normalizedKey, Date.now());
      return anchor;
    }
    return undefined;
  }
}
