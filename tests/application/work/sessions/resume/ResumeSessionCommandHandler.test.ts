/**
 * Tests for ResumeSessionCommandHandler
 */

import { ResumeSessionCommandHandler } from "../../../../../src/application/work/sessions/resume/ResumeSessionCommandHandler";
import { ISessionResumedEventWriter } from "../../../../../src/application/work/sessions/resume/ISessionResumedEventWriter";
import { ISessionResumedEventReader } from "../../../../../src/application/work/sessions/resume/ISessionResumedEventReader";
import { IEventBus } from "../../../../../src/application/shared/messaging/IEventBus";
import { SessionEvent, SessionStarted, SessionPaused, SessionResumed } from "../../../../../src/domain/work/sessions/EventIndex";
import { BaseEvent } from "../../../../../src/domain/shared/BaseEvent";
import { IEventHandler } from "../../../../../src/application/shared/messaging/IEventHandler";
import { AppendResult } from "../../../../../src/application/shared/persistence/IEventStore";

// Mock implementations
class MockSessionEventStore implements ISessionResumedEventWriter, ISessionResumedEventReader {
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

describe("ResumeSessionCommandHandler", () => {
  let eventStore: MockSessionEventStore;
  let eventBus: MockEventBus;
  let handler: ResumeSessionCommandHandler;

  beforeEach(() => {
    eventStore = new MockSessionEventStore();
    eventBus = new MockEventBus();
    handler = new ResumeSessionCommandHandler(eventStore, eventStore, eventBus);
  });

  it("should resume a paused session and return session ID", async () => {
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

    // Assert
    expect(result.sessionId).toBe("session_123");
  });

  it("should persist SessionResumed event to event store", async () => {
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
    await handler.execute(command);

    // Assert
    expect(eventStore.events).toHaveLength(3);
    expect(eventStore.events[2].type).toBe("SessionResumed");
    expect(eventStore.events[2].aggregateId).toBe("session_123");
    expect(eventStore.events[2].version).toBe(3);
  });

  it("should publish SessionResumed event to event bus", async () => {
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
    await handler.execute(command);

    // Assert
    expect(eventBus.publishedEvents).toHaveLength(1);
    expect(eventBus.publishedEvents[0].type).toBe("SessionResumed");
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
    await handler.execute(command);

    // Assert - should have read the event history
    const history = await eventStore.readStream("session_123");
    expect(history).toHaveLength(3); // Started + Paused + Resumed
  });

  it("should be idempotent - can resume already active session", async () => {
    // Arrange - create an active session
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

    // Assert - should succeed
    expect(result.sessionId).toBe("session_123");
    expect(eventStore.events).toHaveLength(2); // Started + Resumed
    expect(eventStore.events[1].type).toBe("SessionResumed");
    expect(eventStore.events[1].version).toBe(2);
  });
});
