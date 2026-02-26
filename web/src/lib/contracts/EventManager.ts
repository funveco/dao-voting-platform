/**
 * EventManager - Real-time Event System
 *
 * Manages contract event listeners and broadcasts changes to UI hooks.
 * Enables real-time updates without manual polling.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.2.2: Real-time Updates & WebSocket Integration
 */

import * as ethers from "ethers";

/**
 * Event types emitted by the system
 */
export enum EventType {
  // Proposal events
  PROPOSAL_CREATED = "proposal:created",
  PROPOSAL_UPDATED = "proposal:updated",
  PROPOSAL_EXECUTED = "proposal:executed",
  
  // Voting events
  VOTE_CAST = "vote:cast",
  VOTE_POWER_CHANGED = "vote:power_changed",
  
  // Cache events
  CACHE_INVALIDATED = "cache:invalidated",
}

/**
 * Event payload structure
 */
export interface EventPayload {
  type: EventType;
  proposalId?: bigint;
  userAddress?: string;
  timestamp: number;
  data?: any;
}

/**
 * Event listener callback
 */
type EventListener = (payload: EventPayload) => void;

/**
 * EventManager class
 * Uses Observer pattern for loose coupling between contracts and UI
 */
export class EventManager {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private eventHistory: EventPayload[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    // Initialize event listener maps
    Object.values(EventType).forEach((eventType) => {
      this.listeners.set(eventType, new Set());
    });
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, listener: EventListener): () => void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
    }

    // Return unsubscribe function
    return () => {
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Subscribe to event once
   */
  once(eventType: EventType, listener: EventListener): void {
    const wrappedListener = (payload: EventPayload) => {
      listener(payload);
      this.off(eventType, wrappedListener);
    };
    this.on(eventType, wrappedListener);
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: EventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventType: EventType, data?: any, proposalId?: bigint, userAddress?: string): void {
    const payload: EventPayload = {
      type: eventType,
      proposalId,
      userAddress,
      timestamp: Date.now(),
      data,
    };

    // Add to history
    this.eventHistory.push(payload);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify all listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error in event listener for ${eventType}:`, err);
        }
      });
    }
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(count: number = 10): EventPayload[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

/**
 * Global event manager singleton
 */
let eventManagerInstance: EventManager | null = null;

/**
 * Get or create global event manager
 */
export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = new EventManager();
  }
  return eventManagerInstance;
}

/**
 * Reset event manager (for testing)
 */
export function resetEventManager(): void {
  eventManagerInstance = null;
}
