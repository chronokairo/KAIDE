/**
 * EventBus - A simple event bus for decoupled communication
 */

export type EventType = string;

export interface BusEvent {
  type: EventType;
  data?: any;
  timestamp: Date;
  sourceId?: string;
}

export type EventCallback = (event: BusEvent) => void | Promise<void>;

class EventBusInstance {
  private listeners: Map<EventType, EventCallback[]> = new Map();
  private sourceId: string;

  constructor(sourceId: string) {
    this.sourceId = sourceId;
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to an event type, one-time only
   */
  once(eventType: EventType, callback: EventCallback): () => void {
    const unsubscribe = this.on(eventType, async (event) => {
      try {
        await callback(event);
      } finally {
        unsubscribe();
      }
    });
    return unsubscribe;
  }

  /**
   * Emit an event
   */
  async emit(eventType: EventType, data?: any): Promise<void> {
    const callbacks = this.listeners.get(eventType);
    if (!callbacks || callbacks.length === 0) {
      return;
    }

    const event: BusEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
      sourceId: this.sourceId,
    };

    // Execute all callbacks in parallel
    await Promise.all(callbacks.map(callback => Promise.resolve(callback(event))));
  }

  /**
   * Remove all listeners for an event type or all events
   */
  removeAll(eventType?: EventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.length ?? 0;
  }
}

// Global event bus instance registry
const eventBusInstances = new Map<string, EventBusInstance>();

/**
 * Get or create an event bus instance for a given source
 */
export function getEventBus(sourceId: string = 'default'): EventBusInstance {
  if (!eventBusInstances.has(sourceId)) {
    eventBusInstances.set(sourceId, new EventBusInstance(sourceId));
  }
  return eventBusInstances.get(sourceId)!;
}

/**
 * Export the EventBus class for direct instantiation if needed
 */
export { EventBusInstance as EventBus };
