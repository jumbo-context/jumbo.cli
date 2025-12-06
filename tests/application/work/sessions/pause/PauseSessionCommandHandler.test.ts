/**
 * Tests for PauseSessionCommandHandler
 */

import { PauseSessionCommandHandler } from "../../../../../src/application/work/sessions/pause/PauseSessionCommandHandler";
import { ISessionPausedEventWriter } from "../../../../../src/application/work/sessions/pause/ISessionPausedEventWriter";
import { ISessionPausedEventReader } from "../../../../../src/application/work/sessions/pause/ISessionPausedEventReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { SessionEvent, SessionStarted, SessionPaused } from "../../../../../src/domain/work/sessions/EventIndex";
import { BaseEvent } from "../../../../../src/domain/shared/BaseEvent";
import { IEventHandler } from "../../../../../src/application/shared/messaging/IEventHandler";
import { AppendResult } from "../../../../../src/application/shared/persistence/IEventStore";

// Mock implementations
class MockSessionEventStore implements ISessionPausedEventWriter, ISessionPausedEventReader {
  events: SessionEvent[] = [];

  async append(
    event: BaseEvent & Record<string, any>
  ): Promise<AppendResult> {
    this.events.push(event as SessionEvent);
    return { nextSeq: this.events.length };
  }

  async readStream(streamId: string): Promise<BaseEvent[]> {
    return this.events.filter((e) => e.aggregateId === streamId);
  }
}

class MockEventBus implements IEventBus {
  publishedEvents: BaseEvent[] = [];
  handlers: Map<string, IEventHandler[]> = new Map();

  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    this.publishedEvents.push(event);
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }
}

describe("PauseSessionCommandHandler", () => {
  let eventStore: MockSessionEventStore;
  let eventBus: MockEventBus;
  let handler: PauseSessionCommandHandler;

  beforeEach(() => {
    eventStore = new MockSessionEventStore();
    eventBus = new MockEventBus();
    handler = new PauseSessionCommandHandler(eventStore, eventStore, eventBus);
  });

  it("should pause an active session and return session ID", async () => {
    // Arrange - create a started session
    const startedEvent: SessionStarted = {
      type: "SessionStarted",
      aggregateId: "session_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    };
    eventStore.events.push(startedEvent);

    const command = {
      sessionId: "session_123",
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.sessionId).toBe("session_123");
  });

  it("should persist SessionPaused event to event store", async () => {
    // Arrange - create a started session
    const startedEvent: SessionStarted = {
      type: "SessionStarted",
      aggregateId: "session_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    };
    eventStore.events.push(startedEvent);

    const command = {
      sessionId: "session_123",
    };

    // Act
    await handler.execute(command);

    // Assert
    expect(eventStore.events).toHaveLength(2);
    expect(eventStore.events[1].type).toBe("SessionPaused");
    expect(eventStore.events[1].aggregateId).toBe("session_123");
    expect(eventStore.events[1].version).toBe(2);
  });

  it("should publish SessionPaused event to event bus", async () => {
    // Arrange - create a started session
    const startedEvent: SessionStarted = {
      type: "SessionStarted",
      aggregateId: "session_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    };
    eventStore.events.push(startedEvent);

    const command = {
      sessionId: "session_123",
    };

    // Act
    await handler.execute(command);

    // Assert
    expect(eventBus.publishedEvents).toHaveLength(1);
    expect(eventBus.publishedEvents[0].type).toBe("SessionPaused");
  });

  it("should throw error if session does not exist", async () => {
    // Arrange
    const command = {
      sessionId: "nonexistent_session",
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "No session found with the given ID"
    );
  });

  it("should rehydrate aggregate from event history", async () => {
    // Arrange - create a session with multiple events
    const startedEvent: SessionStarted = {
      type: "SessionStarted",
      aggregateId: "session_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    };
    eventStore.events.push(startedEvent);

    const command = {
      sessionId: "session_123",
    };

    // Act
    await handler.execute(command);

    // Assert - should have read the event history
    const history = await eventStore.readStream("session_123");
    expect(history).toHaveLength(2); // Started + Paused
  });

  it("should be idempotent - can pause already paused session", async () => {
    // Arrange - create a paused session
    const startedEvent: SessionStarted = {
      type: "SessionStarted",
      aggregateId: "session_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {},
    };

    const pausedEvent: SessionPaused = {
      type: "SessionPaused",
      aggregateId: "session_123",
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {},
    };

    eventStore.events.push(startedEvent, pausedEvent);

    const command = {
      sessionId: "session_123",
    };

    // Act
    const result = await handler.execute(command);

    // Assert - should succeed
    expect(result.sessionId).toBe("session_123");
    expect(eventStore.events).toHaveLength(3); // Started + Paused + Paused
    expect(eventStore.events[2].type).toBe("SessionPaused");
    expect(eventStore.events[2].version).toBe(3);
  });
});
